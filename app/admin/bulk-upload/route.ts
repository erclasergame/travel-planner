import { NextRequest, NextResponse } from 'next/server';

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

if (!XATA_API_KEY || !XATA_DATABASE_URL) {
  throw new Error('Missing Xata configuration');
}

// Helper function for Xata API calls
async function xataInsert(tableName: string, recordData: any) {
  if (!XATA_DATABASE_URL) {
    throw new Error('XATA_DATABASE_URL not configured');
  }
  
  // Extract database and branch from URL
  const urlMatch = XATA_DATABASE_URL.match(/\/db\/([^:]+):(.+)$/);
  if (!urlMatch) {
    throw new Error('Invalid Xata database URL format');
  }

  const [, dbName, branch] = urlMatch;
  const baseUrl = XATA_DATABASE_URL.replace(/\/db\/.*$/, '');
  const endpoint = `/db/${dbName}:${branch}/tables/${tableName}/data`;
  const url = `${baseUrl}${endpoint}`;
  
  console.log('🔗 Xata insert URL:', url);
  console.log('📝 Record data:', recordData);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XATA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recordData),
  });

  console.log('📡 Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Xata error:', errorText);
    throw new Error(`Xata API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Validate table name
const validTables = ['continents', 'countries', 'regions', 'cities', 'attractions', 'events'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, data }: { table: string; data: any[] } = body;

    console.log(`🚀 [Bulk Upload] Table: ${table}, Records: ${data?.length || 0}`);

    // Validation
    if (!table || !validTables.includes(table)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid table name. Valid tables: ' + validTables.join(', ')
      }, { status: 400 });
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Data must be a non-empty array'
      }, { status: 400 });
    }

    if (data.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 100 records per upload'
      }, { status: 400 });
    }

    let insertedCount = 0;
    const errors: string[] = [];
    const insertedRecords: any[] = [];

    // Insert records one by one
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      try {
        console.log(`📝 [Bulk Upload] Inserting record ${i + 1}/${data.length}`);
        
        // Validate record is object
        if (!record || typeof record !== 'object') {
          throw new Error('Record must be an object');
        }

        // Insert to Xata
        const insertResult = await xataInsert(table, record);
        
        insertedCount++;
        insertedRecords.push(insertResult);
        
        console.log(`✅ [Bulk Upload] Inserted record ${i + 1}: ID ${insertResult.id}`);
        
      } catch (error: any) {
        const errorMsg = `Record ${i + 1}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ [Bulk Upload] ${errorMsg}`);
      }
    }

    const result = {
      success: insertedCount > 0,
      inserted: insertedCount,
      errors,
      details: {
        total: data.length,
        failed: errors.length,
        table: table
      },
      insertedRecords: insertedRecords.slice(0, 3) // Return first 3 for verification
    };

    console.log(`🎉 [Bulk Upload] Complete: ${insertedCount}/${data.length} inserted`);

    return NextResponse.json(result);

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ [Bulk Upload] API error:', err.message);
    
    return NextResponse.json({
      success: false,
      inserted: 0,
      errors: [err.message],
      details: {
        error: 'API_ERROR'
      }
    }, { status: 500 });
  }
}

// GET - Info about available tables
export async function GET() {
  return NextResponse.json({
    success: true,
    availableTables: validTables,
    maxRecordsPerUpload: 100,
    supportedFormats: ['JSON array'],
    endpoint: '/api/admin/bulk-upload',
    usage: {
      method: 'POST',
      body: {
        table: 'table_name',
        data: '[{record1}, {record2}]'
      }
    }
  });
}