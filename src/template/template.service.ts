import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Template} from './entities/template.entity';
import {Field} from './entities/field.entity';
import {
  ResponseStatus,
  StudentResponse,
} from './entities/student-response.entity';
import {CreateTemplateDto} from './dto/create-template.dto';
import {CreateResponseDto} from './dto/create-response.dto';
import PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';
import {User} from '../user/entities/user.entity';
import {ChangeStatusDto} from './dto/change-status.dto';
import * as mammoth from 'mammoth';
import {Specialization} from '../shared/spec.enum';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(Field)
    private fieldRepository: Repository<Field>,
    @InjectRepository(StudentResponse)
    private responseRepository: Repository<StudentResponse>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    template.specializations = createTemplateDto.specializations;
    template.filePath = file.path;
    template.createDate = new Date();

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

  async updateTemplate(
    id: number,
    updateData: Partial<Template>,
    file?: Express.Multer.File,
  ): Promise<Template> {
    const template = await this.templateRepository.findOne({where: {id: id}});
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    if (file) {
      template.filePath = file.path;
    }

    if (updateData.name) {
      template.name = updateData.name;
    }

    if (updateData.specializations) {
      template.specializations = updateData.specializations;
    }

    if (updateData.fields) {
      await this.fieldRepository.delete({template: {id}});
      for (const fieldName of updateData.fields) {
        const field = new Field();
        field.fieldName = fieldName as any;
        field.template = template;
        await this.fieldRepository.save(field);
      }
    }

    template.updateDate = new Date();
    return this.templateRepository.save(template);
  }

  async deleteTemplate(id: number): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: {id},
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    await this.fieldRepository.delete({template: {id}});

    await this.responseRepository.delete({template: {id}});

    const result = await this.templateRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
  }

  async fillTemplate(data: CreateResponseDto): Promise<string> {
    const template = await this.templateRepository.findOne({
      where: {id: data.templateId},
    });
    if (!template) {
      throw new Error('Template not found');
    }

    const student = await this.userRepository.findOne({
      where: {id: data.studentId},
    });
    if (!student) {
      throw new Error('Student not found');
    }

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
    response.student = student;
    response.responses = data.responses;
    response.filePath = outputPath;
    response.status = ResponseStatus.SENT;
    response.responseDate = new Date();
    await this.responseRepository.save(response);

    return outputPath;
  }

  async findTemplates(specializations?: Specialization[]): Promise<Template[]> {
    if (specializations && specializations.length > 0) {
      return this.templateRepository
        .createQueryBuilder('template')
        .where(
          'template.specializations && ARRAY[:...specializations]::template_specializations_enum[]',
          {specializations},
        )
        .getMany();
    } else {
      return this.templateRepository.find();
    }
  }

  async findResponsesByStudentId(
    studentId: number,
  ): Promise<StudentResponse[]> {
    return await this.responseRepository
      .createQueryBuilder('studentResponse')
      .leftJoinAndSelect('studentResponse.template', 'template')
      .leftJoinAndSelect('studentResponse.student', 'student')
      .where('student.id = :studentId', {studentId})
      .getMany();
  }

  async findFieldsByTemplateId(templateId: number): Promise<Field[]> {
    return this.fieldRepository.find({
      where: {template: {id: templateId}},
    });
  }

  async findAllResponsesWithUserDetails(
    status?: ResponseStatus,
  ): Promise<any[]> {
    let query = this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.template', 'template')
      .leftJoinAndSelect('response.student', 'user');

    if (status) {
      query = query.where('response.status = :status', {status});
    }

    return await query.getMany();
  }

  async updateResponseStatus(
    responseId: number,
    newStatus: ChangeStatusDto,
  ): Promise<StudentResponse> {
    const response = await this.responseRepository.findOne({
      where: {id: responseId},
    });
    if (!response) {
      throw new NotFoundException(
        `Student response with ID ${responseId} not found`,
      );
    }

    response.status = newStatus.status;
    return this.responseRepository.save(response);
  }

  async convertDocToHtml(filename: string): Promise<string> {
    const filePath = path.join(__dirname, '..', '..', 'uploads', `${filename}`);
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.convertToHtml({buffer: buffer});
    return result.value;
  }
}
