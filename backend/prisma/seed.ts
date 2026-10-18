import { PrismaClient, TipoPapel, Visibilidade, StatusConteudo } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando Seed do Banco de Dados...');

  const usuario = await prisma.usuario.upsert({
    where: { email: 'streamer@fga.unb.br' },
    update: {},
    create: {
      id: 'usr-streamer-subgrupo1',
      nome: 'Streamer Subgrupo 1',
      email: 'streamer@fga.unb.br',
      senhaHash: '$2b$10$dummyHashParaTestesLocais1234567890',
      papeis: [TipoPapel.CRIADOR, TipoPapel.ESPECTADOR],
      perfil: {
        create: {
          nomeExibicao: 'Canal Oficial Live Sub1',
          biografia: 'Canal de testes e validação da esteira GoF Chain of Responsibility.',
        },
      },
    },
  });

  console.log(`Usuário configurado: ${usuario.nome} (${usuario.email})`);

  const canal = await prisma.canal.upsert({
    where: { id: 'canal-live-sub1' },
    update: {},
    create: {
      id: 'canal-live-sub1',
      nome: 'Canal de Transmissão GoF',
      descricao: 'Canal dedicado à demonstração da Entrega 03 de Arquitetura de Software.',
      usuarioId: usuario.id,
    },
  });

  console.log(`Canal configurado: ${canal.nome} (ID: ${canal.id})`);

  const chaveOficial = 'stream_key_teste_sub1';

  const transmissao = await prisma.transmissaoAoVivo.upsert({
    where: { chaveTransmissao: chaveOficial },
    update: {
      titulo: 'Live Demonstrativa GoF - Subgrupo 1',
      status: StatusConteudo.RASCUNHO,
    },
    create: {
      id: 'live-demo-sub1',
      titulo: 'Live Demonstrativa GoF - Subgrupo 1',
      descricao: 'Transmissão ao vivo local via OBS Studio fatiada com FFmpeg ABR e HLS.',
      visibilidade: Visibilidade.PUBLICO,
      status: StatusConteudo.RASCUNHO,
      chaveTransmissao: chaveOficial,
      canalId: canal.id,
    },
  });

}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
