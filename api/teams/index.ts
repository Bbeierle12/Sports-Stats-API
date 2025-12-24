import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStandings } from '../_lib/nhl';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const standings = await getStandings();
    const teams = standings.standings.map((team) => ({
      id: team.teamAbbrev.default,
      name: `${team.placeName.default} ${team.teamName.default}`,
      abbreviation: team.teamAbbrev.default,
      conference: team.conferenceName,
      division: team.divisionName,
      logo: team.teamLogo,
    }));
    return res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to fetch teams',
    });
  }
}
