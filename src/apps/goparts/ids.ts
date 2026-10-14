import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregar } from '../../comum/carregar/carregar';
import type { IdErro } from './erros/erros';
import type { IdEstadoInicio, IdEstadoCatalogo, IdEstadoPedidos, IdEstadoGuias, IdEstadoFaturas } from './portal/estados';

/** Os ecrãs do GoParts: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
/** Os estados dos ecrãs de entrar (01.1 sem dados, 02.1 palavra-passe errada). */
export type IdEstadoEntrar = 'entrada-vazio' | 'palavra-passe-erro';

export type IdGoParts = IdEstadoEntrar | 'abertura' | IdEntrar | IdCarregar | IdErro | 'inicio' | IdEstadoInicio | 'catalogo' | IdEstadoCatalogo | 'pedidos' | IdEstadoPedidos | 'guias' | IdEstadoGuias | 'faturas' | IdEstadoFaturas;

export type EcraGoParts = Ecra<IdGoParts>;

export const ir = ligacoes<IdGoParts>();
