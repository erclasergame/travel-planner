import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, RotateCcw, Database, FileSpreadsheet, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface InsertResult {
  total_records: number;
  inserted: number;
  updated: number;
  errors: string[];
  success_rate: string;
}

interface Country {
  code: string;
  name: string;
}

const BulkInsertAdmin = () => {
  const [selectedTable, setSelectedTable] = useState<'cities' | 'attractions' | 'events'>('cities');
  const [inputData, setInputData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<InsertResult | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lista paesi per auto-popolazione (primi 20 come esempio)
  const sampleCountries: Country[] = [
    { code: 'AD', name: 'Andorra' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AL', name: 'Albania' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AO', name: 'Angola' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AT', name: 'Austria' },
    { code: 'AU', name: 'Australia' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BI', name: 'Burundi' },
    { code: 'BJ', name: 'Benin' }
  ];

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputData(content);
        addLog(`File caricato: ${file.name} (${file.size} bytes)`);
      };
      reader.readAsText(file);
    }
  };

  const parseCSVData = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const record: any = {};
      headers.forEach((header, index) => {
        let value: any = values[index];
        
        // Parsing automatico dei tipi
        if (header.includes('lat') || header.includes('lng')) {
          value = parseFloat(value);
        } else if (header === 'population') {
          value = parseInt(value);
        } else if (header === 'is_active') {
          value = value.toLowerCase() === 'true';
        }
        
        record[header] = value;
      });
      return record;
    });
    
    return data;
  };

  const generateSampleData = async (table: string, country: string) => {
    addLog(`Generando dati di esempio per ${table} in ${country}...`);
    
    switch (table) {
      case 'cities':
        return [
          {
            country_code: country,
            name: `Capital City`,
            code: `${country.toLowerCase()}_capital`,
            type: 'major',
            region_name: `Main Region`,
            region_type: 'region',
            lat: 40.0 + Math.random() * 20,
            lng: 0.0 + Math.random() * 40,
            population: 500000 + Math.floor(Math.random() * 2000000)
          },
          {
            country_code: country,
            name: `Secondary City`,
            code: `${country.toLowerCase()}_secondary`,
            type: 'secondary',
            region_name: `Secondary Region`,
            region_type: 'region',
            lat: 40.0 + Math.random() * 20,
            lng: 0.0 + Math.random() * 40,
            population: 100000 + Math.floor(Math.random() * 500000)
          }
        ];
      
      case 'attractions':
        return [
          {
            city_code: `${country.toLowerCase()}_capital`,
            name: `Historic Monument`,
            code: `${country.toLowerCase()}_monument`,
            description: 'A beautiful historic monument',
            type: 'monument',
            subtype: 'historical',
            lat: 40.0 + Math.random() * 20,
            lng: 0.0 + Math.random() * 40,
            visit_duration: '2h',
            opening_hours: '{"daily": "09:00-18:00"}',
            cost_range: '€10-15',
            image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
            image_alt: 'Historic monument',
            is_active: true
          }
        ];
      
      case 'events':
        return [
          {
            city_code: `${country.toLowerCase()}_capital`,
            name: `Annual Festival`,
            code: `${country.toLowerCase()}_festival`,
            description: 'Traditional annual festival',
            recurrence_rule: 'annual',
            season: 'summer',
            start_date: '2025-07-01',
            end_date: '2025-07-03',
            duration: '3 days',
            cost_range: 'Free',
            image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
            image_alt: 'Festival celebration',
            is_active: true
          }
        ];
      
      default:
        return [];
    }
  };

  const processBulkInsert = async (data: any[]) => {
    if (data.length === 0) {
      addLog('❌ Nessun dato da inserire');
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: data.length });
    addLog(`🚀 Avvio inserimento bulk: ${data.length} record in tabella ${selectedTable}`);

    try {
      const response = await fetch('/api/admin/bulk-insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: selectedTable,
          data: data,
          batch_size: 25,
          on_conflict: 'update'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setResults(result.results);
        addLog(`✅ Inserimento completato! ${result.results.inserted} inseriti, ${result.results.updated} aggiornati`);
        addLog(`📊 Tasso successo: ${result.summary.success_rate}`);
        
        if (result.results.errors.length > 0) {
          addLog(`⚠️ ${result.results.errors.length} errori riscontrati`);
          result.results.errors.forEach(error => addLog(`   • ${error}`));
        }
      } else {
        throw new Error(result.error || 'Errore sconosciuto');
      }

    } catch (error) {
      addLog(`❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      console.error('Bulk insert error:', error);
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleSubmit = async () => {
    if (!inputData.trim()) {
      addLog('❌ Inserisci dei dati CSV o genera dati di esempio');
      return;
    }

    const parsedData = parseCSVData(inputData);
    await processBulkInsert(parsedData);
  };

  const handleAutoGenerate = async () => {
    addLog('🤖 Generazione automatica dati per tutti i paesi...');
    const allData: any[] = [];
    
    setProgress({ current: 0, total: sampleCountries.length });
    
    for (let i = 0; i < sampleCountries.length; i++) {
      const country = sampleCountries[i];
      const countryData = await generateSampleData(selectedTable, country.code);
      allData.push(...countryData);
      setProgress({ current: i + 1, total: sampleCountries.length });
      
      // Piccola pausa per non bloccare UI
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    addLog(`✅ Generati ${allData.length} record per ${sampleCountries.length} paesi`);
    
    // Converti in CSV
    if (allData.length > 0) {
      const headers = Object.keys(allData[0]);
      const csvContent = [
        headers.join(','),
        ...allData.map(record => headers.map(h => record[h]).join(','))
      ].join('\n');
      
      setInputData(csvContent);
    }
    
    setProgress({ current: 0, total: 0 });
  };

  const clearData = () => {
    setInputData('');
    setResults(null);
    setLogs([]);
    addLog('🧹 Dati puliti');
  };

  const getSampleTemplate = () => {
    switch (selectedTable) {
      case 'cities':
        return 'country_code,name,code,type,region_name,region_type,lat,lng,population\nIT,Rome,rome,major,Lazio,region,41.9028,12.4964,2870000';
      case 'attractions':
        return 'city_code,name,code,description,type,subtype,lat,lng,visit_duration,opening_hours,cost_range,image_url,image_alt,is_active\nrome,Colosseum,rome_colosseum,Ancient amphitheatre,monument,historical,41.8902,12.4922,2h30m,"{""daily"": ""09:00-19:00""}",€16,https://images.unsplash.com/photo-1552832230-c0197dd311b5,Colosseum exterior,true';
      case 'events':
        return 'city_code,name,code,description,recurrence_rule,season,start_date,end_date,duration,cost_range,image_url,image_alt,is_active\nrome,Rome Film Festival,rome_film_festival,International cinema festival,annual,autumn,2025-10-14,2025-10-24,11 days,€15-50,https://images.unsplash.com/photo-1489599577372-f5f4c4e7e7e5,Film festival,true';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Bulk Insert Database</h1>
        </div>

        {/* Selezione Tabella */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tabella Destinazione
          </label>
          <div className="flex gap-4">
            {(['cities', 'attractions', 'events'] as const).map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  selectedTable === table
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {table.charAt(0).toUpperCase() + table.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Input Dati */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Dati CSV
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setInputData(getSampleTemplate())}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Template
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={isProcessing}
                className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Auto-Generate
              </button>
            </div>
          </div>
          
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={`Inserisci dati CSV per ${selectedTable}...\n\nOppure carica un file o usa Auto-Generate`}
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          
          <div className="flex gap-2 mt-2">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" />
              Carica CSV
            </button>
            <button
              onClick={clearData}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Pulisci
            </button>
          </div>
        </div>

        {/* Progress */}
        {progress.total > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !inputData.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? (
              <>
                <Clock className="h-5 w-5 animate-spin" />
                Elaborazione...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Avvia Insert
              </>
            )}
          </button>
        </div>

        {/* Risultati */}
        {results && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Risultati Inserimento
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Totale:</span>
                <div className="font-semibold text-lg">{results.total_records}</div>
              </div>
              <div>
                <span className="text-gray-600">Inseriti:</span>
                <div className="font-semibold text-lg text-green-600">{results.inserted}</div>
              </div>
              <div>
                <span className="text-gray-600">Aggiornati:</span>
                <div className="font-semibold text-lg text-blue-600">{results.updated}</div>
              </div>
              <div>
                <span className="text-gray-600">Successo:</span>
                <div className="font-semibold text-lg text-purple-600">{results.success_rate}</div>
              </div>
            </div>
            
            {results.errors.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Errori ({results.errors.length})</span>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded p-2 max-h-32 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-orange-800 font-mono">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 text-white mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>Log Operazioni</span>
            </div>
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkInsertAdmin;