import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTeamStats } from '../_lib/nhl';

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
    const { teamId } = req.query;

    if (typeof teamId !== 'string') {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const teamStats = await getTeamStats(teamId);

    if (!teamStats) {
      return res.status(404).json({ error: 'Team not found' });
    }

    return res.json(teamStats);
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to fetch team',
    });
  }
}
