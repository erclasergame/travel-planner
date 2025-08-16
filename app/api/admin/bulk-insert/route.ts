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
      status: 'ready'
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
    
    // Gestione per tabella cities
    if (table === 'cities') {
      // Qui va la tua logica Xata esistente
      // Esempio di come potrebbe essere:
      /*
      const { getXataClient } = await import('@/lib/xata');
      const xata = getXataClient();
      
      const results = [];
      for (const cityData of data) {
        try {
          const result = await xata.db.cities.create(cityData);
          results.push(result);
        } catch (error) {
          console.error('Error inserting city:', cityData, error);
        }
      }
      */
      
      // Per ora simulo una risposta di successo
      // SOSTITUISCI QUESTA SEZIONE CON IL TUO CODICE XATA
      const results = data.map((item: any, index: number) => ({
        id: `generated_id_${index}`,
        ...item,
        inserted_at: new Date().toISOString()
      }));
      
      return Response.json({
        success: true,
        message: `Successfully processed ${data.length} cities`,
        table: table,
        records_processed: data.length,
        records_created: results.length,
        batch_size: batch_size || data.length,
        on_conflict_strategy: on_conflict || 'create',
        timestamp: new Date().toISOString(),
        // results: results // Opzionale: ritorna i record creati
      }, {
        status: 200,
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