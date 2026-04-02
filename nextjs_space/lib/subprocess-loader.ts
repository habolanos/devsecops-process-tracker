import { SubprocessSource, SubprocessState, ProcessState } from './types';
import { parseYAMLToProcess } from './yaml-parser';

interface LoadResult {
  success: boolean;
  process?: ProcessState;
  error?: string;
}

/**
 * Converts a GitHub blob URL to raw content URL
 * Example: https://github.com/org/repo/blob/main/file.yaml
 *       -> https://raw.githubusercontent.com/org/repo/main/file.yaml
 */
function convertGitHubUrlToRaw(url: string): string {
  const githubBlobRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/;
  const match = url.match(githubBlobRegex);
  
  if (match) {
    const [, owner, repo, branch, path] = match;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }
  
  return url;
}

/**
 * Fetches YAML content from a URL
 */
async function fetchYamlFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'text/plain, application/x-yaml, text/yaml',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
}

/**
 * Loads a subprocess from GitHub
 */
async function loadFromGitHub(source: SubprocessSource): Promise<LoadResult> {
  try {
    if (!source.url) {
      return { success: false, error: 'GitHub URL is required' };
    }
    
    let url = source.url;
    
    // If a specific ref (tag/branch) is provided, modify the URL
    if (source.ref) {
      url = url.replace(/\/blob\/[^/]+\//, `/blob/${source.ref}/`);
    }
    
    // Convert to raw URL
    const rawUrl = convertGitHubUrlToRaw(url);
    const yamlContent = await fetchYamlFromUrl(rawUrl);
    const process = parseYAMLToProcess(yamlContent);
    
    return { success: true, process };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `GitHub load failed: ${message}` };
  }
}

/**
 * Loads a subprocess from a direct URL
 */
async function loadFromUrl(source: SubprocessSource): Promise<LoadResult> {
  try {
    if (!source.url) {
      return { success: false, error: 'URL is required' };
    }
    
    const yamlContent = await fetchYamlFromUrl(source.url);
    const process = parseYAMLToProcess(yamlContent);
    
    return { success: true, process };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `URL load failed: ${message}` };
  }
}

/**
 * Loads a subprocess from a local file path
 * Note: This requires the file to be accessible via the app's public folder
 * or through an API route
 */
async function loadFromLocal(source: SubprocessSource, basePath?: string): Promise<LoadResult> {
  try {
    if (!source.path) {
      return { success: false, error: 'Local path is required' };
    }
    
    // Construct the URL - assumes files are served from public folder or API
    const path = source.path.startsWith('./') 
      ? source.path.slice(2) 
      : source.path;
    
    const url = basePath 
      ? `${basePath}/${path}`
      : `/api/subprocess?path=${encodeURIComponent(path)}`;
    
    const yamlContent = await fetchYamlFromUrl(url);
    const process = parseYAMLToProcess(yamlContent);
    
    return { success: true, process };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Local load failed: ${message}` };
  }
}

/**
 * Main function to load a subprocess based on its source type
 */
export async function loadSubprocess(
  source: SubprocessSource,
  options?: { basePath?: string }
): Promise<LoadResult> {
  switch (source.type) {
    case 'github':
      return loadFromGitHub(source);
    case 'url':
      return loadFromUrl(source);
    case 'local':
      return loadFromLocal(source, options?.basePath);
    default:
      return { success: false, error: `Unknown source type: ${(source as any).type}` };
  }
}

/**
 * Loads all subprocesses for a process and updates their states
 */
export async function loadAllSubprocesses(
  subprocesses: SubprocessState[],
  options?: { basePath?: string; onProgress?: (loaded: number, total: number) => void }
): Promise<SubprocessState[]> {
  const results: SubprocessState[] = [];
  const total = subprocesses.length;
  let loaded = 0;
  
  for (const subprocess of subprocesses) {
    // Skip optional subprocesses that user chose to skip
    if (subprocess.status === 'skipped') {
      results.push(subprocess);
      loaded++;
      options?.onProgress?.(loaded, total);
      continue;
    }
    
    // Mark as loading
    const loadingState: SubprocessState = {
      ...subprocess,
      status: 'loading',
    };
    
    try {
      const result = await loadSubprocess(subprocess.source, options);
      
      if (result.success && result.process) {
        // Apply variable substitutions to the loaded process
        const processWithVariables = applyVariablesToProcess(
          result.process,
          subprocess.variables
        );
        
        results.push({
          ...loadingState,
          status: 'loaded',
          loadedProcess: processWithVariables,
          error: undefined,
        });
      } else {
        results.push({
          ...loadingState,
          status: 'error',
          error: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        ...loadingState,
        status: 'error',
        error: message,
      });
    }
    
    loaded++;
    options?.onProgress?.(loaded, total);
  }
  
  return results;
}

/**
 * Applies variable substitutions to a process
 * Replaces {variableName} placeholders in string values
 */
function applyVariablesToProcess(
  process: ProcessState,
  variables: Record<string, string>
): ProcessState {
  if (!variables || Object.keys(variables).length === 0) {
    return process;
  }
  
  const substituteVariables = (text: string): string => {
    return text.replace(/\{(\w+)\}/g, (match, varName) => {
      return variables[varName] ?? match;
    });
  };
  
  // Apply to process name and description
  return {
    ...process,
    name: substituteVariables(process.name),
    description: substituteVariables(process.description),
    phases: process.phases.map((phase) => ({
      ...phase,
      name: substituteVariables(phase.name),
      description: substituteVariables(phase.description),
      activities: phase.activities.map((activity) => ({
        ...activity,
        name: substituteVariables(activity.name),
        description: substituteVariables(activity.description),
        tasks: activity.tasks.map((task) => ({
          ...task,
          name: substituteVariables(task.name),
          description: substituteVariables(task.description),
        })),
      })),
      tasks: phase.tasks.map((task) => ({
        ...task,
        name: substituteVariables(task.name),
        description: substituteVariables(task.description),
      })),
    })),
  };
}

/**
 * Validates a subprocess source configuration
 */
export function validateSubprocessSource(source: SubprocessSource): { valid: boolean; error?: string } {
  if (!source.type) {
    return { valid: false, error: 'Source type is required' };
  }
  
  switch (source.type) {
    case 'github':
      if (!source.url) {
        return { valid: false, error: 'GitHub URL is required' };
      }
      if (!source.url.includes('github.com')) {
        return { valid: false, error: 'Invalid GitHub URL' };
      }
      break;
      
    case 'url':
      if (!source.url) {
        return { valid: false, error: 'URL is required' };
      }
      try {
        new URL(source.url);
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }
      break;
      
    case 'local':
      if (!source.path) {
        return { valid: false, error: 'Local path is required' };
      }
      break;
      
    default:
      return { valid: false, error: `Unknown source type: ${(source as any).type}` };
  }
  
  return { valid: true };
}
