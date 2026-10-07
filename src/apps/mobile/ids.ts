import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';

/** Os ecrãs da app Mobile: os do início de sessão (comuns) e os seus. */
export type IdMobile = IdEntrar;

export type EcraMobile = Ecra<IdMobile>;

export const ir = ligacoes<IdMobile>();
