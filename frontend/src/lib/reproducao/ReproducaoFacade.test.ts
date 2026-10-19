import { describe, expect, it, vi } from 'vitest';

import type { IPlayer } from '../player/IPlayer';
import { PlaybackError, type PlaybackEvent, type PlaybackListener } from '../player/playback.types';
import { ReproducaoFacade } from './ReproducaoFacade';
import { ServicoDeVideos } from './ServicoDeVideos';

const dadosDoVideo = {
  id: 'video-1',
  manifestoUrl: 'https://exemplo.test/video.m3u8',
};

function criarPromessaPendente<T>() {
  let resolver!: (valor: T) => void;
  let rejeitar!: (erro: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    rejeitar = reject;
  });
  return { promise, resolver, rejeitar };
}

function criarCenario() {
  const ouvintes = new Set<PlaybackListener>();
  const emitir = (evento: PlaybackEvent) => {
    Array.from(ouvintes).forEach((listener) => listener(evento));
  };
  const removerInscricao = vi.fn();
  const player = {
    carregar: vi.fn(async (manifestoUrl: string) => {
      emitir({ tipo: 'carregando', manifestoUrl });
      emitir({ tipo: 'pronto', manifestoUrl });
    }),
    reproduzir: vi.fn(async () => { emitir({ tipo: 'reproduzindo' }); }),
    pausar: vi.fn(() => { emitir({ tipo: 'pausado' }); }),
    observar: vi.fn((listener: PlaybackListener) => {
      ouvintes.add(listener);
      removerInscricao.mockImplementation(() => { ouvintes.delete(listener); });
      return removerInscricao;
    }),
    descartar: vi.fn(() => { emitir({ tipo: 'descartado' }); }),
  } satisfies IPlayer;
  const servico = new ServicoDeVideos([]);
  const buscarPorId = vi.spyOn(servico, 'buscarPorId').mockResolvedValue(dadosDoVideo);
  const playerProvider = vi.fn((_video: HTMLVideoElement) => player);
  const facade = new ReproducaoFacade(servico, playerProvider);
  const video = {} as HTMLVideoElement;

  return { facade, video, player, playerProvider, buscarPorId, emitir, removerInscricao };
}

describe('ReproducaoFacade', () => {
  it('consulta o catálogo, cria o player pelo provider e carrega o manifesto correto', async () => {
    const { facade, video, player, playerProvider, buscarPorId } = criarCenario();

    await facade.prepararVideo('video-1', video);

    expect(buscarPorId.mock.calls).toEqual([['video-1']]);
    expect(playerProvider.mock.calls).toEqual([[video]]);
    expect(player.carregar.mock.calls).toEqual([[dadosDoVideo.manifestoUrl]]);
    expect(player.observar.mock.invocationCallOrder[0]).toBeLessThan(
      player.carregar.mock.invocationCallOrder[0],
    );
  });

  it('registra observadores antes de criar o player e encaminha os eventos', async () => {
    const { facade, video } = criarCenario();
    const listener = vi.fn();
    const remover = facade.observar(listener);

    await facade.prepararVideo('video-1', video);
    await facade.reproduzir();
    facade.pausar();

    expect(listener.mock.calls.map(([evento]) => evento.tipo)).toEqual([
      'carregando', 'pronto', 'reproduzindo', 'pausado',
    ]);

    remover();
    remover();
    facade.pausar();
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('delega reprodução e pausa ao IPlayer preparado', async () => {
    const { facade, video, player } = criarCenario();
    await facade.prepararVideo('video-1', video);

    await facade.reproduzir();
    facade.pausar();

    expect(player.reproduzir).toHaveBeenCalledOnce();
    expect(player.pausar).toHaveBeenCalledOnce();
  });

  it('impede os controles antes de preparar o vídeo', async () => {
    const { facade, player } = criarCenario();

    await expect(facade.reproduzir()).rejects.toMatchObject({ codigo: 'VIDEO_NAO_PREPARADO' });
    expect(() => facade.pausar()).toThrowError(
      expect.objectContaining({ codigo: 'VIDEO_NAO_PREPARADO' }),
    );
    expect(player.reproduzir).not.toHaveBeenCalled();
    expect(player.pausar).not.toHaveBeenCalled();
  });

  it('propaga uma falha de consulta sem criar um player', async () => {
    const { facade, video, buscarPorId, playerProvider } = criarCenario();
    const erro = new Error('Catálogo indisponível.');
    buscarPorId.mockRejectedValueOnce(erro);

    await expect(facade.prepararVideo('video-1', video)).rejects.toBe(erro);
    expect(playerProvider).not.toHaveBeenCalled();
  });

  it('propaga vídeo inexistente sem criar recursos de reprodução', async () => {
    const playerProvider = vi.fn();
    const facade = new ReproducaoFacade(new ServicoDeVideos([]), playerProvider);

    await expect(facade.prepararVideo('inexistente', {} as HTMLVideoElement))
      .rejects.toMatchObject({ codigo: 'VIDEO_NAO_ENCONTRADO' });
    expect(playerProvider).not.toHaveBeenCalled();
  });

  it('propaga uma falha do provider sem alterar sua identidade', async () => {
    const { facade, video, playerProvider } = criarCenario();
    const erro = new PlaybackError('HLS_NAO_SUPORTADO', 'Navegador incompatível.');
    playerProvider.mockImplementationOnce(() => { throw erro; });

    await expect(facade.prepararVideo('video-1', video)).rejects.toBe(erro);
    expect(() => facade.encerrar()).not.toThrow();
  });

  it('propaga o erro de carregamento sem duplicar o evento do Adapter e libera o player', async () => {
    const { facade, video, player, emitir, removerInscricao } = criarCenario();
    const erro = new PlaybackError('CARREGAMENTO_FALHOU', 'Manifesto inválido.');
    const listener = vi.fn();
    facade.observar(listener);
    player.carregar.mockImplementationOnce(async () => {
      emitir({ tipo: 'erro', erro });
      throw erro;
    });

    await expect(facade.prepararVideo('video-1', video)).rejects.toBe(erro);

    expect(listener.mock.calls).toEqual([[{ tipo: 'erro', erro }]]);
    expect(removerInscricao).toHaveBeenCalledOnce();
    expect(player.descartar).toHaveBeenCalledOnce();
    facade.encerrar();
    expect(player.descartar).toHaveBeenCalledOnce();
  });

  it('propaga a rejeição de reprodução sem duplicar o tratamento do Adapter', async () => {
    const { facade, video, player, emitir } = criarCenario();
    const erro = new PlaybackError('REPRODUCAO_FALHOU', 'Autoplay bloqueado.');
    const listener = vi.fn();
    await facade.prepararVideo('video-1', video);
    facade.observar(listener);
    player.reproduzir.mockImplementationOnce(async () => {
      emitir({ tipo: 'erro', erro });
      throw erro;
    });

    await expect(facade.reproduzir()).rejects.toBe(erro);
    expect(listener.mock.calls).toEqual([[{ tipo: 'erro', erro }]]);
  });

  it('encerra uma única vez, remove a inscrição antes de descartar e libera os observadores', async () => {
    const { facade, video, player, emitir, removerInscricao } = criarCenario();
    const listener = vi.fn();
    await facade.prepararVideo('video-1', video);
    facade.observar(listener);

    facade.encerrar();
    facade.encerrar();
    emitir({ tipo: 'reproduzindo' });

    expect(removerInscricao).toHaveBeenCalledOnce();
    expect(player.descartar).toHaveBeenCalledOnce();
    expect(removerInscricao.mock.invocationCallOrder[0]).toBeLessThan(
      player.descartar.mock.invocationCallOrder[0],
    );
    expect(listener.mock.calls).toEqual([[{ tipo: 'descartado' }]]);
  });

  it('permite encerrar uma sessão antes de criar o player', () => {
    const { facade, playerProvider } = criarCenario();
    const listener = vi.fn();
    facade.observar(listener);

    facade.encerrar();
    facade.encerrar();

    expect(playerProvider).not.toHaveBeenCalled();
    expect(listener.mock.calls).toEqual([[{ tipo: 'descartado' }]]);
  });

  it('cancela imediatamente uma consulta pendente e ignora a resposta tardia', async () => {
    const { facade, video, buscarPorId, playerProvider } = criarCenario();
    const consulta = criarPromessaPendente<typeof dadosDoVideo>();
    buscarPorId.mockReturnValueOnce(consulta.promise);
    const preparacao = facade.prepararVideo('video-1', video);
    const expectativa = expect(preparacao).rejects.toMatchObject({ codigo: 'CARREGAMENTO_CANCELADO' });

    facade.encerrar();
    await expectativa;
    expect(playerProvider).not.toHaveBeenCalled();

    consulta.resolver(dadosDoVideo);
    await consulta.promise;
    await Promise.resolve();
    expect(playerProvider).not.toHaveBeenCalled();
  });

  it('trata a rejeição tardia de uma consulta já cancelada', async () => {
    const { facade, video, buscarPorId, playerProvider } = criarCenario();
    const consulta = criarPromessaPendente<typeof dadosDoVideo>();
    buscarPorId.mockReturnValueOnce(consulta.promise);
    const preparacao = facade.prepararVideo('video-1', video);
    const expectativa = expect(preparacao).rejects.toMatchObject({ codigo: 'CARREGAMENTO_CANCELADO' });

    facade.encerrar();
    await expectativa;
    consulta.rejeitar(new Error('Resposta tardia do catálogo.'));
    await Promise.resolve();
    await Promise.resolve();
    expect(playerProvider).not.toHaveBeenCalled();
  });

  it('cancela o carregamento pendente e não encaminha eventos depois do encerramento', async () => {
    const { facade, video, player, emitir } = criarCenario();
    const carregamento = criarPromessaPendente<void>();
    player.carregar.mockReturnValueOnce(carregamento.promise);
    const listener = vi.fn();
    facade.observar(listener);
    const preparacao = facade.prepararVideo('video-1', video);
    const expectativa = expect(preparacao).rejects.toMatchObject({ codigo: 'CARREGAMENTO_CANCELADO' });
    await Promise.resolve();
    expect(player.carregar).toHaveBeenCalledOnce();

    facade.encerrar();
    await expectativa;
    carregamento.resolver(undefined);
    await Promise.resolve();
    emitir({ tipo: 'pronto', manifestoUrl: dadosDoVideo.manifestoUrl });

    expect(player.descartar).toHaveBeenCalledOnce();
    expect(listener.mock.calls).toEqual([[{ tipo: 'descartado' }]]);
  });

  it('tolera encerramento solicitado por um observador durante o carregamento', async () => {
    const { facade, video, player } = criarCenario();
    facade.observar((evento) => {
      if (evento.tipo === 'carregando') facade.encerrar();
    });

    await expect(facade.prepararVideo('video-1', video))
      .rejects.toMatchObject({ codigo: 'CARREGAMENTO_CANCELADO' });
    expect(player.descartar).toHaveBeenCalledOnce();
  });

  it('impede iniciar dois vídeos na mesma sessão, inclusive durante a consulta', async () => {
    const { facade, video, buscarPorId, playerProvider } = criarCenario();
    const consulta = criarPromessaPendente<typeof dadosDoVideo>();
    buscarPorId.mockReturnValueOnce(consulta.promise);
    const preparacao = facade.prepararVideo('video-1', video);

    await expect(facade.prepararVideo('video-2', video))
      .rejects.toMatchObject({ codigo: 'SESSAO_JA_INICIADA' });
    consulta.resolver(dadosDoVideo);
    await preparacao;
    await expect(facade.prepararVideo('video-2', video))
      .rejects.toMatchObject({ codigo: 'SESSAO_JA_INICIADA' });
    expect(playerProvider).toHaveBeenCalledOnce();
  });

  it('impede todas as operações de uma sessão encerrada, exceto encerrar novamente', async () => {
    const { facade, video, playerProvider } = criarCenario();
    facade.encerrar();

    await expect(facade.prepararVideo('video-1', video)).rejects.toMatchObject({ codigo: 'SESSAO_ENCERRADA' });
    await expect(facade.reproduzir()).rejects.toMatchObject({ codigo: 'SESSAO_ENCERRADA' });
    expect(() => facade.pausar()).toThrowError(expect.objectContaining({ codigo: 'SESSAO_ENCERRADA' }));
    expect(() => facade.observar(vi.fn())).toThrowError(expect.objectContaining({ codigo: 'SESSAO_ENCERRADA' }));
    expect(playerProvider).not.toHaveBeenCalled();
  });
});
