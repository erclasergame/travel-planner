// app/api/admin/bulk-upload/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Headers CORS per permettere richieste da Claude.ai
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Gestione richieste OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// La tua funzione POST esistente con headers CORS aggiunti
export async function POST(request: NextRequest) {
  try {
    // Il tuo codice esistente per bulk-upload...
    const body = await request.json();
    
    // Esempio di risposta (sostituisci con la tua logica)
    const result = {
      success: true,
      message: 'Data uploaded successfully',
      count: body.data?.length || 0
    };

    // Ritorna con headers CORS
    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}