import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLiveScores,
  getSchedule,
  getGameById,
  getStandings,
  getPlayerStats,
  getTeamStats,
} from './nhl';
import { cache } from '../utils/cache';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const NHL_API_BASE = 'https://api-web.nhle.com/v1';

describe('NHL Service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    cache.clear(); // Clear cache between tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getSchedule', () => {
    it('should fetch schedule for a specific date', async () => {
      const mockResponse = {
        gameWeek: [
          {
            date: '2024-01-15',
            dayAbbrev: 'MON',
            numberOfGames: 2,
            games: [
              {
                id: 2023020123,
                season: 20232024,
                gameType: 2,
                gameDate: '2024-01-15',
                gameState: 'FUT',
                awayTeam: { id: 1, abbrev: 'BOS', placeName: { default: 'Boston' } },
                homeTeam: { id: 2, abbrev: 'TOR', placeName: { default: 'Toronto' } },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getSchedule('2024-01-15');

      expect(mockFetch).toHaveBeenCalledWith(`${NHL_API_BASE}/schedule/2024-01-15`);
      expect(result).toEqual(mockResponse);
      expect(result.gameWeek[0].games).toHaveLength(1);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getSchedule('2024-01-15')).rejects.toThrow(
        'NHL API error: 500 Internal Server Error'
      );
    });

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getSchedule('2024-01-15')).rejects.toThrow('Network error');
    });
  });

  describe('getLiveScores', () => {
    it('should fetch schedule for today', async () => {
      const mockResponse = {
        gameWeek: [
          {
            date: '2024-01-15',
            dayAbbrev: 'MON',
            numberOfGames: 1,
            games: [
              {
                id: 2023020456,
                gameState: 'LIVE',
                awayTeam: { id: 3, abbrev: 'MTL', score: 2 },
                homeTeam: { id: 4, abbrev: 'OTT', score: 3 },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getLiveScores();

      expect(mockFetch).toHaveBeenCalledWith(`${NHL_API_BASE}/schedule/2024-01-15`);
      expect(result).toEqual(mockResponse);
    });

    it('should use current date in correct format', async () => {
      vi.setSystemTime(new Date('2024-12-25'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ gameWeek: [] }),
      });

      await getLiveScores();

      expect(mockFetch).toHaveBeenCalledWith(`${NHL_API_BASE}/schedule/2024-12-25`);
    });
  });

  describe('getGameById', () => {
    it('should fetch game details by ID', async () => {
      const mockResponse = {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getGameById('2023020789');

      expect(mockFetch).toHaveBeenCalledWith(`${NHL_API_BASE}/gamecenter/2023020789/landing`);
      expect(result).toEqual(mockResponse);
      expect(result.gameState).toBe('FINAL');
    });

    it('should throw error for invalid game ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(getGameById('invalid-id')).rejects.toThrow(
        'NHL API error: 404 Not Found'
      );
    });
  });

  describe('getStandings', () => {
    it('should fetch current standings', async () => {
      const mockResponse = {
        standings: [
          {
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
            placeName: { default: 'Boston' },
          },
          {
            teamName: { default: 'Maple Leafs' },
            teamCommonName: { default: 'Maple Leafs' },
            teamAbbrev: { default: 'TOR' },
            teamLogo: 'https://example.com/tor.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            gamesPlayed: 45,
            wins: 28,
            losses: 12,
            otLosses: 5,
            points: 61,
            placeName: { default: 'Toronto' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getStandings();

      expect(mockFetch).toHaveBeenCalledWith(`${NHL_API_BASE}/standings/2024-01-15`);
      expect(result.standings).toHaveLength(2);
      expect(result.standings[0].teamAbbrev.default).toBe('BOS');
    });

    it('should throw error on standings API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(getStandings()).rejects.toThrow(
        'NHL API error: 503 Service Unavailable'
      );
    });
  });

  describe('getPlayerStats', () => {
    it('should fetch player statistics', async () => {
      const mockResponse = {
        playerId: 8478402,
        headshot: 'https://example.com/player.png',
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getPlayerStats('8478402');

      expect(mockFetch).toHaveBeenCalledWith(`${NHL_API_BASE}/player/8478402/landing`);
      expect(result).toEqual(mockResponse);
      expect(result.firstName.default).toBe('Connor');
      expect(result.lastName.default).toBe('McDavid');
    });

    it('should fetch goalie statistics', async () => {
      const mockResponse = {
        playerId: 8476945,
        firstName: { default: 'Igor' },
        lastName: { default: 'Shesterkin' },
        sweaterNumber: 31,
        positionCode: 'G',
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getPlayerStats('8476945');

      expect(result.positionCode).toBe('G');
      expect(result.featuredStats?.regularSeason?.subSeason?.wins).toBe(25);
    });

    it('should throw error for non-existent player', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(getPlayerStats('9999999')).rejects.toThrow(
        'NHL API error: 404 Not Found'
      );
    });
  });

  describe('getTeamStats', () => {
    it('should return team from standings by abbreviation', async () => {
      const mockStandings = {
        standings: [
          {
            teamName: { default: 'Bruins' },
            teamAbbrev: { default: 'BOS' },
            teamLogo: 'https://example.com/bos.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            wins: 30,
            losses: 10,
            otLosses: 5,
            points: 65,
            placeName: { default: 'Boston' },
          },
          {
            teamName: { default: 'Maple Leafs' },
            teamAbbrev: { default: 'TOR' },
            teamLogo: 'https://example.com/tor.png',
            conferenceName: 'Eastern',
            divisionName: 'Atlantic',
            wins: 28,
            losses: 12,
            otLosses: 5,
            points: 61,
            placeName: { default: 'Toronto' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStandings),
      });

      const result = await getTeamStats('bos');

      expect(result).not.toBeNull();
      expect(result.teamAbbrev.default).toBe('BOS');
      expect(result.wins).toBe(30);
    });

    it('should be case insensitive for team abbreviation', async () => {
      const mockStandings = {
        standings: [
          {
            teamName: { default: 'Bruins' },
            teamAbbrev: { default: 'BOS' },
            wins: 30,
            placeName: { default: 'Boston' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStandings),
      });

      const result = await getTeamStats('BOS');

      expect(result).not.toBeNull();
      expect(result.teamAbbrev.default).toBe('BOS');
    });

    it('should return null for non-existent team', async () => {
      const mockStandings = {
        standings: [
          {
            teamName: { default: 'Bruins' },
            teamAbbrev: { default: 'BOS' },
            placeName: { default: 'Boston' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStandings),
      });

      const result = await getTeamStats('XYZ');

      expect(result).toBeNull();
    });

    it('should throw error if standings fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getTeamStats('bos')).rejects.toThrow(
        'NHL API error: 500 Internal Server Error'
      );
    });
  });
});
