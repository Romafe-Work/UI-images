import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregarErp, IdErroErp } from './estados';
import type { IdCompras } from './compras';
import type { IdEstadoRede } from './entrar-rede';
import type { IdInicio } from './inicio';
import type { IdCompras2 } from './compras/ecras';
import type { IdAberturaV2 } from './abertura-v2';
import type { IdAberturaV3 } from './abertura-v3';
import type { IdAberturaV4 } from './abertura-v4';
import type { IdCompras3 } from './compras/ecras2';
import type { IdCentral } from './entrar-central';

/** Os ecrãs do ERP: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdErp = 'abertura' | IdEntrar | IdEstadoRede | IdCentral | IdInicio | IdCompras2 | IdAberturaV2 | IdAberturaV3 | IdAberturaV4 | IdCompras3 | IdCompras | IdCarregarErp | IdErroErp;

export type EcraErp = Ecra<IdErp>;

export const ir = ligacoes<IdErp>();
