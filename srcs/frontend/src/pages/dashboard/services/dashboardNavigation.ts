import { atomWithReset } from 'jotai/utils';

export type DashboardView = 'dashboard' | 'fullHistory';

export const dashboardViewAtom = atomWithReset<DashboardView>('dashboard');
