import * as path from 'path';
import * as fs from 'fs';
import {
  Video,
  WebVideoJobBuilder,
  HlsJobBuilder,
  WebVideoPlayerFactory,
  HlsPlayerFactory,
  WebVideoPlayer,
  HlsPlayer,
  HttpCarregadorSegmentos,
  P2PCarregadorSegmentos,
} from '../index';

function findProjectRoot(): string {
  let curr = __dirname;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'media', 'vod', 'raw_video.mp4'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd(), process.cwd().endsWith('backend') ? '..' : '.');
}

describe('VOD Reprodução - GoF Criacional (Abstract Factory)', () => {
  const projectRoot = findProjectRoot();
  const rawVideoPath = path.resolve(projectRoot, 'docs/Base/Relatórios/SubEquipe_01/assets/raw_video.mp4');
  const testOutputDir = path.resolve(projectRoot, 'media/vod/test_output/assistir');
  const video = new Video(rawVideoPath);

  beforeAll(async () => {
    // Pré-requisito: vídeo transcodificado nos dois formatos (Builder do módulo de transcodificação)
    await video.solicitarTranscodificacao(
      new WebVideoJobBuilder()
        .setVideo(rawVideoPath)
        .setResolucao('360p')
        .setOutputDir(path.resolve(testOutputDir, 'web'))
        .setDuracaoSegundos(4),
    );
    await video.solicitarTranscodificacao(
      new HlsJobBuilder()
        .setVideo(rawVideoPath)
        .setResolucoes(['480p', '360p'])
        .setOutputDir(path.resolve(testOutputDir, 'hls'))
        .setSegmentDuration(2)
        .setDuracaoSegundos(6),
    );
  }, 60000);

  beforeEach(() => {
    P2PCarregadorSegmentos.limparSwarms();
  });

  describe('Fábricas concretas criam famílias consistentes', () => {
    it('WebVideoPlayerFactory deve criar WebVideoPlayer com HttpCarregadorSegmentos', () => {
      const fabrica = new WebVideoPlayerFactory();
      const player = fabrica.criarPlayer('/videos/aula_720p.mp4');

      expect(player).toBeInstanceOf(WebVideoPlayer);
      expect(player.getCarregador()).toBeInstanceOf(HttpCarregadorSegmentos);
      expect(fabrica.criarCarregador()).toBeInstanceOf(HttpCarregadorSegmentos);
    });

    it('HlsPlayerFactory deve criar HlsPlayer com P2PCarregadorSegmentos', () => {
      const fabrica = new HlsPlayerFactory('wss://tracker.teste/socket');
      const player = fabrica.criarPlayer('/videos/aula/master.m3u8');

      expect(player).toBeInstanceOf(HlsPlayer);
      const carregador = player.getCarregador() as P2PCarregadorSegmentos;
      expect(carregador).toBeInstanceOf(P2PCarregadorSegmentos);
      expect(carregador.getTrackerUrl()).toBe('wss://tracker.teste/socket');
    });

    it('cada player deve receber um carregador próprio', () => {
      const fabrica = new HlsPlayerFactory();
      const p1 = fabrica.criarPlayer('/a/master.m3u8');
      const p2 = fabrica.criarPlayer('/a/master.m3u8');
      expect(p1.getCarregador()).not.toBe(p2.getCarregador());
    });
  });

  describe('Entidade Cliente Video.assistir()', () => {
    it('deve usar urlWebVideo com a fábrica WebVideo e urlHLS com a fábrica HLS', () => {
      const playerWeb = video.assistir(new WebVideoPlayerFactory()) as WebVideoPlayer;
      const playerHls = video.assistir(new HlsPlayerFactory()) as HlsPlayer;

      expect(playerWeb).toBeInstanceOf(WebVideoPlayer);
      expect(playerWeb.getVideoUrl()).toBe(video.getUrlWebVideo());
      expect(playerHls).toBeInstanceOf(HlsPlayer);
      expect(playerHls.getVideoUrl()).toBe(video.getUrlHLS());
    });

    it('deve lançar erro se o vídeo não foi transcodificado para o formato', () => {
      const videoNaoTranscodificado = new Video(rawVideoPath);
      expect(() => videoNaoTranscodificado.assistir(new HlsPlayerFactory())).toThrow(
        /ainda não foi transcodificado/,
      );
    });
  });

  describe('Reprodução WebVideo', () => {
    it('deve baixar o MP4 via HTTP e reproduzir', async () => {
      const player = video.assistir(new WebVideoPlayerFactory()) as WebVideoPlayer;
      const resumo = await player.reproduzir();

      expect(resumo).toContain('WebVideo 360p');
      expect(player.getEstado()).toBe('REPRODUZINDO');
      const carregador = player.getCarregador() as HttpCarregadorSegmentos;
      expect(carregador.getTotalRequisicoes()).toBe(1);
      expect(carregador.getTotalBytes()).toBeGreaterThan(1024);

      player.pausar();
      expect(player.getEstado()).toBe('PAUSADO');
    });

    it('deve recusar troca para resolução sem arquivo correspondente', () => {
      const player = video.assistir(new WebVideoPlayerFactory());
      expect(() => player.setResolucao('1080p')).toThrow(/Não existe arquivo WebVideo em 1080p/);
    });
  });

  describe('Reprodução HLS', () => {
    it('deve ler a Master Playlist e reproduzir todos os segmentos', async () => {
      const player = video.assistir(new HlsPlayerFactory()) as HlsPlayer;
      const resumo = await player.reproduzir();

      expect(player.getResolucoesDisponiveis()).toEqual(['480p', '360p']);
      expect(player.getResolucao()).toBe('480p');
      expect(player.getEstado()).toBe('FINALIZADO');
      expect(player.getSegmentosReproduzidos().length).toBeGreaterThan(0);
      expect(player.getPosicao()).toBeGreaterThan(5);
      expect(resumo).toContain('HLS 480p');
    });

    it('segundo espectador deve receber os segmentos via P2P do primeiro', async () => {
      const fabrica = new HlsPlayerFactory();

      const espectador1 = video.assistir(fabrica) as HlsPlayer;
      await espectador1.reproduzir();
      const c1 = espectador1.getCarregador() as P2PCarregadorSegmentos;
      expect(c1.getSegmentosViaHttp()).toBeGreaterThan(0);
      expect(c1.getSegmentosViaP2P()).toBe(0);

      const espectador2 = video.assistir(fabrica) as HlsPlayer;
      await espectador2.reproduzir();
      const c2 = espectador2.getCarregador() as P2PCarregadorSegmentos;
      expect(c2.getSegmentosViaP2P()).toBe(c1.getSegmentosViaHttp());
      expect(c2.getSegmentosViaHttp()).toBe(0);
    });

    it('deve trocar de resolução e continuar a partir da posição buscada', async () => {
      const player = video.assistir(new HlsPlayerFactory()) as HlsPlayer;
      await player.reproduzir();

      player.buscar(2);
      player.setResolucao('360p');
      await player.reproduzir();

      expect(player.getResolucao()).toBe('360p');

      // Calcula, pela playlist da variante, qual segmento contém o segundo 2
      const playlist360 = fs.readFileSync(
        path.resolve(path.dirname(video.getUrlHLS()), '360p', 'index.m3u8'),
        'utf-8',
      );
      const linhas = playlist360.split('\n');
      const segmentos: { duracao: number; uri: string }[] = [];
      linhas.forEach((linha, i) => {
        const m = linha.match(/^#EXTINF:([\d.]+)/);
        if (m) segmentos.push({ duracao: parseFloat(m[1]), uri: linhas[i + 1].trim() });
      });
      let acumulado = 0;
      let inicio = 0;
      while (acumulado + segmentos[inicio].duracao <= 2) acumulado += segmentos[inicio++].duracao;

      const segmentos360 = player.getSegmentosReproduzidos().filter((s) => s.startsWith('360p/'));
      expect(segmentos360[0]).toBe(`360p/${segmentos[inicio].uri}`);
      expect(segmentos360.length).toBe(segmentos.length - inicio);
    });

    it('deve recusar resolução inexistente na Master Playlist', async () => {
      const player = video.assistir(new HlsPlayerFactory());
      await player.reproduzir();
      expect(() => player.setResolucao('1080p')).toThrow(/Resolução 1080p indisponível/);
    });
  });
});
