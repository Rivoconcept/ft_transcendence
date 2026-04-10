import { useAtom } from 'jotai';
import { playtimeAtom, onlineTimeRefreshTriggerAtom } from '../providers/timeAtom';
import { usePollingAtom } from '../utils/poll';
import '../Dashboard.scss';

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function PlaytimeCard() {
  const [playtime] = useAtom(playtimeAtom);

  usePollingAtom(onlineTimeRefreshTriggerAtom, 60000);
  return (
    <div className="dashboard-card">
      <h3>Playtime</h3>
      <div className="kpi-value">{formatMinutes(playtime)}</div>
    </div>
  );
}
