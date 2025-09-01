'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Table, RefreshCw, Shield, Info, AlertTriangle, CheckCircle, Loader2, Eye, EyeOff, Download } from 'lucide-react';

const DbDiagnostics = () => {
  // Stati per i dati
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any>(null);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [recordCount, setRecordCount] = useState<Record<string, number>>({});
  const [apiResponse, setApiResponse] = useState<string>('');

  // Carica informazioni iniziali
  useEffect(() => {
    loadDbInfo();
  }, []);

  // Carica informazioni sul database
  const loadDbInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Ottieni informazioni generali
      const response = await fetch('/api/admin/db-diagnostics');
      const data = await response.json();
      
      if (data.success) {
        setDbInfo(data.dbInfo);
        setTables(data.tables);
        setRecordCount(data.recordCount || {});
        setApiResponse(JSON.stringify(data, null, 2));
      } else {
        setError(data.error || 'Errore nel caricamento delle informazioni del database');
      }
    } catch (err) {
      setError('Errore nella connessione all\'API: ' + (err instanceof Error ? err.message : String(err)));
    }
    
    setLoading(false);
  };

  // Carica dati di una tabella specifica
  const loadTableData = async (tableName: string) => {
    if (!tableName) return;
    
    setSelectedTable(tableName);
    setLoading(true);
    setError(null);
    setTableData(null);
    setTableColumns([]);
    
    try {
      const response = await fetch(`/api/admin/db-diagnostics?table=${tableName}`);
      const data = await response.json();
      
      if (data.success) {
        setTableData(data.tableData);
        
        // Estrai colonne dal primo record
        if (data.tableData.records && data.tableData.records.length > 0) {
          const firstRecord = data.tableData.records[0];
          const columns = Object.keys(firstRecord).map(key => ({
            name: key,
            type: typeof firstRecord[key],
            isXata: key.startsWith('xata'),
            isId: key === 'id'
          }));
          setTableColumns(columns);
        }
        
        setApiResponse(JSON.stringify(data, null, 2));
      } else {
        setError(data.error || `Errore nel caricamento della tabella ${tableName}`);
      }
    } catch (err) {
      setError('Errore nella connessione all\'API: ' + (err instanceof Error ? err.message : String(err)));
    }
    
    setLoading(false);
  };

  // Formatta un valore per la visualizzazione
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Scarica i dati come JSON
  const downloadData = () => {
    const dataStr = JSON.stringify(tableData || dbInfo, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', dataUri);
    downloadLink.setAttribute('download', `${selectedTable || 'db-info'}.json`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/admin"
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Shield className="h-5 w-5 mr-2" />
            Dashboard Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Database className="h-8 w-8 mr-3 text-blue-600" />
            🔍 Database Diagnostics
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={loadDbInfo}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>
        </div>

        {/* Stato caricamento */}
        {loading && (
          <div className="flex justify-center my-8">
            <div className="flex items-center gap-3 text-blue-800">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-lg">Caricamento informazioni database...</span>
            </div>
          </div>
        )}

        {/* Errore */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Errore:</span> {error}
            </div>
          </div>
        )}

        {/* Informazioni Database */}
        {dbInfo && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Colonna 1: Info generali */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Informazioni Generali
              </h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Database URL:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm break-all">
                    {dbInfo.dbUrl || 'Non disponibile'}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">API Key:</span>
                    <button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm break-all">
                    {showApiKey 
                      ? dbInfo.apiKey || 'Non disponibile'
                      : dbInfo.apiKey ? '••••••••••••••••••••••' : 'Non disponibile'}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Connessione:</span>
                  <div className="mt-1 flex items-center gap-2">
                    {dbInfo.connected ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Connesso
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Non connesso
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Tabelle trovate:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    {tables.length}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Colonna 2: Elenco tabelle */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Table className="h-5 w-5 text-blue-600" />
                Tabelle Database
              </h2>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {tables.map(table => (
                  <button
                    key={table}
                    onClick={() => loadTableData(table)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center ${
                      selectedTable === table ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{table}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                      {recordCount[table] !== undefined ? recordCount[table] : '?'} record
                    </span>
                  </button>
                ))}
                
                {tables.length === 0 && !loading && (
                  <div className="text-center py-4 text-gray-500">
                    Nessuna tabella trovata
                  </div>
                )}
              </div>
            </div>
            
            {/* Colonna 3: Struttura tabella */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Struttura Tabella {selectedTable ? `"${selectedTable}"` : ''}
              </h2>
              
              {selectedTable && tableColumns.length > 0 ? (
                <div className="space-y-3">
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colonna</th>
                          <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableColumns.map((column, i) => (
                          <tr key={i} className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td className="py-2 text-sm">
                              <span className={column.isId ? 'font-semibold text-blue-700' : ''}>{column.name}</span>
                            </td>
                            <td className="py-2 text-sm text-gray-600">{column.type}</td>
                            <td className="py-2">
                              {column.isXata ? (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Xata</span>
                              ) : column.isId ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">ID</span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">Custom</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={downloadData}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm w-full justify-center"
                    >
                      <Download className="h-4 w-4" />
                      Scarica schema JSON
                    </button>
                  </div>
                </div>
              ) : selectedTable ? (
                <div className="text-center py-4 text-gray-500">
                  Nessun dato disponibile per questa tabella
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Seleziona una tabella per visualizzare la struttura
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dati Tabella */}
        {selectedTable && tableData && tableData.records && tableData.records.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Table className="h-5 w-5 text-blue-600" />
                Dati Tabella "{selectedTable}"
              </h2>
              <div className="text-sm text-gray-500">
                {tableData.records.length} record visualizzati
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {tableColumns
                      .filter(col => !col.isXata || col.name === 'id')
                      .map((column, i) => (
                        <th 
                          key={i}
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column.name}
                        </th>
                    ))}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.records.map((record: any, i: number) => (
                    <React.Fragment key={i}>
                      <tr className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {tableColumns
                          .filter(col => !col.isXata || col.name === 'id')
                          .map((column, j) => (
                            <td key={j} className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {column.name === 'id' ? (
                                <span className="font-mono text-blue-600">{formatValue(record[column.name])}</span>
                              ) : (
                                <div className="max-w-xs truncate">
                                  {formatValue(record[column.name])}
                                </div>
                              )}
                            </td>
                        ))}
                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {expandedRecord === record.id ? 'Nascondi' : 'Dettagli'}
                          </button>
                        </td>
                      </tr>
                      {expandedRecord === record.id && (
                        <tr>
                          <td colSpan={tableColumns.filter(col => !col.isXata || col.name === 'id').length + 1}>
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                              <h4 className="font-medium mb-2">Record completo:</h4>
                              <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs">
                                {JSON.stringify(record, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API Response */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Risposta API
          </h2>
          
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-[400px]">
            {apiResponse || 'Nessuna risposta API disponibile'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DbDiagnostics;
