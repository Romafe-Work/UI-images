/* =========================================================
   ERP — Compras ▸ Mapas ▸ Comparativos de compras ▸ Por fornecedor (variação anual), v2 (23 out. 2026), do briefing
   «Comparativo por Fornecedor V2». A v1 (a tabela de consulta de menu-antigo.ts) fica.
   O que o ERP antigo faz e se mantém: Nº e nome do fornecedor, três anos seguidos (Ano inicial → Ano final), a
   quantidade e o líquido de cada ano, a variação de um ano para o seguinte, agrupar e filtrar a grelha, os
   Somatórios, Excel e imprimir com as teclas de sempre.
   A conta (a mesma em todo o lado — linhas, grupos e totais):
     - quantidade = soma das quantidades encomendadas no ano; líquido = soma dos líquidos das linhas, sem IVA
       (encomendas que não são rascunho nem canceladas);
     - variação = (líquido do ano seguinte − líquido do ano) ÷ líquido do ano. Nos grupos e no total, a variação faz-se
       com as somas — nunca se somam percentagens;
     - sem compras no ano de base: N/D (nunca «infinito»); sem compras nos dois: «—».
   Dados: 2026 são as encomendas do protótipo (compras/dominio.ts); 2024 e 2025, o histórico de exemplo
   (compras/historico.ts). Um ano sem nenhuma compra no ERP fica «sem dados» — nada se interpola.
   O Nº do fornecedor é de exemplo (o protótipo não tinha numeração). Comportamento: comparativo-comportamento.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L } from '../espaco';
import { encomendas, FORNECEDORES, linhaLiquida, HOJE } from './dominio';
import { historico } from './historico';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import chart from 'lucide-static/icons/chart-column-increasing.svg?raw';
import sigma from 'lucide-static/icons/sigma.svg?raw';
import bookmark from 'lucide-static/icons/bookmark.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import chevronsUp from 'lucide-static/icons/chevrons-up.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import calendarRange from 'lucide-static/icons/calendar-range.svg?raw';
import calendarDays from 'lucide-static/icons/calendar-days.svg?raw';

/* ---------- os dados ---------- */
export const ANO_ATUAL = Number(HOJE.slice(0, 4));
export const ANO_MIN = 2000;
export interface EncCf { ref: string; data: string; qtd: number; liq: number; arquivo: boolean }
export interface AnoCf { qtd: number; liq: number; encs: EncCf[] }
export interface LinhaCf { id: string; num: string; nome: string; pais: string; cidade: string; tend: string; anos: AnoCf[] }
export interface RelCf { anos: number[]; semDados: number[]; linhas: LinhaCf[] }
const PAISES: Record<string, string> = { PT: 'Portugal', ES: 'Espanha', BE: 'Bélgica', DE: 'Alemanha' };
/** O Nº do fornecedor (de exemplo: o protótipo não o tinha). */
export const numForn = (id: string) => String(2001 + FORNECEDORES.findIndex((f) => f.id === id));
/** (B − A) ÷ A. null: sem base (A = 0, B ≠ 0) — N/D; undefined: nada nos dois anos. */
export function variacao(a: number, b: number): number | null | undefined {
  if (a === 0) return b === 0 ? undefined : null;
  return (b - a) / a;
}
/** A tendência do último ano face ao anterior (para agrupar). */
function tendencia(a: number, b: number): string {
  const v = variacao(a, b);
  if (v === undefined) return 'Sem compras nos dois anos';
  if (v === null) return 'Novo no último ano';
  if (v <= -0.999) return 'Sem compras no último ano';
  if (Math.abs(v) < 0.02) return 'Estável';
  return v > 0 ? 'Sobe' : 'Desce';
}
/** O pedido ao «servidor»: três anos seguidos a partir de a0. */
export function comparar(a0: number): RelCf {
  const anos = [a0, a0 + 1, a0 + 2];
  const fontes = [
    ...encomendas().filter((e) => e.estado !== 'Rascunho' && e.estado !== 'Cancelada').map((e) => ({ ref: e.ref, forn: e.forn, data: e.data, qtd: e.linhas.reduce((s, l) => s + l.qtd, 0), liq: e.linhas.reduce((s, l) => s + (linhaLiquida(l) ?? 0), 0), arquivo: false })),
    ...historico().map((h) => ({ ref: h.ref, forn: h.forn, data: h.data, qtd: h.linhas.reduce((s, l) => s + l.qtd, 0), liq: h.linhas.reduce((s, l) => s + l.qtd * l.preco, 0), arquivo: true })),
  ];
  const comDados = new Set(fontes.map((f) => Number(f.data.slice(0, 4))));
  const linhas = FORNECEDORES.map((f): LinhaCf => {
    const porAno = anos.map((a): AnoCf => { const es = fontes.filter((x) => x.forn === f.id && x.data.startsWith(`${a}-`)).sort((x, y) => y.data.localeCompare(x.data));
      return { qtd: es.reduce((s, x) => s + x.qtd, 0), liq: es.reduce((s, x) => s + x.liq, 0), encs: es.map(({ ref, data, qtd, liq, arquivo }) => ({ ref, data, qtd, liq, arquivo })) }; });
    return { id: f.id, num: numForn(f.id), nome: f.nome, pais: PAISES[f.nif.slice(0, 2)] ?? f.nif.slice(0, 2), cidade: f.cidade, tend: tendencia(porAno[1].liq, porAno[2].liq), anos: porAno };
  }).filter((l) => l.anos.some((a) => a.encs.length));
  return { anos, semDados: anos.filter((a) => !comDados.has(a)), linhas };
}

/* ---------- a página ---------- */
export type CenarioCf = 'inicial' | 'mensal' | 'editar' | 'invalido' | 'a-gerar' | 'resultados' | 'parcial' | 'vazio' | 'a-atualizar' | 'agrupado' | 'filtros' | 'detalhe'
  | 'exportado' | 'export-falhou' | 'erro' | 'tempo' | 'offline' | 'permissao' | 'sessao';
const B = (k: string, ic: string, t: string, tecla: string, extra = '', cls = '') => `<button type="button" class="ak-btn${cls ? ` ${cls}` : ''}" data-cf-acao="${k}"${extra}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
function html(cen: CenarioCf): string {
  const id = (x: string) => `cf-${x}-${cen}`, a0 = ANO_ATUAL - 2;
  return `<div class="hm ak ak2 cf${cen === 'mensal' ? ' cf-mensal' : ''}" data-hm data-cf data-cf-cenario="${cen}" data-teclas="F2 F3 F4 F9 F10 F12">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Mapas', ''], ['Comparativos', ''], ['Por fornecedor (variação anual)', '']])}
  <header class="ak-cab">
    <span class="ak-cab-ic">${L(chart)}</span>
    <div><h1>Comparativo por Fornecedor</h1><p>Analisa a evolução das compras por fornecedor ao longo dos anos.</p></div>
    <span class="ak2-vista-ativa" data-cf-vista hidden><small>Vista</small><b>Guardada</b></span>
  </header>
  <div class="ak-barra ak2-barra" role="toolbar" aria-label="Ações do comparativo">
    ${B('filtrar', funnel, 'Filtrar', 'F2', ' aria-pressed="false"')}
    ${B('limpar', funnelX, 'Remover filtros', 'F3')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="ak-menu-c">${B('exportar', sheet, 'Exportar Excel', 'F4', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu" role="menu" data-cf-menu="exportar" hidden>
        <button type="button" role="menuitem" data-cf-exportar="todos">Todos os fornecedores <small data-cf-n-todos></small></button>
        <button type="button" role="menuitem" data-cf-exportar="escolhidos">Só os escolhidos <small data-cf-n-sel></small></button>
        <p>Leva os fornecedores que passam nos filtros, as colunas à vista e, com Somatórios, a linha do total. As variações vão como percentagem.</p>
      </div></span>
    ${B('imprimir', printer, 'Imprimir', 'F12')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('somas', sigma, 'Somatórios', '', ' aria-pressed="true" title="Totais dos grupos e total geral"')}
    ${B('guardar', bookmark, 'Guardar vista', '', ' title="Guarda as colunas, a ordem, os grupos e os Somatórios para a próxima vez"')}
    <span class="ak2-esp"></span>
    ${B('atualizar', refresh, 'Atualizar', 'F9')}
    <span class="ak-menu-c">${B('mais', ellipsis, 'Mais ações', '', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu ak-menu--dir ak2-mais-menu" role="menu" data-cf-menu="mais" hidden>
        <p class="ak-menu-t">Linhas</p>
        <div class="ak2-dens" role="group" aria-label="Linhas"><button type="button" role="menuitemradio" data-cf-densidade="compacta" aria-checked="true">Compactas</button><button type="button" role="menuitemradio" data-cf-densidade="normal" aria-checked="false">Normais</button></div>
        <p class="ak-menu-t">Anos</p>
        <div class="ak2-dens" role="group" aria-label="Ordem dos anos"><button type="button" role="menuitemradio" data-cf-anos="antigos" aria-checked="true">Mais antigo primeiro</button><button type="button" role="menuitemradio" data-cf-anos="recentes" aria-checked="false">Mais recente primeiro</button></div>
        <div data-cf-cols></div>
      </div></span>
  </div>

  <form class="ak-crit ak2-crit cf-crit" data-cf-crit novalidate>
    <div class="ak2-resumo-crit">
      <h2>Período</h2><ul class="ak2-etiquetas" data-cf-etiquetas></ul>
      <span class="cf-gerado" data-cf-gerado></span>
      <button type="button" class="ak-btn ak-btn--linha" data-cf-acao="alterar">${L(pencil)}<span>Alterar período</span></button>
    </div>
    <div class="ak2-aberto">
      <div class="ak-crit-cab"><h2>Critérios</h2><button type="button" class="ak-crit-x" data-cf-acao="recolher" title="Recolher os critérios num resumo" hidden>${L(chevronsUp)}<span>Recolher</span></button></div>
      <div class="ak-crit-c">
        <div class="ak2-campos cf-anos">
          <div class="ak-campo cf-modo" role="radiogroup" aria-labelledby="${id('modo')}"><span id="${id('modo')}">Comparar</span><span class="cf-seg"><button type="button" role="radio" data-cf-modo="anual" aria-checked="${cen !== 'mensal'}">${L(calendarRange)}Variação anual</button><button type="button" role="radio" data-cf-modo="mensal" aria-checked="${cen === 'mensal'}">${L(calendarDays)}Mês a mês</button></span></div>
          <label class="ak-campo cf-so-anual" for="${id('ini')}"><span>Ano inicial</span><input type="number" id="${id('ini')}" name="ini" value="${a0}" min="${ANO_MIN}" max="${ANO_ATUAL - 2}" step="1" inputmode="numeric" data-cf-primeiro></label>
          <span class="cf-seta cf-so-anual" aria-hidden="true">${L(arrowRight)}</span>
          <label class="ak-campo" for="${id('fim')}"><span><span class="cf-so-anual">Ano final</span><span class="cf-so-mensal">Ano</span></span><input type="number" id="${id('fim')}" name="fim" value="${a0 + 2}" min="${ANO_MIN + 2}" max="${ANO_ATUAL}" step="1" inputmode="numeric"></label>
          <p class="cf-dica"><span class="cf-so-anual">Três anos seguidos, como no ERP antigo: mudar um ano acerta o outro.</span><span class="cf-so-mensal">Os doze meses do ano, lado a lado, com o total.</span> Valores líquidos, sem IVA.</p>
        </div>
        <div class="ak-crit-acoes">
          ${B('gerar', play, 'Gerar dados', 'F10', ' data-cf-gerar-crit', 'ak-btn--acao')}
          ${B('cancelar', xIc, 'Cancelar', 'Esc', '', 'ak-btn--linha')}
        </div>
      </div>
      <p class="ak-erro-campo" data-cf-erro role="alert" hidden></p>
    </div>
  </form>

  <section class="ak-res" aria-label="Resultados">
    <p class="cf-imprimir-t" data-cf-imprimir-t></p>
    <div class="ak2-sumario cf-sumario" data-cf-sumario role="status" aria-live="polite" hidden></div>
    <div class="ak-grupos" data-cf-grupos aria-label="Agrupar por">${L(layers)}<span class="ak-grupos-dica">Arraste para aqui o cabeçalho País, Cidade ou Tendência para agrupar</span></div>
    <div class="ak-corpo">
      <div class="ak-grelha cf-grelha" data-cf-grelha tabindex="-1"></div>
      <aside class="ak-det cf-det" data-cf-det aria-label="Detalhe do fornecedor" hidden></aside>
    </div>
  </section>
  <footer class="ak-estado" data-cf-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

const NOTA = 'Comparativo por Fornecedor v2 (23 out., briefing «Comparativo por Fornecedor V2»; ela: «quero num só ecrã» — «Por fornecedor» e «Por fornecedor (variação anual)» são agora este ecrã, com Variação anual ou Mês a mês): Ano inicial → Ano final (três anos seguidos), a grelha com os anos em grupos (Quantidade, Líquido) e a variação entre eles, N/D sem base, Somatórios com as variações feitas sobre as somas, detalhe com a evolução e as encomendas, Excel e imprimir. 2024 e 2025 são histórico de exemplo.';
export const ESTADOS_CF: [Exclude<CenarioCf, 'inicial'>, string, string][] = [
  ['mensal', 'Mês a mês', '2026 mês a mês (o antigo «Por fornecedor», agora no mesmo ecrã): os doze meses lado a lado e o total; os meses que ainda não chegaram ficam «—».'],
  ['resultados', 'Resultados', '2024–2026: os critérios recolhidos em «Período», o resumo, os anos revelados da esquerda para a direita e os Somatórios.'],
  ['editar', 'A alterar o período', 'Os critérios abertos por cima dos resultados; Cancelar (Esc) volta ao resumo sem perder nada.'],
  ['invalido', 'Período inválido', 'O ano final é 2027: ainda não começou. O campo marcado e a mensagem; nada se pede.'],
  ['a-gerar', 'A gerar', 'O pedido a correr: a forma da grelha, sem percentagens inventadas; Esc cancela.'],
  ['parcial', 'Dados parciais', '2023–2025: 2023 não tem compras no ERP — as colunas ficam vazias e a variação 2023→2024 fica N/D.'],
  ['vazio', 'Sem resultados', '2018–2020: nenhum fornecedor tem compras nesses anos; «Alterar período».'],
  ['a-atualizar', 'A atualizar (F9)', 'O mesmo período outra vez: as linhas ficam à vista, esbatidas, até chegar a resposta.'],
  ['agrupado', 'Agrupado por país', 'País arrastado para a zona de agrupar: cada grupo com as somas e a variação calculada sobre elas.'],
  ['filtros', 'Filtros da tabela', 'F2: filtros por coluna — texto, ou «>10000» nos valores e «<0» nas variações.'],
  ['detalhe', 'Detalhe do fornecedor', 'A SKF Portugal à direita: os três anos em barras, a tabela e as encomendas de cada ano.'],
  ['exportado', 'Exportado', 'O Excel foi gerado: o nome do ficheiro e o que levou.'],
  ['export-falhou', 'A exportação falhou', 'O Excel não foi gerado: diz-se, e os resultados ficam.'],
  ['erro', 'Erro do servidor', 'O servidor de relatórios falhou: «Tentar outra vez»; o período fica.'],
  ['tempo', 'Tempo esgotado', 'O servidor demorou demasiado: tentar outra vez.'],
  ['offline', 'Sem ligação', 'Sem rede: o período fica; tenta-se quando a ligação voltar.'],
  ['permissao', 'Sem permissão', 'O utilizador não tem acesso a este mapa.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; o período fica.'],
];
/** A v2 do ecrã e os seus estados (o ecrã base recebe a v2 ao lado da v1 de menu-antigo.ts). */
export function versaoComparativo(): Ecra<IdErp>['versoes'][number] { return { id: 'v2', nota: NOTA, html: html('inicial') }; }
export function estadosComparativo(num: string): Ecra<IdErp>[] {
  return ESTADOS_CF.map(([cen, nome, objetivo], i) => ({ id: `cm-compforn-${cen}` as IdErp, nome: `${num}.${i + 1} · ${nome}`, fluxo: 'Compras', estadoDe: 'cm-comp-forn-var' as IdErp, objetivo, versoes: [{ id: 'v2', nota: NOTA, html: html(cen) }] }));
}
