import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';

/** Os ecrãs da app Web: os do início de sessão (comuns) e os seus. */
export type IdWeb = IdEntrar;

export type EcraWeb = Ecra<IdWeb>;

export const ir = ligacoes<IdWeb>();
