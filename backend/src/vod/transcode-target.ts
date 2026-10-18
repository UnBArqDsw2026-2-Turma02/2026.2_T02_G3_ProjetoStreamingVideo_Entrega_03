import * as path from 'path';
import * as fs from 'fs';
import {
  Video,
  WebVideoJobBuilder,
  HlsJobBuilder,
  JobWebVideo,
} from './index';

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

async function main() {
  console.log('=====================================================');
  console.log('🎥 VOD Transcoding Pipeline - GoF Criacional Demo');
  console.log('   Padrões: Builder + Prototype');
  console.log('=====================================================\n');

  const projectRoot = findProjectRoot();
  // Localiza o vídeo alvo indicado nos requisitos
  const rawVideoPath = path.resolve(
    projectRoot,
    'docs/Base/Relatórios/SubEquipe_01/assets/raw_video.mp4',
  );

  if (!fs.existsSync(rawVideoPath)) {
    console.error(`❌ Erro: Vídeo de origem não encontrado em: ${rawVideoPath}`);
    process.exit(1);
  }

  const outputBaseDir = path.resolve(projectRoot, 'media/vod');
  const webOutputDir = path.resolve(outputBaseDir, 'web');
  const hlsOutputDir = path.resolve(outputBaseDir, 'hls');

  // Argumentos CLI: --full para o vídeo inteiro (16min), ou limite de tempo em segundos (padrão 15s para demonstração rápida)
  const args = process.argv.slice(2);
  const isFull = args.includes('--full');
  const duracao = isFull ? undefined : 15;

  console.log(`📁 Vídeo alvo: ${rawVideoPath}`);
  console.log(`⏱️ Modo: ${isFull ? 'Completo (16 min)' : 'Demonstração rápida (15 segundos)'}`);
  console.log(`📂 Diretório de saída: ${outputBaseDir}\n`);

  // Instancia a Entidade Cliente
  const video = new Video(rawVideoPath);

  // ----------------------------------------------------
  // 1. Padrão BUILDER: Construção de Job WebVideo (MP4)
  // ----------------------------------------------------
  console.log('⚙️ [1/3] Construindo e executando Job WebVideo (MP4 Faststart)...');
  const webBuilder = new WebVideoJobBuilder();
  webBuilder
    .setVideo(rawVideoPath)
    .setResolucao('720p')
    .setOutputDir(webOutputDir);

  if (duracao) {
    webBuilder.setDuracaoSegundos(duracao);
  }

  const webVideoPath = await video.solicitarTranscodificacao(webBuilder);
  const webStats = fs.statSync(webVideoPath);
  console.log(`✅ WebVideo gerado com sucesso:`);
  console.log(`   - Caminho: ${webVideoPath}`);
  console.log(`   - Tamanho: ${(webStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   - Video.urlWebVideo: ${video.getUrlWebVideo()}\n`);

  // ----------------------------------------------------
  // 2. Padrão BUILDER: Construção de Job HLS (Master Playlist Multivariante)
  // ----------------------------------------------------
  console.log('⚙️ [2/3] Construindo e executando Job HLS com Master Playlist unificada...');
  const hlsBuilder = new HlsJobBuilder();
  hlsBuilder
    .setVideo(rawVideoPath)
    .setResolucoes(['720p', '480p', '360p'])
    .setOutputDir(hlsOutputDir)
    .setSegmentDuration(4);

  if (duracao) {
    hlsBuilder.setDuracaoSegundos(duracao);
  }

  const hlsMasterPath = await video.solicitarTranscodificacao(hlsBuilder);
  const hlsDir = path.dirname(hlsMasterPath);

  console.log(`✅ HLS Master Playlist gerada com sucesso para hls.js:`);
  console.log(`   - Master Playlist: ${hlsMasterPath}`);
  console.log(`   - Video.urlHLS: ${video.getUrlHLS()}`);
  console.log(`   - Variantes criadas:`);
  for (const res of ['720p', '480p', '360p']) {
    const variantPlaylist = path.resolve(hlsDir, res, 'index.m3u8');
    const segCount = fs.readdirSync(path.resolve(hlsDir, res)).filter((f) => f.endsWith('.ts')).length;
    console.log(`     * ${res}: ${variantPlaylist} (${segCount} segmentos .ts)`);
  }
  console.log('');

  // ----------------------------------------------------
  // 3. Padrão PROTOTYPE: Clonagem de Job para Multi-Resoluções
  // ----------------------------------------------------
  console.log('⚙️ [3/3] Aplicando padrão PROTOTYPE para gerar variantes de resolução...');
  const prototipoJob = new JobWebVideo(
    rawVideoPath,
    '720p',
    path.resolve(outputBaseDir, 'variantes'),
    duracao,
  );

  console.log(`   - Job Protótipo base configurado: Resolução ${prototipoJob.getResolucao()}`);
  console.log('   - Clonando protótipo para gerar resoluções: 480p e 360p...');

  const variantes = await video.solicitarVariantesResolucao(prototipoJob, ['480p', '360p']);

  for (const variantePath of variantes) {
    const vStats = fs.statSync(variantePath);
    console.log(`   ✅ Variante gerada via Clone:`);
    console.log(`      - Arquivo: ${path.basename(variantePath)}`);
    console.log(`      - Caminho: ${variantePath}`);
    console.log(`      - Tamanho: ${(vStats.size / 1024).toFixed(2)} KB`);
  }

  console.log('\n🎯 URLs WebVideo disponíveis na entidade Video (seleção por resolução pela aplicação cliente):');
  for (const res of video.getResolucoesDisponiveisWebVideo()) {
    console.log(`   - [${res}]: ${video.getUrlWebVideo(res)}`);
  }

  console.log('\n=====================================================');
  console.log('🎉 Transcodificação concluída com sucesso!');
  console.log('   Padrões GoF Builder e Prototype validados em tempo de execução.');
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('❌ Falha na transcodificação:', err);
  process.exit(1);
});
