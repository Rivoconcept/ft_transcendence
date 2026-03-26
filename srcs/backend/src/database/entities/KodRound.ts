// src/database/entities/KodWinner.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

/**
 * One row per finished KoD match — records the winner only.
 * Everything else (round data, choices) lives in memory via socket.
 */
@Entity()
export class KodWinner {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "char", length: 4 })
  match_id!: string;

  @Column({ type: "int" })
  winner_user_id!: number;

  @Column({ type: "varchar", length: 255 })
  winner_name!: string;

  @Column({ type: "int" })
  remaining_points!: number;

  @Column({ type: "int" })
  total_rounds!: number;

  @CreateDateColumn()
  created_at!: Date;
}

@Entity()
export class KodRound {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "char", length: 4 })
  match_id!: string;

  @Column({ type: "int" })
  round_number!: number;

  @Column({ type: "float" })
  average!: number;

  @Column({ type: "float" })
  target!: number;

  @Column({ type: "int" })
  target_rounded!: number;

  @Column({ type: "int" })
  winner_user_id!: number;

  @Column({ type: "varchar", length: 255 })
  winner_name!: string;

  @Column({ type: "boolean", default: false })
  is_exact_hit!: boolean;

  // Store each player's choice + points lost as JSON
  @Column({ type: "jsonb" })
  choices!: { userId: number; playerName: string; value: number; pointsLost: number }[];

  @CreateDateColumn()
  created_at!: Date;
}