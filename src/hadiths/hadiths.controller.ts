import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HadithsService } from './hadiths.service';
import { CreateHadithContentDto } from './dto/create-hadith-content.dto';
import { UpdateHadithContentDto } from './dto/update-hadith-content.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';
import { UsersService } from 'src/users/users.service';

const DEFAULT_FEED_LIMIT = 10;
const DEFAULT_COMMENTS_LIMIT = 20;

@Controller('hadiths')
export class HadithsController {
  constructor(
    private readonly hadithsService: HadithsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getFeed(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('tag') tag?: string,
  ) {
    return this.hadithsService.getFeed(
      Number(limit) || DEFAULT_FEED_LIMIT,
      cursor,
      req.user?.userId,
      tag,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getOne(@Request() req: any, @Param('id') id: string) {
    return this.hadithsService.getOne(id, req.user?.userId);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post()
  create(@Body() dto: CreateHadithContentDto) {
    return this.hadithsService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHadithContentDto) {
    return this.hadithsService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hadithsService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  toggleLike(@Request() req: any, @Param('id') id: string) {
    return this.hadithsService.toggleLike(id, req.user.userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments')
  listComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hadithsService.listComments(
      id,
      Number(page) || 1,
      Number(limit) || DEFAULT_COMMENTS_LIMIT,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comments')
  addComment(@Request() req: any, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.hadithsService.addComment(id, req.user.userId, dto.text);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Request() req: any,
    @Param('commentId') commentId: string,
  ) {
    const requester = await this.usersService.findById(req.user.userId);
    return this.hadithsService.deleteComment(
      commentId,
      req.user.userId,
      !!requester?.isAdmin,
    );
  }
}
