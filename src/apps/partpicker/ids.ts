import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';

/** Os ecrãs do Part Picker: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
export type IdPartPicker = IdEntrar;

export type EcraPartPicker = Ecra<IdPartPicker>;

export const ir = ligacoes<IdPartPicker>();
