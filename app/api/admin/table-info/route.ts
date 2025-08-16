// app/api/admin/table-info/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface XataRecord {
  id: string;
  [key: string]: any;
}

interface TableInfo {
  tableName: string;
  totalRows: number;
  lastRows: XataRecord[];
  success: boolean;
  error?: string;
}

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

export async function GET(request: NextRequest): Promise<NextResponse<TableInfo>> {
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

  try {
    const baseUrl = `${XATA_DATABASE_URL}/tables/${table}`;
    
    // Chiamata per contare il totale delle righe
    const countResponse = await fetch(`${baseUrl}/aggregate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggs: {
          total: {
            count: "*"
          }
        }
      })
    });

    if (!countResponse.ok) {
      throw new Error(`Errore nel conteggio: ${countResponse.status}`);
    }

    const countData = await countResponse.json();
    const totalRows = countData.aggs?.total || 0;

    // Chiamata per ottenere le ultime 10 righe
    const rowsResponse = await fetch(`${baseUrl}/query`, {
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

    if (!rowsResponse.ok) {
      throw new Error(`Errore nel recupero righe: ${rowsResponse.status}`);
    }

    const rowsData = await rowsResponse.json();
    const lastRows = rowsData.records || [];

    return NextResponse.json({
      tableName: table,
      totalRows,
      lastRows,
      success: true
    });

  } catch (error) {
    console.error('Errore recupero info tabella:', error);
    
    return NextResponse.json({
      tableName: table,
      totalRows: 0,
      lastRows: [],
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}