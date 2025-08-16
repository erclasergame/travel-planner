import { NextRequest, NextResponse } from 'next/server';

interface BulkUploadRequest {
  table: string;
  data: any[];
}

interface BulkUploadResponse {
  success: boolean;
  inserted: number;
  errors: string[];
  details?: {
    total: number;
    skipped: number;
  };
}

// Mapping tabelle per validazione
const VALID_TABLES = {
  continents: ['name', 'code'],
  countries: ['continent_id', 'name', 'code', 'flag_url'],
  regions: ['country_id', 'name', 'type'],
  cities: ['region_id', 'name', 'type', 'lat', 'lng', 'population'],
  attractions: ['city_id', 'name', 'description', 'type', 'subtype', 'lat', 'lng', 'visit_duration', 'cost_range', 'image_url', 'is_active'],
  events: ['city_id', 'name', 'description', 'recurrence_rule', 'season', 'duration', 'cost_range', 'image_url', 'is_active']
};

async function insertRecords(table: string, records: any[]): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  try {
    // Headers per chiamata Xata
    const headers = {
      'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // URL base del database
    const baseUrl = process.env.XATA_DATABASE_URL;
    
    if (!baseUrl || !process.env.XATA_API_KEY) {
      throw new Error('Xata credentials non configurate');
    }

    // Inserisci ogni record singolarmente per migliore error handling
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Valida campi richiesti
        const requiredFields = getRequiredFields(table);
        const missingFields = requiredFields.filter((field: any) => !record.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
          errors.push(`Record ${i + 1}: campi mancanti: ${missingFields.join(', ')}`);
          continue;
        }

        // Chiama API Xata per inserimento
        const response = await fetch(`${baseUrl}/tables/${table}/data`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(record)
        });

        if (response.ok) {
          inserted++;
        } else {
          const errorData = await response.text();
          errors.push(`Record ${i + 1}: ${response.status} - ${errorData}`);
        }

      } catch (recordError: any) {
        errors.push(`Record ${i + 1}: ${recordError.message}`);
      }
    }

  } catch (globalError: any) {
    errors.push(`Errore globale: ${globalError.message}`);
  }

  return { inserted, errors };
}

function getRequiredFields(table: string): string[] {
  // Campi obbligatori per ogni tabella
  const requiredFields: any = {
    continents: ['name', 'code'],
    countries: ['continent_id', 'name', 'code'],
    regions: ['country_id', 'name'],
    cities: ['region_id', 'name', 'lat', 'lng'],
    attractions: ['city_id', 'name', 'type', 'lat', 'lng'],
    events: ['city_id', 'name', 'description']
  };

  return requiredFields[table] || [];
}

function validateTable(table: string): boolean {
  return Object.keys(VALID_TABLES).includes(table);
}

function validateRecords(table: string, records: any[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(records)) {
    errors.push('Data deve essere un array');
    return errors;
  }

  if (records.length === 0) {
    errors.push('Array vuoto - nessun record da inserire');
    return errors;
  }

  if (records.length > 100) {
    errors.push('Troppi records - massimo 100 per volta');
    return errors;
  }

  // Valida struttura base dei records
  records.forEach((record: any, index: any) => {
    if (!record || typeof record !== 'object') {
      errors.push(`Record ${index + 1}: deve essere un oggetto`);
    }
  });

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [Bulk Upload] Richiesta ricevuta');

    const body: BulkUploadRequest = await request.json();
    const { table, data } = body;

    if (!table || !data) {
      return NextResponse.json({
        success: false,
        inserted: 0,
        errors: ['Parametri table e data richiesti']
      } as BulkUploadResponse, { status: 400 });
    }

    // Validazione tabella
    if (!validateTable(table)) {
      return NextResponse.json({
        success: false,
        inserted: 0,
        errors: [`Tabella '${table}' non valida. Tabelle supportate: ${Object.keys(VALID_TABLES).join(', ')}`]
      } as BulkUploadResponse, { status: 400 });
    }

    // Validazione records
    const validationErrors = validateRecords(table, data);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        inserted: 0,
        errors: validationErrors
      } as BulkUploadResponse, { status: 400 });
    }

    console.log(`📊 [Bulk Upload] Inserendo ${data.length} records in tabella '${table}'`);

    // Inserimento records
    const result = await insertRecords(table, data);

    const response: BulkUploadResponse = {
      success: result.inserted > 0,
      inserted: result.inserted,
      errors: result.errors,
      details: {
        total: data.length,
        skipped: data.length - result.inserted
      }
    };

    console.log(`✅ [Bulk Upload] Completato: ${result.inserted}/${data.length} inseriti`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ [Bulk Upload] Errore:', error);

    return NextResponse.json({
      success: false,
      inserted: 0,
      errors: [error.message || 'Errore interno del server']
    } as BulkUploadResponse, { status: 500 });
  }
}

// GET per info API
export async function GET() {
  return NextResponse.json({
    endpoint: 'Bulk Upload API',
    version: '1.0',
    supportedTables: Object.keys(VALID_TABLES),
    maxRecords: 100,
    method: 'POST',
    bodyExample: {
      table: 'attractions',
      data: [
        {
          city_id: 1,
          name: 'Colosseo',
          description: 'Anfiteatro Romano',
          type: 'monument',
          lat: 41.8902,
          lng: 12.4922,
          is_active: true
        }
      ]
    }
  });
}