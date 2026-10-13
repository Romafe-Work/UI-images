import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregar } from '../../comum/carregar/carregar';
import type { IdErro } from './erros/erros';
import type { IdEstadoInicio, IdEstadoCatalogo, IdEstadoPedidos, IdEstadoGuias, IdEstadoFaturas } from './portal/estados';

/** Os ecrãs do GoParts: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdGoParts = 'publico' | 'abertura' | IdEntrar | IdCarregar | IdErro | 'inicio' | IdEstadoInicio | 'catalogo' | IdEstadoCatalogo | 'pedidos' | IdEstadoPedidos | 'guias' | IdEstadoGuias | 'faturas' | IdEstadoFaturas;

export type EcraGoParts = Ecra<IdGoParts>;

export const ir = ligacoes<IdGoParts>();
