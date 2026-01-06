import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { UserReaction } from "./user-reaction.js";

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @OneToMany(() => UserReaction, (userReaction) => userReaction.reaction)
  user_reactions!: UserReaction[];
}
