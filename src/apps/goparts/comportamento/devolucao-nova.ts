/* =========================================================
   PEÇA A PEÇA — Devoluções v2: a «Nova devolução» em quatro passos (26 nov. 2026)
   1. a guia (só as que têm artigos elegíveis) · 2. os artigos e as quantidades (nunca mais do que o elegível) ·
   3. o motivo (escrito: não há motivos configurados) · 4. o resumo e «Submeter devolução».
   Submeter guarda-a no navegador (num servidor, seria a API) com o número seguinte e o estado «Enviada» (foi
   submetida — não aceite), e abre o painel dela. Fechar a meio pergunta antes de descartar (confirmar.ts).
   ========================================================= */
import { elegiveis, todasDevolucoes, CHAVE_DEV_NOVAS } from '../portal/devolucoes-v2';
import { GUIAS } from '../portal/guias-dados';
import type { Devolucao } from '../portal/devolucoes-dados';
import { confirmar } from './confirmar';

type Estado = { passo: number; guia: string; linhas: [number, string][]; motivo: string };
const est = new WeakMap<HTMLDialogElement, Estado>();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const hoje = () => new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

function ir(d: HTMLDialogElement, passo: number): void {
  const e = est.get(d)!; e.passo = passo;
  d.querySelectorAll<HTMLElement>('[data-dvn-passo]').forEach((p) => { p.hidden = Number(p.dataset.dvnPasso) !== passo; });
  d.querySelectorAll<HTMLElement>('[data-dvn-p]').forEach((p) => { const i = Number(p.dataset.dvnP); p.toggleAttribute('aria-current', i === passo); if (i === passo) p.setAttribute('aria-current', 'step'); p.classList.toggle('is-feito', i < passo); });
  d.querySelector<HTMLElement>('[data-dvn-voltar]')!.hidden = passo === 0;
  d.querySelector('[data-dvn-seguir] .btn__rotulo')!.textContent = passo === 3 ? 'Submeter devolução' : 'Seguinte';
  erro(d, '');
  const alvo = d.querySelector<HTMLElement>(`[data-dvn-passo="${passo}"] input, [data-dvn-passo="${passo}"] textarea`) ?? d.querySelector<HTMLElement>('[data-dvn-seguir]');
  alvo?.focus();
}
const erro = (d: HTMLDialogElement, t: string) => { d.querySelector('[data-dvn-erro]')!.textContent = t; };

function artigos(d: HTMLDialogElement, guia: string): void {
  const g = GUIAS.find((x) => x.num === guia)!;
  d.querySelector('[data-dvn-artigos]')!.innerHTML = `<p class="hx__semdados">Guia ${esc(guia)} · pedido ${esc(g.pedido)}. Marque os artigos e diga quantas unidades devolve.</p>
    <ul class="dvn__arts">${elegiveis(guia).map((a, i) => `<li><label class="dvn__art"><input type="checkbox" data-dvn-art="${i}" value="${esc(a.desc)}"><span>${esc(a.desc)}<small>até ${a.max} ${a.max === 1 ? 'unidade' : 'unidades'}</small></span></label>
      <label class="dvn__qtd"><span class="sr-only">Unidades de ${esc(a.desc)}</span><input type="number" inputmode="numeric" min="1" max="${a.max}" step="1" value="1" data-dvn-qtd="${i}" disabled></label></li>`).join('')}</ul>`;
}
function resumo(d: HTMLDialogElement): void {
  const e = est.get(d)!, g = GUIAS.find((x) => x.num === e.guia)!;
  d.querySelector('[data-dvn-resumo]')!.innerHTML = `<dl class="hx__pares"><div><dt>Guia</dt><dd>${esc(e.guia)}</dd></div><div><dt>Pedido</dt><dd>${esc(g.pedido)}</dd></div><div><dt>Motivo</dt><dd>${esc(e.motivo)}</dd></div></dl>
    <table class="hx__artigos"><thead><tr><th scope="col">Artigo</th><th scope="col" class="hx__num">Qtd.</th></tr></thead><tbody>${e.linhas.map(([q, a]) => `<tr><td>${esc(a)}</td><td class="hx__num">${q}</td></tr>`).join('')}</tbody></table>`;
}

async function seguir(d: HTMLDialogElement): Promise<void> {
  const e = est.get(d)!;
  if (e.passo === 0) {
    const r = d.querySelector<HTMLInputElement>('input[name="dvn-guia"]:checked');
    if (!r) { erro(d, 'Escolha a guia de onde vêm os artigos.'); return; }
    if (r.value !== e.guia) { e.guia = r.value; e.linhas = []; artigos(d, r.value); }
    ir(d, 1); return;
  }
  if (e.passo === 1) {
    const lim = elegiveis(e.guia), linhas: [number, string][] = [];
    for (const c of Array.from(d.querySelectorAll<HTMLInputElement>('[data-dvn-art]:checked'))) {
      const i = Number(c.dataset.dvnArt), q = d.querySelector<HTMLInputElement>(`[data-dvn-qtd="${i}"]`)!, n = Number(q.value);
      if (!Number.isInteger(n) || n < 1 || n > lim[i].max) { erro(d, `${lim[i].desc}: escolha de 1 a ${lim[i].max} ${lim[i].max === 1 ? 'unidade' : 'unidades'}.`); q.setAttribute('aria-invalid', 'true'); q.focus(); return; }
      q.removeAttribute('aria-invalid'); linhas.push([n, lim[i].desc]);
    }
    if (!linhas.length) { erro(d, 'Marque pelo menos um artigo para devolver.'); return; }
    e.linhas = linhas; ir(d, 2); return;
  }
  if (e.passo === 2) {
    const m = d.querySelector<HTMLTextAreaElement>('[data-dvn-motivo]')!; e.motivo = m.value.trim();
    if (e.motivo.length < 3) { erro(d, 'Escreva o motivo da devolução.'); m.setAttribute('aria-invalid', 'true'); m.focus(); return; }
    m.removeAttribute('aria-invalid'); resumo(d); ir(d, 3); return;
  }
  /* submeter */
  const b = d.querySelector<HTMLButtonElement>('[data-dvn-seguir]')!; b.disabled = true; b.querySelector('.btn__rotulo')!.textContent = 'A submeter…';
  await new Promise((r) => window.setTimeout(r, 700));
  const todas = todasDevolucoes(), n = Math.max(...todas.map((x) => Number(x.num.split('/')[1]))) + 1, ano = new Date().getFullYear();
  const nova: Devolucao = { num: `DV${ano}/${String(n).padStart(5, '0')}`, criada: hoje(), enviada: hoje(), utilizador: 'Fernando F. França', obs: e.motivo, origem: e.guia, linhas: e.linhas };
  try {
    const guardadas = JSON.parse(localStorage.getItem(CHAVE_DEV_NOVAS) || '[]') as Devolucao[];
    localStorage.setItem(CHAVE_DEV_NOVAS, JSON.stringify([nova, ...guardadas]));
    sessionStorage.setItem('goparts:abrir-devolucao', nova.num);
  } catch { erro(d, 'Não foi possível guardar a devolução neste navegador. Tente outra vez.'); b.disabled = false; b.querySelector('.btn__rotulo')!.textContent = 'Submeter devolução'; return; }
  /* a lista é desenhada com as devoluções da conta: volta a desenhar-se, já com a nova aberta */
  location.reload();
}

const sujo = (d: HTMLDialogElement) => { const e = est.get(d); return !!e && (e.passo > 0 || !!d.querySelector('input[name="dvn-guia"]:checked')); };
async function fechar(d: HTMLDialogElement): Promise<void> {
  if (sujo(d) && !(await confirmar({ titulo: 'Descartar a nova devolução?', texto: 'O que escolheu e escreveu até aqui perde-se. A devolução não é enviada.', sim: 'Descartar' }))) return;
  d.close(); document.querySelector<HTMLElement>('[data-dvn-abrir]')?.focus();
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    if (t.closest('[data-dvn-abrir]')) {
      const d = t.closest('.portal')!.querySelector<HTMLDialogElement>('[data-dvn]')!;
      d.querySelector<HTMLFormElement>('[data-dvn-form]')!.reset();
      est.set(d, { passo: 0, guia: '', linhas: [], motivo: '' });
      d.querySelector('[data-dvn-artigos]')!.innerHTML = ''; d.querySelector<HTMLButtonElement>('[data-dvn-seguir]')!.disabled = false;
      d.showModal(); ir(d, 0); return;
    }
    const d = t.closest<HTMLDialogElement>('dialog[data-dvn]'); if (!d) return;
    if (t === d || t.closest('[data-dvn-fechar]')) { void fechar(d); return; }
    if (t.closest('[data-dvn-voltar]')) { ir(d, Math.max(0, est.get(d)!.passo - 1)); return; }
  });
  document.addEventListener('change', (ev) => {
    const c = (ev.target as HTMLElement).closest?.<HTMLInputElement>('[data-dvn-art]'); if (!c) return;
    const q = c.closest('li')!.querySelector<HTMLInputElement>('[data-dvn-qtd]')!; q.disabled = !c.checked; if (c.checked) q.focus();
  });
  document.addEventListener('submit', (ev) => { const f = (ev.target as HTMLElement).closest?.('[data-dvn-form]'); if (!f) return; ev.preventDefault(); void seguir(f.closest('dialog')!); });
  document.addEventListener('cancel', (ev) => { const d = ev.target as HTMLElement; if (d.matches?.('dialog[data-dvn]')) { ev.preventDefault(); void fechar(d as HTMLDialogElement); } }, true);
}
