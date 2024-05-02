import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import {Template} from './template.entity';

@Entity()
export class StudentResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Template)
  template: Template;

  @Column()
  studentId: number;

  @Column('json')
  responses: any;

  @Column({
    nullable: true,
  })
  filePath: string;
}
