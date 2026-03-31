import { useAtom } from 'jotai';
import { gameHistoryAtom } from '../providers/gameHistoryAtom';
import { dashboardViewAtom } from '../services/dashboardNavigation';
import '../Dashboard.scss';

export default function GameHistoryCard() {
  const [gameHistory] = useAtom(gameHistoryAtom);
  const [, setView] = useAtom(dashboardViewAtom);

  // Display only the first 3 entries
  const recentGames = gameHistory.slice(0, 3);

  const getGameTypeName = (gameType: string) => {
    switch (gameType) {
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
    // For multiplayer, show first 2 names and indicate if there are more
    if (opponents.length === 2) {
      return opponents.join(', ');
    }
    return `${opponents.slice(0, 2).join(', ')} +${opponents.length - 2}`;
  };

  return (
    <div className="dashboard-card">
      <h3>Game History</h3>

      {/* Game history list */}
      <div className="game-history-list">
        {recentGames.map((game) => (
          <div key={game.id} className="game-history-item">
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

      {/* View full history link */}
      <div className="history-footer">
        <a
          href="#"
          className="view-history-link"
          onClick={(e) => {
            e.preventDefault();
            setView('fullHistory');
          }}
        >
          View full history
        </a>
      </div>
    </div>
  );
}
