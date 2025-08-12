'use client'

import React, { useState, useEffect } from 'react';
import { Search, Settings, Zap, DollarSign, CheckCircle, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

const SettingsPage = () => {
  const [selectedModel, setSelectedModel] = useState('google/gemma-2-9b-it:free');
  const [searchTerm, setSearchTerm] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Lista modelli AI con info dettagliate
  const aiModels = [
    // GRATUITI
    {
      id: 'google/gemma-2-9b-it:free',
      name: 'Gemma 2 9B',
      provider: 'Google',
      category: 'free',
      cost: 'Gratuito',
      speed: 'Veloce',
      quality: 'Buona',
      description: 'Modello gratuito per test e sviluppo'
    },
    {
      id: 'microsoft/phi-3-mini-128k-instruct:free',
      name: 'Phi-3 Mini',
      provider: 'Microsoft',
      category: 'free',
      cost: 'Gratuito',
      speed: 'Molto veloce',
      quality: 'Buona',
      description: 'Piccolo ma efficiente, ottimo per task semplici'
    },
    {
      id: 'meta-llama/llama-3.1-8b-instruct:free',
      name: 'Llama 3.1 8B',
      provider: 'Meta',
      category: 'free',
      cost: 'Gratuito',
      speed: 'Veloce',
      quality: 'Ottima',
      description: 'Modello open-source potente e gratuito'
    },
    
    // ECONOMICI
    {
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'DeepSeek',
      category: 'cheap',
      cost: '$0.14/1M',
      speed: 'Veloce',
      quality: 'Eccellente',
      description: 'Ottimo rapporto qualità/prezzo per itinerari dettagliati'
    },
    {
      id: 'google/gemini-flash-1.5',
      name: 'Gemini Flash 1.5',
      provider: 'Google',
      category: 'cheap',
      cost: '$0.35/1M',
      speed: 'Molto veloce',
      quality: 'Eccellente',
      description: 'Velocissimo per task di planning e organizing'
    },
    {
      id: 'anthropic/claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      category: 'cheap',
      cost: '$0.80/1M',
      speed: 'Molto veloce',
      quality: 'Eccellente',
      description: 'Claude veloce ed economico, perfetto per itinerari'
    },
    
    // PREMIUM
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      category: 'premium',
      cost: '$15/1M',
      speed: 'Normale',
      quality: 'Eccezionale',
      description: 'Il migliore per itinerari creativi e dettagliati'
    },
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      category: 'premium',
      cost: '$25/1M',
      speed: 'Normale',
      quality: 'Eccezionale',
      description: 'Versatile e potente per ogni tipo di planning'
    },
    {
      id: 'google/gemini-pro-1.5',
      name: 'Gemini Pro 1.5',
      provider: 'Google',
      category: 'premium',
      cost: '$7/1M',
      speed: 'Veloce',
      quality: 'Eccellente',
      description: 'Grande context window per itinerari complessi'
    }
  ];

  // Filtra modelli in base alla ricerca
  const filteredModels = aiModels.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Carica settings salvati
  useEffect(() => {
    const saved = localStorage.getItem('travel-planner-ai-model');
    if (saved) {
      setSelectedModel(saved);
    }
  }, []);

  // Salva settings
  const saveSettings = () => {
    localStorage.setItem('travel-planner-ai-model', selectedModel);
    alert('✅ Impostazioni salvate!');
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
      
      if (response.ok) {
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
          <h1 className="text-3xl font-bold text-gray-800">⚙️ Impostazioni AI</h1>
          <div></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista Modelli */}
          <div className="lg:col-span-2 space-y-6">
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
            </div>

            {/* Sezioni per categoria */}
            {['free', 'cheap', 'premium'].map(category => {
              const categoryModels = filteredModels.filter(m => m.category === category);
              if (categoryModels.length === 0) return null;

              const categoryTitles = {
                free: '🆓 Modelli Gratuiti',
                cheap: '💰 Modelli Economici',
                premium: '⭐ Modelli Premium'
              };

              return (
                <div key={category} className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {categoryTitles[category]}
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
                              <span><strong>Velocità:</strong> {model.speed}</span>
                              <span><strong>Qualità:</strong> {model.quality}</span>
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
          </div>

          {/* Pannello Controlli */}
          <div className="space-y-6">
            {/* Modello Selezionato */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                🎯 Modello Selezionato
              </h3>
              
              {(() => {
                const selected = aiModels.find(m => m.id === selectedModel);
                return selected ? (
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-gray-800">{selected.name}</div>
                      <div className="text-sm text-gray-600">{selected.provider}</div>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-lg text-sm ${getCategoryColor(selected.category)}`}>
                      {selected.cost}
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {selected.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Nessun modello selezionato</p>
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
                disabled={testing}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
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
                <div className={`mt-4 p-3 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
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

            {/* Salva Impostazioni */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <button
                onClick={saveSettings}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                💾 Salva Impostazioni
              </button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Le impostazioni verranno salvate nel browser
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;