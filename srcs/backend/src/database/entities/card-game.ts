
// /home/hrv/Pictures/ft_transcendence/srcs/backend/src/database/entities/card-game.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, type Relation } from "typeorm";
import type { User } from "./user.js";
import { CardGameMode } from "../enum/cardGameModeEnum.js";


@Entity("card_game")
export class CardGame {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: CardGameMode, default: CardGameMode.SINGLE })
  mode!: CardGameMode;

  @Column({ type: "varchar", length: 255, nullable: true })
  player_name?: string; 

  @Column({ type: "int", default: 0 })
  final_score!: number;

  @Column({ default: false })
  is_win!: boolean;

  @Column({ type: "char", length: 4, nullable: true })
  match_id!: string | null;

  @Column()
  author_id!: number;

  @ManyToOne("User", "card_games")
  @JoinColumn({ name: "author_id" })
  author!: Relation<User>;

  @CreateDateColumn()
  created_at!: Date;
}