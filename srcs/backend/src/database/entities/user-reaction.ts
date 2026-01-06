import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./user.js";
import { Message } from "./message.js";
import { Reaction } from "./reaction.js";

@Entity()
@Unique(["user_id", "message_id", "reaction_id"])
export class UserReaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, (user) => user.reactions)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  message_id!: number;

  @ManyToOne(() => Message, (message) => message.reactions)
  @JoinColumn({ name: "message_id" })
  message!: Message;

  @Column()
  reaction_id!: number;

  @ManyToOne(() => Reaction, (reaction) => reaction.user_reactions)
  @JoinColumn({ name: "reaction_id" })
  reaction!: Reaction;
}
