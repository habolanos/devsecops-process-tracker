'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseYAMLToProcess } from '@/lib/yaml-parser';
import { importProcessFromJSON } from '@/lib/json-utils';
import { useProcessStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n-context';
import { Upload, FileText, Globe, Shield, Rocket, AlertTriangle, FolderOpen } from 'lucide-react';

interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  file: string;
  version: string;
}

export default function HomePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const loadProcess = useProcessStore((state) => state?.loadProcess);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/processes');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.processes || []);
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = async (templateId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/processes/${templateId}`);
      if (!response.ok) {
        throw new Error('Error al cargar el proceso');
      }
      const data = await response.json();
      const process = parseYAMLToProcess(data.content);
      loadProcess?.(process);
      router.push('/process');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'shield': <Shield className="w-8 h-8 text-emerald-600" />,
      'rocket': <Rocket className="w-8 h-8 text-blue-600" />,
      'alert-triangle': <AlertTriangle className="w-8 h-8 text-amber-600" />,
    };
    return icons[iconName] || <FileText className="w-8 h-8 text-gray-600" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'security': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'devops': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleFileUpload = async (file: File, type: 'yaml' | 'json') => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      
      if (type === 'yaml') {
        const process = parseYAMLToProcess(content);
        loadProcess?.(process);
      } else {
        const jsonData = JSON.parse(content);
        const process = importProcessFromJSON(jsonData);
        loadProcess?.(process);
      }

      router.push('/process');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'yaml' | 'json') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'yaml' | 'json') => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
          </div>
          <button
            onClick={() => setLanguage?.(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{language === 'es' ? 'ES' : 'EN'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            {t('app.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('app.subtitle')}
          </p>
        </div>

        {/* Process Templates Section */}
        {templates.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {language === 'es' ? 'Procesos Disponibles' : 'Available Processes'}
              </h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  disabled={isLoading}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left group hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                      {getIconComponent(template.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">
                        {template.name}
                      </h4>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">v{template.version}</span>
                    <span className="text-xs text-blue-600 font-medium group-hover:text-blue-700">
                      {language === 'es' ? 'Seleccionar →' : 'Select →'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingTemplates && (
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg shadow-md">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-700">
                {language === 'es' ? 'Cargando procesos...' : 'Loading processes...'}
              </span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12 max-w-4xl mx-auto">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500 font-medium">
            {language === 'es' ? 'O carga tu propio proceso' : 'Or upload your own process'}
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Upload Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* YAML Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {t('upload.yaml')}
              </h3>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDrop={(e) => handleDrop(e, 'yaml')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={(e) => handleFileSelect(e, 'yaml')}
                className="hidden"
                id="yaml-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="yaml-upload"
                className="cursor-pointer block"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {t('upload.drag')}
                </p>
                <p className="text-sm text-gray-400">.yaml, .yml</p>
              </label>
            </div>
          </div>

          {/* JSON Import */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {t('upload.json')}
              </h3>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
              onDrop={(e) => handleDrop(e, 'json')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".json"
                onChange={(e) => handleFileSelect(e, 'json')}
                className="hidden"
                id="json-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="json-upload"
                className="cursor-pointer block"
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {t('upload.drag')}
                </p>
                <p className="text-sm text-gray-400">.json</p>
              </label>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg shadow-md">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-700">{t('upload.loading')}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">{t('upload.error')}</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Procesos Estructurados
            </h4>
            <p className="text-gray-600 text-sm">
              Define procesos con fases y tareas organizadas
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📸</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Evidencia Completa
            </h4>
            <p className="text-gray-600 text-sm">
              Adjunta texto e imágenes para cada tarea
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Exportación Profesional
            </h4>
            <p className="text-gray-600 text-sm">
              Genera reportes en JSON y documentos Word
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>Process Tracker MVP © 2026</p>
        </div>
      </footer>
    </div>
  );
}
