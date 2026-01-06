import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.js";
import { Game } from "./game.js";

@Entity()
export class Participation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, (user) => user.participations)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "char", length: 4 })
  game_id!: string;

  @ManyToOne(() => Game, (game) => game.participations)
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @Column({ type: "int", default: 0 })
  score!: number;
}
