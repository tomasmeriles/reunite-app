import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { PrizesService } from '../services/prizes.service';
import { CreatePrizeDto } from '../dto/create-prize.dto';
import { AssignWinnerDto } from '../dto/assign-winner.dto';

@Controller('events/:eventId/prizes')
export class PrizesController {
  constructor(private readonly prizes: PrizesService) {}

  @Post()
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreatePrizeDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.prizes.create(eventId, dto, user.id);
  }

  @Public()
  @Get()
  findAll(@Param('eventId') eventId: string) {
    return this.prizes.findByEvent(eventId);
  }

  @Patch(':prizeId/winner')
  assignWinner(
    @Param('eventId') eventId: string,
    @Param('prizeId') prizeId: string,
    @Body() dto: AssignWinnerDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.prizes.assignWinner(eventId, prizeId, dto, user.id);
  }

  @Delete(':prizeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('eventId') eventId: string,
    @Param('prizeId') prizeId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.prizes.delete(eventId, prizeId, user.id);
  }
}
