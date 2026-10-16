import { Controller, Post, Body } from '@nestjs/common';
import { LiveService } from '../services/live.service';
import { IniciarLiveDto } from '../dto/iniciar-live.dto';

@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Post('iniciar')
  async iniciar(@Body() dto: IniciarLiveDto) {}
}