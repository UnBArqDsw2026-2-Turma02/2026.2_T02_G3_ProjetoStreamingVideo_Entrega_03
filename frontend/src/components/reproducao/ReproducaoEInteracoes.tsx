'use client';

import React, { useEffect, useRef, useState } from 'react';

import type { PlaybackEvent, Unsubscribe } from '../../lib/player/playback.types';
import type { ReproducaoFacade } from '../../lib/reproducao/ReproducaoFacade';
import styles from './ReproducaoEInteracoes.module.css';

interface ReproducaoEInteracoesProps {
  criarSessao: () => ReproducaoFacade;
  videos: readonly { id: string; titulo: string }[];
}

type EstadoDaTela = 'inicial' | 'consultando' | 'carregando' | 'pronto'
  | 'reproduzindo' | 'pausado' | 'erro' | 'encerrado';

const rotulos: Record<EstadoDaTela, string> = {
  inicial: 'Selecione um vídeo para começar',
  consultando: 'Consultando o catálogo',
  carregando: 'Preparando o manifesto HLS',
  pronto: 'Manifesto preparado. Clique em Reproduzir',
  reproduzindo: 'Reproduzindo',
  pausado: 'Reprodução pausada',
  erro: 'Não foi possível concluir a operação',
  encerrado: 'Sessão encerrada. Você pode preparar outro vídeo',
};

function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

export function ReproducaoEInteracoes({ criarSessao, videos }: ReproducaoEInteracoesProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const facadeRef = useRef<ReproducaoFacade | null>(null);
  const removerInscricaoRef = useRef<Unsubscribe | null>(null);
  const [videoId, setVideoId] = useState(videos[0]?.id ?? '');
  const [estado, setEstado] = useState<EstadoDaTela>('inicial');
  const [preparado, setPreparado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [eventos, setEventos] = useState<string[]>([]);

  useEffect(() => () => {
    const facade = facadeRef.current;
    facadeRef.current = null;
    removerInscricaoRef.current?.();
    removerInscricaoRef.current = null;

    try {
      facade?.encerrar();
    } catch (falha) {
      console.error('Falha ao encerrar a sessão durante a desmontagem.', falha);
    }
  }, []);

  async function prepararReproducao(): Promise<void> {
    if (!videoRef.current) return;

    const anterior = facadeRef.current;
    facadeRef.current = null;
    removerInscricaoRef.current?.();
    removerInscricaoRef.current = null;
    anterior?.encerrar();

    setEstado('consultando');
    setPreparado(false);
    setErro(null);
    setEventos([]);

    const facade = criarSessao();
    facadeRef.current = facade;
    removerInscricaoRef.current = facade.observar((evento: PlaybackEvent) => {
      if (facadeRef.current !== facade) return;

      const descricao = evento.tipo === 'erro'
        ? `erro: ${evento.erro.codigo} — ${evento.erro.message}`
        : evento.tipo;
      setEventos((anteriores) => [...anteriores, descricao].slice(-12));

      switch (evento.tipo) {
        case 'carregando': setEstado('carregando'); break;
        case 'reproduzindo': setEstado('reproduzindo'); break;
        case 'pausado': setEstado('pausado'); break;
        case 'erro':
          setErro(evento.erro.message);
          setEstado('erro');
          break;
        case 'descartado':
          setPreparado(false);
          setEstado('encerrado');
          break;
      }
    });

    try {
      await facade.prepararVideo(videoId, videoRef.current);
      if (facadeRef.current !== facade) return;
      setPreparado(true);
      setEstado('pronto');
    } catch (falha) {
      if (facadeRef.current !== facade) return;
      setErro(mensagemDoErro(falha));
      setEstado('erro');
    }
  }

  async function reproduzir(): Promise<void> {
    const facade = facadeRef.current;
    if (!facade) return;
    setErro(null);

    try {
      await facade.reproduzir();
    } catch (falha) {
      if (facadeRef.current === facade) setErro(mensagemDoErro(falha));
    }
  }

  function pausar(): void {
    try {
      facadeRef.current?.pausar();
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  }

  function encerrarReproducao(): void {
    setErro(null);

    try {
      facadeRef.current?.encerrar();
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    } finally {
      removerInscricaoRef.current?.();
      removerInscricaoRef.current = null;
      facadeRef.current = null;
      setPreparado(false);
      setEstado('encerrado');
    }
  }

  const preparando = estado === 'consultando' || estado === 'carregando';

  return (
    <section className={styles.player} aria-label="Demonstração de reprodução">
      <div className={styles.selecao}>
        <label htmlFor="video-selecionado">Vídeo do catálogo</label>
        <div className={styles.linha}>
          <select id="video-selecionado" value={videoId}
            onChange={(evento) => setVideoId(evento.target.value)} disabled={preparando || preparado}>
            {videos.map((video) => <option key={video.id} value={video.id}>{video.titulo}</option>)}
          </select>
          <button className={styles.principal} onClick={() => { void prepararReproducao(); }}
            disabled={preparando || preparado || !videoId}>
            {preparando ? 'Preparando…' : 'Preparar vídeo'}
          </button>
        </div>
      </div>

      <video ref={videoRef} className={styles.video} playsInline preload="none"
        aria-label="Vídeo da demonstração" />

      <div className={styles.controles}>
        <button className={styles.principal} onClick={() => { void reproduzir(); }}
          disabled={!preparado || estado === 'reproduzindo'}>Reproduzir</button>
        <button onClick={pausar} disabled={!preparado || estado !== 'reproduzindo'}>Pausar</button>
        <button onClick={encerrarReproducao} disabled={!facadeRef.current}>Encerrar sessão</button>
      </div>

      <p role="status" className={styles.status}>{rotulos[estado]}</p>
      {erro && <p role="alert" className={styles.erro}>{erro}</p>}

      <details open className={styles.eventos}>
        <summary>Eventos da sessão</summary>
        {eventos.length === 0
          ? <p>Nenhum evento de reprodução recebido.</p>
          : <ol>{eventos.map((evento, indice) => <li key={indice}>{evento}</li>)}</ol>}
      </details>
    </section>
  );
}
