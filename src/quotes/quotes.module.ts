import { Module } from '@nestjs/common';
import { QuoteService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Quote, QuoteSchema } from './schemas/quote.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
  ],
  providers: [QuoteService],
  controllers: [QuotesController],
})
export class QuotesModule {}
