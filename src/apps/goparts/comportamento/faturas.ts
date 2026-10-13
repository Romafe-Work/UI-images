/* =========================================================
   GOPARTS — 14 · Faturas: filtros e painel (13 out. 2026)
   Como nas Guias v2: os separadores filtram já; «Pesquisar» espera 400 ms e aplica
   o n.º; «Limpar» repõe; o resumo (documentos, total, em aberto) conta até ao valor
   novo e as linhas que ficam entram em cascata. Clicar numa fatura abre o painel:
   o tipo e o pagamento (vencimento, estado; em aberto ou vencida, a referência
   Multibanco), a guia e o pedido, os valores por taxa de IVA (a contar) e os
   artigos; ↑ ↓ passam de fatura, Esc e o × fecham. No editor nada disto corre.
   ========================================================= */
import { FATURAS, base, iva, total, type Fatura } from '../portal/faturas-dados';
import { euros } from '../portal/guias-dados';
import { L, tipoPilula } from '../portal/guias-v2';
import { pagamentoPilula } from '../portal/faturas-v1';
import x from 'lucide-static/icons/x.svg?raw';
import chevronUp from 'lucide-static/icons/chevron-up.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import creditCard from 'lucide-static/icons/credit-card.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));

function contar(els: HTMLElement[], moeda = true): void {
  const fmt = (v: number) => (moeda ? euros(v) : String(Math.round(v)));
  if (quieto()) { els.forEach((el) => { el.textContent = fmt(Number(el.dataset.valor)); }); return; }
  const inicio = els.map((el) => Number(el.dataset.antes || 0));
  const t0 = performance.now() + 120;
  const passo = (t: number) => {
    const k = Math.max(0, Math.min(1, (t - t0) / 500)), e = 1 - Math.pow(1 - k, 3);
    els.forEach((el, i) => { el.textContent = fmt(inicio[i] + (Number(el.dataset.valor) - inicio[i]) * e); });
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
const mudar = (el: HTMLElement, v: number) => { el.dataset.antes = el.dataset.valor || '0'; el.dataset.valor = String(v); };

/* ---------- os filtros ---------- */
function aplicar(c: HTMLElement): void {
  const tipo = c.querySelector<HTMLElement>('.ped2__estado-aba[aria-current="true"]')?.dataset.filtro || 'todos';
  const n = (c.querySelector<HTMLInputElement>('#fat-num')?.value || '').trim().toLowerCase();
  let vistas = 0, soma = 0, aberto = 0, k = 0;
  $$(c, '.fat__linha').forEach((tr) => {
    const f = FATURAS.find((q) => q.num === tr.dataset.fatura)!;
    const ver = (tipo === 'todos' || f.guia.tipo === tipo) && (!n || f.num.toLowerCase().includes(n) || f.guia.num.toLowerCase().includes(n));
    tr.hidden = !ver;
    if (ver) { vistas++; soma += total(f.guia); if (f.pagamento === 'aberto' || f.pagamento === 'vencida') aberto += total(f.guia); tr.style.setProperty('--i', String(k++)); }
  });
  const tbody = c.querySelector<HTMLElement>('tbody')!;
  tbody.classList.remove('is-a-entrar'); void tbody.offsetWidth; tbody.classList.add('is-a-entrar');
  const conta = c.querySelector<HTMLElement>('.ped2__conta')!, tot = c.querySelector<HTMLElement>('.ped2__total')!, ab = c.querySelector<HTMLElement>('.fat__aberto-valor')!;
  conta.dataset.antes = conta.textContent || '0'; conta.dataset.valor = String(vistas);
  mudar(tot, soma); mudar(ab, aberto);
  contar([conta], false); contar([tot, ab]);
  c.querySelector<HTMLElement>('.ped2__vazio')!.hidden = vistas > 0;
  c.querySelector('.ped2__pe span')!.textContent = `A mostrar ${vistas} de ${FATURAS.length} · de 01/03/2024 até hoje`;
  const portal = c.closest<HTMLElement>('.portal')!;
  if (!portal.querySelector<HTMLElement>('.fat__painel')!.hidden && portal.querySelector('.fat__linha[aria-selected="true"][hidden]')) fechar(portal);
}

function pesquisar(c: HTMLElement): void {
  const b = c.querySelector<HTMLButtonElement>('.ped2__pesquisar')!;
  if (b.disabled) return;
  const antes = b.innerHTML;
  b.disabled = true; b.classList.add('is-a-carregar');
  b.innerHTML = '<span class="girador girador--claro" aria-hidden="true"></span><span class="btn__rotulo">A pesquisar…</span>';
  c.querySelector('tbody')?.classList.add('gui2__a-pesquisar');
  window.setTimeout(() => { b.disabled = false; b.classList.remove('is-a-carregar'); b.innerHTML = antes; c.querySelector('tbody')?.classList.remove('gui2__a-pesquisar'); aplicar(c); }, quieto() ? 0 : 400);
}

/* ---------- o painel ---------- */
function conteudo(f: Fatura, i: number, n: number): string {
  const g = f.guia, credito = g.tipo === 'credito';
  const valor = (rotulo: string, v: number, cls = '') => `<div class="${cls}"><dt>${rotulo}</dt><dd data-valor="${v}">${euros(v)}</dd></div>`;
  const pct = g.bruto ? Math.round((g.desconto / g.bruto) * 100) : 0;
  const ref = String(100000000 + Math.abs(Math.round(total(g) * 1000)) % 899999999).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  const pagamento = f.pagamento === 'paga' ? `<p class="fat__pag-texto">Paga a ${f.pagaEm}, por transferência.</p>`
    : f.pagamento === 'creditada' ? '<p class="fat__pag-texto">O valor é descontado na próxima fatura.</p>'
      : `<p class="fat__pag-texto">${f.pagamento === 'vencida' ? `Venceu a ${f.vencimento}.` : `Vence a ${f.vencimento}.`} Pode pagar por Multibanco:</p>
         <dl class="fat__mb"><div><dt>Entidade</dt><dd>21 312</dd></div><div><dt>Referência</dt><dd>${ref}<button type="button" class="cat5__copiar fat__copiar" aria-label="Copiar a referência">${L(copy)}</button></dd></div><div><dt>Valor</dt><dd>${euros(total(g))}</dd></div></dl>`;
  const linhas = g.linhas.map(([q, desc, v], k) => `<li class="ped3__artigo gui2__artigo" style="--i:${k}"><div class="ped3__a-cima"><span class="ped3__a-desc"><span class="gui2__qt">${Math.abs(q)} ×</span> ${desc}</span><span class="ped3__a-valor">${euros(v)}</span></div></li>`).join('');
  return `<header class="ped3__p-cabeca">
      <div><p class="ped3__p-rotulo">${credito ? 'Nota de crédito' : 'Fatura'} ${i + 1} de ${n}</p><h2 class="ped3__p-num" id="fat-p-num">${f.num}</h2><p class="ped3__p-meta">${g.data} · guia ${g.num}</p></div>
      <div class="ped3__p-nav">
        <button type="button" class="ped3__ir" data-ir-fatura="-1" aria-label="Anterior (↑)"${i === 0 ? ' disabled' : ''}>${L(chevronUp)}</button>
        <button type="button" class="ped3__ir" data-ir-fatura="1" aria-label="Seguinte (↓)"${i === n - 1 ? ' disabled' : ''}>${L(chevronDown)}</button>
        <button type="button" class="ped3__fechar" aria-label="Fechar (Esc)">${L(x)}</button>
      </div>
      <div class="ped3__p-estado">${tipoPilula(g)}${pagamentoPilula(f)}</div>
    </header>
    <div class="ped3__p-corpo">
      <section class="fat__pagamento fat__pagamento--${f.pagamento}" aria-label="Pagamento"><h3 class="ped3__h">${L(creditCard)}Pagamento</h3>${pagamento}</section>
      <dl class="ped3__totais gui2__valores">
        ${valor('Bruto', g.bruto)}${valor(`Desconto (${pct}%)`, -g.desconto)}${g.embalagens ? valor('Embalagens', g.embalagens) : ''}${g.portes ? valor('Portes', g.portes) : ''}
        ${valor('Base tributável (23%)', base(g), 'gui2__base')}${valor('IVA (23%)', iva(g))}${valor('Total', total(g), 'ped3__total')}
      </dl>
      <section aria-label="Documentos"><h3 class="ped3__h">Documentos</h3><ul class="gui2__docs">
        <li style="--i:0"><span class="gui2__doc-icone" aria-hidden="true">${L(truck)}</span><span><strong>Guia de remessa ${g.num}</strong><small>${g.armazem} · ${g.morada[1]}</small></span><button type="button" class="btn btn--ghost btn--sm" data-ir="guias">${L(truck, 'btn__icone')}<span class="btn__rotulo">Ver</span></button></li>
        <li style="--i:1"><span class="gui2__doc-icone" aria-hidden="true">${L(packageCheck)}</span><span><strong>Pedido ${g.pedido}</strong><small>${g.obs === '—' ? 'O pedido desta fatura' : g.obs}</small></span><button type="button" class="btn btn--ghost btn--sm" data-ir="pedidos">${L(packageCheck, 'btn__icone')}<span class="btn__rotulo">Ver</span></button></li>
      </ul></section>
      <section aria-label="Artigos"><h3 class="ped3__h">Artigos <span>${g.linhas.length}</span></h3><ul class="ped3__artigos">${linhas}</ul></section>
      <dl class="ped3__info"><div><dt>${L(mapPin)}Entrega</dt><dd>${g.morada.join(', ')}</dd></div></dl>
    </div>
    <footer class="ped3__p-pe"><button type="button" class="btn btn--acao">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar ${credito ? 'a nota de crédito' : 'a fatura'} (PDF)</span></button></footer>`;
}

export function preencher(portal: HTMLElement, tr: HTMLElement): HTMLElement | null {
  const linhas = $$(portal, '.fat__linha:not([hidden])');
  const f = FATURAS.find((q) => q.num === tr.dataset.fatura);
  const painel = portal.querySelector<HTMLElement>('.fat__painel');
  if (!f || !painel) return null;
  $$(portal, '.fat__linha').forEach((l) => l.removeAttribute('aria-selected'));
  $$(portal, '.fat__abrir').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  tr.setAttribute('aria-selected', 'true');
  tr.querySelector('.fat__abrir')?.setAttribute('aria-expanded', 'true');
  painel.innerHTML = conteudo(f, linhas.indexOf(tr), linhas.length);
  painel.hidden = false;
  return painel;
}

function abrir(portal: HTMLElement, tr: HTMLElement, dir = 0): void {
  const jaAberto = !portal.querySelector<HTMLElement>('.fat__painel')?.hidden;
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
  const painel = portal.querySelector<HTMLElement>('.fat__painel');
  if (!painel || painel.hidden) return;
  const tr = portal.querySelector<HTMLElement>('.fat__linha[aria-selected="true"]');
  const fim = () => {
    painel.hidden = true;
    $$(portal, '.fat__linha').forEach((l) => l.removeAttribute('aria-selected'));
    $$(portal, '.fat__abrir').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    tr?.querySelector<HTMLElement>('.fat__abrir')?.focus({ preventScroll: true });
  };
  if (quieto()) { fim(); return; }
  painel.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 200, easing: EASE }).onfinish = fim;
}

function vizinho(portal: HTMLElement, passo: number): void {
  const linhas = $$(portal, '.fat__linha:not([hidden])');
  const i = linhas.findIndex((l) => l.getAttribute('aria-selected') === 'true');
  const outra = linhas[i + passo];
  if (outra) { abrir(portal, outra, passo); outra.scrollIntoView({ block: 'nearest' }); }
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const portal = t.closest<HTMLElement>('.portal--fat');
    const c = portal?.querySelector<HTMLElement>('[data-faturas]');
    if (!portal || !c) return;
    if (t.closest('.ped3__fechar')) { fechar(portal); return; }
    const cp = t.closest<HTMLElement>('.fat__copiar');
    if (cp) { navigator.clipboard?.writeText((cp.parentElement?.textContent || '').replace(/\s/g, '')).catch(() => undefined); cp.classList.add('is-feito'); window.setTimeout(() => cp.classList.remove('is-feito'), 1200); return; }
    const ir = t.closest<HTMLElement>('[data-ir-fatura]');
    if (ir) { vizinho(portal, Number(ir.dataset.irFatura)); return; }
    const aba = t.closest<HTMLElement>('.ped2__estado-aba');
    if (aba) { $$(c, '.ped2__estado-aba').forEach((a) => a.removeAttribute('aria-current')); aba.setAttribute('aria-current', 'true'); aplicar(c); return; }
    if (t.closest('.ped2__pesquisar')) { pesquisar(c); return; }
    if (t.closest('.ped2__limpar, .fat__limpar-ligacao')) {
      $$<HTMLInputElement>(c, '.ped2__campos input').forEach((i) => { i.value = i.id === 'fat-de' ? '01/03/2024' : ''; });
      $$(c, '.ped2__estado-aba').forEach((a) => { if (a.dataset.filtro === 'todos') a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      aplicar(c); return;
    }
    const tr = t.closest<HTMLElement>('.fat__linha');
    if (tr) abrir(portal, tr);
  });
  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    if (ev.key === 'Enter' && t.closest?.('.portal--fat .ped2__campos input')) { pesquisar(t.closest<HTMLElement>('[data-faturas]')!); return; }
    const portal = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--fat');
    const painel = portal?.querySelector<HTMLElement>('.fat__painel');
    if (!portal || !painel || painel.hidden) return;
    if (ev.key === 'Escape') { ev.preventDefault(); fechar(portal); }
    else if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !t.closest('input, select, textarea')) { ev.preventDefault(); vizinho(portal, ev.key === 'ArrowDown' ? 1 : -1); }
  });
}
