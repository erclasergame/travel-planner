'use client'

import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Calendar, Users, FileText, ArrowRight, Loader2 } from 'lucide-react';

const TravelPlanner = () => {
  const [currentScreen, setCurrentScreen] = useState('initial');
  const [tripData, setTripData] = useState({
    from: '',
    to: '',
    duration: '',
    people: '',
    description: ''
  });
  const [travelPlan, setTravelPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 🔧 FIX: Gestione corretta localStorage
  const [selectedModel, setSelectedModel] = useState('google/gemma-2-9b-it:free');
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // 🔧 FIX: Carica modello selezionato PRIMA di tutto
  useEffect(() => {
    // Verifica che siamo lato client
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('travel-planner-ai-model');
      if (saved && saved !== selectedModel) {
        setSelectedModel(saved);
        console.log('🔄 Modello caricato da localStorage:', saved);
      }
      setIsModelLoaded(true);
    }
  }, []);

  // 🔧 FIX: Salva modello quando cambia
  useEffect(() => {
    if (isModelLoaded && typeof window !== 'undefined') {
      localStorage.setItem('travel-planner-ai-model', selectedModel);
      console.log('💾 Modello salvato:', selectedModel);
    }
  }, [selectedModel, isModelLoaded]);

  // 🔧 FIX: Funzioni API aggiornate
  const generateAIPlan = async () => {
    console.log('🚀 Usando modello:', selectedModel);
    setLoading(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripData,
          action: 'generate',
          selectedModel: selectedModel  // 🔧 Usa il modello attualmente selezionato
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setTravelPlan(data.plan);
        setCurrentScreen('plan');
      } else {
        alert(`Errore: ${data.error}`);
      }
    } catch (error) {
      console.error('Errore nella generazione:', error);
      alert(`Errore nella generazione del piano: ${error.message}`);
    }
    setLoading(false);
  };

  // 🔧 FIX: Aggiorna anche le altre funzioni API
  const processPlan = async () => {
    console.log('🚀 Processando con modello:', selectedModel);
    setLoading(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripData,
          action: 'process',
          selectedModel: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setTravelPlan(data.plan);
      } else {
        alert(`Errore: ${data.error}`);
      }
    } catch (error) {
      console.error('Errore nel processing:', error);
      alert(`Errore nel processing: ${error.message}`);
    }
    setLoading(false);
  };

  const enhancePlan = async () => {
    console.log('🚀 Migliorando con modello:', selectedModel);
    setLoading(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripData,
          action: 'enhance',
          selectedModel: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setTravelPlan(data.plan);
      } else {
        alert(`Errore: ${data.error}`);
      }
    } catch (error) {
      console.error('Errore nel miglioramento:', error);
      alert(`Errore nel miglioramento: ${error.message}`);
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setTripData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tripData.from || !tripData.to || !tripData.duration) {
      alert('Per favore compila tutti i campi obbligatori');
      return;
    }
    generateAIPlan();
  };

  const resetForm = () => {
    setTripData({
      from: '',
      to: '',
      duration: '',
      people: '',
      description: ''
    });
    setTravelPlan([]);
    setCurrentScreen('initial');
  };

  // 🔧 FIX: Mostra il modello caricato correttamente
  if (currentScreen === 'initial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-lg mx-auto pt-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <h1 className="text-4xl font-bold text-gray-800">Travel Planner</h1>
              <a 
                href="/settings"
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                title="Impostazioni AI"
              >
                <Settings className="h-5 w-5" />
              </a>
            </div>
            <p className="text-gray-600">Pianifica il tuo viaggio perfetto</p>
            {/* 🔧 FIX: Mostra modello caricato correttamente */}
            <div className="text-xs text-gray-500 mt-2">
              {isModelLoaded ? (
                <>AI: {selectedModel.split('/')[1]?.split('-')[0] || selectedModel.split('/')[0]}</>
              ) : (
                <>Caricando modello...</>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Da dove parti?
                  </label>
                  <input
                    type="text"
                    value={tripData.from}
                    onChange={(e) => handleInputChange('from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. Milano"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Dove vuoi andare?
                  </label>
                  <input
                    type="text"
                    value={tripData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. Roma"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Durata del viaggio
                  </label>
                  <input
                    type="text"
                    value={tripData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. 3 giorni"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-2" />
                    Numero di persone
                  </label>
                  <input
                    type="text"
                    value={tripData.people}
                    onChange={(e) => handleInputChange('people', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-2" />
                    Descrizione aggiuntiva
                  </label>
                  <textarea
                    value={tripData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. Viaggio romantico, budget medio, preferisco musei e ristoranti locali"
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Generando piano...
                    </>
                  ) : (
                    <>
                      Genera Piano di Viaggio
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentScreen === 'plan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto pt-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Il Tuo Piano di Viaggio</h1>
            <div className="flex justify-center space-x-4">
              <button
                onClick={processPlan}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Elaborando...' : 'Elabora Piano'}
              </button>
              <button
                onClick={enhancePlan}
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Migliorando...' : 'Migliora Piano'}
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Nuovo Viaggio
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="prose max-w-none">
              {travelPlan.map((item, index) => (
                <div key={index} className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {item.title || `Giorno ${index + 1}`}
                  </h3>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {item.content || item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TravelPlanner;