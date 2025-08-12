'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Sparkles, Zap, Brain, Settings as SettingsIcon } from 'lucide-react';

const SettingsPage = () => {
  const [selectedModel, setSelectedModel] = useState('google/gemma-2-9b-it:free');
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // 🔧 FIX: Carica modello corrente dal localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('travel-planner-ai-model');
      if (saved) {
        setSelectedModel(saved);
        console.log('🔄 Settings: Modello caricato:', saved);
      }
      setIsModelLoaded(true);
    }
  }, []);

  const models = [
    {
      id: 'google/gemma-2-9b-it:free',
      name: 'Gemma 2 9B IT',
      description: 'Modello italiano di Google, ottimo per viaggi in Italia',
      speed: 'Velocità: Media',
      quality: 'Qualità: Alta',
      icon: <Brain className="h-5 w-5" />
    },
    {
      id: 'meta-llama/llama-3.1-8b-instruct:free',
      name: 'Llama 3.1 8B',
      description: 'Modello Meta, bilanciato tra velocità e qualità',
      speed: 'Velocità: Alta',
      quality: 'Qualità: Media',
      icon: <Zap className="h-5 w-5" />
    },
    {
      id: 'anthropic/claude-3.5-sonnet:free',
      name: 'Claude 3.5 Sonnet',
      description: 'Modello avanzato di Anthropic, massima qualità',
      speed: 'Velocità: Bassa',
      quality: 'Qualità: Eccellente',
      icon: <Sparkles className="h-5 w-5" />
    }
  ];

  // 🔧 FIX: Salva settings con feedback
  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('travel-planner-ai-model', selectedModel);
      console.log('💾 Settings: Modello salvato:', selectedModel);
      alert('✅ Impostazioni salvate!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <a 
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna al Travel Planner
          </a>
          <div className="flex items-center">
            <SettingsIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Impostazioni AI</h1>
          </div>
        </div>

        {/* Modello attuale */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Modello AI Attuale</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Modello selezionato:</p>
                <p className="font-semibold text-gray-800">
                  {isModelLoaded ? selectedModel : 'Caricando...'}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                {isModelLoaded ? '✅ Caricato' : '⏳ Caricamento...'}
              </div>
            </div>
          </div>
        </div>

        {/* Selezione modello */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Scegli il Modello AI</h2>
          <p className="text-gray-600 mb-6">
            Seleziona il modello di intelligenza artificiale che preferisci per generare i tuoi piani di viaggio.
            Ogni modello ha caratteristiche diverse di velocità e qualità.
          </p>

          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      selectedModel === model.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {model.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{model.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                        <span>{model.speed}</span>
                        <span>{model.quality}</span>
                      </div>
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <div className="bg-blue-500 text-white p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informazioni aggiuntive */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informazioni sui Modelli</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Gemma 2 9B IT</p>
                <p>Modello specializzato per l'italiano, perfetto per viaggi in Italia. Offre un ottimo equilibrio tra velocità e qualità per la lingua italiana.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Llama 3.1 8B</p>
                <p>Modello veloce e efficiente, ideale quando hai bisogno di risposte rapide. Buona qualità per la maggior parte delle richieste di viaggio.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Claude 3.5 Sonnet</p>
                <p>Il modello più avanzato disponibile, offre la massima qualità e dettaglio nei piani di viaggio. Richiede più tempo per la generazione.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pulsante salva */}
        <div className="text-center">
          <button
            onClick={saveSettings}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Check className="h-5 w-5 mr-2" />
            Salva Impostazioni
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Le tue impostazioni verranno salvate automaticamente e utilizzate per tutti i futuri piani di viaggio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;