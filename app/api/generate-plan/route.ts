import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action, selectedModel, customPrompt } = body;

    let prompt = '';
    
    if (customPrompt) {
      prompt = customPrompt;
    } else {
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

Rispondi SOLO con JSON valido nel formato esatto seguente, NIENT'ALTRO:
[
  {
    "day": 1,
    "movements": [
      {
        "from": "luogo partenza",
        "to": "luogo arrivo",
        "transport": "mezzo di trasporto",
        "activities": [
          {
            "description": "attività dettagliata",
            "time": "09:00-11:00",
            "cost": "€20",
            "alternatives": ["alt1", "alt2"],
            "notes": "note utili"
          }
        ]
      }
    ]
  }
]

SOLO JSON VALIDO, NO TESTO AGGIUNTIVO.`;
      
      } else if (action === 'enhance') {
        prompt = `Arricchisci questo itinerario con dettagli specifici:
${JSON.stringify(travelPlan)}

Contesto: ${tripData.from} → ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.

IMPORTANTE:
- Mantieni la struttura esistente
- Migliora solo descrizioni, orari e dettagli pratici  
- Massimo 1 pausa food per giorno
- Focus su CULTURA e ESPERIENZE

Rispondi SOLO con JSON valido nel formato originale, NIENT'ALTRO.`;
      
      } else if (action === 'process') {
        prompt = `Elabora questo piano aggiungendo dettagli:
${JSON.stringify(travelPlan)}

Contesto: ${tripData.from} → ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.

IMPORTANTE:
- Mantieni SEMPRE le scelte dell'utente
- Aggiungi solo quello che manca 
- Massimo 1 pasto per giorno
- Focus su ESPERIENZE e LUOGHI

Rispondi SOLO con JSON valido nel formato originale, NIENT'ALTRO.`;
      }
    }

    const modelToUse = selectedModel || process.env.AI_MODEL || 'google/gemma-2-9b-it:free';

    console.log('🚀 Using AI model:', modelToUse);
    console.log('📝 Action:', action);

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
            role: 'system',
            content: 'You are a travel planning assistant. Respond ONLY with valid JSON. Do not add any text, explanations, or formatting outside the JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
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
    
    console.log('📄 Raw AI response preview:', content.substring(0, 300) + '...');
    
    // 🔧 PULIZIA JSON SUPER AGGRESSIVA
    content = content.trim();
    
    // Rimuovi markdown
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    
    // Rimuovi tutto prima del primo [
    const jsonStartArray = content.indexOf('[');
    const jsonStartObject = content.indexOf('{');
    
    let jsonStart = -1;
    if (jsonStartArray !== -1 && (jsonStartObject === -1 || jsonStartArray < jsonStartObject)) {
      jsonStart = jsonStartArray;
    } else if (jsonStartObject !== -1) {
      jsonStart = jsonStartObject;
    }
    
    if (jsonStart !== -1) {
      content = content.substring(jsonStart);
    }
    
    // Rimuovi tutto dopo l'ultimo ] o }
    const jsonEndArray = content.lastIndexOf(']');
    const jsonEndObject = content.lastIndexOf('}');
    
    let jsonEnd = -1;
    if (jsonEndArray !== -1 && jsonEndArray > jsonEndObject) {
      jsonEnd = jsonEndArray;
    } else if (jsonEndObject !== -1) {
      jsonEnd = jsonEndObject;
    }
    
    if (jsonEnd !== -1) {
      content = content.substring(0, jsonEnd + 1);
    }
    
    // 🔧 RIMUOVI TIMESTAMP E ALTRI CAMPI EXTRA
    content = content.replace(/,?\s*"timestamp":\s*"[^"]*"/g, '');
    content = content.replace(/,?\s*"generated":\s*"[^"]*"/g, '');
    content = content.replace(/,?\s*"model":\s*"[^"]*"/g, '');
    
    // Fix virgole trailing
    content = content.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix virgole mancanti
    content = content.replace(/}(\s*{)/g, '},$1');
    content = content.replace(/](\s*{)/g, '],$1');
    
    console.log('🧹 Cleaned content preview:', content.substring(0, 500) + '...');
    
    // Test parsing
    try {
      const parsed = JSON.parse(content);
      console.log('✅ JSON validation successful');
      
      // Validazione struttura
      if (Array.isArray(parsed)) {
        console.log('📊 Array with', parsed.length, 'days');
        
        // Sanity check
        for (let i = 0; i < parsed.length; i++) {
          const day = parsed[i];
          if (!day.day || !day.movements) {
            console.warn(`⚠️ Day ${i} missing required fields`);
          }
        }
      } else {
        console.log('📊 Single object response');
      }
      
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('🔍 Content causing error (first 1000 chars):', content.substring(0, 1000));
      
      // 🔧 ULTIMO TENTATIVO DI RIPARAZIONE
      try {
        // Rimuovi caratteri problematici
        let fixedContent = content
          .replace(/[\x00-\x1F\x7F]/g, '') // Rimuovi caratteri di controllo
          .replace(/\\n/g, ' ')            // Sostituisci \n con spazi
          .replace(/\\"/g, '"')            // Fix escaped quotes
          .replace(/([^\\])\\([^"\\nrt])/g, '$1$2') // Rimuovi backslashes non necessari
          .replace(/,\s*}/g, '}')          // Rimuovi virgole trailing
          .replace(/,\s*]/g, ']')          // Rimuovi virgole trailing
          .replace(/'/g, '"');             // Single quotes to double
          
        // Se ancora fallisce, prova a estrarre solo la prima parte valida
        const firstValidBrace = fixedContent.indexOf('[');
        if (firstValidBrace !== -1) {
          let braceCount = 0;
          let validEnd = -1;
          
          for (let i = firstValidBrace; i < fixedContent.length; i++) {
            if (fixedContent[i] === '[') braceCount++;
            if (fixedContent[i] === ']') {
              braceCount--;
              if (braceCount === 0) {
                validEnd = i;
                break;
              }
            }
          }
          
          if (validEnd !== -1) {
            fixedContent = fixedContent.substring(firstValidBrace, validEnd + 1);
          }
        }
        
        JSON.parse(fixedContent);
        content = fixedContent;
        console.log('🔧 JSON auto-fixed successfully');
        
      } catch (fixError) {
        // Se proprio non riusciamo a ripararlo, restituiamo un errore dettagliato
        console.error('❌ Auto-fix failed:', fixError);
        throw new Error(`Invalid JSON from AI model ${modelToUse}. Original error: ${parseError.message}. Content preview: ${content.substring(0, 500)}`);
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