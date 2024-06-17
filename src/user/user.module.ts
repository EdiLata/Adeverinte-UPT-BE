import {Module} from '@nestjs/common';
import {UserService} from './user.service';
import {UserController} from './user.controller';
import {TypeOrmModule} from '@nestjs/typeorm';
import {User} from './entities/user.entity';
import {JwtStrategy} from '../strategy/jwt.strategy';
import {PassportModule} from '@nestjs/passport';
import {LoggerModule} from '../logger/logger.module';
import {JwtModule} from '@nestjs/jwt';
import * as fs from 'fs';

@Module({
  imports: [
    PassportModule,
    LoggerModule,
    JwtModule.registerAsync({
      useFactory: () => {
        return {
          privateKey: fs.readFileSync('keys/private-key.pem', 'utf8'),
          publicKey: fs.readFileSync('keys/public-key.pem', 'utf8'),
          signOptions: {algorithm: 'RS256'},
        };
      },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [JwtStrategy, UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
