// app/api/admin/table-info/route.ts - Con conteggio preciso
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

    const recordsUrl = `${XATA_DATABASE_URL}/tables/${table}/query`;
    
    // FASE 1: Conta tutte le righe paginando
    let totalCount = 0;
    let allRecords: any[] = [];
    let cursor: string | undefined = undefined;
    let iterations = 0;
    const maxIterations = 20; // Protezione anti-loop infinito

    console.log('Iniziando conteggio preciso per tabella:', table);

    do {
      const queryBody: any = {
        page: {
          size: 100 // Pagine grandi per efficienza
        }
      };

      if (cursor) {
        queryBody.page.after = cursor;
      }

      const response = await fetch(recordsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Errore paginazione:', errorText);
        
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
      
      // Accumula tutti i records
      allRecords.push(...records);
      totalCount += records.length;
      
      // Aggiorna cursor per prossima pagina
      cursor = data.meta?.page?.cursor;
      iterations++;

      console.log(`Pagina ${iterations}: +${records.length} records (totale: ${totalCount})`);

      // Protezione anti-loop
      if (iterations >= maxIterations) {
        console.log('Raggiunto limite iterazioni, interrompo');
        break;
      }

    } while (cursor && iterations < maxIterations);

    console.log(`Conteggio completato: ${totalCount} righe totali`);

    // FASE 2: Prendi le ultime 10 righe (più recenti per data di creazione)
    const lastRows = allRecords
      .sort((a: any, b: any) => {
        const dateA = new Date(a['xata.createdAt'] || 0).getTime();
        const dateB = new Date(b['xata.createdAt'] || 0).getTime();
        return dateB - dateA; // Ordine decrescente (più recenti prima)
      })
      .slice(0, 10);

    return NextResponse.json({
      tableName: table,
      totalRows: totalCount, // Numero preciso!
      lastRows,
      success: true,
      debug: {
        iterations,
        pagesProcessed: iterations,
        maxReached: iterations >= maxIterations
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