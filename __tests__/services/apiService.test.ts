/**
 * Tests for the primary API service (https://mobile-js6s.onrender.com)
 * Run with: npm test
 */

import { checkApiHealth, searchMachineInApi, saveMachineToApi } from '../../src/services/apiService';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('apiService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  // ─── Health Check ────────────────────────────────────────────────────────────

  describe('checkApiHealth()', () => {
    it('returns true when the API root responds with a mensagem field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mensagem: 'API Cuidados de Costura está Online no Render!', docs: '/docs' }),
      });

      const result = await checkApiHealth();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://mobile-js6s.onrender.com/',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('returns false when the API is unreachable (network error)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));
      const result = await checkApiHealth();
      expect(result).toBe(false);
    });

    it('returns false when the API returns a non-ok status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
      const result = await checkApiHealth();
      expect(result).toBe(false);
    });
  });

  // ─── searchMachineInApi ──────────────────────────────────────────────────────

  describe('searchMachineInApi()', () => {
    const mockMachine = {
      modelo: 'Singer Heavy Duty 4432',
      imageUrl: 'https://example.com/singer.jpg',
      intervaloHoras: 8,
      intervaloMeses: 3,
      pontosOleo: ['Gancho rotativo', 'Guia de linha'],
      tipoOleo: 'Óleo mineral fino',
      observacoes: 'Lubrificar com o equipamento desligado.',
    };

    it('returns machine data when found in the API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockMachine],
      });

      const result = await searchMachineInApi('Singer Heavy Duty 4432');
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result?.[0].modelo).toBe('Singer Heavy Duty 4432');
      expect(result?.[0].intervaloMeses).toBe(3);
      expect(Array.isArray(result?.[0].pontosOleo)).toBe(true);
    });

    it('returns null when the machine is not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Máquina não encontrada no banco de dados.' }),
      });

      const result = await searchMachineInApi('Modelo Inexistente XYZ');
      expect(result).toBeNull();
    });

    it('returns null when the API returns an empty array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      const result = await searchMachineInApi('Modelo Inexistente XYZ');
      expect(result).toBeNull();
    });

    it('returns null on a network timeout', async () => {
      const timeoutError = new Error('The operation was aborted.');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await searchMachineInApi('Singer');
      expect(result).toBeNull();
    });

    it('normalizes pontosOleo when returned as a JSON string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([{
          ...mockMachine,
          pontosOleo: '["Gancho rotativo","Guia de linha"]', // returned as string
        }]),
      });

      const result = await searchMachineInApi('Singer Heavy Duty 4432');
      expect(Array.isArray(result?.[0].pontosOleo)).toBe(true);
      expect(result?.[0].pontosOleo).toHaveLength(2);
    });

    it('encodes the query string correctly in the URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockMachine],
      });

      await searchMachineInApi('Singer Heavy Duty 4432');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://mobile-js6s.onrender.com/api/maquinas/busca?q=Singer%20Heavy%20Duty%204432',
        expect.any(Object),
      );
    });
  });

  // ─── saveMachineToApi ────────────────────────────────────────────────────────

  describe('saveMachineToApi()', () => {
    const mockMachine = {
      modelo: 'Brother XR9550',
      imageUrl: null,
      intervaloHoras: 10,
      intervaloMeses: 6,
      pontosOleo: ['Barra de agulha'],
      tipoOleo: 'Óleo de máquina de costura',
      observacoes: 'Limpar antes de lubrificar.',
    };

    it('sends a POST request with the machine data', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) });

      await saveMachineToApi(mockMachine);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://mobile-js6s.onrender.com/api/maquinas',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Brother XR9550'),
        }),
      );
    });

    it('does not throw when the API returns an error (non-critical)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'));
      // Should resolve without throwing
      await expect(saveMachineToApi(mockMachine)).resolves.not.toThrow();
    });
  });
});
