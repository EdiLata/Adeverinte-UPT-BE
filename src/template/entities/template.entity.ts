import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import {Field} from './field.entity';

export enum Specialization {
  CTI_RO = 'CTI Romana',
  CTI_ENG = 'CTI Engleza',
  INFO = 'INFO',
  IS = 'IS',
  ETC_RO = 'ETC Romana',
  ETC_ENG = 'ETC Engleza',
}

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  filePath: string;

  @OneToMany(() => Field, (field) => field.template)
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

  @Column('enum', {enum: Specialization, array: true, nullable: true})
  specializations: Specialization[];
}
