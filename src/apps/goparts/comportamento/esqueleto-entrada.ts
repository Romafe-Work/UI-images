/* =========================================================
   PEÇA A PEÇA — o esqueleto na primeira entrada (26 nov. 2026)
   Ela: «quero ver os efeitos de skeleton na primeira vez que entro nas páginas — o loading».
   Na primeira vez (nesta sessão) que se entra num ecrã do portal, o conteúdo chega em esqueleto: as caixas, os
   cartões e as linhas ficam no sítio; o texto, as imagens, os campos e os botões dão lugar a barras que brilham,
   com a forma exata do que vai aparecer (nada salta quando chega). Uns 900 ms e o conteúdo aparece com um
   desvanecer curto. O topo e a barra lateral não entram no esqueleto (a moldura já lá está).
   Nas vezes seguintes o ecrã abre logo. Com «reduzir movimento» o esqueleto fica parado e é mais curto.
   ========================================================= */
const CHAVE = 'goparts:esqueleto-visto';
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const MAX = 260;

function vistos(): Set<string> { try { return new Set(JSON.parse(sessionStorage.getItem(CHAVE) || '[]')); } catch { return new Set(); } }
function marcar(id: string): void { const v = vistos(); v.add(id); try { sessionStorage.setItem(CHAVE, JSON.stringify([...v])); } catch { /* fica só desta vez */ } }

/** O conteúdo do ecrã: os filhos do portal que não são a moldura (topo, barra lateral, rodapé, camadas). */
function conteudo(portal: HTMLElement): HTMLElement[] {
  return Array.from(portal.children).filter((c): c is HTMLElement => c instanceof HTMLElement
    && !c.matches('header, .portal__topo, .portal__lado, [data-lado], footer, .portal__rodape, .bc, script, style, template, dialog, .sr-only')
    && c.offsetHeight > 0);
}

type Caixa = { x: number; y: number; w: number; h: number; r: string };
function medir(raizes: HTMLElement[]): Caixa[] {
  const caixas: Caixa[] = [], vh = innerHeight * 1.5;
  const dentro = (r: DOMRect) => r.width > 3 && r.height > 3 && r.bottom > 0 && r.top < vh;
  const add = (r: DOMRect, raio: string) => { if (caixas.length < MAX && dentro(r)) caixas.push({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, r: raio }); };
  const folha = 'img, canvas, video, svg, input, select, textarea, button, .btn, [role="button"], .chip, kbd';
  for (const raiz of raizes) {
    /* as peças «cheias»: imagens, campos, botões (um bloco cada, com os cantos deles) */
    raiz.querySelectorAll<HTMLElement | SVGElement>(folha).forEach((el) => {
      if (el.parentElement?.closest(folha)) return; // o ícone de um botão vai com o botão
      const r = el.getBoundingClientRect(); if (!r.width) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || el.closest('[hidden]')) return;
      add(r, el.matches('svg') && r.width < 28 ? '50%' : cs.borderRadius && cs.borderRadius !== '0px' ? cs.borderRadius : 'var(--r-sm)');
    });
    /* o texto: uma barra por linha, da largura do que lá está escrito */
    const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue?.trim() && !(n.parentElement?.closest(folha)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const rg = document.createRange(), linhas: DOMRect[] = [];
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const p = n.parentElement!; const cs = getComputedStyle(p);
      if (cs.display === 'none' || p.closest('[hidden]')) continue;
      rg.selectNodeContents(n);
      for (const r of Array.from(rg.getClientRects())) {
        if (r.width < 2) continue;
        /* as palavras da mesma linha (palavras soltas, negritos, ligações) juntam-se numa barra só */
        const m = linhas.find((l) => Math.abs((l.top + l.height / 2) - (r.top + r.height / 2)) < Math.min(l.height, r.height) * .5 && r.left <= l.right + 14 && r.right >= l.left - 14);
        if (m) { const x0 = Math.min(m.left, r.left), y0 = Math.min(m.top, r.top); m.width = Math.max(m.right, r.right) - x0; m.height = Math.max(m.bottom, r.bottom) - y0; m.x = x0; m.y = y0; }
        else linhas.push(DOMRect.fromRect(r));
      }
    }
    for (const r of linhas) { const h = Math.min(r.height * .62, 26), y = r.top + (r.height - h) / 2; add(new DOMRect(r.left, y, r.width, h), '4px'); }
  }
  return caixas;
}

let acabar: (() => void) | null = null;
function esqueleto(ecra: HTMLElement): void {
  acabar?.();
  const portal = ecra.querySelector<HTMLElement>(':scope > .versao:not([hidden]) .portal') ?? ecra.querySelector<HTMLElement>('.portal');
  if (!portal) return;
  const raizes = conteudo(portal); if (!raizes.length) return;
  /* esconde já (o texto fica transparente e as imagens/campos invisíveis, mas tudo no lugar) e mede no quadro
     seguinte, quando os ecrãs que se constroem ao aparecer já pintaram o que têm */
  raizes.forEach((r) => r.classList.add('esq-entrar'));
  requestAnimationFrame(() => desenhar(portal, raizes));
}
function desenhar(portal: HTMLElement, raizes: HTMLElement[]): void {
  if (!raizes[0].classList.contains('esq-entrar')) return;
  const caixas = medir(raizes);
  if (caixas.length < 3) { raizes.forEach((r) => r.classList.remove('esq-entrar')); return; }
  const camada = document.createElement('div');
  camada.className = 'esq-camada' + (quieto() ? ' esq-camada--quieta' : '');
  camada.setAttribute('aria-hidden', 'true');
  const pintar = (cx: Caixa[]) => { camada.innerHTML = cx.map((c, i) => `<span class="esq-camada__b" style="left:${c.x.toFixed(1)}px;top:${c.y.toFixed(1)}px;width:${c.w.toFixed(1)}px;height:${c.h.toFixed(1)}px;border-radius:${c.r};animation-delay:${(i % 12) * 30}ms"></span>`).join(''); };
  pintar(caixas);
  document.body.appendChild(camada);
  portal.setAttribute('aria-busy', 'true');
  /* os ecrãs que acabam de se construir (o Catálogo, as listas) mudam depois da primeira medição: volta a medir */
  let pedido = 0;
  const obs = new MutationObserver(() => { if (!pedido) pedido = requestAnimationFrame(() => { pedido = 0; if (!feito) pintar(medir(raizes)); }); });
  raizes.forEach((r) => obs.observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] }));
  let feito = false;
  const fim = () => {
    if (feito) return; feito = true; acabar = null; obs.disconnect(); cancelAnimationFrame(pedido);
    portal.removeAttribute('aria-busy');
    raizes.forEach((r) => r.classList.remove('esq-entrar'));
    if (quieto()) { camada.remove(); return; }
    raizes.forEach((r) => r.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }));
    camada.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }).onfinish = () => camada.remove();
  };
  acabar = fim;
  const t = window.setTimeout(fim, quieto() ? 450 : 900);
  /* quem já está a usar não espera: um clique, uma tecla, ou sair do ecrã acaba o esqueleto */
  const cedo = () => { window.clearTimeout(t); fim(); };
  window.addEventListener('pointerdown', cedo, { once: true, capture: true });
  window.addEventListener('keydown', cedo, { once: true, capture: true });
}

function entrou(): void {
  if (editando()) return;
  const ecra = document.querySelector<HTMLElement>('.ecra:not([hidden])');
  if (!ecra || ecra.dataset.estadoDe) return;
  const id = ecra.dataset.ecra || ''; if (!id) return;
  if (!ecra.querySelector(':scope > .versao:not([hidden]) .portal')) return;
  const v = vistos(); if (v.has(id)) { acabar?.(); return; }
  marcar(id);
  esqueleto(ecra);
}

export function iniciar(): void {
  document.addEventListener('romafe:mostrado', entrou);
  requestAnimationFrame(entrou);
}
