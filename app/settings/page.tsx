'use client'

import React, { useState, useEffect } from 'react';
import { Search, Settings, Zap, DollarSign, CheckCircle, ArrowLeft, AlertCircle, Loader2, RefreshCw, Globe, Shield } from 'lucide-react';

const SettingsPage = () => {
  const [selectedModel, setSelectedModel] = useState('google/gemma-2-9b-it:free');
  const [searchTerm, setSearchTerm] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [aiModels, setAiModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [globalSettings, setGlobalSettings] = useState(null);

  // Carica modelli AI all'avvio
  useEffect(() => {
    loadModels();
    loadGlobalSettings();
  }, []);

  // 🔧 NUOVO: Carica settings globali
  const loadGlobalSettings = async () => {
    try {
      console.log('🔍 Loading global settings...');
      const response = await fetch('/api/admin-settings');
      const data = await response.json();
      
      if (data.success) {
        setGlobalSettings(data.settings);
        setSelectedModel(data.settings.aiModel);
        console.log('✅ Global settings loaded:', data.settings);
      } else {
        console.log('⚠️ No global settings found');
      }
    } catch (error) {
      console.error('❌ Error loading global settings:', error);
    }
  };

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      
      if (data.success) {
        setAiModels(data.models);
        setLastUpdated(new Date(data.lastUpdated));
      } else {
        setAiModels(data.models);
        setError('Lista limitata - errore connessione OpenRouter');
      }
    } catch (err) {
      setError('Errore nel caricamento modelli');
      setAiModels([
        {
          id: 'google/gemma-2-9b-it:free',
          name: 'Gemma 2 9B',
          provider: 'Google',
          category: 'free',
          cost: 'Gratuito',
          description: 'Modello gratuito per test e sviluppo'
        }
      ]);
    }
    
    setLoading(false);
  };

  // Filtra modelli in base alla ricerca
  const filteredModels = aiModels.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔧 NUOVO: Salva settings globali
  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving global settings:', selectedModel);
      
      const response = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiModel: selectedModel,
          updatedBy: 'admin'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGlobalSettings(data.settings);
        alert('✅ Modello AI salvato globalmente! Tutti i visitatori useranno ora: ' + selectedModel);
        console.log('✅ Global settings saved successfully');
      } else {
        throw new Error(data.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('❌ Error saving global settings:', error);
      alert('❌ Errore nel salvataggio: ' + error.message);
    }
    setSaving(false);
  };

  // Test rapido del modello
  const testModel = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: 'Genera un semplice JSON: {"test": "ok", "status": "working"}'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Modello funzionante!',
          data: data
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Errore nel test',
          data: data
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message,
        data: null
      });
    }

    setTesting(false);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'cheap': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'free': return <CheckCircle className="h-4 w-4" />;
      case 'cheap': return <DollarSign className="h-4 w-4" />;
      case 'premium': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <a 
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna al Travel Planner
          </a>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            ⚙️ Admin Settings
          </h1>
          <button
            onClick={loadModels}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
        </div>

        {/* ✅ NUOVO: Info sistema globale */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-800">Configurazione Globale</h3>
          </div>
          <p className="text-blue-700 mb-4">
            Il modello AI che selezioni qui sarà utilizzato da <strong>tutti i visitatori</strong> del sistema su tutti i dispositivi (PC, tablet, mobile).
          </p>
          {globalSettings && (
            <div className="bg-white rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Modello Attivo:</span>
                  <p className="font-semibold text-blue-600">{globalSettings.aiModel}</p>
                </div>
                <div>
                  <span className="text-gray-600">Ultimo Aggiornamento:</span>
                  <p className="font-semibold">{new Date(globalSettings.lastUpdated).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Aggiornato da:</span>
                  <p className="font-semibold">{globalSettings.updatedBy}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista Modelli */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Info aggiornamento */}
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : error ? (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium">
                    {loading ? 'Caricando modelli...' : 
                     error ? error : 
                     `${aiModels.length} modelli disponibili`}
                  </span>
                </div>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    Aggiornato: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Ricerca */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca modelli AI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {searchTerm && (
                <p className="text-sm text-gray-600 mt-2">
                  {filteredModels.length} risultati per "{searchTerm}"
                </p>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Caricando modelli da OpenRouter...</p>
              </div>
            )}

            {/* Sezioni per categoria */}
            {!loading && ['free', 'cheap', 'premium'].map(category => {
              const categoryModels = filteredModels.filter(m => m.category === category);
              if (categoryModels.length === 0) return null;

              const categoryTitles = {
                free: '🆓 Modelli Gratuiti',
                cheap: '💰 Modelli Economici',
                premium: '⭐ Modelli Premium'
              };

              return (
                <div key={category} className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                    {categoryTitles[category]}
                    <span className="text-sm font-normal text-gray-500">
                      {categoryModels.length} modelli
                    </span>
                  </h3>
                  
                  <div className="space-y-3">
                    {categoryModels.map((model) => (
                      <div
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedModel === model.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-800">
                                {model.name}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCategoryColor(model.category)}`}>
                                {getCategoryIcon(model.category)}
                                {model.cost}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {model.description}
                            </p>
                            
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span><strong>Provider:</strong> {model.provider}</span>
                              <span><strong>ID:</strong> {model.id}</span>
                              {model.contextLength && model.contextLength !== 'N/A' && (
                                <span><strong>Context:</strong> {model.contextLength}</span>
                              )}
                            </div>
                          </div>
                          
                          {selectedModel === model.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Nessun risultato */}
            {!loading && filteredModels.length === 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nessun modello trovato per "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Pannello Controlli */}
          <div className="space-y-6">
            {/* Modello Selezionato */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                🎯 Modello Globale
              </h3>
              
              {(() => {
                const selected = aiModels.find(m => m.id === selectedModel);
                return selected ? (
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-gray-800">{selected.name}</div>
                      <div className="text-sm text-gray-600">{selected.provider}</div>
                      <div className="text-xs text-gray-500 mt-1">{selected.id}</div>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-lg text-sm ${getCategoryColor(selected.category)}`}>
                      {selected.cost}
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {selected.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Seleziona un modello dalla lista</p>
                );
              })()}
            </div>

            {/* Test Rapido */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                🧪 Test Rapido
              </h3>
              
              <button
                onClick={testModel}
                disabled={testing || !selectedModel}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center mb-4"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testa Modello'
                )}
              </button>
              
              {testResult && (
                <div className={`p-3 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 🔧 NUOVO: Salva Globalmente */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <button
                onClick={saveGlobalSettings}
                disabled={!selectedModel || saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    💾 Salva per Tutto il Sistema
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Tutti i visitatori utilizzeranno questo modello
              </p>
            </div>

            {/* Info Costi */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                💡 Info Costi
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>1M token ≈</strong> 750.000 parole
                </div>
                <div>
                  <strong>Itinerario tipico:</strong> ~500 token
                </div>
                <div>
                  <strong>Con $1 fai:</strong> ~1000-6000 itinerari
                </div>
                <div className="pt-2 border-t">
                  <strong>Lista aggiornata</strong> automaticamente da OpenRouter
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;