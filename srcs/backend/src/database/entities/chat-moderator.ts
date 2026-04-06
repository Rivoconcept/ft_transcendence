import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Chat } from "./chat.js";

@Entity()
@Unique(["user_id", "chat_id"])
export class ChatModerator {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne("User")
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column()
  chat_id!: number;

  @ManyToOne("Chat", "moderators")
  @JoinColumn({ name: "chat_id" })
  chat!: Relation<Chat>;
}
