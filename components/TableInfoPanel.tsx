// components/TableInfoPanel.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Database, Loader2, AlertCircle, Table, RotateCcw } from 'lucide-react';

interface XataRecord {
  id: string;
  [key: string]: any;
}

interface TableInfo {
  tableName: string;
  totalRows: number;
  lastRows: XataRecord[];
  success: boolean;
  error?: string;
}

interface TableInfoPanelProps {
  selectedTable: string;
}

const TableInfoPanel: React.FC<TableInfoPanelProps> = ({ selectedTable }) => {
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica informazioni tabella quando cambia la selezione
  useEffect(() => {
    if (selectedTable) {
      fetchTableInfo(selectedTable);
    } else {
      setTableInfo(null);
      setError(null);
    }
  }, [selectedTable]);

  const fetchTableInfo = async (tableName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/table-info?table=${encodeURIComponent(tableName)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: TableInfo = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Errore sconosciuto');
      }

      setTableInfo(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il caricamento';
      setError(errorMessage);
      console.error('Errore fetch table info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedTable) {
      fetchTableInfo(selectedTable);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sì' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatColumnName = (key: string): string => {
    if (key === 'id') return 'ID';
    if (key.startsWith('xata.')) return key.replace('xata.', '').toUpperCase();
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Info Tabella</h3>
        </div>
        
        {selectedTable && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Aggiorna"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {!selectedTable ? (
          <div className="text-center py-8 text-gray-500">
            <Table className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Seleziona una tabella per vedere le informazioni</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Caricamento...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Errore</span>
            </div>
            <p className="text-red-600 mt-1 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-red-600 hover:text-red-800 underline text-sm"
            >
              Riprova
            </button>
          </div>
        ) : tableInfo ? (
          <div className="space-y-4">
            {/* Statistiche tabella */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">Selezionata:</p>
                  <p className="font-medium text-purple-700">{tableInfo.tableName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Totale righe:</p>
                  <p className="font-medium text-green-700">{tableInfo.totalRows.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Ultime righe */}
            {tableInfo.lastRows.length > 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <span>Ultime {Math.min(10, tableInfo.lastRows.length)} righe</span>
                  <span className="text-sm text-gray-500">
                    (ordinate per data creazione)
                  </span>
                </h4>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {tableInfo.lastRows[0] && Object.keys(tableInfo.lastRows[0])
                            .filter(key => !key.startsWith('xata.') || key === 'xata.createdAt')
                            .slice(0, 4) // Limita a 4 colonne per evitare overflow
                            .map(key => (
                              <th
                                key={key}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {formatColumnName(key)}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableInfo.lastRows.map((row, index) => (
                          <tr key={row.id || index} className="hover:bg-gray-50">
                            {Object.keys(row)
                              .filter(key => !key.startsWith('xata.') || key === 'xata.createdAt')
                              .slice(0, 4)
                              .map(key => (
                                <td
                                  key={key}
                                  className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate"
                                  title={formatValue(row[key])}
                                >
                                  {formatValue(row[key])}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500 text-center">
                  {tableInfo.lastRows.length === 10 && tableInfo.totalRows > 10 
                    ? `Mostrando 10 di ${tableInfo.totalRows} righe totali`
                    : `${tableInfo.lastRows.length} righe totali`
                  }
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Table className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nessuna riga trovata in questa tabella</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TableInfoPanel;