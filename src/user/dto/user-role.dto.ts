import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum} from 'class-validator';

export enum UserRole {
  ADMIN = 'Admin',
  SECRETARA = 'Secretara',
  STUDENT = 'Student',
}

export class UserRoleDTO {
  @ApiProperty({
    example: 'eduard.lata@student.upt.ro',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Student',
    enum: UserRole,
    required: true,
    description: 'The role must be one of the defined user roles',
  })
  @IsEnum(UserRole, {
    message:
      'Role must be one of the defined user roles: Admin, Secretara, or Student',
  })
  role: UserRole;
}