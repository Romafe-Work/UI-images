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
import { encomendas, FORNECEDORES, ARTIGOS, linhaLiquida, HOJE } from './dominio';
import { familiaDe } from '../ficheiros/ecras';
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
export const MES_ATUAL = Number(HOJE.slice(5, 7));
export const ANO_MIN = 2000;
export interface EncCf { ref: string; data: string; qtd: number; liq: number; arquivo: boolean }
/** futuro: o mês ainda não chegou (só no Geral, que tem uma linha por mês) */
export interface AnoCf { qtd: number; liq: number; encs: EncCf[]; futuro?: boolean }
/** Uma linha: os campos que a descrevem (Nº, nome, país… conforme a dimensão) e os três anos. */
export interface LinhaCf { id: string; c: Record<string, string>; anos: AnoCf[] }
export interface RelCf { anos: number[]; semDados: number[]; linhas: LinhaCf[] }
const PAISES: Record<string, string> = { PT: 'Portugal', ES: 'Espanha', BE: 'Bélgica', DE: 'Alemanha' };
const MES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const fNome = (id: string) => FORNECEDORES.find((f) => f.id === id)?.nome ?? id;
/** O Nº do fornecedor (de exemplo: o protótipo não o tinha). */
export const numForn = (id: string) => String(2001 + FORNECEDORES.findIndex((f) => f.id === id));
/** (B − A) ÷ A. null: sem base (A = 0, B ≠ 0) — N/D; undefined: nada nos dois anos. */
export function variacao(a: number, b: number): number | null | undefined {
  if (a === 0) return b === 0 ? undefined : null;
  return (b - a) / a;
}
/** A tendência do último ano face ao anterior (para agrupar). */
function tendencia(a: AnoCf, b: AnoCf): string {
  if (b.futuro) return 'Ainda por chegar';
  const v = variacao(a.liq, b.liq);
  if (v === undefined) return 'Sem compras nos dois anos';
  if (v === null) return 'Novo no último ano';
  if (v <= -0.999) return 'Sem compras no último ano';
  if (Math.abs(v) < 0.02) return 'Estável';
  return v > 0 ? 'Sobe' : 'Desce';
}

/* ---------- as dimensões: o mesmo ecrã para Geral, Por artigo, Por família/subfamília e Por fornecedor ---------- */
export type DimCf = 'geral' | 'artigo' | 'familia' | 'forn';
export interface ColDesc { k: string; t: string; tipo: 'txt' | 'mono'; w: number; agrupa?: boolean; fixa?: boolean }
/** Uma linha de encomenda (de 2026 ou do histórico), a unidade de tudo o que se soma. */
interface Fonte { enc: string; forn: string; data: string; ref: string; qtd: number; liq: number; arquivo: boolean }
export interface DimDef {
  id: DimCf; base: string; pre: string; titulo: string; sub: string; caminho: string; ficheiro: string;
  um: string; varios: string; nenhum: string; descr: ColDesc[]; ocultas0: string[]; esconder: [string, string][]; grupos0: string[];
  /** há o modo Mês a mês (o Geral já é por mês) */
  mensal: boolean; exemplo: string; grupoEx: string;
  chave: (f: Fonte) => string; campos: (id: string) => Record<string, string>; todas?: () => string[];
  /** o cabeçalho do detalhe: o que é, o nome e uma linha */
  cab: (l: LinhaCf) => [string, string, string]; janelas: (l: LinhaCf) => [string, string, string][];
}
const art = (ref: string) => ARTIGOS.find((a) => a.ref === ref);
const famKey = (ref: string) => { const a = art(ref); return `${familiaDe(a?.desc ?? '')}|${a?.desc ?? ref}`; };
const TEND: ColDesc = { k: 'tend', t: 'Tendência', tipo: 'txt', w: 170, agrupa: true };
export const DIMS: Record<DimCf, DimDef> = {
  geral: { id: 'geral', base: 'cm-comp-geral-var', pre: 'compgeral', titulo: 'Comparativo Geral', sub: 'Compara as compras de cada mês ao longo dos anos.', caminho: 'Geral', ficheiro: 'geral',
    um: 'mês', varios: 'meses', nenhum: 'nenhum mês', mensal: false, exemplo: '10', grupoEx: 'tri', grupos0: [], ocultas0: ['tend'],
    descr: [{ k: 'mes', t: 'Mês', tipo: 'txt', w: 130, fixa: true }, { k: 'tri', t: 'Trimestre', tipo: 'txt', w: 120, agrupa: true }, TEND],
    esconder: [['tri', 'Trimestre'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => f.data.slice(5, 7), todas: () => MES_NOME.map((_, i) => String(i + 1).padStart(2, '0')),
    campos: (id) => ({ mes: MES_NOME[Number(id) - 1], tri: `${Math.ceil(Number(id) / 3)}.º trimestre` }),
    cab: (l) => ['Mês', l.c.mes, l.c.tri], janelas: () => [] },
  artigo: { id: 'artigo', base: 'cm-comp-artigo-var', pre: 'compartigo', titulo: 'Comparativo por Artigo', sub: 'Analisa a evolução das compras de cada artigo ao longo dos anos.', caminho: 'Por artigo', ficheiro: 'artigos',
    um: 'artigo', varios: 'artigos', nenhum: 'nenhum artigo', mensal: true, exemplo: '6206-2RSH', grupoEx: 'fam', grupos0: [], ocultas0: ['marca', 'tend'],
    descr: [{ k: 'ref', t: 'Artigo', tipo: 'mono', w: 130, fixa: true }, { k: 'desc', t: 'Descrição', tipo: 'txt', w: 210, fixa: true }, { k: 'marca', t: 'Marca', tipo: 'txt', w: 90, agrupa: true }, { k: 'fam', t: 'Família', tipo: 'txt', w: 130, agrupa: true }, { k: 'forn', t: 'Fornecedor', tipo: 'txt', w: 140, agrupa: true }, TEND],
    esconder: [['marca', 'Marca'], ['fam', 'Família'], ['forn', 'Fornecedor'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => f.ref, todas: () => ARTIGOS.map((a) => a.ref),
    campos: (id) => { const a = art(id); return { ref: id, desc: a?.desc ?? '—', marca: a?.marca ?? '—', fam: familiaDe(a?.desc ?? ''), forn: a ? fNome(a.forn) : '—' }; },
    cab: (l) => ['Artigo', l.c.ref, `${l.c.desc} · ${l.c.marca} · ${l.c.forn}`], janelas: (l) => [[`artigo:${l.c.ref}`, 'warehouse', 'Stock por armazém']] },
  familia: { id: 'familia', base: 'cm-comp-familia-var', pre: 'compfamilia', titulo: 'Comparativo por Família/Subfamília', sub: 'Analisa a evolução das compras de cada família e subfamília ao longo dos anos.', caminho: 'Por família/subfamília', ficheiro: 'familias',
    um: 'subfamília', varios: 'subfamílias', nenhum: 'nenhuma subfamília', mensal: true, exemplo: `Rolamentos|Rolamento rígido de esferas`, grupoEx: 'fam', grupos0: ['fam'], ocultas0: ['tend'],
    descr: [{ k: 'fam', t: 'Família', tipo: 'txt', w: 150, agrupa: true, fixa: true }, { k: 'sub', t: 'Subfamília', tipo: 'txt', w: 230, fixa: true }, { k: 'arts', t: 'Artigos', tipo: 'txt', w: 90 }, TEND],
    esconder: [['arts', 'Artigos'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => famKey(f.ref),
    campos: (id) => { const [fam, sub] = id.split('|'); const n = ARTIGOS.filter((a) => a.desc === sub).length; return { fam, sub, arts: `${n} ${n === 1 ? 'artigo' : 'artigos'}` }; },
    cab: (l) => ['Família · subfamília', l.c.sub, `${l.c.fam} · ${l.c.arts}`], janelas: () => [] },
  forn: { id: 'forn', base: 'cm-comp-forn-var', pre: 'compforn', titulo: 'Comparativo por Fornecedor', sub: 'Analisa a evolução das compras por fornecedor ao longo dos anos.', caminho: 'Por fornecedor', ficheiro: 'fornecedores',
    um: 'fornecedor', varios: 'fornecedores', nenhum: 'nenhum fornecedor', mensal: true, exemplo: 'skf', grupoEx: 'pais', grupos0: [], ocultas0: ['cidade', 'tend'],
    descr: [{ k: 'num', t: 'Nº', tipo: 'mono', w: 72, fixa: true }, { k: 'nome', t: 'Nome', tipo: 'txt', w: 200, fixa: true }, { k: 'pais', t: 'País', tipo: 'txt', w: 104, agrupa: true }, { k: 'cidade', t: 'Cidade', tipo: 'txt', w: 110, agrupa: true }, TEND],
    esconder: [['num', 'Nº'], ['pais', 'País'], ['cidade', 'Cidade'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => f.forn, todas: () => FORNECEDORES.map((f) => f.id),
    campos: (id) => { const f = FORNECEDORES.find((x) => x.id === id); return { num: numForn(id), nome: f?.nome ?? id, pais: f ? PAISES[f.nif.slice(0, 2)] ?? f.nif.slice(0, 2) : '—', cidade: f?.cidade ?? '—' }; },
    cab: (l) => [`Fornecedor · Nº ${l.c.num}`, l.c.nome, `${l.c.cidade}, ${l.c.pais} · ${l.c.tend}`], janelas: (l) => [[`fornecedor:${l.id}`, 'users', 'Ver fornecedor']] },
};
function fontes(): Fonte[] {
  return [
    ...encomendas().filter((e) => e.estado !== 'Rascunho' && e.estado !== 'Cancelada').flatMap((e) => e.linhas.map((l) => ({ enc: e.ref, forn: e.forn, data: e.data, ref: l.ref, qtd: l.qtd, liq: linhaLiquida(l) ?? 0, arquivo: false }))),
    ...historico().flatMap((h) => h.linhas.map((l) => ({ enc: h.ref, forn: h.forn, data: h.data, ref: l.ref, qtd: l.qtd, liq: l.qtd * l.preco, arquivo: true }))),
  ];
}
/** O pedido ao «servidor»: três anos seguidos a partir de a0, por dimensão. */
export function comparar(dim: DimCf, a0: number): RelCf {
  const d = DIMS[dim], anos = [a0, a0 + 1, a0 + 2], fs = fontes();
  const comDados = new Set(fs.map((f) => Number(f.data.slice(0, 4))));
  const semDados = anos.filter((a) => !comDados.has(a));
  const porChave = new Map<string, Fonte[]>(); fs.forEach((f) => { if (!anos.includes(Number(f.data.slice(0, 4)))) return; const k = d.chave(f); porChave.set(k, [...(porChave.get(k) ?? []), f]); });
  const ids = d.todas ? d.todas().filter((k) => dim === 'geral' || porChave.has(k)) : [...porChave.keys()].sort((a, b) => a.localeCompare(b, 'pt'));
  if (semDados.length === 3) return { anos, semDados, linhas: [] };
  const linhas = ids.map((id): LinhaCf => {
    const xs = porChave.get(id) ?? [];
    const porAno = anos.map((a): AnoCf => {
      const ys = xs.filter((x) => x.data.startsWith(`${a}-`)), porEnc = new Map<string, EncCf>();
      ys.forEach((y) => { const e = porEnc.get(y.enc) ?? { ref: y.enc, data: y.data, qtd: 0, liq: 0, arquivo: y.arquivo }; e.qtd += y.qtd; e.liq += y.liq; porEnc.set(y.enc, e); });
      return { qtd: ys.reduce((s, y) => s + y.qtd, 0), liq: ys.reduce((s, y) => s + y.liq, 0), encs: [...porEnc.values()].sort((p, q) => q.data.localeCompare(p.data)), futuro: dim === 'geral' && a === ANO_ATUAL && Number(id) > MES_ATUAL };
    });
    return { id, c: { ...d.campos(id), tend: tendencia(porAno[1], porAno[2]) }, anos: porAno };
  });
  return { anos, semDados, linhas };
}

/* ---------- a página ---------- */
export type CenarioCf = 'inicial' | 'mensal' | 'editar' | 'invalido' | 'a-gerar' | 'resultados' | 'parcial' | 'vazio' | 'a-atualizar' | 'agrupado' | 'filtros' | 'detalhe'
  | 'exportado' | 'export-falhou' | 'erro' | 'tempo' | 'offline' | 'permissao' | 'sessao';
const B = (k: string, ic: string, t: string, tecla: string, extra = '', cls = '') => `<button type="button" class="ak-btn${cls ? ` ${cls}` : ''}" data-cf-acao="${k}"${extra}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
function html(d: DimDef, cen: CenarioCf): string {
  const id = (x: string) => `cf-${d.id}-${x}-${cen}`, a0 = ANO_ATUAL - 2;
  const agr = d.descr.filter((c) => c.agrupa).map((c) => c.t), dica = `Arraste para aqui o cabeçalho ${agr.length > 1 ? `${agr.slice(0, -1).join(', ')} ou ${agr[agr.length - 1]}` : agr[0]} para agrupar`;
  return `<div class="hm ak ak2 cf${cen === 'mensal' ? ' cf-mensal' : ''}" data-hm data-cf data-cf-dim="${d.id}" data-cf-cenario="${cen}" data-teclas="F2 F3 F4 F9 F10 F12">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Mapas', ''], ['Comparativos', ''], [d.caminho, '']])}
  <header class="ak-cab">
    <span class="ak-cab-ic">${L(chart)}</span>
    <div><h1>${d.titulo}</h1><p>${d.sub}</p></div>
    <span class="ak2-vista-ativa" data-cf-vista hidden><small>Vista</small><b>Guardada</b></span>
  </header>
  <div class="ak-barra ak2-barra" role="toolbar" aria-label="Ações do comparativo">
    ${B('filtrar', funnel, 'Filtrar', 'F2', ' aria-pressed="false"')}
    ${B('limpar', funnelX, 'Remover filtros', 'F3')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="ak-menu-c">${B('exportar', sheet, 'Exportar Excel', 'F4', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu" role="menu" data-cf-menu="exportar" hidden>
        <button type="button" role="menuitem" data-cf-exportar="todos">Todas as linhas <small data-cf-n-todos></small></button>
        <button type="button" role="menuitem" data-cf-exportar="escolhidos">Só as escolhidas <small data-cf-n-sel></small></button>
        <p>Leva as linhas que passam nos filtros, as colunas à vista e, com Somatórios, a linha do total. As variações vão como percentagem.</p>
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
          <div class="ak-campo cf-modo" role="radiogroup"${d.mensal ? '' : ' hidden'} aria-labelledby="${id('modo')}"><span id="${id('modo')}">Comparar</span><span class="cf-seg"><button type="button" role="radio" data-cf-modo="anual" aria-checked="${cen !== 'mensal'}">${L(calendarRange)}Variação anual</button><button type="button" role="radio" data-cf-modo="mensal" aria-checked="${cen === 'mensal'}">${L(calendarDays)}Mês a mês</button></span></div>
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
    <div class="ak-grupos" data-cf-grupos aria-label="Agrupar por">${L(layers)}<span class="ak-grupos-dica">${dica}</span></div>
    <div class="ak-corpo">
      <div class="ak-grelha cf-grelha" data-cf-grelha tabindex="-1"></div>
      <aside class="ak-det cf-det" data-cf-det aria-label="Detalhe" hidden></aside>
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
/** Os estados dos outros três comparativos (o de fornecedor tem-nos todos; o comportamento é o mesmo). */
const ESTADOS_CURTOS: CenarioCf[] = ['resultados', 'mensal', 'agrupado', 'detalhe', 'parcial'];
const NOTA_D = (d: DimDef) => d.id === 'forn' ? NOTA : `${d.titulo} v2 (23 out., ela: «quero num só ecrã» — «${d.caminho}» e «${d.caminho} (variação anual)» são agora este ecrã${d.mensal ? ', com Variação anual ou Mês a mês' : ', com uma linha por mês e os três anos lado a lado'}). O mesmo ecrã do Comparativo por Fornecedor: anos em grupos, N/D sem base, Somatórios sobre as somas, detalhe, Excel e imprimir. 2024 e 2025 são histórico de exemplo.`;
/** A v2 do ecrã e os seus estados (o ecrã base recebe a v2 ao lado da v1 de menu-antigo.ts). */
export function versaoComparativo(dim: DimCf): Ecra<IdErp>['versoes'][number] { const d = DIMS[dim]; return { id: 'v2', nota: NOTA_D(d), html: html(d, 'inicial') }; }
export function estadosComparativo(dim: DimCf, num: string): Ecra<IdErp>[] {
  const d = DIMS[dim], lista = dim === 'forn' ? ESTADOS_CF : ESTADOS_CF.filter(([c]) => ESTADOS_CURTOS.includes(c) && (d.mensal || c !== 'mensal'));
  return lista.map(([cen, nome, objetivo], i) => ({ id: `cm-${d.pre}-${cen}` as IdErp, nome: `${num}.${i + 1} · ${nome}`, fluxo: 'Compras', estadoDe: d.base as IdErp, objetivo: dim === 'forn' ? objetivo : `${d.titulo}: ${nome.toLowerCase()}.`, versoes: [{ id: 'v2', nota: NOTA_D(d), html: html(d, cen) }] }));
}
