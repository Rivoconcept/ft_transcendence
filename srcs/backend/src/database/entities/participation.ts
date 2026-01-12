import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Match } from "./match.js";

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
  match_id!: string;

  @ManyToOne("Match", "participations")
  @JoinColumn({ name: "match_id" })
  match!: Relation<Match>;

  @Column({ type: "int", default: 0 })
  score!: number;
}
