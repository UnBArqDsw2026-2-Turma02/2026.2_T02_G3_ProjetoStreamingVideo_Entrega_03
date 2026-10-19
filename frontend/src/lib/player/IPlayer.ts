import type { PlaybackListener, Unsubscribe } from './playback.types';

export interface IPlayer {
  carregar(manifestoUrl: string): Promise<void>;
  reproduzir(): Promise<void>;
  pausar(): void;
  observar(listener: PlaybackListener): Unsubscribe;
  descartar(): void;
}
