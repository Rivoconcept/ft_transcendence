import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import OnlineTimeCard from './components/onlineTimeCard';
import PlaytimeCard from './components/PlaytimeCard';
import FriendsCard from './components/friendsCard';
import GameStatsCard from './components/gameStatsCard';
import GameHistoryCard from './components/GameHistoryCard';
import FullGameHistory from './components/FullGameHistory';
import { dashboardViewAtom } from './services/dashboardNavigation';
import './Dashboard.scss';
import { useEffect } from 'react';

export default function Dashboard() {
  const [view] = useAtom(dashboardViewAtom);
  const resetView = useResetAtom(dashboardViewAtom);
  
  useEffect(() => resetView, [resetView]);

  if (view === 'fullHistory') {
    return <FullGameHistory />;
  }

  return (
    <div className="dashboard-wrapper">
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