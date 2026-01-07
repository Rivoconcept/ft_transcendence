import { Entity, PrimaryGeneratedColumn, Column, OneToMany, type Relation } from "typeorm";
import type { UserReaction } from "./user-reaction.js";

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @OneToMany("UserReaction", "reaction")
  user_reactions!: Relation<UserReaction>[];
}
