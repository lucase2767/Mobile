const BASE_URL = 'https://mobile-js6s.onrender.com';

export interface MachineOilInfo {
  modelo: string;
  imageUrl: string | null;
  intervaloHoras: number;
  intervaloMeses: number;
  pontosOleo: string[];
  tipoOleo: string;
  observacoes: string;
}

/**
 * Checks if the API is reachable by calling the root endpoint.
 * Returns true if online, false otherwise.
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return typeof data?.mensagem === 'string';
  } catch {
    return false;
  }
}

/**
 * Searches for a machine in the primary API database.
 * Returns MachineOilInfo if found, or null if not found (404) or on error.
 */
export async function searchMachineInApi(modelName: string): Promise<MachineOilInfo[] | null> {
  try {
    const encoded = encodeURIComponent(modelName);
    const response = await fetch(`${BASE_URL}/api/maquinas/busca?q=${encoded}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404) {
      return null; // not in DB — fallback to Gemini
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const dataArray = await response.json();
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return null;
    }

    return dataArray.map((data: any) => {
      // Normalize pontosOleo: the API may return it as a JSON string or an array
      const pontosOleo = Array.isArray(data.pontosOleo)
        ? data.pontosOleo
        : JSON.parse(data.pontosOleo || '[]');

      return {
        modelo: data.modelo,
        imageUrl: data.imageUrl || null,
        intervaloHoras: data.intervaloHoras ?? 0,
        intervaloMeses: data.intervaloMeses ?? 0,
        pontosOleo,
        tipoOleo: data.tipoOleo || '',
        observacoes: data.observacoes || '',
      };
    });
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      console.warn('[apiService] Request timed out, falling back to Gemini.');
      return null;
    }
    if (err?.message?.includes('404')) return null;
    console.error('[apiService] searchMachineInApi error:', err);
    return null;
  }
}

/**
 * Saves a new machine entry to the API database (after a Gemini lookup).
 * Silently fails so the app flow is not disrupted.
 */
export async function saveMachineToApi(machine: MachineOilInfo): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/maquinas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(machine),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.warn('[apiService] Failed to save machine to API (non-critical):', err);
  }
}
