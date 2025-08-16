// app/api/admin/table-info/route.ts - Versione Debug Semplificata
import { NextRequest, NextResponse } from 'next/server';

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    // Debug: Log delle variabili
    console.log('Table requested:', table);
    console.log('XATA_API_KEY exists:', !!XATA_API_KEY);
    console.log('XATA_DATABASE_URL:', XATA_DATABASE_URL?.substring(0, 50) + '...');

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
        error: `Configurazione mancante - API_KEY: ${!!XATA_API_KEY}, URL: ${!!XATA_DATABASE_URL}`
      }, { status: 500 });
    }

    // Test semplice: prima proviamo solo a contare
    const baseUrl = `${XATA_DATABASE_URL}/tables/${table}`;
    console.log('Calling URL:', baseUrl + '/aggregate');
    
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

    console.log('Count response status:', countResponse.status);
    
    if (!countResponse.ok) {
      const errorText = await countResponse.text();
      console.log('Count error text:', errorText);
      
      return NextResponse.json({
        tableName: table,
        totalRows: 0,
        lastRows: [],
        success: false,
        error: `Errore conteggio: ${countResponse.status} - ${errorText}`
      }, { status: 500 });
    }

    const countData: any = await countResponse.json();
    console.log('Count data:', countData);
    
    const totalRows = countData.aggs?.total || 0;

    // Per ora ritorniamo solo il conteggio, senza le righe
    return NextResponse.json({
      tableName: table,
      totalRows,
      lastRows: [], // Vuoto per ora
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