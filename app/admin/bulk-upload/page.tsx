'use client'

import React, { useState } from 'react';
import { Upload, Database, CheckCircle, AlertCircle, Loader2, Trash2, Eye } from 'lucide-react';

interface UploadResult {
  success: boolean;
  inserted: number;
  errors: string[];
  details?: any;
}

const BulkUploadPage = () => {
  const [selectedTable, setSelectedTable] = useState('attractions');
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Available tables
  const tables = [
    { value: 'continents', label: 'Continenti' },
    { value: 'countries', label: 'Paesi' },
    { value: 'regions', label: 'Regioni' },
    { value: 'cities', label: 'Città' },
    { value: 'attractions', label: 'Attrazioni' },
    { value: 'events', label: 'Eventi' }
  ];

  // Validate and parse JSON
  const validateJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON deve essere un array di oggetti');
      }
      return { valid: true, data: parsed, error: null };
    } catch (error: any) {
      return { valid: false, data: null, error: error.message };
    }
  };

  // Preview JSON data
  const handlePreview = () => {
    const validation = validateJson(jsonData);
    if (validation.valid && validation.data) {
      setPreview(validation.data);
      setShowPreview(true);
    } else {
      alert('JSON non valido: ' + validation.error);
    }
  };

  // Bulk upload data
  const handleUpload = async () => {
    if (!jsonData.trim()) {
      alert('Inserisci dati JSON');
      return;
    }

    const validation = validateJson(jsonData);
    if (!validation.valid) {
      alert('JSON non valido: ' + validation.error);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: selectedTable,
          data: validation.data
        })
      });

      const uploadResult = await response.json();

      if (response.ok) {
        setResult(uploadResult);
      } else {
        setResult({
          success: false,
          inserted: 0,
          errors: [uploadResult.error || 'Errore durante upload']
        });
      }

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      setResult({
        success: false,
        inserted: 0,
        errors: [error.message]
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setJsonData('');
    setPreview([]);
    setShowPreview(false);
    setResult(null);
  };

  // Load example data
  const loadExample = () => {
    if (selectedTable === 'attractions') {
      setJsonData(JSON.stringify([
        {
          city_id: 1,
          name: "Esempio Attrazione",
          description: "Descrizione di esempio",
          type: "monument",
          subtype: "historical",
          lat: 41.9028,
          lng: 12.4964,
          visit_duration: "2h",
          cost_range: "€15",
          image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5",
          is_active: true
        }
      ], null, 2));
    } else if (selectedTable === 'events') {
      setJsonData(JSON.stringify([
        {
          city_id: 1,
          name: "Esempio Evento",
          description: "Descrizione evento",
          recurrence_rule: "maggio",
          season: "spring",
          duration: "3 giorni",
          cost_range: "€10-20",
          image_url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262",
          is_active: true
        }
      ], null, 2));
    } else if (selectedTable === 'cities') {
      setJsonData(JSON.stringify([
        {
          region_id: 1,
          name: "Milano",
          type: "major",
          lat: 45.4642,
          lng: 9.1900,
          population: 1400000
        }
      ], null, 2));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <Database className="h-10 w-10 mr-3 text-purple-600" />
            Bulk Upload Database
          </h1>
          <p className="text-gray-600">Carica dati JSON direttamente nel database Xata</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleziona Tabella Destinazione
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {tables.map(table => (
                    <option key={table.value} value={table.value}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Dati JSON (Array di Oggetti)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={loadExample}
                      className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Carica Esempio
                    </button>
                    <button
                      onClick={handleClear}
                      className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Pulisci</span>
                    </button>
                  </div>
                </div>
                
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder={`Incolla qui il JSON array per ${tables.find(t => t.value === selectedTable)?.label}...`}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                />
                
                <div className="mt-2 text-xs text-gray-500">
                  Formato: Array JSON di oggetti. Esempio: [{"field1": "value1"}, {"field2": "value2"}]
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handlePreview}
                  disabled={!jsonData.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="h-5 w-5" />
                  <span>Preview Dati</span>
                </button>
                
                <button
                  onClick={handleUpload}
                  disabled={!jsonData.trim() || loading}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Caricando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Carica in {tables.find(t => t.value === selectedTable)?.label}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showPreview && preview.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📋 Preview Dati ({preview.length} records)
                </h3>
                
                <div className="max-h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(preview.slice(0, 3), null, 2)}
                  </pre>
                  {preview.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ... e altri {preview.length - 3} records
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ℹ️ Informazioni Tabella
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Tabella selezionata:</span>
                  <p className="font-semibold text-purple-600">
                    {tables.find(t => t.value === selectedTable)?.label}
                  </p>
                </div>
              </div>
            </div>

            {result && (
              <div className={`bg-white rounded-2xl shadow-xl p-6 border-l-4 ${
                result.success ? 'border-green-500' : 'border-red-500'
              }`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  {result.success ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                  )}
                  Risultato Upload
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Records inseriti:</span>
                    <p className="font-semibold text-green-600">{result.inserted}</p>
                  </div>
                  
                  {result.details && (
                    <div>
                      <span className="text-sm text-gray-600">Totale processati:</span>
                      <p className="font-semibold">{result.details.total}</p>
                    </div>
                  )}
                  
                  {result.errors.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Errori ({result.errors.length}):</span>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {result.errors.map((error: any, index: any) => (
                          <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded mb-1">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            💡 <strong>Suggerimento:</strong> Prepara i tuoi dati in formato JSON array, 
            poi usa questa pagina per caricarli velocemente nel database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPage;