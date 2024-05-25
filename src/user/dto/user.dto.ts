import {IsEmail, IsString} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class UserDto {
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
}
