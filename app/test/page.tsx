'use client'

import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle } from 'lucide-react';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testAPI = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const testData = {
        tripData: {
          from: "Milano",
          to: "Roma",
          duration: "2 giorni",
          people: "2",
          description: "Viaggio romantico"
        },
        action: "generate"
      };

      console.log('🚀 Sending request:', testData);

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Parse error: ${parseError.message}. Raw response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || responseText}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult({
        status: response.status,
        success: true,
        data: data,
        rawResponse: responseText
      });

    } catch (error) {
      console.error('❌ Test error:', error);
      setError({
        message: error.message,
        type: error.name,
        stack: error.stack
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">🧪 Test API OpenRouter</h1>
          
          <div className="mb-6">
            <button
              onClick={testAPI}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Test API Call
                </>
              )}
            </button>
          </div>

          {/* Informazioni di configurazione */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">📋 Test Configuration:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Endpoint:</strong> /api/generate-plan</li>
              <li><strong>Model:</strong> google/gemma-2-9b-it:free</li>
              <li><strong>Action:</strong> generate</li>
              <li><strong>Test Data:</strong> Milano → Roma, 2 giorni, 2 persone</li>
            </ul>
          </div>

          {/* Risultato */}
          {result && (
            <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">✅ Success!</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Status:</strong> <span className="text-green-600">{result.status}</span>
                </div>
                
                <div>
                  <strong>API Response:</strong>
                  <pre className="mt-2 p-3 bg-white border rounded text-xs overflow-auto max-h-40">
{JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>

                <div>
                  <strong>Raw Response:</strong>
                  <pre className="mt-2 p-3 bg-white border rounded text-xs overflow-auto max-h-20">
{result.rawResponse}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Errore */}
          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-800">❌ Error!</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Type:</strong> <span className="text-red-600">{error.type}</span>
                </div>
                
                <div>
                  <strong>Message:</strong>
                  <div className="mt-2 p-3 bg-white border rounded text-red-700">
                    {error.message}
                  </div>
                </div>

                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-2 p-3 bg-white border rounded text-xs overflow-auto max-h-40 text-red-600">
{error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debug info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">🔍 Debug Info:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
              <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Loading...'}</p>
              <p><strong>Console:</strong> Apri Developer Tools (F12) per vedere tutti i log dettagliati</p>
            </div>
          </div>

          {/* Link per tornare al Travel Planner */}
          <div className="mt-6 pt-6 border-t">
            <a 
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Torna al Travel Planner
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}