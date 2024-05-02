import {IsNumber, IsObject, ValidateNested, IsNotEmpty} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';

export class CreateResponseDto {
  @ApiProperty({
    description: 'ID of the template being responded to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  templateId: number;

  @ApiProperty({
    description: 'Student ID who is submitting the response',
    example: 12345,
  })
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({
    description:
      'Responses to the template fields, stored as key-value pairs where the key is the field name',
    example: {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Date of Birth': '1990-01-01',
    },
    type: 'object',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  responses: Record<string, any>;
}
