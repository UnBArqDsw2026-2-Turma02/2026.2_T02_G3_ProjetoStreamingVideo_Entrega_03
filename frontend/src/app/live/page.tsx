'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface ContextoLog {
  timestamp: string;
  etapa: string;
  status: string;
  detalhes: Record<string, any>;
}

export default function LivePage() {
  const chaveImutavel = 'stream_key_teste_sub1';
  const [liveAtiva, setLiveAtiva] = useState(false);
  const [idLiveAtual, setIdLiveAtual] = useState<string>('');
  const [hlsUrl, setHlsUrl] = useState<string>('');
  const [urlPersonalizada, setUrlPersonalizada] = useState<string>('');
  const [qualidades, setQualidades] = useState<{ id: number; nome: string }[]>([]);
  const [qualidadeSelecionada, setQualidadeSelecionada] = useState<number>(-1);
  const [logsContexto, setLogsContexto] = useState<ContextoLog[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [statusPlayer, setStatusPlayer] = useState<string>('Player ocioso');
  const [ultimaLiveDisponivel, setUltimaLiveDisponivel] = useState<{
    id: string;
    hlsUrl: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  const registrarLog = useCallback(
    (etapa: string, status: string, detalhes: Record<string, any>) => {
      const hora = new Date().toLocaleTimeString();
      setLogsContexto((prev) => [
        { timestamp: hora, etapa, status, detalhes },
        ...prev,
      ]);
    },
    [],
  );

  const gerarNovoIdLive = () => {
    const agora = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dataStr = `${agora.getFullYear()}${pad(agora.getMonth() + 1)}${pad(agora.getDate())}`;
    const horaStr = `${pad(agora.getHours())}${pad(agora.getMinutes())}${pad(agora.getSeconds())}`;
    return `live-${dataStr}-${horaStr}`;
  };

  const iniciarLive = async () => {
    setCarregando(true);
    const novoId = gerarNovoIdLive();
    setIdLiveAtual(novoId);

    registrarLog('Client', 'RECEBIDO', {
      idTransmissao: novoId,
      chaveTransmissao: chaveImutavel,
      statusAtual: 'RECEBIDO',
    });

    try {
      const res = await fetch('http://localhost:3000/api/live/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idTransmissao: novoId,
          chaveTransmissao: chaveImutavel,
        }),
      });

      const data = await res.json();

      if (res.ok && data.sucesso && data.transmissao) {
        setLiveAtiva(true);
        setHlsUrl(data.transmissao.hlsUrl);

        registrarLog('Elo 1: Ingestão', 'AUTENTICADO', {
          idTransmissao: data.transmissao.id,
          chaveTransmissao: data.transmissao.chaveTransmissao,
          rtmpUrl: data.transmissao.rtmpUrl,
          statusAtual: 'AUTENTICADO',
        });

        registrarLog('Elo 2: Transcodificação', 'TRANSCODIFICADO', {
          perfis: ['1080p (4500k)', '480p (1200k)'],
          diretorioSaida: `media/live/${data.transmissao.id}/`,
          statusAtual: 'TRANSCODIFICADO',
        });

        registrarLog('Elo 3: Distribuição', 'DISTRIBUIDO', {
          hlsUrl: data.transmissao.hlsUrl,
          statusAtual: 'DISTRIBUIDO',
        });

        conectarPlayerHls(data.transmissao.hlsUrl);
      } else {
        const erroMsg = data.message || data.erro || 'Falha na validação da esteira.';
        registrarLog('Elo 1: Fail-Fast', data.status || 'FALHA_AUTENTICACAO', {
          erro: erroMsg,
          statusAtual: data.status || 'FALHA_AUTENTICACAO',
        });
      }
    } catch (err: any) {
      registrarLog('Conexão', 'ERRO_REDE', { erro: err.message });
    } finally {
      setCarregando(false);
    }
  };

  const encerrarLive = async () => {
    if (!idLiveAtual) return;
    setCarregando(true);

    try {
      const res = await fetch('http://localhost:3000/api/live/encerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idTransmissao: idLiveAtual }),
      });
      const data = await res.json();

      registrarLog('Pipeline', 'ENCERRADO', {
        idTransmissao: idLiveAtual,
        sucesso: data.sucesso,
        statusAtual: 'FINALIZADO',
      });

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }

      setLiveAtiva(false);
      setQualidades([]);
    } catch (err: any) {
      registrarLog('Pipeline', 'ERRO_ENCERRAMENTO', { erro: err.message });
    } finally {
      setCarregando(false);
    }
  };

  const conectarPlayerHls = useCallback(
    async (url: string) => {
      if (!videoRef.current || !url) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Garante imperativamente muted = true para contornar restrições de autoplay do navegador
      videoRef.current.muted = true;
      setStatusPlayer(`Conectando ao HLS: ${url}...`);

      registrarLog('Player HLS', 'INICIANDO_CONEXAO', { url });

      try {
        const HlsModule = await import('hls.js');
        const Hls = HlsModule.default || HlsModule;

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            // Retries ampliados para aguardar geração do primeiro segmento (evita cold start drop)
            manifestLoadingMaxRetry: 20,
            manifestLoadingRetryDelay: 1000,
            levelLoadingMaxRetry: 20,
            levelLoadingRetryDelay: 1000,
            fragLoadingMaxRetry: 20,
            fragLoadingRetryDelay: 1000,
          });

          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(videoRef.current);

          hls.on(Hls.Events.MANIFEST_PARSED, (_ev: any, data: any) => {
            setStatusPlayer('Reproduzindo fluxo HLS');
            registrarLog('Player HLS', 'MANIFESTO_CARREGADO', {
              perfisDetectados: data.levels.length,
              resolucoes: data.levels.map((l: any) => `${l.height}p`),
            });
            const lvls = data.levels.map((l: any, i: number) => ({
              id: i,
              nome: l.height ? `${l.height}p` : `Perfil ${i}`,
            }));
            setQualidades(lvls);

            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch((err: any) => {
                registrarLog('Player HLS', 'AUTOPLAY_AVISO', {
                  detalhe: 'Clique no player para iniciar a reprodução com áudio.',
                  erro: err.message,
                });
              });
            }
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (_ev: any, data: any) => {
            setQualidadeSelecionada(data.level);
            registrarLog('Player HLS', 'QUALIDADE_ALTERADA', {
              nivelIndex: data.level,
            });
          });

          hls.on(Hls.Events.ERROR, (_ev: any, data: any) => {
            if (data.fatal) {
              registrarLog('Player HLS', 'ERRO_FATAL', {
                tipo: data.type,
                detalhe: data.details,
              });
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  registrarLog('Player HLS', 'RECONECTANDO_REDE', {
                    acao: 'Recarregando manifesto HLS...',
                  });
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  registrarLog('Player HLS', 'RECUPERANDO_MIDIA', {
                    acao: 'Recuperando decodificador de mídia...',
                  });
                  hls.recoverMediaError();
                  break;
                default:
                  setStatusPlayer('Erro fatal no player HLS');
                  hls.destroy();
                  break;
              }
            }
          });
        } else if (
          videoRef.current.canPlayType('application/vnd.apple.mpegurl')
        ) {
          videoRef.current.src = url;
          videoRef.current.play().catch(() => {});
          setStatusPlayer('Reproduzindo via suporte nativo');
        } else {
          setStatusPlayer('HLS não suportado neste navegador');
        }
      } catch (e: any) {
        setStatusPlayer(`Erro: ${e.message}`);
        registrarLog('Player', 'ERRO_INICIALIZACAO', { mensagem: e.message });
      }
    },
    [registrarLog],
  );

  const checarStatusServidor = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/live/status');
      if (res.ok) {
        const dados = await res.json();
        if (dados.ativa && dados.hlsUrl) {
          setLiveAtiva(true);
          setIdLiveAtual(dados.idTransmissao);
          setHlsUrl(dados.hlsUrl);
          registrarLog('API Status', 'LIVE_ATIVA_DETECTADA', {
            idTransmissao: dados.idTransmissao,
            hlsUrl: dados.hlsUrl,
          });
          conectarPlayerHls(dados.hlsUrl);
        } else if (dados.ultimaLive && dados.ultimaHlsUrl) {
          setUltimaLiveDisponivel({
            id: dados.ultimaLive,
            hlsUrl: dados.ultimaHlsUrl,
          });
          registrarLog('API Status', 'GRAVACAO_ANTERIOR_DISPONIVEL', {
            ultimaLive: dados.ultimaLive,
            hlsUrl: dados.ultimaHlsUrl,
          });
        }
      }
    } catch (err: any) {
      console.warn('Servidor offline ou inacessível:', err.message);
    }
  }, [conectarPlayerHls, registrarLog]);

  useEffect(() => {
    checarStatusServidor();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [checarStatusServidor]);

  const trocarQualidade = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setQualidadeSelecionada(levelIndex);
    }
  };

  const copiarChave = () => {
    navigator.clipboard.writeText(chaveImutavel);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#e2e8f0', fontFamily: 'monospace, sans-serif', padding: '24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Barra Superior */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9' }}>
              Transmissão ao Vivo — Subgrupo 1
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Esteira GoF Chain of Responsibility (Ingestão ➔ ABR ➔ Distribuição)
            </div>
          </div>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', border: '1px solid #334155', padding: '6px 12px', borderRadius: '4px' }}>
            ← Início
          </Link>
        </header>

        {/* Painel de Controle */}
        <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chave de Transmissão (Imutável do Usuário)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <code style={{ fontSize: '14px', color: '#38bdf8', backgroundColor: '#020617', padding: '4px 8px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                {chaveImutavel}
              </code>
              <button
                onClick={copiarChave}
                style={{ backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
              >
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ID da Transmissão (Gerado por Live)
            </div>
            <div style={{ marginTop: '4px' }}>
              <code style={{ fontSize: '14px', color: idLiveAtual ? '#facc15' : '#475569' }}>
                {idLiveAtual || '— (Aguardando Início)'}
              </code>
            </div>
          </div>

          <div>
            {!liveAtiva ? (
              <button
                onClick={iniciarLive}
                disabled={carregando}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: carregando ? 'wait' : 'pointer',
                  opacity: carregando ? 0.7 : 1,
                }}
              >
                {carregando ? 'Iniciando...' : 'Iniciar Live'}
              </button>
            ) : (
              <button
                onClick={encerrarLive}
                disabled={carregando}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: carregando ? 'wait' : 'pointer',
                  opacity: carregando ? 0.7 : 1,
                }}
              >
                {carregando ? 'Encerrando...' : 'Encerrar Live'}
              </button>
            )}
          </div>
        </section>

        {/* Atalhos de Teste e Reprodução */}
        <section
          style={{
            backgroundColor: '#020617',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '10px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ color: '#64748b' }}>URL HLS:</span>
            <input
              type="text"
              placeholder="http://localhost:8000/live/.../index.m3u8"
              value={urlPersonalizada || hlsUrl}
              onChange={(e) => setUrlPersonalizada(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                color: '#f8fafc',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                flex: 1,
                minWidth: '220px',
              }}
            />
            <button
              onClick={() => {
                const target = urlPersonalizada || hlsUrl;
                if (target) conectarPlayerHls(target);
              }}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ▶️ Conectar
            </button>
          </div>

          {ultimaLiveDisponivel && (
            <button
              onClick={() => {
                setIdLiveAtual(ultimaLiveDisponivel.id);
                setHlsUrl(ultimaLiveDisponivel.hlsUrl);
                conectarPlayerHls(ultimaLiveDisponivel.hlsUrl);
              }}
              style={{
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              📹 Testar Última Live ({ultimaLiveDisponivel.id})
            </button>
          )}
        </section>

        {/* Player de Vídeo */}
        <section
          style={{
            backgroundColor: '#000000',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          {/* Badge de Status do Player */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              backgroundColor: 'rgba(2, 6, 23, 0.85)',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              color: statusPlayer.includes('Reproduzindo')
                ? '#4ade80'
                : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: statusPlayer.includes('Reproduzindo')
                  ? '#22c55e'
                  : '#f59e0b',
              }}
            />
            {statusPlayer}
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoRef}
              controls
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Barra de Qualidade ABR */}
          {qualidades.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Qualidade ABR:</span>
              <button
                onClick={() => trocarQualidade(-1)}
                style={{
                  backgroundColor: qualidadeSelecionada === -1 ? '#2563eb' : '#1e293b',
                  border: 'none',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Auto
              </button>
              {qualidades.map((q) => (
                <button
                  key={q.id}
                  onClick={() => trocarQualidade(q.id)}
                  style={{
                    backgroundColor: qualidadeSelecionada === q.id ? '#2563eb' : '#1e293b',
                    border: 'none',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  {q.nome}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Log do ContextoFluxo (Telemetria da Esteira) */}
        <section style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
            Evolução do ContextoFluxo (Pipeline GoF)
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            {logsContexto.length === 0 ? (
              <div style={{ color: '#334155' }}>Nenhum fluxo processado ainda. Clique em "Iniciar Live" ou transmita pelo OBS.</div>
            ) : (
              logsContexto.map((l, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${l.status.includes('FALHA') ? '#ef4444' : '#10b981'}`, paddingLeft: '8px' }}>
                  <span style={{ color: '#64748b' }}>[{l.timestamp}] </span>
                  <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>{l.etapa}: </span>
                  <span style={{ color: l.status.includes('FALHA') ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
                    {l.status}
                  </span>
                  <div style={{ color: '#cbd5e1', marginTop: '2px', wordBreak: 'break-all' }}>
                    <code>{JSON.stringify(l.detalhes)}</code>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
