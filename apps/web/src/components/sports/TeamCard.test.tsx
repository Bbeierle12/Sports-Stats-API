import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamCard } from './TeamCard';
import type { ESPNTeam } from '@sports-stats-api/types';

describe('TeamCard', () => {
  const createMockTeam = (overrides: Partial<ESPNTeam> = {}): ESPNTeam => ({
    id: '1',
    sportId: 'nfl',
    name: 'Dallas Cowboys',
    abbreviation: 'DAL',
    logo: 'https://example.com/dal.png',
    emoji: '🏈',
    primaryColor: '#002244',
    record: {
      wins: 10,
      losses: 4,
    },
    lastGame: null,
    nextGame: null,
    liveGame: null,
    bye: false,
    ...overrides,
  });

  describe('basic rendering', () => {
    it('should render team name', () => {
      const team = createMockTeam();
      render(<TeamCard team={team} />);

      expect(screen.getByText('Dallas Cowboys')).toBeInTheDocument();
    });

    it('should render team logo when available', () => {
      const team = createMockTeam();
      render(<TeamCard team={team} />);

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src', 'https://example.com/dal.png');
      expect(logo).toHaveAttribute('alt', 'DAL');
    });

    it('should render emoji fallback when logo is not available', () => {
      const team = createMockTeam({ logo: undefined });
      render(<TeamCard team={team} />);

      expect(screen.getByText('🏈')).toBeInTheDocument();
    });
  });

  describe('record formatting', () => {
    it('should display wins-losses record', () => {
      const team = createMockTeam({
        record: { wins: 10, losses: 4 },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('10-4')).toBeInTheDocument();
    });

    it('should include ties when present and non-zero', () => {
      const team = createMockTeam({
        record: { wins: 8, losses: 5, ties: 1 },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('8-5-1')).toBeInTheDocument();
    });

    it('should include overtime losses when present and non-zero', () => {
      const team = createMockTeam({
        sportId: 'nhl',
        record: { wins: 30, losses: 15, otl: 5 },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('30-15-5')).toBeInTheDocument();
    });

    it('should not include ties when zero', () => {
      const team = createMockTeam({
        record: { wins: 10, losses: 4, ties: 0 },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('10-4')).toBeInTheDocument();
    });
  });

  describe('live game display', () => {
    it('should show live indicator when game is live', () => {
      const team = createMockTeam({
        liveGame: {
          opponent: 'PHI',
          period: 'Q2',
          clock: '5:42',
          teamScore: 14,
          opponentScore: 7,
          isHome: true,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should show opponent with vs for home games', () => {
      const team = createMockTeam({
        liveGame: {
          opponent: 'PHI',
          period: 'Q3',
          clock: '10:00',
          teamScore: 21,
          opponentScore: 14,
          isHome: true,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('vs PHI')).toBeInTheDocument();
    });

    it('should show opponent with @ for away games', () => {
      const team = createMockTeam({
        liveGame: {
          opponent: 'NYG',
          period: 'Q4',
          clock: '2:00',
          teamScore: 28,
          opponentScore: 24,
          isHome: false,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('@ NYG')).toBeInTheDocument();
    });

    it('should show period and clock', () => {
      const team = createMockTeam({
        liveGame: {
          opponent: 'PHI',
          period: 'Q2',
          clock: '5:42',
          teamScore: 14,
          opponentScore: 7,
          isHome: true,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText(/Q2/)).toBeInTheDocument();
      expect(screen.getByText(/5:42/)).toBeInTheDocument();
    });

    it('should show scores', () => {
      const team = createMockTeam({
        liveGame: {
          opponent: 'PHI',
          period: 'Q3',
          clock: '8:15',
          teamScore: 21,
          opponentScore: 14,
          isHome: true,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('21')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
    });
  });

  describe('bye week display', () => {
    it('should show bye week indicator when team is on bye', () => {
      const team = createMockTeam({ bye: true });
      render(<TeamCard team={team} />);

      expect(screen.getByText('Bye Week')).toBeInTheDocument();
    });

    it('should not show bye when team has live game', () => {
      const team = createMockTeam({
        bye: true,
        liveGame: {
          opponent: 'PHI',
          period: 'Q1',
          clock: '15:00',
          teamScore: 0,
          opponentScore: 0,
          isHome: true,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.queryByText('Bye Week')).not.toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  describe('last game display', () => {
    it('should show last game result', () => {
      const team = createMockTeam({
        lastGame: {
          opponent: 'ARI',
          score: '31-17',
          won: true,
          date: 'Dec 15',
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('Last')).toBeInTheDocument();
      expect(screen.getByText('ARI')).toBeInTheDocument();
      expect(screen.getByText('W 31-17')).toBeInTheDocument();
    });

    it('should show loss correctly', () => {
      const team = createMockTeam({
        lastGame: {
          opponent: 'SF',
          score: '42-10',
          won: false,
          date: 'Dec 8',
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('L 42-10')).toBeInTheDocument();
    });

    it('should not show last game when live game is active', () => {
      const team = createMockTeam({
        lastGame: {
          opponent: 'ARI',
          score: '31-17',
          won: true,
          date: 'Dec 15',
        },
        liveGame: {
          opponent: 'PHI',
          period: 'Q1',
          clock: '15:00',
          teamScore: 0,
          opponentScore: 0,
          isHome: true,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.queryByText('Last')).not.toBeInTheDocument();
    });
  });

  describe('next game display', () => {
    it('should show next game info', () => {
      const team = createMockTeam({
        nextGame: {
          opponent: '@ MIA',
          date: 'Sun Dec 22',
          time: '1:05 PM EST',
          isHome: false,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('@ MIA')).toBeInTheDocument();
      expect(screen.getByText('Sun Dec 22 • 1:05 PM EST')).toBeInTheDocument();
    });

    it('should not show next game when live game is active', () => {
      const team = createMockTeam({
        nextGame: {
          opponent: 'MIA',
          date: 'Sun Dec 22',
          time: '1:05 PM EST',
          isHome: true,
        },
        liveGame: {
          opponent: 'PHI',
          period: 'Q1',
          clock: '15:00',
          teamScore: 0,
          opponentScore: 0,
          isHome: true,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('combined last and next game', () => {
    it('should show both last and next game when available', () => {
      const team = createMockTeam({
        lastGame: {
          opponent: 'ARI',
          score: '31-17',
          won: true,
          date: 'Dec 15',
        },
        nextGame: {
          opponent: '@ MIA',
          date: 'Sun Dec 22',
          time: '1:05 PM EST',
          isHome: false,
        },
      });
      render(<TeamCard team={team} />);

      expect(screen.getByText('Last')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });
});
