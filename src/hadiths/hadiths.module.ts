import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HadithsService } from './hadiths.service';
import { HadithsController } from './hadiths.controller';
import { HadithContent, HadithContentSchema } from './schemas/hadith-content.schema';
import { HadithLike, HadithLikeSchema } from './schemas/hadith-like.schema';
import { HadithComment, HadithCommentSchema } from './schemas/hadith-comment.schema';
import { UsersModule } from 'src/users/users.module';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HadithContent.name, schema: HadithContentSchema },
      { name: HadithLike.name, schema: HadithLikeSchema },
      { name: HadithComment.name, schema: HadithCommentSchema },
    ]),
    UsersModule,
  ],
  controllers: [HadithsController],
  providers: [HadithsService, AdminGuard],
})
export class HadithsModule {}
