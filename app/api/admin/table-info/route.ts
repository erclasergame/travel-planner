// app/api/admin/table-info/route.ts - Con URL format corretto
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

    // URL format corretto come negli altri endpoint funzionanti
    // XATA_DATABASE_URL include già il path completo
    const recordsUrl = `${XATA_DATABASE_URL}/tables/${table}/query`;
    
    console.log('Calling URL:', recordsUrl);

    // Usa POST /query invece di GET /records (come negli altri endpoint)
    const response = await fetch(recordsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: {
          size: 20
        }
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      return NextResponse.json({
        tableName: table,
        totalRows: 0,
        lastRows: [],
        success: false,
        error: `Errore API: ${response.status} - ${errorText}`
      }, { status: 500 });
    }

    const data: any = await response.json();
    console.log('Success response:', JSON.stringify(data, null, 2));

    // Estrai i records dalla risposta
    const records = data.records || [];
    
    // Stima del totale basata sui records disponibili
    const hasMore = data.meta?.page?.more || false;
    const totalRows = hasMore ? `${records.length}+` : records.length;

    // Prendi solo i primi 10 records
    const lastRows = records.slice(0, 10);

    return NextResponse.json({
      tableName: table,
      totalRows,
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