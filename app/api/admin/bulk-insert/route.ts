import { NextRequest } from 'next/server';

// CORS Headers - Permettono richieste da qualsiasi dominio
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400',
};

// Gestione richieste OPTIONS (preflight CORS)
export async function OPTIONS() {
  console.log('🔍 CORS preflight request received');
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Gestione GET per test connettività
export async function GET() {
  console.log('🔍 GET test request received');
  return Response.json(
    { 
      message: 'Bulk insert endpoint is working with CORS enabled',
      timestamp: new Date().toISOString(),
      cors_enabled: true,
      endpoint: '/api/admin/bulk-insert',
      status: 'ready',
      database: 'xata_lite_connected'
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

// Funzione POST principale per bulk insert
export async function POST(request: NextRequest) {
  console.log('🚀 POST bulk-insert request received');
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', { 
      table: body.table, 
      dataLength: body.data?.length,
      batchSize: body.batch_size 
    });
    
    // Validazione payload
    const { table, data, batch_size, on_conflict } = body;
    
    if (!table || !data || !Array.isArray(data)) {
      console.log('❌ Validation failed: Invalid payload');
      return Response.json(
        { 
          success: false,
          error: 'Invalid payload',
          message: 'table and data array are required',
          received: { 
            table: !!table, 
            data: Array.isArray(data),
            dataLength: data?.length || 0
          }
        },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    console.log(`✅ Processing ${data.length} records for table ${table}`);
    
    // Connessione Xata Lite
    const XATA_API_KEY = process.env.XATA_API_KEY;
    const XATA_DB_URL = process.env.XATA_DB_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';
    
    if (!XATA_API_KEY) {
      return Response.json({
        success: false,
        error: 'Database configuration error',
        message: 'XATA_API_KEY not configured'
      }, {
        status: 500,
        headers: corsHeaders,
      });
    }
    
    // Gestione per tabella cities
    if (table === 'cities') {
      console.log('📊 Inserting cities into Xata database...');
      
      const results = [];
      const errors = [];
      
      // Insert records one by one (or in batches)
      for (let i = 0; i < data.length; i++) {
        const cityData = data[i];
        
        try {
          // Xata HTTP API call
          const response = await fetch(`${XATA_DB_URL}/tables/cities/data`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${XATA_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cityData)
          });
          
          if (response.ok) {
            const result = await response.json();
            results.push(result);
            console.log(`✅ City inserted: ${cityData.name} (${cityData.country_code})`);
          } else {
            const errorData = await response.json();
            errors.push({
              city: cityData.name,
              error: errorData,
              status: response.status
            });
            console.error(`❌ Failed to insert city ${cityData.name}:`, errorData);
          }
          
        } catch (error: any) {
          errors.push({
            city: cityData.name,
            error: error.message,
            status: 'network_error'
          });
          console.error(`❌ Network error inserting city ${cityData.name}:`, error);
        }
      }
      
      const successCount = results.length;
      const errorCount = errors.length;
      
      return Response.json({
        success: successCount > 0,
        message: `Processed ${data.length} cities: ${successCount} successful, ${errorCount} failed`,
        table: table,
        records_processed: data.length,
        records_created: successCount,
        records_failed: errorCount,
        batch_size: batch_size || data.length,
        on_conflict_strategy: on_conflict || 'create',
        timestamp: new Date().toISOString(),
        results: results.slice(0, 5), // Prime 5 per non sovraccaricare risposta
        errors: errors.slice(0, 5), // Primi 5 errori per debug
        database_url: XATA_DB_URL.split('/db/')[0] + '/db/***' // Masked URL
      }, {
        status: successCount > 0 ? 200 : 500,
        headers: corsHeaders,
      });
    }
    
    // Gestione per altre tabelle
    else {
      return Response.json({
        success: false,
        error: 'Table not supported',
        message: `Table "${table}" is not supported yet`,
        supported_tables: ['cities'],
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

  } catch (error: any) {
    console.error('❌ Bulk insert error:', error);
    
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}