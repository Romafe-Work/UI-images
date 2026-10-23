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
import type { IdAberturaV5 } from './abertura-v5';
import type { IdAberturaV6 } from './abertura-v6';
import type { IdInicioV2 } from './inicio-v2';
import type { IdFaltas } from './compras/faltas';
import type { IdEspaco } from './espaco';
import type { IdCompras3 } from './compras/ecras2';
import type { IdCentral } from './entrar-central';
import type { IdFicheiros } from './ficheiros/ecras';
import type { IdLateral } from './espaco-lateral';
import type { IdVivo } from './espaco-vivo';

/** Os ecrãs do ERP: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdErp = 'abertura' | IdEntrar | IdEstadoRede | IdCentral | IdInicio | IdCompras2 | IdAberturaV2 | IdAberturaV3 | IdAberturaV4 | IdAberturaV5 | IdAberturaV6 | IdInicioV2 | IdFaltas | IdEspaco | IdCompras3 | IdCompras | IdCarregarErp | IdErroErp | IdFicheiros | IdLateral | IdVivo;

export type EcraErp = Ecra<IdErp>;

export const ir = ligacoes<IdErp>();
