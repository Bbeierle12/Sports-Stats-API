import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import gamesRouter from './games';

// Mock the NHL service
vi.mock('../services/nhl', () => ({
  getLiveScores: vi.fn(),
  getSchedule: vi.fn(),
  getGameById: vi.fn(),
}));

import * as nhlService from '../services/nhl';

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/games', gamesRouter);
  return app;
}

describe('Games Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /games', () => {
    it('should return live scores when no date provided', async () => {
      const mockLiveScores = {
        gameWeek: [
          {
            date: '2024-01-15',
            dayAbbrev: 'MON',
            numberOfGames: 2,
            games: [
              {
                id: 2023020123,
                gameState: 'LIVE',
                awayTeam: { id: 1, abbrev: 'BOS', score: 2 },
                homeTeam: { id: 2, abbrev: 'TOR', score: 3 },
              },
              {
                id: 2023020124,
                gameState: 'FUT',
                awayTeam: { id: 3, abbrev: 'MTL' },
                homeTeam: { id: 4, abbrev: 'OTT' },
              },
            ],
          },
        ],
      };

      vi.mocked(nhlService.getLiveScores).mockResolvedValueOnce(mockLiveScores);

      const response = await request(app).get('/games');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLiveScores);
      expect(nhlService.getLiveScores).toHaveBeenCalled();
      expect(nhlService.getSchedule).not.toHaveBeenCalled();
    });

    it('should return schedule for specific date', async () => {
      const mockSchedule = {
        gameWeek: [
          {
            date: '2024-01-20',
            dayAbbrev: 'SAT',
            numberOfGames: 1,
            games: [
              {
                id: 2023020200,
                gameState: 'FUT',
                awayTeam: { id: 5, abbrev: 'NYR' },
                homeTeam: { id: 6, abbrev: 'NJD' },
              },
            ],
          },
        ],
      };

      vi.mocked(nhlService.getSchedule).mockResolvedValueOnce(mockSchedule);

      const response = await request(app).get('/games?date=2024-01-20');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSchedule);
      expect(nhlService.getSchedule).toHaveBeenCalledWith('2024-01-20');
      expect(nhlService.getLiveScores).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app).get('/games?date=01-20-2024');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid date format');
      expect(response.body).toHaveProperty('message', 'Date must be in YYYY-MM-DD format');
      expect(nhlService.getSchedule).not.toHaveBeenCalled();
    });

    it('should return 400 for malformed date', async () => {
      const response = await request(app).get('/games?date=not-a-date');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid date format');
    });

    it('should return 400 for partial date format', async () => {
      const response = await request(app).get('/games?date=2024-1-5');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid date format');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(nhlService.getLiveScores).mockRejectedValueOnce(
        new Error('NHL API error: 500 Internal Server Error')
      );

      const response = await request(app).get('/games');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'NHL API error: 500 Internal Server Error');
    });

    it('should handle network errors', async () => {
      vi.mocked(nhlService.getLiveScores).mockRejectedValueOnce(
        new Error('Network error')
      );

      const response = await request(app).get('/games');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('GET /games/:gameId', () => {
    it('should return game details by ID', async () => {
      const mockGame = {
        id: 2023020789,
        season: 20232024,
        gameType: 2,
        gameState: 'FINAL',
        awayTeam: {
          id: 5,
          abbrev: 'NYR',
          placeName: { default: 'New York' },
          score: 4,
        },
        homeTeam: {
          id: 6,
          abbrev: 'NJD',
          placeName: { default: 'New Jersey' },
          score: 2,
        },
        periodDescriptor: { number: 3, periodType: 'REG' },
      };

      vi.mocked(nhlService.getGameById).mockResolvedValueOnce(mockGame);

      const response = await request(app).get('/games/2023020789');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGame);
      expect(nhlService.getGameById).toHaveBeenCalledWith('2023020789');
    });

    it('should handle game not found', async () => {
      vi.mocked(nhlService.getGameById).mockRejectedValueOnce(
        new Error('NHL API error: 404 Not Found')
      );

      const response = await request(app).get('/games/9999999999');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'NHL API error: 404 Not Found');
    });

    it('should handle API errors for game details', async () => {
      vi.mocked(nhlService.getGameById).mockRejectedValueOnce(
        new Error('NHL API error: 503 Service Unavailable')
      );

      const response = await request(app).get('/games/2023020123');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });
});
