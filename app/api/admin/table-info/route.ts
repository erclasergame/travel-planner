// app/api/admin/table-info/route.ts - Parsing CORRETTO!
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

    // FASE 1: Count ESATTO con Summarize
    const summarizeUrl = `${XATA_DATABASE_URL}/tables/${table}/summarize`;
    
    const countResponse = await fetch(summarizeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summaries: {
          total_rows: {
            count: "*"
          }
        }
      })
    });

    if (!countResponse.ok) {
      const errorText = await countResponse.text();
      
      return NextResponse.json({
        tableName: table,
        totalRows: 0,
        lastRows: [],
        success: false,
        error: `Summarize API error: ${countResponse.status} - ${errorText}`
      }, { status: 500 });
    }

    const countData: any = await countResponse.json();
    
    // 🎯 PARSING CORRETTO: summaries non records!
    const totalRows = countData.summaries?.[0]?.total_rows || 0;

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
    }

    return NextResponse.json({
      tableName: table,
      totalRows, // Ora dovrebbe essere 8 per continents!
      lastRows,
      success: true
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