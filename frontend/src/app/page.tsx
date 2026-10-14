'use client';

import React, { useEffect, useState } from 'react';

interface StatusBackend {
  status: string;
  mensagem: string;
  banco: string;
  timestamp: string;
}

export default function HomePage() {
  const [status, setStatus] = useState<StatusBackend | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    fetch(`${apiUrl}/status`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setCarregando(false);
      })
      .catch((err) => {
        setErro(err.message);
        setCarregando(false);
      });
  }, []);

  return (
    <main style={{ maxWidth: '900px', margin: '40px auto', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', color: '#a855f7', margin: 0 }}>
          🎬 StreamingVideo — Plataforma de Vídeo
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '8px' }}>
          Ambiente Integrado Docker (Frontend Next.js + Backend NestJS + Banco PostgreSQL)
        </p>
      </header>

      <section style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
        <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '16px', color: '#e2e8f0' }}>
          🔌 Status da Conexão Front ↔ Back ↔ Banco
        </h2>

        {carregando && (
          <p style={{ color: '#fbbf24' }}>⏳ Testando comunicação com o backend...</p>
        )}

        {erro && (
          <div style={{ backgroundColor: '#450a0a', border: '1px solid #991b1b', padding: '16px', borderRadius: '8px', color: '#fca5a5' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Falha ao comunicar com a API do Backend:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{erro}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#f87171' }}>
              Certifique-se de que o container do backend está em execução na porta 3000.
            </p>
          </div>
        )}

        {status && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ height: '12px', width: '12px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ fontWeight: 'bold', color: '#4ade80' }}>
                Backend NestJS: {status.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ height: '12px', width: '12px', backgroundColor: status.banco === 'conectado' ? '#22c55e' : '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ fontWeight: 'bold', color: status.banco === 'conectado' ? '#4ade80' : '#f87171' }}>
                Banco PostgreSQL: {status.banco.toUpperCase()}
              </span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '6px', fontSize: '14px', color: '#cbd5e1' }}>
              <p style={{ margin: 0 }}><strong>Mensagem:</strong> {status.mensagem}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Timestamp: {status.timestamp}
              </p>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#38bdf8', marginTop: 0 }}>Subgrupo 1 (Live)</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Porta RTMP: 1935<br />
            Porta HLS: 8000<br />
            GoF: Chain of Responsibility
          </p>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#38bdf8', marginTop: 0 }}>Subgrupo 2 (Frontend)</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Next.js App Router<br />
            Porta Web: 3001<br />
            Player: hls.js
          </p>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#38bdf8', marginTop: 0 }}>Subgrupo 3 (VoD)</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Transcodificação Batch<br />
            Prisma ORM integrado<br />
            GoF: Criacional
          </p>
        </div>
      </section>
    </main>
  );
}
