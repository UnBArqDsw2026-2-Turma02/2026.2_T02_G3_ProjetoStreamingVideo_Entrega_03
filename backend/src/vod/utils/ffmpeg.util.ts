import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface WebVideoTranscodeOptions {
  inputPath: string;
  outputPath: string;
  resolucao: string;
  duracaoSegundos?: number;
}

export interface HlsTranscodeOptions {
  inputPath: string;
  playlistPath: string;
  segmentPattern: string;
  resolucao: string;
  duracaoSegmento?: number;
  duracaoSegundos?: number;
}

export interface HlsVariantInfo {
  resolucao: string;
  relativePlaylistPath: string;
  width?: number;
  height?: number;
  bandwidth?: number;
}

/**
 * Converte uma resolução em string (ex: '720p', '1080p', '1280x720')
 * no filtro de redimensionamento correspondente do FFmpeg.
 */
export function normalizarResolucao(resolucao: string): string {
  const matchP = resolucao.match(/^(\d+)p$/i);
  if (matchP) {
    const height = parseInt(matchP[1], 10);
    return `scale=-2:${height}`;
  }

  const matchDim = resolucao.match(/^(\d+)x(\d+)$/i);
  if (matchDim) {
    const width = parseInt(matchDim[1], 10);
    const height = parseInt(matchDim[2], 10);
    return `scale=${width}:${height}`;
  }

  const matchNum = resolucao.match(/^(\d+)$/);
  if (matchNum) {
    const height = parseInt(matchNum[1], 10);
    return `scale=-2:${height}`;
  }

  // Fallback padrão: 720p
  return 'scale=-2:720';
}

/**
 * Retorna dimensões e bitrate estimado para uso na Master Playlist do HLS (RFC 8216).
 */
export function obterMetadadosResolucao(resolucao: string): {
  width: number;
  height: number;
  bandwidth: number;
} {
  const norm = resolucao.toLowerCase().trim();
  switch (norm) {
    case '1080p':
      return { width: 1920, height: 1080, bandwidth: 2800000 };
    case '720p':
      return { width: 1280, height: 720, bandwidth: 1400000 };
    case '480p':
      return { width: 854, height: 480, bandwidth: 800000 };
    case '360p':
      return { width: 640, height: 360, bandwidth: 400000 };
    case '240p':
      return { width: 426, height: 240, bandwidth: 250000 };
    default: {
      const matchDim = norm.match(/^(\d+)x(\d+)$/);
      if (matchDim) {
        const width = parseInt(matchDim[1], 10);
        const height = parseInt(matchDim[2], 10);
        const bandwidth = Math.round(width * height * 1.5);
        return { width, height, bandwidth };
      }
      const matchP = norm.match(/^(\d+)p?$/);
      if (matchP) {
        const height = parseInt(matchP[1], 10);
        const width = Math.round((height * 16) / 9);
        const bandwidth = Math.round(width * height * 1.5);
        return { width, height, bandwidth };
      }
      return { width: 1280, height: 720, bandwidth: 1400000 };
    }
  }
}

/**
 * Executa o comando FFmpeg via child_process de forma assíncrona.
 */
export function executarFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegProc = spawn('ffmpeg', args);
    let stderrOutput = '';

    ffmpegProc.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    ffmpegProc.on('error', (err) => {
      reject(new Error(`Falha ao iniciar o processo FFmpeg: ${err.message}`));
    });

    ffmpegProc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `FFmpeg falhou com código de saída ${code}.\nDetalhes do erro:\n${stderrOutput.slice(-800)}`,
          ),
        );
      }
    });
  });
}

/**
 * Executa a transcodificação para formato MP4 voltado para a Web (+faststart).
 */
export async function executarFfmpegWebVideo(options: WebVideoTranscodeOptions): Promise<void> {
  const outputDir = path.dirname(options.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const scaleFilter = normalizarResolucao(options.resolucao);
  const args: string[] = ['-y'];

  if (options.duracaoSegundos && options.duracaoSegundos > 0) {
    args.push('-t', options.duracaoSegundos.toString());
  }

  args.push(
    '-i',
    options.inputPath,
    '-vf',
    scaleFilter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    options.outputPath,
  );

  await executarFfmpeg(args);
}

/**
 * Executa a transcodificação para formato HLS (m3u8 + ts).
 */
export async function executarFfmpegHls(options: HlsTranscodeOptions): Promise<void> {
  const outputDir = path.dirname(options.playlistPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const scaleFilter = normalizarResolucao(options.resolucao);
  const segmento = options.duracaoSegmento && options.duracaoSegmento > 0 ? options.duracaoSegmento : 4;
  const args: string[] = ['-y'];

  if (options.duracaoSegundos && options.duracaoSegundos > 0) {
    args.push('-t', options.duracaoSegundos.toString());
  }

  args.push(
    '-i',
    options.inputPath,
    '-vf',
    scaleFilter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-hls_time',
    segmento.toString(),
    '-hls_playlist_type',
    'vod',
    '-hls_segment_filename',
    options.segmentPattern,
    options.playlistPath,
  );

  await executarFfmpeg(args);
}

/**
 * Gera o arquivo master.m3u8 que referencia as playlists individuais de cada variante de resolução.
 * Esse formato é o padrão consumido pelo hls.js (RFC 8216) para seleção manual ou adaptativa (ABR).
 */
export function gerarMasterPlaylistHls(
  masterPlaylistPath: string,
  variantes: HlsVariantInfo[],
): void {
  const outputDir = path.dirname(masterPlaylistPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let conteudo = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-INDEPENDENT-SEGMENTS\n\n';

  for (const v of variantes) {
    const meta = obterMetadadosResolucao(v.resolucao);
    const width = v.width ?? meta.width;
    const height = v.height ?? meta.height;
    const bandwidth = v.bandwidth ?? meta.bandwidth;

    conteudo += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height},NAME="${v.resolucao}"\n`;
    conteudo += `${v.relativePlaylistPath}\n\n`;
  }

  fs.writeFileSync(masterPlaylistPath, conteudo.trim() + '\n', 'utf-8');
}
