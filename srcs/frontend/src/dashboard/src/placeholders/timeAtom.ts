import { atom } from 'jotai';

export interface DailyOnlineTime {
  date: string;
  minutes: number;
}

export const onlineTimeAtom = atom<DailyOnlineTime[]>([
  { date: '2025-11-22', minutes: 45 },
  { date: '2025-11-24', minutes: 120 },
  { date: '2025-11-26', minutes: 90 },
  { date: '2025-11-29', minutes: 160 },
  { date: '2025-12-02', minutes: 200 },
  { date: '2025-12-05', minutes: 75 },
  { date: '2025-12-08', minutes: 130 },
  { date: '2025-12-12', minutes: 180 },
  { date: '2025-12-16', minutes: 95 },
  { date: '2025-12-21', minutes: 220 },
  { date: '2025-12-27', minutes: 140 },
  { date: '2026-01-03', minutes: 60 },
  { date: '2026-01-07', minutes: 155 },
  { date: '2026-01-10', minutes: 190 },
  { date: '2026-01-14', minutes: 110 },
  { date: '2026-01-18', minutes: 240 },
  { date: '2026-01-23', minutes: 85 },
  { date: '2026-01-29', minutes: 170 },
  { date: '2026-02-02', minutes: 100 },
  { date: '2026-02-06', minutes: 210 },
  { date: '2026-02-10', minutes: 80 },
  { date: '2026-02-14', minutes: 160 },
  { date: '2026-02-17', minutes: 130 },
]);

export const playtimeAtom = atom<number>(1240);