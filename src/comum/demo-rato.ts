/* =========================================================
   ROMAFE — a demonstração com o rato (27 out. 2026)
   Ela: «quero que na demonstração apareça um rato a clicar nos botões para o meu chefe ver e perceber o flow». Um
   roteiro (passos registados pela app) leva um rato desenhado até ao botão de cada passo, mostra o clique e clica a
   sério — a navegação é a do protótipo (data-ir), por isso o que se vê é o que a pessoa faria. Uma legenda curta diz
   o que se está a fazer e em que passo se vai.
   Abre-se com «Ver o fluxo com o rato» na barra da demonstração, ou com &rato=1 no endereço (para mandar a quem não
   vai mexer). Esc ou «Parar» acabam. Com «reduzir movimento», o rato salta em vez de deslizar.
   O rato e a legenda são popovers (camada de cima do navegador): ficam por cima também dos diálogos (o «Ver como»).
   ========================================================= */
import { mostrar, mostrarVersao } from './ecras';

export interface Passo {
  /** o ecrã onde o passo começa (se não for o que se vê, o roteiro vai lá) */
  ecra?: string;
  /** o que se clica: um seletor dentro do ecrã que se vê (ou do diálogo aberto) */
  clicar?: string;
  /** escolher um valor num select em vez de clicar */
  escolher?: [string, string];
  /** 28 out. (ERP): o alvo está no separador ativo da área de trabalho (um iframe da mesma origem), e não na página de cima */
  separador?: boolean;
  /** a legenda do passo */
  legenda: string;
  /** espera a mais, depois do passo (ms) */
  pausa?: number;
}
const ROTEIROS = new Map<string, { titulo: string; passos: Passo[]; semTexto?: boolean }>();
/** 28 out.: `semTexto` — só o rato e os cliques, sem a legenda (ela: «no erp com rato mas sem texto»). */
export function registarRoteiro(id: string, titulo: string, passos: Passo[], o: { semTexto?: boolean } = {}): void { ROTEIROS.set(id, { titulo, passos, ...o }); }
/** Os roteiros registados, pela ordem do registo: [id, título]. */
export const roteiros = (): [string, string][] => [...ROTEIROS].map(([id, r]) => [id, r.titulo]);
export const temRoteiro = () => ROTEIROS.size > 0;

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dormir = (ms: number) => new Promise<void>((ok) => window.setTimeout(ok, ms));
const SETA = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 2 L4 19 L8.6 14.8 L11.6 21.4 L14.6 20 L11.6 13.6 L18 13.6 Z" fill="#fff" stroke="#102333" stroke-width="1.6" stroke-linejoin="round"/></svg>';

let ativo = false, parar = false;
let rato: HTMLElement | null = null, legenda: HTMLElement | null = null;
let x = 0, y = 0;

function montar(): void {
  rato = document.createElement('div'); rato.className = 'demo-rato'; rato.setAttribute('popover', 'manual'); rato.setAttribute('aria-hidden', 'true');
  rato.innerHTML = `${SETA}<i class="demo-rato__clique"></i>`;
  legenda = document.createElement('div'); legenda.className = 'demo-legenda'; legenda.setAttribute('popover', 'manual'); legenda.setAttribute('role', 'status'); legenda.setAttribute('aria-live', 'polite');
  legenda.innerHTML = '<p class="demo-legenda__passo"></p><p class="demo-legenda__t"></p><button type="button" class="demo-legenda__parar">Parar (Esc)</button>';
  legenda.querySelector('button')!.addEventListener('click', () => { parar = true; });
  document.body.append(rato, legenda);
  x = innerWidth / 2; y = innerHeight * .7; rato.style.transform = `translate(${x}px, ${y}px)`;
}
/** Os dois voltam para cima de tudo (um diálogo aberto depois deles ficava por cima). */
function aoCimo(): void {
  [rato, legenda].forEach((el) => { if (!el) return; try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch { /* sem popover: ficam com z-index */ } });
}
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden])');
/** O documento do separador que se vê (o iframe visível do ecrã), quando o há. */
function doSeparador(): Document | null {
  /* o que está mesmo à frente: os separadores escondidos podem continuar com tamanho, por baixo do ativo */
  const f = [...document.querySelectorAll<HTMLIFrameElement>('.ecra:not([hidden]) iframe')].find((x) => {
    const r = x.getBoundingClientRect(); if (!r.width || !r.height) return false;
    return document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 200)) === x;
  });
  try { return f?.contentDocument ?? null; } catch { return null; }
}
function alvo(sel: string, separador = false): HTMLElement | null {
  const doc = separador ? doSeparador() : document; if (!doc) return null;
  const d = doc.querySelector<HTMLElement>('dialog[open]');
  return (d?.querySelector<HTMLElement>(sel)) ?? doc.querySelector<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) ${sel}`) ?? (separador ? doc.querySelector<HTMLElement>(sel) : null);
}
/** Onde o documento do elemento começa na janela de cima (0,0 na própria página; o canto do iframe num separador). */
function origem(el: HTMLElement): [number, number] {
  if (el.ownerDocument === document) return [0, 0];
  const f = [...document.querySelectorAll<HTMLIFrameElement>('iframe')].find((x) => { try { return x.contentDocument === el.ownerDocument; } catch { return false; } });
  const r = f?.getBoundingClientRect(); return r ? [r.left, r.top] : [0, 0];
}
async function mover(el: HTMLElement): Promise<void> {
  el.scrollIntoView({ block: 'center', inline: 'nearest' }); await dormir(quieto() ? 0 : 250);
  const r = el.getBoundingClientRect(), [ox, oy] = origem(el), nx = ox + r.left + Math.min(r.width / 2, 60), ny = oy + r.top + r.height / 2;
  const d = Math.hypot(nx - x, ny - y), t = quieto() ? 0 : Math.min(900, 300 + d * 1.1);
  rato!.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: `translate(${nx}px, ${ny}px)` }], { duration: t, easing: 'cubic-bezier(.45, 0, .2, 1)', fill: 'forwards' });
  x = nx; y = ny; rato!.style.transform = `translate(${x}px, ${y}px)`;
  await dormir(t);
}
async function clicar(el: HTMLElement): Promise<void> {
  rato!.classList.remove('is-clique'); void rato!.offsetWidth; rato!.classList.add('is-clique');
  el.classList.add('demo-alvo'); await dormir(quieto() ? 80 : 260); el.classList.remove('demo-alvo');
  el.click();
}
function escrever(i: number, n: number, t: string, titulo: string): void {
  legenda!.querySelector('.demo-legenda__passo')!.textContent = `${titulo} · ${i} de ${n}`;
  legenda!.querySelector('.demo-legenda__t')!.textContent = t;
  if (!quieto()) legenda!.animate([{ opacity: .4, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 200, easing: 'ease-out' });
}

export async function tocar(id = [...ROTEIROS.keys()][0]): Promise<void> {
  const r = ROTEIROS.get(id); if (!r || ativo) return;
  ativo = true; parar = false;
  if (!rato) montar();
  aoCimo(); document.body.classList.add('demo-a-tocar'); document.body.classList.toggle('demo-sem-texto', !!r.semTexto);
  const fim = (t: string) => { escrever(r.passos.length, r.passos.length, t, r.titulo); };
  try {
    for (let i = 0; i < r.passos.length && !parar; i++) {
      const p = r.passos[i];
      if (p.ecra && visivel()?.dataset.ecra !== p.ecra && !document.querySelector('dialog[open]')) { mostrar(p.ecra); mostrarVersao(''); await dormir(500); }
      if (!r.semTexto) escrever(i + 1, r.passos.length, p.legenda, r.titulo); aoCimo();
      await dormir(quieto() ? 400 : 900);
      if (parar) break;
      if (p.escolher) {
        const s = alvo(p.escolher[0], p.separador) as HTMLSelectElement | null; if (!s) { fim('O roteiro parou: este ecrã mudou.'); break; }
        await mover(s); await clicar(s); s.value = p.escolher[1]; s.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (p.clicar) {
        const el = alvo(p.clicar, p.separador); if (!el) { fim('O roteiro parou: este ecrã mudou.'); break; }
        await mover(el); await clicar(el);
      }
      await dormir((quieto() ? 300 : 1000) + (p.pausa ?? 0));
      aoCimo();
    }
    if (!parar) await dormir(1800);
  } finally {
    ativo = false; document.body.classList.remove('demo-a-tocar', 'demo-sem-texto');
    try { rato?.hidePopover(); legenda?.hidePopover(); } catch { /* sem popover */ }
  }
}

export function iniciar(): void {
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && ativo) parar = true; }, true);
  /* &rato=1 toca o primeiro; &rato=<id> toca esse */
  const m = /(?:^|[#&])rato=([^&]+)/.exec(location.hash);
  if (m && temRoteiro()) window.setTimeout(() => { void tocar(ROTEIROS.has(m[1]) ? m[1] : undefined); }, 1200);
}
