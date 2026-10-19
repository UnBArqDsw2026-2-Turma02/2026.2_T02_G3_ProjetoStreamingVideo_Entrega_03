import * as path from 'path';
import * as fs from 'fs';
import {
  Video,
  WebVideoJobBuilder,
  HlsJobBuilder,
  WebVideoPlayerFactory,
  HlsPlayerFactory,
  HlsPlayer,
  P2PCarregadorSegmentos,
  HttpCarregadorSegmentos,
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
  console.log('▶️  VOD Reprodução - GoF Criacional Demo');
  console.log('   Padrão: Abstract Factory');
  console.log('=====================================================\n');

  const projectRoot = findProjectRoot();
  const rawVideoPath = path.resolve(projectRoot, 'media/vod/raw_video.mp4');

  if (!fs.existsSync(rawVideoPath)) {
    console.error(`❌ Erro: Vídeo de origem não encontrado em: ${rawVideoPath}`);
    process.exit(1);
  }

  const outputBaseDir = path.resolve(projectRoot, 'media/vod/assistir');
  const video = new Video(rawVideoPath);

  // ----------------------------------------------------
  // 0. Pré-requisito: transcodificação (Builder) gera urlWebVideo e urlHLS
  // ----------------------------------------------------
  console.log('⚙️ [0/3] Transcodificando o vídeo (15s) para WebVideo e HLS...');
  await video.solicitarTranscodificacao(
    new WebVideoJobBuilder()
      .setVideo(rawVideoPath)
      .setResolucao('720p')
      .setOutputDir(path.resolve(outputBaseDir, 'web'))
      .setDuracaoSegundos(15),
  );
  await video.solicitarTranscodificacao(
    new HlsJobBuilder()
      .setVideo(rawVideoPath)
      .setResolucoes(['720p', '480p', '360p'])
      .setOutputDir(path.resolve(outputBaseDir, 'hls'))
      .setSegmentDuration(4)
      .setDuracaoSegundos(15),
  );
  console.log(`   - urlWebVideo: ${video.getUrlWebVideo()}`);
  console.log(`   - urlHLS: ${video.getUrlHLS()}\n`);

  // ----------------------------------------------------
  // 1. Família WebVideo: WebVideoPlayer + HttpCarregadorSegmentos
  // ----------------------------------------------------
  console.log('▶️ [1/3] Assistindo com WebVideoPlayerFactory...');
  const playerWeb = video.assistir(new WebVideoPlayerFactory());
  console.log(`   ✅ ${await playerWeb.reproduzir()}\n`);

  // ----------------------------------------------------
  // 2. Família HLS: HlsPlayer + P2PCarregadorSegmentos
  //    Dois espectadores no mesmo tracker: o segundo recebe os segmentos do primeiro (P2P)
  // ----------------------------------------------------
  console.log('▶️ [2/3] Assistindo com HlsPlayerFactory (2 espectadores)...');
  const fabricaHls = new HlsPlayerFactory();

  const espectador1 = video.assistir(fabricaHls) as HlsPlayer;
  console.log(`   👤 Espectador 1: ${await espectador1.reproduzir()}`);
  const carregador1 = espectador1.getCarregador() as P2PCarregadorSegmentos;
  console.log(`      Origem dos dados: ${carregador1.getSegmentosViaHttp()} via HTTP, ${carregador1.getSegmentosViaP2P()} via P2P`);

  const espectador2 = video.assistir(fabricaHls) as HlsPlayer;
  console.log(`   👤 Espectador 2: ${await espectador2.reproduzir()}`);
  const carregador2 = espectador2.getCarregador() as P2PCarregadorSegmentos;
  console.log(`      Origem dos dados: ${carregador2.getSegmentosViaHttp()} via HTTP, ${carregador2.getSegmentosViaP2P()} via P2P\n`);

  // ----------------------------------------------------
  // 3. Troca de resolução e busca no HLS
  // ----------------------------------------------------
  console.log('▶️ [3/3] Espectador 2 volta para 4s e troca para 360p...');
  console.log(`   - Resoluções disponíveis: ${espectador2.getResolucoesDisponiveis().join(', ')}`);
  espectador2.buscar(4);
  espectador2.setResolucao('360p');
  console.log(`   ✅ ${await espectador2.reproduzir()}`);

  // Cada fábrica sempre entrega o par compatível
  const parWeb = new WebVideoPlayerFactory().criarCarregador() instanceof HttpCarregadorSegmentos;
  const parHls = new HlsPlayerFactory().criarCarregador() instanceof P2PCarregadorSegmentos;
  console.log(`\n   Famílias consistentes: WebVideo → HTTP (${parWeb}), HLS → P2P (${parHls})`);

  console.log('\n=====================================================');
  console.log('🎉 Reprodução concluída com sucesso!');
  console.log('   Padrão GoF Abstract Factory validado em tempo de execução.');
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('❌ Falha na reprodução:', err);
  process.exit(1);
});
