import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IniciarLiveDto } from '../dto/iniciar-live.dto';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';
import { GerenciadorDeAutenticacaoDeIngestao } from '../pipeline/1-GerenciadorDeAutenticacaoDeIngestao';
import { GerenciadorDeTranscodificacao } from '../pipeline/2-GerenciadorDeTranscodificacao';
import { GerenciadorDeDistribuicaoHls } from '../pipeline/3-GerenciadorDeDistribuicaoHls';
import { TransmissaoAoVivo } from '../entities/TransmissaoAoVivo.entity';
import { FFmpegService } from './ffmpeg.service';

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    private readonly authHandler: GerenciadorDeAutenticacaoDeIngestao,
    private readonly transcodeHandler: GerenciadorDeTranscodificacao,
    private readonly deliveryHandler: GerenciadorDeDistribuicaoHls,
    private readonly ffmpegService: FFmpegService,
  ) {}

  encerrar(idTransmissao: string): { sucesso: boolean; idTransmissao: string; encerradaEm: Date } {
    this.logger.log(`Encerrando transmissão: ${idTransmissao}`);
    const encerrou = this.ffmpegService.pararTranscodificacao(idTransmissao);
    const transmissao = new TransmissaoAoVivo(idTransmissao, '');
    transmissao.encerrar();
    return {
      sucesso: encerrou,
      idTransmissao,
      encerradaEm: transmissao.encerradaEm!,
    };
  }

  obterStatusAoVivo(): {
    ativa: boolean;
    idTransmissao: string | null;
    hlsUrl: string | null;
    ultimaLive: string | null;
    ultimaHlsUrl: string | null;
  } {
    const idAtivo = this.ffmpegService.obterLiveAtiva();
    let ultimaLive: string | null = null;
    let ultimaHlsUrl: string | null = null;

    try {
      const liveDir = path.resolve(process.cwd(), 'media', 'live');
      if (fs.existsSync(liveDir)) {
        const pastas = fs
          .readdirSync(liveDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => ({
            name: d.name,
            mtime: fs.statSync(path.join(liveDir, d.name)).mtimeMs,
          }))
          .sort((a, b) => b.mtime - a.mtime)
          .map((d) => d.name);

        for (const p of pastas) {
          if (fs.existsSync(path.join(liveDir, p, 'index.m3u8'))) {
            ultimaLive = p;
            ultimaHlsUrl = `http://localhost:8000/live/${p}/index.m3u8`;
            break;
          }
        }
      }
    } catch {
      // Ignora erro na busca de diretório
    }

    if (idAtivo) {
      return {
        ativa: true,
        idTransmissao: idAtivo,
        hlsUrl: `http://localhost:8000/live/${idAtivo}/index.m3u8`,
        ultimaLive,
        ultimaHlsUrl,
      };
    }

    return {
      ativa: false,
      idTransmissao: null,
      hlsUrl: null,
      ultimaLive,
      ultimaHlsUrl,
    };
  }

  async iniciar(dto: IniciarLiveDto): Promise<TransmissaoAoVivo> {
    this.logger.log(`Recebida requisição para iniciar live com chave: ${dto.chaveTransmissao}`);

    const transmissao = new TransmissaoAoVivo(
      dto.idTransmissao || '',
      dto.chaveTransmissao,
      dto.rtmpUrl || '',
    );

    transmissao.iniciar();

    const contexto = new ContextoFluxo();
    contexto.idTransmissao = transmissao.id;
    contexto.chaveTransmissao = transmissao.chaveTransmissao;
    contexto.rtmpUrl = transmissao.rtmpUrl;
    contexto.hlsUrl = '';
    contexto.atualizarStatus(transmissao.status);

    this.authHandler
      .definirProximo(this.transcodeHandler)
      .definirProximo(this.deliveryHandler);

    try {
      await this.authHandler.processar(contexto);
    } catch (err: any) {
      transmissao.id = contexto.idTransmissao;
      transmissao.status = contexto.statusAtual;
      transmissao.rtmpUrl = contexto.rtmpUrl;
      transmissao.hlsUrl = contexto.hlsUrl;
      transmissao.mensagemErro = contexto.mensagemErro;
      this.logger.warn(
        `Live ${transmissao.id} interrompida na esteira. Estado: ${transmissao.status}. Motivo: ${transmissao.mensagemErro}`,
      );
      throw err;
    }

    transmissao.id = contexto.idTransmissao;
    transmissao.status = contexto.statusAtual;
    transmissao.rtmpUrl = contexto.rtmpUrl;
    transmissao.hlsUrl = contexto.hlsUrl;
    transmissao.mensagemErro = contexto.mensagemErro;

    this.logger.log(`Live ${transmissao.id} ativa e distribuída com sucesso.`);
    return transmissao;
  }
}