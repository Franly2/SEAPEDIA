/* eslint-disable prettier/prettier */
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(dto: CreateReviewDto) {
    // 1. Jika ada userId (User sedang login), cek apakah dia sudah pernah review
    if (dto.userId) {
      const existingReview = await this.prisma.appReview.findUnique({
        where: { userId: dto.userId },
      });

      if (existingReview) {
        throw new ConflictException('Kamu sudah pernah memberikan ulasan untuk aplikasi ini.');
      }
    }

    // 2. Simpan review ke database (Guest akan masuk dengan userId: null)
    return this.prisma.appReview.create({
      data: {
        reviewerName: dto.reviewerName,
        rating: dto.rating,
        comment: dto.comment,
        userId: dto.userId || null,
      },
    });
  }

  // Mengambil semua ulasan untuk ditampilkan di halaman publik
  async getAllReviews() {
    return this.prisma.appReview.findMany({
      orderBy: {
        createdAt: 'desc', // Yang terbaru tampil di atas
      },
    });
  }

  // Mengambil ulasan spesifik berdasarkan userId (Berguna untuk frontend mengecek status review user)
  async getReviewByUserId(userId: string) {
    return this.prisma.appReview.findUnique({
      where: { userId },
    });
  }
}