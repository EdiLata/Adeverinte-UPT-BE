import {ApiProperty} from '@nestjs/swagger';
import {IsEnum} from 'class-validator';
import {ResponseStatus} from '../entities/student-response.entity';

export class ChangeStatusDto {
  @ApiProperty({
    example: ResponseStatus.SENT,
    description: 'Status that defines the response',
    enum: ResponseStatus,
  })
  @IsEnum(ResponseStatus, {
    message:
      'Status must be one of the defined statuses: Trimis, Respins, Aprobat',
  })
  status: ResponseStatus;
}
