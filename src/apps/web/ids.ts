import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';

/** Os produtos da Web. Cada um tem os seus ecrãs, com o nome dele à frente. */
export type ProdutoWeb = 'goshop' | 'goparts';

/** Os ecrãs da Web: o início de sessão de cada produto, e os seus. */
export type IdWeb = `${ProdutoWeb}-${IdEntrar}`;

export type EcraWeb = Ecra<IdWeb>;

export const ir = ligacoes<IdWeb>();
