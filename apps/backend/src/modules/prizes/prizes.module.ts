import { Module } from '@nestjs/common';
import { PrizesController } from './controllers/prizes.controller';
import { PrizesService } from './services/prizes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrizesController],
  providers: [PrizesService],
  exports: [PrizesService],
})
export class PrizesModule {}
