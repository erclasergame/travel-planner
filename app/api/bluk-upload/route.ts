// app/api/admin/bulk-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

interface BulkUploadResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: string[];
  details?: any;
}

export async function POST(request: NextRequest): Promise<NextResponse<BulkUploadResult>> {
  try {
    console.log('🚀 [Bulk Upload] Starting bulk upload process');

    // Validazione environment variables
    if (!XATA_API_KEY || !XATA_DATABASE_URL) {
      console.error('❌ [Bulk Upload] Missing environment variables');
      return NextResponse.json({
        success: false,
        inserted: 0,
        updated: 0,
        errors: ['Configurazione database mancante']
      }, { status: 500 });
    }

    // Parse request body
    const body: any = await request.json();
    console.log('📥 [Bulk Upload] Request body:', {
      table: body.table,
      dataLength: body.data?.length || 0
    });

    const { table, data } = body;

    if (!table || !data || !Array.isArray(data)) {
      console.error('❌ [Bulk Upload] Invalid request format');
      return NextResponse.json({
        success: false,
        inserted: 0,
        updated: 0,
        errors: ['Formato richiesta non valido: servono table e data (array)']
      }, { status: 400 });
    }

    if (data.length === 0) {
      console.warn('⚠️ [Bulk Upload] Empty data array');
      return NextResponse.json({
        success: true,
        inserted: 0,
        updated: 0,
        errors: []
      });
    }

    // Validazione nome tabella
    const validTables = ['continents', 'countries', 'regions', 'cities', 'attractions', 'events'];
    if (!validTables.includes(table)) {
      console.error('❌ [Bulk Upload] Invalid table name:', table);
      return NextResponse.json({
        success: false,
        inserted: 0,
        updated: 0,
        errors: [`Tabella non valida: ${table}. Tabelle permesse: ${validTables.join(', ')}`]
      }, { status: 400 });
    }

    console.log(`📊 [Bulk Upload] Processing ${data.length} records for table: ${table}`);

    // URL endpoint Xata per bulk operations
    const bulkUrl = `${XATA_DATABASE_URL}/tables/${table}/data`;
    
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    // Processa ogni record singolarmente per gestire upsert
    for (let i = 0; i < data.length; i++) {
      const record: any = data[i];
      
      try {
        console.log(`📝 [Bulk Upload] Processing record ${i + 1}/${data.length}:`, record);

        // Per ora, facciamo insert diretto
        // TODO: Implementare logica upsert quando capiamo meglio il comportamento
        
        const response = await fetch(bulkUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${XATA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record)
        });

        const responseText = await response.text();
        console.log(`📡 [Bulk Upload] Xata response for record ${i + 1}:`, {
          status: response.status,
          statusText: response.statusText,
          body: responseText.substring(0, 200) // Solo primi 200 char per log
        });

        if (response.ok) {
          // Successo - potrebbe essere insert o update
          inserted++;
          console.log(`✅ [Bulk Upload] Record ${i + 1} processed successfully`);
        } else {
          // Errore - log dettaglio
          const errorMsg = `Record ${i + 1}: HTTP ${response.status} - ${responseText}`;
          errors.push(errorMsg);
          console.error(`❌ [Bulk Upload] ${errorMsg}`);
        }

      } catch (recordError) {
        const errorMsg = `Record ${i + 1}: ${recordError instanceof Error ? recordError.message : 'Errore sconosciuto'}`;
        errors.push(errorMsg);
        console.error(`❌ [Bulk Upload] ${errorMsg}`, recordError);
      }
    }

    const result: BulkUploadResult = {
      success: inserted > 0 || errors.length === 0,
      inserted,
      updated, // Al momento sempre 0, implementeremo upsert dopo
      errors,
      details: {
        table,
        totalRecords: data.length,
        processed: inserted + errors.length
      }
    };

    console.log('🏁 [Bulk Upload] Final result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 [Bulk Upload] Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      inserted: 0,
      updated: 0,
      errors: [`Errore interno: ${error instanceof Error ? error.message : 'Sconosciuto'}`],
      details: {
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

// GET endpoint per test
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Bulk Upload API - Use POST method',
    supportedTables: ['continents', 'countries', 'regions', 'cities', 'attractions', 'events'],
    format: {
      table: 'string',
      data: 'array of objects'
    }
  });
}