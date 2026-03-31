import { atom } from 'jotai';
import type { GameType } from '../providers/gameHistoryAtom';

export interface HistoryFilters {
  gameTypes: GameType[];
  opponentName: string;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

export const defaultFilters: HistoryFilters = {
  gameTypes: [],
  opponentName: '',
  dateRange: {
    startDate: null,
    endDate: null,
  },
};

export const historyFiltersAtom = atom<HistoryFilters>(defaultFilters);
