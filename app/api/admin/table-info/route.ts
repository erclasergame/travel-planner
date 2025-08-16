// app/api/admin/table-info/route.ts - Versione corretta con Summarize
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

    // FASE 1: Count ESATTO e VELOCE con Summarize (come nel tuo esempio)
    const summarizeUrl = `${XATA_DATABASE_URL}/tables/${table}/summarize`;
    
    console.log('Getting exact count for table:', table);

    const countResponse = await fetch(summarizeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summaries: {
          total_rows: {
            count: "*"  // Esattamente come nel tuo esempio
          }
        }
      })
    });

    if (!countResponse.ok) {
      const errorText = await countResponse.text();
      console.log('Summarize error:', errorText);
      
      return NextResponse.json({
        tableName: table,
        totalRows: 0,
        lastRows: [],
        success: false,
        error: `Summarize API error: ${countResponse.status} - ${errorText}`
      }, { status: 500 });
    }

    const countData: any = await countResponse.json();
    console.log('Summarize response:', JSON.stringify(countData, null, 2));
    
    // Accesso corretto al risultato (come nel tuo esempio)
    const totalRows = countData.records?.[0]?.total_rows || 0;
    
    console.log('Exact count result:', totalRows);

    // FASE 2: Prendi le ultime 10 righe
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
      console.log('Got', lastRows.length, 'recent rows');
    } else {
      console.log('Could not get recent rows, but count succeeded');
    }

    return NextResponse.json({
      tableName: table,
      totalRows, // Numero ESATTO dal summarize!
      lastRows,
      success: true,
      debug: {
        method: 'summarize',
        rawCountData: countData // Debug per vedere la struttura
      }
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