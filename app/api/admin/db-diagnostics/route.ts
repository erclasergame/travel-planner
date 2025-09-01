import { NextRequest } from 'next/server';

/**
 * API per la diagnostica del database
 * GET /api/admin/db-diagnostics - Ottiene informazioni generali sul database
 * GET /api/admin/db-diagnostics?table=nome_tabella - Ottiene dati di una tabella specifica
 */
export async function GET(request: NextRequest) {
  try {
    // Configurazione Xata (dichiarata localmente come nelle altre API)
    const XATA_API_KEY = process.env.XATA_API_KEY;
    const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';
    
    // Controlla se l'API key è configurata
    if (!XATA_API_KEY) {
      console.warn('⚠️ XATA_API_KEY non configurata, usando modalità simulata');
      
      // Dati simulati
      const simulatedTables = ['global-settings', 'continents', 'countries', 'cities', 'attractions', 'events'];
      const recordCount = {
        'global-settings': 1,
        'continents': 6,
        'countries': 50,
        'cities': 30,
        'attractions': 100,
        'events': 20
      };
      
      // Ottieni parametri dalla query
      const url = new URL(request.url);
      const tableName = url.searchParams.get('table');
      
      // Se è specificata una tabella, restituisci dati simulati per quella tabella
      if (tableName) {
        // Dati simulati per tabelle specifiche
        const simulatedData = {
          'global-settings': [{
            id: 'global-settings',
            ai_model: 'google/gemma-2-9b-it:free',
            last_updated: new Date().toISOString(),
            updated_by: 'system'
          }],
          'continents': [
            { id: 'eu', name: 'Europe', code: 'EU' },
            { id: 'as', name: 'Asia', code: 'AS' }
          ],
          'countries': [
            { id: 'it', name: 'Italy', code: 'IT', continent_id: 'eu' },
            { id: 'fr', name: 'France', code: 'FR', continent_id: 'eu' }
          ]
        };
        
        // Restituisci dati simulati per la tabella richiesta o un set generico
        const records = simulatedData[tableName] || [{ id: 'example', name: 'Example Record', type: 'simulated' }];
        
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
        message: 'Modalità simulata - XATA_API_KEY non configurata'
      });
    }
    
    // Ottieni parametri dalla query
    const url = new URL(request.url);
    const tableName = url.searchParams.get('table');
    
    // Se è specificata una tabella, ottieni i dati di quella tabella
    if (tableName) {
      // Ottieni dati tabella (primi 50 record)
      const response = await fetch(`${XATA_DB_URL}/tables/${tableName}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: { size: 50 }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Xata API error: ${response.status}`);
      }
      
      const data = await response.json();
      return Response.json({
        records: data.records || [],
        total: data.meta?.page?.more ? '50+' : data.records?.length || 0
      });
    }
    
    // Altrimenti ottieni informazioni generali sul database
    // Ottieni elenco tabelle
    const tablesResponse = await fetch(`${XATA_DB_URL}/tables`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!tablesResponse.ok) {
      throw new Error(`Xata API error: ${tablesResponse.status}`);
    }
    
    const tablesData = await tablesResponse.json();
    const tables = tablesData.tables?.map((table: any) => table.name) || [];
    
    // Ottieni conteggio record per ogni tabella
    const recordCount: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const countResponse = await fetch(`${XATA_DB_URL}/tables/${table}/summarize`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${XATA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summaries: {
              count: { count: "*" }
            }
          })
        });
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          recordCount[table] = countData.summaries?.[0]?.count || 0;
        }
      } catch (err) {
        recordCount[table] = -1; // Indica errore
      }
    }
    
    return Response.json({
      tables,
      recordCount
    });
    
  } catch (error: any) {
    console.error('❌ DB Diagnostics API error:', error);
    
    return Response.json({ 
      error: 'Failed to fetch database info', 
      details: error.message 
    }, { status: 500 });
  }
}