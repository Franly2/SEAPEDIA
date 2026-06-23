/* eslint-disable prettier/prettier */
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { CreateReviewDto } from './dto/create-review.dto';
import xss from 'xss'; 

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(dto: CreateReviewDto) {
    if (dto.userId) {
      const existingReview = await this.prisma.appReview.findUnique({
        where: { userId: dto.userId },
      });

      if (existingReview) {
        throw new ConflictException('Kamu sudah pernah memberikan ulasan untuk aplikasi ini.');
      }
    }

    const sanitizedComment = xss(dto.comment);

    return this.prisma.appReview.create({
      data: {
        reviewerName: dto.reviewerName,
        rating: dto.rating,
        comment: sanitizedComment,
        userId: dto.userId || null,
      },
    });
  }

  async getAllReviews() {
    return this.prisma.appReview.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getReviewByUserId(userId: string) {
    return this.prisma.appReview.findUnique({
      where: { userId },
    });
  }
}