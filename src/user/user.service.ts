import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from './entities/user.entity';
import {UserDTO} from './dto/user.dto';
import {validate} from 'class-validator';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {LoggerService} from '../logger/logger.service';
import {UserRole} from './dto/user-role.dto';

@Injectable()
export class UserService {
  constructor(
    private logger: LoggerService,
    private jwtService: JwtService,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async addUserRole(email: string, newRole: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {email},
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    if (!user.roles.includes(newRole)) {
      user.roles.push(newRole);
      await this.usersRepository.save(user);
    } else {
      throw new Error(`Role '${newRole}' already exists for this user.`);
    }

    return user;
  }

  async login(user: UserDTO): Promise<Record<string, any>> {
    let isOk = false;

    const userDTO = new UserDTO();
    userDTO.email = user.email;
    userDTO.password = user.password;

    await validate(userDTO).then((errors) => {
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
              email: user.email,
              roles: await this.getUserRolesByEmail(user.email),
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

  async getUserRolesByEmail(email: string): Promise<UserRole[]> {
    const user = await this.usersRepository.findOne({
      where: {email: email},
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user.roles;
  }

  async createUser(body: UserDTO): Promise<Record<string, any>> {
    let isOk = false;

    const userDTO = new UserDTO();
    userDTO.email = body.email;
    userDTO.password = bcrypt.hashSync(body.password, 10);

    await validate(userDTO).then((errors) => {
      if (errors.length > 0) {
        this.logger.debug(`${errors}`, UserService.name);
      } else {
        isOk = true;
      }
    });
    if (isOk) {
      await this.usersRepository.save(userDTO).catch((error) => {
        this.logger.debug(error.message, UserService.name);
        isOk = false;
      });

      await this.addUserRole(userDTO.email, UserRole.STUDENT);
      if (isOk) {
        return {status: 201, content: {msg: `User created with success`}};
      } else {
        return {status: 400, content: {msg: 'User already exists'}};
      }
    } else {
      return {status: 400, content: {msg: 'Invalid content'}};
    }
  }
}
