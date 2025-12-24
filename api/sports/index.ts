import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllSports,
  getSportsByCategory,
  getTeamSports,
  getIndividualSports,
  type SportCategory,
} from '../../packages/types/dist';

export default function handler(req: VercelRequest, res: VercelResponse) {
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
    const { category, type } = req.query;

    let sports = getAllSports();

    // Filter by category if provided
    if (category && typeof category === 'string') {
      sports = getSportsByCategory(category as SportCategory);
    }

    // Filter by type if provided
    if (type === 'team') {
      sports = getTeamSports();
    } else if (type === 'individual') {
      sports = getIndividualSports();
    }

    // Apply both filters if both provided
    if (category && type) {
      sports = getAllSports().filter(
        (s) => s.category === category && s.type === type
      );
    }

    return res.json({ sports });
  } catch (error) {
    console.error('Error fetching sports list:', error);
    return res.status(500).json({ error: 'Failed to fetch sports list' });
  }
}
