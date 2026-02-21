import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, type Relation } from "typeorm";
import type { User } from "./user.js";

@Entity()
export class CardGame {
  @PrimaryGeneratedColumn()
  id!: number;

  // Mode: 'SINGLE' or 'MULTI'
  @Column({ type: "varchar", length: 16, default: "SINGLE" })
  mode!: string;

  // Total score for the card game (frontend `finalScore`)
  @Column({ type: "int", default: 0 })
  final_score!: number;

  // Whether the player (or author) won
  @Column({ default: false })
  is_win!: boolean;

  // Optional match id if this was part of a multiplayer match
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
