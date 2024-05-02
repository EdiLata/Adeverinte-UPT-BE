import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {User} from './user/entities/user.entity';
import configuration from './config/configuration';
import {UserModule} from './user/user.module';
import {Field} from './template/entities/field.entity';
import {Template} from './template/entities/template.entity';
import {StudentResponse} from './template/entities/student-response.entity';
import {TemplateModule} from './template/template.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, UserModule, TemplateModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('postgresHost'),
        port: configService.get('postgresPort'),
        username: configService.get('postgresUser'),
        password: configService.get('postgresPassword'),
        database: configService.get('postgresDatabase'),
        entities: [User, Field, Template, StudentResponse],
        synchronize: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
