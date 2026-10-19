import type { IJob } from './job.interface';

/**
 * Interface do padrão GoF Criacional: Prototype.
 * Define o contrato para objetos de trabalho de transcodificação
 * que podem ser clonados para gerar novas configurações (como múltiplas resoluções).
 */
export interface IJobPrototype {
  /**
   * Cria uma cópia profunda (clone) do job atual com as mesmas configurações.
   */
  clone(): IJob;
}
