import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { LiveModule } from './live/live.module';

@Module({
  imports: [CoreModule, LiveModule],
})
export class AppModule {}
