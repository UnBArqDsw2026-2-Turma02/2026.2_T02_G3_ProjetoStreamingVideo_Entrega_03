import { Injectable } from '@nestjs/common';
import { IniciarLiveDto } from '../dto/iniciar-live.dto';
import { GerenciadorDeAutenticacaoDeIngestao } from '../pipeline/1-ingestao-auth.handler';
import { GerenciadorDeTranscodificacao } from '../pipeline/2-transcodificacao.handler';
import { GerenciadorDeDistribuicaoHls } from '../pipeline/3-distribuicao-hls.handler';

@Injectable()
export class LiveService {
  constructor(
    private readonly authHandler: GerenciadorDeAutenticacaoDeIngestao,
    private readonly transcodeHandler: GerenciadorDeTranscodificacao,
    private readonly deliveryHandler: GerenciadorDeDistribuicaoHls,
  ) {}

  async iniciar(dto: IniciarLiveDto): Promise<any> {}
}