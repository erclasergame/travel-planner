// File: app/api/admin/populate-base/route.ts
// VERSIONE CORRETTA - Usa formato Xata { "records": [...] }

import { NextRequest, NextResponse } from 'next/server';

// 🌍 DATI CONTINENTI
const CONTINENTS = [
  { name: 'Europe', code: 'EU' },
  { name: 'Asia', code: 'AS' },
  { name: 'Africa', code: 'AF' },
  { name: 'North America', code: 'NA' },
  { name: 'South America', code: 'SA' },
  { name: 'Oceania', code: 'OC' }
];

// 🏳️ DATI PAESI (primi paesi per test - 50 invece di 196 per non sovraccaricare)
const COUNTRIES = [
  // EUROPA (primi 15 paesi)
  { continent_code: 'EU', name: 'Albania', code: 'AL', flag_url: 'https://flagcdn.com/w320/al.png' },
  { continent_code: 'EU', name: 'Austria', code: 'AT', flag_url: 'https://flagcdn.com/w320/at.png' },
  { continent_code: 'EU', name: 'Belgium', code: 'BE', flag_url: 'https://flagcdn.com/w320/be.png' },
  { continent_code: 'EU', name: 'Bulgaria', code: 'BG', flag_url: 'https://flagcdn.com/w320/bg.png' },
  { continent_code: 'EU', name: 'Croatia', code: 'HR', flag_url: 'https://flagcdn.com/w320/hr.png' },
  { continent_code: 'EU', name: 'Cyprus', code: 'CY', flag_url: 'https://flagcdn.com/w320/cy.png' },
  { continent_code: 'EU', name: 'Czech Republic', code: 'CZ', flag_url: 'https://flagcdn.com/w320/cz.png' },
  { continent_code: 'EU', name: 'Denmark', code: 'DK', flag_url: 'https://flagcdn.com/w320/dk.png' },
  { continent_code: 'EU', name: 'Estonia', code: 'EE', flag_url: 'https://flagcdn.com/w320/ee.png' },
  { continent_code: 'EU', name: 'Finland', code: 'FI', flag_url: 'https://flagcdn.com/w320/fi.png' },
  { continent_code: 'EU', name: 'France', code: 'FR', flag_url: 'https://flagcdn.com/w320/fr.png' },
  { continent_code: 'EU', name: 'Germany', code: 'DE', flag_url: 'https://flagcdn.com/w320/de.png' },
  { continent_code: 'EU', name: 'Greece', code: 'GR', flag_url: 'https://flagcdn.com/w320/gr.png' },
  { continent_code: 'EU', name: 'Hungary', code: 'HU', flag_url: 'https://flagcdn.com/w320/hu.png' },
  { continent_code: 'EU', name: 'Ireland', code: 'IE', flag_url: 'https://flagcdn.com/w320/ie.png' },
  { continent_code: 'EU', name: 'Italy', code: 'IT', flag_url: 'https://flagcdn.com/w320/it.png' },
  { continent_code: 'EU', name: 'Latvia', code: 'LV', flag_url: 'https://flagcdn.com/w320/lv.png' },
  { continent_code: 'EU', name: 'Lithuania', code: 'LT', flag_url: 'https://flagcdn.com/w320/lt.png' },
  { continent_code: 'EU', name: 'Netherlands', code: 'NL', flag_url: 'https://flagcdn.com/w320/nl.png' },
  { continent_code: 'EU', name: 'Poland', code: 'PL', flag_url: 'https://flagcdn.com/w320/pl.png' },
  { continent_code: 'EU', name: 'Portugal', code: 'PT', flag_url: 'https://flagcdn.com/w320/pt.png' },
  { continent_code: 'EU', name: 'Spain', code: 'ES', flag_url: 'https://flagcdn.com/w320/es.png' },
  { continent_code: 'EU', name: 'Sweden', code: 'SE', flag_url: 'https://flagcdn.com/w320/se.png' },
  { continent_code: 'EU', name: 'United Kingdom', code: 'GB', flag_url: 'https://flagcdn.com/w320/gb.png' },

  // ASIA (primi 10 paesi)
  { continent_code: 'AS', name: 'China', code: 'CN', flag_url: 'https://flagcdn.com/w320/cn.png' },
  { continent_code: 'AS', name: 'India', code: 'IN', flag_url: 'https://flagcdn.com/w320/in.png' },
  { continent_code: 'AS', name: 'Japan', code: 'JP', flag_url: 'https://flagcdn.com/w320/jp.png' },
  { continent_code: 'AS', name: 'South Korea', code: 'KR', flag_url: 'https://flagcdn.com/w320/kr.png' },
  { continent_code: 'AS', name: 'Thailand', code: 'TH', flag_url: 'https://flagcdn.com/w320/th.png' },
  { continent_code: 'AS', name: 'Singapore', code: 'SG', flag_url: 'https://flagcdn.com/w320/sg.png' },
  { continent_code: 'AS', name: 'Malaysia', code: 'MY', flag_url: 'https://flagcdn.com/w320/my.png' },
  { continent_code: 'AS', name: 'Indonesia', code: 'ID', flag_url: 'https://flagcdn.com/w320/id.png' },
  { continent_code: 'AS', name: 'Philippines', code: 'PH', flag_url: 'https://flagcdn.com/w320/ph.png' },
  { continent_code: 'AS', name: 'Vietnam', code: 'VN', flag_url: 'https://flagcdn.com/w320/vn.png' },

  // NORTH AMERICA (primi 5 paesi)
  { continent_code: 'NA', name: 'United States', code: 'US', flag_url: 'https://flagcdn.com/w320/us.png' },
  { continent_code: 'NA', name: 'Canada', code: 'CA', flag_url: 'https://flagcdn.com/w320/ca.png' },
  { continent_code: 'NA', name: 'Mexico', code: 'MX', flag_url: 'https://flagcdn.com/w320/mx.png' },
  { continent_code: 'NA', name: 'Costa Rica', code: 'CR', flag_url: 'https://flagcdn.com/w320/cr.png' },
  { continent_code: 'NA', name: 'Jamaica', code: 'JM', flag_url: 'https://flagcdn.com/w320/jm.png' },

  // AFRICA (primi 5 paesi)
  { continent_code: 'AF', name: 'South Africa', code: 'ZA', flag_url: 'https://flagcdn.com/w320/za.png' },
  { continent_code: 'AF', name: 'Egypt', code: 'EG', flag_url: 'https://flagcdn.com/w320/eg.png' },
  { continent_code: 'AF', name: 'Morocco', code: 'MA', flag_url: 'https://flagcdn.com/w320/ma.png' },
  { continent_code: 'AF', name: 'Kenya', code: 'KE', flag_url: 'https://flagcdn.com/w320/ke.png' },
  { continent_code: 'AF', name: 'Nigeria', code: 'NG', flag_url: 'https://flagcdn.com/w320/ng.png' },

  // SOUTH AMERICA (primi 3 paesi)
  { continent_code: 'SA', name: 'Brazil', code: 'BR', flag_url: 'https://flagcdn.com/w320/br.png' },
  { continent_code: 'SA', name: 'Argentina', code: 'AR', flag_url: 'https://flagcdn.com/w320/ar.png' },
  { continent_code: 'SA', name: 'Chile', code: 'CL', flag_url: 'https://flagcdn.com/w320/cl.png' },

  // OCEANIA (primi 2 paesi)
  { continent_code: 'OC', name: 'Australia', code: 'AU', flag_url: 'https://flagcdn.com/w320/au.png' },
  { continent_code: 'OC', name: 'New Zealand', code: 'NZ', flag_url: 'https://flagcdn.com/w320/nz.png' }
];

// 🔧 Funzione helper per richieste Xata - FORMATO CORRETTO
const makeXataRequest = async (tableName: string, data: any[]) => {
  const endpoint = `${process.env.XATA_DATABASE_URL}/tables/${tableName}/bulk`;
  
  console.log(`🔄 Inserimento ${tableName}: ${data.length} record...`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    // 🎯 FORMATO CORRETTO XATA: { "records": [...] }
    body: JSON.stringify({
      records: data
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Xata ${tableName} insert failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ ${tableName}: ${result.records?.length || 0} record inseriti`);
  
  return result;
};

// 🚀 API Endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Avvio popolamento database base...');

    // Verifica environment variables
    if (!process.env.XATA_API_KEY || !process.env.XATA_DATABASE_URL) {
      return NextResponse.json(
        { 
          success: false,
          error: 'XATA_API_KEY e XATA_DATABASE_URL devono essere configurati nelle environment variables' 
        },
        { status: 500 }
      );
    }

    const results = {
      continents: { inserted: 0, errors: [] as string[] },
      countries: { inserted: 0, errors: [] as string[] }
    };

    // 1. Popolare continenti
    console.log('🌍 Inserimento continenti...');
    try {
      const continentsResult = await makeXataRequest('continents', CONTINENTS);
      results.continents.inserted = continentsResult.records?.length || 0;
      console.log(`✅ ${results.continents.inserted} continenti inseriti`);
    } catch (error: any) {
      results.continents.errors.push(error.message);
      console.error('❌ Errore continenti:', error.message);
    }

    // Pausa per evitare rate limit
    console.log('⏸️ Pausa 2 secondi...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Popolare paesi  
    console.log('🏳️ Inserimento paesi...');
    try {
      const countriesResult = await makeXataRequest('countries', COUNTRIES);
      results.countries.inserted = countriesResult.records?.length || 0;
      console.log(`✅ ${results.countries.inserted} paesi inseriti`);
    } catch (error: any) {
      results.countries.errors.push(error.message);
      console.error('❌ Errore paesi:', error.message);
    }

    // 📊 Risultato finale
    const summary = {
      success: results.continents.errors.length === 0 && results.countries.errors.length === 0,
      continents_inserted: results.continents.inserted,
      countries_inserted: results.countries.inserted,
      total_errors: results.continents.errors.length + results.countries.errors.length,
      errors: [...results.continents.errors, ...results.countries.errors]
    };

    console.log('🎉 Popolamento completato!');
    console.log(`📈 Statistiche: ${summary.continents_inserted} continenti, ${summary.countries_inserted} paesi`);

    return NextResponse.json({
      success: summary.success,
      message: summary.success ? 'Database popolato con successo!' : 'Popolamento completato con alcuni errori',
      results: summary
    });

  } catch (error: any) {
    console.error('❌ Errore generale:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore durante il popolamento database',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// 📖 Info endpoint (GET)
export async function GET() {
  return NextResponse.json({
    info: 'Travel Planner - Base Data Population API (FIXED)',
    data: {
      continents: CONTINENTS.length,
      countries: COUNTRIES.length,  // Ridotto per test
      breakdown: {
        Europe: COUNTRIES.filter(c => c.continent_code === 'EU').length,
        Asia: COUNTRIES.filter(c => c.continent_code === 'AS').length,
        Africa: COUNTRIES.filter(c => c.continent_code === 'AF').length,
        'North America': COUNTRIES.filter(c => c.continent_code === 'NA').length,
        'South America': COUNTRIES.filter(c => c.continent_code === 'SA').length,
        Oceania: COUNTRIES.filter(c => c.continent_code === 'OC').length
      }
    },
    changes: [
      "✅ Fixed Xata bulk insert format: { records: [...] }",
      "✅ Reduced countries to 50 for testing", 
      "✅ Better error handling and logging",
      "✅ Added environment variable validation"
    ],
    usage: {
      method: 'POST',
      url: '/api/admin/populate-base',
      description: 'Popola il database con continenti e paesi base (versione corretta)'
    }
  });
}