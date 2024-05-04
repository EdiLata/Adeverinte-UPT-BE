import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TemplatesController} from './template.controller';
import {TemplatesService} from './template.service';
import {Template} from './entities/template.entity';
import {Field} from './entities/field.entity';
import {StudentResponse} from './entities/student-response.entity';
import {UserModule} from '../user/user.module';
import {UserService} from '../user/user.service';
import {User} from '../user/entities/user.entity';
import {PassportModule} from '@nestjs/passport';
import {LoggerModule} from '../logger/logger.module';
import {JwtModule} from '@nestjs/jwt';
import * as fs from 'fs';

@Module({
  imports: [
    UserModule,
    PassportModule,
    LoggerModule,
    JwtModule.registerAsync({
      useFactory: () => {
        return {
          privateKey: fs.readFileSync('keys/private-key.pem', 'utf8'),
          publicKey: fs.readFileSync('keys/public-key.pem', 'utf8'),
          signOptions: {expiresIn: '30m', algorithm: 'RS256'},
        };
      },
    }),
    TypeOrmModule.forFeature([Template, Field, StudentResponse, User]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, UserService],
  exports: [TemplatesService],
})
export class TemplateModule {}
