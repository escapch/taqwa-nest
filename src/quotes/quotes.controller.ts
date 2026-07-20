import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuoteService } from './quotes.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get('random')
  getRandomQuote() {
    return this.quoteService.getRandom();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('create')
  createQuote(@Body() body: { text: string; source?: string }) {
    return this.quoteService.createQuote(body);
  }

  @Get('all')
  getAllQuotes() {
    return this.quoteService.getAllQuotes();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':id')
  deleteQuote(@Param('id') id: string) {
    return this.quoteService.deleteQuote(id);
  }
}
