import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregar } from '../../comum/carregar/carregar';

/** Os ecrãs do GoShop: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdGoShop = IdEntrar | IdCarregar;

export type EcraGoShop = Ecra<IdGoShop>;

export const ir = ligacoes<IdGoShop>();
