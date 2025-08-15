// Xata Database Client
// File: lib/xata.ts

import { XataClient } from '@xata.io/client';

// Interfacce TypeScript per le tabelle
export interface Continent {
  id: string;
  name: string;
  code: string;
  created_at: Date;
}

export interface Country {
  id: string;
  continent_id: string;
  name: string;
  code: string;
  flag_url?: string;
  created_at: Date;
}

export interface Region {
  id: string;
  country_id: string;
  name: string;
  type: string;
  created_at: Date;
}

export interface City {
  id: string;
  region_id: string;
  name: string;
  type: 'major' | 'secondary';
  lat: number;
  lng: number;
  population?: number;
  created_at: Date;
}

export interface Attraction {
  id: string;
  city_id: string;
  name: string;
  description: string;
  type: 'monument' | 'museum' | 'park' | 'shopping' | 'restaurant';
  subtype?: string;
  lat: number;
  lng: number;
  visit_duration?: string;
  opening_hours?: any;
  cost_range?: string;
  image_url?: string;
  image_alt?: string;
  created_at: Date;
  last_verified?: Date;
  is_active: boolean;
}

export interface Event {
  id: string;
  city_id: string;
  name: string;
  description: string;
  recurrence_rule?: string;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  duration?: string;
  cost_range?: string;
  image_url?: string;
  image_alt?: string;
  created_at: Date;
  last_verified?: Date;
  is_active: boolean;
}

// Schema configuration per Xata
const schema = {
  tables: [
    {
      name: 'continents',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'code', type: 'string' },
      ],
    },
    {
      name: 'countries',
      columns: [
        { name: 'continent_id', type: 'link', link: { table: 'continents' } },
        { name: 'name', type: 'string' },
        { name: 'code', type: 'string' },
        { name: 'flag_url', type: 'string' },
      ],
    },
    {
      name: 'regions',
      columns: [
        { name: 'country_id', type: 'link', link: { table: 'countries' } },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
      ],
    },
    {
      name: 'cities',
      columns: [
        { name: 'region_id', type: 'link', link: { table: 'regions' } },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'lat', type: 'float' },
        { name: 'lng', type: 'float' },
        { name: 'population', type: 'int' },
      ],
    },
    {
      name: 'attractions',
      columns: [
        { name: 'city_id', type: 'link', link: { table: 'cities' } },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'text' },
        { name: 'type', type: 'string' },
        { name: 'subtype', type: 'string' },
        { name: 'lat', type: 'float' },
        { name: 'lng', type: 'float' },
        { name: 'visit_duration', type: 'string' },
        { name: 'opening_hours', type: 'json' },
        { name: 'cost_range', type: 'string' },
        { name: 'image_url', type: 'string' },
        { name: 'image_alt', type: 'string' },
        { name: 'last_verified', type: 'datetime' },
        { name: 'is_active', type: 'bool' },
      ],
    },
    {
      name: 'events',
      columns: [
        { name: 'city_id', type: 'link', link: { table: 'cities' } },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'text' },
        { name: 'recurrence_rule', type: 'string' },
        { name: 'season', type: 'string' },
        { name: 'duration', type: 'string' },
        { name: 'cost_range', type: 'string' },
        { name: 'image_url', type: 'string' },
        { name: 'image_alt', type: 'string' },
        { name: 'last_verified', type: 'datetime' },
        { name: 'is_active', type: 'bool' },
      ],
    },
  ],
};

// Inizializza client Xata
const xataClient = new XataClient({
  databaseURL: process.env.XATA_DATABASE_URL,
  apiKey: process.env.XATA_API_KEY,
  branch: process.env.XATA_BRANCH || 'main',
});

// Funzioni helper per query comuni
export class XataHelper {
  
  // Cerca città per nome (case insensitive)
  static async findCityByName(cityName: string): Promise<City | null> {
    try {
      const cities = await xataClient.db.cities
        .filter({ name: { $iContains: cityName } })
        .getFirst();
      
      return cities;
    } catch (error) {
      console.error('Error finding city:', error);
      return null;
    }
  }

  // Ottieni attrazioni per città
  static async getAttractionsByCity(cityId: string, type?: string): Promise<Attraction[]> {
    try {
      let query = xataClient.db.attractions
        .filter({ city_id: cityId, is_active: true });
      
      if (type) {
        query = query.filter({ type });
      }
      
      const attractions = await query.getAll();
      return attractions;
    } catch (error) {
      console.error('Error getting attractions:', error);
      return [];
    }
  }

  // Ottieni eventi per città
  static async getEventsByCity(cityId: string, season?: string): Promise<Event[]> {
    try {
      let query = xataClient.db.events
        .filter({ city_id: cityId, is_active: true });
      
      if (season) {
        query = query.filter({ season });
      }
      
      const events = await query.getAll();
      return events;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  // Salva nuova attrazione
  static async saveAttraction(attraction: Omit<Attraction, 'id' | 'created_at'>): Promise<Attraction | null> {
    try {
      const saved = await xataClient.db.attractions.create({
        ...attraction,
        is_active: true,
        created_at: new Date(),
      });
      
      return saved;
    } catch (error) {
      console.error('Error saving attraction:', error);
      return null;
    }
  }

  // Cerca città con attrazioni count
  static async getCitiesWithStats(): Promise<any[]> {
    try {
      // Query complessa per statistiche
      const cities = await xataClient.db.cities.getAll();
      
      const citiesWithStats = await Promise.all(
        cities.map(async (city) => {
          const attractionsCount = await xataClient.db.attractions
            .filter({ city_id: city.id, is_active: true })
            .summarize({ totalCount: { count: '*' } });
          
          const eventsCount = await xataClient.db.events
            .filter({ city_id: city.id, is_active: true })
            .summarize({ totalCount: { count: '*' } });
          
          return {
            ...city,
            attractions_count: attractionsCount.summaries[0]?.totalCount || 0,
            events_count: eventsCount.summaries[0]?.totalCount || 0,
          };
        })
      );
      
      return citiesWithStats;
    } catch (error) {
      console.error('Error getting cities with stats:', error);
      return [];
    }
  }

  // Verifica connessione database
  static async testConnection(): Promise<boolean> {
    try {
      await xataClient.db.continents.getFirst();
      return true;
    } catch (error) {
      console.error('Xata connection test failed:', error);
      return false;
    }
  }
}

// Export client principale
export default xataClient;

// Export per debugging
export const xata = xataClient;