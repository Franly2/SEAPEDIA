/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @Get()
  async findAll() {
    return this.reviewService.getAllReviews();
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    const review = await this.reviewService.getReviewByUserId(userId);
    return {
      hasReviewed: !!review,
      review: review || null
    };
  }
}