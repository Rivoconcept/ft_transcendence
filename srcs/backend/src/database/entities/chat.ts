import { Entity, PrimaryGeneratedColumn, Column, OneToMany, type Relation } from "typeorm";
import type { ChatMember } from "./chat-member.js";
import type { Message } from "./message.js";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  channel_id!: string;

  @OneToMany("ChatMember", "chat")
  members!: Relation<ChatMember>[];

  @OneToMany("Message", "chat")
  messages!: Relation<Message>[];
}
