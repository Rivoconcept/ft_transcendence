// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/database/entities/match.ts

import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Participation } from "./participation.js";
import type { Game } from "./game.js";

@Entity()
export class Match {
  @PrimaryColumn({ type: "char", length: 4 })
  id!: string;

  @Column({ type: "int", default: 1 })
  set!: number;

  @Column({ type: "int", default: 1 })
  current_set!: number;

  @Column()
  author_id!: number;

  @ManyToOne("User", "created_matches", { cascade: true })
  @JoinColumn({ name: "author_id" })
  author!: Relation<User>;

  @Column({ nullable: true })
  game_id!: number | null;

  @ManyToOne("Game", "matches", { cascade: true })
  @JoinColumn({ name: "game_id" })
  game!: Relation<Game> | null;

  @Column({ default: true })
  is_open!: boolean;

  @Column({ default: false })
  is_private!: boolean;

  @Column({ default: false })
  match_over!: boolean;

  @Column({ default: false })
  has_begun!: boolean;

  @Column({ default: false })
  is_limited!: boolean;

  @Column({ type: "int", default: 10 })
  participations_limit!: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany("Participation", "match")
  participations!: Relation<Participation>[];

  static generateId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
