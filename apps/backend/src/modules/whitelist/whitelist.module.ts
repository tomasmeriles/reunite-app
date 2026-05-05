import { Module } from '@nestjs/common';
import { WhitelistController } from './controllers/whitelist.controller';
import { WhitelistService } from './services/whitelist.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WhitelistController],
  providers: [WhitelistService],
  exports: [WhitelistService],
})
export class WhitelistModule {}
