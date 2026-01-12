import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, type Relation } from "typeorm";
import type { ChatMember } from "./chat-member.js";
import type { Message } from "./message.js";

export enum ChatType {
  DIRECT = "direct",
  GROUP = "group",
}

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  name!: string;

  @Column({ unique: true })
  channel_id!: string;

  @Column({
    type: "enum",
    enum: ChatType,
    default: ChatType.DIRECT,
  })
  type!: ChatType;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany("ChatMember", "chat")
  members!: Relation<ChatMember>[];

  @OneToMany("Message", "chat")
  messages!: Relation<Message>[];
}
