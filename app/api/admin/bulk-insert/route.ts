// app/api/admin/bulk-insert/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface CityData {
  country_code: string;
  name: string;
  code: string;
  type: string;
  region_name: string;
  region_type: string;
  lat: number;
  lng: number;
  population: number;
}

interface AttractionData {
  city_code: string;
  name: string;
  code: string;
  description: string;
  type: string;
  subtype: string;
  lat: number;
  lng: number;
  visit_duration: string;
  opening_hours: string;
  cost_range: string;
  image_url: string;
  image_alt: string;
  is_active: boolean;
}

interface EventData {
  city_code: string;
  name: string;
  code: string;
  description: string;
  recurrence_rule: string;
  season: string;
  start_date: string;
  end_date: string;
  duration: string;
  cost_range: string;
  image_url: string;
  image_alt: string;
  is_active: boolean;
}

interface BulkInsertRequest {
  table: 'cities' | 'attractions' | 'events';
  data: CityData[] | AttractionData[] | EventData[];
  batch_size?: number;
  on_conflict?: 'skip' | 'update' | 'error';
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkInsertRequest = await request.json();
    const { table, data, batch_size = 50, on_conflict = 'update' } = body;

    // Validazione input
    if (!table || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Missing required fields: table, data' },
        { status: 400 }
      );
    }

    if (!['cities', 'attractions', 'events'].includes(table)) {
      return NextResponse.json(
        { error: 'Invalid table. Must be: cities, attractions, events' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Data array cannot be empty' },
        { status: 400 }
      );
    }

    // Configurazione Xata
    const XATA_API_KEY = process.env.XATA_API_KEY;
    const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

    if (!XATA_API_KEY || !XATA_DATABASE_URL) {
      return NextResponse.json(
        { error: 'Xata configuration missing' },
        { status: 500 }
      );
    }

    const results = {
      total_records: data.length,
      inserted: 0,
      updated: 0,
      errors: [] as string[],
      batches_processed: 0
    };

    // Processa in batch per evitare timeout
    for (let i = 0; i < data.length; i += batch_size) {
      const batch = data.slice(i, i + batch_size);
      
      try {
        const batchResult = await processBatch(
          table,
          batch,
          XATA_DATABASE_URL,
          XATA_API_KEY,
          on_conflict
        );
        
        results.inserted += batchResult.inserted;
        results.updated += batchResult.updated;
        results.errors.push(...batchResult.errors);
        results.batches_processed++;

        // Piccola pausa tra batch per non sovraccaricare
        if (i + batch_size < data.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Batch ${results.batches_processed + 1} failed:`, error);
        results.errors.push(`Batch ${results.batches_processed + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk insert completed for ${table}`,
      results,
      summary: {
        success_rate: ((results.inserted + results.updated) / results.total_records * 100).toFixed(1) + '%',
        failed_records: results.total_records - results.inserted - results.updated
      }
    });

  } catch (error) {
    console.error('Bulk insert error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function processBatch(
  table: string,
  batch: any[],
  databaseUrl: string,
  apiKey: string,
  onConflict: string
) {
  const results = {
    inserted: 0,
    updated: 0,
    errors: [] as string[]
  };

  // Genera SQL per bulk insert
  const { sql, values } = generateBulkInsertSQL(table, batch, onConflict);

  try {
    const response = await fetch(`${databaseUrl}/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statement: sql })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Xata API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    // Analizza risultato per contare insert vs update
    if (result.records) {
      results.inserted = batch.length; // Semplificazione, in realtà Xata non restituisce sempre dettagli granulari
    }

  } catch (error) {
    console.error('Batch processing error:', error);
    results.errors.push(`Batch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
}

function generateBulkInsertSQL(table: string, data: any[], onConflict: string): { sql: string, values: any[] } {
  if (data.length === 0) {
    throw new Error('No data to insert');
  }

  let columns: string[];
  let conflictColumn: string;

  // Definisce colonne per ogni tabella
  switch (table) {
    case 'cities':
      columns = ['country_code', 'name', 'code', 'type', 'region_name', 'region_type', 'lat', 'lng', 'population'];
      conflictColumn = 'code';
      break;
    case 'attractions':
      columns = ['city_code', 'name', 'code', 'description', 'type', 'subtype', 'lat', 'lng', 'visit_duration', 'opening_hours', 'cost_range', 'image_url', 'image_alt', 'created_at', 'last_verified', 'is_active'];
      conflictColumn = 'code';
      break;
    case 'events':
      columns = ['city_code', 'name', 'code', 'description', 'recurrence_rule', 'season', 'start_date', 'end_date', 'duration', 'cost_range', 'image_url', 'image_alt', 'created_at', 'last_verified', 'is_active'];
      conflictColumn = 'code';
      break;
    default:
      throw new Error(`Unsupported table: ${table}`);
  }

  // Helper per escape valori SQL
  const escapeValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  // Genera VALUES clause con valori letterali
  const valuePlaceholders = data.map((record) => {
    const recordValues = columns.map(col => {
      let value = record[col];
      
      // Aggiunge timestamp per attractions/events se mancanti
      if ((col === 'created_at' || col === 'last_verified') && !value) {
        value = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      }
      
      // Default per is_active
      if (col === 'is_active' && value === undefined) {
        value = true;
      }
      
      return escapeValue(value);
    });
    
    return `(${recordValues.join(', ')})`;
  }).join(', ');

  // Genera SQL con gestione conflitti
  let conflictClause = '';
  switch (onConflict) {
    case 'skip':
      conflictClause = `ON CONFLICT (${conflictColumn}) DO NOTHING`;
      break;
    case 'update':
      const updateColumns = columns.filter(col => col !== conflictColumn);
      const updateSet = updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
      conflictClause = `ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateSet}`;
      break;
    case 'error':
      conflictClause = ''; // Nessuna gestione conflitti, fallirà su duplicati
      break;
  }

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${valuePlaceholders}
    ${conflictClause}
  `.trim();

  return { sql, values: [] }; // Nessun parametro separato, tutto nel SQL
}

// Endpoint GET per ottenere info sulla struttura
export async function GET() {
  return NextResponse.json({
    message: 'Travel Planner Bulk Insert API',
    supported_tables: ['cities', 'attractions', 'events'],
    usage: {
      endpoint: 'POST /api/admin/bulk-insert',
      body: {
        table: 'cities | attractions | events',
        data: 'Array of records',
        batch_size: 'Optional, default 50',
        on_conflict: 'skip | update | error (default: update)'
      }
    },
    examples: {
      cities: {
        table: 'cities',
        data: [{
          country_code: 'IT',
          name: 'Rome',
          code: 'rome',
          type: 'major',
          region_name: 'Lazio',
          region_type: 'region',
          lat: 41.9028,
          lng: 12.4964,
          population: 2870000
        }]
      }
    }
  });
}