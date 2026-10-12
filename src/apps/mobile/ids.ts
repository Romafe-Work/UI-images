import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregarPick, IdErroPick } from './estados';

/** Os ecrãs da app Mobile: os do início de sessão (comuns) e os seus. */
export type IdMobile = IdEntrar | IdCarregarPick | IdErroPick;

export type EcraMobile = Ecra<IdMobile>;

export const ir = ligacoes<IdMobile>();
