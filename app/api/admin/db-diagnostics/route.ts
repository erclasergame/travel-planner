import { NextRequest, NextResponse } from 'next/server';

// Configurazione Xata
const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

/**
 * API per la diagnostica del database
 * GET /api/admin/db-diagnostics - Ottiene informazioni generali sul database
 * GET /api/admin/db-diagnostics?table=nome_tabella - Ottiene dati di una tabella specifica
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DB Diagnostics API called');
    
    // Controlla se l'API key è configurata
    if (!XATA_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'XATA_API_KEY non configurata'
      }, { status: 500 });
    }
    
    // Ottieni parametri dalla query
    const url = new URL(request.url);
    const tableName = url.searchParams.get('table');
    
    // Se è specificata una tabella, ottieni i dati di quella tabella
    if (tableName) {
      return await getTableData(tableName);
    }
    
    // Altrimenti ottieni informazioni generali sul database
    return await getDatabaseInfo();
  } catch (error: any) {
    console.error('❌ DB Diagnostics API error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Errore API: ${error.message || 'Errore sconosciuto'}`
    }, { status: 500 });
  }
}

/**
 * Ottiene informazioni generali sul database
 */
async function getDatabaseInfo() {
  try {
    console.log('📊 Getting database info...');
    
    // Ottieni elenco tabelle
    const tablesResponse = await fetch(`${XATA_DB_URL}/tables`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!tablesResponse.ok) {
      const errorText = await tablesResponse.text();
      throw new Error(`Errore ottenimento tabelle: ${tablesResponse.status} - ${errorText}`);
    }
    
    const tablesData = await tablesResponse.json();
    const tables = tablesData.tables?.map((table: any) => table.name) || [];
    console.log(`📋 Found ${tables.length} tables`);
    
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
        console.error(`❌ Error counting records in ${table}:`, err);
        recordCount[table] = -1; // Indica errore
      }
    }
    
    // Informazioni generali
    const dbInfo = {
      dbUrl: XATA_DB_URL,
      apiKey: XATA_API_KEY?.substring(0, 5) + '...' + XATA_API_KEY?.substring(XATA_API_KEY.length - 5),
      connected: true,
      tableCount: tables.length,
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    return NextResponse.json({
      success: true,
      dbInfo,
      tables,
      recordCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting database info:', error);
    
    return NextResponse.json({
      success: false,
      error: `Errore ottenimento info database: ${error.message || 'Errore sconosciuto'}`
    }, { status: 500 });
  }
}

/**
 * Ottiene dati di una tabella specifica
 */
async function getTableData(tableName: string) {
  try {
    console.log(`📊 Getting data for table "${tableName}"...`);
    
    // Ottieni struttura tabella
    const schemaResponse = await fetch(`${XATA_DB_URL}/tables/${tableName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!schemaResponse.ok) {
      const errorText = await schemaResponse.text();
      throw new Error(`Errore ottenimento schema: ${schemaResponse.status} - ${errorText}`);
    }
    
    const schemaData = await schemaResponse.json();
    
    // Ottieni dati tabella (primi 50 record)
    const dataResponse = await fetch(`${XATA_DB_URL}/tables/${tableName}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: { size: 50 }
      })
    });
    
    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      throw new Error(`Errore ottenimento dati: ${dataResponse.status} - ${errorText}`);
    }
    
    const tableData = await dataResponse.json();
    console.log(`📋 Found ${tableData.records?.length || 0} records in "${tableName}"`);
    
    // Ottieni conteggio totale record
    const countResponse = await fetch(`${XATA_DB_URL}/tables/${tableName}/summarize`, {
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
    
    let totalRecords = 0;
    if (countResponse.ok) {
      const countData = await countResponse.json();
      totalRecords = countData.summaries?.[0]?.count || 0;
    }
    
    return NextResponse.json({
      success: true,
      tableName,
      schema: schemaData,
      tableData,
      totalRecords,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`❌ Error getting data for table "${tableName}":`, error);
    
    return NextResponse.json({
      success: false,
      error: `Errore ottenimento dati tabella "${tableName}": ${error.message || 'Errore sconosciuto'}`
    }, { status: 500 });
  }
}
