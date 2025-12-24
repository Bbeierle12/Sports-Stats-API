const NHL_API_BASE = 'https://api-web.nhle.com/v1';

export interface NHLScheduleResponse {
  gameWeek: GameWeek[];
}

export interface GameWeek {
  date: string;
  dayAbbrev: string;
  numberOfGames: number;
  games: NHLGame[];
}

export interface NHLGame {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  venue: { default: string };
  startTimeUTC: string;
  gameState: string;
  gameScheduleState: string;
  awayTeam: NHLTeamInfo;
  homeTeam: NHLTeamInfo;
  periodDescriptor?: {
    number: number;
    periodType: string;
  };
  clock?: {
    timeRemaining: string;
    running: boolean;
    inIntermission: boolean;
  };
}

export interface NHLTeamInfo {
  id: number;
  placeName: { default: string };
  abbrev: string;
  logo: string;
  score?: number;
}

export interface NHLStandings {
  standings: NHLTeamStanding[];
}

export interface NHLTeamStanding {
  teamName: { default: string };
  teamCommonName: { default: string };
  teamAbbrev: { default: string };
  teamLogo: string;
  conferenceName: string;
  divisionName: string;
  divisionSequence: number;
  conferenceSequence: number;
  leagueSequence: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  pointPctg: number;
  goalFor: number;
  goalAgainst: number;
  goalDifferential: number;
  homeWins: number;
  homeLosses: number;
  homeOtLosses: number;
  roadWins: number;
  roadLosses: number;
  roadOtLosses: number;
  l10Wins: number;
  l10Losses: number;
  l10OtLosses: number;
  streakCode: string;
  streakCount: number;
  seasonId: number;
  placeName: { default: string };
}

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
  return getSchedule(today);
}

export async function getSchedule(date: string): Promise<NHLScheduleResponse> {
  return fetchNHL<NHLScheduleResponse>(`/schedule/${date}`);
}

export async function getGameById(gameId: string): Promise<NHLGame> {
  return fetchNHL<NHLGame>(`/gamecenter/${gameId}/landing`);
}

export async function getStandings(): Promise<NHLStandings> {
  const currentDate = new Date().toISOString().split('T')[0];
  return fetchNHL<NHLStandings>(`/standings/${currentDate}`);
}

export async function getTeamStats(abbrev: string): Promise<NHLTeamStanding | null> {
  const standings = await getStandings();
  const team = standings.standings.find(
    (t) => t.teamAbbrev.default.toLowerCase() === abbrev.toLowerCase()
  );
  return team || null;
}
