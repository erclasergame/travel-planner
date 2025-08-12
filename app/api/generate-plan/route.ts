import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action } = body;

    let prompt = '';
    
    if (action === 'generate') {
      prompt = `Crea un itinerario di viaggio completo per:
- Partenza: ${tripData.from}
- Destinazione: ${tripData.to}
- Durata: ${tripData.duration}
- Persone: ${tripData.people}
- Tipo: ${tripData.description}

Rispondi SOLO con JSON valido in questo formato:
[{"day": 1, "movements": [{"from": "...", "to": "...", "activities": [{"description": "...", "time": "09:00-11:00"}]}]}]

Includi almeno 5-7 attività per giorno con orari realistici, pranzi, cene e pause. Sii specifico con luoghi e orari.`;
    
    } else if (action === 'enhance') {
      prompt = `Arricchisci questo itinerario con dettagli specifici, ristoranti reali, costi stimati e informazioni pratiche:
${JSON.stringify(travelPlan)}

Rispondi SOLO con JSON nello stesso formato ma molto più dettagliato con nomi di luoghi specifici, ristoranti consigliati e costi approssimativi.`;
    
    } else if (action === 'process') {
      prompt = `Elabora questo piano manuale aggiungendo orari dettagliati, pasti se mancanti, e riempiendo spazi vuoti con attività o tempo libero:
${JSON.stringify(travelPlan)}

Contesto: viaggio da ${tripData.from} a ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.

Rispondi SOLO con JSON nello stesso formato ma completo e logicamente organizzato.`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Travel Planner'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Pulizia del JSON
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    content = content.replace(/^[^[{]*/, "").replace(/[^}\]]*$/, "");
    
    return NextResponse.json({ content });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: `Errore nella generazione del piano: ${error.message}` },
      { status: 500 }
    );
  }
}