import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {UserService} from './user.service';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {JwtAuthGuard} from './strategy/jwt-auth.guard';
import {UserLoginDto} from './dto/user-login.dto';
import {UserRoleDto} from './dto/user-role.dto';
import {UserRegisterDto} from './dto/user-register.dto';

@ApiTags('Authentication')
@Controller('authentication')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Res() res, @Body() body: UserLoginDto) {
    const auth = await this.userService.login(body);
    res.status(auth.status).json(auth.msg);
  }

  @Post('register')
  async register(@Res() res, @Body() body: UserRegisterDto) {
    const auth = await this.userService.createUser(body);
    res.status(auth.status).json(auth.content);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('change-role')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true}))
  async updateUserRoles(@Body() body: UserRoleDto): Promise<any> {
    try {
      const updatedUser = await this.userService.updateUserRole(
        body.email,
        body.role,
      );
      return {
        status: 'success',
        message: 'User role updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      throw new NotFoundException(error.message);
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetUserPassword(@Body() body: UserLoginDto): Promise<void> {
    try {
      await this.userService.resetPassword(body.email, body.password);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Error processing your request');
    }
  }
}
