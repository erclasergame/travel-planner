// API Test Connessione Database - Versione Semplificata
// File: app/api/database/test/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { XataHelper } from '@/lib/xata';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');

    // Test basic connection
    const connectionTest = await XataHelper.testConnection();
    
    if (!connectionTest) {
      throw new Error('Connection test failed');
    }

    // Count records in each table
    const continentsCount = await XataHelper.countRecords('continents');
    const countriesCount = await XataHelper.countRecords('countries');
    const regionsCount = await XataHelper.countRecords('regions');
    const citiesCount = await XataHelper.countRecords('cities');
    const attractionsCount = await XataHelper.countRecords('attractions');
    const eventsCount = await XataHelper.countRecords('events');

    console.log('✅ Database connection successful');

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      stats: {
        continents: continentsCount,
        countries: countriesCount,
        regions: regionsCount,
        cities: citiesCount,
        attractions: attractionsCount,
        events: eventsCount,
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

    // Crea continente Europa
    const europa = await XataHelper.createRecord('continents', {
      name: 'Europa',
      code: 'EU'
    });

    if (!europa) {
      throw new Error('Failed to create Europa continent');
    }

    console.log('✅ Created continent Europa:', europa.id);

    // Crea Italia
    const italia = await XataHelper.createRecord('countries', {
      continent_id: europa.id,
      name: 'Italia',
      code: 'IT',
      flag_url: '🇮🇹'
    });

    if (!italia) {
      throw new Error('Failed to create Italia country');
    }

    console.log('✅ Created country Italia:', italia.id);

    // Crea Lazio
    const lazio = await XataHelper.createRecord('regions', {
      country_id: italia.id,
      name: 'Lazio',
      type: 'region'
    });

    if (!lazio) {
      throw new Error('Failed to create Lazio region');
    }

    console.log('✅ Created region Lazio:', lazio.id);

    // Crea Roma
    const roma = await XataHelper.createRecord('cities', {
      region_id: lazio.id,
      name: 'Roma',
      type: 'major',
      lat: 41.9028,
      lng: 12.4964,
      population: 2870000
    });

    if (!roma) {
      throw new Error('Failed to create Roma city');
    }

    console.log('✅ Created city Roma:', roma.id);

    // Crea attrazioni test
    const testAttractions = [
      {
        city_id: roma.id,
        name: 'Colosseo',
        description: 'Il più grande anfiteatro mai costruito',
        type: 'monument',
        subtype: 'historical',
        lat: 41.8902,
        lng: 12.4922,
        visit_duration: '2h30m',
        cost_range: '€16',
        is_active: true
      },
      {
        city_id: roma.id,
        name: 'Fontana di Trevi',
        description: 'La fontana più famosa di Roma',
        type: 'monument',
        subtype: 'landmark',
        lat: 41.9009,
        lng: 12.4833,
        visit_duration: '30m',
        cost_range: 'Gratuito',
        is_active: true
      },
      {
        city_id: roma.id,
        name: 'Musei Vaticani',
        description: 'Collezione d\'arte dei Papi',
        type: 'museum',
        subtype: 'art',
        lat: 41.9066,
        lng: 12.4534,
        visit_duration: '3h',
        cost_range: '€21',
        is_active: true
      }
    ];

    let attractionsCreated = 0;
    for (const attraction of testAttractions) {
      const created = await XataHelper.createRecord('attractions', attraction);
      if (created) {
        attractionsCreated++;
        console.log(`✅ Created attraction: ${attraction.name}`);
      }
    }

    // Ottieni statistiche finali
    const finalStats = {
      continents: await XataHelper.countRecords('continents'),
      countries: await XataHelper.countRecords('countries'),
      regions: await XataHelper.countRecords('regions'),
      cities: await XataHelper.countRecords('cities'),
      attractions: await XataHelper.countRecords('attractions'),
      events: await XataHelper.countRecords('events'),
    };

    return NextResponse.json({
      success: true,
      message: 'Test data populated successfully',
      stats: finalStats,
      created: {
        europa_id: europa.id,
        italia_id: italia.id,
        lazio_id: lazio.id,
        roma_id: roma.id,
        attractions_created: attractionsCreated
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