import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregar } from '../../comum/carregar/carregar';
import type { IdErro } from './erros/erros';
import type { IdEstadoInicio, IdEstadoCatalogo, IdEstadoPedidos, IdEstadoGuias, IdEstadoFaturas, IdEstadoDevolucoes } from './portal/estados';
import type { IdEstadoTecnica } from './portal/tecnica-estados';

/** Os ecrãs do Peça A Peça: os do início de sessão (comuns) e os seus. Um ecrã novo
    entra primeiro aqui; depois disso, `ir('…')` só aceita ecrãs que existem. */
/** Os estados dos ecrãs de entrar (01.1 sem dados, 02.1 palavra-passe errada). */
export type IdEstadoEntrar = 'entrada-vazio' | 'palavra-passe-erro';

/** Os estados da Minha lista (15.1…). */
export type IdEstadoLista = 'lista-vazia' | 'lista-nova' | 'lista-pecas' | 'lista-mao' | 'lista-completa' | 'lista-sem-preco' | 'lista-indisponivel' | 'lista-qtd-invalida' | 'lista-desc-invalido' | 'lista-sujo' | 'lista-a-guardar' | 'lista-guardada' | 'lista-falhou-guardar' | 'lista-offline' | 'lista-sem-resultados' | 'lista-adicionar' | 'lista-remover' | 'lista-remover-ultima' | 'lista-a-carregar' | 'lista-duplicar' | 'lista-eliminar' | 'lista-a-enviar' | 'lista-falhou-enviar' | 'lista-sessao' | 'lista-enviada' | 'lista-leitura' | 'lista-sem-permissao' | 'lista-previsualizar' | 'lista-listas' | 'lista-servico';

/** (20 out., V5) os estados do Início, que passou a painel (10.x). */
export type IdEstadoPainel = 'painel-carga' | 'painel-atualizar' | 'painel-vazio' | 'painel-sem-alertas' | 'painel-sem-historico' | 'painel-parcial' | 'painel-graf-erro' | 'painel-offline' | 'painel-sessao' | 'painel-sem-permissao' | 'painel-periodo-vazio' | 'painel-graf-carga' | 'painel-nav-erro' | 'painel-pedidos' | 'painel-personalizar';

export type IdGoParts = IdEstadoEntrar | 'abertura' | IdEntrar | IdCarregar | IdErro | 'garagem' | 'inicio' | IdEstadoPainel | 'pesquisa' | IdEstadoInicio | 'catalogo' | IdEstadoCatalogo | 'pedidos' | IdEstadoPedidos | 'guias' | IdEstadoGuias | 'faturas' | IdEstadoFaturas | 'lista' | IdEstadoLista | 'devolucoes' | IdEstadoDevolucoes | 'tecnica' | IdEstadoTecnica;

export type EcraGoParts = Ecra<IdGoParts>;

export const ir = ligacoes<IdGoParts>();
