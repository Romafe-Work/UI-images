/* =========================================================
   ERP — Faturas de Compra v2 (26 out. 2026), do briefing dela «Gestão de Faturas de Fornecedores V2» e do print do ERP
   antigo (Compras ▸ Facturas: Campo / Condição / Valor a pesquisar, Shift+F1 Filtrar registos, Shift+F2 Remover filtro,
   Ctrl+F1 Lançar crédito). A v1 (a consulta de 23 out.) fica como estava.
   Colunas do antigo: Número, Data, N.º Doc. For., Dt. Doc. For., Fornecedor, Nome, Tem Crédito?, Bloqueado, Anulado,
   Moeda, Valor, Valor Crédito, Utilizador. Os dados e as regras são os de compras/faturas.ts (faturas de exemplo, das
   receções do protótipo).
   - A pesquisa é a do antigo, num construtor: Campo → Condição (só as que servem ao tipo do campo) → Valor (data, número,
     fornecedor, lista ou texto); várias condições com E / OU (o E primeiro, e diz-se); só se aplica com Filtrar
     (Shift+F1) e sai com Remover filtro (Shift+F2) — os filtros rápidos aplicam-se logo.
   - Lançar crédito (Ctrl+F1): o que falta creditar, o valor e o motivo; uma chave por pedido (repetir não duplica); a
     nota de crédito nasce na fatura e abre-se na consulta das notas de crédito.
   - Documentos: Encomenda → Receção → Fatura → Notas de crédito, e a verificação de preços e quantidades.
   Motor: compras/docs-v2.ts e docs-v2-comportamento.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from './docs-v2';
import { toast, dialogo, fecharDialogo, tudo, abrirDoc, ativoDe, quieto, nf, de, emSeparador } from './docs-v2-comportamento';
import { faturas, fatura, creditosDe, creditado, totaisFat, liquidoLinha, verificar, porqueAlterar, porqueAnular, porqueCreditar, podeF, registarFat, alterarFat, bloquearFat, anularFat, lancarCredito, periodoAberto, NOME_TIPO, type Fatura, type LinhaFat, type TipoFat } from './faturas';
import { encomendas, rececoesDe, fornecedor, FORNECEDORES, ARTIGOS, artigo, euros, dia, pct, lerEuros, lerPercentagem, HOJE, Recusa, encomenda } from './dominio';
import { numForn } from './comparativo';
import { PERFIS } from '../inicio-dados';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import receiptText from 'lucide-static/icons/receipt-text.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import link from 'lucide-static/icons/link.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import lockOpen from 'lucide-static/icons/lock-open.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import external from 'lucide-static/icons/external-link.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import circleHelp from 'lucide-static/icons/circle-help.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';

/* ---------- as linhas ---------- */
const nomeF = (id: string) => fornecedor(id)?.nome ?? id;
const f_ = (d: Doc) => fatura(String(d.ref))!;
function linhas(): Doc[] {
  return faturas().map((f): Doc => {
    const t = totaisFat(f), cr = creditado(f), v = verificar(f);
    return { id: f.ref, ref: f.ref, numero: f.ref, n: f.ref.split(' ')[1] ?? f.ref, serie: f.ref.split('/')[0], tipo: NOME_TIPO[f.tipo], data: f.data, docForn: f.docForn, dataDocForn: f.dataDocForn, forn: f.forn, fornNum: numForn(f.forn), nome: nomeF(f.forn),
      temCredito: f.creditos.length > 0, bloqueado: f.bloqueada, anulado: f.anulada, moeda: f.moeda, valor: t.total, credito: cr, utilizador: PERFIS[f.criador].pessoa, enc: f.enc, rec: f.rec, verif: v.ok ? 'ok' : 'erro' };
  });
}

/* ---------- o construtor da pesquisa (Campo → Condição → Valor) ---------- */
type TipoCampo = 'texto' | 'data' | 'num' | 'forn' | 'enum';
interface Campo { k: string; t: string; tipo: TipoCampo; vals?: [string, string][] }
const CAMPOS: Campo[] = [
  { k: 'n', t: 'Número da fatura', tipo: 'texto' }, { k: 'data', t: 'Data', tipo: 'data' }, { k: 'docForn', t: 'N.º do documento do fornecedor', tipo: 'texto' },
  { k: 'dataDocForn', t: 'Data do documento do fornecedor', tipo: 'data' }, { k: 'forn', t: 'Fornecedor', tipo: 'forn' }, { k: 'nome', t: 'Nome do fornecedor', tipo: 'texto' },
  { k: 'valor', t: 'Valor', tipo: 'num' }, { k: 'credito', t: 'Valor do crédito', tipo: 'num' }, { k: 'moeda', t: 'Moeda', tipo: 'enum', vals: [['EUR', 'EUR · euro']] },
  { k: 'estado', t: 'Estado', tipo: 'enum', vals: [['normal', 'Sem crédito, bloqueio nem anulação'], ['credito', 'Tem crédito'], ['bloqueada', 'Bloqueada'], ['anulada', 'Anulada']] },
  { k: 'enc', t: 'Encomenda', tipo: 'texto' },
];
const OPS: Record<TipoCampo, [string, string][]> = {
  texto: [['contem', 'Contém'], ['comeca', 'Começa por'], ['igual', 'Igual a']],
  data: [['igual', 'Igual a'], ['antes', 'Anterior a'], ['depois', 'Posterior a'], ['entre', 'Entre']],
  num: [['igual', 'Igual a'], ['maior', 'Maior que'], ['menor', 'Menor que'], ['entre', 'Entre']],
  forn: [['igual', 'Igual a'], ['dif', 'Diferente de']], enum: [['igual', 'Igual a'], ['dif', 'Diferente de']],
};
interface Crit { campo: string; op: string; v: string; v2: string; liga: 'e' | 'ou' }
const campoDe = (k: string) => CAMPOS.find((c) => c.k === k) ?? CAMPOS[0];
const novoCrit = (campo = 'n'): Crit => ({ campo, op: OPS[campoDe(campo).tipo][0][0], v: '', v2: '', liga: 'e' });
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
function passa(d: Doc, c: Crit): boolean {
  const k = campoDe(c.campo);
  if (k.tipo === 'enum' && k.k === 'estado') { const s = d.anulado ? 'anulada' : d.bloqueado ? 'bloqueada' : d.temCredito ? 'credito' : 'normal'; const sim = c.v === 'credito' ? !!d.temCredito : c.v === 'bloqueada' ? !!d.bloqueado : c.v === 'anulada' ? !!d.anulado : s === 'normal'; return c.op === 'dif' ? !sim : sim; }
  const val = d[k.k];
  if (k.tipo === 'num') { const a = lerEuros(c.v), b = lerEuros(c.v2), x = val as number; if (a === null) return true; return c.op === 'igual' ? x === a : c.op === 'maior' ? x > a : c.op === 'menor' ? x < a : b === null ? x >= a : x >= Math.min(a, b) && x <= Math.max(a, b); }
  if (k.tipo === 'data') { const x = String(val); if (!c.v) return true; return c.op === 'igual' ? x === c.v : c.op === 'antes' ? x < c.v : c.op === 'depois' ? x > c.v : x >= c.v && (!c.v2 || x <= c.v2); }
  if (k.tipo === 'forn' || k.tipo === 'enum') { if (!c.v) return true; return c.op === 'dif' ? String(val) !== c.v : String(val) === c.v; }
  const x = norm(String(val ?? '')), q = norm(c.v); if (!q) return true;
  return c.op === 'igual' ? x === q : c.op === 'comeca' ? x.startsWith(q) : x.includes(q);
}
/** E primeiro, depois OU: «A e B ou C» = (A e B) ou C. */
function avaliar(d: Doc, cs: Crit[]): boolean {
  const grupos: Crit[][] = [[]];
  cs.forEach((c, i) => { if (i && c.liga === 'ou') grupos.push([]); grupos[grupos.length - 1].push(c); });
  return grupos.some((g) => g.every((c) => passa(d, c)));
}
const aplicados = (e: EstDoc) => (e.extra.crit as Crit[] | undefined) ?? [];
const rascunho = (e: EstDoc) => { if (!e.extra.rascunho) e.extra.rascunho = [novoCrit()]; return e.extra.rascunho as Crit[]; };
function textoCrit(c: Crit): string {
  const k = campoDe(c.campo), op = OPS[k.tipo].find((o) => o[0] === c.op)?.[1].toLowerCase() ?? '';
  const v = (x: string) => k.tipo === 'data' ? dia(x) : k.tipo === 'forn' ? nomeF(x) : k.tipo === 'enum' ? (k.vals?.find((y) => y[0] === x)?.[1] ?? x) : x;
  return `${k.t} ${op} «${v(c.v)}»${c.op === 'entre' && c.v2 ? ` e «${v(c.v2)}»` : ''}`;
}
function valorInput(c: Crit, i: number): string {
  const k = campoDe(c.campo), a = (n: string, v: string, extra: string) => `aria-label="${esc(n)}" data-fc-v${extra} value="${esc(v)}"`;
  if (k.tipo === 'data') return `<input type="date" ${a(`Valor da condição ${i + 1}`, c.v, '')}>${c.op === 'entre' ? `<i>e</i><input type="date" ${a(`Segundo valor da condição ${i + 1}`, c.v2, '2')}>` : ''}`;
  if (k.tipo === 'num') return `<input type="text" inputmode="decimal" placeholder="0,00 €" ${a(`Valor da condição ${i + 1}`, c.v, '')}>${c.op === 'entre' ? `<i>e</i><input type="text" inputmode="decimal" placeholder="0,00 €" ${a(`Segundo valor da condição ${i + 1}`, c.v2, '2')}>` : ''}`;
  if (k.tipo === 'forn') return `<select data-fc-v aria-label="Fornecedor da condição ${i + 1}"><option value="">Escolhe…</option>${FORNECEDORES.map((f) => `<option value="${f.id}"${f.id === c.v ? ' selected' : ''}>${esc(f.nome)} · ${numForn(f.id)}</option>`).join('')}</select>`;
  if (k.tipo === 'enum') return `<select data-fc-v aria-label="Valor da condição ${i + 1}"><option value="">Escolhe…</option>${(k.vals ?? []).map(([v, t]) => `<option value="${v}"${v === c.v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  return `<input type="text" placeholder="Valor a pesquisar" ${a(`Valor da condição ${i + 1}`, c.v, '')}>`;
}
function desenharCrit(r: HTMLElement, e: EstDoc, animar = -1): void {
  const caixa = r.querySelector<HTMLElement>('[data-fc-linhas]'); if (!caixa) return;
  const cs = rascunho(e);
  caixa.innerHTML = cs.map((c, i) => `<div class="dv2-crit" data-fc-i="${i}">
    ${i ? `<select class="dv2-crit-liga" data-fc-liga aria-label="Ligação da condição ${i + 1}"><option value="e"${c.liga === 'e' ? ' selected' : ''}>E</option><option value="ou"${c.liga === 'ou' ? ' selected' : ''}>OU</option></select>` : '<span class="dv2-crit-liga dv2-crit-onde">Onde</span>'}
    <label class="ak-campo"><span>Campo <kbd>F4</kbd></span><select data-fc-campo data-dv2-campo>${CAMPOS.map((k) => `<option value="${k.k}"${k.k === c.campo ? ' selected' : ''}>${esc(k.t)}</option>`).join('')}</select></label>
    <label class="ak-campo" data-fc-anima><span>Condição</span><select data-fc-op data-dv2-campo>${OPS[campoDe(c.campo).tipo].map(([v, t]) => `<option value="${v}"${v === c.op ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    <div class="ak-campo dv2-crit-v" data-fc-anima role="group" aria-label="Valor a pesquisar"><span>Valor a pesquisar</span><div class="dv2-crit-vv">${valorInput(c, i)}</div></div>
    ${cs.length > 1 ? `<button type="button" class="dv2-x" data-dv2-acao="crit-x" data-i="${i}" aria-label="Tirar a condição ${i + 1}">${L(trash)}</button>` : '<span></span>'}
  </div>`).join('');
  caixa.querySelectorAll<HTMLElement>('[data-fc-v]').forEach((x) => x.setAttribute('data-dv2-campo', ''));
  if (animar >= 0 && !quieto()) caixa.querySelectorAll<HTMLElement>(`[data-fc-i="${animar}"] [data-fc-anima]`).forEach((x, k) => x.animate([{ opacity: 0, transform: 'translateY(-3px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: k * 30, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' }));
}
function lerCrit(r: HTMLElement, e: EstDoc): void {
  const cs = rascunho(e);
  r.querySelectorAll<HTMLElement>('[data-fc-i]').forEach((row) => {
    const i = Number(row.dataset.fcI), c = cs[i]; if (!c) return;
    const vs = row.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-fc-v]');
    c.v = vs[0]?.value.trim() ?? ''; c.v2 = row.querySelector<HTMLInputElement>('[data-fc-v2]')?.value.trim() ?? '';
    c.op = row.querySelector<HTMLSelectElement>('[data-fc-op]')?.value ?? c.op; c.liga = (row.querySelector<HTMLSelectElement>('[data-fc-liga]')?.value as Crit['liga']) ?? 'e';
  });
}
function filtrarRegistos(r: HTMLElement, e: EstDoc): void {
  lerCrit(r, e);
  const bons = rascunho(e).filter((c) => c.v || campoDe(c.campo).tipo === 'enum' && c.v);
  if (!bons.length) { toast(r, 'Escreve um valor a pesquisar.'); r.querySelector<HTMLElement>('[data-fc-v]')?.focus(); return; }
  e.extra.crit = bons.map((c) => ({ ...c })); tudo(r, e, true);
  toast(r, `Filtro aplicado: ${bons.length} ${bons.length === 1 ? 'condição' : 'condições'} · ${nf(r.querySelectorAll('tbody tr[data-dv2-id]').length)} faturas.`);
}
function removerFiltro(r: HTMLElement, e: EstDoc): void { e.extra.crit = []; e.extra.rascunho = [novoCrit()]; desenharCrit(r, e); tudo(r, e, true); toast(r, 'Filtro removido.'); }
const construtor = () => `<section class="dv2-construtor" aria-label="Pesquisa avançada">
    <div class="dv2-crit-cab"><b>Pesquisa avançada</b><small>Várias condições: o E vem antes do OU — «A e B ou C» é «(A e B) ou C».</small></div>
    <div data-fc-linhas></div>
    <div class="dv2-crit-acoes">
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="crit-mais">${L(plus)}<span>Adicionar condição</span></button>
      <span class="ak2-esp"></span>
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="remover-filtro" title="Remover filtro (Shift+F2)">${L(funnelX)}<span>Remover filtro</span><kbd>⇧F2</kbd></button>
      <button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="filtrar" title="Filtrar registos (Shift+F1)">${L(funnel)}<span>Filtrar registos</span><kbd>⇧F1</kbd></button>
    </div>
  </section>`;

/* ---------- as colunas e as células ---------- */
const COLS: CfgDoc['cols'] = [
  { k: 'numero', t: 'Número', tipo: 'mono', w: 140, presa: true, antiga: true },
  { k: 'tipo', t: 'Tipo de documento', tipo: 'txt', w: 140 },
  { k: 'data', t: 'Data', tipo: 'data', w: 100, antiga: true },
  { k: 'docForn', t: 'N.º do documento do fornecedor', tipo: 'mono', w: 170, antiga: true },
  { k: 'dataDocForn', t: 'Data do documento do fornecedor', tipo: 'data', w: 130, antiga: true },
  { k: 'fornNum', t: 'N.º do fornecedor', tipo: 'mono', w: 110, antiga: true },
  { k: 'nome', t: 'Nome', tipo: 'txt', w: 180, antiga: true },
  { k: 'estado', t: 'Estado', tipo: 'estado', w: 220 },
  { k: 'temCredito', t: 'Tem crédito?', tipo: 'sim', w: 110, antiga: true },
  { k: 'bloqueado', t: 'Bloqueada', tipo: 'sim', w: 100, antiga: true },
  { k: 'anulado', t: 'Anulada', tipo: 'sim', w: 90, antiga: true },
  { k: 'moeda', t: 'Moeda', tipo: 'txt', w: 70, antiga: true },
  { k: 'valor', t: 'Valor', tipo: 'eur', w: 120, antiga: true },
  { k: 'credito', t: 'Valor do crédito', tipo: 'eur', w: 130, antiga: true },
  { k: 'utilizador', t: 'Utilizador', tipo: 'txt', w: 140, antiga: true },
  { k: 'enc', t: 'Encomenda', tipo: 'mono', w: 130 },
];
const b_ = (cls: string, ic: string, t: string, title = '') => `<span class="lf2-b ${cls}"${title ? ` title="${esc(title)}"` : ''}>${L(ic)}${t}</span>`;
function celula(d: Doc, k: string): string {
  switch (k) {
    case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
    case 'data': case 'dataDocForn': return dia(String(d[k]));
    case 'estado': return `<span class="lf2-badges">${d.anulado ? b_('lf2-b--rutura', ban, 'Anulada') : d.bloqueado ? b_('lf2-b--baixo', lock, 'Bloqueada') : d.temCredito ? b_('lf2-b--enc', receiptText, 'Com crédito') : b_('lf2-b--pend', check, 'Registada')}${!d.anulado && d.verif === 'erro' ? b_('lf2-b--baixo', triangle, 'Diferenças', 'A verificação contra a encomenda e a receção encontrou diferenças') : ''}</span>`;
    case 'temCredito': return d.temCredito ? `<span class="dv2-sim">${L(receiptText)}<b>Sim</b></span>` : '<span class="is-nada">—</span>';
    case 'bloqueado': return d.bloqueado ? `<span class="dv2-sim dv2-sim--aviso">${L(lock)}<b>Sim</b></span>` : '<span class="is-nada">—</span>';
    case 'anulado': return d.anulado ? `<span class="dv2-sim dv2-sim--nao">${L(ban)}<b>Sim</b></span>` : '<span class="is-nada">—</span>';
    case 'valor': return euros(d.valor as number);
    case 'credito': return d.credito ? euros(d.credito as number) : '<span class="is-nada">—</span>';
    default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
  }
}
function valor(d: Doc, k: string): string | number {
  if (k === 'temCredito' || k === 'bloqueado' || k === 'anulado') return d[k] ? 'Sim' : '';
  if (k === 'estado') return d.anulado ? 'Anulada' : d.bloqueado ? 'Bloqueada' : d.temCredito ? 'Com crédito' : 'Registada';
  return (d[k] as string | number) ?? '';
}

/* ---------- o painel ---------- */
const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
const docBtn = (rota: string, titulo: string, ecra: string, t: string, ic = fileText, ref = titulo) => `<button type="button" class="dv2-doc" data-dv2-acao="abrir-doc" data-rota="${rota}" data-titulo="${esc(titulo)}" data-ecra="${ecra}" data-ref="${esc(ref)}">${L(ic)}<span><small>${t}</small><b class="is-mono">${esc(ref)}</b></span>${L(external)}</button>`;
function painel(x: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  const f = f_(d), t = totaisFat(f), cr = creditado(f), forn = fornecedor(f.forn), ncs = creditosDe(f.ref), v = verificar(f);
  if (tab === '_alvo') return `<b data-fc-alvo>${esc(f.ref)}</b><span>${esc(String(d.nome))} · ${esc(f.docForn)} · ${euros(t.total)}${cr ? ` · creditado ${euros(cr)}` : ''}</span><span class="lf2-insp-ir"><button type="button" class="ak-btn" data-dk-janela="fornecedor:${esc(f.forn)}">${L(building)}<span>${esc(String(d.nome))}</span></button></span>`;
  if (tab === 'detalhes') {
    const pc = porqueCreditar(x.perfil, f);
    return `${x.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(x.recusa)}</p>` : ''}
      <div class="dv2-estado-faixa ${f.anulada ? 'is-anulado' : f.bloqueada ? 'is-espera' : 'is-ok'}">${L(f.anulada ? ban : f.bloqueada ? lock : circleCheck)}<span>${f.anulada ? '<b>Anulada.</b> Fica no histórico; não se altera, não se paga nem recebe crédito.' : f.bloqueada ? `<b>Bloqueada</b> — não é anulada: fica à espera. ${esc(f.motivoBloqueio)}` : `<b>Registada.</b> ${cr ? `Creditados ${euros(cr)} de ${euros(t.total)}; faltam ${euros(t.total - cr)}. Ter crédito não quer dizer paga.` : 'Sem crédito.'}`}</span>
        ${!f.anulada && podeF(x.perfil, 'bloquear') ? `<button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="bloquear">${L(f.bloqueada ? lockOpen : lock)}<span>${f.bloqueada ? 'Desbloquear' : 'Bloquear'}</span></button>` : ''}
        ${pc ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="credito">${L(receipt)}<span>Lançar crédito</span><kbd>Ctrl F1</kbd></button>`}</div>
      <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(f.ref)}</b>`)}${dd('Tipo de documento', esc(NOME_TIPO[f.tipo]))}${dd('Data', `${dia(f.data)}${periodoAberto(f.data) ? '' : ' <span class="lf2-b lf2-b--baixo">período fechado</span>'}`)}${dd('Moeda', 'EUR · euro')}
        ${dd('Fornecedor', `${esc(String(d.nome))}<small>N.º ${esc(String(d.fornNum))} · ${esc(forn?.nif ?? '')}</small>`)}${dd('N.º do documento do fornecedor', `<b class="is-mono">${esc(f.docForn)}</b>`)}${dd('Data do documento do fornecedor', dia(f.dataDocForn))}${dd('Registada por', esc(PERFIS[f.criador].pessoa))}
        ${dd('Valor líquido', euros(t.liquido))}${dd('IVA', t.iva.map((i) => `${pct(i.taxa)}: ${euros(i.valor)}`).join(' · ') || '—')}${dd('Valor', `<b>${euros(t.total)}</b>`)}${dd('Valor do crédito', cr ? `<b>${euros(cr)}</b><small>${ncs.length} ${ncs.length === 1 ? 'nota' : 'notas'} de crédito</small>` : '—')}
        ${dd('Observações', esc(f.notas || '—'), 'is-largo')}</dl>
      <details class="dv2-hist"><summary>Auditoria (${f.historico.length})</summary><ol>${f.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
  }
  if (tab === 'linhas') return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Tipo</th><th>Artigo</th><th>Descrição</th><th class="is-num">Qtd.</th><th class="is-num">Preço</th><th class="is-num">Desc.</th><th class="is-num">Valor líquido</th><th class="is-num">IVA</th></tr></thead><tbody>${f.linhas.map((l) => `<tr><td>${l.tipo === 'artigo' ? 'Artigo' : 'Serviço'}</td><td class="is-mono">${esc(l.ref || '—')}</td><td>${esc(l.desc)}</td><td class="is-num">${nf(l.qtd)}</td><td class="is-num">${euros(l.preco)}</td><td class="is-num">${pct(l.desconto)}</td><td class="is-num">${euros(liquidoLinha(l))}</td><td class="is-num">${pct(l.iva)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="6">Valor líquido</td><td class="is-num">${euros(t.liquido)}</td><td></td></tr>${t.iva.map((i) => `<tr><td colspan="6">IVA ${pct(i.taxa)} sobre ${euros(i.base)}</td><td class="is-num">${euros(i.valor)}</td><td></td></tr>`).join('')}<tr class="is-total"><td colspan="6">Valor</td><td class="is-num"><b>${euros(t.total)}</b></td><td></td></tr></tfoot></table>`;
  if (tab === 'documentos') {
    if (x.extra.docsCarregar) return '<div class="lf2-esq lf2-esq--peq" aria-label="A carregar os documentos"><i></i><i></i><i></i></div>';
    return `<ol class="dv2-cadeia" aria-label="Documentos ligados">
      <li>${f.enc ? docBtn('compras.encomenda', f.enc, 'compras-encomenda', 'Encomenda') : '<span class="dv2-cadeia-nada">Sem encomenda</span>'}</li>
      <li>${f.rec ? docBtn('compras.rececoes', 'Receções', 'compras-rececoes', 'Receção', packageCheck, f.rec) : '<span class="dv2-cadeia-nada">Sem receção</span>'}</li>
      <li class="dv2-cadeia-este"><span class="dv2-doc is-este">${L(receipt)}<span><small>Esta fatura</small><b class="is-mono">${esc(f.ref)}</b></span></span></li>
      ${ncs.length ? ncs.map((n) => `<li data-fc-nc="${esc(n.ref)}">${docBtn('compras.compras-notas-credito', 'Notas de crédito', 'cm-compras-notas-credito', `Nota de crédito · ${euros(n.valor)}`, receiptText, n.ref)}</li>`).join('') : '<li><span class="dv2-cadeia-nada">Sem notas de crédito</span></li>'}</ol>
      <h3 class="dv2-h3">Verificação contra a encomenda e a receção</h3>
      <ul class="dv2-verif">${v.linhas.map((y) => `<li class="is-${y.nivel}">${L(y.nivel === 'ok' ? circleCheck : y.nivel === 'aviso' ? circleHelp : triangle)}<span>${esc(y.t)}</span></li>`).join('')}</ul>
      <p class="lf2-nota">Uma diferença não bloqueia a fatura sozinha: bloquear é uma decisão (Bloquear), e fica no histórico.</p>`;
  }
  if (tab === 'creditos') {
    const falta = t.total - cr, pc = porqueCreditar(x.perfil, f);
    return `<div class="dv2-anexos-cab"><h3>Notas de crédito (${ncs.length})</h3>${pc ? `<small>${esc(pc)}</small>` : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="credito">${L(receipt)}<span>Lançar crédito</span><kbd>Ctrl F1</kbd></button>`}</div>
      <div class="dv2-cred-barra" role="img" aria-label="Creditado ${euros(cr)} de ${euros(t.total)}"><i style="transform:scaleX(${t.total ? cr / t.total : 0})"></i><span>Creditado <b>${euros(cr)}</b> de ${euros(t.total)} · falta ${euros(falta)}</span></div>
      ${ncs.length ? `<ul class="dv2-edi-l dv2-nc-l">${ncs.map((n) => `<li data-fc-nc="${esc(n.ref)}"><span><b class="is-mono">${esc(n.ref)} · ${euros(n.valor)}</b><small>${dia(n.data)} · ${esc(n.motivo)} · ${esc(PERFIS[n.por].pessoa)}</small></span>${docBtn('compras.compras-notas-credito', 'Notas de crédito', 'cm-compras-notas-credito', 'Abrir', external, n.ref)}</li>`).join('')}</ul>` : '<p class="lf2-sem">Sem notas de crédito. Lançar um crédito não anula a fatura: a fatura fica, com o valor creditado ao lado.</p>'}`;
  }
  return '';
}

/* ---------- a ficha ---------- */
const campoF = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;
const eur = (c: number) => (c / 100).toFixed(2).replace('.', ',');
const opsEnc = (forn: string, sel: string) => `<option value="">Sem encomenda</option>${encomendas().filter((e) => e.forn === forn && e.estado !== 'Cancelada' && e.estado !== 'Rascunho').map((e) => `<option value="${e.ref}"${e.ref === sel ? ' selected' : ''}>${e.ref} · ${e.estado}</option>`).join('')}`;
const opsRec = (enc: string, sel: string) => `<option value="">Sem receção</option>${enc ? rececoesDe(enc).map((r) => `<option value="${r.ref}"${r.ref === sel ? ' selected' : ''}>${r.ref} · ${dia(r.data)}</option>`).join('') : ''}`;
const IVAS = [2300, 1300, 600, 0];
function linhaFicha(i: number, l: Partial<LinhaFat>, dis: boolean): string {
  const s = dis ? ' disabled' : '';
  return `<tr data-dv2-linha="${i}"><td><select data-dv2-ff="tp-${i}" data-fl="tipo" aria-label="Tipo, linha ${i + 1}"${s}><option value="artigo"${l.tipo !== 'servico' ? ' selected' : ''}>Artigo</option><option value="servico"${l.tipo === 'servico' ? ' selected' : ''}>Serviço</option></select></td>
    <td><input type="text" list="dv2-artigos-fat" value="${esc(l.ref ?? '')}" data-dv2-ff="art-${i}" data-fl="ref" aria-label="Artigo, linha ${i + 1}" placeholder="${l.tipo === 'servico' ? '—' : 'Referência'}"${s}></td>
    <td><input type="text" value="${esc(l.desc ?? '')}" data-dv2-ff="de-${i}" data-fl="desc" aria-label="Descrição, linha ${i + 1}"${s}></td>
    <td><input type="text" inputmode="numeric" class="is-num" value="${l.qtd ?? ''}" data-dv2-ff="q-${i}" data-fl="qtd" aria-label="Quantidade, linha ${i + 1}"${s}></td>
    <td><input type="text" inputmode="decimal" class="is-num" value="${l.preco != null ? eur(l.preco) : ''}" data-dv2-ff="p-${i}" data-fl="preco" aria-label="Preço, linha ${i + 1}" placeholder="0,00"${s}></td>
    <td><input type="text" inputmode="decimal" class="is-num" value="${((l.desconto ?? 0) / 100).toString().replace('.', ',')}" data-dv2-ff="d-${i}" data-fl="desconto" aria-label="Desconto em %, linha ${i + 1}"${s}></td>
    <td><select data-dv2-ff="iva-${i}" data-fl="iva" aria-label="IVA, linha ${i + 1}"${s}>${IVAS.map((v) => `<option value="${v}"${v === (l.iva ?? 2300) ? ' selected' : ''}>${pct(v)}</option>`).join('')}</select></td>
    <td class="is-num" data-fl-liq>—</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`;
}
function ficha(x: EstDoc, fi: Ficha, d: Doc | undefined): string {
  const f = d ? f_(d) : undefined, porque = f ? porqueAlterar(x.perfil, f) : '', ver = fi.modo === 'editar' && !!porque, s = ver ? ' disabled' : '';
  const forn = f?.forn ?? '', enc = f?.enc ?? '', rec = f?.rec ?? '';
  return `<div class="dv2-ficha-c"><header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(receipt)}</span><div><small>${fi.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${fi.modo === 'criar' ? 'Nova fatura de compra' : `${esc(f!.ref)} · ${esc(String(d!.nome))}`}</h2></div>
      <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
    <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p>
    <p class="dv2-ficha-modo">${ver ? esc(porque) : `O período aberto é outubro de 2026. O mesmo documento do mesmo fornecedor não se regista duas vezes. ${fi.modo === 'criar' ? 'Com uma receção, as linhas vêm dela, com os preços da encomenda.' : ''}`}</p>
    <div class="dv2-ficha-g">
      ${campoF('serie', 'Série', '<select id="dv2-ff-serie" disabled><option>FC 2026</option></select>')}
      ${campoF('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(f?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
      ${campoF('tipo', 'Tipo de documento', `<select id="dv2-ff-tipo" data-dv2-ff="tipo"${s}>${(['FT', 'VD', 'ND'] as TipoFat[]).map((t) => `<option value="${t}"${t === (f?.tipo ?? 'FT') ? ' selected' : ''}>${NOME_TIPO[t]}</option>`).join('')}</select>`)}
      ${campoF('data', 'Data', `<input type="date" id="dv2-ff-data" value="${f?.data ?? HOJE}" data-dv2-ff="data"${s}>`)}
      ${campoF('forn', 'Fornecedor', `<select id="dv2-ff-forn" data-dv2-ff="forn"${fi.modo === 'criar' ? '' : ' disabled'}>${fi.modo === 'criar' ? '<option value="">Escolhe o fornecedor…</option>' : ''}${FORNECEDORES.map((y) => `<option value="${y.id}"${y.id === forn ? ' selected' : ''}>${esc(y.nome)} · ${numForn(y.id)}</option>`).join('')}</select>`)}
      ${campoF('docForn', 'N.º do documento do fornecedor', `<input type="text" id="dv2-ff-docForn" value="${esc(f?.docForn ?? '')}" data-dv2-ff="docForn"${s}>`)}
      ${campoF('dataDocForn', 'Data do documento do fornecedor', `<input type="date" id="dv2-ff-dataDocForn" value="${f?.dataDocForn ?? ''}" data-dv2-ff="dataDocForn"${s}>`)}
      ${campoF('moeda', 'Moeda', '<select id="dv2-ff-moeda" disabled><option>EUR · euro</option></select>')}
      ${campoF('enc', 'Encomenda', `<select id="dv2-ff-enc" data-dv2-ff="enc"${s}>${opsEnc(forn, enc)}</select>`)}
      ${campoF('rec', 'Receção', `<select id="dv2-ff-rec" data-dv2-ff="rec"${s}>${opsRec(enc, rec)}</select>`)}
      ${campoF('notas', 'Observações', `<textarea id="dv2-ff-notas" rows="2" data-dv2-ff="notas"${s}>${esc(f?.notas ?? '')}</textarea>`, 'is-largo')}
    </div>
    <h3 class="dv2-h3">Linhas</h3><datalist id="dv2-artigos-fat">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)}</option>`).join('')}</datalist>
    <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Tipo</th><th>Artigo</th><th>Descrição</th><th class="is-num">Qtd.</th><th class="is-num">Preço (€)</th><th class="is-num">Desc. (%)</th><th>IVA</th><th class="is-num">Valor líquido</th><th><span class="sr">Tirar</span></th></tr></thead><tbody data-dv2-linhas>${(f?.linhas.length ? f.linhas : [{ tipo: 'artigo' as const }]).map((l, i) => linhaFicha(i, l, ver)).join('')}</tbody>
      <tfoot><tr><td colspan="7">Valor líquido</td><td class="is-num" data-fl-t="liquido">—</td><td></td></tr><tr><td colspan="7">IVA</td><td class="is-num" data-fl-t="iva">—</td><td></td></tr><tr class="is-total"><td colspan="7">Valor</td><td class="is-num" data-fl-t="total">—</td><td></td></tr></tfoot></table></div>
    ${ver ? '' : `<div class="dv2-ficha-linha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar linha</span></button><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="da-rececao">${L(download)}<span>Trazer as linhas da receção</span></button></div>`}
    <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. Valores com vírgula (ex.: 15,50). Esc fecha (com alterações, pergunta).</p></div>`;
}
const recusa = (m: string, c: string) => Object.assign(new Recusa(m), { campo: c });
function lerLinhas(r: HTMLElement, validar: boolean): LinhaFat[] {
  return [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr, i): LinhaFat | null => {
    const v = (k: string) => tr.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-fl="${k}"]`)?.value.trim() ?? '';
    const tipo = v('tipo') === 'servico' ? 'servico' : 'artigo', ref = v('ref'), q = v('qtd'), p = v('preco');
    if (!ref && !q && !p && !v('desc')) return null;
    if (validar && tipo === 'artigo' && !artigo(ref)) throw recusa(ref ? `«${ref}» não é um artigo conhecido (ou escolhe «Serviço»).` : 'Escreve o artigo da linha, ou escolhe «Serviço».', `art-${i}`);
    if (validar && tipo === 'servico' && !v('desc')) throw recusa('Descreve o serviço da linha.', `de-${i}`);
    const qtd = Number(q.replace(/\s/g, '')); if (validar && (!Number.isInteger(qtd) || qtd <= 0)) throw recusa('A quantidade é um número inteiro maior do que zero.', `q-${i}`);
    const preco = lerEuros(p); if (validar && preco === null) throw recusa('O preço é um valor em euros, ex.: 15,50.', `p-${i}`);
    const desconto = lerPercentagem(v('desconto') || '0'); if (validar && desconto === null) throw recusa('O desconto vai de 0 a 100 %.', `d-${i}`);
    return { id: String.fromCharCode(97 + i), tipo, ref: tipo === 'artigo' ? ref : '', desc: v('desc') || artigo(ref)?.desc || '', qtd: Number.isFinite(qtd) ? qtd : 0, preco: preco ?? 0, desconto: desconto ?? 0, iva: Number(v('iva') || 2300) };
  }).filter((l): l is LinhaFat => !!l);
}
function gravar(r: HTMLElement, x: EstDoc, fi: Ficha): { ref: string; msg: string } {
  const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
  const ls = lerLinhas(r, true);
  const dados = { tipo: (v('tipo') || 'FT') as TipoFat, data: v('data'), docForn: v('docForn'), dataDocForn: v('dataDocForn'), forn: v('forn'), moeda: 'EUR' as const, enc: v('enc'), rec: v('rec'), notas: v('notas'), linhas: ls };
  if (fi.modo === 'criar') { const n = registarFat(x.perfil, dados); return { ref: n.ref, msg: `Fatura ${n.ref} registada: ${euros(totaisFat(n).total)}.` }; }
  const d = ativoDe(r, x); if (!d) throw new Recusa('A fatura já não está na lista.');
  const f = f_(d), g = alterarFat(x.perfil, { ...f, ...dados, forn: f.forn }, f.versao);
  return { ref: g.ref, msg: `${g.ref} gravada (versão ${g.versao}).` };
}
function recalcular(r: HTMLElement): void {
  const ls = lerLinhas(r, false), t = totaisFat({ linhas: ls });
  r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr').forEach((tr, i) => { const c = tr.querySelector<HTMLElement>('[data-fl-liq]'); const l = ls[i]; if (c) c.textContent = l ? euros(liquidoLinha(l)) : '—'; });
  const s = (k: string, val: string) => { const c = r.querySelector<HTMLElement>(`[data-dv2-ficha] [data-fl-t="${k}"]`); if (c) c.textContent = val; };
  s('liquido', euros(t.liquido)); s('iva', euros(t.total - t.liquido)); s('total', euros(t.total));
}
function daRececao(r: HTMLElement, x: EstDoc): void {
  const rec = r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="rec"]')?.value, enc = r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="enc"]')?.value;
  if (!rec || !enc) { toast(r, 'Escolhe a encomenda e a receção primeiro.'); return; }
  const e = encomenda(enc), rc = rececoesDe(enc).find((y) => y.ref === rec); if (!e || !rc) return;
  const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!;
  tb.innerHTML = rc.linhas.map((l, i) => { const le = e.linhas.find((y) => y.id === l.linha); return linhaFicha(i, { tipo: 'artigo', ref: l.ref, desc: artigo(l.ref)?.desc ?? '', qtd: l.aceite, preco: le?.preco ?? 0, desconto: le?.desc ?? 0, iva: le?.iva ?? 2300 }, false); }).join('');
  if (!quieto()) tb.querySelectorAll('tr').forEach((tr, i) => tr.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: i * 40, easing: 'ease-out', fill: 'backwards' }));
  if (x.ficha) x.ficha.sujo = true; recalcular(r); toast(r, `${rc.linhas.length} linhas da ${rc.ref}, com os preços da ${e.ref}.`);
}

/* ---------- lançar crédito (Ctrl+F1) ---------- */
function dlgCredito(r: HTMLElement, x: EstDoc, erro = '', campo = '', chave = ''): void {
  const d = ativoDe(r, x); if (!d) return;
  const f = f_(d), p = porqueCreditar(x.perfil, f); if (p && !erro) { toast(r, p); return; }
  const t = totaisFat(f), cr = creditado(f), falta = t.total - cr, k = chave || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`);
  const ant = r.querySelector<HTMLInputElement>('[data-fc-valor]')?.value ?? '', antM = r.querySelector<HTMLTextAreaElement>('[data-fc-motivo]')?.value ?? '';
  dialogo(r, `<h2 id="dv2-dlg-t">${L(receipt)}Lançar crédito</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(f.ref)}</b> · ${esc(String(d.nome))} · documento ${esc(f.docForn)}</p>
    <dl class="lf2-dl lf2-dl--3"><div><dt>Valor da fatura</dt><dd>${euros(t.total)}</dd></div><div><dt>Já creditado</dt><dd>${euros(cr)}</dd></div><div><dt>Falta creditar</dt><dd><b>${euros(falta)}</b></dd></div></dl>
    <div class="lf2-dlg-campos"><label class="ak-campo" for="dv2-fc-valor"><span>Valor do crédito (€, com IVA)</span><input id="dv2-fc-valor" type="text" inputmode="decimal" placeholder="0,00" data-fc-valor data-dv2-primeiro value="${esc(ant)}"${campo === 'valor' ? ' aria-invalid="true"' : ''}></label>
      <label class="ak-campo" for="dv2-fc-data"><span>Data</span><input id="dv2-fc-data" type="date" value="${HOJE}" readonly></label></div>
    <label class="ak-campo dv2-motivo" for="dv2-fc-motivo"><span>Motivo (obrigatório)</span><textarea id="dv2-fc-motivo" rows="2" data-fc-motivo placeholder="Ex.: diferença de preço do BKR6E"${campo === 'motivo' ? ' aria-invalid="true"' : ''}>${esc(antM)}</textarea></label>
    ${erro ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(erro)}</p>` : ''}
    <ul class="dv2-regras"><li>Cria uma <b>nota de crédito</b> ligada a esta fatura; a fatura <b>não</b> é anulada.</li><li>O crédito não passa o que falta creditar. Se a ligação falhar, tentar outra vez não duplica: o pedido leva sempre a mesma chave.</li></ul>
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="credito-sim" data-chave="${esc(k)}">${L(receipt)}<span>Lançar crédito</span><kbd>Ctrl Enter</kbd></button></div>`);
}
async function creditoSim(r: HTMLElement, x: EstDoc, b: HTMLElement): Promise<void> {
  const d = ativoDe(r, x); if (!d || x.ocupado) return;
  const valor = lerEuros(r.querySelector<HTMLInputElement>('[data-fc-valor]')?.value.trim() ?? ''), motivo = r.querySelector<HTMLTextAreaElement>('[data-fc-motivo]')?.value ?? '', chave = b.dataset.chave!;
  x.ocupado = 'credito'; x.extra.ocupadoTexto = 'A lançar o crédito…'; b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.innerHTML = `${L(loader)}<span>A lançar…</span>`;
  await new Promise((ok) => requestAnimationFrame(() => ok(null)));
  try {
    const de_ = r.querySelector<HTMLElement>('[data-fc-alvo]')?.getBoundingClientRect();
    const { nc, repetido } = lancarCredito(x.perfil, f_(d).ref, valor ?? -1, motivo, chave);
    x.ocupado = ''; fecharDialogo(r); x.tab = 'creditos'; tudo(r, x, true);
    /* a fatura passa a crédito: a nota nasce da referência da fatura, no painel (só transform e opacity) */
    const li = r.querySelector<HTMLElement>(`.dv2-nc-l [data-fc-nc="${CSS.escape(nc.ref)}"]`);
    if (li && de_ && !quieto()) { const p = li.getBoundingClientRect(); li.animate([{ transform: `translate(${de_.left - p.left}px, ${de_.top - p.top}px) scale(.6)`, opacity: .2, transformOrigin: '0 0' }, { transform: 'none', opacity: 1, transformOrigin: '0 0' }], { duration: 340, easing: 'cubic-bezier(.22, 1, .36, 1)' }); }
    const bar = r.querySelector<HTMLElement>('.dv2-cred-barra i'); if (bar && !quieto()) bar.animate([{ transform: `scaleX(${Math.max(0, (creditado(f_(d)) - nc.valor) / totaisFat(f_(d)).total)})` }, { transform: bar.style.transform }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    toast(r, repetido ? `Já estava lançada: ${nc.ref} (${euros(nc.valor)}). Nada se duplicou.` : `${nc.ref} lançada: ${euros(nc.valor)}. A ${d.ref} fica com ${euros(creditado(f_(d)))} creditados.`);
  } catch (y) {
    x.ocupado = ''; dlgCredito(r, x, y instanceof Recusa ? y.message : 'O servidor não confirmou o crédito. Tentar outra vez é seguro: o pedido leva a mesma chave.', (y as { campo?: string }).campo ?? '', chave);
  }
}
function dlgBloquear(r: HTMLElement, x: EstDoc, erro = ''): void {
  const d = ativoDe(r, x); if (!d) return; const f = f_(d);
  dialogo(r, `<h2 id="dv2-dlg-t">${L(f.bloqueada ? lockOpen : lock)}${f.bloqueada ? 'Desbloquear' : 'Bloquear'} a ${esc(f.ref)}?</h2><p>${f.bloqueada ? `Está bloqueada: ${esc(f.motivoBloqueio)}. Desbloquear deixa-a seguir para pagamento e receber crédito.` : 'Bloquear não é anular: a fatura fica, à espera, e não segue para pagamento nem recebe crédito até se desbloquear.'}</p>
    <label class="ak-campo dv2-motivo" for="dv2-fc-bl"><span>Motivo${f.bloqueada ? ' (opcional)' : ' (obrigatório)'}</span><textarea id="dv2-fc-bl" rows="2" data-fc-bl data-dv2-primeiro></textarea></label>${erro ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(erro)}</p>` : ''}
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="bloquear-sim">${L(f.bloqueada ? lockOpen : lock)}<span>${f.bloqueada ? 'Desbloquear' : 'Bloquear'}</span></button></div>`);
}

/* ---------- registar ---------- */
const CFG = registar({
  k: 'fat', titulo: 'Faturas de Compra', sub: 'Consulta, regista e acompanha faturas e créditos de fornecedores.', icone: receipt, um: 'fatura', o: 'a',
  caminho: [['ERP', 'inicio'], ['Compras', 'compras'], ['Faturas', '']],
  cols: COLS, verIniciais: ['numero', 'data', 'docForn', 'dataDocForn', 'fornNum', 'nome', 'estado', 'temCredito', 'bloqueado', 'anulado', 'moeda', 'valor', 'credito', 'utilizador'],
  campos: { numero: 'n', data: 'data', codigo: 'forn', descricao: 'nome' },
  linhas: () => linhas(), series: () => [...new Set(faturas().map((f) => f.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.forn), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
  estados: [['', 'Todas'], ['credito', 'Com crédito'], ['bloqueada', 'Bloqueadas'], ['anulada', 'Anuladas'], ['diferencas', 'Com diferenças'], ['normal', 'Sem crédito nem bloqueio']],
  estadoPassa: (d, v) => v === 'credito' ? !!d.temCredito : v === 'bloqueada' ? !!d.bloqueado : v === 'anulada' ? !!d.anulado : v === 'diferencas' ? !d.anulado && d.verif === 'erro' : v === 'normal' ? !d.temCredito && !d.bloqueado && !d.anulado : true,
  celula, valor,
  resumo: (ls) => {
    if (!ls.length) return '';
    const vivas = ls.filter((d) => !d.anulado), moedas = new Set(vivas.map((d) => String(d.moeda))), soma = vivas.reduce((s, d) => s + (d.valor as number), 0), cr = vivas.reduce((s, d) => s + (d.credito as number), 0);
    const pl = (n: number, a: string, b: string) => `<span><b>${nf(n)}</b> ${n === 1 ? a : b}</span>`;
    return `${pl(ls.filter((d) => d.bloqueado && !d.anulado).length, 'bloqueada', 'bloqueadas')}${pl(ls.filter((d) => d.temCredito).length, 'com crédito', 'com crédito')}${pl(ls.filter((d) => d.anulado).length, 'anulada', 'anuladas')}${moedas.size === 1 ? `<span>Soma em ${[...moedas][0]} (sem anuladas) <b>${euros(soma)}</b> · créditos <b>${euros(cr)}</b></span>` : '<span>Várias moedas: sem soma.</span>'}`;
  },
  barra: `${BTN('credito', receipt, 'Lançar crédito', 'Ctrl+F1', '', 'ak-btn--acao')}${BTN('bloquear', lock, 'Bloquear', '')}`, teclasExtra: '',
  tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'documentos', t: 'Documentos', ic: link }, { k: 'creditos', t: 'Créditos', ic: receiptText }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
  painel, ficha, gravar,
  porque: {
    novo: (x) => podeF(x.perfil, 'registar') ? '' : 'O teu perfil não regista faturas.',
    editar: (x, d) => !d ? 'Escolhe uma fatura na lista.' : porqueAlterar(x.perfil, f_(d)),
    anular: (x, d) => !d ? 'Escolhe uma fatura na lista.' : porqueAnular(x.perfil, f_(d)),
  },
  anular: {
    texto: (d) => [`Anular a ${d.ref}?`, `A fatura de ${esc(String(d.nome))} (documento ${esc(String(d.docForn))}) fica anulada e no histórico: nada se apaga. Anular não é bloquear nem creditar.`],
    fazer: (x, d, motivo) => { const f = anularFat(x.perfil, String(d.ref), motivo); return `${f.ref} anulada. Fica no histórico.`; },
  },
  docAnexo: (d) => String(d.ref),
  teclas: [{ tecla: 'Ctrl+F1', acao: 'credito' }, { tecla: 'Shift+F1', acao: 'filtrar' }, { tecla: 'Shift+F2', acao: 'remover-filtro' }],
  construtor, filtrar: (e, d) => { const cs = aplicados(e); return !cs.length || avaliar(d, cs); }, chips: (e) => aplicados(e).map((c, i): [string, string] => [`x:${i}`, `${i ? (c.liga === 'ou' ? 'OU ' : 'E ') : ''}${textoCrit(c)}`]),
  acao(r, x, k, b) {
    if (k === '_barra') {
      if (!r.querySelector('[data-fc-i]')) desenharCrit(r, x);
      const d = ativoDe(r, x), f = d ? f_(d) : undefined;
      const c = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="credito"]'); if (c && !x.ocupado) { const p = !f ? 'Escolhe uma fatura na lista.' : porqueCreditar(x.perfil, f); c.setAttribute('aria-disabled', String(!!p)); c.title = p || 'Lançar crédito (Ctrl+F1)'; }
      const bl = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="bloquear"]'); if (bl) { const p = !f ? 'Escolhe uma fatura na lista.' : !podeF(x.perfil, 'bloquear') ? 'Só o Financeiro e a Administração bloqueiam faturas.' : f.anulada ? 'A fatura está anulada.' : ''; bl.setAttribute('aria-disabled', String(!!p)); bl.title = p || (f?.bloqueada ? 'Desbloquear' : 'Bloquear'); const s = bl.querySelector('span'); if (s) s.textContent = f?.bloqueada ? 'Desbloquear' : 'Bloquear'; }
      return true;
    }
    if (k === '_ficha-aberta') { recalcular(r); return true; }
    if (k === '_ficha-input') {
      const t = b as HTMLInputElement;
      if (t.dataset.dv2Ff === 'forn') { const e_ = r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="enc"]')!; e_.innerHTML = opsEnc(t.value, ''); r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="rec"]')!.innerHTML = opsRec('', ''); }
      if (t.dataset.dv2Ff === 'enc') r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="rec"]')!.innerHTML = opsRec(t.value, '');
      if (t.dataset.fl === 'ref') { const a = artigo(t.value.trim()), tr = t.closest('tr')!; const de_ = tr.querySelector<HTMLInputElement>('[data-fl="desc"]'); if (a && de_ && !de_.value) de_.value = a.desc; const iv = tr.querySelector<HTMLSelectElement>('[data-fl="iva"]'); if (a && iv) iv.value = String(a.iva); const pr = tr.querySelector<HTMLInputElement>('[data-fl="preco"]'); if (a && pr && !pr.value && a.preco !== null) pr.value = eur(a.preco); }
      recalcular(r); return true;
    }
    if (k === 'credito') { dlgCredito(r, x); return true; }
    if (k === 'credito-sim') { void creditoSim(r, x, b); return true; }
    if (k === 'bloquear') { dlgBloquear(r, x); return true; }
    if (k === 'bloquear-sim') { const d = ativoDe(r, x); if (!d) return true; const f = f_(d); try { bloquearFat(x.perfil, f.ref, !f.bloqueada, r.querySelector<HTMLTextAreaElement>('[data-fc-bl]')?.value ?? ''); fecharDialogo(r); tudo(r, x, true); toast(r, `${f.ref} ${f.bloqueada ? 'bloqueada' : 'desbloqueada'}.`); } catch (y) { dlgBloquear(r, x, y instanceof Recusa ? y.message : 'Não foi possível. Nada mudou.'); } return true; }
    if (k === 'filtrar') { filtrarRegistos(r, x); return true; }
    if (k === 'remover-filtro') { if (!aplicados(x).length) { toast(r, 'Não há filtro aplicado.'); return true; } removerFiltro(r, x); return true; }
    if (k === 'crit-mais') { lerCrit(r, x); rascunho(x).push(novoCrit('valor')); desenharCrit(r, x, rascunho(x).length - 1); r.querySelector<HTMLElement>(`[data-fc-i="${rascunho(x).length - 1}"] [data-fc-campo]`)?.focus(); return true; }
    if (k === 'crit-x') { lerCrit(r, x); rascunho(x).splice(Number(b.dataset.i), 1); desenharCrit(r, x); return true; }
    if (k === 'tirar') { const i = Number(b.dataset.dv2Tirar!.slice(2)); x.extra.crit = aplicados(x).filter((_, j) => j !== i); tudo(r, x, true); return true; }
    if (k === 'abrir-doc') { abrirDoc(b, b.dataset.rota!, b.dataset.titulo!, b.dataset.ecra!, b.dataset.ref || b.dataset.titulo!); if (!emSeparador()) return true; const li = b.closest('li'); if (li && !quieto()) li.animate([{ boxShadow: '0 0 0 0 color-mix(in srgb, var(--h-laranja) 60%, transparent)' }, { boxShadow: '0 0 0 8px transparent' }], { duration: 500 }); return true; }
    if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!, i = tb.children.length; tb.insertAdjacentHTML('beforeend', linhaFicha(i, { tipo: 'artigo' }, false)); const tr = tb.lastElementChild as HTMLElement; if (!quieto()) tr.animate([{ opacity: 0, transform: 'scaleY(.4)', transformOrigin: 'top' }, { opacity: 1, transform: 'none', transformOrigin: 'top' }], { duration: 180, easing: 'ease-out' }); tr.querySelector<HTMLElement>('input')?.focus(); if (x.ficha) x.ficha.sujo = true; return true; }
    if (k === 'del-linha') { const tr = b.closest('tr'), tb = tr?.parentElement; if (tr && tb && tb.children.length > 1) { tr.remove(); if (x.ficha) x.ficha.sujo = true; recalcular(r); } else toast(r, 'A fatura precisa de pelo menos uma linha.'); return true; }
    if (k === 'da-rececao') { daRececao(r, x); return true; }
    return false;
  },
  cenario(r, x, cen) {
    const fs = faturas(), alvo: Record<string, string | undefined> = { bloqueada: fs.find((f) => f.bloqueada)?.ref, anulada: fs.find((f) => f.anulada)?.ref, creditada: fs.find((f) => f.creditos.length)?.ref, verificacao: fs.find((f) => f.bloqueada)?.ref, editar: fs.find((f) => !porqueAlterar('financeiro', f))?.ref, credito: fs.find((f) => !porqueCreditar('financeiro', f))?.ref };
    ['a-creditar', 'creditado', 'credito-falhou', 'credito-desconhecido'].forEach((k) => { alvo[k] = alvo.credito; });
    if (['credito', 'a-creditar', 'creditado', 'credito-falhou', 'credito-desconhecido', 'bloqueada', 'anulada', 'creditada', 'verificacao', 'anular'].includes(cen)) x.perfil = 'financeiro';
    if (alvo[cen]) x.ativo = alvo[cen]!;
    if (cen === 'anular') x.ativo = alvo.editar ?? '';
    if (cen === 'creditada') x.tab = 'creditos';
    if (cen === 'verificacao' || cen === 'documentos-carregar') { x.tab = 'documentos'; if (cen === 'documentos-carregar') x.extra.docsCarregar = true; }
    if (cen === 'construtor') { x.extra.rascunho = [{ campo: 'valor', op: 'maior', v: '500,00', v2: '', liga: 'e' }, { campo: 'estado', op: 'dif', v: 'anulada', v2: '', liga: 'e' }, { campo: 'forn', op: 'igual', v: 'ngk', v2: '', liga: 'ou' }]; x.extra.crit = (x.extra.rascunho as Crit[]).map((c) => ({ ...c })); }
    if (cen === 'sem-resultados') { x.q = ''; x.extra.rascunho = [{ campo: 'docForn', op: 'comeca', v: 'XPTO', v2: '', liga: 'e' }]; x.extra.crit = [{ campo: 'docForn', op: 'comeca', v: 'XPTO', v2: '', liga: 'e' }]; }
    if (cen === 'creditado') { const f = fatura(alvo.creditado ?? '') ?? fs[0]; x.aviso = `NC 2026/0032 lançada: 25,00 € na ${alvo.credito}. A nota abre-se nas notas de crédito.`; void f; x.tab = 'creditos'; }
    requestAnimationFrame(() => {
      desenharCrit(r, x);
      if (cen === 'credito' || cen === 'a-creditar' || cen === 'credito-falhou' || cen === 'credito-desconhecido') dlgCredito(r, x, cen === 'credito-falhou' ? 'O crédito não pode passar o que falta creditar: 412,55 €.' : cen === 'credito-desconhecido' ? 'O servidor de contabilidade não respondeu a tempo: não se sabe se o crédito ficou lançado. Tentar outra vez é seguro — o pedido leva a mesma chave e, se já tiver ficado, devolve a mesma nota.' : '', cen === 'credito-falhou' ? 'valor' : '');
      if (cen === 'a-creditar') { const b = r.querySelector<HTMLElement>('[data-dv2-acao="credito-sim"]'); if (b) { b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.innerHTML = `${L(loader)}<span>A lançar…</span>`; } }
      if (cen === 'duplicado' || cen === 'invalido') { const fx = r.querySelector<HTMLElement>('[data-dv2-ficha]'); const er = fx?.querySelector<HTMLElement>('[data-dv2-ficha-erro]'); const set = (k: string, v: string) => { const el = fx?.querySelector<HTMLInputElement>(`[data-dv2-ff="${k}"]`); if (el) el.value = v; }; set('forn', 'brembo'); set('docForn', cen === 'duplicado' ? 'BR-FT-77120' : ''); set('dataDocForn', '2026-10-21'); if (er) { er.hidden = false; er.innerHTML = `${L(circleAlert)}<span>${cen === 'duplicado' ? 'Documento repetido: a FC 2026/00123 já tem o documento BR-FT-77120 de Brembo.' : 'Escreve o número do documento do fornecedor.'}</span>`; } fx?.querySelector('[data-dv2-ff="docForn"]')?.setAttribute('aria-invalid', 'true'); }
    });
  },
  dica: 'Período e moeda juntam-se à pesquisa avançada. Enter passa ao campo seguinte.',
});

/* o construtor: mudar o campo muda as condições e o valor (com uma passagem curta); Enter no valor filtra */
document.addEventListener('change', (ev) => {
  const t = ev.target as HTMLElement, r = t.closest?.<HTMLElement>('[data-dv2="fat"]'); if (!r) return; const e = de(r), row = t.closest<HTMLElement>('[data-fc-i]'); if (!row) return;
  const i = Number(row.dataset.fcI), c = rascunho(e)[i]; if (!c) return;
  if (t.matches('[data-fc-campo]')) { lerCrit(r, e); c.campo = (t as HTMLSelectElement).value; c.op = OPS[campoDe(c.campo).tipo][0][0]; c.v = ''; c.v2 = ''; desenharCrit(r, e, i); r.querySelector<HTMLElement>(`[data-fc-i="${i}"] [data-fc-campo]`)?.focus(); }
  else if (t.matches('[data-fc-op]')) { lerCrit(r, e); const antes = r.querySelector(`[data-fc-i="${i}"] [data-fc-v2]`); if (!!antes !== (c.op === 'entre')) { desenharCrit(r, e, i); r.querySelector<HTMLElement>(`[data-fc-i="${i}"] [data-fc-op]`)?.focus(); } }
});
document.addEventListener('keydown', (ev) => {
  const t = ev.target as HTMLElement;
  /* F4 abre a lista do campo ou da condição, como no antigo */
  if (ev.key === 'F4' && t.matches?.('[data-dv2="fat"] [data-fc-i] .esel__botao')) { ev.preventDefault(); ev.stopImmediatePropagation(); t.previousElementSibling?.dispatchEvent(new Event('esel:abrir', { bubbles: true })); return; }
  if (ev.key !== 'Enter' || !t.matches?.('[data-fc-v], [data-fc-v2]')) return;
  const r = t.closest<HTMLElement>('[data-dv2="fat"]'); if (!r) return;
  const row = t.closest<HTMLElement>('[data-fc-i]'), ult = [...r.querySelectorAll('[data-fc-i]')].pop() === row && (t.matches('[data-fc-v2]') || !row?.querySelector('[data-fc-v2]'));
  if (ult) { ev.preventDefault(); ev.stopImmediatePropagation(); filtrarRegistos(r, de(r)); }
}, true);

/* ---------- os ecrãs ---------- */
const NOTA = 'Faturas de Compra v2 (26 out., briefing «Gestão de Faturas de Fornecedores V2» e o print do ERP antigo): as colunas do antigo, a pesquisa Campo → Condição → Valor com E/OU (Shift+F1 Filtrar, Shift+F2 Remover), os filtros rápidos, o painel (detalhes, linhas, documentos com a verificação, créditos, anexos), a ficha, Bloquear, Anular (F8) e Lançar crédito (Ctrl+F1) sem créditos repetidos. As faturas são de exemplo (das receções do protótipo).';
const ESTADOS: [string, string, string][] = [
  ['carregar', 'A carregar', 'A lista em esqueleto; a pesquisa e os filtros já servem.'],
  ['vazia', 'Sem faturas', 'Ainda não há faturas: Novo (F5).'],
  ['construtor', 'Pesquisa avançada', 'Três condições com E e OU aplicadas (Shift+F1): as etiquetas dizem o que está aplicado.'],
  ['sem-resultados', 'Pesquisa sem resultados', 'A condição não deixa nenhuma fatura: Remover filtro (Shift+F2).'],
  ['criar', 'Nova fatura', 'A ficha: tipo, data, fornecedor, documento e data dele, encomenda e receção (as linhas vêm dela), linhas e totais.'],
  ['editar', 'Editar a fatura', 'Uma fatura do período aberto, sem crédito.'],
  ['por-gravar', 'Alterações por gravar', 'Fechar a ficha com alterações: continuar a editar ou descartar.'],
  ['a-gravar', 'A gravar', 'O botão espera; nada se diz antes de as regras aceitarem.'],
  ['gravado', 'Gravada', 'A ficha fecha, a linha acende e a barra de estado diz o que se gravou.'],
  ['gravar-falhou', 'Gravar falhou', 'O servidor não respondeu: as alterações ficam na ficha.'],
  ['invalido', 'Erro de validação', 'Falta o documento do fornecedor: o campo marcado e a mensagem.'],
  ['duplicado', 'Documento repetido', 'O mesmo documento do mesmo fornecedor já está registado: diz-se em que fatura.'],
  ['bloqueada', 'Bloqueada', 'Bloqueada não é anulada: o motivo, e Desbloquear para o Financeiro.'],
  ['anulada', 'Anulada', 'Fica no histórico; não se altera, não se paga nem recebe crédito.'],
  ['creditada', 'Com crédito', 'Os créditos da fatura e o que falta creditar; ter crédito não é estar paga.'],
  ['credito', 'Lançar crédito (Ctrl+F1)', 'O que falta creditar, o valor e o motivo; a fatura não é anulada.'],
  ['a-creditar', 'A lançar o crédito', 'O botão espera; nada se diz antes da resposta.'],
  ['creditado', 'Crédito lançado', 'A nota nasce na fatura, no separador dos créditos, e abre-se nas notas de crédito.'],
  ['credito-falhou', 'O crédito falhou', 'O valor passa o que falta creditar: o campo marcado; nada se lançou.'],
  ['credito-desconhecido', 'Crédito sem resposta', 'Não se sabe se ficou lançado: tentar outra vez é seguro (a mesma chave).'],
  ['documentos-carregar', 'A carregar os documentos', 'O separador dos documentos espera no seu sítio.'],
  ['verificacao', 'Verificação com diferenças', 'Encomenda → Receção → Fatura: a diferença de preço, sem confundir com o bloqueio.'],
  ['anular', 'Anular (F8)', 'A confirmação e o motivo; nada se apaga.'],
  ['anexos', 'Anexos', 'Os anexos da fatura (o PDF do fornecedor): ver, descarregar, carregar e remover.'],
  ['imprimir', 'Imprimir (F11)', 'Imprime-se só a lista, com as colunas à vista.'],
  ['permissao', 'Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
  ['offline', 'Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['servidor', 'Servidor indisponível', 'O servidor não respondeu: Tentar outra vez.'],
  ['restaurada', 'Área de trabalho reposta', 'Ao voltar: a pesquisa, os filtros e a fatura escolhida como estavam.'],
];
const fornecedoresDaLista = (): [string, string][] => [...new Set(faturas().map((f) => f.forn))].map((f) => [f, nomeF(f)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
const versao = (cen = 'normal') => ({ id: 'v2', nota: NOTA, html: paginaDoc(CFG, cen, fornecedoresDaLista()) });
/** O ecrã das Faturas (do menu antigo) ganha a v2 (abre por omissão) e os estados só dela. */
export function comFaturasV2(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  const base = ecras.find((e) => e.id === 'cm-compras-faturas'); const num = base?.nome.split(' · ')[0] ?? '45';
  return [...ecras.map((e) => e.id === 'cm-compras-faturas' ? { ...e, nome: `${num} · Faturas de Compra`, versoes: [...e.versoes, versao()] as Ecra<IdErp>['versoes'] } : e),
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `fat2-${cen}` as IdErp, nome: `${num}.${i + 1} · ${nome}`, fluxo: 'Compras', estadoDe: 'cm-compras-faturas' as IdErp, objetivo, versoes: [versao(cen)] as Ecra<IdErp>['versoes'] }))];
}
export type IdFat2 = `fat2-${string}`;
export type { Fatura };
