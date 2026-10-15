import { Injectable } from '@nestjs/common';
import { ManipuladorDeFluxo } from './manipulador-de-fluxo.base';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';

@Injectable()
export class GerenciadorDeAutenticacaoDeIngestao extends ManipuladorDeFluxo {
  async processar(dados: ContextoFluxo): Promise<boolean> {
    return false;
  }
}