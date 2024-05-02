import {IsString, IsNotEmpty, IsArray, ArrayNotEmpty} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({example: 'Annual Report', description: 'Name of the template'})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: ['Name', 'Date', 'Signature'],
    description: 'List of fields in the template',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({each: true})
  fields: string[];
}
