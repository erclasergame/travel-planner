import { NextRequest, NextResponse } from 'next/server';

// Configurazione Xata
const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

if (!XATA_API_KEY) {
  console.error('❌ XATA_API_KEY not configured');
}

// Helper per chiamare API Xata
async function xataCall(table: string, method: string, data: any = null) {
  const url = `${XATA_DB_URL}/tables/${table}/${method === 'POST' ? 'data' : 'query'}`;
  
  const options: any = {
    method: method === 'GET' ? 'POST' : method,
    headers: {
      'Authorization': `Bearer ${XATA_API_KEY}`,
      'Content-Type': 'application/json',
    }
  };
  
  if (method === 'GET') {
    // Per le query GET, usiamo POST con filtro per ID specifico
    options.body = JSON.stringify({
      filter: { id: 'global-settings' }
    });
  } else if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Xata API error (${response.status}): ${error}`);
  }
  
  return await response.json();
}

// Leggi settings globali
export async function GET() {
  try {
    console.log('📖 Reading global settings from Xata...');
    
    if (!XATA_API_KEY) {
      throw new Error('Database not configured');
    }
    
    // Prova a leggere le impostazioni esistenti
    const result = await xataCall('global-settings', 'GET');
    
    if (result.records && result.records.length > 0) {
      const settings = result.records[0];
      console.log('✅ Settings found:', settings);
      return NextResponse.json({
        success: true,
        settings: {
          aiModel: settings.ai_model,
          lastUpdated: settings.last_updated,
          updatedBy: settings.updated_by
        }
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
    
    // Fallback a impostazioni di default in caso di errore
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

// Salva settings globali
export async function POST(request: NextRequest) {
  try {
    console.log('🚀🚀🚀 NUOVA VERSIONE API - POST admin-settings 🚀🚀🚀');
    console.log('🔧 Using direct Xata API calls instead of xataCall helper');
    
    const body = await request.json();
    const { aiModel, updatedBy = 'admin' } = body;
    
    if (!aiModel) {
      throw new Error('aiModel is required');
    }
    
    if (!XATA_API_KEY) {
      throw new Error('Database not configured');
    }
    
    const settings = {
      id: 'global-settings', // ID fisso per le impostazioni globali
      ai_model: aiModel,
      last_updated: new Date().toISOString(),
      updated_by: updatedBy
    };
    
    console.log('💾 Saving global settings to Xata:', settings);
    
    // Prova prima a leggere per vedere se esiste
    console.log('🔍 Checking if record exists...');
    const existing = await xataCall('global-settings', 'GET');
    console.log('📖 Existing records:', existing);
    
    if (existing.records && existing.records.length > 0) {
      // Aggiorna record esistente
      console.log('🔄 Updating existing record...');
      const updateResponse = await fetch(`${XATA_DB_URL}/tables/global-settings/data/global-settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_model: aiModel,
          last_updated: new Date().toISOString(),
          updated_by: updatedBy
        })
      });
      
      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        throw new Error(`Update failed (${updateResponse.status}): ${error}`);
      }
      
      console.log('✅ Record updated successfully');
    } else {
      // Crea nuovo record
      console.log('🆕 Creating new record...');
      const createResponse = await fetch(`${XATA_DB_URL}/tables/global-settings/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Create failed (${createResponse.status}): ${error}`);
      }
      
      console.log('✅ Record created successfully');
    }
    
    console.log('✅ Settings saved successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved globally',
      settings: {
        aiModel: settings.ai_model,
        lastUpdated: settings.last_updated,
        updatedBy: settings.updated_by
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}