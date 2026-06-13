/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service'; 
import { Prisma, Role } from '@prisma/client';
import { RegisterUserDto } from './dto/register.dto';

export interface LoginResponse {
  access_token: string;
  roles: Role[]; 
  username: string;
  fullName: string | null;
}

export interface RegisterResponse {
  status: string;
  message: string;
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterUserDto): Promise<RegisterResponse> {
    const { username, password, fullName } = data;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          fullName,
          roles: [Role.BUYER], // Default: Pendaftar baru selalu mulai sebagai BUYER
        },
      });

      return {
        status: 'success',
        message: 'Akun berhasil dibuat',
        userId: newUser.id,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Username diset @unique secara global di skema baru
          throw new ConflictException('Username sudah terpakai di SEAPEDIA');
        }
      }
      console.error('Registration Error:', error);
      throw new InternalServerErrorException('Gagal mendaftar user');
    }
  }

  async login(data: LoginUserDto): Promise<LoginResponse> {
    const { username, password } = data;

    // Cari user hanya berdasarkan username (tanpa mempedulikan perusahaan)
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Username tidak terdaftar');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah');
    }

    // Payload JWT sekarang membawa array 'roles'
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      roles: user.roles,
      username: user.username,
      fullName: user.fullName,
    };
  }
  async addRoleToUser(userId: string, newRole: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    // Cek apakah peran sudah ada
    if (user.roles.includes(newRole)) {
      throw new ConflictException(`Anda sudah memiliki peran ${newRole}.`);
    }

    // Tambahkan peran baru ke dalam array yang sudah ada
    const updatedRoles = [...user.roles, newRole];

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: updatedRoles },
    });

    return {
      message: `Peran ${newRole} berhasil ditambahkan.`,
      roles: updatedUser.roles,
    };
  }
}