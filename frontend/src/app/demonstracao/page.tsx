'use client';

import React from 'react';

import { ReproducaoEInteracoes } from '../../components/reproducao/ReproducaoEInteracoes';
import { HlsJsPlayerAdapter } from '../../lib/player/HlsJsPlayerAdapter';
import { ReproducaoFacade, type PlayerProvider } from '../../lib/reproducao/ReproducaoFacade';
import { ServicoDeVideos } from '../../lib/reproducao/ServicoDeVideos';

const servicoDeVideos = new ServicoDeVideos([
  {
    id: 'big-buck-bunny',
    manifestoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'manifesto-invalido',
    manifestoUrl: '/manifesto-inexistente.m3u8',
  },
]);

const playerProvider: PlayerProvider = (video) => new HlsJsPlayerAdapter(video);
const criarSessao = () => new ReproducaoFacade(servicoDeVideos, playerProvider);
const videos = [
  { id: 'big-buck-bunny', titulo: 'Big Buck Bunny — HLS de teste' },
  { id: 'manifesto-invalido', titulo: 'Manifesto inexistente — testar falha HLS' },
  { id: 'video-inexistente', titulo: 'Vídeo fora do catálogo — testar falha de consulta' },
];

export default function DemonstracaoPage() {
  return (
    <main style={{ maxWidth: 880, margin: '40px auto', padding: '0 20px 40px' }}>
      <p style={{ color: '#c4b5fd', letterSpacing: '.08em', fontSize: 13 }}>
        ENTREGA 03 · SUBEQUIPE 02
      </p>
      <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 12 }}>
        Reprodução de vídeo
      </h1>
      <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: 28 }}>
        Demonstração dos padrões Facade e Adapter. Prepare o vídeo, inicie a reprodução
        e acompanhe os eventos da sessão. Para trocar de vídeo, encerre a sessão atual.
      </p>
      <ReproducaoEInteracoes criarSessao={criarSessao} videos={videos} />
      <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
        O vídeo de teste é servido por test-streams.mux.dev. A reprodução requer internet
        e um navegador compatível com hls.js. Esta página funciona sem o backend.
      </p>
    </main>
  );
}
