import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSportConfig } from '../../../../../packages/types/dist';
import * as espnService from '../../../../_lib/espn';

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
    const { sportId, teamId } = req.query;

    if (typeof sportId !== 'string') {
      return res.status(400).json({ error: 'Invalid sport ID' });
    }

    if (typeof teamId !== 'string') {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const config = getSportConfig(sportId);

    if (!config) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    if (!config.hasTeams) {
      return res.json({
        sportId,
        teamId,
        athletes: [],
        message: 'This sport does not have teams',
      });
    }

    const roster = await espnService.getTeamRoster(sportId, teamId);

    return res.json({
      sportId,
      teamId,
      ...roster,
    });
  } catch (error) {
    console.error(`Error fetching team roster:`, error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch team roster',
    });
  }
}
