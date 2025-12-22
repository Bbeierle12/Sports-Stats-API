import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import standingsRouter from './standings';

// Mock the NHL service
vi.mock('../services/nhl', () => ({
  getStandings: vi.fn(),
}));

import * as nhlService from '../services/nhl';

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/standings', standingsRouter);
  return app;
}

describe('Standings Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /standings', () => {
    it('should return NHL standings', async () => {
      const mockStandings = {
        standings: [
          {
            teamName: { default: 'Bruins' },
            teamCommonName: { default: 'Bruins' },
            teamAbbrev: { default: 'BOS' },
            teamLogo: 'https://example.com/bos.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            divisionSequence: 1,
            conferenceSequence: 1,
            leagueSequence: 1,
            gamesPlayed: 45,
            wins: 30,
            losses: 10,
            otLosses: 5,
            points: 65,
            pointPctg: 0.722,
            goalFor: 150,
            goalAgainst: 100,
            goalDifferential: 50,
            homeWins: 18,
            homeLosses: 4,
            homeOtLosses: 2,
            roadWins: 12,
            roadLosses: 6,
            roadOtLosses: 3,
            l10Wins: 7,
            l10Losses: 2,
            l10OtLosses: 1,
            streakCode: 'W',
            streakCount: 5,
            seasonId: 20232024,
            placeName: { default: 'Boston' },
          },
          {
            teamName: { default: 'Maple Leafs' },
            teamCommonName: { default: 'Maple Leafs' },
            teamAbbrev: { default: 'TOR' },
            teamLogo: 'https://example.com/tor.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            divisionSequence: 2,
            conferenceSequence: 2,
            leagueSequence: 2,
            gamesPlayed: 45,
            wins: 28,
            losses: 12,
            otLosses: 5,
            points: 61,
            pointPctg: 0.678,
            goalFor: 140,
            goalAgainst: 110,
            goalDifferential: 30,
            homeWins: 15,
            homeLosses: 6,
            homeOtLosses: 3,
            roadWins: 13,
            roadLosses: 6,
            roadOtLosses: 2,
            l10Wins: 6,
            l10Losses: 3,
            l10OtLosses: 1,
            streakCode: 'L',
            streakCount: 1,
            seasonId: 20232024,
            placeName: { default: 'Toronto' },
          },
        ],
      };

      vi.mocked(nhlService.getStandings).mockResolvedValueOnce(mockStandings);

      const response = await request(app).get('/standings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStandings);
      expect(response.body.standings).toHaveLength(2);
      expect(nhlService.getStandings).toHaveBeenCalled();
    });

    it('should return standings with full team data', async () => {
      const mockStandings = {
        standings: [
          {
            teamName: { default: 'Oilers' },
            teamAbbrev: { default: 'EDM' },
            conferenceName: 'Western',
            divisionName: 'Pacific',
            wins: 32,
            losses: 15,
            otLosses: 3,
            points: 67,
            streakCode: 'W',
            streakCount: 3,
            placeName: { default: 'Edmonton' },
          },
        ],
      };

      vi.mocked(nhlService.getStandings).mockResolvedValueOnce(mockStandings);

      const response = await request(app).get('/standings');

      expect(response.status).toBe(200);
      expect(response.body.standings[0]).toHaveProperty('teamAbbrev');
      expect(response.body.standings[0]).toHaveProperty('conferenceName', 'Western');
      expect(response.body.standings[0]).toHaveProperty('divisionName', 'Pacific');
      expect(response.body.standings[0]).toHaveProperty('wins', 32);
      expect(response.body.standings[0]).toHaveProperty('points', 67);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(nhlService.getStandings).mockRejectedValueOnce(
        new Error('NHL API error: 500 Internal Server Error')
      );

      const response = await request(app).get('/standings');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'NHL API error: 500 Internal Server Error');
    });

    it('should handle service unavailable', async () => {
      vi.mocked(nhlService.getStandings).mockRejectedValueOnce(
        new Error('NHL API error: 503 Service Unavailable')
      );

      const response = await request(app).get('/standings');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should handle empty standings', async () => {
      const mockStandings = {
        standings: [],
      };

      vi.mocked(nhlService.getStandings).mockResolvedValueOnce(mockStandings);

      const response = await request(app).get('/standings');

      expect(response.status).toBe(200);
      expect(response.body.standings).toEqual([]);
    });

    it('should handle network errors', async () => {
      vi.mocked(nhlService.getStandings).mockRejectedValueOnce(
        new Error('Network error')
      );

      const response = await request(app).get('/standings');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'Network error');
    });
  });
});
