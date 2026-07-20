import { Module } from '@nestjs/common';
import { QuoteService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Quote, QuoteSchema } from './schemas/quote.schema';
import { UsersModule } from 'src/users/users.module';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    UsersModule,
  ],
  providers: [QuoteService, AdminGuard],
  controllers: [QuotesController],
  exports: [QuoteService],
})
export class QuotesModule {}
