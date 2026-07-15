import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HadithContent, HadithContentDocument } from './schemas/hadith-content.schema';
import { HadithLike, HadithLikeDocument } from './schemas/hadith-like.schema';
import { HadithComment, HadithCommentDocument } from './schemas/hadith-comment.schema';
import { CreateHadithContentDto } from './dto/create-hadith-content.dto';
import { UpdateHadithContentDto } from './dto/update-hadith-content.dto';
import { UsersService } from 'src/users/users.service';

interface Cursor {
  createdAt: Date;
  id: string;
}

function decodeCursor(cursor?: string): Cursor | null {
  if (!cursor) return null;
  const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
  return { createdAt: new Date(iso), id };
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url');
}

@Injectable()
export class HadithsService {
  constructor(
    @InjectModel(HadithContent.name) private contentModel: Model<HadithContentDocument>,
    @InjectModel(HadithLike.name) private likeModel: Model<HadithLikeDocument>,
    @InjectModel(HadithComment.name) private commentModel: Model<HadithCommentDocument>,
    private usersService: UsersService,
  ) {}

  async getFeed(limit: number, cursorStr?: string, userId?: string, tag?: string) {
    const cursor = decodeCursor(cursorStr);
    const filter: Record<string, any> = {};
    if (tag) filter.tags = tag;
    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }

    const items = await this.contentModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    const likedIds = await this.likedContentIds(page.map((i) => i._id), userId);

    const nextCursor =
      hasMore && page.length > 0
        ? encodeCursor(page[page.length - 1].createdAt, String(page[page.length - 1]._id))
        : null;

    return {
      items: page.map((item) => ({ ...item, liked: likedIds.has(String(item._id)) })),
      nextCursor,
      hasMore,
    };
  }

  async getOne(id: string, userId?: string) {
    const item = await this.contentModel.findById(id).lean();
    if (!item) throw new NotFoundException('Контент не найден');
    const likedIds = await this.likedContentIds([item._id], userId);
    return { ...item, liked: likedIds.has(String(item._id)) };
  }

  private async likedContentIds(contentIds: any[], userId?: string) {
    if (!userId || contentIds.length === 0) return new Set<string>();
    const likes = await this.likeModel
      .find({ contentId: { $in: contentIds }, userId: new Types.ObjectId(userId) })
      .lean();
    return new Set(likes.map((l) => String(l.contentId)));
  }

  async create(dto: CreateHadithContentDto) {
    return this.contentModel.create(dto);
  }

  async update(id: string, dto: UpdateHadithContentDto) {
    const item = await this.contentModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException('Контент не найден');
    return item;
  }

  async remove(id: string) {
    const item = await this.contentModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Контент не найден');
    const contentId = new Types.ObjectId(id);
    await Promise.all([
      this.likeModel.deleteMany({ contentId }),
      this.commentModel.deleteMany({ contentId }),
    ]);
    return { message: 'Удалено' };
  }

  async toggleLike(contentId: string, userId: string) {
    const filter = { contentId: new Types.ObjectId(contentId), userId: new Types.ObjectId(userId) };
    const existing = await this.likeModel.findOneAndDelete(filter);
    if (existing) {
      const item = await this.contentModel.findByIdAndUpdate(
        contentId,
        { $inc: { likesCount: -1 } },
        { new: true },
      );
      return { liked: false, likesCount: item?.likesCount ?? 0 };
    }

    await this.likeModel.create(filter);
    const item = await this.contentModel.findByIdAndUpdate(
      contentId,
      { $inc: { likesCount: 1 } },
      { new: true },
    );
    return { liked: true, likesCount: item?.likesCount ?? 0 };
  }

  async listComments(contentId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { contentId: new Types.ObjectId(contentId) };
    const [items, total] = await Promise.all([
      this.commentModel.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      this.commentModel.countDocuments(filter),
    ]);
    return { items, total, hasMore: skip + items.length < total };
  }

  async addComment(contentId: string, userId: string, text: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Пользователь не найден');

    const comment = await this.commentModel.create({
      contentId: new Types.ObjectId(contentId),
      userId: new Types.ObjectId(userId),
      authorName: user.name || 'Пользователь',
      text,
    });
    await this.contentModel.findByIdAndUpdate(contentId, { $inc: { commentsCount: 1 } });
    return comment;
  }

  async deleteComment(commentId: string, requesterId: string, isAdmin: boolean) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Комментарий не найден');
    if (String(comment.userId) !== requesterId && !isAdmin) {
      throw new ForbiddenException('Нельзя удалить чужой комментарий');
    }
    await this.commentModel.findByIdAndDelete(commentId);
    await this.contentModel.findByIdAndUpdate(comment.contentId, { $inc: { commentsCount: -1 } });
    return { message: 'Удалено' };
  }
}
