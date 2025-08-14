import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

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

// Valida formato ID
const validateId = (id: string): { valid: boolean; error?: string } => {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID non fornito' };
  }

  // Controllo formato ID (timestamp-random)
  const idPattern = /^[a-z0-9]+-[a-z0-9]+$/;
  if (!idPattern.test(id)) {
    return { valid: false, error: 'Formato ID non valido' };
  }

  // Controllo lunghezza ragionevole
  if (id.length < 8 || id.length > 50) {
    return { valid: false, error: 'Lunghezza ID non valida' };
  }

  return { valid: true };
};

// Controlla se i dati sono scaduti
const isExpired = (data: SharedItineraryData): boolean => {
  try {
    const expiresAt = new Date(data.metadata.expiresAt);
    const now = new Date();
    return now > expiresAt;
  } catch (error) {
    console.warn('⚠️ [Get Shared] Errore controllo scadenza:', error);
    return true; // In caso di errore, considera scaduto
  }
};

// Aggiorna contatori di visualizzazione
const updateViewCount = async (id: string, data: SharedItineraryData): Promise<void> => {
  try {
    const redisKey = REDIS_KEY_PREFIX + id;
    
    // Aggiorna metadati
    const updatedData = {
      ...data,
      metadata: {
        ...data.metadata,
        viewCount: (data.metadata.viewCount || 0) + 1,
        lastViewed: new Date().toISOString()
      }
    };

    // Calcola TTL rimanente
    const expiresAt = new Date(data.metadata.expiresAt);
    const now = new Date();
    const remainingTTL = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    if (remainingTTL > 0) {
      await redis.setex(redisKey, remainingTTL, JSON.stringify(updatedData));
      
      console.log('📈 [Get Shared] View count aggiornato:', {
        id,
        viewCount: updatedData.metadata.viewCount,
        remainingTTL
      });
    }

    // Statistiche globali (opzionale)
    try {
      const statsKey = 'travel-planner-stats';
      const today = now.toISOString().split('T')[0];
      
      await redis.hincrby(statsKey, `views_${today}`, 1);
      await redis.hincrby(statsKey, 'total_views', 1);
    } catch (statsError) {
      console.warn('⚠️ [Get Shared] Errore aggiornamento statistiche views:', statsError);
    }

  } catch (error) {
    console.error('❌ [Get Shared] Errore aggiornamento view count:', error);
    // Non fallire per errori di conteggio
  }
};

// GET - Recupera itinerario condiviso
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('🔥 [Get Shared] Richiesta recupero itinerario:', { id });

    // Validazione ID
    const idValidation = validateId(id);
    if (!idValidation.valid) {
      console.error('❌ [Get Shared] ID non valido:', idValidation.error);
      return NextResponse.json({
        success: false,
        error: 'ID itinerario non valido',
        details: idValidation.error
      }, { status: 400 });
    }

    // Costruisci chiave Redis
    const redisKey = REDIS_KEY_PREFIX + id;

    console.log('🔍 [Get Shared] Cercando in Redis:', { redisKey });

    // Recupera da Redis
    const rawData = await redis.get(redisKey);

    if (!rawData) {
      console.log('❌ [Get Shared] Itinerario non trovato:', { id, redisKey });
      return NextResponse.json({
        success: false,
        error: 'Itinerario non trovato',
        details: 'L\'itinerario potrebbe essere scaduto o l\'ID non è corretto',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Parse dati
    let data: SharedItineraryData;
    try {
      data = JSON.parse(rawData as string);
    } catch (parseError: unknown) {
      console.error('❌ [Get Shared] Errore parsing dati Redis:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Dati itinerario corrotti',
        code: 'PARSE_ERROR'
      }, { status: 500 });
    }

    // Controllo scadenza
    if (isExpired(data)) {
      console.log('⏰ [Get Shared] Itinerario scaduto:', {
        id,
        expiresAt: data.metadata.expiresAt,
        now: new Date().toISOString()
      });

      // Rimuovi dati scaduti
      try {
        await redis.del(redisKey);
        console.log('🗑️ [Get Shared] Dati scaduti rimossi da Redis');
      } catch (deleteError) {
        console.warn('⚠️ [Get Shared] Errore rimozione dati scaduti:', deleteError);
      }

      return NextResponse.json({
        success: false,
        error: 'Itinerario scaduto',
        details: 'Questo link è scaduto. Gli itinerari condivisi sono disponibili per 30 giorni.',
        code: 'EXPIRED',
        expiredAt: data.metadata.expiresAt
      }, { status: 410 }); // 410 Gone
    }

    // Aggiorna view count in background
    updateViewCount(id, data);

    console.log('✅ [Get Shared] Itinerario recuperato con successo:', {
      id,
      title: data.metadata.title,
      source: data.metadata.source,
      viewCount: data.metadata.viewCount,
      createdAt: data.metadata.createdAt
    });

    // Prepara response
    const response = {
      success: true,
      id,
      itinerary: data.itinerary,
      metadata: {
        title: data.metadata.title,
        createdAt: data.metadata.createdAt,
        expiresAt: data.metadata.expiresAt,
        source: data.metadata.source,
        viewCount: data.metadata.viewCount + 1, // Include il view corrente
        lastViewed: new Date().toISOString(),
        daysUntilExpiry: Math.ceil(
          (new Date(data.metadata.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      },
      sharing: {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/viewer/shared/${id}`,
        embedUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/viewer/shared/${id}?embed=true`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/viewer/shared/${id}`)}`
      }
    };

    // Headers per caching
    const expiresAt = new Date(data.metadata.expiresAt);
    const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${Math.min(maxAge, 3600)}`, // Max 1 ora di cache
        'Expires': expiresAt.toUTCString(),
        'Last-Modified': data.metadata.lastViewed || data.metadata.createdAt
      }
    });

  } catch (error: unknown) {
    console.error('❌ [Get Shared] Errore durante il recupero:', error);

    // Log dettagliato per debugging con type guard
    const err = error as Error;
    console.error('Error details:', {
      name: err?.name,
      message: err?.message,
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Errore interno durante il recupero',
      message: err instanceof Error ? err.message : 'Errore sconosciuto',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// HEAD - Per controlli esistenza senza scaricare tutto
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const idValidation = validateId(id);
    if (!idValidation.valid) {
      return new NextResponse(null, { status: 400 });
    }

    const redisKey = REDIS_KEY_PREFIX + id;
    const exists = await redis.exists(redisKey);

    if (exists) {
      // Recupera solo metadati per header
      const rawData = await redis.get(redisKey);
      if (rawData) {
        try {
          const data: SharedItineraryData = JSON.parse(rawData as string);
          
          if (isExpired(data)) {
            return new NextResponse(null, { status: 410 });
          }

          const expiresAt = new Date(data.metadata.expiresAt);
          const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

          return new NextResponse(null, {
            status: 200,
            headers: {
              'Cache-Control': `public, max-age=${Math.min(maxAge, 3600)}`,
              'Expires': expiresAt.toUTCString(),
              'Content-Type': 'application/json',
              'X-View-Count': data.metadata.viewCount.toString(),
              'X-Created-At': data.metadata.createdAt
            }
          });
        } catch (parseError: unknown) {
          return new NextResponse(null, { status: 500 });
        }
      }
    }

    return new NextResponse(null, { status: 404 });

  } catch (error: unknown) {
    console.error('❌ [Get Shared] Errore HEAD:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}