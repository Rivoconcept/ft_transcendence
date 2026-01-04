import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ unique: true })
  username!: string;
  @Column()
  realname!: string;
  @Column()
  avatar!: string;
  @Column()
  password!: string;
  
}