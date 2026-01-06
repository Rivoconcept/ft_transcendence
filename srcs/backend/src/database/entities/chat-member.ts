import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.js";
import { Chat } from "./chat.js";

@Entity()
export class ChatMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, (user) => user.chat_memberships)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  chat_id!: number;

  @ManyToOne(() => Chat, (chat) => chat.members)
  @JoinColumn({ name: "chat_id" })
  chat!: Chat;
}
