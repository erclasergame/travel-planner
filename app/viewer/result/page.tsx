'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import TravelViewer from '@/components/TravelViewer';
import { getConvertedItinerary, clearTravelData } from '@/utils/storageManager';

interface TripData {
  metadata: {
    id: string;
    title: string;
    description?: string;
    duration: number;
    totalKm: number;
    totalTime: string;
    totalCost: string;
    created: string;
    modified: string;
    isPublic: boolean;
    tags: string[];
  };
  days: Array<{
    dayNumber: number;
    date: string;
    stats: {
      km: number;
      time: string;
      cost: string;
      drivingTime: string;
      stops: number;
    };
    activities: Array<{
      id: string;
      type: 'meal' | 'accommodation' | 'attraction' | 'shopping' | 'travel' | 'activity';
      subtype?: string;
      name: string;
      time?: string;
      coords: [number, number];
      address?: string;
      description?: string;
      duration: string;
      cost: string;
      required: boolean;
      alternatives: string[];
      notes: string;
      website?: string;
      specialties?: string[];
      cuisine?: string;
      accommodationType?: string;
      priority?: string;
    }>;
  }>;
  settings?: {
    mapStyle: string;
    defaultZoom: number;
    showRoute: boolean;
    currency: string;
    language: string;
  };
}

interface ConvertedData {
  converted: TripData;
  original?: any;
  source: string;
  convertedAt: string;
}

const ViewerResultPage = () => {
  const router = useRouter();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  // Carica dati all'avvio
  useEffect(() => {
    loadTripData();
  }, []);

  const loadTripData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Recupera dati da sessionStorage
      const data = getConvertedItinerary();
      
      if (!data) {
        setError('Nessun itinerario trovato. I dati potrebbero essere scaduti.');
        return;
      }

      // Validazione struttura dati
      if (!data.converted || !data.converted.metadata || !data.converted.days) {
        setError('Dati itinerario non validi o corrotti.');
        return;
      }

      console.log('📍 Caricato itinerario:', {
        title: data.converted.metadata.title,
        days: data.converted.days.length,
        source: data.source,
        convertedAt: data.convertedAt
      });

      setTripData(data.converted);
      setSource(data.source);

    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setError('Errore durante il caricamento dell\'itinerario.');
    } finally {
      setLoading(false);
    }
  };

  // Funzione Back personalizzata basata sulla source
  const handleBack = () => {
    if (source === 'internal_conversion') {
      // Dall'editor Travel Planner
      router.push('/planner');
    } else {
      // Da upload esterno
      router.push('/viewer');
    }
  };

  // Salva e condividi in Redis
  const handleSaveAndShare = async (tripData: TripData): Promise<string> => {
    try {
      console.log('💾 Salvando itinerario condiviso...');

      const response = await fetch('/api/save-shared', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itinerary: tripData,
          source: source,
          title: tripData.metadata.title,
          createdFrom: 'viewer_result'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante il salvataggio');
      }

      const result = await response.json();
      
      if (!result.success || !result.id) {
        throw new Error('Risposta API non valida');
      }

      const shareUrl = `${window.location.origin}/viewer/shared/${result.id}`;
      
      console.log('✅ Itinerario salvato:', {
        id: result.id,
        url: shareUrl,
        expiresAt: result.expiresAt
      });

      return shareUrl;

    } catch (error) {
      console.error('Errore salvataggio condiviso:', error);
      throw error;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Caricamento itinerario...
          </h2>
          <p className="text-gray-600">
            Preparazione della visualizzazione avanzata
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Itinerario non trovato
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Non è stato possibile caricare l\'itinerario richiesto.'}
            </p>
            
            <div className="space-y-3">
              <Link
                href="/viewer"
                className="block w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Carica nuovo itinerario
              </Link>
              
              <Link
                href="/planner"
                className="block w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Crea nuovo itinerario
              </Link>
              
              <Link
                href="/"
                className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-5 w-5" />
                <span>Torna alla home</span>
              </Link>
            </div>

            {/* Clear storage button in case of persistent issues */}
            <button
              onClick={() => {
                clearTravelData();
                router.push('/');
              }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Pulisci cache e riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show TravelViewer
  return (
    <div className="min-h-screen">
      <TravelViewer
        tripData={tripData}
        onBack={handleBack}
        onSaveAndShare={handleSaveAndShare}
        showBackButton={true}
        showShareButton={true}
        className="animate-fade-in"
      />
    </div>
  );
};

export default ViewerResultPage;