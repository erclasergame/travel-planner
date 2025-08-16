// app/api/admin/table-info/route.ts - Versione DEBUG COMPLETA
import { NextRequest, NextResponse } from 'next/server';

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    console.log('=== DEBUG START ===');
    console.log('Table requested:', table);
    console.log('XATA_API_KEY exists:', !!XATA_API_KEY);
    console.log('XATA_DATABASE_URL:', XATA_DATABASE_URL);

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

    // TEST 1: Prova prima con il metodo query normale per vedere se funziona
    const queryUrl = `${XATA_DATABASE_URL}/tables/${table}/query`;
    console.log('Testing query URL:', queryUrl);
    
    const testResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: { size: 5 }
      })
    });

    console.log('Query test status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData: any = await testResponse.json();
      console.log('Query test SUCCESS. Records found:', testData.records?.length || 0);
      console.log('Query test data structure:', Object.keys(testData));
      
      if (testData.records && testData.records.length > 0) {
        console.log('Sample record:', testData.records[0]);
      }
    } else {
      const testError = await testResponse.text();
      console.log('Query test FAILED:', testError);
    }

    // TEST 2: Ora prova summarize
    const summarizeUrl = `${XATA_DATABASE_URL}/tables/${table}/summarize`;
    console.log('Testing summarize URL:', summarizeUrl);
    
    const summarizeBody = {
      summaries: {
        total_rows: {
          count: "*"
        }
      }
    };
    
    console.log('Summarize request body:', JSON.stringify(summarizeBody, null, 2));

    const countResponse = await fetch(summarizeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summarizeBody)
    });

    console.log('Summarize response status:', countResponse.status);
    console.log('Summarize response headers:', Object.fromEntries(countResponse.headers.entries()));

    const countResponseText = await countResponse.text();
    console.log('Summarize raw response:', countResponseText);

    let countData: any = {};
    let totalRows = 0;

    if (countResponse.ok) {
      try {
        countData = JSON.parse(countResponseText);
        console.log('Summarize parsed data:', JSON.stringify(countData, null, 2));
        
        totalRows = countData.records?.[0]?.total_rows || 0;
        console.log('Extracted total_rows:', totalRows);
      } catch (parseError) {
        console.log('Failed to parse summarize response:', parseError);
      }
    } else {
      console.log('Summarize FAILED with status:', countResponse.status);
    }

    return NextResponse.json({
      tableName: table,
      totalRows,
      lastRows: [], // Vuoto per ora, focus sul debug count
      success: countResponse.ok,
      debug: {
        queryTest: testResponse.ok,
        summarizeStatus: countResponse.status,
        summarizeRawResponse: countResponseText,
        countData,
        extractedTotal: totalRows,
        summarizeUrl,
        requestBody: summarizeBody
      }
    });

  } catch (error) {
    console.error('=== DEBUG ERROR ===', error);
    
    return NextResponse.json({
      tableName: '',
      totalRows: 0,
      lastRows: [],
      success: false,
      error: `Debug error: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      debug: {
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}