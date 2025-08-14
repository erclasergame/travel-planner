'use client'

import React, { useState, useEffect } from 'react';
import { 
  MapPin, Sparkles, Upload, ArrowRight, Plane, Camera, 
  Coffee, Clock, Users, Globe, Zap, FileText, Share2,
  CheckCircle, Star, Heart, Compass
} from 'lucide-react';
import Link from 'next/link';

const SplashPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-indigo-200 rounded-full opacity-25 animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-pink-200 rounded-full opacity-20 animate-pulse delay-3000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="pt-8 pb-4 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                  <Compass className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Travel Planner
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Il sistema completo per <span className="font-semibold text-blue-600">pianificare</span> e{' '}
                <span className="font-semibold text-purple-600">visualizzare</span> i tuoi viaggi perfetti
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              
              {/* Travel Planner Card */}
              <Link href="/planner">
                <div
                  className={`group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:scale-105 ${
                    hoveredCard === 'planner' ? 'ring-4 ring-blue-300' : ''
                  }`}
                  onMouseEnter={() => setHoveredCard('planner')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>
                  
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>

                    {/* Content */}
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                      🎯 Pianifica Viaggio
                    </h2>
                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                      Crea itinerari personalizzati con l'intelligenza artificiale. 
                      Inserisci le tue preferenze e ottieni un piano dettagliato perfetto per te.
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {[
                        { icon: Zap, text: 'Generazione automatica con AI' },
                        { icon: Users, text: 'Personalizzazione per gruppo' },
                        { icon: Clock, text: 'Orari e tempi ottimizzati' },
                        { icon: Coffee, text: 'Ristoranti e attrazioni locali' }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <feature.icon className="h-5 w-5 text-blue-500" />
                          <span className="text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-center group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                      Inizia a pianificare
                    </div>
                  </div>
                </div>
              </Link>

              {/* Travel Viewer Card */}
              <Link href="/viewer">
                <div
                  className={`group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:scale-105 ${
                    hoveredCard === 'viewer' ? 'ring-4 ring-purple-300' : ''
                  }`}
                  onMouseEnter={() => setHoveredCard('viewer')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-500"></div>
                  
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                        <Globe className="h-8 w-8 text-white" />
                      </div>
                      <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>

                    {/* Content */}
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                      🗺️ Visualizza Itinerario
                    </h2>
                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                      Trasforma il tuo itinerario esistente in una visualizzazione 
                      interattiva con mappa, PDF scaricabile e link condivisibili.
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {[
                        { icon: Upload, text: 'Carica JSON esistente' },
                        { icon: MapPin, text: 'Mappa interattiva' },
                        { icon: FileText, text: 'Export PDF elegante' },
                        { icon: Share2, text: 'Condivisione con link' }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <feature.icon className="h-5 w-5 text-purple-500" />
                          <span className="text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-center group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300">
                      Visualizza itinerario
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Process Flow */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-16">
              <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
                Come funziona
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Scegli il tuo percorso</h4>
                  <p className="text-gray-600">
                    Pianifica un nuovo viaggio con l'AI oppure carica un itinerario esistente da visualizzare
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Personalizza e ottimizza</h4>
                  <p className="text-gray-600">
                    Modifica manualmente ogni dettaglio o lascia che l'AI elabori le tue modifiche
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Visualizza e condividi</h4>
                  <p className="text-gray-600">
                    Esporta in PDF, visualizza su mappa interattiva e condividi con chi vuoi
                  </p>
                </div>
              </div>
            </div>

            {/* Features Highlight */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-xl p-8 text-white">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4">Tutto quello che ti serve</h3>
                <p className="text-xl opacity-90">Un sistema completo per viaggiatori moderni</p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { icon: Plane, title: 'Multi-destinazione', desc: 'Viaggi di più giorni con spostamenti' },
                  { icon: Camera, title: 'Foto e mappe', desc: 'Visualizzazione geografica dettagliata' },
                  { icon: Heart, title: 'Personalizzato', desc: 'AI adattata alle tue preferenze' },
                  { icon: Star, title: 'Professionale', desc: 'Export PDF di qualità premium' }
                ].map((feature, index) => (
                  <div key={index} className="text-center">
                    <feature.icon className="h-12 w-12 mx-auto mb-4 opacity-90" />
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm opacity-80">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-3 mb-4 md:mb-0">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Compass className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Travel Planner</span>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Gratis e sicuro</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span>AI avanzata</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Globe className="h-4 w-4 text-purple-500" />
                    <span>Made in Italy</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SplashPage;