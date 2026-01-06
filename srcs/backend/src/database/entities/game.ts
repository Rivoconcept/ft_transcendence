import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, BeforeInsert, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./user.js";
import { Participation } from "./participation.js";

@Entity()
export class Game {
  @PrimaryColumn({ type: "char", length: 4 })
  id!: string;

  @Column({ type: "int", default: 0 })
  set!: number;

  @Column()
  author_id!: number;

  @ManyToOne(() => User, (user) => user.created_games)
  @JoinColumn({ name: "author_id" })
  author!: User;

  @Column({ default: true })
  is_open!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Participation, (participation) => participation.game)
  participations!: Participation[];

  @BeforeInsert()
  generateId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.id = result;
  }
}
