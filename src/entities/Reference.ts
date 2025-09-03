import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Reference {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.referrals)
  referrer!: User;

  @ManyToOne(() => User, (user) => user.referredBy)
  referred!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
