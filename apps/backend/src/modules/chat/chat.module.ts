import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RtcModule } from '../../rtc/rtc.module';

@Module({
  imports: [PrismaModule, RtcModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
