const STARTING_POINTS = 10;
const MULTIPLIER = 0.8;

export interface KodPlayer {
  userId: number;
  playerName: string;
  points: number;
  isActive: boolean;
  hasSubmitted: boolean;
}

export interface KodChoice {
  userId: number;
  playerName: string;
  value: number;
}

export interface KodRoundResult {
  roundNumber: number;
  average: number;
  target: number;
  targetRounded: number;
  winnerId: number;
  winnerName: string;
  isExactHit: boolean;
  choices: (KodChoice & { isWinner: boolean; pointsLost: number })[];
  players: KodPlayer[];
  gameOver: boolean;
  gameWinnerId: number | null;
  gameWinnerName: string | null;
}

interface KodMatchState {
  matchId: string;
  roundNumber: number;
  players: Map<number, KodPlayer>;
  choices: Map<number, KodChoice>;
  isStarted: boolean;
  isOver: boolean;
}

class KodGameManager {
  private games = new Map<string, KodMatchState>();

  // Called by MatchService after it has validated the match and reset DB scores
  initGame(matchId: string, participants: { userId: number; playerName: string }[]): KodPlayer[] {
    const players = new Map<number, KodPlayer>();
    for (const { userId, playerName } of participants) {
      players.set(userId, {
        userId,
        playerName, // real name passed in directly
        points: STARTING_POINTS,
        isActive: true,
        hasSubmitted: false,
      });
    }

    this.games.set(matchId, {
      matchId,
      roundNumber: 1,
      players,
      choices: new Map(),
      isStarted: true,
      isOver: false,
    });

    return Array.from(players.values());
  }

  setPlayerName(matchId: string, userId: number, playerName: string): void {
    const player = this.games.get(matchId)?.players.get(userId);
    if (player) player.playerName = playerName;
  }

  // Returns null if not all active players submitted yet,
  // or the round result once everyone has submitted.
  // Throws on invalid input — MatchService handles surfacing the error.
  submitChoice(
    matchId: string,
    userId: number,
    playerName: string,
    value: number,
  ): { allSubmitted: boolean; result: KodRoundResult | null } {
    if (value < 0 || value > 100) throw new Error("Value must be between 0 and 100");

    const state = this.games.get(matchId);
    if (!state) throw new Error("Game not found");
    if (!state.isStarted) throw new Error("Game has not started");
    if (state.isOver) throw new Error("Game is over");

    const player = state.players.get(userId);
    if (!player) throw new Error("You are not a participant in this game");
    if (!player.isActive) throw new Error("You have been eliminated");
    if (state.choices.has(userId)) throw new Error("You have already submitted");

    player.playerName = playerName;
    state.choices.set(userId, { userId, playerName, value });
    player.hasSubmitted = true;

    const activePlayers = Array.from(state.players.values()).filter(p => p.isActive);
    const allSubmitted = activePlayers.every(p => state.choices.has(p.userId));

    if (!allSubmitted) return { allSubmitted: false, result: null };

    const result = this._resolveRound(state);
    return { allSubmitted: true, result };
  }

  private _resolveRound(state: KodMatchState): KodRoundResult {
    const activePlayers = Array.from(state.players.values()).filter(p => p.isActive);
    const choices = activePlayers.map(p => state.choices.get(p.userId)!);

    const values = choices.map(c => c.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const target = average * MULTIPLIER;
    const targetRounded = Math.round(target);

    let winnerId = choices[0]!.userId;
    let winnerName = choices[0]!.playerName;
    let minDiff = Infinity;

    for (const c of choices) {
      const diff = Math.abs(c.value - target);
      const currentWinnerVal = choices.find(x => x.userId === winnerId)!.value;
      if (diff < minDiff || (diff === minDiff && c.value < currentWinnerVal)) {
        minDiff = diff;
        winnerId = c.userId;
        winnerName = c.playerName;
      }
    }

    const winnerChoice = choices.find(c => c.userId === winnerId)!;
    const isExactHit = winnerChoice.value === targetRounded;
    const isTwoPlayerEdge =
      activePlayers.length === 2 &&
      choices.some(c => c.value === 0) &&
      choices.some(c => c.value === 100);

    const choicesWithResult = choices.map(c => {
      const isWinner = c.userId === winnerId;
      let pointsLost = 0;

      if (!isWinner) {
        if (isTwoPlayerEdge && c.value === 0) pointsLost = 2;
        else if (isExactHit) pointsLost = 2;
        else pointsLost = 1;
      }

      const player = state.players.get(c.userId)!;
      player.points = Math.max(0, player.points - pointsLost);
      player.isActive = player.points > 0;
      player.hasSubmitted = false;

      return { ...c, isWinner, pointsLost };
    });

    const stillActive = Array.from(state.players.values()).filter(p => p.isActive);
    const gameOver = stillActive.length <= 1;
    const gameWinner = gameOver ? (stillActive[0] ?? state.players.get(winnerId)!) : null;

    const finishedRoundNumber = state.roundNumber;

    if (gameOver) {
      state.isOver = true;
    } else {
      state.roundNumber += 1;
      state.choices.clear();
    }

    return {
      roundNumber: finishedRoundNumber,
      average,
      target,
      targetRounded,
      winnerId,
      winnerName,
      isExactHit,
      choices: choicesWithResult,
      players: Array.from(state.players.values()),
      gameOver,
      gameWinnerId: gameWinner?.userId ?? null,
      gameWinnerName: gameWinner?.playerName ?? null,
    };
  }

  getState(matchId: string): KodMatchState | undefined {
    return this.games.get(matchId);
  }

  getPlayers(matchId: string): KodPlayer[] {
    const state = this.games.get(matchId);
    return state ? Array.from(state.players.values()) : [];
  }

  cleanup(matchId: string): void {
    this.games.delete(matchId);
  }
}

export const kodGameManager = new KodGameManager();