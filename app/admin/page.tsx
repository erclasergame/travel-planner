'use client'

import React, { useState, useEffect } from 'react';
import { 
  Shield, Database, Upload, Settings, BarChart3, Users, 
  Globe, ExternalLink, Activity, Clock, Server, AlertCircle,
  CheckCircle, TrendingUp, FileText, Zap
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      // Carica statistiche sistema
      const dbTest = await fetch('/api/database/test');
      const dbStatus = dbTest.ok ? 'online' : 'offline';
      
      setStats({
        database: dbStatus,
        lastUpdated: new Date().toLocaleString(),
        uptime: '99.9%'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'Database Explorer',
      description: 'Esplora e gestisci il database Xata',
      icon: <Database className="h-8 w-8" />,
      href: '/admin/database',
      color: 'bg-blue-500',
      status: stats?.database === 'online' ? 'Connesso' : 'Offline'
    },
    {
      title: 'Bulk Upload',
      description: 'Carica dati JSON in massa nel database',
      icon: <Upload className="h-8 w-8" />,
      href: '/admin/bulk-upload',
      color: 'bg-purple-500',
      status: 'Attivo'
    },
    {
  title: 'Bulk Insert Database',
  description: 'Popola cities, attractions, events in massa',
  icon: <Database className="h-8 w-8" />,
  href: '/admin/bulk-insert',
  color: 'bg-indigo-500',
  status: 'Attivo'
},
    {
      title: 'Configurazione AI',
      description: 'Gestisci modelli AI globali del sistema',
      icon: <Settings className="h-8 w-8" />,
      href: '/settings',
      color: 'bg-green-500',
      status: 'Configurato'
    },
    {
      title: 'Analytics',
      description: 'Statistiche e monitoraggio sistema',
      icon: <BarChart3 className="h-8 w-8" />,
      href: '/admin/analytics',
      color: 'bg-orange-500',
      status: 'Presto',
      disabled: true
    }
  ];

  const quickActions = [
    {
      title: 'Test Database',
      description: 'Verifica connessione Xata',
      icon: <Activity className="h-5 w-5" />,
      action: () => window.open('/api/database/test', '_blank')
    },
    {
      title: 'Xata Dashboard',
      description: 'Apri dashboard Xata esterno',
      icon: <ExternalLink className="h-5 w-5" />,
      action: () => window.open('https://app.xata.io', '_blank')
    },
    {
      title: 'Vercel Dashboard',
      description: 'Gestisci deployment e logs',
      icon: <Server className="h-5 w-5" />,
      action: () => window.open('https://vercel.com/dashboard', '_blank')
    },
    {
      title: 'Logs Sistema',
      description: 'Visualizza logs applicazione',
      icon: <FileText className="h-5 w-5" />,
      action: () => alert('Feature in sviluppo')
    }
  ];

  const systemInfo = [
    {
      label: 'Database Status',
      value: stats?.database || 'Checking...',
      status: stats?.database === 'online' ? 'success' : 'error'
    },
    {
      label: 'Ultimo Aggiornamento',
      value: stats?.lastUpdated || 'Caricando...',
      status: 'info'
    },
    {
      label: 'Uptime Stimato',
      value: '99.9%',
      status: 'success'
    },
    {
      label: 'Versione Sistema',
      value: 'v2.0 - Xata Integration',
      status: 'info'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <Shield className="h-10 w-10 mr-3 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Centro di controllo per Travel Planner</p>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-green-500" />
            Stato Sistema
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemInfo.map((info: any) => (
              <div key={info.label} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                  info.status === 'success' ? 'bg-green-100 text-green-800' :
                  info.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {info.status === 'success' && <CheckCircle className="h-4 w-4 mr-1" />}
                  {info.status === 'error' && <AlertCircle className="h-4 w-4 mr-1" />}
                  {info.value}
                </div>
                <p className="text-xs text-gray-600">{info.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Admin Functions */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Funzioni Amministrative</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {adminCards.map((card: any) => (
                <div key={card.title} className="group">
                  {card.disabled ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 opacity-50 cursor-not-allowed">
                      <div className={`${card.color} text-white p-3 rounded-xl w-fit mb-4`}>
                        {card.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{card.title}</h3>
                      <p className="text-gray-600 mb-4">{card.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Stato: {card.status}</span>
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    <Link href={card.href}>
                      <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105 cursor-pointer">
                        <div className={`${card.color} text-white p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                          {card.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{card.title}</h3>
                        <p className="text-gray-600 mb-4">{card.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600 font-medium">Stato: {card.status}</span>
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Azioni Rapide
              </h3>
              
              <div className="space-y-3">
                {quickActions.map((action: any) => (
                  <button
                    key={action.title}
                    onClick={action.action}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500 group-hover:text-gray-700">
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                Info Rapide
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ambiente:</span>
                  <span className="font-medium text-blue-600">Produzione</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-medium">EU Central</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Framework:</span>
                  <span className="font-medium">Next.js 14</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Database:</span>
                  <span className="font-medium">Xata Lite</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-green-500" />
                Link Utili
              </h3>
              
              <div className="space-y-2 text-sm">
                <Link 
                  href="/"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  🏠 Travel Planner Home
                </Link>
                <Link 
                  href="/planner"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ✈️ Crea Itinerario
                </Link>
                <Link 
                  href="/viewer"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  📋 Visualizza Itinerario
                </Link>
                <a 
                  href="https://docs.xata.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-600 hover:text-gray-800 hover:underline"
                >
                  📚 Documentazione Xata
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Travel Planner Admin Dashboard - Versione 2.0 
            <span className="mx-2">•</span>
            Ultimo aggiornamento: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}