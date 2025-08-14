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

    // USA SOLO IL MODELLO SELEZIONATO
    const modelToUse = selectedModel || process.env.AI_MODEL || 'google/gemma-2-9b-it:free';

    console.log('🚀🚀🚀 ===== DEBUG START =====');
    console.log('📝 Action:', action);
    console.log('🤖 Model:', modelToUse);
    console.log('📏 Prompt length:', prompt.length);
    console.log('📄 Prompt preview:', prompt.substring(0, 200) + '...');

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
    
    console.log('🔥🔥🔥 ===== RAW AI RESPONSE (COMPLETA) =====');
    console.log('📄 FULL CONTENT:');
    console.log(content);
    console.log('📊 Content length:', content.length);
    console.log('🔥🔥🔥 ===== END RAW RESPONSE =====');
    
    // PHASE 1: Initial cleaning
    let originalContent = content;
    content = content.trim();
    
    console.log('🧹 PHASE 1 - Trim:');
    console.log('Before:', JSON.stringify(originalContent.substring(0, 100)));
    console.log('After:', JSON.stringify(content.substring(0, 100)));
    
    // PHASE 2: Remove markdown
    let beforeMarkdown = content;
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    console.log('🧹 PHASE 2 - Remove markdown:');
    console.log('Before:', beforeMarkdown.substring(0, 200));
    console.log('After:', content.substring(0, 200));
    
    // PHASE 3: Find JSON boundaries
    const jsonStartArray = content.indexOf('[');
    const jsonStartObject = content.indexOf('{');
    
    console.log('🔍 PHASE 3 - JSON boundaries:');
    console.log('Array start position:', jsonStartArray);
    console.log('Object start position:', jsonStartObject);
    
    let jsonStart = -1;
    if (jsonStartArray !== -1 && (jsonStartObject === -1 || jsonStartArray < jsonStartObject)) {
      jsonStart = jsonStartArray;
      console.log('✅ Using array start:', jsonStart);
    } else if (jsonStartObject !== -1) {
      jsonStart = jsonStartObject;
      console.log('✅ Using object start:', jsonStart);
    }
    
    if (jsonStart !== -1) {
      let beforeExtract = content;
      content = content.substring(jsonStart);
      console.log('🔧 Extracted from position', jsonStart);
      console.log('Before extract:', beforeExtract.substring(0, 100));
      console.log('After extract:', content.substring(0, 100));
    }
    
    // PHASE 4: Find end boundaries
    const jsonEndArray = content.lastIndexOf(']');
    const jsonEndObject = content.lastIndexOf('}');
    
    console.log('🔍 PHASE 4 - End boundaries:');
    console.log('Array end position:', jsonEndArray);
    console.log('Object end position:', jsonEndObject);
    
    let jsonEnd = -1;
    if (jsonEndArray !== -1 && jsonEndArray > jsonEndObject) {
      jsonEnd = jsonEndArray;
      console.log('✅ Using array end:', jsonEnd);
    } else if (jsonEndObject !== -1) {
      jsonEnd = jsonEndObject;
      console.log('✅ Using object end:', jsonEnd);
    }
    
    if (jsonEnd !== -1) {
      let beforeTruncate = content;
      content = content.substring(0, jsonEnd + 1);
      console.log('🔧 Truncated to position', jsonEnd + 1);
      console.log('Before truncate length:', beforeTruncate.length);
      console.log('After truncate length:', content.length);
    }
    
    console.log('🧹 FINAL CLEANED CONTENT:');
    console.log(content);
    console.log('📊 Final length:', content.length);
    
    // PHASE 5: JSON Validation
    try {
      console.log('🧪 Testing JSON parse...');
      const parsed = JSON.parse(content);
      console.log('✅ JSON parse successful!');
      console.log('📊 Parsed structure:', Array.isArray(parsed) ? `Array with ${parsed.length} items` : 'Object');
      
      // Detailed validation
      if (Array.isArray(parsed)) {
        console.log('🔍 Array validation:');
        for (let i = 0; i < parsed.length; i++) {
          const day = parsed[i];
          console.log(`Day ${i}:`, {
            hasDay: !!day.day,
            hasMovements: !!day.movements,
            movementsCount: day.movements ? day.movements.length : 0
          });
          
          if (day.movements) {
            day.movements.forEach((movement: any, j: number) => {
              console.log(`  Movement ${j}:`, {
                hasFrom: !!movement.from,
                hasTo: !!movement.to,
                hasActivities: !!movement.activities,
                activitiesCount: movement.activities ? movement.activities.length : 0
              });
            });
          }
        }
      }
      
    } catch (parseError) {
      console.error('❌❌❌ JSON PARSE ERROR:');
      console.error('Error message:', parseError.message);
      console.error('Error name:', parseError.name);
      console.error('Error stack:', parseError.stack);
      
      console.log('🔍 CONTENT ANALYSIS:');
      console.log('First 500 chars:', content.substring(0, 500));
      console.log('Last 500 chars:', content.substring(Math.max(0, content.length - 500)));
      
      // Character analysis
      const invalidChars = [];
      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const code = char.charCodeAt(0);
        if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
          invalidChars.push({ char, code, position: i });
        }
      }
      
      if (invalidChars.length > 0) {
        console.log('🚨 Invalid characters found:', invalidChars.slice(0, 10));
      }
      
      // Try to find the exact error position
      if (parseError.message.includes('position')) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          console.log(`🎯 Error at position ${pos}:`);
          console.log('Context:', content.substring(Math.max(0, pos - 50), pos + 50));
          console.log('Character at error:', JSON.stringify(content[pos]));
        }
      }
      
      throw new Error(`Invalid JSON from AI model ${modelToUse}. Parse error: ${parseError.message}. Content preview: ${content.substring(0, 500)}`);
    }
    
    console.log('🚀🚀🚀 ===== DEBUG END =====');
    
    return NextResponse.json({ 
      success: true,
      content,
      model: modelToUse,
      action: action,
      usage: data.usage || {},
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FINAL API ERROR:', error);
    console.error('Error details:', {
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