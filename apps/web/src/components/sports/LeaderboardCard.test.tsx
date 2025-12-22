import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardCard } from './LeaderboardCard';
import type { GolfTournament, RaceEvent } from '@sports-stats-api/types';

describe('LeaderboardCard', () => {
  const createGolfTournament = (
    overrides: Partial<GolfTournament> = {}
  ): GolfTournament => ({
    id: '401580340',
    sportId: 'pga',
    name: 'The Masters',
    shortName: 'Masters',
    startDate: '2024-04-11T10:00:00Z',
    endDate: '2024-04-14T18:00:00Z',
    venue: 'Augusta National Golf Club',
    location: 'Augusta, Georgia',
    status: 'in_progress',
    currentRound: 2,
    leaderboard: [
      {
        position: 1,
        playerId: '1',
        playerName: 'Scottie Scheffler',
        country: 'USA',
        totalScore: -10,
        today: -4,
        thru: 'F',
        rounds: [66, 66],
        status: 'active',
      },
      {
        position: 2,
        playerId: '2',
        playerName: 'Jon Rahm',
        country: 'ESP',
        totalScore: -8,
        today: -3,
        thru: 'F',
        rounds: [67, 67],
        status: 'active',
      },
    ],
    ...overrides,
  });

  const createRaceEvent = (overrides: Partial<RaceEvent> = {}): RaceEvent => ({
    id: 'f1-2024-monaco',
    sportId: 'f1',
    name: 'Monaco Grand Prix',
    shortName: 'Monaco GP',
    startDate: '2024-05-26T13:00:00Z',
    endDate: '2024-05-26T15:00:00Z',
    venue: 'Circuit de Monaco',
    location: 'Monte Carlo, Monaco',
    status: 'in_progress',
    circuitName: 'Circuit de Monaco',
    totalLaps: 78,
    currentLap: 45,
    standings: [
      {
        position: 1,
        driverId: '1',
        driverName: 'Max Verstappen',
        team: 'Red Bull Racing',
        teamColor: '#1E41FF',
        carNumber: 1,
        status: 'racing',
      },
      {
        position: 2,
        driverId: '44',
        driverName: 'Lewis Hamilton',
        team: 'Mercedes',
        teamColor: '#00D2BE',
        carNumber: 44,
        time: '+3.245',
        status: 'racing',
      },
    ],
    ...overrides,
  });

  describe('event header', () => {
    it('should render event name', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('The Masters')).toBeInTheDocument();
    });

    it('should render venue', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Augusta National Golf Club')).toBeInTheDocument();
    });

    it('should render location', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Augusta, Georgia')).toBeInTheDocument();
    });

    it('should render start date', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      // Date format may vary by locale, check for date presence
      expect(screen.getByText(/4\/11\/2024|11\/4\/2024/)).toBeInTheDocument();
    });
  });

  describe('status badge', () => {
    it('should show Live badge for in_progress events', () => {
      const tournament = createGolfTournament({ status: 'in_progress' });
      render(<LeaderboardCard event={tournament} />);

      // Both indicator and badge show "Live"
      const liveElements = screen.getAllByText('Live');
      expect(liveElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show Upcoming badge for upcoming events', () => {
      const tournament = createGolfTournament({ status: 'upcoming' });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('should show Final badge for completed events', () => {
      const tournament = createGolfTournament({ status: 'completed' });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Final')).toBeInTheDocument();
    });

    it('should show Postponed badge for postponed events', () => {
      const tournament = createGolfTournament({ status: 'postponed' });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Postponed')).toBeInTheDocument();
    });

    it('should show Cancelled badge for cancelled events', () => {
      const tournament = createGolfTournament({ status: 'cancelled' });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('live indicator', () => {
    it('should show live indicator for in_progress events', () => {
      const tournament = createGolfTournament({ status: 'in_progress' });
      render(<LeaderboardCard event={tournament} />);

      // Should have both badge and indicator
      const liveElements = screen.getAllByText('Live');
      expect(liveElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should not show live indicator for completed events', () => {
      const tournament = createGolfTournament({ status: 'completed' });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.queryAllByText('Live')).toHaveLength(0);
    });
  });

  describe('golf leaderboard', () => {
    it('should render leaderboard header', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Pos')).toBeInTheDocument();
      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Thru')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should render player entries', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Scottie Scheffler')).toBeInTheDocument();
      expect(screen.getByText('Jon Rahm')).toBeInTheDocument();
    });

    it('should show player positions', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show player countries', () => {
      const tournament = createGolfTournament();
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('USA')).toBeInTheDocument();
      expect(screen.getByText('ESP')).toBeInTheDocument();
    });

    it('should show current round for golf', () => {
      const tournament = createGolfTournament({ currentRound: 3 });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Round 3')).toBeInTheDocument();
    });

    it('should limit to top 10 entries', () => {
      const manyEntries = Array.from({ length: 15 }, (_, i) => ({
        position: i + 1,
        playerId: String(i),
        playerName: `Player ${i + 1}`,
        totalScore: -10 + i,
        today: -2,
        thru: 'F',
        rounds: [70],
        status: 'active' as const,
      }));

      const tournament = createGolfTournament({ leaderboard: manyEntries });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 10')).toBeInTheDocument();
      expect(screen.queryByText('Player 11')).not.toBeInTheDocument();
    });
  });

  describe('racing standings', () => {
    it('should render standings header', () => {
      const race = createRaceEvent();
      render(<LeaderboardCard event={race} />);

      expect(screen.getByText('Pos')).toBeInTheDocument();
      expect(screen.getByText('#')).toBeInTheDocument();
      expect(screen.getByText('Driver')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Gap')).toBeInTheDocument();
    });

    it('should render driver entries', () => {
      const race = createRaceEvent();
      render(<LeaderboardCard event={race} />);

      expect(screen.getByText('Max Verstappen')).toBeInTheDocument();
      expect(screen.getByText('Lewis Hamilton')).toBeInTheDocument();
    });

    it('should show car numbers', () => {
      const race = createRaceEvent();
      render(<LeaderboardCard event={race} />);

      // Car number 1 also appears as position 1, so use getAllByText
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('44')).toBeInTheDocument();
    });

    it('should show team names', () => {
      const race = createRaceEvent();
      render(<LeaderboardCard event={race} />);

      expect(screen.getByText('Red Bull Racing')).toBeInTheDocument();
      expect(screen.getByText('Mercedes')).toBeInTheDocument();
    });

    it('should show Leader for first position', () => {
      const race = createRaceEvent();
      render(<LeaderboardCard event={race} />);

      expect(screen.getByText('Leader')).toBeInTheDocument();
    });

    it('should show gap for non-leaders', () => {
      const race = createRaceEvent();
      render(<LeaderboardCard event={race} />);

      expect(screen.getByText('+3.245')).toBeInTheDocument();
    });

    it('should show current lap info', () => {
      const race = createRaceEvent({ currentLap: 45, totalLaps: 78 });
      render(<LeaderboardCard event={race} />);

      expect(screen.getByText('Lap 45/78')).toBeInTheDocument();
    });

    it('should limit to top 10 entries', () => {
      const manyEntries = Array.from({ length: 20 }, (_, i) => ({
        position: i + 1,
        driverId: String(i),
        driverName: `Driver ${i + 1}`,
        team: `Team ${i + 1}`,
        carNumber: i + 1,
        status: 'racing' as const,
        time: i === 0 ? undefined : `+${i}.000`,
      }));

      const race = createRaceEvent({ standings: manyEntries });
      render(<LeaderboardCard event={race} />);

      expect(screen.getByText('Driver 1')).toBeInTheDocument();
      expect(screen.getByText('Driver 10')).toBeInTheDocument();
      expect(screen.queryByText('Driver 11')).not.toBeInTheDocument();
    });
  });

  describe('event without venue', () => {
    it('should not render venue when not provided', () => {
      const tournament = createGolfTournament({ venue: undefined });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.queryByText('Augusta National Golf Club')).not.toBeInTheDocument();
    });
  });

  describe('event without location', () => {
    it('should not render location when not provided', () => {
      const tournament = createGolfTournament({ location: undefined });
      render(<LeaderboardCard event={tournament} />);

      expect(screen.queryByText('Augusta, Georgia')).not.toBeInTheDocument();
    });
  });
});
