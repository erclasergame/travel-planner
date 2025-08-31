// File: app/admin/population/page.tsx
// Population Dashboard - Controllo e gestione popolazione database AI

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, ChevronRight, Play, Pause, Database, Globe, MapPin, Camera, Calendar } from 'lucide-react';

// 🎯 Tipi TypeScript
interface DatabaseStats {
  continents: number;
  countries: number;
  cities: number;
  attractions: number;
  events: number;
  lastUpdated?: string;
}

interface CountryStats {
  code: string;
  name: string;
  continent_code: string;
  cities_count: number;
  attractions_count: number;
  events_count: number;
  last_search?: string;
  needs_cities?: boolean;
  flag_url?: string;
}

interface PopulationProgress {
  countries_with_cities: number;
  countries_total: number;
  cities_with_attractions: number;
  cities_total: number;
  completion_percentage: number;
}

export default function PopulationDashboard() {
  const [stats, setStats] = useState<DatabaseStats>({
    continents: 0,
    countries: 0,
    cities: 0,
    attractions: 0,
    events: 0
  });
  
  const [progress, setProgress] = useState<PopulationProgress>({
    countries_with_cities: 0,
    countries_total: 0,
    cities_with_attractions: 0,
    cities_total: 0,
    completion_percentage: 0
  });

  const [countries, setCountries] = useState<CountryStats[]>([]);
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);

  // 📊 Carica statistiche database
  const loadDatabaseStats = async () => {
    setIsLoading(true);
    try {
      // Carica stats base
      const [continentsRes, countriesRes, citiesRes, attractionsRes, eventsRes] = await Promise.all([
        fetch('/api/database/continents'),
        fetch('/api/database/countries'),
        fetch('/api/database/cities'),
        fetch('/api/database/attractions'),
        fetch('/api/database/events')
      ]);

      const [continents, countries, cities, attractions, events] = await Promise.all([
        continentsRes.json(),
        countriesRes.json(),
        citiesRes.json(),
        attractionsRes.json(),
        eventsRes.json()
      ]);

      // Aggiorna statistiche
      const newStats: DatabaseStats = {
        continents: continents.data?.length || 0,
        countries: countries.data?.length || 0,
        cities: cities.data?.length || 0,
        attractions: attractions.data?.length || 0,
        events: events.data?.length || 0,
        lastUpdated: new Date().toISOString()
      };

      setStats(newStats);

      // Calcola progresso popolazione
      const countriesWithCities = countries.data?.filter((country: any) => 
        cities.data?.some((city: any) => city.country_code === country.code)
      ).length || 0;

      const citiesWithAttractions = cities.data?.filter((city: any) =>
        attractions.data?.some((attraction: any) => attraction.city_code === city.code)
      ).length || 0;

      setProgress({
        countries_with_cities: countriesWithCities,
        countries_total: newStats.countries,
        cities_with_attractions: citiesWithAttractions,
        cities_total: newStats.cities,
        completion_percentage: newStats.countries > 0 ? Math.round((countriesWithCities / newStats.countries) * 100) : 0
      });

      // Processa statistiche per paese
      const countryStats: CountryStats[] = countries.data?.map((country: any) => {
        const countryCities = cities.data?.filter((city: any) => city.country_code === country.code) || [];
        const countryAttractions = attractions.data?.filter((attraction: any) => 
          countryCities.some((city: any) => city.code === attraction.city_code)
        ) || [];
        const countryEvents = events.data?.filter((event: any) => 
          countryCities.some((city: any) => city.code === event.city_code)
        ) || [];

        return {
          code: country.code,
          name: country.name,
          continent_code: country.continent_code,
          cities_count: countryCities.length,
          attractions_count: countryAttractions.length,
          events_count: countryEvents.length,
          needs_cities: countryCities.length === 0,
          flag_url: country.flag_url
        };
      }) || [];

      setCountries(countryStats);

    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Refresh dati
  useEffect(() => {
    loadDatabaseStats();
  }, []);

  // 🎨 Helper per status badge
  const getStatusBadge = (citiesCount: number, attractionsCount: number) => {
    if (citiesCount === 0) return <Badge variant="destructive">No Cities</Badge>;
    if (attractionsCount === 0) return <Badge variant="outline">Cities Only</Badge>;
    return <Badge variant="default">Complete</Badge>;
  };

  // 🌍 Continenti disponibili
  const continents = [
    { code: 'all', name: 'All Continents', emoji: '🌍' },
    { code: 'EU', name: 'Europe', emoji: '🇪🇺' },
    { code: 'AS', name: 'Asia', emoji: '🌏' },
    { code: 'AF', name: 'Africa', emoji: '🌍' },
    { code: 'NA', name: 'North America', emoji: '🌎' },
    { code: 'SA', name: 'South America', emoji: '🌎' },
    { code: 'OC', name: 'Oceania', emoji: '🌏' }
  ];

  // 📊 Filtra paesi per continente
  const filteredCountries = selectedContinent === 'all' 
    ? countries 
    : countries.filter(c => c.continent_code === selectedContinent);

  // 🚀 Avvia popolazione AI
  const startAIPopulation = async (countryCode?: string) => {
    setIsPopulating(true);
    try {
      const endpoint = countryCode 
        ? `/api/ai/populate-cities?country=${countryCode}`
        : '/api/ai/populate-cities';
      
      const response = await fetch(endpoint, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        await loadDatabaseStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Errore popolazione AI:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Caricamento statistiche database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 📊 HEADER - Database Overview (SEMPRE VISIBILE) */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Database className="h-6 w-6" />
          Travel Planner - Population Dashboard
        </h1>
        
        {/* Statistiche Immediate */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <Globe className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <div className="text-2xl font-bold text-green-700">{stats.continents}</div>
              <div className="text-sm text-green-600">Continents</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 text-center">
              <img src="/api/placeholder/20/20" alt="flag" className="h-5 w-5 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-700">{stats.countries}</div>
              <div className="text-sm text-blue-600">Countries</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3 text-center">
              <MapPin className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <div className="text-2xl font-bold text-purple-700">{stats.cities}</div>
              <div className="text-sm text-purple-600">Cities</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3 text-center">
              <Camera className="h-5 w-5 mx-auto mb-1 text-orange-600" />
              <div className="text-2xl font-bold text-orange-700">{stats.attractions}</div>
              <div className="text-sm text-orange-600">Attractions</div>
            </CardContent>
          </Card>

          <Card className="bg-pink-50 border-pink-200">
            <CardContent className="p-3 text-center">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-pink-600" />
              <div className="text-2xl font-bold text-pink-700">{stats.events}</div>
              <div className="text-sm text-pink-600">Events</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-4 rounded border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Population Progress</span>
            <span className="text-sm text-gray-600">
              {progress.countries_with_cities}/{progress.countries_total} countries have cities ({progress.completion_percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.completion_percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {progress.cities_with_attractions}/{progress.cities_total} cities have attractions
          </div>
        </div>
      </div>

      {/* 🎛️ CONTROLS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Population Controls</span>
            <Button 
              onClick={() => loadDatabaseStats()} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {continents.map(continent => (
              <Button
                key={continent.code}
                variant={selectedContinent === continent.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedContinent(continent.code)}
              >
                {continent.emoji} {continent.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => startAIPopulation()}
              disabled={isPopulating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPopulating ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPopulating ? 'Population Running...' : 'Start Auto Population'}
            </Button>
            
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Find Missing Cities
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 🗺️ COUNTRIES LIST */}
      <Card>
        <CardHeader>
          <CardTitle>
            Countries Overview 
            {selectedContinent !== 'all' && (
              <span className="text-sm font-normal ml-2">
                ({filteredCountries.length} countries in {continents.find(c => c.code === selectedContinent)?.name})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {filteredCountries.map(country => (
              <div 
                key={country.code}
                className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {country.flag_url && (
                    <img 
                      src={country.flag_url} 
                      alt={`${country.name} flag`}
                      className="w-6 h-4 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">{country.name}</div>
                    <div className="text-sm text-gray-500">{country.code}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    <div>{country.cities_count} cities</div>
                    <div className="text-gray-500">
                      {country.attractions_count} attractions, {country.events_count} events
                    </div>
                  </div>
                  
                  {getStatusBadge(country.cities_count, country.attractions_count)}
                  
                  {country.needs_cities && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startAIPopulation(country.code)}
                      disabled={isPopulating}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Find Cities
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 📈 STATS FOOTER */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
        <br />
        Database status: <strong>{progress.completion_percentage}% populated</strong> • 
        Next priority: <strong>{countries.filter(c => c.needs_cities).length} countries need cities</strong>
      </div>
    </div>
  );
}