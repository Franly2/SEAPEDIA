/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, 
    private readonly prisma: PrismaService
  ) {}

  @Post('register')
  async registerUser(@Body() data: RegisterUserDto) { 
    return this.authService.register(data); 
  }

  @HttpCode(HttpStatus.OK) 
  @Post('login') 
  async loginUser(@Body() data: LoginUserDto) {
    return this.authService.login(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@GetUser() userPayload: any) { 
    const userId = userPayload.sub || userPayload.userId; 

    const fullUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        store: true, 
      }
    });

    if (!fullUser) {
      return null;
    }

    const { password, ...result } = fullUser;
    
    return { ...result, activeRole: userPayload.activeRole };
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-role')
  async switchRole(
    @GetUser() userPayload: any, 
    @Body('role') role: Role
  ) {
    const userId = userPayload.sub || userPayload.userId;
    return this.authService.switchRole(userId, role);
  }
}

export { JwtAuthGuard };