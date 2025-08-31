import { NextRequest, NextResponse } from 'next/server';

// Configurazione Xata
const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

// Funzione per ottenere informazioni sulla tabella tramite una query
async function getTableInfo(tableName: string) {
  try {
    console.log(`🔍 Ottengo informazioni per tabella: ${tableName}`);
    
    // Facciamo una query semplice per ottenere un record e vedere quali campi restituisce
    const response = await fetch(`${XATA_DB_URL}/tables/${tableName}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: { size: 1 }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Errore ottenimento info tabella (${response.status}): ${error}`);
    }
    
    const data = await response.json();
    console.log('📊 Dati tabella:', JSON.stringify(data, null, 2));
    
    // Estrai i nomi delle colonne dal primo record (se esiste)
    const columns = data.records && data.records.length > 0 
      ? Object.keys(data.records[0]).filter(key => !key.startsWith('xata'))
      : [];
      
    return {
      success: true,
      columns,
      sampleRecord: data.records && data.records.length > 0 ? data.records[0] : null,
      meta: data.meta || {}
    };
  } catch (error) {
    console.error('❌ Errore lettura info tabella:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
      columns: []
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST API: Testing direct database write...');
    
    if (!XATA_API_KEY) {
      throw new Error('XATA_API_KEY not configured');
    }
    
    // 1. Prima otteniamo informazioni sulla tabella
    const tableName = 'global-settings';
    const tableInfo = await getTableInfo(tableName);
    
    // Se non riusciamo a ottenere informazioni sulla tabella
    if (!tableInfo.success) {
      return NextResponse.json({
        success: false,
        error: `Non è stato possibile ottenere informazioni sulla tabella: ${tableInfo.error}`,
        tableName
      }, { status: 500 });
    }
    
    console.log('📋 Colonne disponibili:', tableInfo.columns);
    
    // Prepariamo un record di test basato sulle colonne disponibili
    const testRecord: Record<string, any> = {
      id: `test-${Date.now()}`
    };
    
    // Aggiungiamo ai_model solo se esiste nella tabella
    if (tableInfo.columns.includes('ai_model')) {
      testRecord.ai_model = 'test-model';
    }
    
    console.log('📝 Test record da inserire:', testRecord);
    
    // Prova a inserire direttamente nella tabella
    const response = await fetch(`${XATA_DB_URL}/tables/${tableName}/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRecord)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test riuscito! Record inserito:', result);
      
      return NextResponse.json({
        success: true,
        message: 'Test record inserito con successo',
        tableInfo: {
          columns: tableInfo.columns,
          sampleRecord: tableInfo.sampleRecord
        },
        record: testRecord,
        result: result
      });
      
    } else {
      const errorText = await response.text();
      console.log('❌ Test fallito! Risposta errore:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        tableInfo: {
          columns: tableInfo.columns,
          sampleRecord: tableInfo.sampleRecord
        },
        record: testRecord
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('❌ Test API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}
