import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action, selectedModel, customPrompt } = body;

    // 🔧 MODELLI CON FALLBACK AUTOMATICO
    const modelsToTry = [
      selectedModel || 'google/gemma-2-9b-it:free',
      'google/gemma-2-9b-it:free',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];

    let prompt = '';
    
    if (customPrompt) {
      prompt = customPrompt;
    } else {
      if (action === 'generate') {
        prompt = `Crea un itinerario di viaggio per:
- Da: ${tripData.from} a ${tripData.to}
- Durata: ${tripData.duration}
- Persone: ${tripData.people}
- Tipo: ${tripData.description}

Rispondi SOLO con questo JSON (no testo extra):
[{"day":1,"movements":[{"from":"partenza","to":"arrivo","transport":"mezzo","activities":[{"description":"cosa fare","time":"09:00-11:00","cost":"€X","alternatives":["alt1"],"notes":"info utili"}]}]}]

SOLO JSON.`;
      
      } else if (action === 'enhance') {
        prompt = `Migliora questo itinerario aggiungendo dettagli:
${JSON.stringify(travelPlan)}

Mantieni il formato, migliora solo le descrizioni. SOLO JSON di risposta.`;
      
      } else if (action === 'process') {
        prompt = `Completa questo itinerario:
${JSON.stringify(travelPlan)}

Mantieni le scelte dell'utente, aggiungi solo quello che manca. SOLO JSON di risposta.`;
      }
    }

    let lastError = null;

    // 🔄 PROVA MODELLI IN SEQUENZA
    for (const modelToTry of modelsToTry) {
      try {
        console.log('🚀 Tentativo con modello:', modelToTry);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Travel Planner'
          },
          body: JSON.stringify({
            model: modelToTry,
            messages: [
              {
                role: 'system',
                content: 'Rispondi SOLO con JSON valido. Niente testo aggiuntivo.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.1, // Molto bassa per stabilità
            top_p: 0.9
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid response structure');
        }
        
        let content = data.choices[0].message.content.trim();
        
        // 🧹 PULIZIA RAPIDA
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
        
        // Trova JSON
        const jsonStart = Math.max(content.indexOf('['), content.indexOf('{'));
        if (jsonStart !== -1) {
          content = content.substring(jsonStart);
        }
        
        const jsonEndArray = content.lastIndexOf(']');
        const jsonEndObject = content.lastIndexOf('}');
        const jsonEnd = Math.max(jsonEndArray, jsonEndObject);
        
        if (jsonEnd !== -1) {
          content = content.substring(0, jsonEnd + 1);
        }
        
        // Rimuovi campi extra
        content = content.replace(/,?\s*"timestamp"[^,}]*/g, '');
        content = content.replace(/,?\s*"generated"[^,}]*/g, '');
        content = content.replace(/,(\s*[}\]])/g, '$1');
        
        // 🧪 TEST JSON
        const parsed = JSON.parse(content);
        
        console.log('✅ Successo con modello:', modelToTry);
        
        return NextResponse.json({ 
          success: true,
          content,
          model: modelToTry,
          action: action,
          fallbackUsed: modelToTry !== (selectedModel || 'google/gemma-2-9b-it:free'),
          usage: data.usage || {},
          generatedAt: new Date().toISOString()
        });

      } catch (error) {
        console.warn(`❌ Modello ${modelToTry} fallito:`, error.message);
        lastError = error;
        
        // Se non è l'ultimo modello, prova il prossimo
        if (modelToTry !== modelsToTry[modelsToTry.length - 1]) {
          continue;
        }
      }
    }

    // Se tutti i modelli falliscono
    throw lastError || new Error('Tutti i modelli hanno fallito');

  } catch (error) {
    console.error('❌ API Error finale:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: `Errore con tutti i modelli AI: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}