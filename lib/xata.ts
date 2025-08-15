// Xata Database Client - Versione Semplificata
// File: lib/xata.ts

import { XataApiClient } from '@xata.io/client';

// Interfacce TypeScript semplificate
export interface Continent {
  id: string;
  name: string;
  code: string;
  xata?: any;
}

export interface Country {
  id: string;
  continent_id: string;
  name: string;
  code: string;
  flag_url?: string;
  xata?: any;
}

export interface Region {
  id: string;
  country_id: string;
  name: string;
  type: string;
  xata?: any;
}

export interface City {
  id: string;
  region_id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  population?: number;
  xata?: any;
}

export interface Attraction {
  id: string;
  city_id: string;
  name: string;
  description: string;
  type: string;
  subtype?: string;
  lat: number;
  lng: number;
  visit_duration?: string;
  cost_range?: string;
  image_url?: string;
  image_alt?: string;
  is_active: boolean;
  xata?: any;
}

export interface Event {
  id: string;
  city_id: string;
  name: string;
  description: string;
  recurrence_rule?: string;
  season?: string;
  duration?: string;
  cost_range?: string;
  image_url?: string;
  image_alt?: string;
  is_active: boolean;
  xata?: any;
}

// Inizializza client Xata con configurazione base
const xataClient = new XataApiClient({
  databaseURL: process.env.XATA_DATABASE_URL,
  apiKey: process.env.XATA_API_KEY,
  branch: process.env.XATA_BRANCH || 'main',
});

// Funzioni helper semplificate
export class XataHelper {
  
  // Test connessione base
  static async testConnection(): Promise<boolean> {
    try {
      // Prova una query semplice
      const response = await fetch(`${process.env.XATA_DATABASE_URL}/tables/continents/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: { size: 1 }
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Xata connection test failed:', error);
      return false;
    }
  }

  // Conta records in una tabella
  static async countRecords(tableName: string): Promise<number> {
    try {
      const response = await fetch(`${process.env.XATA_DATABASE_URL}/tables/${tableName}/summarize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summaries: {
            totalCount: { count: "*" }
          }
        })
      });
      
      if (!response.ok) return 0;
      
      const data = await response.json();
      return data.summaries?.[0]?.totalCount || 0;
    } catch (error) {
      console.error(`Error counting ${tableName}:`, error);
      return 0;
    }
  }

  // Cerca città per nome
  static async findCityByName(cityName: string): Promise<City | null> {
    try {
      const response = await fetch(`${process.env.XATA_DATABASE_URL}/tables/cities/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            name: { $iContains: cityName }
          },
          page: { size: 1 }
        })
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.records?.[0] || null;
    } catch (error) {
      console.error('Error finding city:', error);
      return null;
    }
  }

  // Ottieni attrazioni per città
  static async getAttractionsByCity(cityId: string): Promise<Attraction[]> {
    try {
      const response = await fetch(`${process.env.XATA_DATABASE_URL}/tables/attractions/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            city_id: cityId,
            is_active: true
          }
        })
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('Error getting attractions:', error);
      return [];
    }
  }

  // Crea record in una tabella
  static async createRecord(tableName: string, record: any): Promise<any> {
    try {
      const response = await fetch(`${process.env.XATA_DATABASE_URL}/tables/${tableName}/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record)
      });
      
      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error(`Error creating record in ${tableName}:`, error);
      return null;
    }
  }
}

// Export client principale
export default xataClient;