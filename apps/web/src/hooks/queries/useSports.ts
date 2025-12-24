import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api-client';
import type {
  SportConfig,
  ESPNScoreboardResponse,
  FavoriteTeam,
  SportCategory,
  SportType,
} from '@sports-stats-api/types';

// Response types
interface SportsListResponse {
  sports: SportConfig[];
}

interface SportGamesResponse extends ESPNScoreboardResponse {
  sportId: string;
}

interface SportTeamsResponse {
  sportId: string;
  teams: FavoriteTeam[];
}

interface LeaderboardResponse extends ESPNScoreboardResponse {
  sportId: string;
}

// Filter options for sports list
interface UseSportsOptions {
  category?: SportCategory;
  type?: SportType;
}

/**
 * Fetch list of all available sports
 */
export function useSports(options?: UseSportsOptions) {
  const params = new URLSearchParams();
  if (options?.category) params.append('category', options.category);
  if (options?.type) params.append('type', options.type);

  const queryString = params.toString();
  const endpoint = queryString ? `/sports?${queryString}` : '/sports';

  return useQuery({
    queryKey: ['sports', options?.category, options?.type],
    queryFn: () => apiGet<SportsListResponse>(endpoint),
    staleTime: 5 * 60 * 1000, // 5 minutes - sport list rarely changes
  });
}

/**
 * Fetch games/scoreboard for a specific sport
 * @param sportId - The sport identifier
 * @param date - Optional date in YYYYMMDD format
 */
export function useSportGames(sportId: string | undefined, date?: string) {
  const endpoint = date
    ? `/sports/${sportId}/games?date=${date}`
    : `/sports/${sportId}/games`;

  return useQuery({
    queryKey: ['sport-games', sportId, date],
    queryFn: () => apiGet<SportGamesResponse>(endpoint),
    enabled: !!sportId,
    refetchInterval: 30000, // 30 seconds for live updates
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Fetch all teams for a sport (for team selection in settings)
 */
export function useSportTeams(sportId: string | undefined) {
  return useQuery({
    queryKey: ['sport-teams', sportId],
    queryFn: () => apiGet<SportTeamsResponse>(`/sports/${sportId}/teams`),
    enabled: !!sportId,
    staleTime: 10 * 60 * 1000, // 10 minutes - team list rarely changes
  });
}

/**
 * Fetch leaderboard for individual sports (golf, racing, etc.)
 */
export function useLeaderboard(sportId: string | undefined) {
  return useQuery({
    queryKey: ['leaderboard', sportId],
    queryFn: () => apiGet<LeaderboardResponse>(`/sports/${sportId}/leaderboard`),
    enabled: !!sportId,
    refetchInterval: 30000, // 30 seconds for live updates
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Fetch a single sport's configuration
 */
export function useSportConfig(sportId: string | undefined) {
  return useQuery({
    queryKey: ['sport-config', sportId],
    queryFn: () => apiGet<SportConfig>(`/sports/${sportId}`),
    enabled: !!sportId,
    staleTime: 60 * 60 * 1000, // 1 hour - config rarely changes
  });
}
