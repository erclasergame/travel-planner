import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action, selectedModel } = body;

    let prompt = '';
    
    if (action === 'generate') {
      prompt = `Crea un itinerario di viaggio dettagliato per:
- Da: ${tripData.from}
- A: ${tripData.to}
- Durata: ${tripData.duration}
- Persone: ${tripData.people}
- Descrizione: ${tripData.description}

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

Rispondi SOLO con JSON nello stesso formato ma molto più dettagliato.`;
    
    } else if (action === 'process') {
      prompt = `Elabora questo piano manuale aggiungendo orari dettagliati, pasti se mancanti, e riempiendo spazi vuoti:
${JSON.stringify(travelPlan)}

Contesto: ${tripData.from} → ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.

Mantieni le scelte dell'utente e completa solo quello che manca. Rispondi SOLO con JSON completo.`;
    }

    // Usa il modello selezionato dall'utente o fallback
    const modelToUse = selectedModel || process.env.AI_MODEL || 'google/gemma-2-9b-it:free';

    console.log('Using AI model:', modelToUse);
    console.log('Prompt length:', prompt.length);

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    console.log('Raw AI response:', content.substring(0, 200) + '...');
    
    // Pulizia del JSON
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    content = content.replace(/^[^[{]*/, "").replace(/[^}\]]*$/, "");
    
    // Verifica che sia JSON valido
    try {
      const parsed = JSON.parse(content);
      console.log('JSON validation successful, items:', parsed.length);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Content causing error:', content);
      throw new Error(`Invalid JSON from AI model ${modelToUse}: ${parseError.message}`);
    }
    
    return NextResponse.json({ 
      content,
      model: modelToUse,
      usage: data.usage
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: `Errore con modello AI: ${error.message}` },
      { status: 500 }
    );
  }
}