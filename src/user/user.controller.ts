import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {UserService} from './user.service';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {JwtAuthGuard} from '../strategy/jwt-auth.guard';
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
  async updateUserRoles(@Body() body: UserRoleDto): Promise<any> {
    return await this.userService.updateUserRole(body.email, body.role);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetUserPassword(@Body() body: UserLoginDto) {
    return await this.userService.resetPassword(body.email, body.password);
  }
}
