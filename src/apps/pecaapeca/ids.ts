import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';

/** Os ecrãs do Peça a Peça: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdPecaAPeca = IdEntrar;

export type EcraPecaAPeca = Ecra<IdPecaAPeca>;

export const ir = ligacoes<IdPecaAPeca>();
