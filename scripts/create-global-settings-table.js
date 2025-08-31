#!/usr/bin/env node

/**
 * Script per creare la tabella global_settings nel database Xata
 * Uso: node scripts/create-global-settings-table.js
 */

require('dotenv').config({ path: '.env.local' });

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

if (!XATA_API_KEY) {
  console.error('❌ XATA_API_KEY not found in environment variables');
  process.exit(1);
}

async function createGlobalSettingsTable() {
  try {
    console.log('🔧 Creating global_settings table...');
    
    // Crea la tabella global_settings
    const createTableResponse = await fetch(`${XATA_DB_URL}/tables`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'global_settings',
        columns: [
          {
            name: 'ai_model',
            type: 'string',
            notNull: true
          },
          {
            name: 'last_updated',
            type: 'datetime',
            notNull: true
          },
          {
            name: 'updated_by',
            type: 'string',
            notNull: true
          }
        ]
      })
    });

    if (!createTableResponse.ok) {
      const error = await createTableResponse.text();
      console.log('ℹ️ Table might already exist or error:', error);
    } else {
      console.log('✅ global_settings table created successfully');
    }

    // Inserisci le impostazioni di default
    console.log('💾 Inserting default settings...');
    
    const insertResponse = await fetch(`${XATA_DB_URL}/tables/global_settings/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'global-settings',
        ai_model: process.env.AI_MODEL || 'google/gemma-2-9b-it:free',
        last_updated: new Date().toISOString(),
        updated_by: 'system'
      })
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      console.log('ℹ️ Default settings might already exist or error:', error);
    } else {
      console.log('✅ Default settings inserted successfully');
    }

    console.log('🎉 Setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createGlobalSettingsTable();
