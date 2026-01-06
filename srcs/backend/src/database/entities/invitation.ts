import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./user.js";

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

@Entity()
export class Invitation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  sender_id!: number;

  @ManyToOne(() => User, (user) => user.sent_invitations)
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  @Column()
  receiver_id!: number;

  @ManyToOne(() => User, (user) => user.received_invitations)
  @JoinColumn({ name: "receiver_id" })
  receiver!: User;

  @Column({
    type: "enum",
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @CreateDateColumn()
  created_at!: Date;
}
