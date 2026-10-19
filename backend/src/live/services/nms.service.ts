import { Injectable, Logger, OnModuleInit, OnModuleDestroy, forwardRef, Inject } from '@nestjs/common';
import * as path from 'path';
import { LiveService } from './live.service';
import { FFmpegService } from './ffmpeg.service';
import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';

const NodeMediaServer = require('node-media-server');

@Injectable()
export class NmsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NmsService.name);
  private nms: any;

  constructor(
    @Inject(forwardRef(() => LiveService))
    private readonly liveService: LiveService,
    private readonly ffmpegService: FFmpegService,
  ) {}

  onModuleInit() {
    const rtmpPort = Number(process.env.RTMP_PORT) || 1935;
    const httpPort = Number(process.env.HLS_PORT) || 8000;
    const mediaRoot = path.resolve(process.cwd(), 'media');

    const config = {
      rtmp: {
        port: rtmpPort,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: httpPort,
        mediaroot: mediaRoot,
        allow_origin: '*',
      },
    };

    try {
      this.nms = new NodeMediaServer(config);

      this.nms.on('postPublish', async (id: string, StreamPath: string) => {
        this.logger.log(`[RTMP Ingest] Transmissão conectada em: ${StreamPath} (Sessão: ${id})`);

        const partes = StreamPath.split('/').filter(Boolean);
        const app = partes[0];
        const chaveTransmissao = partes[1];

        if (app === 'live' && chaveTransmissao) {
          this.logger.log(`Disparando esteira GoF para validação da chave: ${chaveTransmissao}`);
          try {
            const resultado = await this.liveService.iniciar({ chaveTransmissao });
            if (!resultado || resultado.status === StatusEtapaPipeline.FALHA_AUTENTICACAO) {
              this.logger.warn(`Chave '${chaveTransmissao}' não autorizada. Derrubando sessão RTMP ${id}.`);
              const session = this.nms.getSession(id);
              if (session) {
                session.stop();
              }
            }
          } catch (err: any) {
            this.logger.error(`Erro ao processar ingestão RTMP: ${err?.message}`);
          }
        }
      });

      this.nms.on('donePublish', (id: string, StreamPath: string) => {
        this.logger.log(`[RTMP Ingest] Transmissão finalizada em: ${StreamPath} (Sessão: ${id})`);
        const partes = StreamPath.split('/').filter(Boolean);
        const chaveTransmissao = partes[1];
        if (chaveTransmissao) {
          this.logger.log(`Encerrando transcodificação da live vinculada à chave ${chaveTransmissao}`);
        }
      });

      this.nms.run();
      this.logger.log(
        `NodeMediaServer operacional: Ingestão RTMP (: ${rtmpPort}) | Distribuição HLS (: ${httpPort})`,
      );
    } catch (error: any) {
      this.logger.error(`Erro ao inicializar o NodeMediaServer: ${error?.message}`);
    }
  }

  onModuleDestroy() {
    if (this.nms) {
      this.logger.log('Encerrando NodeMediaServer...');
      this.nms.stop();
    }
  }
}