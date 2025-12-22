import { Router, Request, Response } from 'express';
import { getPlayerStats } from '../services/nhl';

const router: Router = Router();

router.get('/:playerId', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    // Validate playerId is numeric
    if (!/^\d+$/.test(playerId)) {
      return res.status(400).json({
        error: 'Invalid player ID',
        message: 'Player ID must be numeric',
      });
    }

    const playerStats = await getPlayerStats(playerId);
    return res.json(playerStats);
  } catch (error) {
    console.error('Error fetching player:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to fetch player',
    });
  }
});

export default router;
