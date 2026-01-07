import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Game } from "./game.js";

@Entity()
export class Participation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne("User", "participations")
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column({ type: "char", length: 4 })
  game_id!: string;

  @ManyToOne("Game", "participations")
  @JoinColumn({ name: "game_id" })
  game!: Relation<Game>;

  @Column({ type: "int", default: 0 })
  score!: number;
}
