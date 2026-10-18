import { PlaybackError } from '../player/playback.types';
import type { Video } from './Video';

export class ServicoDeVideos {
  constructor(private readonly catalogo: readonly Video[]) {}

  async buscarPorId(videoId: string): Promise<Video> {
    const video = this.catalogo.find((item) => item.id === videoId);

    if (!video) {
      throw new PlaybackError(
        'VIDEO_NAO_ENCONTRADO',
        `O vídeo "${videoId}" não foi encontrado no catálogo.`,
      );
    }

    return { ...video };
  }
}
