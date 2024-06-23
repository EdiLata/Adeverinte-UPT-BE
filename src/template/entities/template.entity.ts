import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import {Field} from './field.entity';
import {Specialization} from '../../shared/spec.enum';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  filePath: string;

  @OneToMany(() => Field, (field) => field.template, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  fields: Field[];

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createDate: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateDate: Date;

  @Column('enum', {
    enum: Specialization,
    array: true,
    nullable: true,
  })
  specializations: Specialization[];
}
