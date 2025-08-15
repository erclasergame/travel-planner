'use client'

import React, { useState, useEffect } from 'react';
import { 
  Database, Loader2, CheckCircle, AlertCircle, 
  ArrowLeft, RefreshCw, Search, MapPin 
} from 'lucide-react';
import Link from 'next/link';

interface DatabaseStats {
  continents: number;
  countries: number;
  regions: number;
  cities: number;
  attractions: number;
  events: number;
}

interface TestResult {
  success: boolean;
  message: string;
  stats?: DatabaseStats;
  environment?: any;
  error?: string;
  details?: string;
  timestamp: string;
}

interface AttractionSearchResult {
  success: boolean;
  found: boolean;
  city?: any;
  attractions?: any[];
  events?: any[];
  stats?: any;
  suggestions?: any;
  error?: string;
}

const AdminDatabasePage = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AttractionSearchResult | null>(null);
  const [searchCity, setSearchCity] = useState('Roma');

  // Test connessione database
  const testConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/database/test');
      const result = await response.json();
      setTestResult(result);
    } catch (error: unknown) {
      const err = error as Error;
      setTestResult({
        success: false,
        message: 'Failed to connect to API',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
    
    setLoading(false);
  };

  // Popola dati test
  const populateTestData = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/database/test', { method: 'POST' });
      const result = await response.json();
      setTestResult(result);
    } catch (error: unknown) {
      const err = error as Error;
      setTestResult({
        success: false,
        message: 'Failed to populate test data',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
    
    setLoading(false);
  };

  // Cerca attrazioni
  const searchAttractions = async () => {
    if (!searchCity.trim()) return;
    
    setSearchLoading(true);
    setSearchResult(null);
    
    try {
      const response = await fetch(`/api/database/attractions?city=${encodeURIComponent(searchCity)}&minCount=5`);
      const result = await response.json();
      setSearchResult(result);
    } catch (error: unknown) {
      const err = error as Error;
      setSearchResult({
        success: false,
        found: false,
        error: err.message
      });
    }
    
    setSearchLoading(false);
  };

  // Auto-test al caricamento
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna al Travel Planner
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Database className="h-8 w-8 mr-3 text-purple-600" />
            Admin Database
          </h1>
          
          <div className="w-24" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Test Connessione */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              Test Connessione Database
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={testConnection}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </button>
                
                <button
                  onClick={populateTestData}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  Popola Dati Test
                </button>
              </div>
              
              {/* Risultato Test */}
              {testResult && (
                <div className={`p-4 rounded-lg border-2 ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                  
                  {testResult.stats && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Continenti:</span>
                        <span className="ml-2 font-semibold">{testResult.stats.continents}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Paesi:</span>
                        <span className="ml-2 font-semibold">{testResult.stats.countries}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Regioni:</span>
                        <span className="ml-2 font-semibold">{testResult.stats.regions}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Città:</span>
                        <span className="ml-2 font-semibold">{testResult.stats.cities}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Attrazioni:</span>
                        <span className="ml-2 font-semibold">{testResult.stats.attractions}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Eventi:</span>
                        <span className="ml-2 font-semibold">{testResult.stats.events}</span>
                      </div>
                    </div>
                  )}
                  
                  {testResult.environment && (
                    <div className="mt-3 text-xs text-gray-600">
                      <strong>Environment:</strong><br/>
                      Database URL: {testResult.environment.database_url}<br/>
                      API Key: {testResult.environment.api_key}<br/>
                      Branch: {testResult.environment.branch}
                    </div>
                  )}
                  
                  {testResult.error && (
                    <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-700">
                      <strong>Error:</strong> {testResult.error}<br/>
                      {testResult.details && (
                        <>
                          <strong>Details:</strong> {testResult.details}
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {new Date(testResult.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ricerca Attrazioni */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Search className="h-6 w-6 mr-2 text-blue-600" />
              Test Ricerca Attrazioni
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Nome città (es: Roma, Milano)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && searchAttractions()}
                  />
                </div>
                <button
                  onClick={searchAttractions}
                  disabled={searchLoading}
                  className="bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
                >
                  {searchLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Risultato Ricerca */}
              {searchResult && (
                <div className={`p-4 rounded-lg border-2 ${
                  searchResult.success && searchResult.found
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {searchResult.success && searchResult.found ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-semibold">
                      {searchResult.found 
                        ? `Città trovata: ${searchResult.city?.name}` 
                        : `Città "${searchCity}" non trovata nel database`
                      }
                    </span>
                  </div>
                  
                  {searchResult.stats && (
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Attrazioni:</span>
                        <span className="ml-2 font-semibold">{searchResult.stats.attractions_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Eventi:</span>
                        <span className="ml-2 font-semibold">{searchResult.stats.events_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Totale:</span>
                        <span className="ml-2 font-semibold">{searchResult.stats.total_content}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sufficiente:</span>
                        <span className={`ml-2 font-semibold ${
                          searchResult.stats.has_enough_content ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {searchResult.stats.has_enough_content ? 'Sì' : 'No'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {searchResult.suggestions && (
                    <div className="mt-3 p-3 bg-blue-100 rounded text-sm">
                      <strong>Suggerimento:</strong> {searchResult.suggestions.recommendation}<br/>
                      <strong>Usa AI:</strong> {searchResult.suggestions.useAI ? 'Sì' : 'No'} 
                      ({searchResult.suggestions.reason})
                    </div>
                  )}
                  
                  {searchResult.attractions && searchResult.attractions.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-sm">Prime 3 attrazioni:</strong>
                      <div className="mt-2 space-y-1">
                        {searchResult.attractions.slice(0, 3).map((attraction, index) => (
                          <div key={index} className="text-sm text-gray-700">
                            • {attraction.name} ({attraction.type}) - {attraction.duration || 'n/a'} - {attraction.cost || 'n/a'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {searchResult.error && (
                    <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-700">
                      <strong>Error:</strong> {searchResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Informazioni Database</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎯 Obiettivo</h4>
              <p>Database di attrazioni e eventi curati per ridurre l'uso dell'AI e fornire dati precisi per mappe e itinerari.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🔄 Workflow</h4>
              <p>1. Controlla se città esiste nel DB<br/>2. Se ha abbastanza contenuto, usa DB<br/>3. Altrimenti, integra con AI</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDatabasePage;