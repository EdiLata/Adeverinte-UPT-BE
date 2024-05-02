import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Template} from './entities/template.entity';
import {Field} from './entities/field.entity';
import {StudentResponse} from './entities/student-response.entity';
import {CreateTemplateDto} from './dto/create-template.dto';
import {CreateResponseDto} from './dto/create-response.dto';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(Field)
    private fieldRepository: Repository<Field>,
    @InjectRepository(StudentResponse)
    private responseRepository: Repository<StudentResponse>,
  ) {}

  async createTemplate(
    file: Express.Multer.File,
    createTemplateDto: CreateTemplateDto,
  ): Promise<Template> {
    const fields = Array.isArray(createTemplateDto.fields)
      ? createTemplateDto.fields
      : [];
    if (fields.length === 0) {
      throw new Error('Fields array is empty or not provided correctly.');
    }

    const template = new Template();
    template.name = createTemplateDto.name;
    template.filePath = file.path;

    await this.templateRepository.save(template);

    const fieldEntities = fields.map((fieldName) => {
      const field = new Field();
      field.fieldName = fieldName;
      field.template = template;
      return field;
    });

    await this.fieldRepository.save(fieldEntities);

    return template;
  }

  async getTemplateById(id: number): Promise<Template> {
    return this.templateRepository.findOne({
      where: {id: id},
      relations: {fields: true},
    });
  }

  async fillTemplate(
    templateId: number,
    data: CreateResponseDto,
  ): Promise<string> {
    const template = await this.templateRepository.findOne({
      where: {id: templateId},
    });
    if (!template) {
      throw new Error('Template not found');
    }

    // Load the docx file as binary content
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../', template.filePath),
      'binary',
    );
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {paragraphLoop: true, linebreaks: true});

    try {
      doc.render(data.responses);
    } catch (error) {
      console.error('Error rendering document:', error);
      throw error;
    }

    const buf = doc.getZip().generate({type: 'nodebuffer'});

    const outputPath = path.resolve(
      __dirname,
      '../../uploads',
      `filled-${Date.now()}.docx`,
    );
    fs.writeFileSync(outputPath, buf);

    const response = new StudentResponse();
    response.template = template;
    response.studentId = data.studentId;
    response.responses = data.responses;
    response.filePath = outputPath;
    await this.responseRepository.save(response);

    return outputPath;
  }
}
