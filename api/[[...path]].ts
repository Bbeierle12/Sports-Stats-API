import type { VercelRequest, VercelResponse } from '@vercel/node';

const NHL_API_BASE = 'https://api-web.nhle.com/v1';
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// Sport configurations
const SPORTS_CONFIG: Record<string, { name: string; shortName: string; sport: string; league: string; icon: string; category: string; type: string; hasTeams: boolean }> = {
  nfl: { name: 'NFL Football', shortName: 'NFL', sport: 'football', league: 'nfl', icon: '🏈', category: 'pro', type: 'team', hasTeams: true },
  nba: { name: 'NBA Basketball', shortName: 'NBA', sport: 'basketball', league: 'nba', icon: '🏀', category: 'pro', type: 'team', hasTeams: true },
  mlb: { name: 'MLB Baseball', shortName: 'MLB', sport: 'baseball', league: 'mlb', icon: '⚾', category: 'pro', type: 'team', hasTeams: true },
  nhl: { name: 'NHL Hockey', shortName: 'NHL', sport: 'hockey', league: 'nhl', icon: '🏒', category: 'pro', type: 'team', hasTeams: true },
  mls: { name: 'MLS Soccer', shortName: 'MLS', sport: 'soccer', league: 'usa.1', icon: '⚽', category: 'pro', type: 'team', hasTeams: true },
  pga: { name: 'PGA Golf', shortName: 'PGA', sport: 'golf', league: 'pga', icon: '⛳', category: 'individual', type: 'individual', hasTeams: false },
  ncaaf: { name: 'College Football', shortName: 'NCAAF', sport: 'football', league: 'college-football', icon: '🏈', category: 'college', type: 'team', hasTeams: true },
  ncaab: { name: 'College Basketball', shortName: 'NCAAB', sport: 'basketball', league: 'mens-college-basketball', icon: '🏀', category: 'college', type: 'team', hasTeams: true },
};

// CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Fetch helper
async function fetchJSON(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const pathSegments = Array.isArray(path) ? path : (path ? [path] : []);
  const fullPath = '/' + pathSegments.join('/');

  try {
    // Health check
    if (fullPath === '/health' || fullPath === '/') {
      return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Sports Stats API',
      });
    }

    // NHL Games
    if (fullPath === '/games') {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const data = await fetchJSON(`${NHL_API_BASE}/schedule/${date}`);
      return res.json(data);
    }

    // NHL Game by ID
    if (fullPath.startsWith('/games/') && pathSegments.length === 2) {
      const gameId = pathSegments[1];
      const data = await fetchJSON(`${NHL_API_BASE}/gamecenter/${gameId}/landing`);
      return res.json(data);
    }

    // NHL Standings
    if (fullPath === '/standings') {
      const currentDate = new Date().toISOString().split('T')[0];
      const data = await fetchJSON(`${NHL_API_BASE}/standings/${currentDate}`);
      return res.json(data);
    }

    // NHL Teams
    if (fullPath === '/teams') {
      const currentDate = new Date().toISOString().split('T')[0];
      const standings = await fetchJSON(`${NHL_API_BASE}/standings/${currentDate}`) as any;
      const teams = standings.standings.map((team: any) => ({
        id: team.teamAbbrev.default,
        name: `${team.placeName.default} ${team.teamName.default}`,
        abbreviation: team.teamAbbrev.default,
        conference: team.conferenceName,
        division: team.divisionName,
        logo: team.teamLogo,
      }));
      return res.json(teams);
    }

    // NHL Team by ID
    if (fullPath.startsWith('/teams/') && pathSegments.length === 2 && !fullPath.includes('/sports/')) {
      const teamId = pathSegments[1];
      const currentDate = new Date().toISOString().split('T')[0];
      const standings = await fetchJSON(`${NHL_API_BASE}/standings/${currentDate}`) as any;
      const team = standings.standings.find(
        (t: any) => t.teamAbbrev.default.toLowerCase() === teamId.toLowerCase()
      );
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      return res.json(team);
    }

    // NHL Player
    if (fullPath.startsWith('/players/') && pathSegments.length === 2) {
      const playerId = pathSegments[1];
      const data = await fetchJSON(`${NHL_API_BASE}/player/${playerId}/landing`);
      return res.json(data);
    }

    // Multi-sport: List all sports
    if (fullPath === '/sports') {
      const { category, type } = req.query;
      let sports = Object.entries(SPORTS_CONFIG).map(([id, config]) => ({
        id,
        ...config,
        apiPath: { sport: config.sport, league: config.league },
      }));

      if (category) {
        sports = sports.filter(s => s.category === category);
      }
      if (type) {
        sports = sports.filter(s => s.type === type);
      }

      return res.json({ sports });
    }

    // Multi-sport: Sport config
    if (fullPath.startsWith('/sports/') && pathSegments.length === 2) {
      const sportId = pathSegments[1];
      const config = SPORTS_CONFIG[sportId];
      if (!config) {
        return res.status(404).json({ error: 'Sport not found' });
      }
      return res.json({
        id: sportId,
        ...config,
        apiPath: { sport: config.sport, league: config.league },
      });
    }

    // Multi-sport: Games/Scoreboard
    if (fullPath.match(/^\/sports\/[^/]+\/games$/)) {
      const sportId = pathSegments[1];
      const config = SPORTS_CONFIG[sportId];
      if (!config) {
        return res.status(404).json({ error: 'Sport not found' });
      }
      const data = await fetchJSON(`${ESPN_API_BASE}/${config.sport}/${config.league}/scoreboard`);
      return res.json({ sportId, ...data });
    }

    // Multi-sport: Teams list
    if (fullPath.match(/^\/sports\/[^/]+\/teams$/)) {
      const sportId = pathSegments[1];
      const config = SPORTS_CONFIG[sportId];
      if (!config) {
        return res.status(404).json({ error: 'Sport not found' });
      }
      if (!config.hasTeams) {
        return res.json({ sportId, teams: [] });
      }
      const data = await fetchJSON(`${ESPN_API_BASE}/${config.sport}/${config.league}/teams`) as any;
      const teamsData = data.sports?.[0]?.leagues?.[0]?.teams || [];
      const teams = teamsData.map((tw: any) => ({
        id: tw.team.id,
        sportId,
        name: tw.team.displayName,
        abbreviation: tw.team.abbreviation,
        logo: tw.team.logos?.[0]?.href,
        emoji: config.icon,
        primaryColor: tw.team.color ? `#${tw.team.color}` : config.icon,
      }));
      return res.json({ sportId, teams });
    }

    // Multi-sport: Team schedule
    if (fullPath.match(/^\/sports\/[^/]+\/teams\/[^/]+$/)) {
      const sportId = pathSegments[1];
      const teamId = pathSegments[3];
      const config = SPORTS_CONFIG[sportId];
      if (!config) {
        return res.status(404).json({ error: 'Sport not found' });
      }
      const data = await fetchJSON(`${ESPN_API_BASE}/${config.sport}/${config.league}/teams/${teamId}/schedule`);
      return res.json(data);
    }

    // Multi-sport: Leaderboard
    if (fullPath.match(/^\/sports\/[^/]+\/leaderboard$/)) {
      const sportId = pathSegments[1];
      const config = SPORTS_CONFIG[sportId];
      if (!config) {
        return res.status(404).json({ error: 'Sport not found' });
      }
      if (config.type === 'team') {
        return res.status(400).json({ error: `Leaderboard not available for team sport: ${sportId}` });
      }
      const data = await fetchJSON(`${ESPN_API_BASE}/${config.sport}/${config.league}/scoreboard`);
      return res.json({ sportId, ...data });
    }

    // 404
    return res.status(404).json({ error: 'Not Found', path: fullPath });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
