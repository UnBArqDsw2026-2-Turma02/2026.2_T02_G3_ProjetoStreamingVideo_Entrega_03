import { ContextoFluxo } from '../dto/contexto-fluxo.dto';

export abstract class ManipuladorDeFluxo {
  private proximo?: ManipuladorDeFluxo;

  definirProximo(proximo: ManipuladorDeFluxo): ManipuladorDeFluxo {
    this.proximo = proximo;
    return proximo;
  }

  abstract processar(dados: ContextoFluxo): Promise<boolean>;

  protected async processarProximo(dados: ContextoFluxo): Promise<boolean> {
    return true;
  }
}