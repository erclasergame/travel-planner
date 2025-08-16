// app/api/admin/table-info/route.ts - Metodo veloce e intelligente
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

    const queryUrl = `${XATA_DATABASE_URL}/tables/${table}/query`;
    
    console.log('Getting smart count for table:', table);

    // STRATEGIA VELOCE: 
    // 1. Prendi una pagina grande (200 records)
    // 2. Se è piena, fai binary search per stimare il totale
    // 3. Se non è piena, quello è il totale esatto
    
    const response = await fetch(queryUrl, {
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
          size: 200 // Pagina grande per efficienza
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Query error:', errorText);
      
      return NextResponse.json({
        tableName: table,
        totalRows: 0,
        lastRows: [],
        success: false,
        error: `Errore API: ${response.status} - ${errorText}`
      }, { status: 500 });
    }

    const data: any = await response.json();
    const records = data.records || [];
    const hasMore = data.meta?.page?.more || false;
    
    console.log(`Prima pagina: ${records.length} records, hasMore: ${hasMore}`);

    let totalRows: number | string;
    
    if (!hasMore) {
      // Caso semplice: meno di 200 records, questo è il totale esatto
      totalRows = records.length;
      console.log(`Totale esatto: ${totalRows}`);
    } else {
      // Caso complesso: più di 200 records
      // Facciamo una stima veloce con offset
      totalRows = await estimateTotal(table, records.length);
    }

    // Prendi le ultime 10 righe
    const lastRows = records.slice(0, 10);

    return NextResponse.json({
      tableName: table,
      totalRows,
      lastRows,
      success: true,
      debug: {
        firstPageSize: records.length,
        hasMore,
        method: hasMore ? 'estimated' : 'exact'
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

// Funzione per stimare il totale velocemente
async function estimateTotal(table: string, firstPageSize: number): Promise<number | string> {
  try {
    const queryUrl = `${XATA_DATABASE_URL}/tables/${table}/query`;
    
    // Prova offset a 500, 1000, 2000 per capire la dimensione
    const testOffsets = [500, 1000, 2000];
    
    for (const offset of testOffsets) {
      console.log(`Testing offset ${offset}...`);
      
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: {
            size: 10, // Solo un piccolo sample
            offset: offset
          }
        })
      });

      if (!response.ok) {
        console.log(`Offset ${offset} failed, assuming table is smaller`);
        return firstPageSize + '+';
      }

      const data: any = await response.json();
      const records = data.records || [];
      
      if (records.length === 0) {
        // Trovato il limite! Il totale è tra l'offset precedente e questo
        const prevOffset = testOffsets[testOffsets.indexOf(offset) - 1] || 0;
        console.log(`Table size is between ${prevOffset} and ${offset}`);
        return `~${offset}`;
      }
    }
    
    // Se arriviamo qui, la tabella ha più di 2000 records
    console.log('Table has more than 2000 records');
    return '2000+';
    
  } catch (error) {
    console.log('Estimation failed:', error);
    return firstPageSize + '+';
  }
}