import {
  getSportConfig,
  type ESPNScoreboardResponse,
  type ESPNTeamScheduleResponse,
  type ESPNTeamsResponse,
  type FavoriteTeam,
} from '../../packages/types/dist';

export const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Build ESPN API URL for scoreboard
 * @param sportId - The sport identifier
 * @param date - Optional date in YYYYMMDD format
 */
function buildScoreboardUrl(sportId: string, date?: string): string {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }
  const baseUrl = `${ESPN_API_BASE}/${config.apiPath.sport}/${config.apiPath.league}/scoreboard`;
  return date ? `${baseUrl}?dates=${date}` : baseUrl;
}

/**
 * Build ESPN API URL for teams list
 */
function buildTeamsUrl(sportId: string): string {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }
  return `${ESPN_API_BASE}/${config.apiPath.sport}/${config.apiPath.league}/teams`;
}

/**
 * Build ESPN API URL for team schedule
 */
function buildTeamScheduleUrl(sportId: string, teamId: string): string {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }
  return `${ESPN_API_BASE}/${config.apiPath.sport}/${config.apiPath.league}/teams/${teamId}/schedule`;
}

/**
 * Fetch scoreboard data for a sport
 * @param sportId - The sport identifier
 * @param date - Optional date in YYYYMMDD format
 */
export async function getScoreboard(sportId: string, date?: string): Promise<ESPNScoreboardResponse> {
  const url = buildScoreboardUrl(sportId, date);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  return response.json() as Promise<ESPNScoreboardResponse>;
}

/**
 * Fetch all teams for a sport (for team selection)
 */
export async function getTeams(sportId: string): Promise<FavoriteTeam[]> {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }

  // Individual sports don't have teams
  if (!config.hasTeams) {
    return [];
  }

  const url = buildTeamsUrl(sportId);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  const data = await response.json() as ESPNTeamsResponse;

  // ESPN returns teams nested in sports[0].leagues[0].teams
  const teamsData = data.sports?.[0]?.leagues?.[0]?.teams || [];

  return teamsData.map((teamWrapper) => {
    const team = teamWrapper.team;
    return {
      id: team.id,
      sportId,
      name: team.displayName,
      abbreviation: team.abbreviation,
      logo: team.logos?.[0]?.href,
      emoji: config.icon,
      primaryColor: team.color ? `#${team.color}` : config.icon,
    };
  });
}

/**
 * Fetch schedule for a specific team
 */
export async function getTeamSchedule(
  sportId: string,
  teamId: string
): Promise<ESPNTeamScheduleResponse> {
  const url = buildTeamScheduleUrl(sportId, teamId);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  return response.json() as Promise<ESPNTeamScheduleResponse>;
}

/**
 * Fetch leaderboard data for individual sports (golf, racing, etc.)
 */
export async function getLeaderboard(sportId: string): Promise<ESPNScoreboardResponse> {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }

  // Team sports don't have leaderboards
  if (config.type === 'team') {
    throw new Error(`Leaderboard not available for team sport: ${sportId}`);
  }

  // Individual sports use the scoreboard endpoint for event data
  return getScoreboard(sportId);
}

/**
 * Fetch all teams with their statistics/records
 */
export async function getTeamsWithStats(sportId: string): Promise<any> {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }

  // Individual sports don't have teams
  if (!config.hasTeams) {
    return { teams: [] };
  }

  const url = buildTeamsUrl(sportId);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  const data = await response.json() as ESPNTeamsResponse;

  // ESPN returns teams nested in sports[0].leagues[0].teams
  const teamsData = data.sports?.[0]?.leagues?.[0]?.teams || [];

  return {
    teams: teamsData.map((teamWrapper: any) => ({
      id: teamWrapper.team.id,
      displayName: teamWrapper.team.displayName,
      abbreviation: teamWrapper.team.abbreviation,
      logo: teamWrapper.team.logos?.[0]?.href,
      color: teamWrapper.team.color,
      record: teamWrapper.team.record,
      standingSummary: teamWrapper.team.standingSummary,
      location: teamWrapper.team.location,
      nickname: teamWrapper.team.nickname,
    })),
  };
}

/**
 * Build ESPN API URL for team roster
 */
function buildRosterUrl(sportId: string, teamId: string): string {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }
  return `${ESPN_API_BASE}/${config.apiPath.sport}/${config.apiPath.league}/teams/${teamId}/roster`;
}

/**
 * Fetch roster for a specific team
 */
export async function getTeamRoster(sportId: string, teamId: string): Promise<any> {
  const config = getSportConfig(sportId);
  if (!config) {
    throw new Error(`Unknown sport: ${sportId}`);
  }

  if (!config.hasTeams) {
    return { athletes: [] };
  }

  const url = buildRosterUrl(sportId, teamId);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    team: data.team,
    athletes: data.athletes || [],
  };
}
