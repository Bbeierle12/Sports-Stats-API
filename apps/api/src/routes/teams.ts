import { Router, Request, Response } from 'express';
import { getStandings, getTeamStats } from '../services/nhl';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
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
});

router.get('/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    // Validate teamId is a valid NHL team abbreviation (2-4 letters)
    if (!/^[A-Za-z]{2,4}$/.test(teamId)) {
      return res.status(400).json({
        error: 'Invalid team ID',
        message: 'Team ID must be a 2-4 letter abbreviation (e.g., BOS, TOR, VGK)',
      });
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
});

export default router;
