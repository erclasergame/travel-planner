// app/api/admin/table-info/route.ts - Versione VELOCE con Summarize API
import { NextRequest, NextResponse } from 'next/server';

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({
        tableName: '',
        totalRows: 0,
        lastRows: [],
        success: false,
        error: 'Nome tabella mancante'
      }, { status: 400 });
    }

    if (!XATA_API_KEY || !XATA_DATABASE_URL) {
      return NextResponse.json({
        tableName: table,
        totalRows: 0,
        lastRows: [],
        success: false,
        error: 'Configurazione database mancante'
      }, { status: 500 });
    }

    // FASE 1: Count veloce con Summarize API
    const summarizeUrl = `${XATA_DATABASE_URL}/tables/${table}/summarize`;
    
    console.log('Getting fast count for table:', table);

    const countResponse = await fetch(summarizeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        columns: [], // No grouping = data from entire table
        summaries: {
          total: {
            count: "*" // Count all records (including nulls)
          }
        }
      })
    });

    if (!countResponse.ok) {
      const errorText = await countResponse.text();
      console.log('Summarize error:', errorText);
      
      // Fallback: se summarize non funziona, usa la query normale
      console.log('Fallback to query method...');
      return await fallbackToQuery(table);
    }

    const countData: any = await countResponse.json();
    const totalRows = countData.records?.[0]?.total || 0;
    
    console.log('Fast count result:', totalRows);

    // FASE 2: Prendi le ultime 10 righe con query normale
    const queryUrl = `${XATA_DATABASE_URL}/tables/${table}/query`;
    
    const rowsResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sort: [
          { "xata.createdAt": "desc" }
        ],
        page: {
          size: 10
        }
      })
    });

    let lastRows: any[] = [];
    
    if (rowsResponse.ok) {
      const rowsData: any = await rowsResponse.json();
      lastRows = rowsData.records || [];
    } else {
      console.log('Could not get last rows, but count succeeded');
    }

    return NextResponse.json({
      tableName: table,
      totalRows, // Numero PRECISO e VELOCE!
      lastRows,
      success: true,
      method: 'summarize' // Debug info
    });

  } catch (error) {
    console.error('Errore completo:', error);
    
    return NextResponse.json({
      tableName: '',
      totalRows: 0,
      lastRows: [],
      success: false,
      error: `Errore interno: ${error instanceof Error ? error.message : 'Sconosciuto'}`
    }, { status: 500 });
  }
}

// Fallback function se summarize non funziona
async function fallbackToQuery(table: string) {
  try {
    const queryUrl = `${XATA_DATABASE_URL}/tables/${table}/query`;
    
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: { size: 20 }
      })
    });

    if (!response.ok) {
      throw new Error(`Query fallback failed: ${response.status}`);
    }

    const data: any = await response.json();
    const records = data.records || [];
    const hasMore = data.meta?.page?.more || false;
    
    return NextResponse.json({
      tableName: table,
      totalRows: hasMore ? `${records.length}+` : records.length,
      lastRows: records.slice(0, 10),
      success: true,
      method: 'fallback' // Debug info
    });

  } catch (error) {
    return NextResponse.json({
      tableName: table,
      totalRows: 0,
      lastRows: [],
      success: false,
      error: `Fallback failed: ${error instanceof Error ? error.message : 'Unknown'}`
    }, { status: 500 });
  }
}