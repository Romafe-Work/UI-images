/* =========================================================
   PEÇA A PEÇA — o produto voa para o carrinho (26 nov. 2026)
   Ela: «quando faço adicionar a carrinho quero o efeito de a enviar o produto para o cesto, coloca maior».
   Qualquer «Adicionar» do portal passa por carrinho.adicionar(), que avisa com 'carrinho:adicionado'. Daqui sai
   uma cópia grande da imagem da peça (ou, sem imagem, um cartão com o carrinho), que faz um arco até ao ícone do
   carrinho no topo e encolhe lá dentro; o carrinho dá um salto quando a recebe. Só transform e opacity.
   Com «reduzir movimento» não voa: o carrinho só pisca.
   ========================================================= */
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import { L } from '../portal/devolucoes';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAM = 112; // o tamanho da peça a voar (px)
let ultimo: { el: Element; t: number } | null = null;
let aVoar = 0;

function carrinhoVisivel(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-barra="carrinho"]')).find((b) => b.offsetParent && b.getBoundingClientRect().width) ?? null;
}

/** A imagem da peça mais perto do botão: sobe pelos pais até encontrar uma imagem (que não seja um ícone). */
function imagemPerto(de: Element): Element | null {
  let p: Element | null = de;
  for (let i = 0; i < 8 && p && p !== document.body; i++, p = p.parentElement) {
    const cands = Array.from(p.querySelectorAll('img, canvas, svg')).filter((x) => {
      if (x.closest('button, .btn, [data-barra]')) return false;
      const r = x.getBoundingClientRect();
      return r.width >= 40 && r.height >= 40 && r.bottom > 0 && r.top < innerHeight;
    });
    if (cands.length) return cands[0];
  }
  return null;
}

function copia(img: Element | null): HTMLElement {
  const c = document.createElement('div');
  c.className = 'voar-carrinho';
  c.setAttribute('aria-hidden', 'true');
  if (img instanceof HTMLImageElement) { const i = document.createElement('img'); i.src = img.currentSrc || img.src; i.alt = ''; c.appendChild(i); }
  else if (img instanceof HTMLCanvasElement) {
    try { const i = document.createElement('img'); i.src = img.toDataURL(); i.alt = ''; c.appendChild(i); } catch { c.innerHTML = L(cart); c.classList.add('voar-carrinho--icone'); }
  } else if (img instanceof SVGElement) {
    /* a cópia perde o CSS de onde estava: leva as cores e os traços calculados de cada peça do desenho */
    const s = img.cloneNode(true) as SVGElement;
    const orig = [img, ...Array.from(img.querySelectorAll('*'))], novos = [s, ...Array.from(s.querySelectorAll('*'))];
    orig.forEach((o, i) => { const cs = getComputedStyle(o), n = novos[i] as SVGElement;
      ['color', 'fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-dasharray'].forEach((k) => n.style.setProperty(k, cs.getPropertyValue(k))); });
    s.removeAttribute('width'); s.removeAttribute('height'); s.style.width = '100%'; s.style.height = '100%'; s.style.transform = 'none';
    c.appendChild(s);
  }
  else { c.innerHTML = L(cart); c.classList.add('voar-carrinho--icone'); }
  return c;
}

function receber(alvo: HTMLElement): void {
  alvo.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.32) rotate(-8deg)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3, 1.4, .5, 1)' });
  alvo.querySelector('.portal__selo')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 360, delay: 60, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
}

function voar(): void {
  const alvo = carrinhoVisivel(); if (!alvo) return;
  if (quieto()) { alvo.animate([{ opacity: 1 }, { opacity: .4 }, { opacity: 1 }], { duration: 300 }); return; }
  /* as encomendas em lote juntam muitas: voa uma */
  const agora = performance.now(); if (agora - aVoar < 350) return; aVoar = agora;
  const de = ultimo && agora - ultimo.t < 2500 && ultimo.el.isConnected ? ultimo.el : null;
  const img = de ? imagemPerto(de) : null;
  const ri = (img ?? de)?.getBoundingClientRect();
  const ra = alvo.getBoundingClientRect();
  const c = copia(img);
  document.body.appendChild(c);
  /* parte do centro da imagem (ou do botão; sem nada, do meio da janela) */
  const x0 = ri ? ri.left + ri.width / 2 : innerWidth / 2, y0 = ri ? ri.top + ri.height / 2 : innerHeight / 2;
  const x1 = ra.left + ra.width / 2, y1 = ra.top + ra.height / 2;
  const s0 = img && ri ? Math.min(1.25, Math.max(.8, Math.max(ri.width, ri.height) / TAM)) : 1;
  /* o arco: sobe primeiro e cai no carrinho (bezier quadrática, ponto de controlo acima dos dois) */
  const cx = (x0 + x1) / 2 + (x1 - x0) * .15, cy = Math.min(y0, y1) - Math.max(140, Math.abs(x1 - x0) * .25);
  const passos = 28, fr: Keyframe[] = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos, k = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease in-out ao longo do arco
    const x = (1 - k) ** 2 * x0 + 2 * (1 - k) * k * cx + k * k * x1;
    const y = (1 - k) ** 2 * y0 + 2 * (1 - k) * k * cy + k * k * y1;
    const s = t < .12 ? s0 * (1 + t / .12 * .12) : s0 * 1.12 + (0.16 - s0 * 1.12) * ((t - .12) / .88) ** 1.4;
    fr.push({ transform: `translate(${x - TAM / 2}px, ${y - TAM / 2}px) scale(${s}) rotate(${-14 * k}deg)`, opacity: t > .9 ? (1 - t) / .1 * .9 + .1 : 1, offset: t });
  }
  const a = c.animate(fr, { duration: 820, easing: 'linear', fill: 'forwards' });
  a.onfinish = () => { c.remove(); receber(alvo); };
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => { ultimo = { el: ev.target as Element, t: performance.now() }; }, true);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') ultimo = { el: ev.target as Element, t: performance.now() }; }, true);
  window.addEventListener('carrinho:adicionado', () => requestAnimationFrame(voar));
}
