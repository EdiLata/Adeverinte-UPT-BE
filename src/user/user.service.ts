import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from './entities/user.entity';
import {UserLoginDto} from './dto/user-login.dto';
import {validate} from 'class-validator';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {LoggerService} from '../logger/logger.service';
import {UserRegisterDto} from './dto/user-register.dto';
import {UserRole} from '../shared/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    private logger: LoggerService,
    private jwtService: JwtService,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async updateUserRole(email: string, newRole: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {email},
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    if (user.role !== newRole) {
      user.role = newRole;
      await this.usersRepository.save(user);
    } else {
      throw new Error(`Role '${newRole}' already exists for this user.`);
    }

    return user;
  }

  async login(user: UserLoginDto): Promise<Record<string, any>> {
    let isOk = false;

    const userDto = new UserLoginDto();
    userDto.email = user.email;
    userDto.password = user.password;

    await validate(userDto).then((errors) => {
      if (errors.length > 0) {
        this.logger.debug(`${errors}`, UserService.name);
      } else {
        isOk = true;
      }
    });

    if (isOk) {
      const userDetails = await this.usersRepository.findOne({
        where: {
          email: user.email,
        },
      });
      if (userDetails == null) {
        return {status: 401, msg: {msg: 'Invalid credentials'}};
      }

      const isValid = bcrypt.compareSync(user.password, userDetails.password);
      if (isValid) {
        return {
          status: 200,
          msg: {
            access_token: this.jwtService.sign({
              id: userDetails.id,
              email: user.email,
              role: userDetails.role,
            }),
          },
        };
      } else {
        return {status: 401, msg: {msg: 'Invalid credentials'}};
      }
    } else {
      return {status: 400, msg: {msg: 'Invalid fields.'}};
    }
  }

  async createUser(body: UserRegisterDto): Promise<Record<string, any>> {
    let isOk = false;

    const userDto = new UserRegisterDto();
    userDto.email = body.email;
    userDto.faculty = body.faculty;
    userDto.specialization = body.specialization;
    userDto.year = body.year;
    userDto.password = bcrypt.hashSync(body.password, 10);

    await validate(userDto).then((errors) => {
      if (errors.length > 0) {
        this.logger.debug(`${errors}`, UserService.name);
      } else {
        isOk = true;
      }
    });
    if (isOk) {
      await this.usersRepository.save(userDto).catch((error) => {
        this.logger.debug(error.message, UserService.name);
        isOk = false;
      });

      await this.updateUserRole(userDto.email, UserRole.STUDENT);
      if (isOk) {
        return {status: 201, content: {msg: `User created with success`}};
      } else {
        return {status: 400, content: {msg: 'User already exists'}};
      }
    } else {
      return {status: 400, content: {msg: 'Invalid content'}};
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({where: {email}});

    if (!user) {
      throw new NotFoundException(`No user found with the email ${email}`);
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as the old password.',
      );
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await this.usersRepository.save(user);
  }
}
