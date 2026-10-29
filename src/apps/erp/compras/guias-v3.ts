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
   29 out. (ela, com o print das Guias de Remessa do antigo: «nas guias falta operações»): Novo (F5), Editar (F6) e
   Anular (F8), e a Série (F4), como no antigo. Novo regista a guia de uma encomenda emitida (as quantidades entram na
   encomenda e o stock entra pelo inventário — dominio.ts, receber); Editar corrige o número da guia e as notas; Anular
   desfaz a guia inteira, com o motivo (anularGuia). Uma guia anulada fica na lista, riscada, e não conta nos totais.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { rececoes, rececao, encomenda, encomendas, fornecedor, artigo, euros, dia, pendente, receber, corrigirGuia, anularGuia, pode, Recusa } from './dominio';
import { perfilDaSessao } from '../sessao';
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
import plus from 'lucide-static/icons/plus.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';

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
interface Est { vista: Vista; q: string; forn: string; serie: string; sel: string; fase: 'ok' | 'carregar' | 'erro'; erro?: 'servidor' | 'offline' | 'sessao' }
/** A série da guia: o prefixo do número (GR 88213 → GR). */
const serieDe = (guia: string) => guia.trim().split(/\s+/)[0] ?? '';
const entradas = () => rececoes().map((r) => { const x = encomenda(r.enc); return { r, forn: x?.forn ?? '', ace: r.linhas.reduce((s, l) => s + l.aceite, 0), rej: r.linhas.reduce((s, l) => s + l.rejeitada, 0), valor: r.linhas.reduce((s, l) => s + (preco(r.enc, l.ref) ?? 0) * l.aceite, 0) }; });
const rejeitadas = () => rececoes().filter((r) => !r.anulada).flatMap((r) => r.linhas.filter((l) => l.rejeitada > 0).map((l) => ({ r, l, forn: encomenda(r.enc)?.forn ?? '', valor: (preco(r.enc, l.ref) ?? 0) * l.rejeitada })));
const passa = (e: Est, forn: string, texto: string[]) => (!e.forn || e.forn === forn) && (!e.q || texto.some((t) => norm(t).includes(norm(e.q))));
const daSerie = (e: Est, guia: string) => !e.serie || serieDe(guia) === e.serie;
const vazio = (ic: string, t: string, d: string) => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p></div>`;
const SEM_REJ = vazio(inbox, 'Nada rejeitado.', 'Nenhuma receção teve artigos rejeitados: não há nada a devolver ao fornecedor. Quando o armazém rejeitar uma linha na receção, ela aparece aqui.');

function tabela(e: Est): { html: string; n: number; resumo: string } {
  if (e.fase === 'carregar') return { html: `<div class="lf2-esq" aria-label="A carregar">${Array.from({ length: 7 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`, n: 0, resumo: '' };
  if (e.fase === 'erro') { const [ic, t, d] = e.erro === 'offline' ? [wifiOff, 'Sem ligação à rede.', 'As guias precisam do servidor. O fornecedor e a pesquisa ficam; tenta outra vez quando a ligação voltar.'] : e.erro === 'sessao' ? [logIn, 'A sessão terminou.', 'Volta a entrar pelo login comum; voltas a este ecrã.'] : [serverOff, 'O servidor das compras não respondeu.', 'Não foi possível ler as guias (ERP-COMP-503). Tenta outra vez.']; return { html: `${vazio(ic, t, d)}`, n: 0, resumo: '' }; }
  const semNada = vazio(searchX, 'Nenhuma guia com estes filtros.', e.q ? `Procura-se «${esc(e.q)}» em toda a linha.` : 'Escolhe outro fornecedor, ou todos.');
  const th = (cs: [string, boolean?][]) => `<thead><tr>${cs.map(([t, n]) => `<th scope="col"${n ? ' class="is-num"' : ''}><span>${t}</span></th>`).join('')}</tr></thead>`;
  const ir = (k: string, t: string) => `<button type="button" class="rc2-ir" data-rc2-abrir="${esc(k)}">${esc(t)}</button>`;
  if (e.vista === 'entrada') {
    const ls = entradas().filter((x) => daSerie(e, x.r.guia) && passa(e, x.forn, [x.r.guia, x.r.ref, x.r.enc, nomeF(x.forn)])), vale = ls.filter((x) => !x.r.anulada);
    if (!rececoes().length) return { html: vazio(inbox, 'Ainda não há guias de entrada.', 'Aparecem quando o armazém regista uma receção.'), n: 0, resumo: '' };
    if (!ls.length) return { html: semNada, n: 0, resumo: '' };
    return { n: ls.length, resumo: `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'guia' : 'guias'}</span><span><b>${nf(vale.reduce((s, x) => s + x.ace, 0))}</b> aceites</span><span>Valor recebido <b>${euros(vale.reduce((s, x) => s + x.valor, 0))}</b></span>${ls.length > vale.length ? `<span><b>${nf(ls.length - vale.length)}</b> ${ls.length - vale.length === 1 ? 'anulada' : 'anuladas'}</span>` : ''}`,
      html: `<table class="lf2-tab dv2-vt dv2c-vt" aria-label="Guias de entrada">${th([['Guia'], ['Data'], ['Receção'], ['Encomenda'], ['Fornecedor'], ['Estado'], ['Aceite', true], ['Rejeitada', true], ['Valor recebido', true]])}
      <tbody>${ls.map((x) => `<tr data-rc2-abrir="gui:${esc(x.r.guia)}" data-gv3-rec="${esc(x.r.ref)}" tabindex="0" class="${e.sel === x.r.ref ? 'is-ativo' : ''}${x.r.anulada ? ' gv3-anulada' : ''}" aria-selected="${e.sel === x.r.ref}" title="Abrir a guia ${esc(x.r.guia)}"><td class="is-mono"><b>${esc(x.r.guia)}</b></td><td>${dia(x.r.data)}</td><td>${ir(`rec:${x.r.ref}`, x.r.ref)}</td><td>${ir(`enc:${x.r.enc}`, x.r.enc)}</td><td>${esc(nomeF(x.forn))}</td><td>${x.r.anulada ? `<span class="lf2-b lf2-b--rutura" title="${esc(x.r.anulada.motivo)}">${L(ban)}Anulada</span>` : `<span class="lf2-b lf2-b--pend">${L(check)}Registada</span>`}</td><td class="is-num">${nf(x.ace)}</td><td class="is-num">${x.rej ? `<b class="is-rutura">${nf(x.rej)}</b>` : '0'}</td><td class="is-num">${euros(x.valor)}</td></tr>`).join('')}</tbody></table>` };
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
const series = () => [...new Set(rececoes().map((r) => serieDe(r.guia)))].filter(Boolean).sort();
const forns = () => [...new Set(rececoes().map((r) => encomenda(r.enc)?.forn ?? ''))].filter(Boolean).map((f) => [f, nomeF(f)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
function pagina(cen: string): string {
  const id = (x: string) => `gv3-${x}-${cen}`;
  return `<div class="hm ak lf2 dv2c gv3" data-hm data-gv3 data-gv3-cenario="${cen}" data-teclas="F4 F5 F6 F8 F9 F11 Escape Alt+1 Alt+2 Alt+3">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Guias', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(fileInput)}</span>
    <div><h1>Guias</h1><p>Entrada, transporte a fornecedor e devolução: as guias das receções do armazém 60.</p></div>
  </header>
  <div class="ak-barra lf2-barra" role="toolbar" aria-label="Ações">
    <button type="button" class="ak-btn" data-gv3-acao="novo" aria-keyshortcuts="F5" title="Nova guia de entrada (F5)">${L(plus)}<span>Novo</span><kbd>F5</kbd></button>
    <button type="button" class="ak-btn" data-gv3-acao="editar" aria-keyshortcuts="F6" title="Corrigir a guia escolhida (F6)">${L(pencil)}<span>Editar</span><kbd>F6</kbd></button>
    <button type="button" class="ak-btn" data-gv3-acao="anular" aria-keyshortcuts="F8" title="Anular a guia escolhida (F8)">${L(ban)}<span>Anular</span><kbd>F8</kbd></button>
    <span class="ak-sep" aria-hidden="true"></span>
    <button type="button" class="ak-btn" data-gv3-acao="atualizar" aria-keyshortcuts="F9" title="Atualizar (F9)">${L(refresh)}<span>Atualizar</span><kbd>F9</kbd></button>
    <button type="button" class="ak-btn" data-gv3-acao="imprimir" aria-keyshortcuts="F11" title="Imprimir (F11)">${L(printer)}<span>Imprimir</span><kbd>F11</kbd></button>
    <span class="ak2-esp"></span>
  </div>
  <nav class="dv2c-vistas-zona" aria-label="Vistas"><div class="dv2-vistas dv2c-vistas" role="tablist" aria-label="Ver">${VISTAS.map((v, i) => `<button type="button" role="tab" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-gv3-vista="${v.k}" aria-keyshortcuts="${v.tecla}" title="${esc(v.titulo)} (${v.tecla.replace('+', ' ')})">${L(v.ic)}<span>${esc(v.t)}</span><small data-gv3-n="${v.k}"></small></button>`).join('')}<i class="dv2c-vistas-ind" data-gv3-ind aria-hidden="true"></i></div></nav>
  <section class="lf2-filtros dv2-filtros dv2c-filtros" aria-label="Pesquisa e filtros">
    <div class="dv2c-linha">
      <label class="ak-campo gv3-serie" for="${id('serie')}"><span class="sr">Série (F4)</span><select id="${id('serie')}" data-gv3-serie aria-keyshortcuts="F4"><option value="">Todas as séries</option>${series().map((x) => `<option value="${esc(x)}">Série ${esc(x)}</option>`).join('')}</select></label>
      <label class="ak-campo dv2c-forn" for="${id('forn')}"><span class="sr">Fornecedor</span><select id="${id('forn')}" data-gv3-forn><option value="">Todos os fornecedores</option>${forns().map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>
      <div class="dv2c-pq" role="group" aria-label="Pesquisar"><label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-gv3-q autocomplete="off" placeholder="Procura em toda a linha: guia, receção, encomenda, fornecedor, artigo…" aria-label="Pesquisar nas guias"></label></div>
    </div>
  </section>
  <section class="lf2-lista dv2-lista dv2c-lista" aria-labelledby="${id('t')}">
    <div class="lf2-lista-cab"><h2 id="${id('t')}" data-gv3-t>Guias de entrada</h2><p class="lf2-resumo" data-gv3-resumo></p></div>
    <div class="lf2-grelha" data-gv3-g></div>
  </section>
  <div class="lf2-dlg-fundo" data-gv3-dlg data-por-cima hidden></div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- o comportamento ---------- */
const estados = new WeakMap<HTMLElement, Est>();
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
function de(r: HTMLElement): Est {
  let e = estados.get(r); if (e) return e;
  const cen = r.dataset.gv3Cenario ?? 'normal', modo = new URLSearchParams(location.hash.slice(1)).get('modo') as Vista | null;
  e = { vista: VISTAS.some((v) => v.k === modo) ? modo! : 'entrada', q: '', forn: '', serie: '', sel: '', fase: 'ok' };
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

/* ---------- Novo, Editar e Anular (29 out.) ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function aviso(r: HTMLElement, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return;
  p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3400));
}
let voltaFoco: HTMLElement | null = null;
function dlg(r: HTMLElement, html: string): void {
  const d = r.querySelector<HTMLElement>('[data-gv3-dlg]')!; if (d.hidden) voltaFoco = document.activeElement as HTMLElement;
  d.innerHTML = `<div class="lf2-dlg gv3-dlg" role="dialog" aria-modal="true" aria-labelledby="gv3-dlg-t">${html}</div>`; d.hidden = false;
  (d.querySelector<HTMLElement>('[data-gv3-primeiro]') ?? d.querySelector<HTMLElement>('input, select, textarea, button'))?.focus();
}
function fecharDlg(r: HTMLElement): boolean { const d = r.querySelector<HTMLElement>('[data-gv3-dlg]'); if (!d || d.hidden) return false; d.hidden = true; d.innerHTML = ''; voltaFoco?.focus({ preventScroll: true }); return true; }
const BOTOES = (sim: string, ic: string, t: string, cls = 'ak-btn--acao') => `<p class="ak-erro-campo" data-gv3-erro role="alert" hidden></p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-gv3-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ${cls}" data-gv3-sim="${sim}">${L(ic)}<span>${t}</span></button></div>`;
const porReceber = () => encomendas().filter((x) => x.estado === 'Emitida' || x.estado === 'Parcialmente recebida');
function linhasNovo(enc: string): string {
  const x = encomenda(enc); if (!x) return '';
  const ls = x.linhas.filter((l) => pendente(l) > 0);
  return `<table class="lf2-tab gv3-linhas"><thead><tr><th>Artigo</th><th class="is-num">Falta</th><th class="is-num">Aceite</th><th class="is-num">Rejeitada</th><th>Motivo</th></tr></thead><tbody>${ls.map((l) => `<tr data-gv3-linha="${esc(l.id)}"><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${nf(pendente(l))}</td><td class="is-num"><input type="number" min="0" max="${pendente(l)}" value="${pendente(l)}" data-gv3-ace aria-label="Aceite de ${esc(l.ref)}"></td><td class="is-num"><input type="number" min="0" max="${pendente(l)}" value="0" data-gv3-rej aria-label="Rejeitada de ${esc(l.ref)}"></td><td><input type="text" maxlength="80" data-gv3-mot placeholder="Só se rejeitar" aria-label="Motivo da rejeição de ${esc(l.ref)}"></td></tr>`).join('')}</tbody></table>`;
}
function abrirNovo(r: HTMLElement): void {
  const es = porReceber();
  if (!es.length) { aviso(r, 'Não há encomendas emitidas à espera de mercadoria.'); return; }
  dlg(r, `<h2 id="gv3-dlg-t">${L(plus)}Nova guia de entrada</h2>
    <div class="gv3-campos"><label class="ak-campo"><span>Encomenda</span><select data-gv3-enc data-gv3-primeiro>${es.map((x) => `<option value="${esc(x.ref)}">${esc(x.ref)} · ${esc(nomeF(x.forn))}</option>`).join('')}</select></label>
    <label class="ak-campo"><span>N.º da guia do fornecedor</span><input type="text" maxlength="30" data-gv3-guia placeholder="Ex.: GR 90121"></label></div>
    <div data-gv3-linhas>${linhasNovo(es[0].ref)}</div>
    <label class="ak-campo"><span>Notas</span><input type="text" maxlength="200" data-gv3-notas></label>
    ${BOTOES('novo', check, 'Registar a guia')}`);
}
function escolhida(r: HTMLElement): ReturnType<typeof rececao> {
  const e = de(r), ref = e.sel || (document.activeElement as HTMLElement)?.closest?.<HTMLElement>('[data-gv3-rec]')?.dataset.gv3Rec || '';
  const x = ref ? rececao(ref) : undefined;
  if (!x) aviso(r, de(r).vista === 'entrada' ? 'Escolhe uma guia na lista.' : 'Editar e Anular são das guias de entrada: passa à vista Entrada (Alt+1).');
  return x;
}
function abrirEditar(r: HTMLElement): void {
  const x = escolhida(r); if (!x) return;
  if (x.anulada) { aviso(r, `A guia ${x.guia} está anulada: não se altera.`); return; }
  dlg(r, `<h2 id="gv3-dlg-t">${L(pencil)}Corrigir a guia ${esc(x.guia)}</h2><p>${esc(x.ref)} · ${esc(x.enc)} · ${esc(nomeF(encomenda(x.enc)?.forn ?? ''))}. As quantidades não se corrigem aqui: anula-se a guia e regista-se outra.</p>
    <div class="gv3-campos"><label class="ak-campo"><span>N.º da guia do fornecedor</span><input type="text" maxlength="30" value="${esc(x.guia)}" data-gv3-guia data-gv3-primeiro></label>
    <label class="ak-campo"><span>Notas</span><input type="text" maxlength="200" value="${esc(x.notas)}" data-gv3-notas></label></div>
    ${BOTOES('editar', check, 'Gravar')}`);
}
function abrirAnular(r: HTMLElement): void {
  const x = escolhida(r); if (!x) return;
  if (x.anulada) { aviso(r, `A guia ${x.guia} já foi anulada.`); return; }
  dlg(r, `<h2 id="gv3-dlg-t" class="is-perigo">${L(ban)}Anular a guia ${esc(x.guia)}?</h2><p>As quantidades saem da encomenda ${esc(x.enc)} e o stock que entrou sai do armazém 60. A guia fica na lista, anulada.</p>
    <label class="ak-campo dv2-motivo"><span>Motivo (obrigatório)</span><textarea rows="3" maxlength="300" data-gv3-motivo data-gv3-primeiro placeholder="Porque se anula — fica no histórico da encomenda"></textarea></label>
    ${BOTOES('anular', ban, 'Anular a guia', 'ak-btn--perigo')}`);
}
function confirmar(r: HTMLElement, k: string): void {
  const d = r.querySelector<HTMLElement>('[data-gv3-dlg]')!, erro = d.querySelector<HTMLElement>('[data-gv3-erro]')!, val = (s: string) => d.querySelector<HTMLInputElement>(s)?.value ?? '';
  const p = perfilDaSessao(), e = de(r);
  try {
    if (k === 'novo') {
      const linhas = [...d.querySelectorAll<HTMLElement>('[data-gv3-linha]')].map((tr) => ({ linha: tr.dataset.gv3Linha!, aceite: Number(tr.querySelector<HTMLInputElement>('[data-gv3-ace]')!.value || 0), rejeitada: Number(tr.querySelector<HTMLInputElement>('[data-gv3-rej]')!.value || 0), motivo: tr.querySelector<HTMLInputElement>('[data-gv3-mot]')!.value.trim() }));
      const { rec } = receber(p, { chave: `gv3-${Date.now().toString(36)}`, enc: val('[data-gv3-enc]'), guia: val('[data-gv3-guia]'), notas: val('[data-gv3-notas]'), linhas }, 'guias');
      e.sel = rec.ref; e.vista = 'entrada'; fecharDlg(r); desenhar(r); aviso(r, `Guia ${rec.guia} registada (${rec.ref}): ${rec.linhas.length} ${rec.linhas.length === 1 ? 'linha' : 'linhas'}, a encomenda ${rec.enc} e o stock atualizados.`);
    } else if (k === 'editar') {
      const x = corrigirGuia(p, e.sel, val('[data-gv3-guia]'), val('[data-gv3-notas]')); fecharDlg(r); desenhar(r); aviso(r, `Guia ${x.guia} corrigida.`);
    } else {
      const x = anularGuia(p, e.sel, d.querySelector<HTMLTextAreaElement>('[data-gv3-motivo]')!.value); fecharDlg(r); desenhar(r); aviso(r, `Guia ${x.guia} anulada: a encomenda ${x.enc} voltou a «${encomenda(x.enc)?.estado ?? ''}» e o stock foi acertado.`);
    }
  } catch (x) { erro.hidden = false; erro.textContent = x instanceof Recusa ? x.message : 'Não foi possível gravar. Nada mudou.'; }
}
void pode;
export function iniciar(): void {
  const armar = () => document.querySelectorAll<HTMLElement>('[data-gv3]').forEach((r) => {
    if (r.dataset.gv3Armado) return; r.dataset.gv3Armado = '1';
    const cen = r.dataset.gv3Cenario; if (cen === 'anular') de(r).sel = rececoes()[0]?.ref ?? '';
    desenhar(r);
    /* os estados com o diálogo aberto (no ecrã que se vê; os outros abrem-no quando aparecem) */
    if (cen === 'novo') abrirNovo(r); if (cen === 'anular') abrirAnular(r);
  });
  armar(); document.addEventListener('romafe:ecra', () => { armar(); const r = visivel(); if (r) desenhar(r); }); window.addEventListener('load', armar);
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = t.closest<HTMLElement>('[data-gv3]'); if (!r || editando()) return;
    let b: HTMLElement | null;
    if ((b = t.closest('[data-gv3-vista]'))) { vista(r, b.dataset.gv3Vista as Vista); return; }
    if (t.closest('[data-gv3-fechar]') || t.matches('[data-gv3-dlg]')) { fecharDlg(r); return; }
    if ((b = t.closest('[data-gv3-sim]'))) { confirmar(r, b.dataset.gv3Sim!); return; }
    if ((b = t.closest('[data-gv3-acao]'))) {
      const k = b.dataset.gv3Acao;
      if (k === 'novo') { abrirNovo(r); return; } if (k === 'editar') { abrirEditar(r); return; } if (k === 'anular') { abrirAnular(r); return; }
      if (k === 'imprimir') { window.print(); return; }
      const e = de(r); e.fase = 'ok'; e.erro = undefined; b.classList.add('is-carregar'); window.setTimeout(() => { b!.classList.remove('is-carregar'); desenhar(r); }, 300);
    }
  });
  /* a linha fica escolhida (para Editar e Anular): a janela da guia apanha o clique e avisa com «rc2:linha» */
  document.addEventListener('rc2:linha', (ev) => {
    const t = ev.target as HTMLElement, r = t.closest<HTMLElement>('[data-gv3]'), b = t.closest<HTMLElement>('tr[data-gv3-rec]'); if (!r || !b || editando()) return;
    de(r).sel = b.dataset.gv3Rec!; r.querySelectorAll<HTMLElement>('tr[data-gv3-rec]').forEach((x) => { const s = x === b; x.classList.toggle('is-ativo', s); x.setAttribute('aria-selected', String(s)); });
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLSelectElement, r = t.closest?.<HTMLElement>('[data-gv3]'); if (!r) return;
    if (t.matches('[data-gv3-forn]')) { de(r).forn = t.value; desenhar(r); }
    if (t.matches('[data-gv3-serie]')) { de(r).serie = t.value; desenhar(r); }
    if (t.matches('[data-gv3-enc]')) r.querySelector<HTMLElement>('[data-gv3-linhas]')!.innerHTML = linhasNovo(t.value);
  });
  let espera = 0;
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLInputElement, r = t.closest?.<HTMLElement>('[data-gv3]'); if (!r || !t.matches('[data-gv3-q]')) return; clearTimeout(espera); espera = window.setTimeout(() => { de(r).q = t.value.trim(); desenhar(r); }, 140); });
  document.addEventListener('keydown', (ev) => {
    const r = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-gv3]') ?? visivel(); if (!r || editando()) return;
    const v = VISTAS.find((x) => ev.altKey && !ev.ctrlKey && x.tecla === `Alt+${ev.key}`); if (v) { ev.preventDefault(); vista(r, v.k); return; }
    const t = ev.target as HTMLElement;
    if (t.matches('[data-gv3-vista]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); const i = VISTAS.findIndex((x) => x.k === t.dataset.gv3Vista); vista(r, VISTAS[(i + (ev.key === 'ArrowRight' ? 1 : VISTAS.length - 1)) % VISTAS.length].k); return; }
    if (t.matches('tr[data-rc2-abrir]') && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) { ev.preventDefault(); const ls = [...r.querySelectorAll<HTMLElement>('[data-gv3-g] tr[data-rc2-abrir]')], i = ls.indexOf(t); ls[Math.max(0, Math.min(ls.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))]?.focus(); return; }
    if (ev.key === 'Escape' && fecharDlg(r)) { ev.preventDefault(); return; }
    if (!r.querySelector<HTMLElement>('[data-gv3-dlg]')?.hidden) return;
    if (ev.key === 'F4') { ev.preventDefault(); r.querySelector<HTMLElement>('[data-gv3-serie]')?.focus(); return; }
    if (ev.key === 'F5') { ev.preventDefault(); abrirNovo(r); return; }
    if (ev.key === 'F6') { ev.preventDefault(); abrirEditar(r); return; }
    if (ev.key === 'F8') { ev.preventDefault(); abrirAnular(r); return; }
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
  ['novo', 'Nova guia', 'Novo (F5): a encomenda emitida, o número da guia do fornecedor e o que chegou de cada linha (aceite, rejeitada com motivo); registar atualiza a encomenda e o stock.'],
  ['anular', 'Anular uma guia', 'Anular (F8) a guia escolhida: o que acontece à encomenda e ao stock, e o motivo obrigatório.'],
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
