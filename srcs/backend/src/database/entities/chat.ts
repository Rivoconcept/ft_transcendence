import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ChatMember } from "./chat-member.js";
import { Message } from "./message.js";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  channel_id!: string;

  @OneToMany(() => ChatMember, (chatMember) => chatMember.chat)
  members!: ChatMember[];

  @OneToMany(() => Message, (message) => message.chat)
  messages!: Message[];
}
