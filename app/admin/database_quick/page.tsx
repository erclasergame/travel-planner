'use client';

import React, { useState, useEffect } from 'react';
import { Database, Eye, RefreshCw, AlertCircle, CheckCircle, Users, MapPin, Globe, Calendar, Building2 } from 'lucide-react';

const DatabaseExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('cities');
  const [data, setData] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Configurazione tabelle principali
  const tables = [
    { 
      id: 'cities', 
      name: 'Cities', 
      icon: MapPin,
      color: 'blue',
      description: '(Nuovo schema con region integrata)'
    },
    { 
      id: 'countries', 
      name: 'Countries', 
      icon: Globe,
      color: 'green',
      description: 'Paesi del mondo'
    },
    { 
      id: 'continents', 
      name: 'Continents', 
      icon: Building2,
      color: 'purple',
      description: 'Continenti'
    },
    { 
      id: 'attractions', 
      name: 'Attractions', 
      icon: Eye,
      color: 'orange',
      description: 'Attrazioni turistiche'
    },
    { 
      id: 'events', 
      name: 'Events', 
      icon: Calendar,
      color: 'red',
      description: 'Eventi e manifestazioni'
    }
  ];

  // Funzione per caricare dati di una tabella
  const loadTableData = async (tableName: string) => {
    setLoading(prev => ({ ...prev, [tableName]: true }));
    setErrors(prev => ({ ...prev, [tableName]: '' }));

    try {
      let apiUrl = '';
      
      // Usa le API interne del progetto invece di Xata diretta
      switch (tableName) {
        case 'cities':
          apiUrl = '/api/database/cities';
          break;
        case 'countries':
          apiUrl = '/api/database/countries';
          break;
        case 'continents':
          apiUrl = '/api/database/continents';
          break;
        case 'attractions':
          apiUrl = '/api/database/attractions';
          break;
        case 'events':
          apiUrl = '/api/database/events';
          break;
        default:
          throw new Error(`API not available for ${tableName}`);
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Adatta la risposta in base al formato
      let records = [];
      if (result.records) {
        records = result.records.slice(0, 10);
      } else if (Array.isArray(result)) {
        records = result.slice(0, 10);
      } else if (result.data && Array.isArray(result.data)) {
        records = result.data.slice(0, 10);
      }
      
      setData(prev => ({ ...prev, [tableName]: records }));

    } catch (error: any) {
      console.error(`Error loading ${tableName}:`, error);
      setErrors(prev => ({ ...prev, [tableName]: error.message }));
      
      // Fallback con dati mock
      setData(prev => ({ ...prev, [tableName]: getMockData(tableName) }));
    } finally {
      setLoading(prev => ({ ...prev, [tableName]: false }));
    }
  };

  // Dati mock per fallback
  const getMockData = (tableName: string) => {
    const mockData: { [key: string]: any[] } = {
      cities: [
        { name: 'Rome', country_code: 'IT', region_name: 'Lazio', region_type: 'region', type: 'capital', population: 2870000, lat: 41.9028, lng: 12.4964 },
        { name: 'Milan', country_code: 'IT', region_name: 'Lombardia', region_type: 'region', type: 'major', population: 1390000, lat: 45.4642, lng: 9.19 },
        { name: 'Naples', country_code: 'IT', region_name: 'Campania', region_type: 'region', type: 'major', population: 970000, lat: 40.8518, lng: 14.2681 }
      ],
      countries: [
        { name: 'Italy', code: 'IT', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/it.png' },
        { name: 'France', code: 'FR', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/fr.png' },
        { name: 'Spain', code: 'ES', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/es.png' }
      ],
      continents: [
        { name: 'Europe', code: 'EU' },
        { name: 'Asia', code: 'AS' },
        { name: 'Africa', code: 'AF' }
      ],
      attractions: [
        { name: 'Colosseum', city_code: 'rome', type: 'monument', description: 'Ancient Roman amphitheatre' },
        { name: 'Vatican Museums', city_code: 'rome', type: 'museum', description: 'World-famous art collection' }
      ],
      events: [
        { name: 'Rome Film Festival', city_code: 'rome', season: 'autumn', start_date: '2025-10-14' },
        { name: 'La Notte Bianca', city_code: 'rome', season: 'spring', start_date: '2025-05-20' }
      ]
    };
    return mockData[tableName] || [];
  };

  // Carica dati iniziali
  useEffect(() => {
    loadTableData(activeTab);
  }, [activeTab]);

  // Renderizza contenuto di una cella
  const renderCellContent = (key: string, value: any) => {
    if (value === null || value === undefined) return '-';
    
    if (typeof value === 'boolean') {
      return value ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
    
    if (key === 'flag_url' && typeof value === 'string') {
      return <img src={value} alt="Flag" className="h-4 w-6 object-cover rounded" />;
    }
    
    if (typeof value === 'object') {
      return <code className="text-xs bg-gray-100 px-1 rounded">{JSON.stringify(value)}</code>;
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return <span title={value}>{value.substring(0, 50)}...</span>;
    }
    
    return String(value);
  };

  // Ottieni colonne per una tabella
  const getTableColumns = (tableName: string, records: any[]) => {
    if (records.length === 0) return [];
    
    // Escludi colonne Xata interne
    const excludeColumns = ['id', 'xata_createdat', 'xata_updatedat', 'xata_version', 'xata_id'];
    
    const allKeys = new Set<string>();
    records.forEach(record => {
      Object.keys(record).forEach(key => {
        if (!excludeColumns.includes(key.toLowerCase())) {
          allKeys.add(key);
        }
      });
    });
    
    return Array.from(allKeys);
  };

  const currentTable = tables.find(t => t.id === activeTab);
  const currentData = data[activeTab] || [];
  const currentLoading = loading[activeTab] || false;
  const currentError = errors[activeTab];
  const columns = getTableColumns(activeTab, currentData);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="text-blue-600" />
            Database Quick Explorer
          </h1>
          <p className="text-gray-600 mt-2">
            Visualizzazione rapida delle tabelle principali del database Xata Lite
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tables.map(table => {
                const Icon = table.icon;
                const isActive = activeTab === table.id;
                const recordCount = data[table.id]?.length || 0;
                
                return (
                  <button
                    key={table.id}
                    onClick={() => setActiveTab(table.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {table.name}
                    {recordCount > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {recordCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Table Info */}
        {currentTable && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <currentTable.icon className={`h-5 w-5 text-${currentTable.color}-600`} />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentTable.name}
                  </h2>
                  <p className="text-sm text-gray-600">{currentTable.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {currentLoading ? 'Loading...' : `${currentData.length} records shown`}
                </div>
                <button
                  onClick={() => loadTableData(activeTab)}
                  disabled={currentLoading}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${currentLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {currentError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <strong>Error loading data:</strong> {currentError}
            </div>
            <p className="text-red-600 text-sm mt-1">Showing mock data as fallback.</p>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {currentLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {currentTable?.name.toLowerCase()}...</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data found in {currentTable?.name.toLowerCase()} table</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    {columns.map(column => (
                      <th 
                        key={column}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.slice(0, 10).map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      {columns.map(column => (
                        <td 
                          key={column}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {renderCellContent(column, record[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Showing first 10 records per table • Database: Xata Lite</p>
          <p className="mt-1">
            <strong>Schema:</strong> Simplified (regions integrated in cities) • 
            <strong>Total tables:</strong> {tables.length} active
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseExplorer;