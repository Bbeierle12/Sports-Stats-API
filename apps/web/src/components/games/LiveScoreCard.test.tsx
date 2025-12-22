import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveScoreCard from './LiveScoreCard';

describe('LiveScoreCard', () => {
  const createMockGame = (overrides = {}) => ({
    id: 2023020123,
    gameState: 'FUT',
    awayTeam: {
      abbrev: 'BOS',
      placeName: { default: 'Boston' },
      logo: 'https://example.com/bos.png',
      score: 0,
    },
    homeTeam: {
      abbrev: 'TOR',
      placeName: { default: 'Toronto' },
      logo: 'https://example.com/tor.png',
      score: 0,
    },
    ...overrides,
  });

  describe('rendering', () => {
    it('should render team names and abbreviations', () => {
      const game = createMockGame();
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('Boston')).toBeInTheDocument();
      expect(screen.getByText('Toronto')).toBeInTheDocument();
      expect(screen.getAllByText('BOS')[0]).toBeInTheDocument();
      expect(screen.getAllByText('TOR')[0]).toBeInTheDocument();
    });

    it('should render scores', () => {
      const game = createMockGame({
        awayTeam: { abbrev: 'BOS', score: 3 },
        homeTeam: { abbrev: 'TOR', score: 2 },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render default score of 0 when score is undefined', () => {
      const game = createMockGame({
        awayTeam: { abbrev: 'BOS' },
        homeTeam: { abbrev: 'TOR' },
      });
      render(<LiveScoreCard game={game} />);

      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(2);
    });

    it('should render team logos when available', () => {
      const game = createMockGame();
      render(<LiveScoreCard game={game} />);

      const logos = screen.getAllByRole('img');
      expect(logos).toHaveLength(2);
      expect(logos[0]).toHaveAttribute('src', 'https://example.com/bos.png');
      expect(logos[1]).toHaveAttribute('src', 'https://example.com/tor.png');
    });

    it('should render fallback when no logo available', () => {
      const game = createMockGame({
        awayTeam: { abbrev: 'BOS', placeName: { default: 'Boston' } },
        homeTeam: { abbrev: 'TOR', placeName: { default: 'Toronto' } },
      });
      render(<LiveScoreCard game={game} />);

      // Should render abbreviations in fallback divs
      expect(screen.getAllByText('BOS')).toHaveLength(2); // One in fallback, one as label
      expect(screen.getAllByText('TOR')).toHaveLength(2);
    });

    it('should return null when game data is incomplete', () => {
      const { container } = render(<LiveScoreCard game={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when awayTeam is missing', () => {
      const game = { id: 1, gameState: 'FUT', homeTeam: { abbrev: 'TOR' } };
      const { container } = render(<LiveScoreCard game={game as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when homeTeam is missing', () => {
      const game = { id: 1, gameState: 'FUT', awayTeam: { abbrev: 'BOS' } };
      const { container } = render(<LiveScoreCard game={game as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('game states', () => {
    it('should show "Scheduled" for future games', () => {
      const game = createMockGame({ gameState: 'FUT' });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('should show "Live" indicator for live games', () => {
      const game = createMockGame({ gameState: 'LIVE' });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should show "Live" indicator for critical moment games', () => {
      const game = createMockGame({ gameState: 'CRIT' });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should show "Final" for finished games', () => {
      const game = createMockGame({ gameState: 'FINAL' });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('Final')).toBeInTheDocument();
    });

    it('should show "Final" for OFF state games', () => {
      const game = createMockGame({ gameState: 'OFF' });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('Final')).toBeInTheDocument();
    });
  });

  describe('period display', () => {
    it('should show 1st period', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 1, periodType: 'REG' },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('1st')).toBeInTheDocument();
    });

    it('should show 2nd period', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 2, periodType: 'REG' },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('2nd')).toBeInTheDocument();
    });

    it('should show 3rd period', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 3, periodType: 'REG' },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('3rd')).toBeInTheDocument();
    });

    it('should show OT for overtime', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 4, periodType: 'OT' },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('OT')).toBeInTheDocument();
    });

    it('should show 2OT for double overtime', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 5, periodType: 'OT' },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('2OT')).toBeInTheDocument();
    });

    it('should show 3OT for triple overtime', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 6, periodType: 'OT' },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('3OT')).toBeInTheDocument();
    });
  });

  describe('clock display', () => {
    it('should show time remaining during play', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 2, periodType: 'REG' },
        clock: { timeRemaining: '12:34', inIntermission: false },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('12:34')).toBeInTheDocument();
    });

    it('should show INT during intermission', () => {
      const game = createMockGame({
        gameState: 'LIVE',
        periodDescriptor: { number: 1, periodType: 'REG' },
        clock: { timeRemaining: '0:00', inIntermission: true },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.getByText('INT')).toBeInTheDocument();
    });

    it('should not show clock for non-live games', () => {
      const game = createMockGame({
        gameState: 'FUT',
        clock: { timeRemaining: '20:00', inIntermission: false },
      });
      render(<LiveScoreCard game={game} />);

      expect(screen.queryByText('20:00')).not.toBeInTheDocument();
    });
  });

  describe('team name fallback', () => {
    it('should use abbreviation when placeName is not available', () => {
      const game = createMockGame({
        awayTeam: { abbrev: 'NYR' },
        homeTeam: { abbrev: 'NJD' },
      });
      render(<LiveScoreCard game={game} />);

      // Name should fallback to abbreviation
      expect(screen.getAllByText('NYR').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('NJD').length).toBeGreaterThanOrEqual(1);
    });

    it('should show TBD when both placeName and abbrev are missing', () => {
      const game = createMockGame({
        awayTeam: {},
        homeTeam: {},
      });
      render(<LiveScoreCard game={game} />);

      const tbds = screen.getAllByText('TBD');
      expect(tbds.length).toBeGreaterThanOrEqual(2);
    });
  });
});
