'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle, Loader2, Share2, QrCode, Eye, Calendar,
  Clock, ExternalLink, Home, Sparkles, Copy, CheckCircle,
  RefreshCw, Heart, Users
} from 'lucide-react';
import Link from 'next/link';
import TravelViewer from '@/components/TravelViewer';

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
    activities: any[];
  }>;
  settings?: any;
}

interface SharedItineraryResponse {
  success: boolean;
  id: string;
  itinerary: TripData;
  metadata: {
    title: string;
    createdAt: string;
    expiresAt: string;
    source: string;
    viewCount: number;
    lastViewed: string;
    daysUntilExpiry: number;
  };
  sharing: {
    url: string;
    embedUrl: string;
    qrCode: string;
  };
  error?: string;
  code?: string;
}

interface ViewerSharedPageProps {
  params: { id: string };
}

const ViewerSharedPage: React.FC<ViewerSharedPageProps> = ({ params }) => {
  const router = useRouter();
  const { id } = params;

  const [tripData, setTripData] = useState<TripData | null>(null);
  const [sharedData, setSharedData] = useState<SharedItineraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Carica itinerario condiviso
  useEffect(() => {
    if (id) {
      loadSharedItinerary();
    }
  }, [id]);

  const loadSharedItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorCode(null);

      console.log('🔗 [Shared] Caricando itinerario condiviso:', { id });

      const response = await fetch(`/api/get-shared/${id}`);
      const data: SharedItineraryResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Errore durante il caricamento');
        setErrorCode(data.code || 'UNKNOWN');
        
        if (data.code === 'EXPIRED') {
          console.log('⏰ [Shared] Itinerario scaduto:', data);
        } else if (data.code === 'NOT_FOUND') {
          console.log('❌ [Shared] Itinerario non trovato:', data);
        }
        return;
      }

      if (!data.success || !data.itinerary) {
        setError('Dati itinerario non validi');
        setErrorCode('INVALID_DATA');
        return;
      }

      console.log('✅ [Shared] Itinerario caricato:', {
        id: data.id,
        title: data.metadata.title,
        viewCount: data.metadata.viewCount,
        daysUntilExpiry: data.metadata.daysUntilExpiry
      });

      setTripData(data.itinerary);
      setSharedData(data);

    } catch (error) {
      console.error('❌ [Shared] Errore caricamento:', error);
      setError('Errore di connessione durante il caricamento');
      setErrorCode('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  };

  // Copia URL negli appunti
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Errore copia clipboard:', error);
      // Fallback per browser non supportati
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Caricamento itinerario...
          </h2>
          <p className="text-gray-600 mb-4">
            Stiamo preparando l'itinerario condiviso per te
          </p>
          <div className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-2 rounded">
            ID: {id}
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (error || !tripData || !sharedData) {
    const getErrorContent = () => {
      switch (errorCode) {
        case 'NOT_FOUND':
          return {
            icon: <AlertCircle className="h-20 w-20 text-orange-500" />,
            title: 'Itinerario non trovato',
            description: 'Questo link potrebbe essere scaduto o non valido. Controlla di aver copiato l\'URL completo.',
            actions: (
              <div className="space-y-3">
                <button
                  onClick={loadSharedItinerary}
                  className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Riprova</span>
                </button>
              </div>
            )
          };

        case 'EXPIRED':
          return {
            icon: <Clock className="h-20 w-20 text-red-500" />,
            title: 'Link scaduto',
            description: 'Questo itinerario condiviso è scaduto. Gli itinerari condivisi sono disponibili per 30 giorni dalla creazione.',
            actions: (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Scaduto il: {sharedData?.metadata.expiresAt ? 
                    new Date(sharedData.metadata.expiresAt).toLocaleDateString('it-IT') : 
                    'Data non disponibile'
                  }
                </p>
              </div>
            )
          };

        case 'NETWORK_ERROR':
          return {
            icon: <AlertCircle className="h-20 w-20 text-blue-500" />,
            title: 'Errore di connessione',
            description: 'Impossibile caricare l\'itinerario. Controlla la tua connessione internet e riprova.',
            actions: (
              <div className="space-y-3">
                <button
                  onClick={loadSharedItinerary}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Riprova</span>
                </button>
              </div>
            )
          };

        default:
          return {
            icon: <AlertCircle className="h-20 w-20 text-gray-500" />,
            title: 'Errore caricamento',
            description: error || 'Si è verificato un errore imprevisto durante il caricamento dell\'itinerario.',
            actions: (
              <div className="space-y-3">
                <button
                  onClick={loadSharedItinerary}
                  className="w-full bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Riprova</span>
                </button>
              </div>
            )
          };
      }
    };

    const errorContent = getErrorContent();

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="mb-6">
              {errorContent.icon}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {errorContent.title}
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {errorContent.description}
            </p>

            {errorContent.actions}

            {/* Alternative actions */}
            <div className="mt-6 pt-6 border-t space-y-3">
              <Link
                href="/planner"
                className="block w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Sparkles className="h-5 w-5" />
                <span>Crea il tuo itinerario</span>
              </Link>
              
              <Link
                href="/"
                className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-5 w-5" />
                <span>Torna alla home</span>
              </Link>
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-xs text-gray-600 font-mono">
                  <strong>Debug:</strong><br/>
                  ID: {id}<br/>
                  Error: {error}<br/>
                  Code: {errorCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state - render TravelViewer with sharing info
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header condivisione */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Itinerario Condiviso</h1>
                <p className="text-sm opacity-90">
                  Visualizzato {sharedData.metadata.viewCount} volte • 
                  Scade tra {sharedData.metadata.daysUntilExpiry} giorni
                </p>
              </div>
            </div>

            {/* Sharing controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => copyToClipboard(sharedData.sharing.url)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  copySuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">Copia link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <QrCode className="h-4 w-4" />
                <span className="text-sm">QR Code</span>
              </button>
            </div>
          </div>

          {/* QR Code panel */}
          {showQR && (
            <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Condividi con QR Code</h3>
                  <p className="text-sm opacity-90">
                    Scansiona per aprire l'itinerario su mobile
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <img 
                    src={sharedData.sharing.qrCode}
                    alt="QR Code itinerario"
                    className="w-24 h-24"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Travel Viewer */}
      <TravelViewer
        tripData={tripData}
        showBackButton={false}  // No back button per link pubblici
        showShareButton={false} // Già condiviso
        className="pt-0"
      />

      {/* Footer call-to-action */}
      <div className="bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Ti è piaciuto questo itinerario?
              </h3>
              <p className="text-gray-600 mb-6">
                Crea il tuo itinerario personalizzato con l'intelligenza artificiale
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Link
                  href="/planner"
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Crea il mio itinerario</span>
                </Link>
                
                <Link
                  href="/viewer"
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Visualizza altro</span>
                </Link>
              </div>

              {/* Stats e social proof */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Condiviso {sharedData.metadata.viewCount} volte</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Creato il {new Date(sharedData.metadata.createdAt).toLocaleDateString('it-IT')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewerSharedPage;