'use client'

import React, { useState } from 'react';
import { Upload, Database, Loader2 } from 'lucide-react';

export default function BulkUploadPage() {
  const [jsonData, setJsonData] = useState('');
  const [selectedTable, setSelectedTable] = useState('attractions');
  const [loading, setLoading] = useState(false);

  const tables = [
    { value: 'attractions', label: 'Attrazioni' },
    { value: 'events', label: 'Eventi' },
    { value: 'cities', label: 'Città' }
  ];

  async function handleUpload() {
    if (!jsonData.trim()) {
      alert('Inserisci dati JSON');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          data: JSON.parse(jsonData)
        })
      });

      const result = await response.json();
      alert(result.success ? 'Upload completato!' : 'Errore upload');
      
    } catch (error) {
      alert('Errore: ' + String(error));
    }
    
    setLoading(false);
  }

  function handleClear() {
    setJsonData('');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            <Database className="inline h-8 w-8 mr-2" />
            Bulk Upload Database
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tabella:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {tables.map((table) => (
                <option key={table.value} value={table.value}>
                  {table.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">JSON Data:</label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='[{"name": "esempio"}]'
              className="w-full h-32 px-3 py-2 border rounded-lg font-mono text-sm"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg disabled:bg-gray-400"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Caricando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </span>
              )}
            </button>
            
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Pulisci
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}