import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addWeeks } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useSportGames, useLeaderboard } from '../hooks/queries/useSports';
import { useSettings } from '../contexts/SettingsContext';
import {
  SportTabs,
  LeaderboardCard,
  TeamCardSkeleton,
  LeaderboardCardSkeleton,
} from '../components/sports';
import WeekAtAGlance from '../components/dashboard/WeekAtAGlance';
import { getSportConfig, getAllSports } from '@sports-stats-api/types';
import type { GolfTournament, RaceEvent } from '@sports-stats-api/types';

export default function SportDashboard() {
  const { sportId } = useParams<{ sportId: string }>();
  const navigate = useNavigate();
  const { enabledSports } = useSettings();

  // Date state for week navigation
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Default to first enabled sport if none specified
  const activeSport = sportId || enabledSports[0];
  const sportConfig = activeSport ? getSportConfig(activeSport) : null;

  const isTeamSport = sportConfig?.type === 'team';
  const isIndividualSport = sportConfig?.type === 'individual';

  // Format date for ESPN API (YYYYMMDD)
  const dateForApi = format(selectedDate, 'yyyyMMdd');

  // Fetch data based on sport type
  const {
    data: gamesData,
    isLoading: gamesLoading,
    error: gamesError,
    refetch: refetchGames,
    isFetching: gamesFetching,
  } = useSportGames(isTeamSport ? activeSport : undefined, dateForApi);

  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
    refetch: refetchLeaderboard,
    isFetching: leaderboardFetching,
  } = useLeaderboard(isIndividualSport ? activeSport : undefined);

  const isLoading = isTeamSport ? gamesLoading : leaderboardLoading;
  const error = isTeamSport ? gamesError : leaderboardError;
  const isFetching = isTeamSport ? gamesFetching : leaderboardFetching;
  const refetch = isTeamSport ? refetchGames : refetchLeaderboard;

  // Handle sport change
  const handleSportChange = (newSportId: string) => {
    navigate(`/sports/${newSportId}`);
  };

  // Handle week navigation
  const handleWeekChange = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
  };

  // Determine which sports have live games
  const liveSports: string[] = [];
  if (gamesData?.events?.some((e) => e.status?.type?.state === 'in')) {
    liveSports.push(activeSport || '');
  }

  // Categorize games
  const events = gamesData?.events || [];
  const liveEvents = events.filter((e) => e.status?.type?.state === 'in');
  const completedEvents = events.filter((e) => e.status?.type?.state === 'post');
  const scheduledEvents = events.filter((e) => e.status?.type?.state === 'pre');

  // No sport selected and no enabled sports
  if (!activeSport && enabledSports.length === 0) {
    const allSports = getAllSports();
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Sports Tracker</h2>
          <p className="text-gray-400 mb-8">Select your favorite sports to get started</p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {allSports.slice(0, 12).map((sport) => (
              <button
                key={sport.id}
                onClick={() => navigate(`/sports/${sport.id}`)}
                className="bg-surface border border-gray-700 rounded-xl p-4 hover:border-accent transition-colors"
              >
                <span className="text-3xl block mb-2">{sport.icon}</span>
                <span className="text-white text-sm font-medium">{sport.shortName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sportConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-400 text-lg">Sport not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const renderGameCard = (event: any) => {
    const competition = event.competitions?.[0];
    const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
    const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) return null;

    const isLive = event.status?.type?.state === 'in';
    const isFinal = event.status?.type?.state === 'post';

    return (
      <div
        key={event.id}
        className={`bg-surface rounded-xl border p-5 ${
          isLive ? 'border-live' : 'border-gray-700'
        } hover:border-accent/50 transition-colors`}
      >
        {isLive && (
          <div className="flex items-center space-x-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-live"></span>
            </span>
            <span className="text-live text-xs font-bold uppercase">Live</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {awayTeam.team?.logo && (
                <img
                  src={awayTeam.team.logo}
                  alt={awayTeam.team?.abbreviation}
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className="text-white font-medium">
                {awayTeam.team?.displayName || awayTeam.team?.abbreviation}
              </span>
            </div>
            <span className="text-2xl font-bold text-white">{awayTeam.score || 0}</span>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {homeTeam.team?.logo && (
                <img
                  src={homeTeam.team.logo}
                  alt={homeTeam.team?.abbreviation}
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className="text-white font-medium">
                {homeTeam.team?.displayName || homeTeam.team?.abbreviation}
              </span>
            </div>
            <span className="text-2xl font-bold text-white">{homeTeam.score || 0}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            {isFinal
              ? 'Final'
              : isLive
              ? event.status?.type?.shortDetail || 'In Progress'
              : format(new Date(event.date), 'h:mm a')}
          </span>
          {competition?.venue?.fullName && (
            <span className="text-gray-500 text-xs truncate max-w-[120px]">
              {competition.venue.fullName}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sport Tabs */}
      <SportTabs
        activeSport={activeSport}
        onSportChange={handleSportChange}
        liveSports={liveSports}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{sportConfig.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{sportConfig.name}</h1>
            <p className="text-gray-400 text-sm">Live scores and game updates</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-gray-400 hover:text-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Week at a Glance - for team sports */}
      {isTeamSport && !error && (
        <WeekAtAGlance
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onWeekChange={handleWeekChange}
          sportIcon={sportConfig.icon}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">
            Error loading {sportConfig.name} data. Please try again later.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isTeamSport ? (
            [...Array(6)].map((_, i) => <TeamCardSkeleton key={i} />)
          ) : (
            <LeaderboardCardSkeleton />
          )}
        </div>
      )}

      {/* Team Sports - Show Games */}
      {isTeamSport && !isLoading && !error && (
        <div className="space-y-8">
          {/* Live Games */}
          {liveEvents.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-live rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-white">Live ({liveEvents.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveEvents.map(renderGameCard)}
              </div>
            </div>
          )}

          {/* Completed Games */}
          {completedEvents.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Final ({completedEvents.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedEvents.map(renderGameCard)}
              </div>
            </div>
          )}

          {/* Scheduled Games */}
          {scheduledEvents.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Upcoming ({scheduledEvents.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledEvents.map(renderGameCard)}
              </div>
            </div>
          )}

          {/* No Games */}
          {events.length === 0 && (
            <div className="text-center py-12 bg-surface rounded-xl border border-gray-700">
              <p className="text-gray-400">No games scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
              <p className="text-gray-500 text-sm mt-2">Try selecting a different date</p>
            </div>
          )}
        </div>
      )}

      {/* Individual Sports - Show Leaderboard */}
      {isIndividualSport && !isLoading && !error && leaderboardData && (
        <div className="max-w-4xl">
          {leaderboardData.events && leaderboardData.events.length > 0 ? (
            <LeaderboardCard
              event={leaderboardData.events[0] as unknown as GolfTournament | RaceEvent}
            />
          ) : (
            <div className="text-center py-12 bg-surface rounded-xl border border-gray-700">
              <p className="text-gray-400">No events scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* Auto-refresh notice */}
      {!error && events.length > 0 && (
        <div className="text-center text-gray-500 text-sm">
          Auto-refreshing every 30 seconds
        </div>
      )}
    </div>
  );
}
