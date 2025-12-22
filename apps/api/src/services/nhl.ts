import type {
  NHLScheduleResponse,
  NHLStandings,
  NHLPlayerStats,
  NHLGame,
  NHLTeamStanding,
} from '../types/nhl';
import { cache, CACHE_TTL } from '../utils/cache';

const NHL_API_BASE = 'https://api-web.nhle.com/v1';

async function fetchNHL<T>(endpoint: string): Promise<T> {
  const url = `${NHL_API_BASE}${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NHL API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getLiveScores(): Promise<NHLScheduleResponse> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `live-scores:${today}`;

  const cached = cache.get<NHLScheduleResponse>(cacheKey);
  if (cached) return cached;

  const data = await fetchNHL<NHLScheduleResponse>(`/schedule/${today}`);
  cache.set(cacheKey, data, CACHE_TTL.LIVE_SCORES);
  return data;
}

export async function getSchedule(date: string): Promise<NHLScheduleResponse> {
  const cacheKey = `schedule:${date}`;

  const cached = cache.get<NHLScheduleResponse>(cacheKey);
  if (cached) return cached;

  const data = await fetchNHL<NHLScheduleResponse>(`/schedule/${date}`);
  cache.set(cacheKey, data, CACHE_TTL.SCHEDULE);
  return data;
}

export async function getGameById(gameId: string): Promise<NHLGame> {
  const cacheKey = `game:${gameId}`;

  const cached = cache.get<NHLGame>(cacheKey);
  if (cached) return cached;

  const data = await fetchNHL<NHLGame>(`/gamecenter/${gameId}/landing`);
  cache.set(cacheKey, data, CACHE_TTL.GAME_DETAILS);
  return data;
}

export async function getStandings(): Promise<NHLStandings> {
  const currentDate = new Date().toISOString().split('T')[0];
  const cacheKey = `standings:${currentDate}`;

  const cached = cache.get<NHLStandings>(cacheKey);
  if (cached) return cached;

  const data = await fetchNHL<NHLStandings>(`/standings/${currentDate}`);
  cache.set(cacheKey, data, CACHE_TTL.STANDINGS);
  return data;
}

export async function getPlayerStats(playerId: string): Promise<NHLPlayerStats> {
  const cacheKey = `player:${playerId}`;

  const cached = cache.get<NHLPlayerStats>(cacheKey);
  if (cached) return cached;

  const data = await fetchNHL<NHLPlayerStats>(`/player/${playerId}/landing`);
  cache.set(cacheKey, data, CACHE_TTL.PLAYER_STATS);
  return data;
}

export async function getTeamStats(abbrev: string): Promise<NHLTeamStanding | null> {
  const standings = await getStandings();
  const team = standings.standings.find(
    (t) => t.teamAbbrev.default.toLowerCase() === abbrev.toLowerCase()
  );
  return team || null;
}
