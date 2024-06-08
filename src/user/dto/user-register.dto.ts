import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsNumber, IsOptional, IsString} from 'class-validator';
import {Faculty} from '../../shared/faculty.enum';
import {Specialization} from '../../shared/spec.enum';

export class UserRegisterDto {
  @ApiProperty({
    example: 'eduard.lata@student.upt.ro',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Test!1234',
    required: true,
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'AC',
    enum: Faculty,
    required: false,
    description: 'The faculty must be one of the defined faculties',
  })
  @IsEnum(Faculty, {
    message: 'Faculty must be one of the defined faculties: AC or ETCTI',
  })
  @IsOptional()
  faculty: Faculty | null;

  @ApiProperty({
    example: 'IS',
    enum: Specialization,
    required: false,
    description:
      'The specialization must be one of the defined specializations',
  })
  @IsEnum(Specialization, {
    message: 'Specialization must be one of the defined specializations.',
  })
  @IsOptional()
  specialization: Specialization | null;

  @ApiProperty({
    example: '3',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  year: number | null;
}
