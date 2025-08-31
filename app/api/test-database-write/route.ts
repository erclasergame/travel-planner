import { NextRequest, NextResponse } from 'next/server';

// Configurazione Xata
const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST API: Testing direct database write...');
    
    if (!XATA_API_KEY) {
      throw new Error('XATA_API_KEY not configured');
    }
    
    const body = await request.json();
    const { message } = body;
    
    // Crea un record di test unico
    const testRecord = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ai_model: 'test-model',
      last_updated: new Date().toISOString(),
      updated_by: 'test-script',
      test_message: message || 'Test automatico'
    };
    
    console.log('📝 Test record to insert:', testRecord);
    
    // Prova a inserire direttamente nella tabella global_settings
    const response = await fetch(`${XATA_DB_URL}/tables/global_settings/data`, {
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
      console.log('✅ Test successful! Record inserted:', result);
      
      return NextResponse.json({
        success: true,
        message: 'Test record inserted successfully',
        record: testRecord,
        result: result
      });
      
    } else {
      const errorText = await response.text();
      console.log('❌ Test failed! Error response:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
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
