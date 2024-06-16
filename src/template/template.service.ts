import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Template} from './entities/template.entity';
import {Field} from './entities/field.entity';
import {StudentResponse} from './entities/student-response.entity';
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
import {Faculty} from '../shared/faculty.enum';
import {ResponseStatus} from '../shared/response-status.enum';
import {QueryApprovedStudentsResponsesDto} from './dto/query-approved-students-responses.dto';

interface FilterOptions {
  status?: ResponseStatus;
  faculties?: Faculty[];
  specializations?: Specialization[];
  years?: number[];
  page?: number;
  limit?: number;
}

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
    const template = await this.templateRepository.findOne({
      where: {id: id},
      relations: {fields: true},
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async getStudentResponseById(id: number): Promise<StudentResponse> {
    const studentResponse = await this.responseRepository.findOne({
      where: {id: id},
    });

    if (!studentResponse) {
      throw new NotFoundException(`Student response with ID ${id} not found`);
    }

    return studentResponse;
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

  async updateStudentResponse(
    id: number,
    updateData: Partial<StudentResponse>,
  ) {
    const studentResponse = await this.responseRepository.findOne({
      where: {id: id},
      relations: ['template', 'student'],
    });
    if (!studentResponse) {
      throw new NotFoundException(`Student response with ID ${id} not found`);
    }

    const content = fs.readFileSync(
      path.resolve(__dirname, '../../', studentResponse.template.filePath),
      'binary',
    );
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {paragraphLoop: true, linebreaks: true});

    try {
      if (updateData.responses) {
        doc.render(updateData.responses);
      }
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

    if (updateData.responses) {
      studentResponse.responses = updateData.responses;
      if (studentResponse.responses.motiv) {
        studentResponse.reason = studentResponse.responses.motiv;
      }
    }

    if (updateData.reason) {
      studentResponse.reason = updateData.reason;
    }

    studentResponse.filePath = outputPath;

    studentResponse.status = ResponseStatus.SENT;

    return this.responseRepository.save(studentResponse);
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

  async deleteStudentResponse(id: number): Promise<void> {
    const result = await this.responseRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Student response with ID ${id} not found`);
    }
  }

  async fillTemplate(data: CreateResponseDto) {
    const template = await this.templateRepository.findOne({
      where: {id: data.templateId},
    });
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${data.templateId} not found`,
      );
    }

    const student = await this.userRepository.findOne({
      where: {id: data.studentId},
    });
    if (!student) {
      throw new NotFoundException(
        `Student with ID ${data.studentId} not found`,
      );
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
    if (response.responses.motiv) {
      response.responses.motiv = data.reason;
    }
    response.filePath = outputPath;
    response.status = ResponseStatus.SENT;
    response.reason = data.reason;
    response.responseDate = new Date();
    await this.responseRepository.save(response);

    return response;
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
    const template = await this.templateRepository.findOne({
      where: {id: templateId},
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    return this.fieldRepository.find({
      where: {template: {id: templateId}},
    });
  }

  async findAllApprovedResponsesWithinRangeWithUserDetails(
    queryDto: QueryApprovedStudentsResponsesDto,
  ): Promise<any[]> {
    const {start, end} = queryDto;

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const isoStartDate = toLocalISOString(startDate);
    const isoEndDate = toLocalISOString(endDate);

    const query = this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.template', 'template')
      .leftJoinAndSelect('response.student', 'student')
      .where('response.status = :status', {status: ResponseStatus.APPROVED})
      .andWhere('response.responseDate BETWEEN :startDate AND :endDate', {
        startDate: isoStartDate,
        endDate: isoEndDate,
      });

    return await query.getMany();
  }

  async findAllResponsesWithUserDetails({
    status,
    faculties,
    specializations,
    years,
    page,
    limit,
  }: FilterOptions) {
    let query = this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.template', 'template')
      .leftJoinAndSelect('response.student', 'student');

    if (status) {
      query = query.andWhere('response.status = :status', {status});
    }

    if (faculties && faculties.length > 0) {
      query = query.andWhere('student.faculty IN (:...faculties)', {faculties});
    }

    if (specializations && specializations.length > 0) {
      query = query.andWhere(
        'student.specialization IN (:...specializations)',
        {
          specializations,
        },
      );
    }

    if (years && years.length > 0) {
      query = query.andWhere('student.year IN (:...years)', {
        years,
      });
    }

    query = query.skip((page - 1) * limit).take(limit);

    const [items, totalItems] = await query.getManyAndCount();

    return {items, totalItems};
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
    try {
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'uploads',
        `${filename}`,
      );

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`File with name ${filename} not found`);
      }

      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.convertToHtml({buffer: buffer});
      return result.value;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new NotFoundException(
          'An error occurred while converting the document to HTML',
        );
      }
    }
  }
}

function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split('Z')[0];
}
