/**
 * Tests for export/import service
 * Tests full game state export and import functionality
 */

import { ExportService } from '../exportService';
import { worldStore } from '../../../state/worldStore';
import { characterStore } from '../../../state/characterStore';
import { sessionStore } from '../../../state/sessionStore';

// Mock the stores
jest.mock('../../../state/worldStore');
jest.mock('../../../state/characterStore'); 
jest.mock('../../../state/sessionStore');

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File.prototype.text method
global.File.prototype.text = jest.fn();

// Mock download functionality
const mockClick = jest.fn();
const mockElement = {
  click: mockClick,
  setAttribute: jest.fn(),
  style: { display: '' },
};
jest.spyOn(document, 'createElement').mockReturnValue(mockElement as HTMLElement);
jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement as HTMLElement);
jest.spyOn(document.body, 'removeChild').mockImplementation();

const MockedWorldStore = worldStore as jest.Mocked<typeof worldStore>;
const MockedCharacterStore = characterStore as jest.Mocked<typeof characterStore>;
const MockedSessionStore = sessionStore as jest.Mocked<typeof sessionStore>;

describe('ExportService', () => {
  let exportService: ExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    exportService = new ExportService();
  });

  describe('export functionality', () => {
    test('exports complete game state', async () => {
      const mockWorldState: Record<string, unknown> = { worlds: { 'world-1': { id: 'world-1', name: 'Test World' } } };
      const mockCharacterState: Record<string, unknown> = { characters: { 'char-1': { id: 'char-1', name: 'Test Character' } } };
      const mockSessionState = { activeSession: 'session-1' };

      MockedWorldStore.getState.mockReturnValue(mockWorldState);
      MockedCharacterStore.getState.mockReturnValue(mockCharacterState);
      MockedSessionStore.getState.mockReturnValue(mockSessionState);

      const result = await exportService.exportGameState();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        version: '1.0.0',
        exportedAt: expect.any(String),
        worldState: mockWorldState,
        characterState: mockCharacterState,
        sessionState: mockSessionState,
        journalState: expect.any(Object),
        narrativeState: expect.any(Object),
      });
    });

    test('handles export errors gracefully', async () => {
      MockedWorldStore.getState.mockImplementation(() => {
        throw new Error('Store error');
      });

      const result = await exportService.exportGameState();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to export game state');
    });

    test('creates downloadable file', async () => {
      const mockState = { worlds: {}, characters: {}, sessions: {} };
      MockedWorldStore.getState.mockReturnValue(mockState);
      MockedCharacterStore.getState.mockReturnValue(mockState);
      MockedSessionStore.getState.mockReturnValue(mockState);

      await exportService.downloadGameState();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'mock-blob-url');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/narraitor-save-\d{4}-\d{2}-\d{2}\.json/));
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('import functionality', () => {
    test('validates and imports valid game state', async () => {
      const validGameState = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        worldState: { worlds: {} },
        characterState: { characters: {} },
        sessionState: { activeSession: null },
      };

      const result = await exportService.importGameState(validGameState);

      if (!result.success) {
        console.error('Import failed:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.message).toBe('Game state imported successfully');
    });

    test('rejects invalid game state format', async () => {
      const invalidGameState = {
        invalidField: 'test',
      };

      const result = await exportService.importGameState(invalidGameState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid game state format');
    });

    test('rejects incompatible version', async () => {
      const incompatibleGameState = {
        version: '2.0.0', // Future version
        exportedAt: new Date().toISOString(),
        worldState: { worlds: {} },
        characterState: { characters: {} },
        sessionState: { activeSession: null },
      };

      const result = await exportService.importGameState(incompatibleGameState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Incompatible save file version');
    });

    test('handles corrupted data gracefully', async () => {
      const result = await exportService.importGameState(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid game state format');
    });
  });

  describe('file handling', () => {
    test('parses JSON file content', async () => {
      const validJSON = JSON.stringify({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        worldState: { worlds: {} },
        characterState: { characters: {} },
        sessionState: { activeSession: null },
      });

      const mockFile = new File([validJSON], 'save.json', { type: 'application/json' });
      
      // Mock the text() method to return our JSON
      (mockFile.text as jest.Mock).mockResolvedValue(validJSON);
      
      const result = await exportService.importFromFile(mockFile);

      if (!result.success) {
        console.error('File import failed:', result.error);
      }

      expect(result.success).toBe(true);
    });

    test('handles invalid JSON files', async () => {
      const invalidJSON = 'invalid json content';
      const mockFile = new File([invalidJSON], 'save.json', { type: 'application/json' });
      
      // Mock the text() method to return invalid JSON
      (mockFile.text as jest.Mock).mockResolvedValue(invalidJSON);
      
      const result = await exportService.importFromFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON file');
    });
  });
});