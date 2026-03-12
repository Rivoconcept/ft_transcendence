
// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/database/entities/game.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, type Relation } from "typeorm";
import type { Match } from "./match.js";

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany("Match", "game")
  matches!: Relation<Match>[];
}
