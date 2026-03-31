import { atom } from 'jotai';

export type DashboardView = 'dashboard' | 'fullHistory';

export const dashboardViewAtom = atom<DashboardView>('dashboard');
