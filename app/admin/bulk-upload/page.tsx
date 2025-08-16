'use client'

import React, { useState } from 'react';
import { Upload, Database, Loader2, Eye, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function BulkUploadPage() {
  const [jsonData, setJsonData] = useState('');
  const [selectedTable, setSelectedTable] = useState('attractions');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  const tables = [
    { value: 'continents', label: 'Continenti' },
    { value: 'countries', label: 'Paesi' },
    { value: 'regions', label: 'Regioni' },
    { value: 'cities', label: 'Città' },
    { value: 'attractions', label: 'Attrazioni' },
    { value: 'events', label: 'Eventi' }
  ];

  function validateJson(text: string) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON deve essere un array');
      }
      return { valid: true, data: parsed, error: null };
    } catch (error: any) {
      return { valid: false, data: null, error: error.message };
    }
  }

  function handlePreview() {
    const validation = validateJson(jsonData);
    if (validation.valid && validation.data) {
      setPreview(validation.data);
      setShowPreview(true);
    } else {
      alert('JSON non valido: ' + validation.error);
    }
  }

  async function handleUpload() {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          data: validation.data
        })
      });

      const uploadResult = await response.json();
      setResult(uploadResult);
      
    } catch (error) {
      setResult({
        success: false,
        inserted: 0,
        errors: [String(error)]
      });
    }
    
    setLoading(false);
  }

  function handleClear() {
    setJsonData('');
    setPreview([]);
    setShowPreview(false);
    setResult(null);
  }

  function loadExample() {
    if (selectedTable === 'attractions') {
      setJsonData(JSON.stringify([
        {
          city_id: 1,
          name: "Colosseo",
          description: "Anfiteatro Romano",
          type: "monument",
          lat: 41.8902,
          lng: 12.4922,
          is_active: true
        }
      ], null, 2));
    } else if (selectedTable === 'cities') {
      setJsonData(JSON.stringify([
        {
          region_id: 1,
          name: "Roma",
          type: "major",
          lat: 41.9028,
          lng: 12.4964,
          population: 2800000
        }
      ], null, 2));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            <Database className="inline h-10 w-10 mr-3 text-purple-600" />
            Bulk Upload Database
          </h1>
          <p className="text-gray-600">Carica dati JSON nel database Xata</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleziona Tabella
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  {tables.map((table: any) => (
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
                      className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200"
                    >
                      Carica Esempio
                    </button>
                    <button
                      onClick={handleClear}
                      className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 flex items-center space-x-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Pulisci</span>
                    </button>
                  </div>
                </div>
                
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder="Incolla qui il JSON array..."
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handlePreview}
                  disabled={!jsonData.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
                >
                  <Eye className="h-5 w-5" />
                  <span>Preview</span>
                </button>
                
                <button
                  onClick={handleUpload}
                  disabled={!jsonData.trim() || loading}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Caricando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Upload</span>
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
                ℹ️ Info Tabella
              </h3>
              <div>
                <span className="text-sm text-gray-600">Selezionata:</span>
                <p className="font-semibold text-purple-600">
                  {tables.find((t: any) => t.value === selectedTable)?.label}
                </p>
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
                  Risultato
                </h3>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Records inseriti:</span>
                    <p className="font-semibold text-green-600">{result.inserted || 0}</p>
                  </div>
                  
                  {result.errors && result.errors.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Errori:</span>
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
          <p>💡 Prepara i dati in formato JSON array e caricali nel database</p>
        </div>
      </div>
    </div>
  );
}