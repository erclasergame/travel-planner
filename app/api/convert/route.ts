import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData, travelPlan, action, selectedModel, customPrompt } = body;

    // 🆕 GESTIONE VALIDAZIONE
    if (action === 'validate') {
      console.log('🔍 Validating JSON format...');
      
      const validation = validateItineraryFormat(body.data);
      
      return NextResponse.json({
        success: true,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        action: 'validate'
      });
    }

    let prompt = '';
    
    if (customPrompt) {
      prompt = customPrompt;
    } else {
      // Logica esistente per la conversione
      prompt = 'Converti i dati del viaggio nel formato richiesto';
    }

    return NextResponse.json({
      success: true,
      message: 'Conversion completed',
      prompt: prompt
    });

  } catch (error) {
    console.error('❌ Error in convert API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}

// 🆕 FUNZIONE VALIDAZIONE
function validateItineraryFormat(itinerary: any) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!itinerary) {
    errors.push('Itinerario non fornito');
    return { valid: false, errors, warnings };
  }
  
  if (!itinerary.tripInfo) {
    errors.push('Manca sezione tripInfo');
  } else {
    if (!itinerary.tripInfo.from) errors.push('Manca campo tripInfo.from');
    if (!itinerary.tripInfo.to) errors.push('Manca campo tripInfo.to'); 
    if (!itinerary.tripInfo.duration) errors.push('Manca campo tripInfo.duration');
  }
  
  if (!itinerary.itinerary) {
    errors.push('Manca sezione itinerary');
  } else if (!Array.isArray(itinerary.itinerary)) {
    errors.push('itinerary deve essere un array');
  } else {
    warnings.push(`Trovati ${itinerary.itinerary.length} giorni di viaggio`);
    
    itinerary.itinerary.forEach((day: any, index: number) => {
      if (!day.day) errors.push(`Giorno ${index}: manca campo 'day'`);
      if (!day.movements) {
        errors.push(`Giorno ${index}: manca campo 'movements'`);
      } else if (Array.isArray(day.movements)) {
        const activitiesCount = day.movements.reduce((sum: number, mov: any) => 
          sum + (mov.activities ? mov.activities.length : 0), 0);
        warnings.push(`Giorno ${day.day}: ${activitiesCount} attività trovate`);
      }
    });
  }
  
  if (errors.length === 0) {
    warnings.push('Formato Travel Planner valido e compatibile');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
