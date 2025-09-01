import { NextRequest } from 'next/server';

/**
 * API per la diagnostica del database - VERSIONE ULTRA SEMPLIFICATA
 * Restituisce solo dati simulati per evitare errori di runtime
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DB Diagnostics API called - SIMPLIFIED VERSION');
    
    // Ottieni parametri dalla query
    const url = new URL(request.url);
    const tableName = url.searchParams.get('table');
    
    // Dati simulati fissi
    const simulatedTables = ['global-settings', 'continents', 'countries', 'cities', 'attractions', 'events'];
    const recordCount = {
      'global-settings': 1,
      'continents': 6,
      'countries': 50,
      'cities': 30,
      'attractions': 100,
      'events': 20
    };
    
    // Se è specificata una tabella, restituisci dati simulati per quella tabella
    if (tableName) {
      // Dati simulati per tabelle specifiche
      let records: any[] = [];
      
      switch(tableName) {
        case 'global-settings':
          records = [{
            id: 'global-settings',
            ai_model: 'google/gemma-2-9b-it:free',
            last_updated: new Date().toISOString(),
            updated_by: 'system'
          }];
          break;
        case 'continents':
          records = [
            { id: 'eu', name: 'Europe', code: 'EU' },
            { id: 'as', name: 'Asia', code: 'AS' },
            { id: 'af', name: 'Africa', code: 'AF' },
            { id: 'na', name: 'North America', code: 'NA' },
            { id: 'sa', name: 'South America', code: 'SA' },
            { id: 'oc', name: 'Oceania', code: 'OC' }
          ];
          break;
        case 'countries':
          records = [
            { id: 'it', name: 'Italy', code: 'IT', continent_id: 'eu' },
            { id: 'fr', name: 'France', code: 'FR', continent_id: 'eu' },
            { id: 'de', name: 'Germany', code: 'DE', continent_id: 'eu' },
            { id: 'es', name: 'Spain', code: 'ES', continent_id: 'eu' },
            { id: 'uk', name: 'United Kingdom', code: 'UK', continent_id: 'eu' }
          ];
          break;
        case 'cities':
          records = [
            { id: 'rome', name: 'Rome', country_id: 'it', lat: 41.9028, lng: 12.4964 },
            { id: 'milan', name: 'Milan', country_id: 'it', lat: 45.4642, lng: 9.1900 },
            { id: 'paris', name: 'Paris', country_id: 'fr', lat: 48.8566, lng: 2.3522 },
            { id: 'berlin', name: 'Berlin', country_id: 'de', lat: 52.5200, lng: 13.4050 }
          ];
          break;
        case 'attractions':
          records = [
            { id: 'colosseum', name: 'Colosseum', city_id: 'rome', type: 'monument' },
            { id: 'eiffel', name: 'Eiffel Tower', city_id: 'paris', type: 'monument' },
            { id: 'duomo', name: 'Duomo di Milano', city_id: 'milan', type: 'religious' }
          ];
          break;
        default:
          records = [{ id: 'example', name: 'Example Record', type: 'simulated' }];
      }
      
      return Response.json({
        records: records,
        total: records.length,
        mode: 'SIMULATED'
      });
    }
    
    // Altrimenti restituisci informazioni generali
    return Response.json({
      tables: simulatedTables,
      recordCount: recordCount,
      mode: 'SIMULATED',
      message: 'Dati simulati per diagnostica'
    });
    
  } catch (error: any) {
    console.error('❌ DB Diagnostics API error:', error);
    
    // Anche in caso di errore, restituisci dati simulati
    return Response.json({
      tables: ['global-settings', 'continents', 'countries'],
      recordCount: {
        'global-settings': 1,
        'continents': 6,
        'countries': 10
      },
      mode: 'SIMULATED-ERROR-RECOVERY',
      message: 'Dati simulati di recupero'
    });
  }
}