import {IsString} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class QueryApprovedStudentsResponsesDto {
  @ApiProperty({type: String, description: 'Start date'})
  @IsString()
  start: string;

  @ApiProperty({type: String, description: 'End date'})
  @IsString()
  end: string;
}
