import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'StreamingVideo - Plataforma de Streaming',
  description: 'Projeto da Disciplina de Arquitetura e Desenho de Software (UnB)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
