import { useAtom } from 'jotai';
import { playtimeSecondsAtom } from '../providers/timeAtom';
import '../Dashboard.scss';

function formatPlaytime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function PlaytimeCard() {
  const [playtimeSeconds] = useAtom(playtimeSecondsAtom);

  return (
    <div className="dashboard-card">
      <h3>Playtime</h3>
      <div className="kpi-value">{formatPlaytime(playtimeSeconds)}</div>
    </div>
  );
}
