// app/api/admin/table-info/route.ts - Versione con API Base Xata
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

    // Usa API base di Xata: GET /tables/{table}/records
    const baseUrl = `${XATA_DATABASE_URL}/tables/${table}/records`;
    
    // Chiamata per ottenere i primi records e stimare il totale
    const response = await fetch(`${baseUrl}?page[size]=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      return NextResponse.json({
        tableName: table,
        totalRows: 0,
        lastRows: [],
        success: false,
        error: `Errore API Xata: ${response.status} - ${errorText}`
      }, { status: 500 });
    }

    const data: any = await response.json();
    console.log('Xata response:', data);

    // Estrai i records
    const records = data.records || [];
    
    // Per il conteggio totale, usiamo una stima basata sui records disponibili
    // Se abbiamo meno di 20 records, quello è il totale
    // Se abbiamo esattamente 20, potrebbe esserci di più (stima approssimativa)
    const hasMore = data.meta?.page?.more || false;
    const totalRows = hasMore ? records.length + '+' : records.length;

    // Prendi solo gli ultimi 10 records (o meno se ce ne sono meno)
    const lastRows = records.slice(0, 10);

    return NextResponse.json({
      tableName: table,
      totalRows: hasMore ? `${records.length}+` : records.length,
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