import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class TicketDraw {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("int", { array: true })
  winningNumbers!: number[];

  @Column({ type: "timestamp" })
  drawDate!: Date;

  @Column({ type: "timestamp", nullable: true })
  nextDrawDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
