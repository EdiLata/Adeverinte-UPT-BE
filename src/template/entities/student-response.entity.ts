import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import {Template} from './template.entity';
import {User} from '../../user/entities/user.entity';
import {ResponseStatus} from '../../shared/response-status.enum';

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
    nullable: true,
  })
  reason: string;

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
