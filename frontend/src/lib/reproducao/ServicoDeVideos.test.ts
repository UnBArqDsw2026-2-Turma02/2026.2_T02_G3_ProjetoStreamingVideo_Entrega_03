import { describe, expect, it } from 'vitest';

import { ServicoDeVideos } from './ServicoDeVideos';

describe('ServicoDeVideos', () => {
  it('consulta o vídeo pelo identificador e retorna uma cópia dos dados do catálogo', async () => {
    const video = { id: 'video-1', manifestoUrl: 'https://exemplo.test/video.m3u8' };
    const servico = new ServicoDeVideos([video]);

    const resultado = await servico.buscarPorId('video-1');

    expect(resultado).toEqual(video);
    expect(resultado).not.toBe(video);
  });

  it('informa quando o vídeo não pertence ao catálogo', async () => {
    const servico = new ServicoDeVideos([]);

    await expect(servico.buscarPorId('inexistente')).rejects.toMatchObject({
      codigo: 'VIDEO_NAO_ENCONTRADO',
    });
  });
});
