import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Message } from "./message.js";
import type { Reaction } from "./reaction.js";

@Entity()
@Unique(["user_id", "message_id", "reaction_id"])
export class UserReaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne("User", "reactions")
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column()
  message_id!: number;

  @ManyToOne("Message", "reactions")
  @JoinColumn({ name: "message_id" })
  message!: Relation<Message>;

  @Column()
  reaction_id!: number;

  @ManyToOne("Reaction", "user_reactions")
  @JoinColumn({ name: "reaction_id" })
  reaction!: Relation<Reaction>;
}
