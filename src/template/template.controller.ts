import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  Put,
  Delete,
  NotFoundException,
  Query,
  Patch,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {TemplatesService} from './template.service';
import {CreateTemplateDto} from './dto/create-template.dto';
import {CreateResponseDto} from './dto/create-response.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {multerConfig} from '../multer.config';
import * as path from 'path';
import {Response} from 'express';
import {Template} from './entities/template.entity';
import {StudentResponse} from './entities/student-response.entity';
import {ChangeStatusDto} from './dto/change-status.dto';
import {Specialization} from '../shared/spec.enum';
import {Faculty} from '../shared/faculty.enum';
import {ResponseStatus} from '../shared/response-status.enum';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('get-doc-html/:filename')
  async getDocHtml(
    @Param('filename') filename: string,
  ): Promise<{html: string}> {
    const html = await this.templatesService.convertDocToHtml(filename);
    return {html};
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        name: {
          type: 'string',
          example: 'Annual Report',
          description: 'Name of the template',
        },
        fields: {
          type: 'array',
          items: {type: 'string'},
          example: ['Name', 'Date', 'Signature'],
          description: 'List of fields in the template',
        },
        specializations: {
          type: 'array',
          items: {
            enum: [
              Specialization.CTI_RO,
              Specialization.CTI_ENG,
              Specialization.ETC_ENG,
              Specialization.ETC_RO,
              Specialization.IS,
              Specialization.INFO,
            ],
          },
          example: [Specialization.CTI_RO, Specialization.CTI_ENG],
          description: 'Specializations that can use the template',
        },
      },
    },
  })
  async uploadTemplate(
    @UploadedFile('file') file: Express.Multer.File,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    if (typeof createTemplateDto.fields === 'string') {
      createTemplateDto.fields = (createTemplateDto.fields as 'string')
        .split(',')
        .map((field) => field.trim());
    }

    if (typeof createTemplateDto.specializations === 'string') {
      createTemplateDto.specializations = (
        createTemplateDto.specializations as string
      )
        .split(',')
        .map((field: string) => field.trim() as Specialization);
    }

    return this.templatesService.createTemplate(file, createTemplateDto);
  }

  @Get()
  @ApiQuery({
    name: 'specializations',
    required: false,
    description: 'Optional specializations to filter the templates',
    isArray: true,
    example: [Specialization.CTI_RO, Specialization.CTI_ENG],
    enum: [
      Specialization.CTI_RO,
      Specialization.CTI_ENG,
      Specialization.ETC_ENG,
      Specialization.ETC_RO,
      Specialization.IS,
      Specialization.INFO,
    ],
  })
  async getTemplates(
    @Query('specializations') specializations?: Specialization[],
  ): Promise<Template[]> {
    let parsedSpecializations: Specialization[];

    if (specializations) {
      parsedSpecializations = Array.isArray(specializations)
        ? specializations
        : [specializations];

      parsedSpecializations.forEach((specialization) => {
        if (!Object.values(Specialization).includes(specialization)) {
          throw new BadRequestException(
            `Invalid specialization: ${specialization}`,
          );
        }
      });
    }

    return this.templatesService.findTemplates(parsedSpecializations);
  }

  @Get(':id')
  async getTemplate(@Param('id') id: number) {
    return await this.templatesService.getTemplateById(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        name: {
          type: 'string',
          example: 'Updated Annual Report',
          description: 'Name of the template',
          nullable: true,
        },
        fields: {
          type: 'array',
          items: {type: 'string'},
          example: ['Name', 'Date', 'Signature'],
          description: 'List of fields in the template',
          nullable: true,
        },
        specializations: {
          type: 'array',
          items: {
            enum: [
              Specialization.CTI_RO,
              Specialization.CTI_ENG,
              Specialization.ETC_ENG,
              Specialization.ETC_RO,
              Specialization.IS,
              Specialization.INFO,
            ],
          },
          example: [Specialization.CTI_RO, Specialization.CTI_ENG],
          description: 'Specializations that can use the template',
          nullable: true,
        },
      },
    },
    description: 'Payload to update a template',
  })
  async updateTemplate(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateData: Partial<Template>,
  ) {
    if (updateData.fields && typeof updateData.fields === 'string') {
      updateData.fields = (updateData.fields as string)
        .split(',')
        .map((field) => field.trim() as any);
    }

    if (
      updateData.specializations &&
      typeof updateData.specializations === 'string'
    ) {
      updateData.specializations = (updateData.specializations as string)
        .split(',')
        .map((field: string) => field.trim() as Specialization);
    }

    return await this.templatesService.updateTemplate(id, updateData, file);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: number) {
    await this.templatesService.deleteTemplate(id);
  }

  @Get('fields/:templateId')
  async getFieldsByTemplateId(@Param('templateId') templateId: number) {
    return this.templatesService.findFieldsByTemplateId(templateId);
  }

  @Get('download/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return res.download(path.resolve(__dirname, `../../uploads/${filename}`));
  }

  @Post('fill')
  @ApiConsumes('application/json')
  @ApiBody({type: CreateResponseDto})
  async fillTemplate(@Body() data: CreateResponseDto) {
    return await this.templatesService.fillTemplate(data);
  }

  @Get('student-responses/:id')
  async getStudentResponse(@Param('id') id: number) {
    return await this.templatesService.getStudentResponseById(id);
  }

  @Put('student-responses/:id')
  @ApiBody({type: StudentResponse})
  async updateStudentResponse(
    @Param('id') id: number,
    @Body() updateData: Partial<StudentResponse>,
  ) {
    return await this.templatesService.updateStudentResponse(id, updateData);
  }

  @Delete('student-responses/:id')
  async deleteStudentResponse(@Param('id') id: number) {
    await this.templatesService.deleteStudentResponse(id);
  }

  @Get('student-responses/by-student-id/:studentId')
  async getResponsesByStudentId(
    @Param('studentId') studentId: number,
  ): Promise<StudentResponse[]> {
    const responses =
      await this.templatesService.findResponsesByStudentId(studentId);
    if (!responses || responses.length === 0) {
      throw new NotFoundException(
        `No responses found for student ID ${studentId}`,
      );
    }
    return responses;
  }

  @Get('student-responses/with-user-details/all')
  @ApiQuery({
    name: 'status',
    enum: ResponseStatus,
    required: false,
    description: 'Optional status to filter the responses',
  })
  @ApiQuery({
    name: 'faculties',
    example: [Faculty.AC, Faculty.ETCTI],
    enum: [Faculty.AC],
    isArray: true,
    required: false,
    description: 'Optional list of faculties to filter the responses',
  })
  @ApiQuery({
    name: 'specializations',
    example: [Specialization.CTI_RO, Specialization.CTI_ENG],
    enum: [
      Specialization.CTI_RO,
      Specialization.CTI_ENG,
      Specialization.ETC_ENG,
      Specialization.ETC_RO,
      Specialization.IS,
      Specialization.INFO,
    ],
    isArray: true,
    required: false,
    description: 'Optional list of specializations to filter the templates',
  })
  @ApiQuery({
    name: 'years',
    type: Number,
    isArray: true,
    required: false,
    description: 'Optional list of years to filter the responses',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Optional page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Optional limit of items per page for pagination',
  })
  async getAllResponsesWithUserDetails(
    @Query('status') status?: ResponseStatus,
    @Query('faculties') faculties?: Faculty[],
    @Query('specializations') specializations?: Specialization[],
    @Query('years') years?: number[],
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    let parsedSpecializations: Specialization[];

    if (specializations) {
      parsedSpecializations = Array.isArray(specializations)
        ? specializations
        : [specializations];

      parsedSpecializations.forEach((specialization) => {
        if (!Object.values(Specialization).includes(specialization)) {
          throw new BadRequestException(
            `Invalid specialization: ${specialization}`,
          );
        }
      });
    }

    let parsedFaculties: Faculty[];

    if (faculties) {
      parsedFaculties = Array.isArray(faculties) ? faculties : [faculties];

      parsedFaculties.forEach((faculty) => {
        if (!Object.values(Faculty).includes(faculty)) {
          throw new BadRequestException(`Invalid faculty: ${faculty}`);
        }
      });
    }

    let parsedYears: number[];

    if (years) {
      parsedYears = Array.isArray(years) ? years : [years];
    }

    return await this.templatesService.findAllResponsesWithUserDetails({
      status,
      faculties: parsedFaculties,
      specializations: parsedSpecializations,
      years: parsedYears,
      page,
      limit,
    });
  }

  @Patch(':responseId/status')
  @ApiParam({
    name: 'responseId',
    type: 'number',
    description: 'ID of the student response',
  })
  @ApiBody({type: ChangeStatusDto})
  async updateResponseStatus(
    @Param('responseId', ParseIntPipe) responseId: number,
    @Body() newStatus: ChangeStatusDto,
  ): Promise<ResponseStatus> {
    const updatedResponse = await this.templatesService.updateResponseStatus(
      responseId,
      newStatus,
    );
    return updatedResponse.status;
  }
}
