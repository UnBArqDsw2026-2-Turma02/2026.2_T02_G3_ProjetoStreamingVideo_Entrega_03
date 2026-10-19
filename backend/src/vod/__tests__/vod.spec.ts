import * as path from 'path';
import * as fs from 'fs';
import {
  Video,
  WebVideoJobBuilder,
  HlsJobBuilder,
  JobWebVideo,
  JobHLS,
  normalizarResolucao,
  obterMetadadosResolucao,
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

describe('VOD Transcoding Architecture - GoF Criacional (Builder & Prototype)', () => {
  const projectRoot = findProjectRoot();
  const rawVideoPath = path.resolve(
    projectRoot,
    'media/vod/raw_video.mp4',
  );
  const testOutputDir = path.resolve(projectRoot, 'media/vod/test_output');

  beforeAll(() => {
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  describe('Normalização de Resolução e Metadados HLS', () => {
    it('deve normalizar formato com sufixo p (ex: 720p, 1080p, 480p)', () => {
      expect(normalizarResolucao('1080p')).toBe('scale=-2:1080');
      expect(normalizarResolucao('720p')).toBe('scale=-2:720');
      expect(normalizarResolucao('480p')).toBe('scale=-2:480');
      expect(normalizarResolucao('360p')).toBe('scale=-2:360');
    });

    it('deve normalizar formato largura x altura (ex: 1280x720)', () => {
      expect(normalizarResolucao('1280x720')).toBe('scale=1280:720');
      expect(normalizarResolucao('1920x1080')).toBe('scale=1920:1080');
    });

    it('deve normalizar formato numérico simples (ex: 720)', () => {
      expect(normalizarResolucao('720')).toBe('scale=-2:720');
    });

    it('deve obter metadados de largura, altura e bitrate para Master Playlist', () => {
      const meta720 = obterMetadadosResolucao('720p');
      expect(meta720.width).toBe(1280);
      expect(meta720.height).toBe(720);
      expect(meta720.bandwidth).toBeGreaterThan(1000000);

      const meta360 = obterMetadadosResolucao('360p');
      expect(meta360.width).toBe(640);
      expect(meta360.height).toBe(360);
      expect(meta360.bandwidth).toBeLessThan(meta720.bandwidth);
    });
  });

  describe('Padrão Builder (WebVideoJobBuilder & HlsJobBuilder)', () => {
    it('WebVideoJobBuilder deve construir uma instância válida de JobWebVideo', () => {
      const builder = new WebVideoJobBuilder();
      const job = builder
        .setVideo(rawVideoPath)
        .setResolucao('480p')
        .setOutputDir(testOutputDir)
        .setDuracaoSegundos(3)
        .build();

      expect(job).toBeInstanceOf(JobWebVideo);
      expect(job.getVideoUrl()).toBe(rawVideoPath);
      expect(job.getResolucao()).toBe('480p');
      expect(job.getOutputDir()).toBe(testOutputDir);
      expect(job.getDuracaoSegundos()).toBe(3);

      // Builder deve resetar após o build
      const novoJob = builder.build();
      expect(novoJob.getVideoUrl()).toBe('');
      expect(novoJob.getResolucao()).toBe('720p');
    });

    it('HlsJobBuilder deve construir uma instância válida de JobHLS com suporte a multi-resolução', () => {
      const builder = new HlsJobBuilder();
      const job = builder
        .setVideo(rawVideoPath)
        .setResolucoes(['1080p', '720p'])
        .addResolucao('480p')
        .setOutputDir(testOutputDir)
        .setSegmentDuration(6)
        .setDuracaoSegundos(4)
        .build();

      expect(job).toBeInstanceOf(JobHLS);
      expect(job.getVideoUrl()).toBe(rawVideoPath);
      expect(job.getResolucao()).toBe('1080p');
      expect(job.getResolucoes()).toEqual(['1080p', '720p', '480p']);
      expect(job.getOutputDir()).toBe(testOutputDir);
      expect(job.getDuracaoSegmento()).toBe(6);
      expect(job.getDuracaoSegundos()).toBe(4);
    });
  });

  describe('Padrão Prototype (JobWebVideo & JobHLS)', () => {
    it('JobWebVideo.clone deve criar uma cópia independente com mesmos atributos', () => {
      const jobOriginal = new JobWebVideo(rawVideoPath, '720p', testOutputDir, 5);
      const jobClonado = jobOriginal.clone();

      expect(jobClonado).toBeInstanceOf(JobWebVideo);
      expect(jobClonado).not.toBe(jobOriginal); // referências diferentes
      expect(jobClonado.getVideoUrl()).toBe(jobOriginal.getVideoUrl());
      expect(jobClonado.getResolucao()).toBe(jobOriginal.getResolucao());
      expect(jobClonado.getOutputDir()).toBe(jobOriginal.getOutputDir());

      // Alterar a resolução no clone não afeta o protótipo original
      jobClonado.setResolucao('360p');
      expect(jobClonado.getResolucao()).toBe('360p');
      expect(jobOriginal.getResolucao()).toBe('720p');
    });

    it('JobHLS.clone deve criar uma cópia independente com mesmas resoluções e atributos', () => {
      const jobOriginal = new JobHLS(rawVideoPath, ['720p', '360p'], testOutputDir, 5, 4);
      const jobClonado = jobOriginal.clone();

      expect(jobClonado).toBeInstanceOf(JobHLS);
      expect(jobClonado).not.toBe(jobOriginal);
      expect(jobClonado.getResolucoes()).toEqual(['720p', '360p']);
      expect(jobClonado.getDuracaoSegmento()).toBe(4);

      jobClonado.setResolucao('480p');
      jobClonado.setDuracaoSegmento(2);

      expect(jobClonado.getResolucoes()).toEqual(['480p']);
      expect(jobClonado.getDuracaoSegmento()).toBe(2);
      expect(jobOriginal.getResolucoes()).toEqual(['720p', '360p']);
      expect(jobOriginal.getDuracaoSegmento()).toBe(4);
    });
  });

  describe('Gerenciamento de Múltiplas Resoluções WebVideo na Entidade Video', () => {
    it('deve armazenar e recuperar múltiplas URLs de WebVideo por resolução', () => {
      const video = new Video('/fake/orig.mp4');

      video.setUrlWebVideo('1080p', '/media/vod/web/orig_1080p.mp4');
      video.setUrlWebVideo('720p', '/media/vod/web/orig_720p.mp4');
      video.setUrlWebVideo('360p', '/media/vod/web/orig_360p.mp4');

      // Aplicação cliente seleciona resolução específica
      expect(video.getUrlWebVideo('1080p')).toBe('/media/vod/web/orig_1080p.mp4');
      expect(video.getUrlWebVideo('720p')).toBe('/media/vod/web/orig_720p.mp4');
      expect(video.getUrlWebVideo('360p')).toBe('/media/vod/web/orig_360p.mp4');
      expect(video.getUrlWebVideo('480p')).toBe(''); // Resolução não transcodificada

      // Verificação de disponibilidade e lista de resoluções
      expect(video.hasResolucaoWebVideo('720p')).toBe(true);
      expect(video.hasResolucaoWebVideo('480p')).toBe(false);
      expect(video.getResolucoesDisponiveisWebVideo()).toEqual(['1080p', '720p', '360p']);

      // Mapa completo de URLs
      const mapUrls = video.getUrlsWebVideo();
      expect(mapUrls.size).toBe(3);
      expect(mapUrls.get('720p')).toBe('/media/vod/web/orig_720p.mp4');

      // Fallback sem parâmetro retorna a primeira URL disponível
      expect(video.getUrlWebVideo()).toBe('/media/vod/web/orig_1080p.mp4');
    });
  });

  describe('Entidade Cliente Video e Execução de Transcodificação', () => {
    it('deve transcodificar WebVideo MP4 utilizando raw_video.mp4 e atualizar urlWebVideo', async () => {
      expect(fs.existsSync(rawVideoPath)).toBe(true);

      const video = new Video(rawVideoPath);
      const builder = new WebVideoJobBuilder();
      builder
        .setResolucao('360p')
        .setOutputDir(path.resolve(testOutputDir, 'web'))
        .setDuracaoSegundos(3);

      const resultadoPath = await video.solicitarTranscodificacao(builder);

      expect(resultadoPath).toBeTruthy();
      expect(fs.existsSync(resultadoPath)).toBe(true);
      expect(resultadoPath.endsWith('.mp4')).toBe(true);
      expect(video.getUrlWebVideo()).toBe(resultadoPath);

      const stats = fs.statSync(resultadoPath);
      expect(stats.size).toBeGreaterThan(1024); // Arquivo gerado possui dados reais
    }, 30000);

    it('deve transcodificar HLS com Master Playlist unificada e sub-playlists por resolução', async () => {
      expect(fs.existsSync(rawVideoPath)).toBe(true);

      const video = new Video(rawVideoPath);
      const builder = new HlsJobBuilder();
      builder
        .setVideo(rawVideoPath)
        .setResolucoes(['720p', '360p'])
        .setOutputDir(path.resolve(testOutputDir, 'hls_multi'))
        .setSegmentDuration(2)
        .setDuracaoSegundos(4);

      const masterPlaylistPath = await video.solicitarTranscodificacao(builder);

      expect(masterPlaylistPath).toBeTruthy();
      expect(fs.existsSync(masterPlaylistPath)).toBe(true);
      expect(masterPlaylistPath.endsWith('master.m3u8')).toBe(true);
      expect(video.getUrlHLS()).toBe(masterPlaylistPath);

      // Verificar conteúdo da Master Playlist
      const conteudoMaster = fs.readFileSync(masterPlaylistPath, 'utf-8');
      expect(conteudoMaster).toContain('#EXTM3U');
      expect(conteudoMaster).toContain('#EXT-X-STREAM-INF');
      expect(conteudoMaster).toContain('RESOLUTION=1280x720');
      expect(conteudoMaster).toContain('720p/index.m3u8');
      expect(conteudoMaster).toContain('RESOLUTION=640x360');
      expect(conteudoMaster).toContain('360p/index.m3u8');

      // Verificar se subdiretórios das variantes contêm as playlists e segmentos .ts
      const masterDir = path.dirname(masterPlaylistPath);

      const playlist720p = path.resolve(masterDir, '720p', 'index.m3u8');
      expect(fs.existsSync(playlist720p)).toBe(true);
      const ts720Files = fs.readdirSync(path.resolve(masterDir, '720p')).filter((f) => f.endsWith('.ts'));
      expect(ts720Files.length).toBeGreaterThan(0);

      const playlist360p = path.resolve(masterDir, '360p', 'index.m3u8');
      expect(fs.existsSync(playlist360p)).toBe(true);
      const ts360Files = fs.readdirSync(path.resolve(masterDir, '360p')).filter((f) => f.endsWith('.ts'));
      expect(ts360Files.length).toBeGreaterThan(0);
    }, 30000);

    it('deve usar o Prototype para gerar variantes de múltiplas resoluções', async () => {
      const video = new Video(rawVideoPath);
      const jobPrototipo = new JobWebVideo(
        rawVideoPath,
        '720p',
        path.resolve(testOutputDir, 'variantes'),
        2, // 2 segundos para rapidez de teste
      );

      const resolucoes = ['360p', '480p'];
      const caminhos = await video.solicitarVariantesResolucao(jobPrototipo, resolucoes);

      expect(caminhos.length).toBe(2);
      for (const p of caminhos) {
        expect(fs.existsSync(p)).toBe(true);
        expect(fs.statSync(p).size).toBeGreaterThan(500);
      }
    }, 30000);

    it('deve lançar erro se o arquivo de vídeo não existir', async () => {
      const video = new Video('/caminho/inexistente/video.mp4');
      const builder = new WebVideoJobBuilder();
      builder.setResolucao('360p');

      await expect(video.solicitarTranscodificacao(builder)).rejects.toThrow(
        /Arquivo de vídeo de entrada não encontrado/,
      );
    });
  });
});
