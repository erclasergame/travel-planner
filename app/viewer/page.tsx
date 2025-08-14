'use client'

import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, ArrowLeft, AlertCircle, CheckCircle, 
  Loader2, Eye, Trash2, Download, Lightbulb, Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveConvertedItinerary } from '@/utils/storageManager';

interface UploadError {
  type: 'file' | 'json' | 'format' | 'api';
  message: string;
}

const ViewerUploadPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [jsonText, setJsonText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Sample JSON per esempio
  const sampleJson = {
    tripInfo: {
      from: "Milano",
      to: "Roma", 
      duration: "2",
      people: "2",
      description: "Weekend romantico nella Capitale"
    },
    itinerary: [
      {
        day: 1,
        movements: [{
          activities: [
            {
              description: "Check-in hotel boutique centro storico",
              time: "15:00-15:30",
              cost: "€120-150",
              alternatives: ["Hotel Artemide", "The First Roma"],
              notes: "Zona Pantheon per atmosfera"
            },
            {
              description: "Aperitivo vista Pantheon", 
              time: "18:00-19:30",
              cost: "€15-20",
              alternatives: ["Salotto 42", "Armando al Pantheon"],
              notes: "Spritz e antipasti tipici"
            }
          ]
        }]
      }
    ]
  };

  // Gestione upload file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setValidationResult(null);

    // Controlla tipo file
    if (!file.name.endsWith('.json')) {
      setError({
        type: 'file',
        message: 'Seleziona un file JSON valido'
      });
      return;
    }

    // Controlla dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError({
        type: 'file',
        message: 'File troppo grande. Massimo 5MB'
      });
      return;
    }

    setUploadedFile(file);

    // Leggi contenuto file
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      validateJsonContent(content);
    };

    reader.onerror = () => {
      setError({
        type: 'file',
        message: 'Errore durante la lettura del file'
      });
    };

    reader.readAsText(file);
  };

  // Gestione input textarea
  const handleTextChange = (value: string) => {
    setJsonText(value);
    setUploadedFile(null);
    setError(null);
    setValidationResult(null);

    if (value.trim()) {
      // Debounce validation
      setTimeout(() => validateJsonContent(value), 500);
    }
  };

  // Validazione JSON
  const validateJsonContent = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Test parsing JSON
      const parsed = JSON.parse(content);

      // Validazione tramite API
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'validate',
          data: parsed 
        })
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
        
        if (!result.valid) {
          setError({
            type: 'format',
            message: result.errors?.[0] || 'Formato JSON non valido'
          });
        }
      } else {
        throw new Error('Errore validazione API');
      }

    } catch (e) {
      if (e instanceof SyntaxError) {
        setError({
          type: 'json',
          message: 'JSON non valido: ' + e.message
        });
      } else {
        setError({
          type: 'api',
          message: 'Errore durante la validazione'
        });
      }
    }
  };

  // Conversione e visualizzazione
  const handleConvertAndView = async () => {
    if (!jsonText.trim()) {
      setError({
        type: 'format',
        message: 'Inserisci un JSON da convertire'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const originalData = JSON.parse(jsonText);

      // Conversione tramite API
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(originalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore conversione API');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Conversione fallita');
      }

      // Salva dati convertiti in sessionStorage
      const saved = saveConvertedItinerary(result.converted, originalData);
      
      if (!saved) {
        console.warn('Impossibile salvare in sessionStorage, procedo comunque');
      }

      // Redirect a pagina risultato
      router.push('/viewer/result');

    } catch (error) {
      console.error('Errore conversione:', error);
      setError({
        type: 'api',
        message: error instanceof Error ? error.message : 'Errore durante la conversione'
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setJsonText('');
    setUploadedFile(null);
    setError(null);
    setValidationResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Carica esempio
  const loadSample = () => {
    const sampleText = JSON.stringify(sampleJson, null, 2);
    setJsonText(sampleText);
    setUploadedFile(null);
    validateJsonContent(sampleText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna alla home
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Globe className="h-8 w-8 mr-3 text-purple-600" />
            Visualizza Itinerario
          </h1>
          
          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Info Section */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-purple-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-2">
                Come funziona
              </h3>
              <p className="text-purple-700 mb-3">
                Carica un file JSON del tuo itinerario esistente oppure incollalo nel campo di testo. 
                Il sistema lo convertirà automaticamente in una visualizzazione interattiva con mappa, 
                statistiche e possibilità di export PDF.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={loadSample}
                  className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Carica esempio
                </button>
                <Link 
                  href="/planner"
                  className="text-sm bg-white text-purple-600 px-3 py-1 rounded-lg border border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  Crea nuovo itinerario
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Upload Section */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              1. Carica il tuo itinerario
            </h2>

            {/* File Upload */}
            <div className="mb-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  uploadedFile 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {uploadedFile ? (
                  <div className="flex items-center justify-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{uploadedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Clicca per caricare un file JSON
                    </p>
                    <p className="text-sm text-gray-500">
                      Oppure trascina il file qui (max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">oppure</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Text Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Incolla il JSON del tuo itinerario
                </label>
                <div className="flex space-x-2">
                  {jsonText && (
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>{showPreview ? 'Nascondi' : 'Anteprima'}</span>
                    </button>
                  )}
                  <button
                    onClick={resetForm}
                    className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Pulisci</span>
                  </button>
                </div>
              </div>
              
              <textarea
                value={jsonText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`{\n  "tripInfo": {\n    "from": "Milano",\n    "to": "Roma",\n    "duration": "2",\n    "people": "2"\n  },\n  "itinerary": [...]\n}`}
                className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
              />
            </div>

            {/* Preview */}
            {showPreview && jsonText && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Anteprima JSON:</h4>
                <pre className="text-xs text-gray-600 overflow-auto max-h-32 whitespace-pre-wrap">
                  {jsonText}
                </pre>
              </div>
            )}
          </div>

          {/* Validation & Actions */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              2. Validazione e conversione
            </h2>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Errore</p>
                  <p className="text-sm text-red-600">{error.message}</p>
                </div>
              </div>
            )}

            {/* Validation Success */}
            {validationResult?.valid && !error && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">JSON valido</p>
                  <p className="text-sm text-green-600">
                    Il formato è corretto e pronto per la conversione
                  </p>
                </div>
              </div>
            )}

            {/* Validation Details */}
            {validationResult && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-800 mb-2">Dettagli validazione:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {validationResult.warnings?.map((warning: string, index: number) => (
                    <p key={index}>• {warning}</p>
                  ))}
                  {validationResult.errors?.map((error: string, index: number) => (
                    <p key={index} className="text-red-600">• {error}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleConvertAndView}
                disabled={loading || !jsonText.trim() || !!error}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Convertendo...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    <span>Converti e Visualizza</span>
                  </>
                )}
              </button>

              {jsonText && (
                <button
                  onClick={() => {
                    const blob = new Blob([jsonText], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'itinerario.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Scarica JSON</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Supportiamo il formato JSON del Travel Planner. 
            <Link href="/planner" className="text-purple-600 hover:text-purple-800 ml-1">
              Crea un nuovo itinerario
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewerUploadPage;