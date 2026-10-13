/* =========================================================
   GOPARTS — 13 · Guias de remessa v2: filtros e painel (13 out. 2026)
   Os separadores (Todas · Faturas · Notas de crédito) filtram já; «Pesquisar»
   espera 400 ms (como se fosse ao servidor) e aplica o n.º e a referência;
   «Limpar» repõe tudo. A contagem e o total do resumo contam até ao valor novo
   e as linhas que ficam entram em cascata.
   Clicar numa guia abre o painel à direita, como nos Pedidos v3: o tipo, os
   documentos (fatura ou nota de crédito, o pedido), os artigos, os valores (a
   contar) e a morada; ↑ ↓ passam de guia, Esc e o × fecham.
   No editor nada disto corre (o estado 13.7 mostra o painel aberto).
   ========================================================= */
import { GUIAS, base, iva, total, euros, type Guia } from '../portal/guias-dados';
import { L, tipoPilula } from '../portal/guias-v2';
import x from 'lucide-static/icons/x.svg?raw';
import chevronUp from 'lucide-static/icons/chevron-up.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import messageSquare from 'lucide-static/icons/message-square.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));

/** Conta os elementos com data-valor de 0 até ao valor (ou do valor antigo ao novo), em 500 ms. */
function contar(els: HTMLElement[], moeda = true): void {
  if (quieto()) { els.forEach((el) => { const v = Number(el.dataset.valor); el.textContent = moeda ? euros(v) : String(v); }); return; }
  const inicio = els.map((el) => Number(el.dataset.antes || 0));
  const t0 = performance.now() + 120;
  const passo = (t: number) => {
    const k = Math.max(0, Math.min(1, (t - t0) / 500)), e = 1 - Math.pow(1 - k, 3);
    els.forEach((el, i) => { const v = inicio[i] + (Number(el.dataset.valor) - inicio[i]) * e; el.textContent = moeda ? euros(v) : String(Math.round(v)); });
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* ---------- os filtros ---------- */
function aplicar(c: HTMLElement): void {
  const tipo = c.querySelector<HTMLElement>('.ped2__estado-aba[aria-current="true"]')?.dataset.filtro || 'todos';
  const n = (c.querySelector<HTMLInputElement>('#gui2-num')?.value || '').trim().toLowerCase();
  const ref = (c.querySelector<HTMLInputElement>('#gui2-ref')?.value || '').trim().toLowerCase();
  let vistas = 0, soma = 0, k = 0;
  $$(c, '.gui2__linha').forEach((tr) => {
    const g = GUIAS.find((q) => q.num === tr.dataset.guia)!;
    const ver = (tipo === 'todos' || g.tipo === tipo) && (!n || g.num.toLowerCase().includes(n) || g.doc.toLowerCase().includes(n))
      && (!ref || g.linhas.some((l) => l[1].toLowerCase().includes(ref)));
    tr.hidden = !ver;
    if (ver) { vistas++; soma += total(g); tr.style.setProperty('--i', String(k++)); }
  });
  /* as linhas que ficam entram de novo em cascata */
  const tbody = c.querySelector<HTMLElement>('tbody')!;
  tbody.classList.remove('is-a-entrar'); void tbody.offsetWidth; tbody.classList.add('is-a-entrar');
  const conta = c.querySelector<HTMLElement>('.ped2__conta')!, tot = c.querySelector<HTMLElement>('.ped2__total')!;
  conta.dataset.antes = conta.textContent || '0'; conta.dataset.valor = String(vistas);
  tot.dataset.antes = tot.dataset.valor || '0'; tot.dataset.valor = String(soma);
  contar([conta], false); contar([tot]);
  c.querySelector<HTMLElement>('.ped2__vazio')!.hidden = vistas > 0;
  c.querySelector('.ped2__pe span')!.textContent = `A mostrar ${vistas} de ${GUIAS.length} · de 01/03/2024 até hoje`;
  const portal = c.closest<HTMLElement>('.portal')!;
  if (!portal.querySelector<HTMLElement>('.gui2__painel')!.hidden && portal.querySelector('.gui2__linha[aria-selected="true"][hidden]')) fechar(portal);
}

function pesquisar(c: HTMLElement): void {
  const b = c.querySelector<HTMLButtonElement>('.ped2__pesquisar')!;
  if (b.disabled) return;
  const antes = b.innerHTML;
  b.disabled = true; b.classList.add('is-a-carregar');
  b.innerHTML = '<span class="girador girador--claro" aria-hidden="true"></span><span class="btn__rotulo">A pesquisar…</span>';
  c.querySelector('tbody')?.classList.add('gui2__a-pesquisar');
  window.setTimeout(() => {
    b.disabled = false; b.classList.remove('is-a-carregar'); b.innerHTML = antes;
    c.querySelector('tbody')?.classList.remove('gui2__a-pesquisar');
    aplicar(c);
  }, quieto() ? 0 : 400);
}

/* ---------- o painel da guia ---------- */
function conteudo(g: Guia, i: number, n: number): string {
  const credito = g.tipo === 'credito';
  const linhas = g.linhas.map(([q, desc, v], k) => `<li class="ped3__artigo gui2__artigo" style="--i:${k}"><div class="ped3__a-cima"><span class="ped3__a-desc"><span class="gui2__qt">${Math.abs(q)} ×</span> ${desc}</span><span class="ped3__a-valor">${euros(v)}</span></div></li>`).join('');
  const valor = (rotulo: string, v: number, cls = '') => `<div class="${cls}"><dt>${rotulo}</dt><dd data-valor="${v}">${euros(v)}</dd></div>`;
  const pct = g.bruto ? Math.round((g.desconto / g.bruto) * 100) : 0;
  return `<header class="ped3__p-cabeca">
      <div><p class="ped3__p-rotulo">Guia ${i + 1} de ${n}</p><h2 class="ped3__p-num" id="gui2-p-num">${g.num}</h2><p class="ped3__p-meta">${g.data} · <span class="ped3__arm">${L(warehouse)}${g.armazem}</span> · pedido ${g.pedido}</p></div>
      <div class="ped3__p-nav">
        <button type="button" class="ped3__ir" data-ir-guia="-1" aria-label="Guia anterior (↑)"${i === 0 ? ' disabled' : ''}>${L(chevronUp)}</button>
        <button type="button" class="ped3__ir" data-ir-guia="1" aria-label="Guia seguinte (↓)"${i === n - 1 ? ' disabled' : ''}>${L(chevronDown)}</button>
        <button type="button" class="ped3__fechar" aria-label="Fechar (Esc)">${L(x)}</button>
      </div>
      <div class="ped3__p-estado">${tipoPilula(g)}${credito ? '<span class="ped3__aviso gui2__aviso">Devolução: o valor é descontado na próxima fatura</span>' : ''}</div>
    </header>
    <div class="ped3__p-corpo">
      <section aria-label="Documentos"><h3 class="ped3__h">Documentos</h3><ul class="gui2__docs">
        <li style="--i:0"><span class="gui2__doc-icone" aria-hidden="true">${L(credito ? fileText : receipt)}</span><span><strong>${credito ? 'Nota de crédito' : 'Fatura'} ${g.doc}</strong><small>Emitida a ${g.data}</small></span><button type="button" class="btn btn--ghost btn--sm">${L(download, 'btn__icone')}<span class="btn__rotulo">PDF</span></button></li>
        <li style="--i:1"><span class="gui2__doc-icone" aria-hidden="true">${L(packageCheck)}</span><span><strong>Pedido ${g.pedido}</strong><small>${credito ? 'O pedido da peça devolvida' : 'O pedido desta guia'}</small></span><button type="button" class="btn btn--ghost btn--sm" data-ir="pedidos">${L(fileText, 'btn__icone')}<span class="btn__rotulo">Ver</span></button></li>
      </ul></section>
      <section aria-label="Artigos"><h3 class="ped3__h">Artigos <span>${g.linhas.length}</span></h3><ul class="ped3__artigos">${linhas}</ul></section>
      <dl class="ped3__totais gui2__valores">
        ${valor('Bruto', g.bruto)}${valor(`Desconto (${pct}%)`, -g.desconto)}${g.embalagens ? valor('Embalagens', g.embalagens) : ''}${g.portes ? valor('Portes', g.portes) : ''}
        ${valor('Base tributável', base(g), 'gui2__base')}${valor('IVA (23%)', iva(g))}${valor('Total', total(g), 'ped3__total')}
      </dl>
      <dl class="ped3__info">
        <div><dt>${L(mapPin)}Entrega</dt><dd>${g.morada.join(', ')}</dd></div>
        <div><dt>${L(messageSquare)}Observações</dt><dd>${g.obs}</dd></div>
      </dl>
    </div>
    <footer class="ped3__p-pe">
      <button type="button" class="btn btn--acao">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar a guia (PDF)</span></button>
    </footer>`;
}

/** Enche o painel sem animar (também para o estado parado 13.7). */
export function preencher(portal: HTMLElement, tr: HTMLElement): HTMLElement | null {
  const linhas = $$(portal, '.gui2__linha:not([hidden])');
  const g = GUIAS.find((q) => q.num === tr.dataset.guia);
  const painel = portal.querySelector<HTMLElement>('.gui2__painel');
  if (!g || !painel) return null;
  $$(portal, '.gui2__linha').forEach((l) => l.removeAttribute('aria-selected'));
  $$(portal, '.gui2__abrir').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  tr.setAttribute('aria-selected', 'true');
  tr.querySelector('.gui2__abrir')?.setAttribute('aria-expanded', 'true');
  painel.innerHTML = conteudo(g, linhas.indexOf(tr), linhas.length);
  painel.hidden = false;
  return painel;
}

function abrir(portal: HTMLElement, tr: HTMLElement, dir = 0): void {
  const jaAberto = !portal.querySelector<HTMLElement>('.gui2__painel')?.hidden;
  const painel = preencher(portal, tr);
  if (!painel) return;
  if (!quieto()) {
    const dy = dir ? dir * 16 : 6;
    if (jaAberto) $$(painel, '.ped3__p-cabeca, .ped3__p-corpo').forEach((c) => c.animate([{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE }));
    else painel.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 280, easing: EASE });
  }
  contar($$(painel, '.gui2__valores dd[data-valor]'));
  painel.querySelector<HTMLElement>('.ped3__p-num')?.setAttribute('tabindex', '-1');
  painel.querySelector<HTMLElement>('.ped3__p-num')?.focus({ preventScroll: true });
}

function fechar(portal: HTMLElement): void {
  const painel = portal.querySelector<HTMLElement>('.gui2__painel');
  if (!painel || painel.hidden) return;
  const tr = portal.querySelector<HTMLElement>('.gui2__linha[aria-selected="true"]');
  const fim = () => {
    painel.hidden = true;
    $$(portal, '.gui2__linha').forEach((l) => l.removeAttribute('aria-selected'));
    $$(portal, '.gui2__abrir').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    tr?.querySelector<HTMLElement>('.gui2__abrir')?.focus({ preventScroll: true });
  };
  if (quieto()) { fim(); return; }
  painel.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 200, easing: EASE }).onfinish = fim;
}

function vizinho(portal: HTMLElement, passo: number): void {
  const linhas = $$(portal, '.gui2__linha:not([hidden])');
  const i = linhas.findIndex((l) => l.getAttribute('aria-selected') === 'true');
  const outra = linhas[i + passo];
  if (outra) { abrir(portal, outra, passo); outra.scrollIntoView({ block: 'nearest' }); }
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const portal = t.closest<HTMLElement>('.portal--gui2');
    if (!portal) return;
    const c = portal.querySelector<HTMLElement>('[data-guias]');
    if (!c) return;
    if (t.closest('.ped3__fechar')) { fechar(portal); return; }
    const ir = t.closest<HTMLElement>('[data-ir-guia]');
    if (ir) { vizinho(portal, Number(ir.dataset.irGuia)); return; }
    const aba = t.closest<HTMLElement>('.ped2__estado-aba');
    if (aba) { $$(c, '.ped2__estado-aba').forEach((a) => a.removeAttribute('aria-current')); aba.setAttribute('aria-current', 'true'); aplicar(c); return; }
    if (t.closest('.ped2__pesquisar')) { pesquisar(c); return; }
    if (t.closest('.ped2__limpar, .gui2__limpar-ligacao')) {
      $$<HTMLInputElement>(c, '.ped2__campos input').forEach((i) => { i.value = i.id === 'gui2-de' ? '01/03/2024' : ''; });
      $$(c, '.ped2__estado-aba').forEach((a) => { if (a.dataset.filtro === 'todos') a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      aplicar(c); return;
    }
    const tr = t.closest<HTMLElement>('.gui2__linha');
    if (tr) abrir(portal, tr);
  });
  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    /* Enter nos campos pesquisa */
    if (ev.key === 'Enter' && t.closest?.('.portal--gui2 .ped2__campos input')) { pesquisar(t.closest<HTMLElement>('[data-guias]')!); return; }
    const portal = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--gui2');
    const painel = portal?.querySelector<HTMLElement>('.gui2__painel');
    if (!portal || !painel || painel.hidden) return;
    if (ev.key === 'Escape') { ev.preventDefault(); fechar(portal); }
    else if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !t.closest('input, select, textarea')) { ev.preventDefault(); vizinho(portal, ev.key === 'ArrowDown' ? 1 : -1); }
  });
}
