// src/quotes/quote.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Quote, QuoteDocument } from './schemas/quote.schema';
import { Model } from 'mongoose';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
  ) {}

  async getRandom(): Promise<Quote | null> {
    const count = await this.quoteModel.countDocuments();
    const random = Math.floor(Math.random() * count);
    const quote = await this.quoteModel.findOne().skip(random);
    return quote;
  }

  async createQuote(data: { text: string; source?: string }) {
    return this.quoteModel.create(data);
  }

  async getAllQuotes() {
    return this.quoteModel.find();
  }

  async deleteQuote(id: string) {
    return this.quoteModel.findByIdAndDelete(id);
  }
}
