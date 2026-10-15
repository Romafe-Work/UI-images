import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregar } from '../../comum/carregar/carregar';
import type { IdErro } from './erros/erros';
import type { IdEstadoInicio, IdEstadoCatalogo, IdEstadoPedidos, IdEstadoGuias, IdEstadoFaturas, IdEstadoDevolucoes } from './portal/estados';
import type { IdEstadoTecnica } from './portal/tecnica-estados';

/** Os ecrãs do GoParts: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
/** Os estados dos ecrãs de entrar (01.1 sem dados, 02.1 palavra-passe errada). */
export type IdEstadoEntrar = 'entrada-vazio' | 'palavra-passe-erro';

/** Os estados da Minha lista (15.1…). */
export type IdEstadoLista = 'lista-nova' | 'lista-sujo' | 'lista-a-guardar' | 'lista-guardada' | 'lista-falhou-guardar' | 'lista-a-enviar' | 'lista-enviada' | 'lista-falhou-enviar' | 'lista-invalido' | 'lista-adicionar' | 'lista-remover' | 'lista-sem-referencia' | 'lista-sem-resultados' | 'lista-sem-precos' | 'lista-offline' | 'lista-leitura' | 'lista-sem-permissao' | 'lista-eliminar';

export type IdGoParts = IdEstadoEntrar | 'abertura' | IdEntrar | IdCarregar | IdErro | 'inicio' | IdEstadoInicio | 'catalogo' | IdEstadoCatalogo | 'pedidos' | IdEstadoPedidos | 'guias' | IdEstadoGuias | 'faturas' | IdEstadoFaturas | 'lista' | IdEstadoLista | 'devolucoes' | IdEstadoDevolucoes | 'tecnica' | IdEstadoTecnica;

export type EcraGoParts = Ecra<IdGoParts>;

export const ir = ligacoes<IdGoParts>();
