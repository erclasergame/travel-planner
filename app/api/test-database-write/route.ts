import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting database write test...');
    
    // Parse request body safely
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ JSON Parse error:', parseError);
      body = { message: 'Default test message' };
    }
    
    const { message = 'Test automatico di scrittura del database' } = body;
    
    // Generate test ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const testRecord = {
      id: testId,
      message: message,
      timestamp: new Date().toISOString(),
      type: 'database-test',
      source: 'admin-panel',
      status: 'active'
    };
    
    console.log('📝 Test record created:', testRecord);
    
    // Check if Redis is available
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisUrl || !redisToken) {
      console.error('❌ Redis environment variables missing');
      console.log('UPSTASH_REDIS_REST_URL present:', !!redisUrl);
      console.log('UPSTASH_REDIS_REST_TOKEN present:', !!redisToken);
      
      return NextResponse.json({
        success: false,
        error: 'Redis configuration missing. Check environment variables.',
        record: testRecord,
        tableInfo: {
          storage: 'Redis (Upstash)',
          status: 'configuration-error',
          details: 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not found'
        }
      }, { status: 500 });
    }
    
    // Try to connect to Redis using direct HTTP API (more reliable than SDK)
    const redisKey = `test-record-${testId}`;
    
    try {
      console.log('🔗 Attempting Redis connection via HTTP API...');
      
      // Use direct Redis REST API call instead of SDK
      const redisResponse = await fetch(`${redisUrl}/set/${redisKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(testRecord),
          ex: 3600 // TTL 1 hour
        })
      });
      
      console.log('📡 Redis response status:', redisResponse.status);
      
      if (!redisResponse.ok) {
        const errorText = await redisResponse.text();
        console.error('❌ Redis HTTP error:', errorText);
        
        return NextResponse.json({
          success: false,
          error: `Redis HTTP error: ${redisResponse.status} - ${errorText}`,
          record: testRecord,
          tableInfo: {
            storage: 'Redis (Upstash)',
            status: 'connection-error',
            details: `HTTP ${redisResponse.status}: ${errorText}`
          }
        }, { status: 500 });
      }
      
      const redisResult = await redisResponse.text();
      console.log('✅ Redis save successful:', redisResult);
      
      // Verify the record was saved
      const verifyResponse = await fetch(`${redisUrl}/get/${redisKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${redisToken}`
        }
      });
      
      if (verifyResponse.ok) {
        const savedData = await verifyResponse.text();
        console.log('✅ Verification successful, saved data:', savedData);
        
        return NextResponse.json({
          success: true,
          message: 'Test di scrittura completato con successo!',
          record: testRecord,
          tableInfo: {
            storage: 'Redis (Upstash)',
            key: redisKey,
            ttl: '1 ora',
            type: 'test-record',
            status: 'verified'
          }
        });
        
      } else {
        console.log('⚠️ Verification failed but save succeeded');
        
        return NextResponse.json({
          success: true,
          message: 'Test di scrittura completato (verifica non riuscita)',
          record: testRecord,
          tableInfo: {
            storage: 'Redis (Upstash)',
            key: redisKey,
            ttl: '1 ora',
            type: 'test-record',
            status: 'saved-not-verified'
          }
        });
      }
      
    } catch (redisError: any) {
      console.error('❌ Redis operation error:', redisError);
      
      return NextResponse.json({
        success: false,
        error: `Redis operation failed: ${redisError.message || 'Unknown error'}`,
        record: testRecord,
        tableInfo: {
          storage: 'Redis (Upstash)',
          status: 'operation-error',
          details: redisError.message || 'Unknown Redis error'
        }
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ General test error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Test failed: ${error.message || 'Unknown error'}`,
      tableInfo: {
        storage: 'Redis (Upstash)',
        status: 'general-error',
        details: error.stack || 'No stack trace available'
      }
    }, { status: 500 });
  }
}