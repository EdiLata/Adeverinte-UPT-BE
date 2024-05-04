import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import {Template} from './template.entity';
import {User} from '../../user/entities/user.entity';

export enum ResponseStatus {
  SENT = 'Trimis',
  APPROVED = 'Aprobat',
  DECLINED = 'Respins',
}

@Entity()
export class StudentResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Template)
  template: Template;

  @ManyToOne(() => User)
  student: User;

  @Column('json')
  responses: any;

  @Column({
    nullable: true,
  })
  filePath: string;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.SENT,
  })
  status: ResponseStatus;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  responseDate: Date;
}
