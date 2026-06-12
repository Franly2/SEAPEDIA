/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { GetUser } from './get-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from 'prisma/prisma.service';

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
    // Menggunakan Prisma biasa tanpa withTenant
    const fullUser = await this.prisma.user.findUnique({
      where: { id: userPayload.userId },
      include: { 
        store: true, // Ambil relasi toko (jika user ini adalah SELLER)
      }
    });

    if (!fullUser) {
      return null;
    }

    // Buang password dari response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = fullUser;
    
    return result;
  }
}