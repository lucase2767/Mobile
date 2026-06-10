/**
 * Integration-style tests for the Resultado screen.
 * Verifies that the screen correctly shows data from the API, falls back to Gemini,
 * and displays the correct data source badge and machine info.
 *
 * Run with: npm test
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ modelo: 'Singer Heavy Duty 4432' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('../../src/services/apiService', () => ({
  searchMachineInApi: jest.fn(),
  saveMachineToApi: jest.fn(),
}));

jest.mock('../../src/services/geminiService', () => ({
  getMachineOilInfo: jest.fn(),
}));

jest.mock('../../src/services/storageService', () => ({
  loadOilInfo: jest.fn().mockResolvedValue(null), // no cache by default
  saveOilInfo: jest.fn().mockResolvedValue(undefined),
  trackMachine: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/components/MachineCard', () => ({
  MachineCard: ({ info }: any) => {
    const { Text } = require('react-native');
    return <Text testID="machine-card-model">{info.modelo}</Text>;
  },
}));

import Resultado from '../../app/resultado';
import { searchMachineInApi, saveMachineToApi } from '../../src/services/apiService';
import { getMachineOilInfo } from '../../src/services/geminiService';
import { loadOilInfo } from '../../src/services/storageService';

const mockSearchMachineInApi = searchMachineInApi as jest.Mock;
const mockGetMachineOilInfo = getMachineOilInfo as jest.Mock;
const mockLoadOilInfo = loadOilInfo as jest.Mock;

const mockMachineData = {
  modelo: 'Singer Heavy Duty 4432',
  imageUrl: 'https://example.com/singer.jpg',
  intervaloHoras: 8,
  intervaloMeses: 3,
  pontosOleo: ['Gancho rotativo'],
  tipoOleo: 'Óleo mineral fino',
  observacoes: 'Lubrificar regularmente.',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Resultado screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadOilInfo.mockResolvedValue(null); // no cache
  });

  it('shows machine data from the API (primary source)', async () => {
    mockSearchMachineInApi.mockResolvedValueOnce([mockMachineData]);

    render(<Resultado />);

    // Should show loading first
    expect(screen.getByText(/Buscando resultados/i)).toBeTruthy();

    // Then show the machine data
    await waitFor(() => {
      expect(screen.getByTestId('machine-card-model')).toHaveTextContent('Singer Heavy Duty 4432');
    });

    // Source badge should indicate API
    expect(screen.getByText('🌐 Banco de dados')).toBeTruthy();
    // Gemini should NOT have been called
    expect(mockGetMachineOilInfo).not.toHaveBeenCalled();
  });

  it('falls back to Gemini when API returns null (not found)', async () => {
    mockSearchMachineInApi.mockResolvedValueOnce(null); // not in DB
    mockGetMachineOilInfo.mockResolvedValueOnce([mockMachineData]);

    render(<Resultado />);

    await waitFor(() => {
      expect(screen.getByTestId('machine-card-model')).toHaveTextContent('Singer Heavy Duty 4432');
    });

    // Source badge should indicate Gemini
    expect(screen.getByText('✨ Gerado por IA')).toBeTruthy();
    expect(mockGetMachineOilInfo).toHaveBeenCalledWith('Singer Heavy Duty 4432');
    // Should attempt to persist to API in background
    await waitFor(() => {
      expect(saveMachineToApi).toHaveBeenCalledWith(mockMachineData);
    });
  });

  it('loads from local cache when available (skips API and Gemini)', async () => {
    mockLoadOilInfo.mockResolvedValueOnce(mockMachineData); // cache hit

    render(<Resultado />);

    await waitFor(() => {
      expect(screen.getByText('Singer Heavy Duty 4432')).toBeTruthy();
    });

    // Source badge should indicate cache
    expect(screen.getByText('📦 Cache local')).toBeTruthy();
    // Neither API nor Gemini should be called
    expect(mockSearchMachineInApi).not.toHaveBeenCalled();
    expect(mockGetMachineOilInfo).not.toHaveBeenCalled();
  });

  it('shows an error message when both API and Gemini fail', async () => {
    mockSearchMachineInApi.mockResolvedValueOnce(null);
    mockGetMachineOilInfo.mockRejectedValueOnce(new Error('Gemini offline'));

    render(<Resultado />);

    await waitFor(() => {
      expect(screen.getByText('Ops!')).toBeTruthy();
      expect(screen.getByText('Gemini offline')).toBeTruthy();
    });
  });

  it('shows the "Ver datas de lubrificação" button after loading', async () => {
    mockSearchMachineInApi.mockResolvedValueOnce([mockMachineData]);

    render(<Resultado />);

    await waitFor(() => {
      expect(screen.getByText('Ver datas de lubrificação')).toBeTruthy();
    });
  });
});
