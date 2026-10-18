// Interfaces
export * from './interfaces/job-prototype.interface';
export * from './interfaces/job.interface';
export * from './interfaces/job-builder.interface';
export * from './interfaces/player-factory.interface';
export * from './interfaces/player.interface';
export * from './interfaces/carregador-segmentos.interface';

// Jobs (GoF Prototype & Builder Products)
export * from './jobs/job-web-video';
export * from './jobs/job-hls';

// Builders (GoF Builder)
export * from './builders/web-video-job.builder';
export * from './builders/hls-job.builder';

// Carregadores de segmentos (GoF Abstract Factory - Produtos B)
export * from './carregadores/http-carregador-segmentos';
export * from './carregadores/p2p-carregador-segmentos';

// Players (GoF Abstract Factory - Produtos A)
export * from './players/web-video-player';
export * from './players/hls-player';

// Fábricas (GoF Abstract Factory)
export * from './factories/web-video-player.factory';
export * from './factories/hls-player.factory';

// Entities (Client)
export * from './entities/video.entity';

// Utils
export * from './utils/ffmpeg.util';
