import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TemplatesController} from './template.controller';
import {TemplatesService} from './template.service';
import {Template} from './entities/template.entity';
import {Field} from './entities/field.entity';
import {StudentResponse} from './entities/student-response.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template, Field, StudentResponse]), // Register entities with TypeORM
  ],
  controllers: [TemplatesController], // Register controllers
  providers: [TemplatesService], // Register services
  exports: [TemplatesService], // Export the service if it will be used elsewhere
})
export class TemplateModule {}
