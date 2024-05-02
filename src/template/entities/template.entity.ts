import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import {Field} from './field.entity';

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
}
