import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {Specialization} from '../../shared/spec.enum';

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

  @ApiProperty({
    example: [Specialization.CTI_RO, Specialization.CTI_ENG],
    description: 'Specializations that can use the template',
    isArray: true,
    enum: Specialization,
  })
  @IsArray()
  @IsEnum(Specialization, {each: true})
  specializations: Specialization[];
}
