import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const SETTINGS_FILE = join(process.cwd(), 'admin-settings.json');

// Leggi settings admin
export async function GET() {
  try {
    const data = await readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    // Se file non esiste, usa default
    const defaultSettings = {
      aiModel: process.env.AI_MODEL || 'google/gemma-2-9b-it:free',
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    };
    
    return NextResponse.json({
      success: true,
      settings: defaultSettings
    });
  }
}

// Salva settings admin
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
    
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    console.log('💾 Admin settings saved:', settings);
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings
    });
    
  } catch (error) {
    console.error('❌ Error saving admin settings:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}