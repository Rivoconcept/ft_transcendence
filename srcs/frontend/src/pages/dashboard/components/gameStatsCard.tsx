import { useAtom } from 'jotai';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { gameStatsAtom, gameStatsFilterAtom} from '../placeholders/gameStatsAtom';
import '../Dashboard.scss';

export default function GameStatsCard() {
  const [stats] = useAtom(gameStatsAtom);
  const [filter, setFilter] = useAtom(gameStatsFilterAtom);

  const filteredStats =
    filter === 'overall'
      ? stats
      : stats.filter(s => s.game === filter);

  const wins = filteredStats.filter(s => s.result === 'win').length;
  const losses = filteredStats.filter(s => s.result === 'loss').length;
  const totalGames = wins + losses;
  const winRate = totalGames === 0 ? null : Math.round((wins / totalGames) * 100);

  const data = [
  { name: 'Wins', value: wins, fill: '#4ade80' },
  { name: 'Losses', value: losses, fill: '#f87171' },
];

  return (
    <div className="dashboard-card">
      <h3>Game Stats</h3>

      {/* Filters */}
      <div className="stats-filters">
        <button
          className={filter === 'overall' ? 'active' : ''}
          onClick={() => setFilter('overall')}
        >
          Overall
        </button>
        <button
          className={filter === 'diceGame' ? 'active' : ''}
          onClick={() => setFilter('diceGame')}
        >
          Dice Game
        </button>
        <button
          className={filter === 'kingOfDiamond' ? 'active' : ''}
          onClick={() => setFilter('kingOfDiamond')}
        >
          King of Diamond
        </button>
        <button
          className={filter === 'cardGame' ? 'active' : ''}
          onClick={() => setFilter('cardGame')}
        >
          Card Game
        </button>
      </div>

      {/* Pie chart */}
      <div className="stats-chart">
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                label={({ value }) => `${Math.round((value / totalGames) * 100)}%`}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                />

                {/* Center label */}
                <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="auto"
                className="winrate-label"
                >
                Win Rate
                </text>

                <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="winrate-text"
                >
                {winRate !== null ? `${winRate}%` : '—'}
                </text>

                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}