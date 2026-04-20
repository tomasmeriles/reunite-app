import { Module } from '@nestjs/common';
import { InviteLinksController } from './controllers/invite-links.controller';
import { InviteLinksService } from './services/invite-links.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InviteLinksController],
  providers: [InviteLinksService],
  exports: [InviteLinksService],
})
export class InviteLinksModule {}
