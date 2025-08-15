import { NextRequest, NextResponse } from 'next/server';

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL;

if (!XATA_API_KEY || !XATA_DATABASE_URL) {
  throw new Error('Missing Xata configuration');
}

// Helper function for Xata API calls
async function xataQuery(endpoint: string, options: any = {}) {
  const url = `${XATA_DATABASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: {
      'Authorization': `Bearer ${XATA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Xata API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityName = searchParams.get('city');
    const type = searchParams.get('type'); // optional filter

    if (!cityName) {
      return NextResponse.json({
        success: false,
        error: 'City parameter required'
      }, { status: 400 });
    }

    console.log('🔍 Searching for city:', cityName);

    // Step 1: Find the city
    const cityQuery = {
      filter: {
        name: { $icontains: cityName } // Case insensitive search
      }
    };

    const cityResult = await xataQuery('/tables/cities/query', {
      body: cityQuery
    });

    if (!cityResult.records || cityResult.records.length === 0) {
      console.log('❌ City not found:', cityName);
      return NextResponse.json({
        success: false,
        found: false,
        city: cityName,
        message: `City "${cityName}" not found in database`,
        attractions: [],
        suggestions: {
          useAI: true,
          reason: 'city_not_in_database'
        }
      });
    }

    const city = cityResult.records[0];
    console.log('✅ City found:', city.name, 'ID:', city.id);

    // Step 2: Get attractions for this city
    const attractionFilter: any = {
      city_id: city.id // Use the city ID to find attractions
    };

    // Add type filter if specified
    if (type) {
      attractionFilter.type = type;
    }

    const attractionQuery = {
      filter: attractionFilter
    };

    console.log('🎯 Attraction query:', JSON.stringify(attractionQuery, null, 2));

    const attractionResult = await xataQuery('/tables/attractions/query', {
      body: attractionQuery
    });

    console.log('🏛️ Attractions found:', attractionResult.records?.length || 0);

    // Step 3: Get events for this city
    const eventQuery = {
      filter: {
        city_id: city.id
      }
    };

    const eventResult = await xataQuery('/tables/events/query', {
      body: eventQuery
    });

    console.log('🎉 Events found:', eventResult.records?.length || 0);

    // Step 4: Process results
    const attractions = attractionResult.records || [];
    const events = eventResult.records || [];
    const totalContent = attractions.length + events.length;

    // Simple logic for "enough content"
    const minRequired = 3; // Need at least 3 items for a basic itinerary
    const hasEnoughContent = totalContent >= minRequired;

    const response = {
      success: true,
      found: true,
      city: {
        id: city.id,
        name: city.name,
        coordinates: city.lat && city.lng ? [city.lat, city.lng] : null,
        type: city.type || 'unknown'
      },
      attractions: attractions.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        description: attr.description,
        type: attr.type,
        subtype: attr.subtype,
        coordinates: attr.lat && attr.lng ? [attr.lat, attr.lng] : null,
        duration: attr.visit_duration,
        cost: attr.cost_range,
        imageUrl: attr.image_url,
        isActive: attr.is_active !== false
      })),
      events: events.map((event: any) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        recurrence: event.recurrence_rule,
        season: event.season,
        duration: event.duration,
        cost: event.cost_range,
        imageUrl: event.image_url,
        isActive: event.is_active !== false
      })),
      stats: {
        attractions_count: attractions.length,
        events_count: events.length,
        total_content: totalContent,
        has_enough_content: hasEnoughContent,
        min_required: minRequired
      },
      suggestions: {
        useAI: !hasEnoughContent,
        reason: hasEnoughContent ? 'sufficient_content' : 'insufficient_content',
        recommendation: hasEnoughContent 
          ? 'Use database content for itinerary'
          : 'Supplement with AI search'
      },
      timestamp: new Date().toISOString()
    };

    console.log('📊 Final response stats:', response.stats);

    return NextResponse.json(response);

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Database attractions error:', err.message);
    
    return NextResponse.json({
      success: false,
      error: 'Database query failed',
      details: err.message,
      suggestions: {
        useAI: true,
        reason: 'database_error'
      }
    }, { status: 500 });
  }
}