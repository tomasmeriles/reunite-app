import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    MulterModule.register({ limits: { fileSize: 20 * 1024 * 1024 } }), // 20 MB
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
