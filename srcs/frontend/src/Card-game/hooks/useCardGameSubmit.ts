import { useAtom } from 'jotai';
import { scoreAtom, isWinAtom, userIdAtom } from '../state/CardGameAtoms';

export const useCardGameSubmit = () => {
  const [score] = useAtom(scoreAtom);
  const [isWin] = useAtom(isWinAtom);
  const [userId] = useAtom(userIdAtom);

  const submitGameResult = async () => {
    if (!userId) {
      console.error('User ID not set');
      return;
    }

    if (score === null) {
      console.error('Score not calculated');
      return;
    }

    try {
      const response = await fetch('/api/game/card-game-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          score,
          is_win: isWin,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit game result');
      return await response.json();
    } catch (error) {
      console.error('Error submitting game result:', error);
      throw error;
    }
  };

  return { submitGameResult, score, isWin, userId };
};
