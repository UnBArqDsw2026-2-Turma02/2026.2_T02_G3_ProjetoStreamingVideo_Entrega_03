import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';

const NodeMediaServer = require('node-media-server');

@Injectable()
export class NmsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NmsService.name);
  private nms: any;

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