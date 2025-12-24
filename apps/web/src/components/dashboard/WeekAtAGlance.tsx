import { useMemo } from 'react'
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface ESPNEvent {
  id: string
  date: string
  status?: {
    type?: {
      state?: string
    }
  }
  competitions?: Array<{
    competitors?: Array<{
      team?: {
        abbreviation?: string
        logo?: string
      }
      homeAway?: string
    }>
  }>
}

interface WeekAtAGlanceProps {
  events: ESPNEvent[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onWeekChange: (direction: 'prev' | 'next') => void
  sportIcon?: string
}

const WeekAtAGlance = ({
  events,
  selectedDate,
  onDateSelect,
  onWeekChange,
  sportIcon
}: WeekAtAGlanceProps) => {
  // Get week days starting from Sunday
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [selectedDate])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ESPNEvent[]> = {}
    events.forEach(event => {
      if (!event.date) return
      // ESPN dates are in ISO format, extract just the date part
      const dateKey = event.date.split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    return grouped
  }, [events])

  const getEventsForDay = (date: Date): ESPNEvent[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return eventsByDate[dateKey] || []
  }

  const hasLiveEvent = (events: ESPNEvent[]) => {
    return events.some(e => e.status?.type?.state === 'in')
  }

  return (
    <div className="bg-surface rounded-xl border border-gray-700 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {sportIcon ? (
            <span className="text-xl">{sportIcon}</span>
          ) : (
            <Calendar className="w-5 h-5 text-accent" />
          )}
          <h3 className="text-lg font-semibold text-white">Week at a Glance</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onWeekChange('prev')}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400 px-2 min-w-[140px] text-center">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => onWeekChange('next')}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day)
          const hasLive = hasLiveEvent(dayEvents)
          const isSelected = isSameDay(day, selectedDate)
          const isCurrentDay = isToday(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                relative p-3 rounded-lg transition-all text-center
                ${isSelected
                  ? 'bg-accent text-white ring-2 ring-accent ring-offset-2 ring-offset-surface'
                  : isCurrentDay
                    ? 'bg-accent/20 text-accent border border-accent/50'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }
              `}
            >
              {/* Day name */}
              <div className={`text-xs font-medium mb-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {format(day, 'EEE')}
              </div>

              {/* Day number */}
              <div className={`text-lg font-bold ${isSelected ? 'text-white' : ''}`}>
                {format(day, 'd')}
              </div>

              {/* Event count indicator */}
              {dayEvents.length > 0 && (
                <div className="mt-2 flex items-center justify-center space-x-1">
                  {hasLive ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-live rounded-full animate-pulse"></div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-white/90' : 'text-live'}`}>
                        {dayEvents.length}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white/60' : 'bg-gray-500'}`}></div>
                      <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                        {dayEvents.length}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* No events indicator */}
              {dayEvents.length === 0 && (
                <div className={`mt-2 text-xs ${isSelected ? 'text-white/50' : 'text-gray-600'}`}>
                  -
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick preview of selected day */}
      {getEventsForDay(selectedDate).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
            </span>
            <span className="text-sm text-accent font-medium">
              {getEventsForDay(selectedDate).length} game{getEventsForDay(selectedDate).length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {getEventsForDay(selectedDate).slice(0, 5).map(event => {
              const competition = event.competitions?.[0]
              const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home')
              const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away')
              const isLive = event.status?.type?.state === 'in'

              if (!homeTeam || !awayTeam) return null

              return (
                <div
                  key={event.id}
                  className="flex items-center space-x-1 bg-gray-800 rounded-lg px-2 py-1"
                >
                  {awayTeam.team?.logo && (
                    <img src={awayTeam.team.logo} alt="" className="w-4 h-4 object-contain" />
                  )}
                  <span className="text-xs text-gray-300">{awayTeam.team?.abbreviation}</span>
                  <span className="text-xs text-gray-500">@</span>
                  <span className="text-xs text-gray-300">{homeTeam.team?.abbreviation}</span>
                  {homeTeam.team?.logo && (
                    <img src={homeTeam.team.logo} alt="" className="w-4 h-4 object-contain" />
                  )}
                  {isLive && (
                    <div className="w-1.5 h-1.5 bg-live rounded-full animate-pulse ml-1"></div>
                  )}
                </div>
              )
            })}
            {getEventsForDay(selectedDate).length > 5 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{getEventsForDay(selectedDate).length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WeekAtAGlance
