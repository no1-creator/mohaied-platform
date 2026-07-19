import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  @Get('provider/:id')
  forProvider(@Param('id') id: string) {
    return this.reviews.forProvider(id);
  }

  @Get('project/:id')
  @UseGuards(JwtAuthGuard)
  forProject(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.reviews.forProject(id, user.id);
  }
}
