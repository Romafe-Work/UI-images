import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';

/** Os ecrãs do ERP: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdErp = IdEntrar;

export type EcraErp = Ecra<IdErp>;

export const ir = ligacoes<IdErp>();
