/* =========================================================
   ERP — Compras: Receções v2 (27 out. 2026). Ela: «no ecrã da receção faz a mesma lógica das janelas — isto pode
   ficar em janela» (a página da encomenda que abria ao tocar na EF). O ecrã é o mesmo da v1; tocar numa encomenda ou
   numa receção abre-a numa janela flutuante, como na Lista de Faltas, nos Orçamentos e nas Encomendas: arrasta-se
   pelo cabeçalho, redimensiona-se pelo canto, minimiza-se, maximiza-se (duplo clique) e fecha-se (Esc fecha a de
   cima); várias ao mesmo tempo, em cascata. Dentro, as ligações (a encomenda da receção, as receções da encomenda)
   abrem a janela delas. «Registar receção» continua a abrir o registo na página (é uma tarefa, não um detalhe).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { encomenda, rececoesDe, rececoes, fornecedor, artigo, totais, linhaLiquida, pendente, euros, dia, pct, ARMAZEM } from './dominio';
import { percurso, estadoEnc } from './ecras';
import { PERFIS } from '../inicio-dados';
import { ic } from '../inicio-icones';
import minus from 'lucide-static/icons/minus.svg?raw';
import fileInput from 'lucide-static/icons/file-input.svg?raw';
import maximize from 'lucide-static/icons/maximize-2.svg?raw';
import minimize from 'lucide-static/icons/minimize-2.svg?raw';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const nf = (n: number) => n.toLocaleString('pt-PT');
const NOTA = 'Receções v2 (27 out., ela: «faz a mesma lógica das janelas»): o ecrã da v1, com a encomenda e a receção a abrirem em janelas flutuantes (como na Lista de Faltas), em vez de se sair para a página delas.';
/* 27 out.: também nas Guias de entrada v2 (ela: «faz o mesmo para a guia de entrada») */
const ESCOPO = '.ecra[data-ecra="compras-rececoes"] > .versao[data-versao="v2"], .ecra[data-ecra="cm-compras-guias-entrada"] > .versao[data-versao="v2"], .ecra[data-ecra^="gui2-"] > .versao, .ecra[data-ecra="cm-compras-guias-entrada"] > .versao[data-versao="v3"], .ecra[data-ecra^="gui3-"] > .versao';
const GUIAS = '[data-ecra="cm-compras-guias-entrada"], [data-ecra^="gui2-"]';
const NOTA_GUIAS = 'Guias de entrada v2 (27 out., ela: «faz o mesmo para a guia de entrada»): sem o painel ao lado; tocar numa guia abre-a numa janela flutuante, e a receção e a encomenda (na linha ou dentro da janela) abrem as delas — como nas Receções v2.';

/* ---------- o que vai dentro de cada janela ---------- */
const dl = (xs: [string, string][]) => `<dl class="lf2-jan-dl">${xs.map(([t, v]) => `<div><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const ir = (k: string, ref: string, t = ref) => `<button type="button" class="rc2-ir" data-rc2-abrir="${k}:${esc(ref)}">${esc(t)}</button>`;
function corpoEnc(ref: string): string {
  const x = encomenda(ref); if (!x) return `<p class="lf2-sem">${ic('circle-alert')}A ${esc(ref)} já não existe.</p>`;
  const t = totais(x), recs = rececoesDe(x.ref), f = fornecedor(x.forn);
  return `<div class="rc2-topo"><b>${esc(f?.nome ?? x.forn)}</b>${estadoEnc(x)}<span class="rc2-fraco">versão ${x.versao}</span></div>
    <div class="rc2-percurso">${percurso(x).replaceAll('data-ws-ir="compras-rececao" data-ws-ref="', 'data-rc2-abrir="rec:')}</div>
    <section class="lf2-jan-s"><h3>Cabeçalho</h3>${dl([['Ref. do fornecedor', `<span class="is-mono">${esc(x.refForn || '—')}</span>`], ['Data', dia(x.data)], ['Entrega prevista', dia(x.entrega)], ['Destino', esc(x.armazem || ARMAZEM)], ['Comprador', esc(PERFIS[x.comprador]?.pessoa ?? '')], ['Pagamento', esc(x.pagamento)]])}</section>
    <section class="lf2-jan-s"><h3>Artigos <small>${x.linhas.length}</small></h3>
      <div class="rc2-rolo"><table class="lf2-mini rc2-t"><thead><tr><th>Artigo</th><th class="is-num">Qtd.</th><th class="is-num">Preço</th><th class="is-num">Líquido</th><th class="is-num">Recebida</th><th class="is-num">Falta</th></tr></thead>
      <tbody>${x.linhas.map((l) => { const a = artigo(l.ref), v = linhaLiquida(l), falta = pendente(l); return `<tr><td><span class="is-mono">${esc(l.ref)}</span><small>${esc(a?.desc ?? '')}</small></td><td class="is-num">${nf(l.qtd)} <small>${esc(a?.un ?? '')}</small></td><td class="is-num">${l.preco === null ? '—' : euros(l.preco)}</td><td class="is-num">${v === null ? '—' : euros(v)}</td><td class="is-num">${nf(l.recebida)}${l.rejeitada ? ` <small class="is-neg">${nf(l.rejeitada)} rej.</small>` : ''}</td><td class="is-num">${falta ? `<b>${nf(falta)}</b>` : '<span class="rc2-fraco">—</span>'}</td></tr>`; }).join('')}</tbody></table></div></section>
    <section class="lf2-jan-s"><h3>Resumo</h3>${dl([['Base s/ IVA', euros(t.base)], ...t.iva.map((y): [string, string] => [`IVA ${pct(y.taxa)}`, euros(y.valor)]), ['Total c/ IVA', `<b>${euros(t.total)}</b>`]])}</section>
    <section class="lf2-jan-s"><h3>Receções <small>${recs.length}</small></h3>${recs.length ? `<ul class="rc2-l">${recs.map((r) => `<li>${ir('rec', r.ref)}<span>${dia(r.data)} · guia ${esc(r.guia)} · ${nf(r.linhas.reduce((s, l) => s + l.aceite, 0))} aceites</span></li>`).join('')}</ul>` : '<p class="rc2-fraco">Ainda sem receções.</p>'}</section>`;
}
function corpoRec(ref: string): string {
  const r = rececoes().find((y) => y.ref === ref); if (!r) return `<p class="lf2-sem">${ic('circle-alert')}A ${esc(ref)} já não existe.</p>`;
  const x = encomenda(r.enc), ace = r.linhas.reduce((s, l) => s + l.aceite, 0), rej = r.linhas.reduce((s, l) => s + l.rejeitada, 0);
  return `<div class="lf2-jan-nums rc2-nums"><div><small>Aceite</small><b>${nf(ace)}</b></div><div class="${rej ? 'is-rutura' : ''}"><small>Rejeitado</small><b>${nf(rej)}</b></div><div><small>Linhas</small><b>${nf(r.linhas.length)}</b></div></div>
    <section class="lf2-jan-s"><h3>Receção</h3>${dl([['Encomenda', ir('enc', r.enc)], ['Fornecedor', esc(x ? fornecedor(x.forn)?.nome ?? x.forn : '—')], ['Guia', `<span class="is-mono">${esc(r.guia)}</span>`], ['Data', dia(r.data)], ['Armazém', esc(r.armazem)], ['Por', esc(PERFIS[r.por]?.pessoa ?? r.por)]])}</section>
    <section class="lf2-jan-s"><h3>Linhas</h3><div class="rc2-rolo"><table class="lf2-mini rc2-t"><thead><tr><th>Artigo</th><th class="is-num">Aceite</th><th class="is-num">Rejeitada</th><th>Motivo</th></tr></thead>
      <tbody>${r.linhas.map((l) => `<tr><td><span class="is-mono">${esc(l.ref)}</span><small>${esc(artigo(l.ref)?.desc ?? '')}</small></td><td class="is-num">${nf(l.aceite)}</td><td class="is-num">${l.rejeitada ? `<b class="is-neg">${nf(l.rejeitada)}</b>` : '—'}</td><td>${esc(l.motivo || '—')}</td></tr>`).join('')}</tbody></table></div></section>
    ${r.notas ? `<section class="lf2-jan-s"><h3>Notas</h3><p class="rc2-notas">${esc(r.notas)}</p></section>` : ''}`;
}

/** A guia de entrada: a guia do fornecedor registada numa receção (o que chegou, aceite e rejeitado, e o valor). */
function corpoGuia(guia: string): string {
  const r = rececoes().find((y) => y.guia === guia); if (!r) return `<p class="lf2-sem">${ic('circle-alert')}A guia ${esc(guia)} já não está registada.</p>`;
  const x = encomenda(r.enc), ace = r.linhas.reduce((s, l) => s + l.aceite, 0), rej = r.linhas.reduce((s, l) => s + l.rejeitada, 0);
  const preco = (ref: string) => x?.linhas.find((l) => l.ref === ref)?.preco ?? artigo(ref)?.preco ?? null;
  const valor = r.linhas.reduce((s, l) => s + (preco(l.ref) ?? 0) * l.aceite, 0);
  return `<div class="lf2-jan-nums rc2-nums rc2-nums--4"><div><small>Aceite</small><b>${nf(ace)}</b></div><div class="${rej ? 'is-rutura' : ''}"><small>Rejeitada</small><b>${nf(rej)}</b></div><div><small>Linhas</small><b>${nf(r.linhas.length)}</b></div><div><small>Valor recebido</small><b>${euros(valor)}</b></div></div>
    <section class="lf2-jan-s"><h3>Guia</h3>${dl([['Data', dia(r.data)], ['Receção', ir('rec', r.ref)], ['Encomenda', ir('enc', r.enc)], ['Fornecedor', esc(x ? fornecedor(x.forn)?.nome ?? x.forn : '—')], ['Armazém', esc(r.armazem)], ['Registada por', esc(PERFIS[r.por]?.pessoa ?? r.por)]])}</section>
    <section class="lf2-jan-s"><h3>Linhas <small>${r.linhas.length}</small></h3><div class="rc2-rolo"><table class="lf2-mini rc2-t"><thead><tr><th>Artigo</th><th class="is-num">Aceite</th><th class="is-num">Rejeitada</th><th class="is-num">Preço</th><th class="is-num">Valor</th></tr></thead>
      <tbody>${r.linhas.map((l) => { const pr = preco(l.ref); return `<tr><td><span class="is-mono">${esc(l.ref)}</span><small>${esc(artigo(l.ref)?.desc ?? '')}</small></td><td class="is-num">${nf(l.aceite)}</td><td class="is-num">${l.rejeitada ? `<b class="is-neg">${nf(l.rejeitada)}</b> <small>${esc(l.motivo)}</small>` : '—'}</td><td class="is-num">${pr === null ? '—' : euros(pr)}</td><td class="is-num">${pr === null ? '—' : euros(pr * l.aceite)}</td></tr>`; }).join('')}</tbody></table></div></section>`;
}

/* ---------- as janelas (por versão à vista; a caixa fica fora do que o ecrã redesenha) ---------- */
interface Jan { k: string; x: number; y: number; w: number; h: number; min: boolean; max: boolean; z: number }
const janelas = new WeakMap<HTMLElement, Jan[]>();
let zTopo = 10;
const js = (v: HTMLElement) => { let j = janelas.get(v); if (!j) { j = []; janelas.set(v, j); } return j; };
const caixaDe = (v: HTMLElement) => { let c = v.querySelector<HTMLElement>(':scope > [data-rc2-caixa]'); if (!c) { c = document.createElement('div'); c.className = 'hm ws lf2-janelas rc2-caixa'; c.dataset.rc2Caixa = ''; c.setAttribute('data-por-cima', ''); v.appendChild(c); } return c; };
const IC_ = { enc: 'file-text', rec: 'package-check', gui: 'file-text' } as const;
const NOME_ = { enc: 'Encomenda', rec: 'Receção', gui: 'Guia de entrada' } as const;
function janHtml(j: Jan): string {
  const [tipo, ref] = [j.k.slice(0, 3) as 'enc' | 'rec' | 'gui', j.k.slice(4)], id = `rc2-jan-${j.k.replace(/\W+/g, '-')}`;
  return `<section data-por-cima class="lf2-jan rc2-jan${j.min ? ' is-min' : ''}${j.max ? ' is-max' : ''}" data-rc2-jan="${esc(j.k)}" role="dialog" aria-labelledby="${id}" tabindex="-1" style="left:${j.x}px;top:${j.y}px;width:${j.w}px;height:${j.h}px;z-index:${j.z}">
    <header class="lf2-jan-cab" data-rc2-arrastar title="Arrasta para mudar de sítio; duplo clique maximiza">${tipo === 'gui' ? fileInput : ic(IC_[tipo])}<h3 id="${id}">${NOME_[tipo]} · <b>${esc(ref)}</b></h3>
      <span class="lf2-jan-bts"><button type="button" data-rc2-acao="min" aria-label="${j.min ? 'Restaurar' : 'Minimizar'}" title="${j.min ? 'Restaurar' : 'Minimizar'}">${minus}</button><button type="button" data-rc2-acao="max" aria-label="${j.max ? 'Restaurar o tamanho' : 'Maximizar'}" title="${j.max ? 'Restaurar o tamanho' : 'Maximizar'}">${j.max ? minimize : maximize}</button><button type="button" data-rc2-acao="fechar" aria-label="Fechar (Esc)" title="Fechar (Esc)">${ic('x')}</button></span></header>
    <div class="lf2-jan-corpo">${tipo === 'enc' ? corpoEnc(ref) : tipo === 'gui' ? corpoGuia(ref) : corpoRec(ref)}</div>
  </section>`;
}
const desenhar = (v: HTMLElement) => { caixaDe(v).innerHTML = js(v).map(janHtml).join(''); };
export function abrir(v: HTMLElement, k: string, de?: HTMLElement | null): void {
  const l = js(v); let j = l.find((x) => x.k === k);
  if (j) { j.z = ++zTopo; j.min = false; desenhar(v); }
  else {
    const n = l.length % 6, w = Math.min(k.startsWith('enc') ? 720 : 560, innerWidth - 32), h = Math.min(640, innerHeight - 40);
    j = { k, x: Math.max(16, innerWidth - w - 40 - n * 28), y: Math.max(16, Math.min(innerHeight - h - 16, 72 + n * 28)), w, h, min: false, max: false, z: ++zTopo };
    l.push(j); caixaDe(v).insertAdjacentHTML('beforeend', janHtml(j));
    const el = caixaDe(v).querySelector<HTMLElement>(`[data-rc2-jan="${CSS.escape(k)}"]`);
    if (el && de && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const a = de.getBoundingClientRect(), b = el.getBoundingClientRect(); el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${Math.max(.2, a.width / b.width)}, ${Math.max(.06, a.height / b.height)})`, opacity: .2, transformOrigin: '0 0' }, { transform: 'none', opacity: 1, transformOrigin: '0 0' }], { duration: 240, easing: 'cubic-bezier(.22, 1, .36, 1)' }); }
  }
  caixaDe(v).querySelector<HTMLElement>(`[data-rc2-jan="${CSS.escape(k)}"]`)?.focus({ preventScroll: true });
}
function acao(v: HTMLElement, k: string, a: string): void {
  const l = js(v), j = l.find((x) => x.k === k); if (!j) return;
  if (a === 'fechar') { l.splice(l.indexOf(j), 1); caixaDe(v).querySelector(`[data-rc2-jan="${CSS.escape(k)}"]`)?.remove(); v.querySelector<HTMLElement>(`[data-ws-ref="${CSS.escape(k.slice(4))}"]`)?.focus({ preventScroll: true }); return; }
  if (a === 'min') { j.min = !j.min; if (j.min) j.max = false; }
  if (a === 'max') { j.max = !j.max; if (j.max) j.min = false; }
  j.z = ++zTopo; desenhar(v);
}
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');

/** Os estados do editor (27 out., ela: «todos os ecrãs com todos os estados»): as janelas já abertas, como se tivessem sido tocadas. */
function armarEstados(): void {
  document.querySelectorAll<HTMLTemplateElement>('template[data-rc2-inicio]').forEach((t) => {
    const v = t.closest<HTMLElement>('.versao'); if (!v || v.dataset.rc2Armado) return; v.dataset.rc2Armado = '1';
    (t.dataset.rc2Inicio ?? '').split('|').filter(Boolean).forEach((k) => abrir(v, k));
    (t.dataset.rc2Modo ?? '').split('|').filter(Boolean).forEach((m) => { const [a, k] = [m.slice(0, 3), m.slice(4)]; acao(v, k, a); });
    v.querySelectorAll<HTMLElement>('[data-rc2-jan]').forEach((x) => x.getAnimations().forEach((a) => a.finish()));
  });
}
export function iniciar(): void {
  armarEstados(); document.addEventListener('romafe:ecra', armarEstados); window.addEventListener('load', armarEstados);
  /* em captura, antes do comportamento da casa: a encomenda e a receção abrem em janela em vez de se sair da página */
  window.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, v = t.closest?.<HTMLElement>(ESCOPO); if (!v || editando()) return;
    let b: HTMLElement | null;
    if ((b = t.closest('[data-rc2-acao]'))) { ev.preventDefault(); ev.stopImmediatePropagation(); acao(v, b.closest<HTMLElement>('[data-rc2-jan]')!.dataset.rc2Jan!, b.dataset.rc2Acao!); return; }
    if ((b = t.closest('[data-rc2-abrir]'))) { ev.preventDefault(); ev.stopImmediatePropagation(); abrir(v, b.dataset.rc2Abrir!, b); return; }
    /* nas Guias de entrada: a receção e a encomenda da linha abrem as delas; o resto da linha abre a guia */
    const tr = t.closest<HTMLElement>('tr[data-fx-i]');
    if (tr && v.closest(GUIAS)) {
      const td = t.closest('td'), cs = [...tr.children].map((c) => c.textContent?.trim() ?? ''), i = td ? [...tr.children].indexOf(td) : -1;
      abrir(v, i === 2 ? `rec:${cs[2]}` : i === 3 ? `enc:${cs[3]}` : `gui:${cs[0]}`, td ?? tr); return;
    }
    if ((b = t.closest('[data-ws-ir="compras-encomenda"][data-ws-ref], [data-ws-ir="compras-rececao"][data-ws-ref]'))) {
      /* «Registar receção» (o botão de ação) continua a abrir o registo na página */
      if (b.matches('.btn--acao')) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); abrir(v, `${b.dataset.wsIr === 'compras-encomenda' ? 'enc' : 'rec'}:${b.dataset.wsRef}`, b);
    }
  }, true);
  /* trazer para a frente e arrastar pelo cabeçalho */
  window.addEventListener('pointerdown', (ev) => {
    const t = ev.target as HTMLElement, jan = t.closest?.<HTMLElement>('[data-rc2-jan]'), v = jan?.closest<HTMLElement>(ESCOPO); if (!jan || !v || editando()) return;
    const j = js(v).find((x) => x.k === jan.dataset.rc2Jan); if (!j) return;
    if (j.z !== zTopo) { j.z = ++zTopo; jan.style.zIndex = String(j.z); }
    if (!t.closest('[data-rc2-arrastar]') || t.closest('button') || j.max) return;
    ev.preventDefault(); const x0 = ev.clientX - j.x, y0 = ev.clientY - j.y; jan.classList.add('is-a-mover');
    const mover = (m: PointerEvent) => { j.x = Math.max(-j.w + 120, Math.min(innerWidth - 120, m.clientX - x0)); j.y = Math.max(0, Math.min(innerHeight - 40, m.clientY - y0)); jan.style.left = `${j.x}px`; jan.style.top = `${j.y}px`; };
    const largar = () => { document.removeEventListener('pointermove', mover); document.removeEventListener('pointerup', largar); jan.classList.remove('is-a-mover'); };
    document.addEventListener('pointermove', mover); document.addEventListener('pointerup', largar);
  });
  window.addEventListener('dblclick', (ev) => { const h = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-rc2-arrastar]'), v = h?.closest<HTMLElement>(ESCOPO); if (!h || !v || (ev.target as HTMLElement).closest('button')) return; acao(v, h.closest<HTMLElement>('[data-rc2-jan]')!.dataset.rc2Jan!, 'max'); });
  /* Enter numa guia abre-a; Esc fecha a de cima (a que tem o foco, se houver) */
  window.addEventListener('keydown', (ev) => {
    const tr = (ev.target as HTMLElement).closest?.<HTMLElement>('tr[data-fx-i]'), vg = tr?.closest<HTMLElement>(ESCOPO); if (vg && !vg.closest(GUIAS)) return;
    if (ev.key === 'Enter' && tr && vg && !editando()) { ev.preventDefault(); abrir(vg, `gui:${tr.children[0]?.textContent?.trim() ?? ''}`, tr); return; }
    /* as linhas que abrem uma janela (as Guias v3): Enter abre */
    const ta = (ev.target as HTMLElement).closest?.<HTMLElement>('tr[data-rc2-abrir]'), va = ta?.closest<HTMLElement>(ESCOPO);
    if (ev.key === 'Enter' && ta && va && !editando()) { ev.preventDefault(); abrir(va, ta.dataset.rc2Abrir!, ta); return; }
    if (ev.key !== 'Escape' || editando()) return;
    const v = [...document.querySelectorAll<HTMLElement>(ESCOPO)].find((x) => !x.hidden && !x.closest('.ecra')?.hasAttribute('hidden')); if (!v) return;
    const l = js(v); if (!l.length) return;
    const daqui = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-rc2-jan]')?.dataset.rc2Jan, k = daqui ?? l.slice().sort((a, b) => b.z - a.z)[0].k;
    ev.preventDefault(); ev.stopImmediatePropagation(); acao(v, k, 'fechar');
  }, true);
  /* o tamanho dado pelo canto fica (para minimizar e voltar) */
  const medir = new ResizeObserver((xs) => xs.forEach((x) => { const el = x.target as HTMLElement, v = el.closest<HTMLElement>(ESCOPO); if (!v || el.classList.contains('is-min') || el.classList.contains('is-max')) return; const j = js(v).find((y) => y.k === el.dataset.rc2Jan); if (j) { j.w = Math.round(el.offsetWidth); j.h = Math.round(el.offsetHeight); } }));
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n instanceof HTMLElement && n.matches('[data-rc2-jan]')) medir.observe(n); }))).observe(document.body, { childList: true, subtree: true });
}

const ini = (ks: string[], modo: string[] = []) => `<template data-rc2-inicio="${esc(ks.join('|'))}" data-rc2-modo="${esc(modo.join('|'))}"></template>`;
/** Os estados da v2: as janelas abertas (os documentos são os do protótipo, os primeiros da lista). */
function estadosV2(base: Ecra<IdErp>, prefixo: 'rc2' | 'gui2', html: string, num: string, nota: string): Ecra<IdErp>[] {
  const recs = rececoes(), r0 = recs[0], r1 = recs[1], g0 = r0?.guia ?? '', e0 = r0?.enc ?? '';
  const ESTADOS: [string, string, string, string[], string[]][] = prefixo === 'rc2' ? [
    ['janela-enc', 'Encomenda numa janela', 'Tocar numa encomenda abre-a numa janela: o percurso, o cabeçalho, os artigos com o recebido e o que falta, o resumo e as receções dela.', [`enc:${e0}`], []],
    ['janela-rec', 'Receção numa janela', 'Tocar numa receção abre-a numa janela: aceite, rejeitado, a guia e as linhas; a encomenda dela abre a sua.', [`rec:${r0?.ref ?? ''}`], []],
    ['janelas', 'Encomenda e receção', 'A receção aberta a partir da encomenda: duas janelas em cascata; Esc fecha a de cima.', [`enc:${e0}`, `rec:${r0?.ref ?? ''}`], []],
    ['minimizada', 'Janela minimizada', 'Uma janela minimizada fica só com o título; tocar no botão devolve-a ao tamanho que tinha.', [`enc:${e0}`, `rec:${r1?.ref ?? ''}`], [`min:rec:${r1?.ref ?? ''}`]],
    ['maximizada', 'Janela maximizada', 'Duplo clique no cabeçalho enche o ecrã; outra vez, volta ao tamanho que tinha.', [`enc:${e0}`], [`max:enc:${e0}`]],
    ['inexistente', 'Documento que já não existe', 'A ligação aponta para um documento que já não está no ERP: a janela diz que já não existe, sem inventar.', ['enc:EF 2026/0399'], []],
  ] : [
    ['janela', 'Guia numa janela', 'Tocar numa guia abre-a numa janela: aceite, rejeitado, valor recebido e as linhas com o preço.', [`gui:${g0}`], []],
    ['ligacoes', 'Guia, receção e encomenda', 'A receção e a encomenda da guia (na linha ou dentro da janela) abrem as suas janelas, em cascata.', [`gui:${g0}`, `rec:${r0?.ref ?? ''}`, `enc:${e0}`], []],
    ['minimizada', 'Janela minimizada', 'Uma janela minimizada fica só com o título.', [`gui:${g0}`, `gui:${r1?.guia ?? ''}`], [`min:gui:${g0}`]],
    ['maximizada', 'Janela maximizada', 'Duplo clique no cabeçalho enche o ecrã; outra vez, volta ao tamanho que tinha.', [`gui:${g0}`], [`max:gui:${g0}`]],
  ];
  return ESTADOS.map(([cen, nome, objetivo, ks, modo], i) => ({ id: `${prefixo}-${cen}` as IdErp, nome: `${num}.${20 + i} · ${nome}`, fluxo: base.fluxo, estadoDe: base.id, objetivo, versoes: [{ id: 'v2', nota, html: html + ini(ks, modo) }] as Ecra<IdErp>['versoes'] }));
}
export function comGuiasV2(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  const html = (e: Ecra<IdErp>) => e.versoes[0].html.replace('<div class="hm fx" data-hm data-fx', '<div class="hm fx fx--janelas" data-hm data-fx');
  return ecras.flatMap((e) => e.id === 'cm-compras-guias-entrada' && !e.estadoDe ? [{ ...e, versoes: [...e.versoes, { id: 'v2', nota: NOTA_GUIAS, html: html(e) }] as Ecra<IdErp>['versoes'] }, ...estadosV2(e, 'gui2', html(e), e.nome.split(' · ')[0], NOTA_GUIAS)] : [e]);
}
export type IdRececoesV2 = `rc2-${string}` | `gui2-${string}`;
export function comRececoesV2(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return ecras.flatMap((e) => e.id === 'compras-rececoes' && !e.estadoDe ? [{ ...e, versoes: [...e.versoes, { id: 'v2', nota: NOTA, html: e.versoes[0].html }] as Ecra<IdErp>['versoes'] }, ...estadosV2(e, 'rc2', e.versoes[0].html, e.nome.split(' · ')[0], NOTA)] : [e]);
}
