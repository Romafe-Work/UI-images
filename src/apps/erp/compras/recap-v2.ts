/* =========================================================
   ERP — Compras ▸ Mapas ▸ Mapa Recapitulativo de Fornecedores v2 (26 out. 2026), do briefing dela «Mapa Recapitulativo de
   Fornecedores V2» e do print do ERP antigo (Controlo Contabilístico: Data Inicial/Final, Fornecedor Inicial/Final, os seis
   tipos de documento, Somatórios, F2 Filtrar tabela, F3 Remover filtro, F4 Excel, F10 Gerar dados, F12 Imprimir, Esc).
   A v1 (a consulta de 23 out.) fica como estava.
   - Os critérios ficam por cima; depois de gerar recolhem-se num resumo e continuam a editar-se.
   - Os fornecedores vão por intervalo do número (o do antigo, 0 a 9999999; no protótipo, 2001…), como no antigo.
   - Tipos de documento: os seis do antigo, em dois grupos pelo efeito na conta do fornecedor (débito: fatura, venda a
     dinheiro, nota de débito, aviso de lançamento a débito; crédito: nota de crédito, aviso de lançamento a crédito).
     Nenhum escolhido não quer dizer «todos»: pede-se pelo menos um.
   - O Total soma com o sinal de cada tipo (os de crédito subtraem). Uma só moeda (EUR); com várias não se somava.
   - «Des. Cliente 2» do antigo: o significado está por confirmar — a coluna fica, vazia, e não se inventa.
   - Dados: as faturas de exemplo e as notas de crédito de compras/faturas.ts (as anuladas não entram). Não há avisos de
     lançamento no protótipo: escolhê-los não traz nada, e diz-se.
   CSS: css/automatico.css (.ak), css/faltas-v2.css (.lf2: grelha, painel, diálogos) e css/docs-v2.css (.dv2).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { faturas, notasCredito, totaisFat, fatura, NOME_TIPO } from './faturas';
import { FORNECEDORES, fornecedor, euros, dia, HOJE } from './dominio';
import { numForn } from './comparativo';
import { xlsx, descarregar, type Celula } from './xlsx';
import { mostrar } from '../../../comum/ecras';
import { perfilDaSessao } from '../sessao';
import scrollText from 'lucide-static/icons/scroll-text.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import timer from 'lucide-static/icons/timer.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import external from 'lucide-static/icons/external-link.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import receiptText from 'lucide-static/icons/receipt-text.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';

/* ---------- os documentos e o mapa ---------- */
export type TipoDoc = 'FT' | 'VD' | 'ND' | 'NC' | 'ALD' | 'ALC';
const DEBITO: TipoDoc[] = ['FT', 'VD', 'ND', 'ALD'], CREDITO: TipoDoc[] = ['NC', 'ALC'];
const SINAL = (t: TipoDoc) => (CREDITO.includes(t) ? -1 : 1);
interface Doc { tipo: TipoDoc; ref: string; data: string; forn: string; docForn: string; valor: number; fatura: string }
function documentos(): Doc[] {
  const fs = faturas().filter((f) => !f.anulada).map((f): Doc => ({ tipo: f.tipo, ref: f.ref, data: f.data, forn: f.forn, docForn: f.docForn, valor: totaisFat(f).total, fatura: f.ref }));
  const ncs = notasCredito().map((n): Doc | null => { const f = fatura(n.fatura); return f && !f.anulada ? { tipo: 'NC', ref: n.ref, data: n.data, forn: f.forn, docForn: `Crédito da ${f.ref}`, valor: n.valor, fatura: f.ref } : null; }).filter((x): x is Doc => !!x);
  return [...fs, ...ncs];
}
interface Crit { de: string; ate: string; fi: string; ff: string; tipos: TipoDoc[] }
const CRIT0 = (): Crit => ({ de: '2026-10-01', ate: HOJE, fi: '0', ff: '9999999', tipos: [] });
interface LinhaR { num: string; forn: string; nome: string; des2: string; nif: string; total: number; deb: number; cred: number; docs: Doc[]; morada1: string; morada2: string; cp: string; cidade: string }
function partirMorada(m: string, cidade: string): [string, string, string] {
  const [a, b = ''] = m.split(' · '); const cp = b.match(/\d{4}-\d{3}|\d{5}|\d{4}/)?.[0] ?? '';
  return [a, cidade, cp];
}
/** Gera o mapa: um fornecedor por linha, com os documentos dentro do período e dos tipos, e o total com sinal. */
export function gerar(c: Crit): LinhaR[] {
  const fi = Number(c.fi), ff = Number(c.ff), docs = documentos().filter((d) => d.data >= c.de && d.data <= c.ate && c.tipos.includes(d.tipo));
  return FORNECEDORES.filter((f) => { const n = Number(numForn(f.id)); return n >= fi && n <= ff; }).map((f): LinhaR => {
    const ds = docs.filter((d) => d.forn === f.id).sort((a, b) => a.data.localeCompare(b.data));
    const deb = ds.filter((d) => SINAL(d.tipo) > 0).reduce((s, d) => s + d.valor, 0), cred = ds.filter((d) => SINAL(d.tipo) < 0).reduce((s, d) => s + d.valor, 0);
    const [m1, m2, cp] = partirMorada(f.morada, f.cidade);
    return { num: numForn(f.id), forn: f.id, nome: f.legal || f.nome, des2: '', nif: f.nif, total: deb - cred, deb, cred, docs: ds, morada1: m1, morada2: m2, cp, cidade: f.cidade };
  }).filter((l) => l.docs.length);
}

/* ---------- as colunas ---------- */
interface ColR { k: keyof LinhaR | 'ndocs'; t: string; tipo: 'mono' | 'txt' | 'eur' | 'n'; w: number; presa?: boolean; antiga?: boolean; titulo?: string }
const COLS: ColR[] = [
  { k: 'num', t: 'N.º do fornecedor', tipo: 'mono', w: 120, presa: true, antiga: true },
  { k: 'nome', t: 'Designação do fornecedor', tipo: 'txt', w: 250, antiga: true },
  { k: 'des2', t: 'Des. Cliente 2', tipo: 'txt', w: 140, antiga: true, titulo: 'Coluna do ERP antigo; o significado está por confirmar e o protótipo não a tem' },
  { k: 'nif', t: 'N.º de contribuinte', tipo: 'mono', w: 140, antiga: true },
  { k: 'total', t: 'Total', tipo: 'eur', w: 130, antiga: true },
  { k: 'deb', t: 'Débitos', tipo: 'eur', w: 120 },
  { k: 'cred', t: 'Créditos', tipo: 'eur', w: 120 },
  { k: 'ndocs', t: 'Documentos', tipo: 'n', w: 100 },
  { k: 'morada1', t: 'Morada 1', tipo: 'txt', w: 240, antiga: true },
  { k: 'morada2', t: 'Morada 2', tipo: 'txt', w: 150, antiga: true },
  { k: 'cp', t: 'Código postal', tipo: 'mono', w: 110, antiga: true },
];
const val = (l: LinhaR, k: ColR['k']): string | number => k === 'ndocs' ? l.docs.length : (l[k] as string | number);
const fmt = (c: ColR, l: LinhaR) => { const v = val(l, c.k); return c.tipo === 'eur' ? euros(v as number) : c.tipo === 'n' ? (v as number).toLocaleString('pt-PT') : esc(String(v ?? '')) || '<span class="is-nada">—</span>'; };

/* ---------- o estado de cada página ---------- */
interface Est { crit: Crit; feito?: Crit; linhas?: LinhaR[]; fase: 'inicial' | 'a-gerar' | 'ok' | 'erro'; erro?: string; tipoErro?: 'servidor' | 'tempo' | 'offline' | 'permissao' | 'sessao';
  ordem: { k: ColR['k']; dir: 1 | -1 } | null; filtros: Record<string, string>; filtrosAbertos: boolean; ocultas: Set<string>; grupo: '' | 'cidade'; ativo: string; aviso: string; hora: number; det: boolean; detCarregar: boolean; resumo: boolean; editor: boolean }
const estados = new WeakMap<HTMLElement, Est>();
const novo = (): Est => ({ crit: CRIT0(), fase: 'inicial', ordem: null, filtros: {}, filtrosAbertos: false, ocultas: new Set(['deb', 'cred']), grupo: '', ativo: '', aviso: '', hora: 0, det: false, detCarregar: false, resumo: false, editor: document.body.classList.contains('editando') });
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-rc]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-rc]');
const nf = (n: number) => n.toLocaleString('pt-PT');
const CHAVE = 'erp:recap2';

/* ---------- a página ---------- */
const B = (k: string, ic: string, t: string, tecla: string, extra = '', cls = '') => `<button type="button" class="ak-btn${cls ? ` ${cls}` : ''}" data-rc-acao="${k}"${tecla ? ` aria-keyshortcuts="${tecla}" title="${t} (${tecla})"` : ''}${extra}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
const tipoCx = (t: TipoDoc, id: string) => `<label class="rc-tipo"><input type="checkbox" value="${t}" data-rc-tipo data-rc-campo id="${id}-${t}"><span class="rc-tipo-c" aria-hidden="true">${L(check)}</span><span>${NOME_TIPO[t]}</span></label>`;
function html(cen: string): string {
  const id = (x: string) => `rc-${x}-${cen}`;
  const lista = FORNECEDORES.map((f) => `<option value="${numForn(f.id)}">${esc(f.nome)}</option>`).join('');
  return `<div class="hm ak lf2 dv2 rc" data-hm data-rc data-rc-cenario="${cen}" data-teclas="F2 F3 F4 F10 F12 Escape">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Mapas', ''], ['Mapa Recapitulativo de Fornecedores', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(scrollText)}</span>
    <div><h1>Mapa Recapitulativo de Fornecedores</h1><p>Consulta e analisa os documentos e valores associados aos fornecedores.</p></div>
    <span class="rc-contexto">Controlo contabilístico</span>
    <span class="lf2-restaurada" data-rc-restaurada hidden></span>
  </header>
  <div class="ak-barra lf2-barra rc-barra" role="toolbar" aria-label="Ações do mapa">
    ${B('filtrar', funnel, 'Filtrar tabela', 'F2', ' aria-pressed="false"')}
    ${B('remover', funnelX, 'Remover filtros', 'F3')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('excel', sheet, 'Exportar para Excel', 'F4')}
    ${B('imprimir', printer, 'Imprimir', 'F12')}
    <i class="ak-sep" aria-hidden="true"></i>
    <label class="rc-agrupar"><span>${L(layers)}Agrupar</span><select data-rc-grupo aria-label="Agrupar por"><option value="">Sem grupos</option><option value="cidade">Por localidade (Morada 2)</option></select></label>
    <span class="ak2-esp"></span>
    <span class="rc-hora" data-rc-hora></span>
  </div>

  <form class="ak-crit rc-crit" data-rc-crit aria-labelledby="${id('crit-t')}" novalidate>
    <div class="rc-resumo-crit" data-rc-resumo hidden><h2>Critérios</h2><ul class="ak2-etiquetas" data-rc-etiquetas></ul><button type="button" class="ak-btn ak-btn--linha" data-rc-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button></div>
    <div class="rc-aberto" data-rc-aberto>
      <h2 id="${id('crit-t')}">Critérios</h2>
      <div class="rc-g">
        <fieldset class="rc-bloco"><legend>Período</legend><div class="rc-par">
          <label class="ak-campo" for="${id('de')}"><span>Data inicial</span><input type="date" id="${id('de')}" data-rc-f="de" data-rc-campo data-ak-primeiro></label>
          <label class="ak-campo" for="${id('ate')}"><span>Data final</span><input type="date" id="${id('ate')}" data-rc-f="ate" data-rc-campo></label></div></fieldset>
        <fieldset class="rc-bloco"><legend>Fornecedores</legend><div class="rc-par">
          <label class="ak-campo" for="${id('fi')}"><span>Fornecedor inicial</span><input type="text" inputmode="numeric" list="${id('lf')}" id="${id('fi')}" data-rc-f="fi" data-rc-campo autocomplete="off"></label>
          <label class="ak-campo" for="${id('ff')}"><span>Fornecedor final</span><input type="text" inputmode="numeric" list="${id('lf')}" id="${id('ff')}" data-rc-f="ff" data-rc-campo autocomplete="off"></label></div><datalist id="${id('lf')}">${lista}</datalist></fieldset>
        <fieldset class="rc-bloco rc-tipos"><legend>Tipos de documento</legend>
          <div class="rc-tipos-g"><div><small>Débito — aumentam o que se deve</small>${DEBITO.map((t) => tipoCx(t, id('t'))).join('')}</div><div><small>Crédito — diminuem</small>${CREDITO.map((t) => tipoCx(t, id('t'))).join('')}</div></div>
          <div class="rc-tipos-acoes"><button type="button" class="lf2-limpar" data-rc-acao="todos">${L(check)}<span>Selecionar todos</span></button><button type="button" class="lf2-limpar" data-rc-acao="nenhum">${L(xIc)}<span>Limpar seleção</span></button></div></fieldset>
        <div class="ak-crit-acoes rc-acoes">${B('gerar', play, 'Gerar dados', 'F10', '', 'ak-btn--acao')}${B('cancelar', xIc, 'Cancelar', 'Esc', '', 'ak-btn--linha')}</div>
      </div>
      <p class="ak-erro-campo" data-rc-erro role="alert" hidden></p>
      <p class="rc-dica">Enter passa ao campo seguinte; nos tipos, Espaço marca e Enter segue; no último, vai a Gerar dados. Os critérios do mapa não são os filtros da tabela (F2).</p>
    </div>
  </form>

  <section class="rc-res" aria-labelledby="${id('res-t')}">
    <h2 id="${id('res-t')}" class="sr">Resultados</h2>
    <div class="rc-somatorios" data-rc-soma role="status" aria-live="polite" hidden></div>
    <div class="rc-corpo">
      <div class="lf2-lista rc-lista"><div class="lf2-grelha rc-grelha" data-rc-grelha tabindex="-1"></div></div>
      <aside class="rc-det" data-rc-det aria-label="Detalhe do fornecedor" hidden></aside>
    </div>
  </section>
  <div class="rc-impressao" aria-hidden="true" data-rc-impressao></div>
  <footer class="ak-estado lf2-estado" data-rc-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- desenhar ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
const filtradas = (e: Est): LinhaR[] => {
  let ls = (e.linhas ?? []).filter((l) => Object.entries(e.filtros).every(([k, v]) => { if (!v.trim()) return true; const c = COLS.find((x) => x.k === k)!, x = val(l, c.k);
    if (c.tipo === 'eur' || c.tipo === 'n') { const m = v.trim().match(/^([<>]=?|=)?\s*(-?[\d.,]+)$/); if (!m) return true; const n = Number(m[2].replace(/\./g, '').replace(',', '.')) * (c.tipo === 'eur' ? 100 : 1), y = x as number; return m[1] === '>' ? y > n : m[1] === '<' ? y < n : m[1] === '>=' ? y >= n : m[1] === '<=' ? y <= n : y === n; }
    return String(x).toLowerCase().replace(/\s+/g, '').includes(v.toLowerCase().replace(/\s+/g, '')); }));
  if (e.ordem) { const { k, dir } = e.ordem; ls = ls.slice().sort((a, b) => { const x = val(a, k), y = val(b, k); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true })) * dir; }); }
  return ls;
};
function grelha(r: HTMLElement, e: Est, revelar = false): void {
  const g = r.querySelector<HTMLElement>('[data-rc-grelha]')!;
  r.classList.toggle('is-ocupada', e.fase === 'a-gerar' && !!e.linhas);
  if (e.fase === 'erro' && !e.linhas) {
    const [ic, t, d] = e.tipoErro === 'offline' ? [wifiOff, 'Sem ligação à rede.', 'Os critérios ficam. Quando a ligação voltar, gera outra vez (F10).'] : e.tipoErro === 'tempo' ? [timer, 'O servidor demorou demasiado.', 'Experimenta um período mais curto, ou tenta outra vez. Os critérios ficam.'] : e.tipoErro === 'permissao' ? [lock, 'Não tens permissão para o controlo contabilístico.', 'Pede acesso a quem gere os acessos do ERP. Os critérios ficam.'] : e.tipoErro === 'sessao' ? [logIn, 'A sessão terminou.', 'Volta a entrar para continuar; os critérios ficam neste ecrã.'] : [circleAlert, 'Não foi possível gerar o mapa.', e.erro ?? 'O servidor de contabilidade não respondeu (ERP-CONT-503).'];
    g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${e.tipoErro === 'sessao' ? `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>` : e.tipoErro === 'permissao' ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-rc-acao="gerar">${L(play)}<span>Tentar outra vez</span></button>`}</div>`; return;
  }
  if (e.fase === 'a-gerar' && !e.linhas) { g.innerHTML = `<div class="lf2-esq" aria-label="A gerar o mapa">${Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`; return; }
  if (!e.linhas) { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(play)}<p><b>Escolhe os critérios e gera os dados.</b>F10 em qualquer sítio deste ecrã.</p></div>`; return; }
  if (!e.linhas.length) { const so = e.feito?.tipos.every((t) => t === 'ALD' || t === 'ALC'); g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(inbox)}<p><b>Nenhum fornecedor com documentos nestes critérios.</b>${so ? 'Ainda não há avisos de lançamento no protótipo.' : 'Alarga o período, o intervalo de fornecedores ou os tipos de documento.'}</p><button type="button" class="ak-btn" data-rc-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button></div>`; return; }
  const ls = filtradas(e), cs = COLS.filter((c) => !e.ocultas.has(c.k));
  if (!ls.length) { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(searchX)}<p><b>Os filtros da tabela não deixam nenhum fornecedor.</b>F3 tira-os; os critérios do mapa ficam.</p><button type="button" class="ak-btn" data-rc-acao="remover">${L(funnelX)}<span>Remover filtros</span></button></div>`; return; }
  if (!ls.some((l) => l.forn === e.ativo)) e.ativo = '';
  const sort = (k: string) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  const cab = `<tr>${cs.map((c) => `<th scope="col" class="${c.presa ? 'is-presa ' : ''}${c.tipo === 'eur' || c.tipo === 'n' ? 'is-num' : ''}" aria-sort="${sort(c.k)}"${c.titulo ? ` title="${esc(c.titulo)}"` : ''}><button type="button" data-rc-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr>`
    + (e.filtrosAbertos ? `<tr class="lf2-filtros-col">${cs.map((c) => `<th class="${c.presa ? 'is-presa' : ''}"><input type="search" data-rc-fcol="${c.k}" value="${esc(e.filtros[c.k] ?? '')}" aria-label="Filtrar ${esc(c.t)}" placeholder="${c.tipo === 'eur' ? '> 1000' : 'Filtrar…'}"></th>`).join('')}</tr>` : '');
  const linha = (l: LinhaR) => `<tr data-rc-forn="${l.forn}" tabindex="${l.forn === e.ativo || (!e.ativo && l === ls[0]) ? 0 : -1}" class="${l.forn === e.ativo ? 'is-ativo' : ''}">${cs.map((c) => `<td class="${c.presa ? 'is-presa ' : ''}${c.tipo === 'eur' || c.tipo === 'n' ? 'is-num ' : ''}${c.tipo === 'mono' ? 'is-mono ' : ''}${c.k === 'total' && l.total < 0 ? 'rc-neg' : ''}">${fmt(c, l)}</td>`).join('')}</tr>`;
  const soma = (xs: LinhaR[]) => cs.map((c, i) => `<td class="${c.presa ? 'is-presa ' : ''}${c.tipo === 'eur' || c.tipo === 'n' ? 'is-num' : ''}">${i === 0 ? '' : c.tipo === 'eur' ? `<b>${euros(xs.reduce((s, l) => s + (val(l, c.k) as number), 0))}</b>` : c.k === 'ndocs' ? `<b>${nf(xs.reduce((s, l) => s + l.docs.length, 0))}</b>` : ''}</td>`).join('');
  let corpo = '';
  if (e.grupo === 'cidade') {
    const gs = new Map<string, LinhaR[]>(); ls.forEach((l) => gs.set(l.cidade, [...(gs.get(l.cidade) ?? []), l]));
    corpo = [...gs].sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([cid, xs]) => `<tr class="rc-g-cab"><td colspan="${cs.length}"><b>${esc(cid)}</b> · ${xs.length} ${xs.length === 1 ? 'fornecedor' : 'fornecedores'}</td></tr>${xs.map(linha).join('')}<tr class="rc-g-soma"><td class="is-presa">Subtotal</td>${soma(xs).split('</td>').slice(1).join('</td>')}</tr>`).join('');
  } else corpo = ls.map(linha).join('');
  g.innerHTML = `<table class="lf2-tab rc-tab" aria-label="Mapa recapitulativo de fornecedores"><colgroup>${cs.map((c) => `<col style="width:${c.w}px">`).join('')}</colgroup><thead>${cab}</thead><tbody>${corpo}</tbody><tfoot><tr class="rc-total"><td class="is-presa"><b>Total · ${nf(ls.length)}</b></td>${soma(ls).split('</td>').slice(1).join('</td>')}</tr></tfoot></table>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function somatorios(r: HTMLElement, e: Est, antes?: number): void {
  const s = r.querySelector<HTMLElement>('[data-rc-soma]')!;
  if (!e.linhas || !e.linhas.length) { s.hidden = true; return; }
  const ls = filtradas(e), docs = ls.flatMap((l) => l.docs), por = (t: TipoDoc) => docs.filter((d) => d.tipo === t);
  const total = ls.reduce((x, l) => x + l.total, 0);
  s.hidden = false;
  s.innerHTML = `<span class="rc-s rc-s--total"><small>Somatórios · total com sinal</small><b data-rc-total>${euros(total)}</b><i>${nf(ls.length)} ${ls.length === 1 ? 'fornecedor' : 'fornecedores'} · ${nf(docs.length)} ${docs.length === 1 ? 'documento' : 'documentos'} · EUR</i></span>
    ${(e.feito?.tipos ?? []).map((t) => { const xs = por(t), v = xs.reduce((x, d) => x + d.valor, 0); return `<span class="rc-s${SINAL(t) < 0 ? ' is-cred' : ''}"><small>${NOME_TIPO[t]} (${SINAL(t) < 0 ? '−' : '+'})</small><b>${euros(v)}</b><i>${nf(xs.length)} doc.</i></span>`; }).join('')}`;
  /* o total conta até ao novo valor, só quando muda de verdade */
  const b = s.querySelector<HTMLElement>('[data-rc-total]');
  if (b && antes !== undefined && antes !== total && !quieto()) { const t0 = performance.now(); const passo = (t: number) => { const k = Math.min(1, (t - t0) / 320), f = 1 - Math.pow(1 - k, 3); b.textContent = euros(Math.round(antes + (total - antes) * f)); if (k < 1 && b.isConnected) requestAnimationFrame(passo); }; requestAnimationFrame(passo); }
}
function detalhe(r: HTMLElement, e: Est): void {
  const a = r.querySelector<HTMLElement>('[data-rc-det]')!, l = e.linhas?.find((x) => x.forn === e.ativo);
  a.hidden = !e.det || !l; if (a.hidden || !l) return;
  if (e.detCarregar) { a.innerHTML = '<div class="lf2-esq lf2-esq--peq" aria-label="A carregar o fornecedor"><i></i><i></i><i></i><i></i></div>'; return; }
  const f = fornecedor(l.forn);
  a.innerHTML = `<header class="rc-det-cab"><div><small>N.º ${esc(l.num)}</small><h3>${esc(l.nome)}</h3></div><button type="button" class="dv2-x" data-rc-acao="fechar-det" aria-label="Fechar o detalhe (Esc)">${L(xIc)}</button></header>
    <dl class="lf2-dl rc-det-dl"><div><dt>N.º de contribuinte</dt><dd class="is-mono">${esc(l.nif)}</dd></div><div><dt>Total no mapa</dt><dd><b>${euros(l.total)}</b></dd></div><div class="is-largo"><dt>Morada</dt><dd>${esc(f?.morada ?? '')}</dd></div><div><dt>Débitos</dt><dd>${euros(l.deb)}</dd></div><div><dt>Créditos</dt><dd>${euros(l.cred)}</dd></div>
      <div class="is-largo"><dt>Tipos incluídos</dt><dd>${[...new Set(l.docs.map((d) => NOME_TIPO[d.tipo]))].join(', ')}</dd></div></dl>
    <button type="button" class="ak-btn rc-det-forn" data-dk-janela="fornecedor:${esc(l.forn)}">${L(building)}<span>Ficha do fornecedor</span></button>
    <h3 class="dv2-h3">Documentos (${l.docs.length})</h3>
    ${l.docs.length ? `<ul class="rc-docs">${l.docs.map((d) => `<li><button type="button" class="dv2-doc" data-rc-acao="abrir" data-ref="${esc(d.ref)}" data-fatura="${esc(d.fatura)}" data-tipo="${d.tipo}">${L(d.tipo === 'NC' ? receiptText : receipt)}<span><small>${NOME_TIPO[d.tipo]} · ${dia(d.data)} · ${esc(d.docForn)}</small><b class="is-mono">${esc(d.ref)}</b></span><em class="${SINAL(d.tipo) < 0 ? 'rc-neg' : ''}">${SINAL(d.tipo) < 0 ? '−' : ''}${euros(d.valor)}</em>${L(external)}</button></li>`).join('')}</ul>` : '<p class="lf2-sem">Sem documentos ligados nestes critérios.</p>'}`;
}
function etiquetas(r: HTMLElement, e: Est): void {
  const ul = r.querySelector<HTMLElement>('[data-rc-etiquetas]')!, c = e.feito ?? e.crit;
  ul.innerHTML = [`${dia(c.de)} a ${dia(c.ate)}`, `Fornecedores ${c.fi} a ${c.ff}`, c.tipos.length === 6 ? 'Todos os tipos de documento' : c.tipos.map((t) => NOME_TIPO[t]).join(', ')].map((t, i) => `<li><button type="button" data-rc-etiqueta="${['de', 'fi', 'tipos'][i]}" title="Alterar">${esc(t)}</button></li>`).join('');
}
function estado(r: HTMLElement, e: Est): void {
  const ls = e.linhas ? filtradas(e) : [], nf_ = Object.values(e.filtros).filter((v) => v.trim()).length;
  const fase = e.fase === 'a-gerar' ? (e.linhas ? 'A atualizar…' : 'A gerar…') : e.fase === 'erro' ? 'Erro ao gerar' : e.linhas ? 'Pronto' : 'Sem dados';
  r.querySelector<HTMLElement>('[data-rc-estado]')!.innerHTML = `<span>Fornecedores <b>${e.linhas ? nf(ls.length) : '—'}</b>${e.linhas && ls.length !== e.linhas.length ? ` de ${nf(e.linhas.length)}` : ''}</span>${nf_ ? `<span>Filtros da tabela <b>${nf_}</b></span>` : ''}${e.grupo ? '<span>Agrupado por <b>localidade</b></span>' : ''}<span class="ak-estado-f is-${e.fase === 'ok' ? 'ok' : 'a-gerar'}">${e.fase === 'a-gerar' ? L(loader) : ''}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  r.querySelector<HTMLElement>('[data-rc-hora]')!.innerHTML = e.hora ? `Gerado às <b>${new Date(e.hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</b>` : '';
  const sem = !e.linhas || !e.linhas.length;
  r.querySelectorAll<HTMLElement>('.rc-barra [data-rc-acao]').forEach((b) => { const k = b.dataset.rcAcao!, p = sem ? 'Gera os dados primeiro (F10).' : k === 'remover' && !nf_ && !e.filtrosAbertos ? 'Não há filtros da tabela.' : ''; b.setAttribute('aria-disabled', String(!!p)); if (p) b.title = p; else b.title = `${b.querySelector('span')?.textContent} (${b.getAttribute('aria-keyshortcuts')})`; });
  r.querySelector('[data-rc-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
  r.querySelectorAll<HTMLButtonElement>('[data-rc-acao="gerar"]').forEach((b) => { b.disabled = e.fase === 'a-gerar'; b.classList.toggle('is-carregar', e.fase === 'a-gerar'); });
  const gs = r.querySelector<HTMLSelectElement>('[data-rc-grupo]'); if (gs) { gs.value = e.grupo; gs.disabled = sem; }
  impressao(r, e);
}
function impressao(r: HTMLElement, e: Est): void {
  const p = r.querySelector<HTMLElement>('[data-rc-impressao]'); if (!p) return; const c = e.feito; if (!c) { p.innerHTML = ''; return; }
  p.innerHTML = `<h1>Mapa Recapitulativo de Fornecedores</h1><p>Controlo contabilístico · período ${dia(c.de)} a ${dia(c.ate)} · fornecedores ${esc(c.fi)} a ${esc(c.ff)}</p><p>Tipos: ${c.tipos.map((t) => `${NOME_TIPO[t]} (${SINAL(t) < 0 ? '−' : '+'})`).join(', ')} · gerado a ${new Date(e.hora || Date.now()).toLocaleString('pt-PT')}</p>`;
}
function tudo(r: HTMLElement, e: Est, revelar = false, antes?: number): void { grelha(r, e, revelar); somatorios(r, e, antes); detalhe(r, e); etiquetas(r, e); estado(r, e); }

/* ---------- critérios ---------- */
const campo = (r: HTMLElement, k: string) => r.querySelector<HTMLInputElement>(`[data-rc-f="${k}"]`)!;
function porCrit(r: HTMLElement, c: Crit): void { (['de', 'ate', 'fi', 'ff'] as const).forEach((k) => { campo(r, k).value = c[k]; }); r.querySelectorAll<HTMLInputElement>('[data-rc-tipo]').forEach((x) => { x.checked = c.tipos.includes(x.value as TipoDoc); }); }
function lerCrit(r: HTMLElement): Crit { return { de: campo(r, 'de').value, ate: campo(r, 'ate').value, fi: campo(r, 'fi').value.trim(), ff: campo(r, 'ff').value.trim(), tipos: [...r.querySelectorAll<HTMLInputElement>('[data-rc-tipo]:checked')].map((x) => x.value as TipoDoc) }; }
function validar(c: Crit): [string, string] | null {
  if (!c.de || !c.ate) return ['Diz a data inicial e a final.', c.de ? 'ate' : 'de'];
  if (c.de > c.ate) return ['A data inicial é depois da final.', 'de'];
  if (!/^\d{1,7}$/.test(c.fi) || !/^\d{1,7}$/.test(c.ff)) return ['O fornecedor inicial e o final são números (0 a 9999999).', /^\d{1,7}$/.test(c.fi) ? 'ff' : 'fi'];
  if (Number(c.fi) > Number(c.ff)) return ['O fornecedor inicial é maior do que o final.', 'fi'];
  if (!c.tipos.length) return ['Escolhe pelo menos um tipo de documento: nenhum não quer dizer todos.', 'tipos'];
  return null;
}
function marcarErro(r: HTMLElement, m: [string, string] | null): void {
  const p = r.querySelector<HTMLElement>('[data-rc-erro]')!; r.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid')); r.querySelector('.rc-tipos')?.classList.remove('is-erro');
  p.hidden = !m; p.textContent = m?.[0] ?? '';
  if (!m) return;
  if (m[1] === 'tipos') { r.querySelector('.rc-tipos')?.classList.add('is-erro'); r.querySelector<HTMLElement>('[data-rc-tipo]')?.focus(); } else { const el = campo(r, m[1]); el.setAttribute('aria-invalid', 'true'); el.focus(); }
}
function resumir(r: HTMLElement, e: Est, sim: boolean): void {
  e.resumo = sim; const a = r.querySelector<HTMLElement>('[data-rc-aberto]')!, b = r.querySelector<HTMLElement>('[data-rc-resumo]')!;
  const res = r.querySelector<HTMLElement>('.rc-res')!, y0 = res.getBoundingClientRect().top;
  a.hidden = sim; b.hidden = !sim; etiquetas(r, e);
  /* o que está por baixo parte de onde estava (só transform) */
  const d = y0 - res.getBoundingClientRect().top; if (Math.abs(d) > 1 && !quieto()) res.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  const novo_ = sim ? b : a; if (!quieto()) novo_.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
  if (!sim) campo(r, 'de').focus();
}
async function gerarDados(r: HTMLElement, e: Est): Promise<void> {
  if (e.fase === 'a-gerar') { toast(r, 'O mapa já está a ser gerado.'); return; }
  const c = lerCrit(r), m = validar(c); marcarErro(r, m); if (m) return;
  if (!['compras', 'financeiro', 'admin'].includes(perfilDaSessao())) { e.fase = 'erro'; e.tipoErro = 'permissao'; e.linhas = undefined; tudo(r, e); return; }
  const antes = e.linhas ? filtradas(e).reduce((s, l) => s + l.total, 0) : undefined;
  e.fase = 'a-gerar'; e.crit = c; tudo(r, e);
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(null))));
  try {
    e.linhas = gerar(c); e.feito = { ...c, tipos: [...c.tipos] }; e.fase = 'ok'; e.hora = Date.now(); e.aviso = ''; e.det = false;
    guardar(e); tudo(r, e, true, antes);
    if (e.linhas.length) { resumir(r, e, true); r.querySelector<HTMLElement>('[data-rc-grelha] tbody tr[data-rc-forn]')?.focus({ preventScroll: true }); }
  } catch { e.fase = 'erro'; e.tipoErro = 'servidor'; e.erro = 'Não foi possível gerar o mapa. Os resultados anteriores ficam.'; tudo(r, e); }
}
function guardar(e: Est): void { if (e.editor) return; try { localStorage.setItem(CHAVE, JSON.stringify({ crit: e.crit, grupo: e.grupo, ocultas: [...e.ocultas], quando: Date.now() })); } catch { /* sem armazenamento */ } }
function exportar(r: HTMLElement, e: Est): void {
  if (!e.linhas?.length || !e.feito) return;
  const ls = filtradas(e), cs = COLS.filter((c) => !e.ocultas.has(c.k)), c = e.feito;
  try {
    const linhas: Celula[][] = ls.map((l) => cs.map((x): Celula => { const v = val(l, x.k); return x.tipo === 'eur' ? { euros: v as number } : x.tipo === 'n' ? v as number : String(v ?? '') || null; }));
    linhas.push(cs.map((x, i): Celula => i === 0 ? `Total · ${ls.length}` : x.tipo === 'eur' ? { euros: ls.reduce((s, l) => s + (val(l, x.k) as number), 0) } : x.k === 'ndocs' ? ls.reduce((s, l) => s + l.docs.length, 0) : null));
    linhas.push(cs.map(() => null));
    linhas.push(['Período', `${dia(c.de)} a ${dia(c.ate)}`, ...cs.slice(2).map(() => null)]);
    linhas.push(['Fornecedores', `${c.fi} a ${c.ff}`, ...cs.slice(2).map(() => null)]);
    linhas.push(['Tipos de documento', c.tipos.map((t) => `${NOME_TIPO[t]} (${SINAL(t) < 0 ? '−' : '+'})`).join(', '), ...cs.slice(2).map(() => null)]);
    const nome = `Mapa-Recapitulativo-Fornecedores-${c.de}-${c.ate}.xlsx`;
    descarregar(xlsx({ nome: 'Recapitulativo', colunas: cs.map((x) => x.t), linhas, larguras: cs.map((x) => Math.round(x.w / 7)) }), nome);
    e.aviso = `Exportado: ${nome} · ${nf(ls.length)} fornecedores, com o total e os critérios.`; estado(r, e); toast(r, e.aviso);
  } catch { e.aviso = 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).'; estado(r, e); toast(r, e.aviso); }
}
function escolher(r: HTMLElement, e: Est, forn: string, abrir = true): void {
  e.ativo = forn; if (abrir) e.det = true;
  r.querySelectorAll('tr.is-ativo').forEach((t) => { t.classList.remove('is-ativo'); (t as HTMLElement).tabIndex = -1; });
  const tr = r.querySelector<HTMLElement>(`tr[data-rc-forn="${CSS.escape(forn)}"]`); if (tr) { tr.classList.add('is-ativo'); tr.tabIndex = 0; tr.focus({ preventScroll: true }); tr.scrollIntoView({ block: 'nearest' }); }
  const a = r.querySelector<HTMLElement>('[data-rc-det]')!, era = !a.hidden; detalhe(r, e);
  if (!a.hidden && !quieto()) a.animate(era ? [{ opacity: .4 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateX(16px)' }, { opacity: 1, transform: 'none' }], { duration: era ? 160 : 240, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function abrirDocumento(b: HTMLElement): void {
  const tipo = b.dataset.tipo, ref = b.dataset.ref!, fat = b.dataset.fatura!;
  const ecra = tipo === 'NC' ? 'cm-compras-notas-credito' : 'cm-compras-faturas', rota = tipo === 'NC' ? 'compras.compras-notas-credito' : 'compras.compras-faturas';
  try { sessionStorage.setItem(`erp:ref:${ecra}`, JSON.stringify(tipo === 'NC' ? ref : fat)); } catch { /* sem sessão */ }
  /* na área de trabalho, o separador nasce do botão (a área de trabalho lê data-dk-doc neste mesmo clique) */
  if (window.self !== window.top) { b.dataset.dkDoc = rota; b.dataset.dkTitulo = tipo === 'NC' ? 'Notas de crédito' : 'Faturas de Compra'; window.setTimeout(() => { delete b.dataset.dkDoc; delete b.dataset.dkTitulo; }); return; }
  mostrar(ecra as never);
}

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.rcCenario ?? 'inicial', todos = [...DEBITO, ...CREDITO];
  let c = CRIT0();
  if (cen === 'inicial' && !e.editor) { try { const v = JSON.parse(localStorage.getItem(CHAVE) ?? 'null'); if (v?.crit) { c = { ...CRIT0(), ...v.crit }; e.grupo = v.grupo ?? ''; e.ocultas = new Set(v.ocultas ?? ['deb', 'cred']); } } catch { /* */ } }
  if (cen !== 'inicial' && cen !== 'editar' && !cen.startsWith('invalido')) c.tipos = ['FT', 'VD', 'ND', 'NC'];
  if (cen === 'editar') c.tipos = ['FT', 'NC'];
  if (cen === 'invalido-datas') { c.de = '2026-10-26'; c.ate = '2026-10-01'; c.tipos = ['FT']; }
  if (cen === 'invalido-forn') { c.fi = '2009'; c.ff = '2003'; c.tipos = ['FT']; }
  if (cen === 'vazio') c.tipos = ['ALD', 'ALC'];
  if (cen === 'totais') c.tipos = todos;
  e.crit = c; porCrit(r, c);
  const gerado = !['inicial', 'editar', 'invalido-datas', 'invalido-forn', 'invalido-tipos', 'a-gerar', 'erro', 'tempo', 'offline', 'permissao', 'sessao'].includes(cen);
  if (gerado || cen === 'editar') { e.linhas = gerar(c); e.feito = { ...c, tipos: [...c.tipos] }; e.fase = 'ok'; e.hora = Date.parse('2026-10-26T10:14:00'); }
  if (cen === 'filtros') { e.filtrosAbertos = true; e.filtros = { total: '> 1000' }; }
  if (cen === 'agrupado') e.grupo = 'cidade';
  if (cen === 'a-atualizar') e.fase = 'a-gerar';
  if (cen === 'a-gerar') e.fase = 'a-gerar';
  if (['erro', 'tempo', 'offline', 'permissao', 'sessao'].includes(cen)) { e.fase = 'erro'; e.tipoErro = cen === 'erro' ? 'servidor' : cen as Est['tipoErro']; }
  if (cen === 'exportado') e.aviso = 'Exportado: Mapa-Recapitulativo-Fornecedores-2026-10-01-2026-10-19.xlsx · 4 fornecedores, com o total e os critérios.';
  if (cen === 'export-falhou') e.aviso = 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).';
  if (cen === 'imprimir') e.aviso = 'A preparar a impressão: o título, o período, o intervalo, os tipos, os fornecedores e o total.';
  if (cen === 'detalhe' || cen === 'det-carregar' || cen === 'sem-docs') { e.ativo = e.linhas?.[0]?.forn ?? ''; e.det = true; if (cen === 'det-carregar') e.detCarregar = true; }
  if (cen === 'sem-docs' && e.linhas?.[0]) e.linhas[0] = { ...e.linhas[0], docs: [] };
  tudo(r, e);
  if (gerado && e.linhas?.length) { e.resumo = true; r.querySelector<HTMLElement>('[data-rc-aberto]')!.hidden = true; r.querySelector<HTMLElement>('[data-rc-resumo]')!.hidden = false; etiquetas(r, e); }
  if (cen.startsWith('invalido')) marcarErro(r, validar(lerCrit(r)));
  if (cen === 'restaurado') { const x = r.querySelector<HTMLElement>('[data-rc-restaurada]')!; x.hidden = false; x.innerHTML = `${L(undo)}Reposta como a deixaste às 09:12, com os resultados`; }
  const aVista = !!r.closest('.ecra:not([hidden]) > .versao:not([hidden])');
  if (!e.editor && cen === 'inicial' && aVista && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-rc]').forEach(armar);

export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    if ((b = t.closest('[data-rc-acao][aria-disabled="true"]'))) { toast(r, b.title); return; }
    if ((b = t.closest('[data-rc-etiqueta]'))) { resumir(r, e, false); const k = b.dataset.rcEtiqueta!; (k === 'tipos' ? r.querySelector<HTMLElement>('[data-rc-tipo]') : campo(r, k))?.focus(); return; }
    if ((b = t.closest('[data-rc-ordenar]'))) { const k = b.dataset.rcOrdenar as ColR['k']; e.ordem = e.ordem?.k === k ? { k, dir: e.ordem.dir === 1 ? -1 : 1 } : { k, dir: 1 }; grelha(r, e); return; }
    if ((b = t.closest('[data-rc-acao]'))) {
      const k = b.dataset.rcAcao!;
      if (k === 'gerar') void gerarDados(r, e);
      else if (k === 'cancelar') { if (e.feito) { porCrit(r, e.feito); marcarErro(r, null); if (e.linhas?.length) resumir(r, e, true); toast(r, 'Critérios repostos: os da última análise.'); } else { porCrit(r, CRIT0()); marcarErro(r, null); } }
      else if (k === 'alterar') resumir(r, e, false);
      else if (k === 'todos' || k === 'nenhum') { r.querySelectorAll<HTMLInputElement>('[data-rc-tipo]').forEach((x) => { x.checked = k === 'todos'; }); r.querySelector('.rc-tipos')?.classList.remove('is-erro'); }
      else if (k === 'filtrar') { e.filtrosAbertos = !e.filtrosAbertos; tudo(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-rc-fcol]')?.focus(); }
      else if (k === 'remover') { e.filtros = {}; e.filtrosAbertos = false; tudo(r, e); toast(r, 'Filtros da tabela removidos; os critérios do mapa ficam.'); }
      else if (k === 'excel') exportar(r, e);
      else if (k === 'imprimir') window.print();
      else if (k === 'fechar-det') { e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tr.is-ativo')?.focus(); }
      else if (k === 'abrir') { const li = b.closest('li'); if (li && !quieto()) li.animate([{ boxShadow: '0 0 0 0 color-mix(in srgb, var(--h-laranja) 60%, transparent)' }, { boxShadow: '0 0 0 8px transparent' }], { duration: 500 }); abrirDocumento(b); }
      return;
    }
    if ((b = t.closest('tr[data-rc-forn]'))) escolher(r, e, b.dataset.rcForn!);
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-rc-grupo]')) { e.grupo = (t as HTMLSelectElement).value as Est['grupo']; guardar(e); grelha(r, e, true); estado(r, e); }
    if (t.matches('[data-rc-tipo]')) { const l = t.closest('.rc-tipo'); if (l && !quieto()) l.animate([{ transform: 'scale(.97)' }, { transform: 'none' }], { duration: 120, easing: 'ease-out' }); r.querySelector('.rc-tipos')?.classList.remove('is-erro'); }
  });
  let espera = 0;
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || !t.matches('[data-rc-fcol]')) return; const e = de(r);
    clearTimeout(espera); espera = window.setTimeout(() => { e.filtros[t.dataset.rcFcol!] = t.value; const antes = filtradas(e).reduce((s, l) => s + l.total, 0); grelha(r, e); somatorios(r, e, antes); estado(r, e); const n = r.querySelector<HTMLInputElement>(`[data-rc-fcol="${t.dataset.rcFcol}"]`); n?.focus(); n?.setSelectionRange(n.value.length, n.value.length); }, 160);
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    if (['F2', 'F3', 'F4', 'F10', 'F12'].includes(ev.key) && !ev.ctrlKey && !ev.altKey && !ev.metaKey && !ev.shiftKey) {
      ev.preventDefault(); const k = { F2: 'filtrar', F3: 'remover', F4: 'excel', F10: 'gerar', F12: 'imprimir' }[ev.key]!;
      r.querySelector<HTMLElement>(k === 'gerar' ? '[data-rc-acao="gerar"]' : `.rc-barra [data-rc-acao="${k}"]`)?.click(); return;
    }
    if (ev.key === 'Escape') { if (e.det) { e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tr.is-ativo')?.focus(); ev.preventDefault(); return; } if (e.filtrosAbertos) { e.filtrosAbertos = false; tudo(r, e); ev.preventDefault(); return; } if (!e.resumo && e.feito) { r.querySelector<HTMLElement>('[data-rc-acao="cancelar"]')?.click(); ev.preventDefault(); } return; }
    /* Enter passa ao campo seguinte (nos tipos também: Espaço é que marca); no último, vai a Gerar dados */
    if (ev.key === 'Enter' && t.matches('[data-rc-campo]')) {
      ev.preventDefault(); const cs = [...r.querySelectorAll<HTMLElement>('[data-rc-campo]')], i = cs.indexOf(t);
      (i < cs.length - 1 ? cs[i + 1] : r.querySelector<HTMLElement>('[data-rc-acao="gerar"]'))?.focus(); return;
    }
    const tr = t.closest<HTMLElement>('tr[data-rc-forn]');
    if (tr && t === tr && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === 'Enter' || ev.key === 'Home' || ev.key === 'End')) {
      ev.preventDefault(); const trs = [...r.querySelectorAll<HTMLElement>('tr[data-rc-forn]')], i = trs.indexOf(tr);
      if (ev.key === 'Enter') { escolher(r, e, tr.dataset.rcForn!); r.querySelector<HTMLElement>('[data-rc-det] .dv2-doc')?.focus(); return; }
      const j = ev.key === 'Home' ? 0 : ev.key === 'End' ? trs.length - 1 : Math.max(0, Math.min(trs.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)));
      escolher(r, e, trs[j].dataset.rcForn!, e.det);
    }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Mapa Recapitulativo de Fornecedores v2 (26 out., briefing «Mapa Recapitulativo de Fornecedores V2» e o print do ERP antigo): critérios por cima (período, intervalo de fornecedores, os seis tipos de documento em débito e crédito), Gerar dados (F10) que recolhe os critérios num resumo, Somatórios com o sinal de cada tipo, a grelha com as colunas do antigo, F2/F3/F4/F12, agrupar por localidade e o detalhe do fornecedor com os documentos (abrem num separador).';
const ESTADOS: [string, string, string][] = [
  ['editar', 'A editar os critérios', 'Os critérios abertos depois de gerar: Cancelar repõe os da última análise.'],
  ['invalido-datas', 'Período inválido', 'A data inicial depois da final: o campo marcado e a mensagem.'],
  ['invalido-forn', 'Intervalo de fornecedores inválido', 'O fornecedor inicial maior do que o final.'],
  ['invalido-tipos', 'Sem tipos de documento', 'Nenhum tipo escolhido não quer dizer todos: pede-se pelo menos um.'],
  ['a-gerar', 'A gerar', 'F10 a correr: os botões esperam; sem percentagens inventadas.'],
  ['dados', 'Dados', 'Os critérios em resumo, os Somatórios e a grelha; o foco na primeira linha.'],
  ['vazio', 'Sem resultados', 'Só avisos de lançamento escolhidos: ainda não há nenhum no protótipo, e diz-se.'],
  ['filtros', 'Filtros da tabela', 'F2: Total > 1000 €; os Somatórios acompanham; F3 tira só estes filtros.'],
  ['agrupado', 'Agrupado por localidade', 'Um grupo por localidade (Morada 2), com o subtotal.'],
  ['totais', 'Somatórios com os seis tipos', 'Débitos somam e créditos subtraem; cada tipo com o seu sinal.'],
  ['a-atualizar', 'A atualizar', 'Gerar outra vez: os resultados ficam à vista, esbatidos, até chegar a resposta.'],
  ['exportado', 'Exportado', 'O Excel leva os fornecedores, o total e os critérios.'],
  ['export-falhou', 'A exportação falhou', 'Diz-se; os resultados ficam.'],
  ['imprimir', 'Imprimir (F12)', 'O título, o período, o intervalo, os tipos, os fornecedores e o total.'],
  ['detalhe', 'Detalhe do fornecedor', 'Os dados do fornecedor e os documentos do mapa; cada um abre num separador.'],
  ['det-carregar', 'A carregar o fornecedor', 'O detalhe espera no seu sítio.'],
  ['sem-docs', 'Sem documentos ligados', 'O detalhe diz que não há documentos nestes critérios.'],
  ['erro', 'Erro do servidor', 'O servidor de contabilidade não respondeu: Tentar outra vez.'],
  ['tempo', 'Tempo esgotado', 'Período mais curto ou tentar outra vez; os critérios ficam.'],
  ['offline', 'Sem ligação', 'Sem rede: os critérios ficam.'],
  ['permissao', 'Sem permissão', 'O perfil não tem o controlo contabilístico.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; os critérios ficam.'],
  ['restaurado', 'Área de trabalho reposta', 'Ao voltar: os critérios, os resultados, os grupos e o fornecedor escolhido.'],
];
/** O Mapa recapitulativo (do menu antigo) ganha a v2 (abre por omissão) e os estados só dela. */
export function comRecapV2(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  const base = ecras.find((e) => e.id === 'cm-mapas-recap'); const num = base?.nome.split(' · ')[0] ?? '53';
  const v = (cen: string) => ({ id: 'v2', nota: NOTA, html: html(cen) });
  return [...ecras.map((e) => e.id === 'cm-mapas-recap' ? { ...e, nome: `${num} · Mapa Recapitulativo de Fornecedores`, versoes: [...e.versoes, v('inicial')] as Ecra<IdErp>['versoes'] } : e),
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `rc2-${cen}` as IdErp, nome: `${num}.${i + 1} · ${nome}`, fluxo: 'Compras', estadoDe: 'cm-mapas-recap' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] }))];
}
export type IdRc2 = `rc2-${string}`;
