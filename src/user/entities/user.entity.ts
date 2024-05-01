import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {UserRole} from '../dto/user-role.dto';

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
    enum: UserRole,
    array: true,
    default: [],
    nullable: true,
  })
  roles: UserRole[];
}
