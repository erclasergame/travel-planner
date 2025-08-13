import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const SETTINGS_KEY = 'travel-planner-global-settings';

// Leggi settings globali
export async function GET() {
  try {
    console.log('📖 Reading global settings from Redis...');
    
    const settings = await redis.get(SETTINGS_KEY);
    
    if (settings) {
      console.log('✅ Settings found:', settings);
      return NextResponse.json({
        success: true,
        settings
      });
    } else {
      // Se non esistono settings, usa default
      const defaultSettings = {
        aiModel: process.env.AI_MODEL || 'google/gemma-2-9b-it:free',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };
      
      console.log('🔧 Using default settings:', defaultSettings);
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      });
    }
    
  } catch (error) {
    console.error('❌ Error reading settings:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Salva settings globali
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aiModel, updatedBy = 'admin' } = body;
    
    if (!aiModel) {
      throw new Error('aiModel is required');
    }
    
    const settings = {
      aiModel,
      lastUpdated: new Date().toISOString(),
      updatedBy
    };
    
    console.log('💾 Saving global settings to Redis:', settings);
    
    await redis.set(SETTINGS_KEY, settings);
    
    console.log('✅ Settings saved successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved globally',
      settings
    });
    
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}