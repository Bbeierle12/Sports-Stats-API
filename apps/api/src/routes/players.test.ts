import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import playersRouter from './players';

// Mock the NHL service
vi.mock('../services/nhl', () => ({
  getPlayerStats: vi.fn(),
}));

import * as nhlService from '../services/nhl';

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/players', playersRouter);
  return app;
}

describe('Players Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /players/:playerId', () => {
    it('should return 400 for non-numeric player ID', async () => {
      const response = await request(app).get('/players/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid player ID');
      expect(response.body).toHaveProperty('message', 'Player ID must be numeric');
      expect(nhlService.getPlayerStats).not.toHaveBeenCalled();
    });

    it('should return 400 for alphanumeric player ID', async () => {
      const response = await request(app).get('/players/abc123');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid player ID');
    });

    it('should return player statistics for a skater', async () => {
      const mockPlayerStats = {
        playerId: 8478402,
        headshot: 'https://example.com/mcdavid.png',
        firstName: { default: 'Connor' },
        lastName: { default: 'McDavid' },
        sweaterNumber: 97,
        positionCode: 'C',
        birthDate: '1997-01-13',
        birthCountry: 'CAN',
        currentTeamAbbrev: 'EDM',
        featuredStats: {
          season: 20232024,
          regularSeason: {
            subSeason: {
              gamesPlayed: 45,
              goals: 30,
              assists: 50,
              points: 80,
              plusMinus: 15,
            },
          },
        },
      };

      vi.mocked(nhlService.getPlayerStats).mockResolvedValueOnce(mockPlayerStats);

      const response = await request(app).get('/players/8478402');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlayerStats);
      expect(response.body.firstName.default).toBe('Connor');
      expect(response.body.lastName.default).toBe('McDavid');
      expect(response.body.positionCode).toBe('C');
      expect(nhlService.getPlayerStats).toHaveBeenCalledWith('8478402');
    });

    it('should return player statistics for a goalie', async () => {
      const mockGoalieStats = {
        playerId: 8476945,
        headshot: 'https://example.com/shesterkin.png',
        firstName: { default: 'Igor' },
        lastName: { default: 'Shesterkin' },
        sweaterNumber: 31,
        positionCode: 'G',
        birthDate: '1995-12-30',
        birthCountry: 'RUS',
        currentTeamAbbrev: 'NYR',
        featuredStats: {
          season: 20232024,
          regularSeason: {
            subSeason: {
              gamesPlayed: 40,
              wins: 25,
              losses: 10,
              goalsAgainstAvg: 2.15,
              savePctg: 0.925,
            },
          },
        },
      };

      vi.mocked(nhlService.getPlayerStats).mockResolvedValueOnce(mockGoalieStats);

      const response = await request(app).get('/players/8476945');

      expect(response.status).toBe(200);
      expect(response.body.positionCode).toBe('G');
      expect(response.body.featuredStats.regularSeason.subSeason.wins).toBe(25);
      expect(response.body.featuredStats.regularSeason.subSeason.savePctg).toBe(0.925);
    });

    it('should return player with minimal stats', async () => {
      const mockPlayerStats = {
        playerId: 8479999,
        firstName: { default: 'John' },
        lastName: { default: 'Doe' },
        sweaterNumber: 42,
        positionCode: 'D',
        birthDate: '2000-05-15',
        birthCountry: 'USA',
      };

      vi.mocked(nhlService.getPlayerStats).mockResolvedValueOnce(mockPlayerStats);

      const response = await request(app).get('/players/8479999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlayerStats);
      expect(response.body.featuredStats).toBeUndefined();
    });

    it('should handle non-existent player', async () => {
      vi.mocked(nhlService.getPlayerStats).mockRejectedValueOnce(
        new Error('NHL API error: 404 Not Found')
      );

      const response = await request(app).get('/players/9999999');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'NHL API error: 404 Not Found');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(nhlService.getPlayerStats).mockRejectedValueOnce(
        new Error('NHL API error: 500 Internal Server Error')
      );

      const response = await request(app).get('/players/8478402');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'NHL API error: 500 Internal Server Error');
    });

    it('should handle service unavailable', async () => {
      vi.mocked(nhlService.getPlayerStats).mockRejectedValueOnce(
        new Error('NHL API error: 503 Service Unavailable')
      );

      const response = await request(app).get('/players/8478402');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should handle network errors', async () => {
      vi.mocked(nhlService.getPlayerStats).mockRejectedValueOnce(
        new Error('Network error')
      );

      const response = await request(app).get('/players/8478402');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'Network error');
    });

    it('should handle numeric player ID', async () => {
      const mockPlayerStats = {
        playerId: 12345,
        firstName: { default: 'Test' },
        lastName: { default: 'Player' },
        positionCode: 'RW',
      };

      vi.mocked(nhlService.getPlayerStats).mockResolvedValueOnce(mockPlayerStats);

      const response = await request(app).get('/players/12345');

      expect(response.status).toBe(200);
      expect(nhlService.getPlayerStats).toHaveBeenCalledWith('12345');
    });
  });
});
