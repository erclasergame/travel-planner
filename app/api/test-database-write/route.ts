import { NextRequest, NextResponse } from 'next/server';

// Configurazione Xata
const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting Xata database write test...');
    
    // Parse request body safely
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ JSON Parse error:', parseError);
      body = { message: 'Default test message' };
    }
    
    const { message = 'Test automatico di scrittura del database' } = body;
    
    // Check if Xata is configured
    if (!XATA_API_KEY) {
      console.error('❌ XATA_API_KEY not configured');
      return NextResponse.json({
        success: false,
        error: 'XATA_API_KEY not configured',
        tableInfo: {
          storage: 'Xata',
          status: 'configuration-error',
          details: 'XATA_API_KEY not found in environment variables'
        }
      }, { status: 500 });
    }
    
    // Generate test ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Create a test record for global-settings table
    const testRecord = {
      id: testId,
      ai_model: 'test-model',
      last_updated: new Date().toISOString(),
      updated_by: 'test-script',
      test_message: message
    };
    
    console.log('📝 Test record created:', testRecord);
    
    try {
      console.log('🔗 Attempting Xata connection...');
      
      // Test table existence first
      const testTableResponse = await fetch(`${XATA_DB_URL}/tables/global-settings/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: { size: 1 }
        })
      });
      
      if (!testTableResponse.ok) {
        const errorText = await testTableResponse.text();
        console.error('❌ Table check failed:', errorText);
        
        return NextResponse.json({
          success: false,
          error: `Xata table check failed: ${testTableResponse.status} - ${errorText}`,
          tableInfo: {
            storage: 'Xata',
            table: 'global-settings',
            status: 'table-error',
            details: errorText
          }
        }, { status: testTableResponse.status });
      }
      
      const tableData = await testTableResponse.json();
      console.log('✅ Table exists, sample data:', tableData);
      
      // Get column names from existing record
      const columns = tableData.records && tableData.records.length > 0 
        ? Object.keys(tableData.records[0]).filter(key => !key.startsWith('xata'))
        : [];
      
      console.log('📋 Available columns:', columns);
      
      // Create a filtered record with only valid columns
      const filteredRecord: Record<string, any> = { id: testId };
      
      // Only include fields that exist in the table
      if (columns.indexOf('ai_model') >= 0) filteredRecord.ai_model = 'test-model';
      if (columns.indexOf('last_updated') >= 0) filteredRecord.last_updated = new Date().toISOString();
      if (columns.indexOf('updated_by') >= 0) filteredRecord.updated_by = 'test-script';
      
      console.log('📝 Filtered record to insert:', filteredRecord);
      
      // Try to insert the record
      const insertResponse = await fetch(`${XATA_DB_URL}/tables/global-settings/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredRecord)
      });
      
      console.log('📡 Insert response status:', insertResponse.status);
      
      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('❌ Insert failed:', errorText);
        
        return NextResponse.json({
          success: false,
          error: `Xata insert failed: ${insertResponse.status} - ${errorText}`,
          record: filteredRecord,
          tableInfo: {
            storage: 'Xata',
            table: 'global-settings',
            columns: columns,
            status: 'insert-error',
            details: errorText
          }
        }, { status: insertResponse.status });
      }
      
      const insertResult = await insertResponse.json();
      console.log('✅ Insert successful:', insertResult);
      
      return NextResponse.json({
        success: true,
        message: 'Test di scrittura completato con successo!',
        record: filteredRecord,
        result: insertResult,
        tableInfo: {
          storage: 'Xata',
          table: 'global-settings',
          columns: columns,
          status: 'success'
        }
      });
      
    } catch (xataError: any) {
      console.error('❌ Xata operation error:', xataError);
      
      return NextResponse.json({
        success: false,
        error: `Xata operation failed: ${xataError.message || 'Unknown error'}`,
        record: testRecord,
        tableInfo: {
          storage: 'Xata',
          status: 'operation-error',
          details: xataError.message || 'Unknown Xata error'
        }
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ General test error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Test failed: ${error.message || 'Unknown error'}`,
      tableInfo: {
        storage: 'Redis (Upstash)',
        status: 'general-error',
        details: error.stack || 'No stack trace available'
      }
    }, { status: 500 });
  }
}