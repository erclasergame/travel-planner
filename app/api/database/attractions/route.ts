// API Cerca Attrazioni nel Database
// File: app/api/database/attractions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import xataClient, { XataHelper, Attraction, City } from '@/lib/xata';

// GET - Cerca attrazioni per città
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get('city');
    const type = url.searchParams.get('type');
    const minCount = parseInt(url.searchParams.get('minCount') || '0');

    if (!city) {
      return NextResponse.json({
        success: false,
        error: 'Parameter "city" is required'
      }, { status: 400 });
    }

    console.log(`🔍 Searching attractions for city: ${city}, type: ${type || 'all'}`);

    // Debug URL construction
    console.log('Database URL:', process.env.XATA_DATABASE_URL);
    console.log('API Key configured:', !!process.env.XATA_API_KEY);
    
    // Cerca città nel database
    const foundCity = await XataHelper.findCityByName(city);
    
    if (!foundCity) {
      console.log(`❌ City "${city}" not found in database`);
      return NextResponse.json({
        success: false,
        found: false,
        city: city,
        message: `City "${city}" not found in database`,
        attractions: [],
        suggestions: {
          useAI: true,
          reason: 'city_not_in_database'
        }
      });
    }

    // Cerca attrazioni per la città
    const attractions = await XataHelper.getAttractionsByCity(foundCity.id, type || undefined);
    const events = await XataHelper.getEventsByCity(foundCity.id);

    console.log(`✅ Found ${attractions.length} attractions and ${events.length} events for ${city}`);

    // Controlla se abbiamo abbastanza contenuto
    const totalContent = attractions.length + events.length;
    const hasEnoughContent = totalContent >= minCount;

    return NextResponse.json({
      success: true,
      found: true,
      city: {
        id: foundCity.id,
        name: foundCity.name,
        coordinates: [foundCity.lat, foundCity.lng],
        type: foundCity.type
      },
      attractions: attractions.map(attraction => ({
        id: attraction.id,
        name: attraction.name,
        description: attraction.description,
        type: attraction.type,
        subtype: attraction.subtype,
        coordinates: [attraction.lat, attraction.lng],
        duration: attraction.visit_duration,
        cost: attraction.cost_range,
        image_url: attraction.image_url,
        verified: !!attraction.last_verified
      })),
      events: events.map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        season: event.season,
        duration: event.duration,
        cost: event.cost_range,
        recurrence: event.recurrence_rule
      })),
      stats: {
        attractions_count: attractions.length,
        events_count: events.length,
        total_content: totalContent,
        has_enough_content: hasEnoughContent,
        min_required: minCount
      },
      suggestions: {
        useAI: !hasEnoughContent,
        reason: hasEnoughContent ? 'sufficient_content' : 'insufficient_content',
        recommendation: hasEnoughContent 
          ? 'Use database content for itinerary' 
          : 'Supplement with AI search'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('❌ Error searching attractions:', error);
    
    const err = error as Error;
    
    return NextResponse.json({
      success: false,
      error: 'Database search failed',
      details: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST - Salva nuove attrazioni trovate dall'AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, attractions, source = 'ai_discovery' } = body;

    if (!city || !attractions || !Array.isArray(attractions)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected: { city: string, attractions: Attraction[] }'
      }, { status: 400 });
    }

    console.log(`💾 Saving ${attractions.length} attractions for ${city}`);

    // Cerca o crea città
    let foundCity = await XataHelper.findCityByName(city);
    
    if (!foundCity) {
      console.log(`❌ City "${city}" not found. Cannot save attractions without city record.`);
      return NextResponse.json({
        success: false,
        error: `City "${city}" not found in database. Please add city first.`,
        saved: [],
        skipped: attractions.length
      }, { status: 400 });
    }

    const savedAttractions = [];
    const skippedAttractions = [];

    for (const attraction of attractions) {
      try {
        // Controlla se attrazione già esistente
        const existing = await xataClient.db.attractions
          .filter({ 
            city_id: foundCity.id, 
            name: { $iContains: attraction.name } 
          })
          .getFirst();

        if (existing) {
          console.log(`⏭️ Skipping existing attraction: ${attraction.name}`);
          skippedAttractions.push({
            name: attraction.name,
            reason: 'already_exists',
            existing_id: existing.id
          });
          continue;
        }

        // Salva nuova attrazione
        const saved = await XataHelper.saveAttraction({
          city_id: foundCity.id,
          name: attraction.name,
          description: attraction.description || '',
          type: attraction.type || 'attraction',
          subtype: attraction.subtype,
          lat: attraction.lat || foundCity.lat,
          lng: attraction.lng || foundCity.lng,
          visit_duration: attraction.duration,
          cost_range: attraction.cost,
          image_url: attraction.image_url,
          image_alt: attraction.image_alt,
          is_active: true
        });

        if (saved) {
          savedAttractions.push({
            id: saved.id,
            name: saved.name,
            type: saved.type
          });
          console.log(`✅ Saved attraction: ${attraction.name}`);
        } else {
          skippedAttractions.push({
            name: attraction.name,
            reason: 'save_failed'
          });
        }

      } catch (error: unknown) {
        console.error(`❌ Error saving attraction ${attraction.name}:`, error);
        skippedAttractions.push({
          name: attraction.name,
          reason: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${attractions.length} attractions for ${city}`,
      city: {
        id: foundCity.id,
        name: foundCity.name
      },
      results: {
        total_processed: attractions.length,
        saved_count: savedAttractions.length,
        skipped_count: skippedAttractions.length,
        saved: savedAttractions,
        skipped: skippedAttractions
      },
      source,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('❌ Error saving attractions:', error);
    
    const err = error as Error;
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save attractions',
      details: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}