/* =========================================================
   ERP — Compras: Guias v3, «num só ecrã» (27 out. 2026). Ela mostrou o menu do antigo (Guias de Entrada…, Guias de
   Transporte a Fornecedor…, Guias de Devolução…) e pediu «coloca estes três no mesmo ecrã com a lógica de há pouco»
   (a das Encomendas v5): três vistas por cima dos filtros, o fornecedor e a pesquisa servem as três, e cada guia abre
   numa janela flutuante (as janelas das Receções v2: guia, receção, encomenda — compras/rececoes-v2.ts).
     - Entrada (Alt+1): as guias dos fornecedores registadas nas receções do armazém 60;
     - Transporte a fornecedor (Alt+2): o que volta ao fornecedor — as linhas rejeitadas nas receções;
     - Devolução (Alt+3): as mesmas linhas, com o valor a devolver (o preço da encomenda).
   O protótipo ainda não tem linhas rejeitadas: Transporte e Devolução dizem-no, sem inventar. Os itens «Guias de
   transporte a fornecedor» e «Devoluções a fornecedor» do menu abrem este ecrã na vista deles (espaco.ts).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { rececoes, encomenda, fornecedor, artigo, euros, dia } from './dominio';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import fileInput from 'lucide-static/icons/file-input.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';

type Vista = 'entrada' | 'transporte' | 'devolucao';
const VISTAS: { k: Vista; t: string; ic: string; tecla: string; titulo: string }[] = [
  { k: 'entrada', t: 'Entrada', ic: fileInput, tecla: 'Alt+1', titulo: 'Guias de entrada' },
  { k: 'transporte', t: 'Transporte a fornecedor', ic: truck, tecla: 'Alt+2', titulo: 'Guias de transporte a fornecedor' },
  { k: 'devolucao', t: 'Devolução', ic: undo, tecla: 'Alt+3', titulo: 'Guias de devolução' },
];
const nf = (n: number) => n.toLocaleString('pt-PT');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
const nomeF = (id: string) => fornecedor(id)?.nome ?? id;
const preco = (enc: string, ref: string) => encomenda(enc)?.linhas.find((l) => l.ref === ref)?.preco ?? artigo(ref)?.preco ?? null;

/* ---------- os dados de cada vista (tudo das receções do protótipo) ---------- */
interface Est { vista: Vista; q: string; forn: string; fase: 'ok' | 'carregar' | 'erro'; erro?: 'servidor' | 'offline' | 'sessao' }
const entradas = () => rececoes().map((r) => { const x = encomenda(r.enc); return { r, forn: x?.forn ?? '', ace: r.linhas.reduce((s, l) => s + l.aceite, 0), rej: r.linhas.reduce((s, l) => s + l.rejeitada, 0), valor: r.linhas.reduce((s, l) => s + (preco(r.enc, l.ref) ?? 0) * l.aceite, 0) }; });
const rejeitadas = () => rececoes().flatMap((r) => r.linhas.filter((l) => l.rejeitada > 0).map((l) => ({ r, l, forn: encomenda(r.enc)?.forn ?? '', valor: (preco(r.enc, l.ref) ?? 0) * l.rejeitada })));
const passa = (e: Est, forn: string, texto: string[]) => (!e.forn || e.forn === forn) && (!e.q || texto.some((t) => norm(t).includes(norm(e.q))));
const vazio = (ic: string, t: string, d: string) => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p></div>`;
const SEM_REJ = vazio(inbox, 'Nada rejeitado.', 'Nenhuma receção teve artigos rejeitados: não há nada a devolver ao fornecedor. Quando o armazém rejeitar uma linha na receção, ela aparece aqui.');

function tabela(e: Est): { html: string; n: number; resumo: string } {
  if (e.fase === 'carregar') return { html: `<div class="lf2-esq" aria-label="A carregar">${Array.from({ length: 7 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`, n: 0, resumo: '' };
  if (e.fase === 'erro') { const [ic, t, d] = e.erro === 'offline' ? [wifiOff, 'Sem ligação à rede.', 'As guias precisam do servidor. O fornecedor e a pesquisa ficam; tenta outra vez quando a ligação voltar.'] : e.erro === 'sessao' ? [logIn, 'A sessão terminou.', 'Volta a entrar pelo login comum; voltas a este ecrã.'] : [serverOff, 'O servidor das compras não respondeu.', 'Não foi possível ler as guias (ERP-COMP-503). Tenta outra vez.']; return { html: `${vazio(ic, t, d)}`, n: 0, resumo: '' }; }
  const semNada = vazio(searchX, 'Nenhuma guia com estes filtros.', e.q ? `Procura-se «${esc(e.q)}» em toda a linha.` : 'Escolhe outro fornecedor, ou todos.');
  const th = (cs: [string, boolean?][]) => `<thead><tr>${cs.map(([t, n]) => `<th scope="col"${n ? ' class="is-num"' : ''}><span>${t}</span></th>`).join('')}</tr></thead>`;
  const ir = (k: string, t: string) => `<button type="button" class="rc2-ir" data-rc2-abrir="${esc(k)}">${esc(t)}</button>`;
  if (e.vista === 'entrada') {
    const ls = entradas().filter((x) => passa(e, x.forn, [x.r.guia, x.r.ref, x.r.enc, nomeF(x.forn)]));
    if (!rececoes().length) return { html: vazio(inbox, 'Ainda não há guias de entrada.', 'Aparecem quando o armazém regista uma receção.'), n: 0, resumo: '' };
    if (!ls.length) return { html: semNada, n: 0, resumo: '' };
    return { n: ls.length, resumo: `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'guia' : 'guias'}</span><span><b>${nf(ls.reduce((s, x) => s + x.ace, 0))}</b> aceites</span><span>Valor recebido <b>${euros(ls.reduce((s, x) => s + x.valor, 0))}</b></span>`,
      html: `<table class="lf2-tab dv2-vt dv2c-vt" aria-label="Guias de entrada">${th([['Guia'], ['Data'], ['Receção'], ['Encomenda'], ['Fornecedor'], ['Aceite', true], ['Rejeitada', true], ['Valor recebido', true]])}
      <tbody>${ls.map((x) => `<tr data-rc2-abrir="gui:${esc(x.r.guia)}" tabindex="0" title="Abrir a guia ${esc(x.r.guia)}"><td class="is-mono"><b>${esc(x.r.guia)}</b></td><td>${dia(x.r.data)}</td><td>${ir(`rec:${x.r.ref}`, x.r.ref)}</td><td>${ir(`enc:${x.r.enc}`, x.r.enc)}</td><td>${esc(nomeF(x.forn))}</td><td class="is-num">${nf(x.ace)}</td><td class="is-num">${x.rej ? `<b class="is-rutura">${nf(x.rej)}</b>` : '0'}</td><td class="is-num">${euros(x.valor)}</td></tr>`).join('')}</tbody></table>` };
  }
  const todas = rejeitadas(), ls = todas.filter((x) => passa(e, x.forn, [x.r.ref, x.r.enc, x.l.ref, nomeF(x.forn), x.l.motivo]));
  if (!todas.length) return { html: SEM_REJ, n: 0, resumo: '' };
  if (!ls.length) return { html: semNada, n: 0, resumo: '' };
  const dev = e.vista === 'devolucao';
  return { n: ls.length, resumo: `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'linha' : 'linhas'}</span>${dev ? `<span>A devolver <b>${euros(ls.reduce((s, x) => s + x.valor, 0))}</b></span>` : ''}`,
    html: `<table class="lf2-tab dv2-vt dv2c-vt" aria-label="${dev ? 'Guias de devolução' : 'Guias de transporte a fornecedor'}">${th(dev ? [['Data'], ['Receção'], ['Fornecedor'], ['Artigo'], ['Quantidade', true], ['Motivo'], ['Valor', true]] : [['Receção'], ['Encomenda'], ['Fornecedor'], ['Artigo'], ['Quantidade', true], ['Motivo']])}
    <tbody>${ls.map((x) => `<tr data-rc2-abrir="rec:${esc(x.r.ref)}" tabindex="0">${dev ? `<td>${dia(x.r.data)}</td>` : ''}<td>${ir(`rec:${x.r.ref}`, x.r.ref)}</td>${dev ? '' : `<td>${ir(`enc:${x.r.enc}`, x.r.enc)}</td>`}<td>${esc(nomeF(x.forn))}</td><td class="is-mono">${esc(x.l.ref)}</td><td class="is-num"><b>${nf(x.l.rejeitada)}</b></td><td>${esc(x.l.motivo || '—')}</td>${dev ? `<td class="is-num">${euros(x.valor)}</td>` : ''}</tr>`).join('')}</tbody></table>` };
}

/* ---------- a página ---------- */
const forns = () => [...new Set(rececoes().map((r) => encomenda(r.enc)?.forn ?? ''))].filter(Boolean).map((f) => [f, nomeF(f)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
function pagina(cen: string): string {
  const id = (x: string) => `gv3-${x}-${cen}`;
  return `<div class="hm ak lf2 dv2c gv3" data-hm data-gv3 data-gv3-cenario="${cen}" data-teclas="F9 F11 Escape Alt+1 Alt+2 Alt+3">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Guias', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(fileInput)}</span>
    <div><h1>Guias</h1><p>Entrada, transporte a fornecedor e devolução: as guias das receções do armazém 60.</p></div>
  </header>
  <div class="ak-barra lf2-barra" role="toolbar" aria-label="Ações">
    <button type="button" class="ak-btn" data-gv3-acao="atualizar" aria-keyshortcuts="F9" title="Atualizar (F9)">${L(refresh)}<span>Atualizar</span><kbd>F9</kbd></button>
    <button type="button" class="ak-btn" data-gv3-acao="imprimir" aria-keyshortcuts="F11" title="Imprimir (F11)">${L(printer)}<span>Imprimir</span><kbd>F11</kbd></button>
    <span class="ak2-esp"></span>
  </div>
  <nav class="dv2c-vistas-zona" aria-label="Vistas"><div class="dv2-vistas dv2c-vistas" role="tablist" aria-label="Ver">${VISTAS.map((v, i) => `<button type="button" role="tab" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-gv3-vista="${v.k}" aria-keyshortcuts="${v.tecla}" title="${esc(v.titulo)} (${v.tecla.replace('+', ' ')})">${L(v.ic)}<span>${esc(v.t)}</span><small data-gv3-n="${v.k}"></small></button>`).join('')}<i class="dv2c-vistas-ind" data-gv3-ind aria-hidden="true"></i></div></nav>
  <section class="lf2-filtros dv2-filtros dv2c-filtros" aria-label="Pesquisa e filtros">
    <div class="dv2c-linha">
      <label class="ak-campo dv2c-forn" for="${id('forn')}"><span class="sr">Fornecedor</span><select id="${id('forn')}" data-gv3-forn><option value="">Todos os fornecedores</option>${forns().map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>
      <div class="dv2c-pq" role="group" aria-label="Pesquisar"><label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-gv3-q autocomplete="off" placeholder="Procura em toda a linha: guia, receção, encomenda, fornecedor, artigo…" aria-label="Pesquisar nas guias"></label></div>
    </div>
  </section>
  <section class="lf2-lista dv2-lista dv2c-lista" aria-labelledby="${id('t')}">
    <div class="lf2-lista-cab"><h2 id="${id('t')}" data-gv3-t>Guias de entrada</h2><p class="lf2-resumo" data-gv3-resumo></p></div>
    <div class="lf2-grelha" data-gv3-g></div>
  </section>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- o comportamento ---------- */
const estados = new WeakMap<HTMLElement, Est>();
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
function de(r: HTMLElement): Est {
  let e = estados.get(r); if (e) return e;
  const cen = r.dataset.gv3Cenario ?? 'normal', modo = new URLSearchParams(location.hash.slice(1)).get('modo') as Vista | null;
  e = { vista: VISTAS.some((v) => v.k === modo) ? modo! : 'entrada', q: '', forn: '', fase: 'ok' };
  if (cen === 'transporte' || cen === 'devolucao') e.vista = cen;
  if (cen === 'sem-resultados') e.q = 'XPTO-999';
  if (cen === 'carregar') e.fase = 'carregar';
  if (cen === 'servidor' || cen === 'offline' || cen === 'sessao') { e.fase = 'erro'; e.erro = cen; }
  estados.set(r, e); return e;
}
function desenhar(r: HTMLElement): void {
  const e = de(r), v = VISTAS.find((x) => x.k === e.vista)!, t = tabela(e);
  r.querySelector<HTMLElement>('[data-gv3-g]')!.innerHTML = t.html;
  r.querySelector<HTMLElement>('[data-gv3-resumo]')!.innerHTML = t.resumo;
  r.querySelector<HTMLElement>('[data-gv3-t]')!.textContent = v.titulo;
  VISTAS.forEach((x) => { const n = r.querySelector<HTMLElement>(`[data-gv3-n="${x.k}"]`); if (n) n.textContent = e.fase === 'ok' ? String(tabela({ ...e, vista: x.k }).n || '') : ''; });
  r.querySelectorAll<HTMLElement>('[data-gv3-vista]').forEach((b) => { const s = b.dataset.gv3Vista === e.vista; b.setAttribute('aria-selected', String(s)); b.tabIndex = s ? 0 : -1; });
  const q = r.querySelector<HTMLInputElement>('[data-gv3-q]'); if (q && q.value !== e.q) q.value = e.q;
  const ind = r.querySelector<HTMLElement>('[data-gv3-ind]'), bs = r.querySelector<HTMLElement>(`[data-gv3-vista="${e.vista}"]`);
  if (ind && bs) requestAnimationFrame(() => { const pr = bs.parentElement!.getBoundingClientRect(), b = bs.getBoundingClientRect(); if (!b.width) return; ind.style.transform = `translateX(${b.left - pr.left}px) scaleX(${b.width / 100})`; ind.classList.add('is-pronto'); });
}
const vista = (r: HTMLElement, k: Vista) => { const e = de(r); if (e.vista === k) return; e.vista = k; desenhar(r); r.querySelector<HTMLElement>(`[data-gv3-vista="${k}"]`)?.focus({ preventScroll: true }); };
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-gv3]');
export function iniciar(): void {
  const armar = () => document.querySelectorAll<HTMLElement>('[data-gv3]').forEach((r) => { if (!r.dataset.gv3Armado) { r.dataset.gv3Armado = '1'; desenhar(r); } });
  armar(); document.addEventListener('romafe:ecra', () => { armar(); const r = visivel(); if (r) desenhar(r); }); window.addEventListener('load', armar);
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = t.closest<HTMLElement>('[data-gv3]'); if (!r || editando()) return;
    let b: HTMLElement | null;
    if ((b = t.closest('[data-gv3-vista]'))) { vista(r, b.dataset.gv3Vista as Vista); return; }
    if ((b = t.closest('[data-gv3-acao]'))) {
      if (b.dataset.gv3Acao === 'imprimir') { window.print(); return; }
      const e = de(r); e.fase = 'ok'; e.erro = undefined; b.classList.add('is-carregar'); window.setTimeout(() => { b!.classList.remove('is-carregar'); desenhar(r); }, 300);
    }
  });
  document.addEventListener('change', (ev) => { const t = ev.target as HTMLSelectElement, r = t.closest?.<HTMLElement>('[data-gv3]'); if (!r || !t.matches('[data-gv3-forn]')) return; de(r).forn = t.value; desenhar(r); });
  let espera = 0;
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLInputElement, r = t.closest?.<HTMLElement>('[data-gv3]'); if (!r || !t.matches('[data-gv3-q]')) return; clearTimeout(espera); espera = window.setTimeout(() => { de(r).q = t.value.trim(); desenhar(r); }, 140); });
  document.addEventListener('keydown', (ev) => {
    const r = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-gv3]') ?? visivel(); if (!r || editando()) return;
    const v = VISTAS.find((x) => ev.altKey && !ev.ctrlKey && x.tecla === `Alt+${ev.key}`); if (v) { ev.preventDefault(); vista(r, v.k); return; }
    const t = ev.target as HTMLElement;
    if (t.matches('[data-gv3-vista]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); const i = VISTAS.findIndex((x) => x.k === t.dataset.gv3Vista); vista(r, VISTAS[(i + (ev.key === 'ArrowRight' ? 1 : VISTAS.length - 1)) % VISTAS.length].k); return; }
    if (t.matches('tr[data-rc2-abrir]') && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) { ev.preventDefault(); const ls = [...r.querySelectorAll<HTMLElement>('[data-gv3-g] tr[data-rc2-abrir]')], i = ls.indexOf(t); ls[Math.max(0, Math.min(ls.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))]?.focus(); return; }
    if (ev.key === 'F9') { ev.preventDefault(); r.querySelector<HTMLElement>('[data-gv3-acao="atualizar"]')?.click(); }
    if (ev.key === 'F11') { ev.preventDefault(); window.print(); }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA3 = 'Guias v3 (27 out., ela: «coloca estes três no mesmo ecrã com a lógica de há pouco»): Guias de entrada, de transporte a fornecedor e de devolução num só ecrã, em três vistas (Alt+1, Alt+2, Alt+3) com o mesmo fornecedor e a mesma pesquisa; cada guia, receção e encomenda abre numa janela, como nas Receções v2. Os dois outros itens do menu abrem este ecrã na vista deles.';
const ESTADOS3: [string, string, string, string?][] = [
  ['transporte', 'Transporte a fornecedor', 'A vista do que volta ao fornecedor: as linhas rejeitadas nas receções (hoje nenhuma — diz-se, sem inventar).'],
  ['devolucao', 'Devolução', 'As mesmas linhas, com o valor a devolver pelo preço da encomenda (hoje nenhuma).'],
  ['janela', 'Guia numa janela', 'Tocar numa guia abre a janela dela; a receção e a encomenda da linha abrem as suas.', 'gui'],
  ['sem-resultados', 'Pesquisa sem resultados', 'A pesquisa não encontra nada: diz o que se procurou; escolhe-se outro fornecedor, ou limpa-se.'],
  ['carregar', 'A carregar', 'O cabeçalho, as vistas e os filtros já servem; a lista em esqueleto.'],
  ['servidor', 'Servidor indisponível', 'O servidor das compras não respondeu: Atualizar (F9) volta a tentar.'],
  ['offline', 'Sem ligação', 'Sem rede: o fornecedor e a pesquisa ficam.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; volta-se a este ecrã.'],
];
export function comGuiasV3(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return ecras.flatMap((e) => {
    if (e.id !== 'cm-compras-guias-entrada' || e.estadoDe) return [e];
    const num = e.nome.split(' · ')[0], g0 = rececoes()[0]?.guia ?? '';
    return [{ ...e, nome: `${num} · Guias de entrada, transporte e devolução`, versoes: [...e.versoes, { id: 'v3', nota: NOTA3, html: pagina('normal') }] as Ecra<IdErp>['versoes'] },
      ...ESTADOS3.map(([cen, nome, objetivo, jan], i) => ({ id: `gui3-${cen}` as IdErp, nome: `${num}.${40 + i} · ${nome}`, fluxo: e.fluxo, estadoDe: e.id, objetivo,
        versoes: [{ id: 'v3', nota: NOTA3, html: pagina(cen) + (jan ? `<template data-rc2-inicio="gui:${esc(g0)}" data-rc2-modo=""></template>` : '') }] as Ecra<IdErp>['versoes'] }))];
  });
}
export type IdGuias3 = `gui3-${string}`;
