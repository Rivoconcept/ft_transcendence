import { useAtom } from 'jotai';
import { playtimeAtom } from '../providers/timeAtom';
import '../Dashboard.scss';

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function PlaytimeCard() {
  const [playtime] = useAtom(playtimeAtom);

  return (
    <div className="dashboard-card">
      <h3>Playtime</h3>
      <div className="kpi-value">{formatMinutes(playtime)}</div>
    </div>
  );
}