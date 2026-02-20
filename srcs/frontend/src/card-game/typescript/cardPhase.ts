export const Phase = {
	BEGIN: "BEGIN",
	SHUFFLE: "SHUFFLE",
	PLAY: "PLAY",
} as const;

export type Phase = typeof Phase[keyof typeof Phase];
