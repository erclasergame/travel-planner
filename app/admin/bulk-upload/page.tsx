'use client'

import React, { useState } from 'react';
import { Upload, Database } from 'lucide-react';

export default function BulkUploadPage() {
  const [jsonData, setJsonData] = useState('');
  const [selectedTable, setSelectedTable] = useState('attractions');

  const tables = [
    { value: 'attractions', label: 'Attrazioni' },
    { value: 'events', label: 'Eventi' },
    { value: 'cities', label: 'Città' }
  ];

  const handleSubmit = () => {
    alert('Funzione non ancora implementata');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <Database className="h-10 w-10 mr-3 text-purple-600" />
            Bulk Upload Database
          </h1>
          <p className="text-gray-600">Carica dati JSON nel database Xata</p>
        </div>
        
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
              {tables.map((table) => (
                <option key={table.value} value={table.value}>
                  {table.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dati JSON
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Incolla qui il JSON array..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Upload className="h-5 w-5" />
            <span>Carica Dati</span>
          </button>
        </div>
      </div>
    </div>
  );
}