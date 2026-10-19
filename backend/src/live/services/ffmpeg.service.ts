import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class FFmpegService implements OnModuleDestroy {
    private readonly logger = new Logger(FFmpegService.name);
  private readonly processosAtivos = new Map<string, ChildProcess>();
  async iniciarTranscodificacao(idTransmissao: string, rtmpUrl: string): Promise<string> {
    const outputDir = path.resolve(process.cwd(), 'media', 'live', idTransmissao);

    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const playlistMaster = path.join(outputDir, 'index.m3u8');

    if (this.processosAtivos.has(idTransmissao)) {
      this.logger.log(`Transcodificação já ativa para live '${idTransmissao}'. Retornando playlist master.`);
      return playlistMaster;
    }
    // Configuração dos perfis ABR via HLS
    const args = [
      '-i', rtmpUrl,
      // 1080p
      '-vf', 'scale=-2:1080',
      '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
      '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-pix_fmt', 'yuv420p', '-crf', '20',
      '-g', '48', '-keyint_min', '48', '-sc_threshold', '0',
      '-b:v', '4500k', '-maxrate', '4900k', '-bufsize', '9000k',
      '-hls_time', '4',
      '-hls_playlist_type', 'event',
      '-hls_segment_filename', path.join(outputDir, '1080p_%03d.ts'),
      path.join(outputDir, '1080p.m3u8'),
      // 480p
      '-vf', 'scale=-2:480',
      '-c:a', 'aac', '-ar', '48000', '-b:a', '64k',
      '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-pix_fmt', 'yuv420p', '-crf', '22',
      '-g', '48', '-keyint_min', '48', '-sc_threshold', '0',
      '-b:v', '1200k', '-maxrate', '1400k', '-bufsize', '2400k',
      '-hls_time', '4',
      '-hls_playlist_type', 'event',
      '-hls_segment_filename', path.join(outputDir, '480p_%03d.ts'),
      path.join(outputDir, '480p.m3u8'),
    ];
    return new Promise((resolve, reject) => {
      this.logger.log(`Iniciando FFmpeg para transmissão '${idTransmissao}' consumindo de: ${rtmpUrl}`);
      const ffmpegProcess = spawn('ffmpeg', args);
      this.processosAtivos.set(idTransmissao, ffmpegProcess);
      let inicializado = false;
      ffmpegProcess.stderr.on('data', (data) => {
        const mensagem = data.toString();
        
        if (mensagem.includes('Opening') || mensagem.includes('frame=')) {
          if (!inicializado) {
            inicializado = true;
            this.logger.log(`FFmpeg iniciou geração ativa de fragmentos HLS para ${idTransmissao}`);
            this.criarPlaylistMasterSeNecessario(outputDir);
            resolve(playlistMaster);
          }
        }
        if (mensagem.toLowerCase().includes('error') || mensagem.toLowerCase().includes('fatal')) {
          this.logger.error(`[FFmpeg STDERR]: ${mensagem.trim()}`);
        }
      });
      
      ffmpegProcess.on('error', (err) => {
        this.logger.error(`Erro ao disparar FFmpeg para ${idTransmissao}: ${err.message}`);
        this.processosAtivos.delete(idTransmissao);
        if (!inicializado) {
          reject(err);
        }
      });

      ffmpegProcess.on('close', (code) => {
        this.logger.log(`Processo FFmpeg para ${idTransmissao} finalizado com código ${code}`);
        this.processosAtivos.delete(idTransmissao);
        if (!inicializado && code !== 0) {
          reject(new Error(`FFmpeg finalizou com código de erro ${code}`));
        }
      });
      
      setTimeout(() => {
        if (!inicializado) {
          inicializado = true;
          this.criarPlaylistMasterSeNecessario(outputDir);
          resolve(playlistMaster);
        }
      }, 5000);
    });
  }
  pararTranscodificacao(idTransmissao: string): boolean {
    const processo = this.processosAtivos.get(idTransmissao);
    if (processo) {
      processo.kill('SIGTERM');
      this.processosAtivos.delete(idTransmissao);
      return true;
    }
    return false;
  }
  obterLiveAtiva(): string | null {
    const keys = Array.from(this.processosAtivos.keys());
    return keys.length > 0 ? keys[keys.length - 1] : null;
  }
  onModuleDestroy() {
    for (const [id, proc] of this.processosAtivos.entries()) {
      proc.kill('SIGKILL');
      this.processosAtivos.delete(id);
    }
  }
  private criarPlaylistMasterSeNecessario(outputDir: string): void {
    const masterPath = path.join(outputDir, 'index.m3u8');
    if (!fs.existsSync(masterPath)) {
      const conteudoMaster = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=4500000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480
480p.m3u8
`;
      fs.writeFileSync(masterPath, conteudoMaster, 'utf-8');
    }
  }
}