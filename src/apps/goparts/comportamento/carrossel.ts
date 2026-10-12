/* =========================================================
   GOPARTS — o carrossel das três pesquisas (Início v2.1, 12 out. 2026)
   Ela: «não tentava meter os três na mesma página: um principal e setas
   nos lados para dar slide para outro cartão; e se quiseres mais vivo,
   cartões 3D». Um cartão ao centro; os outros dois aos lados, rodados e
   para trás. Muda-se pelas setas (que dizem para onde vão), pela escolha
   por cima, por um clique num cartão de lado, ou pelas teclas ← e →.
   O cartão do centro inclina-se um pouco atrás do rato.
   No editor (body.editando) o clique escolhe peças: o carrossel não mexe.
   ========================================================= */
const ESTADOS = ['is-ant', 'is-atual', 'is-seg'];

function cartoes(c: HTMLElement): HTMLElement[] {
  return Array.from(c.querySelectorAll<HTMLElement>('.carrossel__cartao'));
}
function atual(c: HTMLElement): number {
  return cartoes(c).findIndex((x) => x.classList.contains('is-atual'));
}

function mostrar(c: HTMLElement, i: number): void {
  const lista = cartoes(c);
  const n = lista.length;
  const alvo = ((i % n) + n) % n;
  /* o prisma da v2.3 roda sempre pelo caminho mais curto: conta as voltas
     (--volta) em vez de saltar de 2 para 0 para trás */
  const antes = atual(c);
  const passo = ((alvo - antes + n + 1) % n) - 1;
  const volta = Number(c.dataset.volta || antes) + passo;
  c.dataset.volta = String(volta);
  c.style.setProperty('--volta', String(volta));
  lista.forEach((x, j) => {
    x.classList.remove(...ESTADOS);
    const d = (j - alvo + n) % n;          // 0 = centro, 1 = à direita, n-1 = à esquerda
    x.classList.add(d === 0 ? 'is-atual' : d === 1 ? 'is-seg' : 'is-ant');
    x.toggleAttribute('aria-hidden', d !== 0);
    x.style.removeProperty('--rx'); x.style.removeProperty('--ry');
  });
  c.querySelectorAll<HTMLElement>('[data-carrossel-ir]').forEach((b) => {
    b.setAttribute('aria-selected', String(Number(b.dataset.carrosselIr) === alvo));
  });
  /* os pontos por baixo (v2.2): o do cartão do centro fica comprido */
  c.querySelectorAll<HTMLElement>('.carrossel__ponto').forEach((p, j) => p.classList.toggle('is-atual', j === alvo));
  /* as setas dizem o nome do cartão para onde levam */
  const nome = (k: number) => lista[((k % n) + n) % n].dataset.nome || '';
  const ant = c.querySelector('.carrossel__seta--ant .carrossel__seta-nome');
  const seg = c.querySelector('.carrossel__seta--seg .carrossel__seta-nome');
  if (ant) ant.textContent = nome(alvo - 1);
  if (seg) seg.textContent = nome(alvo + 1);
}

/* A v2.2 troca de cartão numa View Transition: a página muda de uma vez e
   anima-se a imagem dos cartões, sem recalcular o texto a cada instante (o que
   fazia a altura mudar e a página por baixo mexer). Na demonstração, a
   animação escolhida (data-anim) sai durante a troca, para não rodar a página. */
function trocar(c: HTMLElement, i: number): void {
  const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!c.classList.contains('c22__carrossel') || !doc.startViewTransition || quieto) { mostrar(c, i); return; }
  const raiz = document.documentElement;
  const anim = raiz.dataset.anim;
  delete raiz.dataset.anim;
  raiz.dataset.vt = 'carrossel';
  const t = doc.startViewTransition(() => mostrar(c, i));
  t.finished.finally(() => { delete raiz.dataset.vt; if (anim) raiz.dataset.anim = anim; });
}

/* O palco fica com a altura do cartão mais alto (medida com cada um ao
   centro), para trocar de cartão não mudar a altura da página. */
function fixarAltura(c: HTMLElement): void {
  const palco = c.querySelector<HTMLElement>('.carrossel__palco');
  if (!palco || !palco.offsetWidth) return;
  const lista = cartoes(c);
  const guardado = lista.map((x) => x.className);
  palco.style.minHeight = '';
  let maior = 0;
  lista.forEach((_, i) => {
    lista.forEach((x, j) => {
      x.classList.remove(...ESTADOS);
      const d = (j - i + lista.length) % lista.length;
      x.classList.add(d === 0 ? 'is-atual' : d === 1 ? 'is-seg' : 'is-ant');
    });
    maior = Math.max(maior, palco.offsetHeight);
  });
  lista.forEach((x, j) => { x.className = guardado[j]; });
  palco.style.minHeight = maior + 'px';
}
function fixarTodas(): void { document.querySelectorAll<HTMLElement>('[data-carrossel]').forEach(fixarAltura); }

export function iniciar(): void {
  requestAnimationFrame(fixarTodas);
  document.addEventListener('romafe:versao', () => requestAnimationFrame(fixarTodas));
  window.addEventListener('resize', fixarTodas);
  if (document.fonts) document.fonts.ready.then(fixarTodas);

  document.addEventListener('click', (ev) => {
    if (document.body.classList.contains('editando')) return;
    const t = ev.target as Element;
    const c = t.closest<HTMLElement>('[data-carrossel]');
    if (!c) return;
    const passo = t.closest<HTMLElement>('[data-carrossel-passo]');
    const ir = t.closest<HTMLElement>('[data-carrossel-ir]');
    const lado = t.closest<HTMLElement>('.carrossel__cartao.is-ant, .carrossel__cartao.is-seg');
    if (passo) trocar(c, atual(c) + Number(passo.dataset.carrosselPasso));
    else if (ir) trocar(c, Number(ir.dataset.carrosselIr));
    else if (lado) { ev.preventDefault(); trocar(c, cartoes(c).indexOf(lado)); }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    const alvo = ev.target as Element;
    if (alvo.closest('input, select, textarea')) return;   // nos campos, as setas são do texto
    const c = alvo.closest<HTMLElement>('[data-carrossel]');
    if (!c) return;
    trocar(c, atual(c) + (ev.key === 'ArrowLeft' ? -1 : 1));
  });

  /* a inclinação 3D do cartão do centro, só com rato e sem «reduzir movimento» */
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('pointermove', (ev) => {
    if (quieto.matches || ev.pointerType !== 'mouse') return;
    const cartao = (ev.target as Element).closest<HTMLElement>('.carrossel__cartao.is-atual');
    if (!cartao) return;
    const r = cartao.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    cartao.style.setProperty('--ry', (x * 3).toFixed(2) + 'deg');   // até 1,5° (ela: «1–2 graus»)
    cartao.style.setProperty('--rx', (-y * 3).toFixed(2) + 'deg');
  });
  document.addEventListener('pointerout', (ev) => {
    const cartao = (ev.target as Element).closest<HTMLElement>('.carrossel__cartao.is-atual');
    if (cartao && !cartao.contains(ev.relatedTarget as Node)) {
      cartao.style.removeProperty('--rx'); cartao.style.removeProperty('--ry');
    }
  });
}
