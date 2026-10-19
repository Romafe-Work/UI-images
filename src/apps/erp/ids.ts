import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregarErp, IdErroErp } from './estados';
import type { IdCompras } from './compras';
import type { IdEstadoRede } from './entrar-rede';
import type { IdInicio } from './inicio';
import type { IdCompras2 } from './compras/ecras';

/** Os ecrãs do ERP: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdErp = 'abertura' | IdEntrar | IdEstadoRede | IdInicio | IdCompras2 | IdCompras | IdCarregarErp | IdErroErp;

export type EcraErp = Ecra<IdErp>;

export const ir = ligacoes<IdErp>();
