/*
 * Travel Planner - Generate Plan API Route
 * Version: 2.0.0
 * Last Modified: 2025-08-15
 * Changes: Enhanced prompts for v2.0 format, backward compatibility, metadata support
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action, selectedModel, customPrompt, formatVersion } = body;

    let prompt = '';
    
    // ✅ NUOVO v2.0: Detect if we should use enhanced format
    const useEnhancedFormat = formatVersion === '2.0' || action === 'generate';
    
    console.log('🎯 API v2.0 - Action:', action, 'Format:', useEnhancedFormat ? 'v2.0' : 'legacy');
    
    if (customPrompt) {
      prompt = customPrompt;
    } else {
      if (action === 'generate') {
        // ✅ NUOVO v2.0: Enhanced generation prompt
        prompt = `Crea un itinerario di viaggio dettagliato per:
- Da: ${tripData.from}
- A: ${tripData.to}
- Durata: ${tripData.duration}
- Persone: ${tripData.people}
- Descrizione: ${tripData.description}
${tripData.startDate ? `- Data inizio: ${tripData.startDate}` : ''}

IMPORTANTE - NUOVO FORMATO v2.0:
- Focus su ESPERIENZE e LUOGHI iconici della destinazione
- Massimo 1 pasto principale per giorno (pranzo O cena, non entrambi)
- Includi orari realistici, durate e costi approssimativi
- Aggiungi trasporti solo se necessari per spostamenti significativi
- Evita troppe pause food, concentrati su cultura e attività autentiche
- Assegna TYPE corretto per ogni attività
- Marca come REQUIRED le attività essenziali (alloggi, pasti principali)

RISPOSTA FORMATO JSON v2.0:
{
  "metadata": {
    "id": "${tripData.from?.toLowerCase()}-${tripData.to?.toLowerCase()}-${new Date().getFullYear()}",
    "title": "${tripData.from} → ${tripData.to}",
    "created": "${new Date().toISOString()}",
    "modified": "${new Date().toISOString()}"
  },
  "itinerary": [
    {
      "day": 1,
      "date": "${tripData.startDate ? `Day 1 - ${new Date(tripData.startDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : 'Day 1'}",
      "movements": [
        {
          "from": "luogo partenza specifica",
          "to": "destinazione specifica", 
          "transport": "mezzo trasporto (solo se necessario)",
          "activities": [
            {
              "id": "day1-1",
              "name": "Nome breve attività (max 50 caratteri)",
              "description": "Descrizione dettagliata dell'esperienza",
              "time": "09:00-11:00",
              "duration": "2h",
              "type": "attraction",
              "subtype": null,
              "required": false,
              "cost": "€20-30",
              "alternatives": ["Alternativa 1", "Alternativa 2"],
              "notes": "Consigli pratici e suggerimenti"
            }
          ]
        }
      ]
    }
  ]
}

TIPI DI ATTIVITÀ (type):
- "meal": Pasti, ristoranti, bar, aperitivi
- "accommodation": Hotel, check-in, alloggi
- "attraction": Musei, monumenti, visite culturali
- "shopping": Mercati, negozi, acquisti
- "travel": Trasferimenti significativi, aeroporti
- "activity": Sport, escursioni, eventi, altre attività

SOTTOTIPI PASTI (subtype per type="meal"):
- "breakfast": Colazione
- "lunch": Pranzo  
- "dinner": Cena
- "aperitif": Aperitivo, drink
- "dessert": Gelato, dolci

REQUIRED (true per):
- Alloggi (accommodation)
- Pasti principali (1 per giorno max)
- Trasferimenti essenziali
- Visite iconiche imperdibili

ID FORMAT: "day[numero]-[progressivo]" (es: "day1-1", "day1-2", "day2-1")

DURATA FORMAT: "30m", "1h", "1h30m", "2h", "3h30m"

DATE FORMAT: Se startDate fornito usa "Day X - DD/MM/YYYY", altrimenti "Day X"

Crea un itinerario completo e autentico. RISPONDI SOLO CON IL JSON VALIDO SENZA TESTO AGGIUNTIVO.`;
      
      } else if (action === 'enhance') {
        // ✅ MIGLIORATO v2.0: Enhanced enhancement prompt
        prompt = `Arricchisci questo itinerario aggiungendo dettagli specifici, ristoranti reali e informazioni pratiche:
${JSON.stringify(travelPlan)}

Contesto: ${tripData.from} → ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.
${tripData.startDate ? `Data inizio: ${tripData.startDate}` : ''}

IMPORTANTE - ENHANCEMENT v2.0:
- Mantieni SEMPRE la struttura esistente
- Migliora solo descrizioni, orari, costi e dettagli pratici
- Aggiungi campi mancanti: name, duration, type, subtype, required
- Massimo 1 pasto principale per giorno
- Focus su ESPERIENZE autentiche piuttosto che food turistico
- Includi orari realistici e costi aggiornati
- Aggiungi alternative utili e note pratiche

${useEnhancedFormat ? 
`RISPONDI con formato v2.0 completo:
{
  "metadata": {
    "id": "${tripData.from?.toLowerCase()}-${tripData.to?.toLowerCase()}-enhanced",
    "title": "${tripData.from} → ${tripData.to}",
    "created": "${new Date().toISOString()}",
    "modified": "${new Date().toISOString()}"
  },
  "itinerary": [...]
}` : 
'RISPONDI con lo stesso formato ma molto più dettagliato.'
}

Mantieni le scelte dell'utente e completa solo quello che manca. SOLO JSON VALIDO.`;
      
      } else if (action === 'process') {
        // ✅ MIGLIORATO v2.0: Enhanced processing prompt
        prompt = `Elabora questo piano manuale aggiungendo dettagli specifici, orari realistici e completando spazi vuoti:
${JSON.stringify(travelPlan)}

Contesto: ${tripData.from} → ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.
${tripData.startDate ? `Data inizio: ${tripData.startDate}` : ''}

IMPORTANTE - PROCESSING v2.0:
- Mantieni RELIGIOSAMENTE le scelte dell'utente
- Aggiungi solo quello che manca (orari, durate, tipi, dettagli)
- NON modificare attività già descritte dall'utente
- Massimo 1 pasto principale per giorno (pranzo O cena, mai entrambi)
- Focalizzati su LUOGHI ed ESPERIENZE piuttosto che food
- Includi orari realistici che si incastrino logicamente
- Aggiungi type, subtype, required, duration per ogni attività
- Riempi spazi vuoti con "tempo libero" o pause strategiche

${useEnhancedFormat ? 
`RISPONDI con formato v2.0 completo:
{
  "metadata": {
    "id": "${tripData.from?.toLowerCase()}-${tripData.to?.toLowerCase()}-processed",
    "title": "${tripData.from} → ${tripData.to}",
    "created": "${new Date().toISOString()}",
    "modified": "${new Date().toISOString()}"
  },
  "itinerary": [...]
}

INCLUDI tutti i campi v2.0:
- id: "day[X]-[N]"
- name: Nome breve
- description: Quello dell'utente + dettagli se mancanti
- time: Orari logici e realistici
- duration: "30m", "1h", "2h", etc.
- type: meal/accommodation/attraction/shopping/travel/activity
- subtype: Per meal (breakfast/lunch/dinner/aperitif/dessert)
- required: true per alloggi, pasti principali, visite essenziali
- cost, alternatives, notes: Arricchiti se utili` :
'RISPONDI con JSON nello stesso formato ma molto più completo.'
}

Mantieni le scelte dell'utente e completa solo quello che manca. SOLO JSON VALIDO.`;
      }
    }

    // ✅ INVARIATO: Model selection logic
    const modelToUse = selectedModel || process.env.AI_MODEL || 'google/gemma-2-9b-it:free';

    console.log('🚀🚀🚀 ===== DEBUG START v2.0 =====');
    console.log('🎯 Action:', action);
    console.log('🤖 Model:', modelToUse);
    console.log('📊 Format Version:', formatVersion || 'legacy');
    console.log('📝 Enhanced Format:', useEnhancedFormat);
    console.log('📏 Prompt length:', prompt.length);
    console.log('📄 Prompt preview:', prompt.substring(0, 300) + '...');
    
    // ✅ NUOVO v2.0: Log tripData details for debugging
    console.log('🗂️ TripData:', {
      from: tripData?.from,
      to: tripData?.to,
      duration: tripData?.duration,
      people: tripData?.people,
      hasStartDate: !!tripData?.startDate,
      startDate: tripData?.startDate
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Travel Planner v2.0'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: useEnhancedFormat ? 6000 : 4000, // ✅ NUOVO: More tokens for enhanced format
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
    
    console.log('🔥🔥🔥 ===== RAW AI RESPONSE v2.0 (COMPLETA) =====');
    console.log('📄 FULL CONTENT:');
    console.log(content);
    console.log('📊 Content length:', content.length);
    console.log('🔥🔥🔥 ===== END RAW RESPONSE =====');
    
    // ✅ MIGLIORATO v2.0: Enhanced JSON cleaning with better detection
    let originalContent = content;
    content = content.trim();
    
    console.log('🧹 PHASE 1 - Trim:');
    console.log('Before:', JSON.stringify(originalContent.substring(0, 100)));
    console.log('After:', JSON.stringify(content.substring(0, 100)));
    
    // PHASE 2: Remove markdown with better patterns
    let beforeMarkdown = content;
    content = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/`{1,2}/g, ""); // Remove any remaining backticks
    
    console.log('🧹 PHASE 2 - Remove markdown:');
    console.log('Before:', beforeMarkdown.substring(0, 200));
    console.log('After:', content.substring(0, 200));
    
    // ✅ NUOVO v2.0: Better JSON boundary detection
    const jsonStartBrace = content.indexOf('{');
    const jsonStartArray = content.indexOf('[');
    
    console.log('🔍 PHASE 3 - JSON boundaries:');
    console.log('Object start position:', jsonStartBrace);
    console.log('Array start position:', jsonStartArray);
    
    let jsonStart = -1;
    
    // For v2.0 format, prefer object start (metadata structure)
    if (useEnhancedFormat && jsonStartBrace !== -1) {
      jsonStart = jsonStartBrace;
      console.log('✅ Using object start for v2.0 format:', jsonStart);
    } else if (jsonStartArray !== -1 && (jsonStartBrace === -1 || jsonStartArray < jsonStartBrace)) {
      jsonStart = jsonStartArray;
      console.log('✅ Using array start for legacy format:', jsonStart);
    } else if (jsonStartBrace !== -1) {
      jsonStart = jsonStartBrace;
      console.log('✅ Using object start as fallback:', jsonStart);
    }
    
    if (jsonStart !== -1) {
      let beforeExtract = content;
      content = content.substring(jsonStart);
      console.log('🔧 Extracted from position', jsonStart);
      console.log('Before extract:', beforeExtract.substring(0, 100));
      console.log('After extract:', content.substring(0, 100));
    }
    
    // PHASE 4: Find end boundaries with better logic
    let jsonEnd = -1;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    
    // ✅ NUOVO v2.0: Proper JSON parsing to find end
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        
        // Found complete JSON structure
        if (braceCount === 0 && bracketCount === 0 && (char === '}' || char === ']')) {
          jsonEnd = i;
          break;
        }
      }
    }
    
    console.log('🔍 PHASE 4 - Smart end detection:');
    console.log('Final brace count:', braceCount);
    console.log('Final bracket count:', bracketCount);
    console.log('Detected end position:', jsonEnd);
    
    if (jsonEnd !== -1) {
      let beforeTruncate = content;
      content = content.substring(0, jsonEnd + 1);
      console.log('🔧 Truncated to position', jsonEnd + 1);
      console.log('Before truncate length:', beforeTruncate.length);
      console.log('After truncate length:', content.length);
    }
    
    console.log('🧹 FINAL CLEANED CONTENT v2.0:');
    console.log(content);
    console.log('📊 Final length:', content.length);
    
    // ✅ MIGLIORATO v2.0: Enhanced JSON validation with format detection
    try {
      console.log('🧪 Testing JSON parse...');
      const parsed = JSON.parse(content);
      console.log('✅ JSON parse successful!');
      
      // ✅ NUOVO v2.0: Detect and validate format version
      const isEnhancedFormat = parsed.metadata && parsed.itinerary;
      const isLegacyFormat = Array.isArray(parsed);
      
      console.log('📊 Format detection:', {
        isEnhancedFormat,
        isLegacyFormat,
        hasMetadata: !!parsed.metadata,
        hasItinerary: !!parsed.itinerary,
        isArray: Array.isArray(parsed)
      });
      
      if (isEnhancedFormat) {
        console.log('🎯 Detected v2.0 Enhanced Format');
        console.log('📋 Metadata:', {
          id: parsed.metadata.id,
          title: parsed.metadata.title,
          created: parsed.metadata.created
        });
        console.log('📊 Itinerary structure:', {
          days: parsed.itinerary.length,
          firstDayActivities: parsed.itinerary[0]?.movements?.[0]?.activities?.length || 0
        });
        
        // Validate enhanced format structure
        for (let i = 0; i < parsed.itinerary.length; i++) {
          const day = parsed.itinerary[i];
          console.log(`Day ${i + 1} validation:`, {
            hasDay: !!day.day,
            hasDate: !!day.date,
            hasMovements: !!day.movements,
            movementsCount: day.movements ? day.movements.length : 0
          });
          
          if (day.movements) {
            day.movements.forEach((movement: any, j: number) => {
              console.log(`  Movement ${j + 1}:`, {
                hasFrom: !!movement.from,
                hasTo: !!movement.to,
                hasActivities: !!movement.activities,
                activitiesCount: movement.activities ? movement.activities.length : 0
              });
              
              // ✅ NUOVO v2.0: Validate enhanced activity fields
              if (movement.activities) {
                movement.activities.forEach((activity: any, k: number) => {
                  console.log(`    Activity ${k + 1}:`, {
                    hasId: !!activity.id,
                    hasName: !!activity.name,
                    hasDescription: !!activity.description,
                    hasType: !!activity.type,
                    hasDuration: !!activity.duration,
                    hasRequired: typeof activity.required === 'boolean'
                  });
                });
              }
            });
          }
        }
        
      } else if (isLegacyFormat) {
        console.log('⚠️ Detected Legacy Array Format');
        console.log('📊 Legacy structure:', {
          days: parsed.length,
          firstDayMovements: parsed[0]?.movements?.length || 0
        });
        
        // Validate legacy format
        for (let i = 0; i < parsed.length; i++) {
          const day = parsed[i];
          console.log(`Legacy Day ${i + 1}:`, {
            hasDay: !!day.day,
            hasMovements: !!day.movements,
            movementsCount: day.movements ? day.movements.length : 0
          });
        }
      } else {
        console.warn('⚠️ Unknown format detected, proceeding with caution');
      }
      
    } catch (parseError: unknown) {
      console.error('❌❌❌ JSON PARSE ERROR v2.0:');
      
      const error = parseError as Error;
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
      
      console.log('🔍 CONTENT ANALYSIS v2.0:');
      console.log('First 500 chars:', content.substring(0, 500));
      console.log('Last 500 chars:', content.substring(Math.max(0, content.length - 500)));
      
      // ✅ NUOVO v2.0: Enhanced error analysis
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
      if (error.message && error.message.includes('position')) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          console.log(`🎯 Error at position ${pos}:`);
          console.log('Context:', content.substring(Math.max(0, pos - 50), pos + 50));
          console.log('Character at error:', JSON.stringify(content[pos]));
        }
      }
      
      throw new Error(`Invalid JSON from AI model ${modelToUse} (v2.0). Parse error: ${error.message}. Content preview: ${content.substring(0, 500)}`);
    }
    
    console.log('🚀🚀🚀 ===== DEBUG END v2.0 =====');
    
    return NextResponse.json({ 
      success: true,
      content,
      model: modelToUse,
      action: action,
      formatVersion: useEnhancedFormat ? '2.0' : 'legacy', // ✅ NUOVO
      usage: data.usage || {},
      generatedAt: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('❌ FINAL API ERROR v2.0:', error);
    
    const err = error as Error;
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: `Errore con modello AI v2.0: ${err.message}`,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}