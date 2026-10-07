import { ligacoes, type Ecra } from '../../comum/tipos';

/** Os ecrãs do ERP. Um ecrã novo entra primeiro aqui: depois disso,
    `ir('…')` só aceita ecrãs que existem. */
export type IdErp = 'entrada' | 'palavra-passe' | 'federado';

export type EcraErp = Ecra<IdErp>;

export const ir = ligacoes<IdErp>();
