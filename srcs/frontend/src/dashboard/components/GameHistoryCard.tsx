import { useAtom } from 'jotai';
import { gameHistoryAtom } from '../placeholders/gameHistoryAtom';
import '../Dashboard.scss';

export default function GameHistoryCard() {
  const [gameHistory] = useAtom(gameHistoryAtom);

  // Display only the first 3 entries
  const recentGames = gameHistory.slice(0, 3);

  const getGameTypeName = (gameType: string) => {
    return gameType === 'tsabo9' ? 'Tsabo 9' : 'Number Game';
  };

  const getResultColor = (result: string) => {
    return result === 'win' ? '#4ade80' : '#f87171';
  };

  return (
    <div className="dashboard-card">
      <h3>Game History</h3>

      {/* Game history list */}
      <div className="game-history-list">
        {recentGames.map((game) => (
          <div key={game.id} className="game-history-item">
            <div className="game-history-top">
              <span className="game-type">{getGameTypeName(game.gameType)}</span>
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
                <span className="label">Opponent</span>
                <span className="name">{game.opponent}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View full history link */}
      <div className="history-footer">
        <a href="#" className="view-history-link disabled" onClick={(e) => e.preventDefault()}>
          View full history
        </a>
      </div>
    </div>
  );
}
