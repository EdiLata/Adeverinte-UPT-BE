import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {Specialization} from '../../shared/spec.enum';
import {Faculty} from '../../shared/faculty.enum';
import {UserRole} from '../../shared/user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: false, unique: true})
  email: string;

  @Column({nullable: false})
  password: string;

  @Column({
    type: 'enum',
    enum: Faculty,
    nullable: true,
  })
  faculty: Faculty;

  @Column({
    type: 'enum',
    enum: Specialization,
    nullable: true,
  })
  specialization: Specialization;

  @Column({nullable: true})
  year: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: true,
  })
  role: UserRole;
}
