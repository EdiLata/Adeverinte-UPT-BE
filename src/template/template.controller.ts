import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {TemplatesService} from './template.service';
import {CreateTemplateDto} from './dto/create-template.dto';
import {CreateResponseDto} from './dto/create-response.dto';
import {ApiBody, ApiConsumes, ApiTags} from '@nestjs/swagger';
import {multerConfig} from '../multer.config';
import * as path from 'path';
import {Response} from 'express';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

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
        },
        name: {
          type: 'string',
        },
        fields: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  })
  async uploadTemplate(
    @UploadedFile() file: Express.Multer.File,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    if (typeof createTemplateDto.fields === 'string') {
      createTemplateDto.fields = (createTemplateDto.fields as string)
        .split(',')
        .map((field) => field.trim());
    }

    return this.templatesService.createTemplate(file, createTemplateDto);
  }

  @Get(':id')
  getTemplate(@Param('id') id: number) {
    return this.templatesService.getTemplateById(id);
  }

  @Post('fill')
  @ApiConsumes('application/json')
  @ApiBody({type: CreateResponseDto})
  async fillTemplate(@Body() data: CreateResponseDto) {
    const filePath = await this.templatesService.fillTemplate(
      data.templateId,
      data,
    );
    return {message: 'Template filled successfully', filePath};
  }

  @Get('download/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return res.download(path.resolve(__dirname, `../../uploads/${filename}`));
  }
}
