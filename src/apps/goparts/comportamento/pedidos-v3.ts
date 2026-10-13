/* =========================================================
   GOPARTS — 12 · Pedidos v3: o painel do pedido (13 out. 2026)
   Clicar num pedido (a linha ou o número) abre um painel à direita; a lista
   fica à vista e a linha aberta marcada. ↑ / ↓ passam ao pedido anterior ou
   seguinte, Esc e o × fecham. O painel entra da direita (280 ms, curva de
   saída forte) e sai pelo mesmo caminho; trocar de pedido com ele aberto só
   troca o conteúdo, a desvanecer. As barras de servida enchem com scaleX.
   No editor nada disto corre; com «reduzir movimento», só aparece.
   ========================================================= */
import { PEDIDOS, euros, type Pedido } from '../portal/pedidos-dados';
import x from 'lucide-static/icons/x.svg?raw';
import chevronUp from 'lucide-static/icons/chevron-up.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import messageSquare from 'lucide-static/icons/message-square.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/* o texto de uma célula; as partes em <span> (rua, código postal) separam-se por vírgula */
const texto = (tr: HTMLElement, i: number) => {
  const td = tr.children[i];
  const partes = td ? Array.from(td.querySelectorAll('span')).map((s) => (s.textContent || '').trim()).filter(Boolean) : [];
  return (partes.length > 1 ? partes.join(', ') : td?.textContent || '').replace(/\s+/g, ' ').trim();
};

function conteudo(tr: HTMLElement, p: Pedido, i: number, n: number): string {
  const proc = tr.dataset.estado === 'proc';
  const total = p.artigos.reduce((s, a) => s + a[3], 0);
  const pendentes = p.artigos.filter((a) => a[1] < a[0]).length;
  const atual = p.percurso.findIndex((s) => !s[1]);
  const passos = p.percurso.map(([nome, quando, nota], k) => {
    const estado = quando ? 'feito' : k === atual ? 'atual' : 'por-fazer';
    return `<li class="ped3__passo ped3__passo--${estado}" style="--i:${k}"><span class="ped3__ponto" aria-hidden="true">${quando ? L(check) : ''}</span><div><strong>${nome}</strong>${quando ? `<span>${quando}</span>` : k === atual ? '<span>em curso</span>' : ''}${nota ? `<small>${esc(nota)}</small>` : ''}</div></li>`;
  }).join('');
  const artigos = p.artigos.map(([ped, serv, desc, valor], k) => `<li class="ped3__artigo" style="--i:${k}">
      <div class="ped3__a-cima"><span class="ped3__a-desc">${esc(desc)}</span><span class="ped3__a-valor">${euros(valor)}</span></div>
      <div class="ped3__a-qt"><span>Pedida <strong>${ped}</strong></span><span>Servida <strong>${serv}</strong></span><span class="${serv < ped ? 'ped3__falta' : ''}">Pendente <strong>${ped - serv}</strong></span></div>
      <span class="ped3__barra" aria-hidden="true"><span style="--f:${(serv / ped).toFixed(3)}"></span></span>
    </li>`).join('');
  const estado = proc ? `<span class="ped2__estado ped2__estado--ok">${L(check)}Processado</span>` : '<span class="ped2__estado ped2__estado--aviso">Sem proc.</span>';
  return `<header class="ped3__p-cabeca">
      <div><p class="ped3__p-rotulo">Pedido ${i + 1} de ${n}</p><h2 class="ped3__p-num" id="ped3-p-num">${p.num}</h2><p class="ped3__p-meta">${texto(tr, 1)} · <span class="ped3__arm">${L(warehouse)}${texto(tr, 2)}</span> · ${p.artigos.length} artigos</p></div>
      <div class="ped3__p-nav">
        <button type="button" class="ped3__ir" data-ir-pedido="-1" aria-label="Pedido anterior (↑)"${i === 0 ? ' disabled' : ''}>${L(chevronUp)}</button>
        <button type="button" class="ped3__ir" data-ir-pedido="1" aria-label="Pedido seguinte (↓)"${i === n - 1 ? ' disabled' : ''}>${L(chevronDown)}</button>
        <button type="button" class="ped3__fechar" aria-label="Fechar (Esc)">${L(x)}</button>
      </div>
      <div class="ped3__p-estado">${estado}${pendentes ? `<span class="ped3__aviso">${pendentes} ${pendentes === 1 ? 'artigo pendente' : 'artigos pendentes'}</span>` : ''}</div>
    </header>
    <div class="ped3__p-corpo">
      <section aria-label="Percurso do pedido"><h3 class="ped3__h">Percurso</h3><ol class="ped3__percurso">${passos}</ol></section>
      <section aria-label="Artigos"><h3 class="ped3__h">Artigos <span>${p.artigos.length}</span></h3><ul class="ped3__artigos">${artigos}</ul></section>
      <dl class="ped3__totais"><div><dt>Total sem IVA</dt><dd>${euros(total)}</dd></div><div><dt>IVA (23%)</dt><dd>${euros(total * .23)}</dd></div><div class="ped3__total"><dt>Total</dt><dd>${euros(total * 1.23)}</dd></div></dl>
      <dl class="ped3__info">
        <div><dt>${L(mapPin)}Entrega</dt><dd>${esc(texto(tr, 3))}</dd></div>
        <div><dt>${L(messageSquare)}Observações</dt><dd>${esc(texto(tr, 5) || '—')}</dd></div>
      </dl>
    </div>
    <footer class="ped3__p-pe">
      <button type="button" class="btn btn--acao">${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Repetir pedido</span></button>
      <button type="button" class="btn btn--ghost"${p.guia ? ` title="${p.guia}"` : ' disabled title="Ainda sem guia de remessa"'}>${L(truck, 'btn__icone')}<span class="btn__rotulo">Guia</span></button>
      <button type="button" class="btn btn--ghost"${p.fatura ? ` title="${p.fatura}"` : ' disabled title="Ainda sem fatura"'}>${L(fileText, 'btn__icone')}<span class="btn__rotulo">Fatura</span></button>
    </footer>`;
}

/** Abre (ou troca) o painel para a linha do pedido. */
function abrir(portal: HTMLElement, tr: HTMLElement): void {
  const linhas = Array.from(portal.querySelectorAll<HTMLElement>('.ped2__linha:not([hidden])'));
  const i = linhas.indexOf(tr);
  const num = (tr.querySelector('.ped2__num')?.textContent || '').trim();
  const p = PEDIDOS.find((q) => q.num === num);
  const painel = portal.querySelector<HTMLElement>('.ped3__painel');
  if (!p || !painel) return;
  const jaAberto = !painel.hidden;
  portal.querySelectorAll('.ped2__linha').forEach((l) => l.removeAttribute('aria-selected'));
  portal.querySelectorAll('.ped2__abrir').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  tr.setAttribute('aria-selected', 'true');
  tr.querySelector('.ped2__abrir')?.setAttribute('aria-expanded', 'true');
  painel.innerHTML = conteudo(tr, p, i, linhas.length);
  painel.hidden = false;
  if (!quieto()) {
    if (jaAberto) painel.querySelectorAll<HTMLElement>('.ped3__p-cabeca, .ped3__p-corpo').forEach((c) => c.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE }));
    else painel.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 280, easing: EASE });
  }
  painel.querySelector<HTMLElement>('.ped3__p-num')?.setAttribute('tabindex', '-1');
  painel.querySelector<HTMLElement>('.ped3__p-num')?.focus({ preventScroll: true });
}

function fechar(portal: HTMLElement): void {
  const painel = portal.querySelector<HTMLElement>('.ped3__painel');
  if (!painel || painel.hidden) return;
  const tr = portal.querySelector<HTMLElement>('.ped2__linha[aria-selected="true"]');
  const fim = () => {
    painel.hidden = true;
    portal.querySelectorAll('.ped2__linha').forEach((l) => l.removeAttribute('aria-selected'));
    portal.querySelectorAll('.ped2__abrir').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    tr?.querySelector<HTMLElement>('.ped2__abrir')?.focus({ preventScroll: true });
  };
  if (quieto()) { fim(); return; }
  /* sai pelo mesmo caminho por onde entrou, mais depressa */
  painel.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 200, easing: EASE }).onfinish = fim;
}

function vizinho(portal: HTMLElement, passo: number): void {
  const linhas = Array.from(portal.querySelectorAll<HTMLElement>('.ped2__linha:not([hidden])'));
  const i = linhas.findIndex((l) => l.getAttribute('aria-selected') === 'true');
  const outra = linhas[i + passo];
  if (outra) { abrir(portal, outra); outra.scrollIntoView({ block: 'nearest' }); }
}

export function iniciar(): void {
  /* em captura, antes do acordeão da v2 (pedidos.ts): na v3 a linha abre o painel */
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const portal = t.closest<HTMLElement>('.portal--ped3');
    if (!portal) return;
    if (t.closest('.ped3__fechar')) { fechar(portal); return; }
    const ir = t.closest<HTMLElement>('[data-ir-pedido]');
    if (ir) { vizinho(portal, Number(ir.dataset.irPedido)); return; }
    const tr = t.closest<HTMLElement>('.ped2__linha');
    if (tr) { ev.stopPropagation(); abrir(portal, tr); }
  }, true);
  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const portal = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--ped3');
    const painel = portal?.querySelector<HTMLElement>('.ped3__painel');
    if (!portal || !painel || painel.hidden) return;
    if (ev.key === 'Escape') { ev.preventDefault(); fechar(portal); }
    else if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !(ev.target as Element).closest('input, select, textarea')) { ev.preventDefault(); vizinho(portal, ev.key === 'ArrowDown' ? 1 : -1); }
  });
}
