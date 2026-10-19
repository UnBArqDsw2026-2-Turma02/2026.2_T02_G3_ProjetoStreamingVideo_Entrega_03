export type Unsubscribe = () => void;

export type PlaybackErrorCode =
  | 'AMBIENTE_INDISPONIVEL'
  | 'HLS_NAO_SUPORTADO'
  | 'PLAYER_DESCARTADO'
  | 'URL_INVALIDA'
  | 'CARREGAMENTO_EM_ANDAMENTO'
  | 'CARREGAMENTO_FALHOU'
  | 'TEMPO_LIMITE_CARREGAMENTO'
  | 'CARREGAMENTO_CANCELADO'
  | 'VIDEO_NAO_ENCONTRADO'
  | 'VIDEO_NAO_PREPARADO'
  | 'SESSAO_JA_INICIADA'
  | 'SESSAO_ENCERRADA'
  | 'REPRODUCAO_FALHOU'
  | 'PAUSA_FALHOU';

export class PlaybackError extends Error {
  constructor(
    public readonly codigo: PlaybackErrorCode,
    mensagem: string,
    public readonly causa?: unknown,
  ) {
    super(mensagem);
    this.name = 'PlaybackError';
  }
}

export type PlaybackEvent =
  | { tipo: 'carregando'; manifestoUrl: string }
  | { tipo: 'pronto'; manifestoUrl: string }
  | { tipo: 'reproduzindo' }
  | { tipo: 'pausado' }
  | { tipo: 'erro'; erro: PlaybackError }
  | { tipo: 'descartado' };

export type PlaybackListener = (evento: PlaybackEvent) => void;
