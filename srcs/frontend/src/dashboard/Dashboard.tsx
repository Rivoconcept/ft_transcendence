import OnlineTimeCard from './components/onlineTimeCard';
import PlaytimeCard from './components/PlaytimeCard';
import FriendsCard from './components/friendsCard';
import GameStatsCard from './components/gameStatsCard';
import GameHistoryCard from './components/GameHistoryCard';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="grid-item online-time">
          <OnlineTimeCard />
        </div>
        <div className="grid-item playtime">
          <PlaytimeCard />
        </div>
        <div className="grid-item friends">
          <FriendsCard />
        </div>
        <div className="grid-item game-stats">
          <GameStatsCard />
        </div>
        <div className="grid-item game-history">
          <GameHistoryCard />
        </div>
      </div>
    </div>
  )
}