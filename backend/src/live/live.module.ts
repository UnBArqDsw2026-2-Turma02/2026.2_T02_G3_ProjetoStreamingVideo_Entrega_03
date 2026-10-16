import { Module } from '@nestjs/common';
import { LiveController } from './controllers/live.controller';
import { LiveService } from './services/live.service';
import { FFmpegService } from './services/ffmpeg.service';
import { NmsService } from './services/nms.service';
import { GerenciadorDeAutenticacaoDeIngestao } from './pipeline/1-ingestao-auth.handler';
import { GerenciadorDeTranscodificacao } from './pipeline/2-transcodificacao.handler';
import { GerenciadorDeDistribuicaoHls } from './pipeline/3-distribuicao-hls.handler';

@Module({
  controllers: [LiveController],
  providers: [
    LiveService,
    FFmpegService,
    NmsService,
    GerenciadorDeAutenticacaoDeIngestao,
    GerenciadorDeTranscodificacao,
    GerenciadorDeDistribuicaoHls,
  ],
  exports: [LiveService],
})
export class LiveModule {}