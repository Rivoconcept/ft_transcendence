import { useAtom } from 'jotai';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { onlineTimeAtom } from '../providers/timeAtom';
import '../Dashboard.scss';

// Optional: nicer month formatting
function formatMonth(month: string) {
  const [year, mon] = month.split('-');
  return `${mon}/${year.slice(2)}`; // MM/YY
}

interface MonthlyOnlineTime {
  month: string;
  minutes: number;
}

export default function OnlineTimeCard() {
  const [onlineTime] = useAtom(onlineTimeAtom);

  // Aggregate daily data into months
  const monthlyData: MonthlyOnlineTime[] = Object.values(
    onlineTime.reduce<Record<string, MonthlyOnlineTime>>((acc, entry) => {
      const month = entry.date.slice(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = { month, minutes: 0 };
      acc[month].minutes += entry.minutes;
      return acc;
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="dashboard-card">
      <h3>Online Time (Last 4 Months)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            style={{ fontSize: '0.8rem' }}
          />
          <YAxis
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', offset: 0 }}
            style={{ fontSize: '0.8rem' }}
          />
          <Tooltip
            formatter={(value: any) => value ? `${value} min` : 'N/A'}
            labelFormatter={(label) => `Month: ${formatMonth(label)}`}
          />
          <Bar dataKey="minutes" fill="#4c9aff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}