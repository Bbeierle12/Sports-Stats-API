import { Router, Request, Response } from 'express';
import { getSchedule, getLiveScores, getGameById } from '../services/nhl';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;

    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'Date must be in YYYY-MM-DD format',
        });
      }
      const schedule = await getSchedule(date);
      return res.json(schedule);
    }

    const liveScores = await getLiveScores();
    return res.json(liveScores);
  } catch (error) {
    console.error('Error fetching games:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to fetch games',
    });
  }
});

router.get('/:gameId', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    // Validate gameId is numeric
    if (!/^\d+$/.test(gameId)) {
      return res.status(400).json({
        error: 'Invalid game ID',
        message: 'Game ID must be numeric',
      });
    }

    const gameData = await getGameById(gameId);
    return res.json(gameData);
  } catch (error) {
    console.error('Error fetching game:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to fetch game',
    });
  }
});

export default router;
