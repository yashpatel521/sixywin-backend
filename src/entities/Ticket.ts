import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";
import { TicketDraw } from "./TicketDraw";

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.id)
  user!: User;

  @Column("int", { array: true })
  numbers!: number[];

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar", default: "pending" })
  result!: "win" | "loss" | "pending" | "megaPot";

  @Column("int", { array: true, nullable: true })
  matchedNumbers?: number[];

  @Column({ type: "int", default: 0 })
  coinsWon!: number;

  @Column({ type: "int", default: 1 })
  bid!: number;

  @Column({ type: "timestamp", nullable: true })
  drawDate?: Date;

  @ManyToOne(() => TicketDraw, (drawResult) => drawResult.id, {
    nullable: true,
  })
  drawResult?: TicketDraw;
}
