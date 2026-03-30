import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { User } from './user.js';

/**
 * Tracks daily online time per user.
 * One row per user per day.
 */
@Entity()
export class UserOnlineTime {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ type: 'date' }) // YYYY-MM-DD
  date!: string;

  @Column({ type: 'int', default: 0 }) // minutes
  minutes!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
