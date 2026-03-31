import { useAtom } from 'jotai';
import { gameHistoryAtom, type GameType } from '../placeholders/gameHistoryAtom';
import { dashboardViewAtom, historyFiltersAtom } from '../services';
import { exportToCSV, exportToPDF } from '../utils/exportStore';
import '../Dashboard.scss';

const GAME_TYPES: { value: GameType; label: string }[] = [
  { value: 'diceGame', label: 'Dice Game' },
  { value: 'kingOfDiamond', label: 'King of Diamond' },
  { value: 'cardGame', label: 'Card Game' },
];

export default function FullGameHistory() {
  const [gameHistory] = useAtom(gameHistoryAtom);
  const [, setView] = useAtom(dashboardViewAtom);
  const [filters, setFilters] = useAtom(historyFiltersAtom);

  const getGameTypeName = (gameType: string) => {
    switch (gameType) {
      case 'diceGame':
        return 'Dice Game';
      case 'kingOfDiamond':
        return 'King of Diamond';
      case 'cardGame':
        return 'Card Game';
      default:
        return gameType;
    }
  };

  const getResultColor = (result: string) => {
    return result === 'win' ? '#4ade80' : '#f87171';
  };

  const getOpponentText = (opponents: string[]) => {
    if (opponents.length === 1) {
      return opponents[0];
    }
    if (opponents.length === 2) {
      return opponents.join(', ');
    }
    return `${opponents.slice(0, 2).join(', ')} +${opponents.length - 2}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const parseDate = (dateString: string) => new Date(dateString).getTime();

  // Apply filters
  const filteredGames = gameHistory.filter((game) => {
    // Filter by game type
    if (filters.gameTypes.length > 0 && !filters.gameTypes.includes(game.gameType)) {
      return false;
    }

    // Filter by opponent name (substring match, case-insensitive)
    if (filters.opponentName.trim()) {
      const searchName = filters.opponentName.toLowerCase();
      const matchFound = game.opponents.some((opponent) =>
        opponent.toLowerCase().includes(searchName)
      );
      if (!matchFound) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateRange.startDate) {
      const startTime = parseDate(filters.dateRange.startDate);
      if (game.timestamp < startTime) {
        return false;
      }
    }

    if (filters.dateRange.endDate) {
      const endTime = parseDate(filters.dateRange.endDate);
      // Add 24 hours to include the entire end date
      if (game.timestamp > endTime + 24 * 60 * 60 * 1000) {
        return false;
      }
    }

    return true;
  });

  // Group filtered games by date
  const groupedByDate = filteredGames.reduce(
    (acc, game) => {
      const date = formatDate(game.timestamp);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(game);
      return acc;
    },
    {} as Record<string, typeof filteredGames>
  );

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const toggleGameType = (gameType: GameType) => {
    setFilters((prev) => ({
      ...prev,
      gameTypes: prev.gameTypes.includes(gameType)
        ? prev.gameTypes.filter((t) => t !== gameType)
        : [...prev.gameTypes, gameType],
    }));
  };

  const clearFilters = () => {
    setFilters({
      gameTypes: [],
      opponentName: '',
      dateRange: {
        startDate: null,
        endDate: null,
      },
    });
  };

  const handleExportCSV = () => {
    const dataToExport = filteredGames.map(game => ({
      Date: formatDate(game.timestamp),
      Game: getGameTypeName(game.gameType),
      Result: game.result.toUpperCase(),
      User: game.user,
      Opponents: game.opponents.join(', '),
      Mode: game.isMultiplayer ? 'Multiplayer' : 'Single'
    }));
    
    exportToCSV(dataToExport, 'Game_History_Export');
  };

  const handleExportPDF = () => {
    const headers = [['Date', 'Game', 'Result', 'User', 'Opponents']];
    const body = filteredGames.map(game => [
      formatDate(game.timestamp),
      getGameTypeName(game.gameType),
      game.result.toUpperCase(),
      game.user,
      game.opponents.join(', ')
    ]);

    exportToPDF('My Game History', headers, body, 'Game_History_Report');
  };
  
  return (
    <div className="full-history-page">
      {/* Back Button */}
      <button
        className="back-button"
        onClick={() => setView('dashboard')}
        aria-label="Back to dashboard"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <div className="history-container">
        <h1>Game History</h1>

        {/* Export Buttons */}
        <div className="export-controls" style={{ marginBottom: '20px' }}>
          <button onClick={handleExportCSV} className="export-btn">Export CSV</button>
          <button onClick={handleExportPDF} className="export-btn">Export PDF</button>
        </div>
        
        <div className="history-layout">
          {/* Filter Panel */}
          <aside className="filter-panel">
            <div className="filter-section">
              <div className="filter-header">
                <h3>Filters</h3>
                {(filters.gameTypes.length > 0 ||
                  filters.opponentName.trim() ||
                  filters.dateRange.startDate ||
                  filters.dateRange.endDate) && (
                  <button className="clear-filters-btn" onClick={clearFilters} title="Clear all filters">
                    ✕
                  </button>
                )}
              </div>

              {/* Game Type Filter */}
              <div className="filter-group">
                <label className="filter-label">Game Type</label>
                <div className="filter-scrollable-list">
                  {GAME_TYPES.map((gameType) => (
                    <label key={gameType.value} className="filter-checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.gameTypes.includes(gameType.value)}
                        onChange={() => toggleGameType(gameType.value)}
                      />
                      <span>{gameType.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="filter-group">
                <label className="filter-label">Date Range</label>
                <div className="filter-date-inputs">
                  <div className="filter-date-item">
                    <label htmlFor="start-date" className="filter-date-label">
                      From:
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={filters.dateRange.startDate || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, startDate: e.target.value || null },
                        }))
                      }
                      className="filter-date-input"
                    />
                  </div>
                  <div className="filter-date-item">
                    <label htmlFor="end-date" className="filter-date-label">
                      To:
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={filters.dateRange.endDate || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, endDate: e.target.value || null },
                        }))
                      }
                      className="filter-date-input"
                    />
                  </div>
                </div>
              </div>

              {/* Opponent Name Filter */}
              <div className="filter-group">
                <label className="filter-label" htmlFor="opponent-input">
                  Opponent Name
                </label>
                <input
                  id="opponent-input"
                  type="text"
                  placeholder="Search opponent..."
                  value={filters.opponentName}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      opponentName: e.target.value,
                    }))
                  }
                  className="filter-opponent-input"
                />
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="history-content">
            {filteredGames.length === 0 ? (
              <div className="empty-history">
                <p>{gameHistory.length === 0 ? 'No games recorded yet' : 'No games match your filters'}</p>
                {gameHistory.length > 0 && (
                  <button className="reset-filters-link" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="history-timeline">
                <div className="results-summary">
                  Showing {filteredGames.length} of {gameHistory.length} games
                </div>
                {sortedDates.map((date) => (
                  <div key={date} className="history-date-group">
                    <h3 className="date-header">{date}</h3>
                    <div className="games-list">
                      {groupedByDate[date].map((game) => (
                        <div key={game.id} className="game-history-item full-history-item">
                          <div className="game-history-top">
                            <div className="game-type-container">
                              <span className="game-type">{getGameTypeName(game.gameType)}</span>
                              {game.isMultiplayer && <span className="multiplayer-badge">Multiplayer</span>}
                            </div>
                            <span
                              className="result-badge"
                              style={{ backgroundColor: getResultColor(game.result) }}
                            >
                              {game.result.toUpperCase()}
                            </span>
                          </div>
                          <div className="game-history-bottom">
                            <div className="player-info">
                              <span className="label">You</span>
                              <span className="name">{game.user}</span>
                            </div>
                            <span className="vs-text">vs</span>
                            <div className="player-info">
                              <span className="label">{game.isMultiplayer ? 'Players' : 'Opponent'}</span>
                              <span className="name opponents-text">{getOpponentText(game.opponents)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

