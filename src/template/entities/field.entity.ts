import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import {Template} from './template.entity';

@Entity()
export class Field {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fieldName: string;

  @ManyToOne(() => Template, (template) => template.fields)
  template: Template;
}
