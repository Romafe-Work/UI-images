import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregar } from '../../comum/carregar/carregar';

/** Os ecrãs do GoParts: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdGoParts = IdEntrar | IdCarregar | 'inicio' | 'catalogo' | 'pedidos' | 'guias';

export type EcraGoParts = Ecra<IdGoParts>;

export const ir = ligacoes<IdGoParts>();
