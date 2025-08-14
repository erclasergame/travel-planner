import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// TTL per itinerari condivisi (30 giorni in secondi)
const SHARED_ITINERARY_TTL = 30 * 24 * 60 * 60; // 30 giorni

// Prefisso per chiavi Redis
const REDIS_KEY_PREFIX = 'shared-itinerary-';

// Interfaccia per dati salvati
interface SharedItineraryData {
  itinerary: any;
  metadata: {
    title: string;
    createdAt: string;
    expiresAt: string;
    source: string;
    createdFrom: string;
    viewCount: number;
    lastViewed?: string;
  };
}

// Genera ID univoco
const generateUniqueId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`;
};

// Valida dati itinerario
const validateItineraryData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data) {
    errors.push('Dati itinerario mancanti');
    return { valid: false, errors };
  }

  if (!data.metadata) {
    errors.push('Metadati itinerario mancanti');
  } else {
    if (!data.metadata.title) errors.push('Titolo itinerario mancante');
    if (!data.metadata.duration) errors.push('Durata itinerario mancante');
  }

  if (!data.days) {
    errors.push('Giorni itinerario mancanti');
  } else if (!Array.isArray(data.days)) {
    errors.push('Giorni deve essere un array');
  } else if (data.days.length === 0) {
    errors.push('Almeno un giorno è richiesto');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Sanitizza dati per sicurezza
const sanitizeItineraryData = (data: any): any => {
  try {
    // Rimuovi campi sensibili se presenti
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Limita lunghezza stringhe per evitare spam
    if (sanitized.metadata?.title) {
      sanitized.metadata.title = sanitized.metadata.title.substring(0, 200);
    }
    if (sanitized.metadata?.description) {
      sanitized.metadata.description = sanitized.metadata.description.substring(0, 1000);
    }

    // Limita numero di giorni (max 30)
    if (sanitized.days && sanitized.days.length > 30) {
      sanitized.days = sanitized.days.slice(0, 30);
    }

    return sanitized;
  } catch (error) {
    throw new Error('Dati itinerario non validi');
  }
};

// POST - Salva itinerario condiviso
export async function POST(request: NextRequest) {
  try {
    console.log('💾 [Save Shared] Richiesta salvataggio itinerario condiviso');

    const body = await request.json();
    const { itinerary, source = 'unknown', title, createdFrom = 'api' } = body;

    if (!itinerary) {
      console.error('❌ [Save Shared] Itinerario mancante nella richiesta');
      return NextResponse.json({
        success: false,
        error: 'Dati itinerario richiesti'
      }, { status: 400 });
    }

    // Validazione dati
    const validation = validateItineraryData(itinerary);
    if (!validation.valid) {
      console.error('❌ [Save Shared] Validazione fallita:', validation.errors);
      return NextResponse.json({
        success: false,
        error: 'Dati itinerario non validi',
        details: validation.errors
      }, { status: 400 });
    }

    // Sanitizzazione dati
    const sanitizedItinerary = sanitizeItineraryData(itinerary);

    // Genera ID univoco
    const id = generateUniqueId();
    const redisKey = REDIS_KEY_PREFIX + id;

    // Prepara metadati
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (SHARED_ITINERARY_TTL * 1000));

    const sharedData: SharedItineraryData = {
      itinerary: sanitizedItinerary,
      metadata: {
        title: title || sanitizedItinerary.metadata?.title || 'Itinerario condiviso',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        source,
        createdFrom,
        viewCount: 0
      }
    };

    console.log('🔍 [Save Shared] Salvando in Redis:', {
      id,
      title: sharedData.metadata.title,
      source,
      createdFrom,
      days: sanitizedItinerary.days?.length,
      expiresAt: expiresAt.toISOString()
    });

    // Salva in Redis con TTL
    await redis.setex(redisKey, SHARED_ITINERARY_TTL, JSON.stringify(sharedData));

    console.log('✅ [Save Shared] Itinerario salvato con successo:', {
      id,
      key: redisKey,
      ttl: SHARED_ITINERARY_TTL
    });

    // Statistiche (opzionale - per future analytics)
    try {
      const statsKey = 'travel-planner-stats';
      const today = now.toISOString().split('T')[0];
      
      await redis.hincrby(statsKey, `shared_${today}`, 1);
      await redis.hincrby(statsKey, 'total_shared', 1);
      await redis.expire(statsKey, 90 * 24 * 60 * 60); // 90 giorni
    } catch (statsError) {
      console.warn('⚠️ [Save Shared] Errore aggiornamento statistiche:', statsError);
      // Non fallire per errori statistiche
    }

    return NextResponse.json({
      success: true,
      id,
      url: `/viewer/shared/${id}`,
      metadata: {
        title: sharedData.metadata.title,
        createdAt: sharedData.metadata.createdAt,
        expiresAt: sharedData.metadata.expiresAt,
        source: sharedData.metadata.source
      },
      message: 'Itinerario salvato e pronto per la condivisione'
    });

  } catch (error: unknown) {
    console.error('❌ [Save Shared] Errore durante il salvataggio:', error);

    // Log dettagliato per debugging con type guard
    const err = error as Error;
    console.error('Error details:', {
      name: err?.name,
      message: err?.message,
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Errore interno durante il salvataggio',
      message: err instanceof Error ? err.message : 'Errore sconosciuto',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET - Ottieni statistiche salvataggi (opzionale)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      console.log('📊 [Save Shared] Richiesta statistiche');

      try {
        const statsKey = 'travel-planner-stats';
        const stats = await redis.hgetall(statsKey) || {};

        const processedStats = {
          totalShared: parseInt(stats.total_shared || '0'),
          recentShares: {} as Record<string, number>,
          lastUpdated: new Date().toISOString()
        };

        // Processa shares per data
        Object.keys(stats).forEach(key => {
          if (key.startsWith('shared_')) {
            const date = key.replace('shared_', '');
            processedStats.recentShares[date] = parseInt(stats[key]);
          }
        });

        return NextResponse.json({
          success: true,
          stats: processedStats
        });

      } catch (statsError) {
        console.error('❌ [Save Shared] Errore lettura statistiche:', statsError);
        return NextResponse.json({
          success: false,
          error: 'Errore lettura statistiche'
        }, { status: 500 });
      }
    }

    // Default response per GET senza action
    return NextResponse.json({
      success: true,
      message: 'API Save Shared attiva',
      endpoints: {
        save: 'POST /',
        stats: 'GET /?action=stats'
      },
      version: '1.0.0'
    });

  } catch (error: unknown) {
    console.error('❌ [Save Shared] Errore GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno'
    }, { status: 500 });
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}