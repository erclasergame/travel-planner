import { NextRequest, NextResponse } from 'next/server';

// Configurazione Xata
const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

// Funzione per ottenere lo schema della tabella
async function getTableSchema(tableName: string) {
  try {
    console.log(`🔍 Ottengo schema per tabella: ${tableName}`);
    
    const response = await fetch(`${XATA_DB_URL}/tables/${tableName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Errore ottenimento schema (${response.status}): ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Errore lettura schema:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST API: Testing direct database write...');
    
    if (!XATA_API_KEY) {
      throw new Error('XATA_API_KEY not configured');
    }
    
    // 1. Prima otteniamo lo schema della tabella
    const tableName = 'global-settings';
    const schema = await getTableSchema(tableName);
    
    console.log('📊 Schema tabella:', JSON.stringify(schema, null, 2));
    
    // Se non riusciamo a ottenere lo schema, restituiamo un errore
    if (!schema) {
      return NextResponse.json({
        success: false,
        error: 'Non è stato possibile ottenere lo schema della tabella',
        tableName
      }, { status: 500 });
    }
    
    // Estrai le colonne disponibili dallo schema
    const availableColumns = schema.columns ? schema.columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      unique: col.unique || false,
      notNull: col.notNull || false,
      defaultValue: col.defaultValue
    })) : [];
    
    console.log('📋 Colonne disponibili:', availableColumns);
    
    // 2. Ora proviamo a inserire un record minimo
    const testRecord = {
      id: `test-${Date.now()}`,
      ai_model: 'test-model'
    };
    
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
        schema: availableColumns,
        record: testRecord,
        result: result
      });
      
    } else {
      const errorText = await response.text();
      console.log('❌ Test fallito! Risposta errore:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        schema: availableColumns,
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
