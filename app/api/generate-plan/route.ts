import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action } = body;

    let prompt = '';
    
    if (action === 'generate') {
      prompt = `Sei un esperto travel planner con conoscenza dettagliata di luoghi, tempi e logistica. Crea un itinerario di viaggio REALISTICO e DETTAGLIATO per:

DESTINAZIONE: Da ${tripData.from} a ${tripData.to}
DURATA: ${tripData.duration}
PERSONE: ${tripData.people}
TIPO VIAGGIO: ${tripData.description}

ISTRUZIONI SPECIFICHE:
1. RICERCA ATTIVITÀ REALI: Include nomi specifici di musei, ristoranti, attrazioni che esistono davvero
2. TEMPI REALISTICI: Calcola tempi effettivi (30min museo, 1h ristorante, 15min a piedi tra luoghi vicini)
3. LOGISTICA INTELLIGENTE: Raggruppa attività per zona geografica, considera distanze e trasporti
4. ORARI PRATICI: Rispetta orari di apertura, evita sovrapposizioni impossibili
5. ALTERNATIVE: Per ogni attività principale, suggerisci 1-2 alternative simili
6. DETTAGLI UTILI: Includi costi approssimativi, consigli pratici, note speciali

FORMATO JSON RICHIESTO:
[
  {
    "day": 1,
    "movements": [
      {
        "from": "Stazione/Hotel specifico",
        "to": "Zona/Quartiere specifico",
        "transport": "metro/a piedi/taxi (tempo stimato)",
        "activities": [
          {
            "time": "09:00-10:30",
            "description": "Colosseo - Visita con audioguida (€16, prenota online)",
            "type": "cultura",
            "duration": "1h 30min",
            "cost": "€16",
            "alternatives": ["Fori Romani", "Palatino"],
            "notes": "Evita code: prenota skip-the-line",
            "editable": true
          },
          {
            "time": "11:00-12:00",
            "description": "Passeggiata verso Fontana di Trevi (20min a piedi)",
            "type": "spostamento",
            "duration": "20min",
            "cost": "gratis",
            "alternatives": ["Metro linea B", "Taxi"],
            "notes": "Strada panoramica consigliata",
            "editable": true
          },
          {
            "time": "12:30-14:00",
            "description": "Pranzo da Armando al Pantheon - Cucina romana tradizionale (€35/persona)",
            "type": "ristorazione",
            "duration": "1h 30min",
            "cost": "€35/persona",
            "alternatives": ["Checchino dal 1887", "Da Enzo al 29"],
            "notes": "Prenota: molto frequentato",
            "editable": true
          }
        ]
      }
    ]
  }
]

ESEMPI DI ATTIVITÀ SPECIFICHE PER TIPO:
- CULTURA: Nome museo/monumento + orari + costo + tempo visita
- RISTORAZIONE: Nome ristorante + tipo cucina + fascia prezzo + atmosfera  
- SHOPPING: Via/zona + tipo negozi + budget + tempo necessario
- NATURA: Parco/giardino + attività possibili + stagionalità
- TRASPORTI: Mezzo specifico + tempo + costo + frequenza

CREA ALMENO 6-8 ATTIVITÀ PER GIORNO con orari dalle 9:00 alle 22:00.
INCLUDI: colazione, pranzo, cena, pause, spostamenti.
SII SPECIFICO: nomi reali, indirizzi approssimativi, prezzi realistici.

Rispondi SOLO con il JSON, niente altro testo.`;
    
    } else if (action === 'enhance') {
      prompt = `Sei un travel planner esperto. MIGLIORA questo itinerario esistente aggiungendo dettagli specifici, informazioni pratiche e alternative reali:

ITINERARIO ATTUALE:
${JSON.stringify(travelPlan, null, 2)}

CONTESTO VIAGGIO:
- Da: ${tripData.from}
- A: ${tripData.to}  
- Durata: ${tripData.duration}
- Persone: ${tripData.people}
- Tipo: ${tripData.description}

MIGLIORAMENTI DA APPLICARE:
1. SOSTITUISCI attività generiche con NOMI SPECIFICI reali
2. AGGIUNGI informazioni pratiche: costi, orari apertura, come arrivare
3. CALCOLA tempi realistici per ogni attività
4. PROPONI 2-3 alternative per ogni attività principale
5. INCLUDI consigli pratici e note utili
6. OTTIMIZZA la logistica (distanze, trasporti)
7. AGGIUNGI dettagli su prenotazioni, code, stagionalità

REGOLE PER IL MIGLIORAMENTO:
- MANTIENI la struttura giorni/movements esistente
- RISPETTA le modifiche dell'utente se presenti
- ARRICCHISCI ogni attività con dettagli pratici
- AGGIUNGI alternative concrete e specifiche
- CALCOLA costi totali realistici

ESEMPIO DI MIGLIORAMENTO:
DA: "Visita museo" 
A: "Museo del Louvre - Capolavori essenziali (€17, 2h, prenota online), Alternative: Musée d'Orsay, Centre Pompidou"

Rispondi con lo stesso formato JSON ma molto più dettagliato e specifico.`;
    
    } else if (action === 'process') {
      prompt = `Sei un travel planner esperto. ELABORA questo piano manuale dell'utente trasformandolo in un itinerario completo e professionale:

PIANO UTENTE:
${JSON.stringify(travelPlan, null, 2)}

CONTESTO:
- Viaggio: ${tripData.from} → ${tripData.to}
- Durata: ${tripData.duration}
- Persone: ${tripData.people}
- Tipo: ${tripData.description}

COMPITI:
1. COMPLETA gli orari mancanti con tempi realistici
2. AGGIUNGI pasti se non presenti (colazione, pranzo, cena)
3. RIEMPI spazi vuoti con attività pertinenti o "tempo libero"
4. TRASFORMA descrizioni generiche in attività specifiche
5. AGGIUNGI informazioni pratiche (costi, durata, trasporti)
6. PROPONI alternative per ogni attività
7. OTTIMIZZA la sequenza logistica

REGOLE FONDAMENTALI:
- RISPETTA SEMPRE le scelte specifiche dell'utente
- NON modificare attività già dettagliate dall'utente
- MANTIENI l'ordine e la struttura voluta dall'utente
- AGGIUNGI solo dove mancano informazioni
- SUGGERISCI alternative senza sostituire le scelte utente

ESEMPIO:
Se l'utente ha scritto "Colosseo ore 10", mantieni "Colosseo" ma aggiungi: 
"Colosseo - Visita con audioguida (€16, 1h30min, prenota skip-the-line)"

Se ha uno spazio vuoto dalle 14:00-16:00, proponi attività coerenti con la zona e il tipo di viaggio.

Restituisci il JSON nello stesso formato, ma arricchito e completato rispettando le scelte dell'utente.`;
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
        model: process.env.AI_MODEL || 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 6000, // Aumentato per più dettagli
        temperature: 0.8, // Più creatività per alternative
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Pulizia più robusta del JSON
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