import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api-client';

// Response types
interface TeamWithStats {
  id: string;
  displayName: string;
  abbreviation: string;
  logo?: string;
  color?: string;
  record?: {
    items?: Array<{
      summary?: string;
      stats?: Array<{
        name: string;
        displayName?: string;
        value: number | string;
        displayValue?: string;
      }>;
    }>;
  };
  standingSummary?: string;
  location?: string;
  nickname?: string;
}

interface TeamStatisticsResponse {
  sportId: string;
  teams: TeamWithStats[];
}

interface Athlete {
  id: string;
  displayName: string;
  jersey?: string;
  position?: {
    name?: string;
    abbreviation?: string;
  };
  headshot?: {
    href?: string;
  };
  displayHeight?: string;
  displayWeight?: string;
  age?: number;
  experience?: {
    years?: number;
  };
  college?: {
    name?: string;
  };
  statistics?: Array<{
    stats?: Array<{
      name: string;
      abbreviation?: string;
      value: number | string;
      displayValue?: string;
    }>;
  }>;
}

interface AthleteGroup {
  position: string;
  items: Athlete[];
}

interface TeamRosterResponse {
  sportId: string;
  teamId: string;
  team?: {
    id: string;
    displayName: string;
    logo?: string;
  };
  athletes: AthleteGroup[];
}

/**
 * Fetch all teams with their statistics for a sport
 */
export function useTeamStatistics(sportId: string | undefined) {
  return useQuery({
    queryKey: ['team-statistics', sportId],
    queryFn: () => apiGet<TeamStatisticsResponse>(`/sports/${sportId}/statistics`),
    enabled: !!sportId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch roster for a specific team
 */
export function useTeamRoster(sportId: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: ['team-roster', sportId, teamId],
    queryFn: () => apiGet<TeamRosterResponse>(`/sports/${sportId}/teams/${teamId}/roster`),
    enabled: !!sportId && !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
