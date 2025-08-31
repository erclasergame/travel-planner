import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Inizializza Redis dal file .env
const redis = Redis.fromEnv();

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST API: Testing Redis database write...');
    
    const body = await request.json();
    const { message = 'Test automatico' } = body;
    
    // Crea un record di test unico
    const testKey = `test-${Date.now()}`;
    const testValue = {
      ai_model: 'test-model',
      last_updated: new Date().toISOString(),
      updated_by: 'test-script',
      test_message: message
    };
    
    console.log(`📝 Test record da inserire: ${testKey}`, testValue);
    
    // Salva in Redis con TTL di 1 ora (3600 secondi)
    await redis.set(testKey, JSON.stringify(testValue), { ex: 3600 });
    
    // Verifica che il record sia stato salvato
    const savedValue = await redis.get(testKey);
    
    if (savedValue) {
      console.log('✅ Test riuscito! Record salvato in Redis:', savedValue);
      
      return NextResponse.json({
        success: true,
        message: 'Test record inserito con successo in Redis',
        key: testKey,
        value: testValue,
        savedValue: savedValue
      });
    } else {
      throw new Error('Record non trovato dopo il salvataggio');
    }
    
  } catch (error) {
    console.error('❌ Test API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}