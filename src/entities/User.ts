import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
  OneToOne,
} from "typeorm";
import { getRandomAvatar } from "../utils/common";
import { Ticket } from "./Ticket";
import { DoubleTrouble } from "./DoubleTrouble";
import { v4 as uuidv4 } from "uuid";
import { Reference } from "./Reference";
import { Aviator } from "./Aviator";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  username!: string;

  @Column({ nullable: true })
  avatar!: string;

  @Column({ nullable: true })
  password!: string;

  @Column({ nullable: true })
  googleId!: string;

  @Column({ nullable: true })
  referenceId!: string;

  @OneToMany(() => Reference, (reference) => reference.referrer)
  referrals!: Reference[];

  // referrer of the user can be null
  @OneToOne(() => Reference, (reference) => reference.referred, {
    nullable: true,
  })
  referredBy?: Reference;

  @Column({ default: 1000 })
  coins!: number;

  @Column({ default: 0 })
  totalWon!: number;

  @Column({ default: 0 })
  winningAmount!: number;

  @Column({ default: 0 })
  adsEarnings!: number;

  @Column({ default: 0 })
  todaysBids!: number;

  @Column({ default: false })
  isBot!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: false })
  isSpinned!: boolean;

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets!: Ticket[];

  // All DoubleTrouble bets placed by this user
  @OneToMany(() => DoubleTrouble, (bet) => bet.user)
  doubleTroubleBets!: DoubleTrouble[];

  // All Aviator bids placed by this user
  @OneToMany(() => Aviator, (bid) => bid.user)
  aviatorBids!: Aviator[];

  // set random avatar before inserting
  @BeforeInsert()
  setRandomAvatar() {
    if (!this.avatar) {
      this.avatar = getRandomAvatar(this.username || "User");
    }
  }

  @BeforeInsert()
  setReferenceId() {
    if (!this.referenceId) {
      this.referenceId = uuidv4();
    }
  }
}
