/* =========================================================
   ERP — 05 · Início v2 (23 out. 2026; foi a v7 durante uma hora — ela quis só v1 + v2), briefing «ROMAFE ERP V7 — The Living Workspace».
   A casa da v6 fica (os seis cartões, o menu lateral, o cabeçalho, os separadores); muda a forma como tudo se liga:
     - a pasta Compras (no menu) transforma-se no espaço de trabalho: a aba abre em perspetiva, a pasta levanta-se,
       o contorno cresce até à área e o explorador revela-se lá dentro, enquanto o separador nasce na barra;
     - um cartão (ou um item do menu) solta o contorno de um documento que voa até ao separador novo, e o ecrã
       abre a partir dele; ao fechar, se a casa estiver à vista, o documento volta ao cartão;
     - separadores com indicador que desliza, a abrir de lado, a fechar a encolher e os outros a chegar-se (FLIP);
     - o menu: pastas que mudam de ícone, filhos em cascata, a guia vertical a crescer, o indicador ativo a deslizar;
       recolher o menu desliza a área em vez de animar larguras;
     - janelas de contexto (stock por armazém, fornecedor) nascem do botão que as abriu e voltam para lá;
     - a barra de ações entra com o separador, e Atualizar mostra o carregamento e o fim verdadeiros;
     - ao fundo da casa, um rolamento em corte desenhado a traço, quase invisível.
   Tudo mede posições reais (getBoundingClientRect), anima só transform, opacidade e clip-path, nunca atrasa o
   trabalho (o estado muda logo; a animação corre por cima) e desaparece com «reduzir movimento».
   Desenho: espaco-lateral.ts (com e.vivo). Movimento: comportamento/vivo.ts. CSS: css/espaco-vivo.css.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import type { Estado } from './espaco';
import { estadoLat, paginaLat, versaoEstadoLat } from './espaco-lateral';

/** Ela (23 out.): «só quero uma v2» — o Início tem a v1 e esta, que é a v2. */
export const VERSAO_INICIO_V7 = 'v2';
const NOTA8 = 'O Início v2 (23 out., briefing «The Living Workspace»): a mesma casa da v6, com transições ligadas — a pasta Compras transforma-se no espaço de trabalho, os cartões soltam um documento que voa até ao separador, separadores e menu com movimento contínuo, janelas que nascem do botão, Artigos com a linha a passar ao detalhe — e um desenho técnico ténue ao fundo.';
const V7 = { id: VERSAO_INICIO_V7, nota: NOTA8 };
export const estadoVivo = (o: Partial<Estado> = {}): Estado => estadoLat({ ...o, vivo: true });
export const versaoInicioV7 = () => ({ ...V7, html: paginaLat(estadoVivo()) });
/** Os estados da v6 também na v7. */
export const versaoEstadoVivo = (id: string) => versaoEstadoLat(id, V7);

export type IdVivo = 'dk8-pasta' | 'dk8-janela' | 'dk8-separadores' | 'dk8-todos' | 'dk8-todos-procura' | 'dk8-reabrir';
const S = (id: string, rota: string, titulo: string, sujo = false) => ({ id, rota, titulo, sujo });
const MUITOS = [S('s1', 'compras.faltas', 'Lista de Faltas'), S('s2', 'compras.encomendas', 'Encomendas'), S('s3', 'compras.cotacoes', 'Orçamentos'), S('s4', 'compras.rececoes', 'Receção de encomendas'),
  S('s5', 'compras.compras-guias-entrada', 'Guias de entrada'), S('s6', 'compras.encomenda', 'EF 2026/0413', true), S('s7', 'ficheiros.artigos', 'Artigos'), S('s8', 'compras.fornecedores', 'Fornecedores'),
  S('s9', 'compras.compras-faturas', 'Faturas'), S('s10', 'compras.mapas-recap', 'Mapa recapitulativo de fornecedores'), S('s11', 'compras.requisicoes', 'Requisições'), S('s12', 'ficheiros.marcas', 'Marcas')];
const NOVOS: [IdVivo, string, string, Partial<Estado>][] = [
  ['dk8-pasta', '05.45 · Pasta Compras aberta', 'O fim da transformação da pasta: o separador «Compras» com o explorador do módulo (os ecrãs como ficheiros); fechar o separador devolve a pasta ao menu.', { seps: [S('p-compras', 'pasta:compras', 'Compras')], ativo: 'p-compras', sel: 'compras.faltas' }],
  ['dk8-janela', '05.46 · Janela a partir de Artigos', 'Em Artigos, «Stock por armazém» abre a janela de contexto a partir do botão; a tabela fica onde estava.', { seps: [S('s1', 'ficheiros.artigos', 'Artigos')], ativo: 's1', janelas: [{ id: 'j1', tipo: 'artigo', chave: '6206-2RSH', x: 300, y: 70, w: 360, h: 300, z: 2 }] }],
  ['dk8-separadores', '05.47 · Vários separadores', 'Artigos, Encomendas e uma encomenda com alterações por guardar (o ponto no separador); o indicador está no ativo.', { seps: [S('s1', 'ficheiros.artigos', 'Artigos'), S('s2', 'compras.encomendas', 'Encomendas de compra'), S('s3', 'compras.encomenda', 'EF 2026/0413', true)], ativo: 's2' }],
  /* 27 out. (briefing V3 e ela: «todos os ecrãs com todos os estados»): a barra cheia e a lista de todos os separadores */
  ['dk8-todos', '05.48 · Todos os separadores', 'Muitos separadores: a barra rola (roda do rato) e o botão no fim abre a lista de todos, com o ativo marcado e o ● das alterações por guardar (Ctrl+Shift+E).', { seps: MUITOS, ativo: 's9', todos: '' }],
  ['dk8-todos-procura', '05.49 · Procurar nos separadores', 'A lista com a procura «enc»: só os separadores que a têm no nome; Enter vai para o primeiro.', { seps: MUITOS, ativo: 's2', todos: 'enc' }],
  ['dk8-reabrir', '05.50 · Fechados há pouco', 'Os separadores fechados há pouco ficam na lista para os reabrir (nada se perde ao fechar sem querer).', { seps: MUITOS.slice(0, 7), ativo: 's3', todos: '', fechados: [{ rota: 'compras.compras-faturas', titulo: 'Faturas' }, { rota: 'compras.rececoes', titulo: 'Receção de encomendas' }] }],
];
export function estadosVivo(): Ecra<IdErp>[] {
  return NOVOS.map(([id, nome, objetivo, o]) => ({ id: id as IdErp, nome, fluxo: 'Início', estadoDe: 'inicio' as IdErp, objetivo, versoes: [{ ...V7, html: paginaLat(estadoVivo(o), '', id) }] }));
}
