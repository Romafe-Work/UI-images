import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregarErp, IdErroErp } from './estados';

/** Os ecrãs do ERP: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdErp = IdEntrar | IdCarregarErp | IdErroErp;

export type EcraErp = Ecra<IdErp>;

export const ir = ligacoes<IdErp>();
