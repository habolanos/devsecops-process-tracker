'use client';

import { useState, useRef } from 'react';
import { Upload, Check, X, FileJson, Trash2, Info, Download, Wand2 } from 'lucide-react';
import { useConfigStore } from '@/lib/config-store';
import { useProcessStore } from '@/lib/store';
import { downloadConfigTemplate } from '@/lib/config-loader';

interface ConfigUploadProps {
  onClose?: () => void;
}

export function ConfigUpload({ onClose }: ConfigUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    config, 
    isLoaded, 
    fileName, 
    loadedAt, 
    loadConfig, 
    clearConfig,
    autoFillValues 
  } = useConfigStore();

  // Obtener variables del proceso actual
  const process = useProcessStore((state) => state?.process);
  const hasVariables = process?.variableDefinitions && process.variableDefinitions.length > 0;

  const handleGenerateTemplate = () => {
    if (process?.variableDefinitions && process.name) {
      downloadConfigTemplate(process.variableDefinitions, process.name);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Solo se permiten archivos JSON');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      loadConfig(content, file.name);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar archivo';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = () => {
    clearConfig();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <FileJson className="w-6 h-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Configuración DevOps</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Carga automática de variables</p>
              <p className="text-blue-700">
                Carga un archivo <code className="bg-blue-100 px-1 rounded">devops-config.json</code> para 
                pre-llenar automáticamente las variables de los procesos (organización, proyectos, clusters, etc.)
              </p>
            </div>
          </div>

          {/* Upload Area */}
          {!isLoaded && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleInputChange}
                className="hidden"
              />
              
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isLoading ? 'Cargando...' : 'Arrastra tu archivo de configuración'}
              </p>
              <p className="text-sm text-gray-500">
                o haz clic para seleccionar un archivo JSON
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <X className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Loaded Config Info */}
          {isLoaded && config && (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Check className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">Configuración cargada</p>
                  <p className="text-sm text-green-700">{fileName}</p>
                </div>
                <button
                  onClick={handleClear}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar configuración"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Config Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Engineer Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">👤 Ingeniero</h4>
                  <p className="text-sm text-gray-600">{config.engineer?.name}</p>
                  <p className="text-xs text-gray-500">{config.engineer?.email}</p>
                </div>

                {/* Azure DevOps */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">🔷 Azure DevOps</h4>
                  <p className="text-sm text-blue-600">Org: {config.azureDevOps?.organization}</p>
                  <p className="text-xs text-blue-500">
                    {config.azureDevOps?.projects?.length || 0} proyectos, {' '}
                    {config.azureDevOps?.repositories?.length || 0} repositorios
                  </p>
                </div>

                {/* AWS */}
                {config.aws && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-700 mb-2">☁️ AWS</h4>
                    <p className="text-sm text-orange-600">
                      {config.aws.clusters?.length || 0} clusters EKS
                    </p>
                    <p className="text-xs text-orange-500">
                      Regiones: {config.aws.regions?.join(', ')}
                    </p>
                  </div>
                )}

                {/* GCP */}
                {config.gcp && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-700 mb-2">🔴 GCP</h4>
                    <p className="text-sm text-red-600">
                      {config.gcp.clusters?.length || 0} clusters GKE
                    </p>
                    <p className="text-xs text-red-500">
                      {config.gcp.projects?.length || 0} proyectos
                    </p>
                  </div>
                )}

                {/* Azure */}
                {config.azure && (
                  <div className="p-4 bg-sky-50 rounded-lg">
                    <h4 className="font-medium text-sky-700 mb-2">🔵 Azure</h4>
                    <p className="text-sm text-sky-600">
                      {config.azure.clusters?.length || 0} clusters AKS
                    </p>
                    <p className="text-xs text-sky-500">
                      {config.azure.resourceGroups?.length || 0} resource groups
                    </p>
                  </div>
                )}
              </div>

              {/* Auto-fill Preview */}
              {autoFillValues && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-700 mb-3">✨ Variables que se llenarán automáticamente</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {autoFillValues.organization && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">organization:</span>
                        <span className="text-purple-800 font-mono">{autoFillValues.organization}</span>
                      </div>
                    )}
                    {autoFillValues.project && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">project:</span>
                        <span className="text-purple-800 font-mono">{autoFillValues.project}</span>
                      </div>
                    )}
                    {autoFillValues.repository && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">repository:</span>
                        <span className="text-purple-800 font-mono">{autoFillValues.repository}</span>
                      </div>
                    )}
                    {autoFillValues.environment && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">environment:</span>
                        <span className="text-purple-800 font-mono">{autoFillValues.environment}</span>
                      </div>
                    )}
                    {autoFillValues.cluster && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">cluster:</span>
                        <span className="text-purple-800 font-mono">{autoFillValues.cluster}</span>
                      </div>
                    )}
                    {autoFillValues.namespace && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">namespace:</span>
                        <span className="text-purple-800 font-mono">{autoFillValues.namespace}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loaded At */}
              {loadedAt && (
                <p className="text-xs text-gray-400 text-center">
                  Cargado: {new Date(loadedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Download Template Section */}
          <div className="pt-4 border-t space-y-3">
            {/* Generar template basado en variables del proceso */}
            {hasVariables && (
              <div className="flex items-center justify-center">
                <button
                  onClick={handleGenerateTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="font-medium">Generar Config para este proceso</span>
                </button>
              </div>
            )}
            
            {hasVariables && (
              <p className="text-xs text-gray-500 text-center">
                El archivo generado incluirá solo las secciones necesarias para las {process?.variableDefinitions?.length} variables del proceso actual
              </p>
            )}

            <div className="text-center">
              <a
                href="/data/devops-config.example.json"
                download="devops-config.example.json"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Download className="w-3 h-3" />
                Descargar plantilla completa de ejemplo
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        {onClose && (
          <div className="flex justify-end p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isLoaded ? 'Listo' : 'Cerrar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
