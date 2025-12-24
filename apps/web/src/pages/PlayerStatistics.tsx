import { useState, useEffect } from 'react';
import { Users, ChevronDown, Search } from 'lucide-react';
import { useTeamRoster, useTeamStatistics } from '../hooks/queries/useStatistics';
import { useSettings } from '../contexts/SettingsContext';
import { getSportConfig, getTeamSports } from '@sports-stats-api/types';

export default function PlayerStatistics() {
  const { enabledSports } = useSettings();
  const teamSports = getTeamSports();

  // Filter to only team sports that are enabled, or show all team sports if none enabled
  const availableSports = enabledSports.length > 0
    ? teamSports.filter(sport => enabledSports.includes(sport.id))
    : teamSports;

  const [selectedSport, setSelectedSport] = useState<string>(
    availableSports[0]?.id || 'nfl'
  );
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const sportConfig = getSportConfig(selectedSport);

  // Fetch teams for the selected sport
  const {
    data: teamsData,
    isLoading: teamsLoading,
  } = useTeamStatistics(selectedSport);

  const teams = teamsData?.teams || [];

  // Auto-select first team when sport changes
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id);
    }
  }, [teams, selectedTeam]);

  // Reset team when sport changes
  useEffect(() => {
    setSelectedTeam('');
  }, [selectedSport]);

  // Fetch roster for selected team
  const {
    data: rosterData,
    isLoading: rosterLoading,
    error: rosterError,
  } = useTeamRoster(selectedSport, selectedTeam);

  const athletes = rosterData?.athletes || [];

  // Filter athletes by search query
  const filteredAthletes = searchQuery
    ? athletes.filter((group: any) => {
        const filteredItems = group.items?.filter((player: any) =>
          player.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.position?.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return filteredItems?.length > 0;
      }).map((group: any) => ({
        ...group,
        items: group.items?.filter((player: any) =>
          player.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.position?.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
    : athletes;

  const isLoading = teamsLoading || rosterLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-white">Player Statistics</h1>
            <p className="text-gray-400 text-sm">View stats for players across all teams</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sport Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-gray-400 text-sm">Sport:</label>
          <div className="relative">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="appearance-none bg-surface border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-accent cursor-pointer"
            >
              {availableSports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.icon} {sport.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Team Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-gray-400 text-sm">Team:</label>
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={teamsLoading || teams.length === 0}
              className="appearance-none bg-surface border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-accent cursor-pointer disabled:opacity-50"
            >
              {teamsLoading ? (
                <option>Loading teams...</option>
              ) : teams.length === 0 ? (
                <option>No teams available</option>
              ) : (
                teams.map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {rosterError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">
            Error loading player statistics. Please try again later.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[...Array(2)].map((_, groupIndex) => (
            <div key={groupIndex}>
              <div className="h-6 bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-surface rounded-xl border border-gray-700 p-4 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player Groups (by position) */}
      {!isLoading && !rosterError && filteredAthletes.length > 0 && (
        <div className="space-y-8">
          {filteredAthletes.map((group: any) => (
            <div key={group.position || 'unknown'}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span>{group.position || 'Players'}</span>
                <span className="text-gray-500 text-sm font-normal">
                  ({group.items?.length || 0})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items?.map((player: any) => (
                  <div
                    key={player.id}
                    className="bg-surface rounded-xl border border-gray-700 p-4 hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Player Photo */}
                      <div className="flex-shrink-0">
                        {player.headshot?.href ? (
                          <img
                            src={player.headshot.href}
                            alt={player.displayName}
                            className="w-16 h-16 rounded-full object-cover bg-gray-800"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {player.jersey && (
                            <span className="text-accent font-bold">#{player.jersey}</span>
                          )}
                          <h4 className="text-white font-semibold truncate">
                            {player.displayName}
                          </h4>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {player.position?.abbreviation || player.position?.name || 'N/A'}
                        </p>

                        {/* Player Details */}
                        <div className="mt-2 space-y-1 text-xs text-gray-500">
                          {player.displayHeight && player.displayWeight && (
                            <p>{player.displayHeight} / {player.displayWeight}</p>
                          )}
                          {player.age && (
                            <p>Age: {player.age}</p>
                          )}
                          {player.experience?.years !== undefined && (
                            <p>
                              {player.experience.years === 0
                                ? 'Rookie'
                                : `${player.experience.years} yr${player.experience.years !== 1 ? 's' : ''} exp`}
                            </p>
                          )}
                          {player.college?.name && (
                            <p className="truncate">{player.college.name}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Player Stats Preview */}
                    {player.statistics && player.statistics.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="grid grid-cols-3 gap-2">
                          {player.statistics[0]?.stats?.slice(0, 3).map((stat: any, index: number) => (
                            <div key={index} className="text-center">
                              <div className="text-white font-semibold text-sm">
                                {stat.displayValue || stat.value}
                              </div>
                              <div className="text-gray-500 text-xs uppercase">
                                {stat.abbreviation || stat.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Players */}
      {!isLoading && !rosterError && filteredAthletes.length === 0 && selectedTeam && (
        <div className="text-center py-12 bg-surface rounded-xl border border-gray-700">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchQuery
              ? `No players found matching "${searchQuery}"`
              : 'No players found for this team'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {searchQuery ? 'Try a different search term' : 'Try selecting a different team'}
          </p>
        </div>
      )}

      {/* No Team Selected */}
      {!isLoading && !selectedTeam && !teamsLoading && (
        <div className="text-center py-12 bg-surface rounded-xl border border-gray-700">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Select a team to view player statistics</p>
        </div>
      )}
    </div>
  );
}
