import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import teamsRouter from './teams';

// Mock the NHL service
vi.mock('../services/nhl', () => ({
  getStandings: vi.fn(),
  getTeamStats: vi.fn(),
}));

import * as nhlService from '../services/nhl';

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/teams', teamsRouter);
  return app;
}

describe('Teams Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /teams', () => {
    it('should return list of all NHL teams', async () => {
      const mockStandings = {
        standings: [
          {
            teamName: { default: 'Bruins' },
            teamAbbrev: { default: 'BOS' },
            teamLogo: 'https://example.com/bos.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            placeName: { default: 'Boston' },
          },
          {
            teamName: { default: 'Maple Leafs' },
            teamAbbrev: { default: 'TOR' },
            teamLogo: 'https://example.com/tor.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            placeName: { default: 'Toronto' },
          },
          {
            teamName: { default: 'Canadiens' },
            teamAbbrev: { default: 'MTL' },
            teamLogo: 'https://example.com/mtl.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            placeName: { default: 'Montreal' },
          },
        ],
      };

      vi.mocked(nhlService.getStandings).mockResolvedValueOnce(mockStandings);

      const response = await request(app).get('/teams');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id', 'BOS');
      expect(response.body[0]).toHaveProperty('name', 'Boston Bruins');
      expect(response.body[0]).toHaveProperty('abbreviation', 'BOS');
      expect(response.body[0]).toHaveProperty('conference', 'Eastern');
      expect(response.body[0]).toHaveProperty('division', 'Atlantic');
      expect(response.body[0]).toHaveProperty('logo', 'https://example.com/bos.png');
    });

    it('should format team names correctly', async () => {
      const mockStandings = {
        standings: [
          {
            teamName: { default: 'Golden Knights' },
            teamAbbrev: { default: 'VGK' },
            teamLogo: 'https://example.com/vgk.png',
            conferenceName: 'Western',
            divisionName: 'Pacific',
            placeName: { default: 'Vegas' },
          },
        ],
      };

      vi.mocked(nhlService.getStandings).mockResolvedValueOnce(mockStandings);

      const response = await request(app).get('/teams');

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('name', 'Vegas Golden Knights');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(nhlService.getStandings).mockRejectedValueOnce(
        new Error('NHL API error: 500 Internal Server Error')
      );

      const response = await request(app).get('/teams');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'NHL API error: 500 Internal Server Error');
    });

    it('should handle empty standings', async () => {
      const mockStandings = {
        standings: [],
      };

      vi.mocked(nhlService.getStandings).mockResolvedValueOnce(mockStandings);

      const response = await request(app).get('/teams');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /teams/:teamId', () => {
    it('should return team stats by abbreviation', async () => {
      const mockTeamStats = {
        teamName: { default: 'Bruins' },
        teamCommonName: { default: 'Bruins' },
        teamAbbrev: { default: 'BOS' },
        teamLogo: 'https://example.com/bos.png',
        conferenceName: 'Eastern',
        divisionName: 'Atlantic',
        gamesPlayed: 45,
        wins: 30,
        losses: 10,
        otLosses: 5,
        points: 65,
        goalFor: 150,
        goalAgainst: 100,
        goalDifferential: 50,
        placeName: { default: 'Boston' },
      };

      vi.mocked(nhlService.getTeamStats).mockResolvedValueOnce(mockTeamStats);

      const response = await request(app).get('/teams/bos');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTeamStats);
      expect(nhlService.getTeamStats).toHaveBeenCalledWith('bos');
    });

    it('should handle case insensitive team ID', async () => {
      const mockTeamStats = {
        teamName: { default: 'Bruins' },
        teamAbbrev: { default: 'BOS' },
        wins: 30,
        losses: 10,
        placeName: { default: 'Boston' },
      };

      vi.mocked(nhlService.getTeamStats).mockResolvedValueOnce(mockTeamStats);

      const response = await request(app).get('/teams/BOS');

      expect(response.status).toBe(200);
      expect(nhlService.getTeamStats).toHaveBeenCalledWith('BOS');
    });

    it('should return 404 for non-existent team', async () => {
      vi.mocked(nhlService.getTeamStats).mockResolvedValueOnce(null);

      const response = await request(app).get('/teams/xyz');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Team not found');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(nhlService.getTeamStats).mockRejectedValueOnce(
        new Error('NHL API error: 503 Service Unavailable')
      );

      const response = await request(app).get('/teams/bos');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'NHL API error: 503 Service Unavailable');
    });
  });
});
