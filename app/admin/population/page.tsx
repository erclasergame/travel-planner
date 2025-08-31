// File: app/admin/population/page.tsx
// Population Dashboard - Controllo e gestione popolazione database AI
// VERSIONE SENZA DIPENDENZE ESTERNE

'use client';

import { useState, useEffect } from 'react';

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
  const [error, setError] = useState<string>('');

  // 📊 Carica statistiche database
  const loadDatabaseStats = async () => {
    setIsLoading(true);
    setError('');
    
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

    } catch (err) {
      console.error('Errore caricamento statistiche:', err);
      setError('Errore nel caricamento dei dati del database');
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
    if (citiesCount === 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">❌ No Cities</span>;
    }
    if (attractionsCount === 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">⚠️ Cities Only</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">✅ Complete</span>;
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

  // 🚀 Avvia popolazione AI (placeholder)
  const startAIPopulation = async (countryCode?: string) => {
    setIsPopulating(true);
    try {
      // TODO: Implementare API AI population
      alert(`TODO: Avviare ricerca AI per ${countryCode || 'tutti i paesi'}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
      await loadDatabaseStats(); // Refresh stats
    } catch (error) {
      console.error('Errore popolazione AI:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            <span className="ml-4 text-lg">🔄 Caricamento statistiche database...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 📊 HEADER - Database Overview (SEMPRE VISIBILE) */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border-2 border-blue-200 shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-3">
            🗄️ Travel Planner - Population Dashboard
          </h1>
          
          {/* Statistiche Immediate - GRANDI E VISIBILI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-green-50 border-4 border-green-300 p-6 rounded-xl text-center shadow-md">
              <div className="text-5xl font-bold text-green-700 mb-2">{stats.continents}</div>
              <div className="text-sm text-green-600 font-bold">🌍 CONTINENTS</div>
            </div>

            <div className="bg-blue-50 border-4 border-blue-300 p-6 rounded-xl text-center shadow-md">
              <div className="text-5xl font-bold text-blue-700 mb-2">{stats.countries}</div>
              <div className="text-sm text-blue-600 font-bold">🏳️ COUNTRIES</div>
            </div>

            <div className="bg-purple-50 border-4 border-purple-300 p-6 rounded-xl text-center shadow-md">
              <div className="text-5xl font-bold text-purple-700 mb-2">{stats.cities}</div>
              <div className="text-sm text-purple-600 font-bold">🏙️ CITIES</div>
            </div>

            <div className="bg-orange-50 border-4 border-orange-300 p-6 rounded-xl text-center shadow-md">
              <div className="text-5xl font-bold text-orange-700 mb-2">{stats.attractions}</div>
              <div className="text-sm text-orange-600 font-bold">🎯 ATTRACTIONS</div>
            </div>

            <div className="bg-pink-50 border-4 border-pink-300 p-6 rounded-xl text-center shadow-md">
              <div className="text-5xl font-bold text-pink-700 mb-2">{stats.events}</div>
              <div className="text-sm text-pink-600 font-bold">📅 EVENTS</div>
            </div>
          </div>

          {/* Progress Bar - MOLTO VISIBILE */}
          <div className="bg-white p-6 rounded-xl border-4 border-gray-300 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-xl">🚀 Population Progress</span>
              <span className="text-xl font-bold text-gray-700">
                {progress.countries_with_cities}/{progress.countries_total} countries have cities ({progress.completion_percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-6 border-2 border-gray-400">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-6 rounded-full transition-all duration-500 flex items-center justify-center"
                style={{ width: `${progress.completion_percentage}%` }}
              >
                {progress.completion_percentage > 20 && (
                  <span className="text-white text-xs font-bold">{progress.completion_percentage}%</span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-3 font-medium">
              📊 {progress.cities_with_attractions}/{progress.cities_total} cities have attractions
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-6 p-4 bg-white rounded-xl border-2 border-gray-300 shadow-md">
            <div className="text-lg font-bold text-gray-700 text-center">
              📈 <strong>Database Status:</strong> {progress.completion_percentage}% populated • 
              <strong>Next Priority:</strong> {countries.filter(c => c.needs_cities).length} countries need cities • 
              <strong>Last Updated:</strong> {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 p-4 rounded-xl">
            <div className="text-red-700 font-medium">❌ {error}</div>
          </div>
        )}

        {/* 🎛️ CONTROLS */}
        <div className="bg-white rounded-xl border-4 border-gray-300 p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 flex items-center justify-between">
            🤖 AI Population Controls
            <button 
              onClick={() => loadDatabaseStats()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </h2>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {continents.map(continent => (
              <button
                key={continent.code}
                className={`px-6 py-3 rounded-lg border-2 font-bold shadow-md ${
                  selectedContinent === continent.code 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                }`}
                onClick={() => setSelectedContinent(continent.code)}
              >
                {continent.emoji} {continent.name}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => startAIPopulation()}
              disabled={isPopulating}
              className={`px-8 py-4 rounded-lg font-bold text-lg shadow-lg ${
                isPopulating 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPopulating ? '⏸️ Population Running...' : '▶️ Start Auto Population'}
            </button>
            
            <button className="px-6 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-lg shadow-md">
              🔍 Find Missing Cities
            </button>
          </div>
        </div>

        {/* 🗺️ COUNTRIES LIST */}
        <div className="bg-white rounded-xl border-4 border-gray-300 p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">
            🗺️ Countries Overview 
            {selectedContinent !== 'all' && (
              <span className="text-lg font-normal ml-2 text-gray-600">
                ({filteredCountries.length} countries in {continents.find(c => c.code === selectedContinent)?.name})
              </span>
            )}
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg">No countries found for selected continent</div>
              </div>
            ) : (
              filteredCountries.map(country => (
                <div 
                  key={country.code}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {country.flag_url && (
                      <img 
                        src={country.flag_url} 
                        alt={`${country.name} flag`}
                        className="w-10 h-6 object-cover rounded shadow-sm border"
                      />
                    )}
                    <div>
                      <div className="font-bold text-lg">{country.name}</div>
                      <div className="text-sm text-gray-500 font-medium">{country.code}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">{country.cities_count} cities</div>
                      <div className="text-sm text-gray-600">
                        {country.attractions_count} attractions, {country.events_count} events
                      </div>
                    </div>
                    
                    {getStatusBadge(country.cities_count, country.attractions_count)}
                    
                    {country.needs_cities && (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium shadow-md"
                        onClick={() => startAIPopulation(country.code)}
                        disabled={isPopulating}
                      >
                        🔍 Find Cities
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}