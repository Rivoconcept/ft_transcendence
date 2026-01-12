import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, type Relation } from "typeorm";
import type { User } from "./user.js";

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

  @ManyToOne("User", "sent_invitations")
  @JoinColumn({ name: "sender_id" })
  sender!: Relation<User>;

  @Column()
  receiver_id!: number;

  @ManyToOne("User", "received_invitations")
  @JoinColumn({ name: "receiver_id" })
  receiver!: Relation<User>;

  @Column({
    type: "enum",
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @CreateDateColumn()
  created_at!: Date;
}
