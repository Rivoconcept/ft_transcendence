export const Phase = {
	BEGIN: "BEGIN",
	SHUFFLE: "SHUFFLE",
	PLAY: "PLAY",
  	SHOW_RESULT:  "SHOW_RESULT",
} as const;

export type Phase = typeof Phase[keyof typeof Phase];
