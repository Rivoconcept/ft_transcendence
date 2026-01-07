import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Chat } from "./chat.js";
import type { UserReaction } from "./user-reaction.js";

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
}

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type!: MessageType;

  @Column({ type: "text" })
  content!: string;

  @Column()
  author_id!: number;

  @ManyToOne("User", "messages")
  @JoinColumn({ name: "author_id" })
  author!: Relation<User>;

  @Column()
  chat_id!: number;

  @ManyToOne("Chat", "messages")
  @JoinColumn({ name: "chat_id" })
  chat!: Relation<Chat>;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany("UserReaction", "message")
  reactions!: Relation<UserReaction>[];
}
