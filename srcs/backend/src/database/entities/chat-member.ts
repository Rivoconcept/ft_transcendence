import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Chat } from "./chat.js";

@Entity()
export class ChatMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne("User", "chat_memberships")
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column()
  chat_id!: number;

  @ManyToOne("Chat", "members")
  @JoinColumn({ name: "chat_id" })
  chat!: Relation<Chat>;
}
