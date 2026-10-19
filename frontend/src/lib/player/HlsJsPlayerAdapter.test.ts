import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HlsJsPlayerAdapter } from './HlsJsPlayerAdapter';
import { PlaybackError } from './playback.types';

const hlsMock = vi.hoisted(() => {
  type Listener = (evento: string, dados?: unknown) => void;

  const instancias: MockHls[] = [];

  class MockHls {
    static readonly isSupported = vi.fn(() => true);

    readonly loadSource = vi.fn();
    readonly attachMedia = vi.fn();
    readonly destroy = vi.fn();
    private readonly listeners = new Map<string, Set<Listener>>();

    readonly on = vi.fn((evento: string, listener: Listener) => {
      const listenersDoEvento = this.listeners.get(evento) ?? new Set();
      listenersDoEvento.add(listener);
      this.listeners.set(evento, listenersDoEvento);
    });

    readonly off = vi.fn((evento: string, listener: Listener) => {
      this.listeners.get(evento)?.delete(listener);
    });

    constructor() {
      instancias.push(this);
    }

    emitir(evento: string, dados?: unknown): void {
      for (const listener of Array.from(this.listeners.get(evento) ?? [])) {
        listener(evento, dados);
      }
    }
  }

  return {
    eventos: {
      MANIFEST_PARSED: 'hlsManifestParsed',
      ERROR: 'hlsError',
    },
    instancias,
    MockHls,
  };
});

vi.mock('hls.js', () => ({
  default: hlsMock.MockHls,
  Events: hlsMock.eventos,
}));

function criarVideo() {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  } as unknown as HTMLVideoElement;
}

function ultimaInstanciaHls() {
  return hlsMock.instancias.at(-1)!;
}

beforeEach(() => {
  vi.stubGlobal('window', {});
  hlsMock.instancias.length = 0;
  hlsMock.MockHls.isSupported.mockReset().mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('HlsJsPlayerAdapter', () => {
  it('implementa as operações definidas por IPlayer', () => {
    const adapter = new HlsJsPlayerAdapter(criarVideo());

    expect(adapter.carregar).toBeTypeOf('function');
    expect(adapter.reproduzir).toBeTypeOf('function');
    expect(adapter.pausar).toBeTypeOf('function');
    expect(adapter.observar).toBeTypeOf('function');
    expect(adapter.descartar).toBeTypeOf('function');
  });

  it('traduz carregar para loadSource e attachMedia e aguarda o manifesto', async () => {
    const video = criarVideo();
    const adapter = new HlsJsPlayerAdapter(video);
    const hls = ultimaInstanciaHls();

    const carregamento = adapter.carregar('https://exemplo.test/video.m3u8');

    expect(hls.loadSource).toHaveBeenCalledWith(
      'https://exemplo.test/video.m3u8',
    );
    expect(hls.attachMedia).toHaveBeenCalledWith(video);

    hls.emitir(hlsMock.eventos.MANIFEST_PARSED);

    await expect(carregamento).resolves.toBeUndefined();
  });

  it('delega reprodução e pausa ao HTMLVideoElement', async () => {
    const video = criarVideo();
    const adapter = new HlsJsPlayerAdapter(video);

    await adapter.reproduzir();
    adapter.pausar();

    expect(video.play).toHaveBeenCalledOnce();
    expect(video.pause).toHaveBeenCalledOnce();
  });

  it('normaliza e encaminha os eventos de reprodução', async () => {
    const video = criarVideo();
    const adapter = new HlsJsPlayerAdapter(video);
    const hls = ultimaInstanciaHls();
    const listener = vi.fn();
    const pararDeObservar = adapter.observar(listener);

    const carregamento = adapter.carregar('https://exemplo.test/video.m3u8');
    hls.emitir(hlsMock.eventos.MANIFEST_PARSED);
    await carregamento;
    await adapter.reproduzir();
    adapter.pausar();

    expect(listener.mock.calls.map(([evento]) => evento.tipo)).toEqual([
      'carregando',
      'pronto',
      'reproduzindo',
      'pausado',
    ]);

    pararDeObservar();
    adapter.pausar();
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('rejeita o carregamento quando o hls.js emite erro fatal', async () => {
    const adapter = new HlsJsPlayerAdapter(criarVideo());
    const hls = ultimaInstanciaHls();
    const listener = vi.fn();
    adapter.observar(listener);

    const carregamento = adapter.carregar('https://exemplo.test/invalido.m3u8');
    hls.emitir(hlsMock.eventos.ERROR, {
      fatal: true,
      type: 'networkError',
      details: 'manifestLoadError',
    });

    await expect(carregamento).rejects.toMatchObject({
      codigo: 'CARREGAMENTO_FALHOU',
    });
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ tipo: 'erro' }),
    );
  });

  it('normaliza a rejeição de play, incluindo bloqueio de autoplay', async () => {
    const video = criarVideo();
    const bloqueio = new DOMException(
      'A reprodução automática foi bloqueada.',
      'NotAllowedError',
    );
    vi.mocked(video.play).mockRejectedValueOnce(bloqueio);
    const adapter = new HlsJsPlayerAdapter(video);

    await expect(adapter.reproduzir()).rejects.toMatchObject({
      codigo: 'REPRODUCAO_FALHOU',
      causa: bloqueio,
    });
  });

  it('remove listeners e destrói o hls.js uma única vez', () => {
    const adapter = new HlsJsPlayerAdapter(criarVideo());
    const hls = ultimaInstanciaHls();
    const listener = vi.fn();
    adapter.observar(listener);

    adapter.descartar();
    adapter.descartar();

    expect(hls.off).toHaveBeenCalledTimes(2);
    expect(hls.destroy).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ tipo: 'descartado' });
    expect(() => adapter.pausar()).toThrowError(PlaybackError);
  });

  it('cancela uma Promise de carregamento pendente ao descartar', async () => {
    const adapter = new HlsJsPlayerAdapter(criarVideo());
    const carregamento = adapter.carregar('https://exemplo.test/video.m3u8');

    adapter.descartar();

    await expect(carregamento).rejects.toMatchObject({
      codigo: 'CARREGAMENTO_CANCELADO',
    });
  });

  it('rejeita o carregamento que excede o tempo limite', async () => {
    vi.useFakeTimers();
    const adapter = new HlsJsPlayerAdapter(criarVideo());
    const carregamento = adapter.carregar('https://exemplo.test/video.m3u8');
    const expectativa = expect(carregamento).rejects.toMatchObject({
      codigo: 'TEMPO_LIMITE_CARREGAMENTO',
    });

    await vi.advanceTimersByTimeAsync(30_000);

    await expectativa;
  });

  it('não inicia o HLS se um observador descartar durante o evento carregando', async () => {
    const adapter = new HlsJsPlayerAdapter(criarVideo());
    const hls = ultimaInstanciaHls();
    adapter.observar((evento) => {
      if (evento.tipo === 'carregando') adapter.descartar();
    });

    await expect(adapter.carregar('https://exemplo.test/video.m3u8')).rejects.toMatchObject({
      codigo: 'CARREGAMENTO_CANCELADO',
    });
    expect(hls.loadSource).not.toHaveBeenCalled();
    expect(hls.attachMedia).not.toHaveBeenCalled();
    expect(hls.destroy).toHaveBeenCalledOnce();
  });

  it('impede a criação fora do navegador e quando hls.js não é suportado', () => {
    vi.unstubAllGlobals();
    expect(() => new HlsJsPlayerAdapter(criarVideo())).toThrowError(
      expect.objectContaining({ codigo: 'AMBIENTE_INDISPONIVEL' }),
    );

    vi.stubGlobal('window', {});
    hlsMock.MockHls.isSupported.mockReturnValue(false);
    expect(() => new HlsJsPlayerAdapter(criarVideo())).toThrowError(
      expect.objectContaining({ codigo: 'HLS_NAO_SUPORTADO' }),
    );
  });
});
