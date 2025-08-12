import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action, selectedModel, customPrompt } = body;

    let prompt = '';
    
    if (customPrompt) {
      // Usa il prompt personalizzato se fornito
      prompt = customPrompt;
    } else {
      // Genera il prompt standard
      if (action === 'generate') {
        prompt = `Crea un itinerario di viaggio dettagliato per:
- Da: ${tripData.from}
- A: ${tripData.to}
- Durata: ${tripData.duration}
- Persone: ${tripData.people}
- Descrizione: ${tripData.description}

IMPORTANTE:
- Focus su ESPERIENZE e LUOGHI iconici
- Massimo 1 pasto principale per giorno (pranzo O cena)
- Includi orari realistici e costi approssimativi
- Aggiungi trasporti solo se necessari
- Evita troppe pause food, concentrati su cultura e attività

Rispondi SOLO con JSON valido in questo formato:
[
  {
    "day": 1,
    "movements": [
      {
        "from": "luogo partenza",
        "to": "luogo arrivo",
        "transport": "mezzo di trasporto (opzionale)",
        "activities": [
          {
            "description": "attività dettagliata",
            "time": "09:00-11:00",
            "cost": "€20 (opzionale)",
            "alternatives": ["alt1", "alt2"],
            "notes": "note utili (opzionale)"
          }
        ]
      }
    ]
  }
]

Crea un itinerario completo con attività specifiche, orari realistici e dettagli pratici. SOLO JSON.`;
      
      } else if (action === 'enhance') {
        prompt = `Arricchisci questo itinerario con dettagli specifici, ristoranti reali, costi stimati:
${JSON.stringify(travelPlan)}

Contesto viaggio: ${tripData.from} → ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.

IMPORTANTE:
- Mantieni la struttura esistente
- Migliora solo descrizioni, orari e dettagli pratici  
- Massimo 1 pausa food per giorno
- Focus su CULTURA e ESPERIENZE
- Aggiungi costi realistici
- Includi alternative utili

Rispondi SOLO con JSON nello stesso formato ma molto più dettagliato.`;
      
      } else if (action === 'process') {
        prompt = `Elabora questo piano manuale aggiungendo dettagli specifici, orari realistici e riempiendo spazi vuoti:
${JSON.stringify(travelPlan)}

Contesto: ${tripData.from} → ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.

IMPORTANTE:
- Mantieni SEMPRE le scelte dell'utente
- Aggiungi solo quello che manca 
- Massimo 1 pasto principale per giorno (pranzo O cena, non entrambi)
- Focalizzati su ESPERIENZE e LUOGHI piuttosto che cibo
- Includi orari realistici e costi approssimativi
- Aggiungi trasporti solo se necessari

Mantieni le scelte dell'utente e completa solo quello che manca. Rispondi SOLO con JSON completo.`;
      }
    }

    // Usa il modello selezionato dall'utente o fallback
    const modelToUse = selectedModel || process.env.AI_MODEL || 'google/gemma-2-9b-it:free';

    console.log('🚀 Using AI model:', modelToUse);
    console.log('📝 Action:', action);
    console.log('📏 Prompt length:', prompt.length);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Travel Planner'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    console.log('📡 OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response structure from AI model');
    }
    
    let content = data.choices[0].message.content;
    
    console.log('📄 Raw AI response preview:', content.substring(0, 200) + '...');
    
    // Pulizia più robusta del JSON
    content = content.trim();
    
    // Rimuovi markdown code blocks
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    // Rimuovi testo prima del JSON
    const jsonStart = content.indexOf('[');
    const jsonStartAlt = content.indexOf('{');
    
    if (jsonStart !== -1 && (jsonStartAlt === -1 || jsonStart < jsonStartAlt)) {
      content = content.substring(jsonStart);
    } else if (jsonStartAlt !== -1) {
      content = content.substring(jsonStartAlt);
    }
    
    // Rimuovi testo dopo il JSON
    const jsonEnd = content.lastIndexOf(']');
    const jsonEndAlt = content.lastIndexOf('}');
    
    if (jsonEnd !== -1 && jsonEnd > jsonEndAlt) {
      content = content.substring(0, jsonEnd + 1);
    } else if (jsonEndAlt !== -1) {
      content = content.substring(0, jsonEndAlt + 1);
    }
    
    // Verifica che sia JSON valido prima di inviarlo
    try {
      const parsed = JSON.parse(content);
      console.log('✅ JSON validation successful');
      console.log('📊 Items in response:', Array.isArray(parsed) ? parsed.length : 'Object');
      
      // Validazione struttura base
      if (Array.isArray(parsed)) {
        for (let i = 0; i < parsed.length; i++) {
          const day = parsed[i];
          if (!day.day || !day.movements) {
            console.warn(`⚠️ Day ${i} missing required fields:`, day);
          }
        }
      }
      
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('🔍 Content causing error:', content);
      console.error('📊 Content length:', content.length);
      
      // Tentativo di riparazione automatica
      try {
        // Prova a fixare JSON comuni issues
        let fixedContent = content
          .replace(/,\s*}/g, '}')  // Rimuovi virgole trailing
          .replace(/,\s*]/g, ']')  // Rimuovi virgole trailing
          .replace(/'/g, '"');     // Sostituisci single quotes
        
        JSON.parse(fixedContent);
        content = fixedContent;
        console.log('🔧 JSON auto-fixed successfully');
        
      } catch (fixError) {
        throw new Error(`Invalid JSON from AI model ${modelToUse}. Parse error: ${parseError.message}. Content preview: ${content.substring(0, 500)}`);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      content,
      model: modelToUse,
      action: action,
      usage: data.usage || {},
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Logging dettagliato per debug
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: `Errore con modello AI: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}