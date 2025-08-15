// API Test Connessione Database
// File: app/api/database/test/route.ts

import { NextRequest, NextResponse } from 'next/server';
import xataClient, { XataHelper } from '@/lib/xata';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');

    // Test basic connection
    const connectionTest = await XataHelper.testConnection();
    
    if (!connectionTest) {
      throw new Error('Connection test failed');
    }

    // Test table access
    const continents = await xataClient.db.continents.getAll();
    const countries = await xataClient.db.countries.getAll();
    const regions = await xataClient.db.regions.getAll();
    const cities = await xataClient.db.cities.getAll();
    const attractions = await xataClient.db.attractions.getAll();
    const events = await xataClient.db.events.getAll();

    console.log('✅ Database connection successful');

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      stats: {
        continents: continents.length,
        countries: countries.length,
        regions: regions.length,
        cities: cities.length,
        attractions: attractions.length,
        events: events.length,
      },
      environment: {
        database_url: process.env.XATA_DATABASE_URL ? 'configured' : 'missing',
        api_key: process.env.XATA_API_KEY ? 'configured' : 'missing',
        branch: process.env.XATA_BRANCH || 'main',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error('❌ Database test failed:', error);
    
    const err = error as Error;
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: err.message,
      environment: {
        database_url: process.env.XATA_DATABASE_URL ? 'configured' : 'missing',
        api_key: process.env.XATA_API_KEY ? 'configured' : 'missing',
        branch: process.env.XATA_BRANCH || 'main',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST - Popola dati iniziali di test
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Populating initial test data...');

    // Crea continente Europa se non esiste
    let europa = await xataClient.db.continents
      .filter({ code: 'EU' })
      .getFirst();

    if (!europa) {
      europa = await xataClient.db.continents.create({
        name: 'Europa',
        code: 'EU',
      });
      console.log('✅ Created continent Europa');
    }

    // Crea Italia se non esiste
    let italia = await xataClient.db.countries
      .filter({ code: 'IT' })
      .getFirst();

    if (!italia) {
      italia = await xataClient.db.countries.create({
        continent_id: europa.id,
        name: 'Italia',
        code: 'IT',
        flag_url: '🇮🇹',
      });
      console.log('✅ Created country Italia');
    }

    // Crea Lazio se non esiste
    let lazio = await xataClient.db.regions
      .filter({ name: 'Lazio' })
      .getFirst();

    if (!lazio) {
      lazio = await xataClient.db.regions.create({
        country_id: italia.id,
        name: 'Lazio',
        type: 'region',
      });
      console.log('✅ Created region Lazio');
    }

    // Crea Roma se non esiste
    let roma = await xataClient.db.cities
      .filter({ name: 'Roma' })
      .getFirst();

    if (!roma) {
      roma = await xataClient.db.cities.create({
        region_id: lazio.id,
        name: 'Roma',
        type: 'major',
        lat: 41.9028,
        lng: 12.4964,
        population: 2870000,
      });
      console.log('✅ Created city Roma');
    }

    // Crea alcune attrazioni test se non esistono
    const existingAttractions = await xataClient.db.attractions
      .filter({ city_id: roma.id })
      .getAll();

    if (existingAttractions.length === 0) {
      const testAttractions = [
        {
          city_id: roma.id,
          name: 'Colosseo',
          description: 'Il più grande anfiteatro mai costruito',
          type: 'monument' as const,
          subtype: 'historical',
          lat: 41.8902,
          lng: 12.4922,
          visit_duration: '2h30m',
          cost_range: '€16',
          is_active: true,
        },
        {
          city_id: roma.id,
          name: 'Fontana di Trevi',
          description: 'La fontana più famosa di Roma',
          type: 'monument' as const,
          subtype: 'landmark',
          lat: 41.9009,
          lng: 12.4833,
          visit_duration: '30m',
          cost_range: 'Gratuito',
          is_active: true,
        },
        {
          city_id: roma.id,
          name: 'Musei Vaticani',
          description: 'Collezione d\'arte dei Papi',
          type: 'museum' as const,
          subtype: 'art',
          lat: 41.9066,
          lng: 12.4534,
          visit_duration: '3h',
          cost_range: '€21',
          is_active: true,
        }
      ];

      for (const attraction of testAttractions) {
        await xataClient.db.attractions.create(attraction);
      }
      
      console.log(`✅ Created ${testAttractions.length} test attractions`);
    }

    // Ottieni statistiche finali
    const stats = await Promise.all([
      xataClient.db.continents.getAll(),
      xataClient.db.countries.getAll(),
      xataClient.db.regions.getAll(),
      xataClient.db.cities.getAll(),
      xataClient.db.attractions.getAll(),
      xataClient.db.events.getAll(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Test data populated successfully',
      stats: {
        continents: stats[0].length,
        countries: stats[1].length,
        regions: stats[2].length,
        cities: stats[3].length,
        attractions: stats[4].length,
        events: stats[5].length,
      },
      created: {
        europa: !!europa,
        italia: !!italia,
        lazio: !!lazio,
        roma: !!roma,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error('❌ Test data population failed:', error);
    
    const err = error as Error;
    
    return NextResponse.json({
      success: false,
      error: 'Failed to populate test data',
      details: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}