'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DevOpsConfig, ConfigSelectOptions, ConfigAutoFillValues } from './devops-config-types';
import { 
  parseDevOpsConfig, 
  getSelectOptionsFromConfig, 
  getAutoFillValuesFromConfig,
  mapVariableToConfigValue,
  getSelectOptionsForVariable
} from './config-loader';

interface ConfigStore {
  // State
  config: DevOpsConfig | null;
  isLoaded: boolean;
  loadedAt: string | null;
  fileName: string | null;
  error: string | null;
  
  // Computed
  selectOptions: ConfigSelectOptions | null;
  autoFillValues: ConfigAutoFillValues | null;
  
  // Actions
  loadConfig: (content: string, fileName: string) => void;
  clearConfig: () => void;
  
  // Helpers
  getValueForVariable: (variableKey: string) => string | undefined;
  getOptionsForVariable: (variableKey: string) => string[] | undefined;
}

export const useConfigStore = create<ConfigStore>()(persist(
  (set, get) => ({
    // Initial state
    config: null,
    isLoaded: false,
    loadedAt: null,
    fileName: null,
    error: null,
    selectOptions: null,
    autoFillValues: null,

    loadConfig: (content: string, fileName: string) => {
      try {
        const config = parseDevOpsConfig(content);
        const selectOptions = getSelectOptionsFromConfig(config);
        const autoFillValues = getAutoFillValuesFromConfig(config);
        
        set({
          config,
          isLoaded: true,
          loadedAt: new Date().toISOString(),
          fileName,
          error: null,
          selectOptions,
          autoFillValues
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al cargar configuración';
        set({
          config: null,
          isLoaded: false,
          loadedAt: null,
          fileName: null,
          error: errorMsg,
          selectOptions: null,
          autoFillValues: null
        });
        throw err;
      }
    },

    clearConfig: () => {
      set({
        config: null,
        isLoaded: false,
        loadedAt: null,
        fileName: null,
        error: null,
        selectOptions: null,
        autoFillValues: null
      });
    },

    getValueForVariable: (variableKey: string): string | undefined => {
      const { config } = get();
      if (!config) return undefined;
      return mapVariableToConfigValue(variableKey, config);
    },

    getOptionsForVariable: (variableKey: string): string[] | undefined => {
      const { config } = get();
      if (!config) return undefined;
      return getSelectOptionsForVariable(variableKey, config);
    }
  }),
  {
    name: 'devops-config-storage'
  }
));
