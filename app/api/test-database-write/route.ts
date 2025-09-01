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
      
      // Analisi dettagliata della tabella
      console.log('🔍 Analisi dettagliata della tabella:');
      console.log('- Nome tabella: global-settings');
      console.log('- Numero record trovati:', tableData.records?.length || 0);
      console.log('- Colonne disponibili:', columns);
      
      if (tableData.records && tableData.records.length > 0) {
        console.log('- Esempio record:', JSON.stringify(tableData.records[0], null, 2));
        
        // Estrai tutti i campi dal record di esempio
        const sampleRecord = tableData.records[0];
        console.log('- Campi nel record di esempio:');
        Object.keys(sampleRecord).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleRecord[key]} = ${JSON.stringify(sampleRecord[key])}`);
        });
      }
      
      // SOLUZIONE ALTERNATIVA: Invece di creare un nuovo record, aggiorniamo quello esistente
      console.log('🔄 Utilizzo approccio PATCH invece di POST per evitare problemi con xata_id');
      
      // Verifichiamo se esiste un record con ID "global-settings"
      const getExistingResponse = await fetch(`${XATA_DB_URL}/tables/global-settings/data/global-settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (getExistingResponse.ok) {
        console.log('✅ Record "global-settings" trovato, procedo con aggiornamento');
        const existingRecord = await getExistingResponse.json();
        console.log('📄 Record esistente:', existingRecord);
        
        // Aggiorniamo il record esistente invece di crearne uno nuovo
        const updateRecord = {
          ai_model: `test-model-${Date.now()}`,
          last_updated: new Date().toISOString(),
          updated_by: 'test-script'
        };
        
        console.log('📝 Update record:', updateRecord);
        
        // Aggiorna il record esistente
        const updateResponse = await fetch(`${XATA_DB_URL}/tables/global-settings/data/global-settings`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${XATA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRecord)
        });
        
        console.log('📡 Update response status:', updateResponse.status);
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('❌ Update failed:', errorText);
          
          return NextResponse.json({
            success: false,
            error: `Xata update failed: ${updateResponse.status} - ${errorText}`,
            record: updateRecord,
            tableInfo: {
              storage: 'Xata',
              table: 'global-settings',
              operation: 'PATCH',
              columns: columns,
              status: 'update-error',
              details: errorText
            }
          }, { status: updateResponse.status });
        }
        
        const updateResult = await updateResponse.json();
        console.log('✅ Update successful:', updateResult);
        
        return NextResponse.json({
          success: true,
          message: 'Test di aggiornamento completato con successo!',
          record: updateRecord,
          result: updateResult,
          tableInfo: {
            storage: 'Xata',
            table: 'global-settings',
            operation: 'PATCH',
            columns: columns,
            status: 'success'
          }
        });
      } else {
        // Se il record non esiste, lo creiamo (come fa admin-settings)
        console.log('🆕 Record "global-settings" non trovato, lo creo...');
        
        // Crea il record global-settings
        const createRecord = {
          id: 'global-settings',
          ai_model: `test-model-${Date.now()}`,
          last_updated: new Date().toISOString(),
          updated_by: 'test-script'
        };
        
        console.log('📝 Create record:', createRecord);
        
        const createResponse = await fetch(`${XATA_DB_URL}/tables/global-settings/data`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${XATA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRecord)
        });
        
        console.log('📡 Create response status:', createResponse.status);
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('❌ Create failed:', errorText);
          
          return NextResponse.json({
            success: false,
            error: `Xata create failed: ${createResponse.status} - ${errorText}`,
            record: createRecord,
            tableInfo: {
              storage: 'Xata',
              table: 'global-settings',
              operation: 'POST',
              status: 'create-error',
              details: errorText
            }
          }, { status: createResponse.status });
        }
        
        const createResult = await createResponse.json();
        console.log('✅ Record created successfully:', createResult);
        
        return NextResponse.json({
          success: true,
          message: 'Test di creazione completato con successo!',
          record: createRecord,
          result: createResult,
          tableInfo: {
            storage: 'Xata',
            table: 'global-settings',
            operation: 'POST',
            status: 'success'
          }
        });
      }
      
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