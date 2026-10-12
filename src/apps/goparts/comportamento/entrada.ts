/* =========================================================
   GOPARTS — a entrada animada das categorias, pesquisas recentes e
   últimos pedidos (Início v2.1, v2.2, v2.3 e v4; 12 out. 2026)
   Ela: «quero isto animado». Quando o bloco aparece no ecrã, as categorias
   entram uma a uma, depois os dois cartões, e as linhas de cada cartão em
   cascata. O CSS está em inicio-v4.css («animação»); aqui só se marca o
   índice de cada peça (--i) e quando o bloco fica à vista (.is-visivel).

   Só no protótipo (#so=ecra, e por isso também na demonstração): no editor
   tudo fica parado e à vista. Com «reduzir movimento», nada se mexe.
   ========================================================= */
export function iniciar(): void {
  if (!/(^|[#&])so=ecra\b/.test(location.hash)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('anima-entrada');

  const blocos = document.querySelectorAll<HTMLElement>('.cat4, .recentes');
  blocos.forEach((b) => {
    b.querySelectorAll<HTMLElement>('.cat4__item').forEach((x, i) => x.style.setProperty('--i', String(i)));
    b.querySelectorAll<HTMLElement>('.cartao4').forEach((c, i) => {
      c.style.setProperty('--i', String(i));
      c.querySelectorAll<HTMLElement>('.cartao4__lista li').forEach((li, j) => li.style.setProperty('--j', String(j)));
    });
  });

  /* o herói da v2.1 e da v2.3 (ela, 12 out.: «falta animação nestes headers»):
     cada peça entra pela ordem (--i), e o 75 000 conta a partir de 0 */
  document.querySelectorAll<HTMLElement>(':is(.portal--v21, .portal--v23) .heroi2').forEach((h) => {
    h.classList.add('heroi-anima');
    const pecas = h.querySelectorAll<HTMLElement>('.heroi2__titulo, .heroi2__sub, .heroi2__procura, .populares__rotulo, .populares__chip, .heroi2__antes, .heroi2__numero, .heroi2__depois, .heroi2__lista li');
    pecas.forEach((x, i) => x.style.setProperty('--i', String(i)));
  });
  const contar = (el: HTMLElement) => {
    const fim = Number((el.textContent || '').replace(/\D/g, ''));
    if (!fim || el.dataset.contado) return;
    el.dataset.contado = '1';
    const t0 = performance.now(), dur = 1200;
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const v = Math.round(fim * (1 - Math.pow(1 - k, 3)));
      el.textContent = v.toLocaleString('pt-PT').replace(/\u00a0|\u202f|\./g, ' ');
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };
  const verHeroi = () => document.querySelectorAll<HTMLElement>('.versao:not([hidden]) .heroi-anima').forEach((h) => {
    if (h.classList.contains('is-visivel')) return;
    h.classList.add('is-visivel');
    const n = h.querySelector<HTMLElement>('.heroi2__numero');
    if (n) window.setTimeout(() => contar(n), 500);
  });
  requestAnimationFrame(verHeroi);
  document.addEventListener('romafe:versao', () => requestAnimationFrame(verHeroi));

  const olho = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visivel'); olho.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  blocos.forEach((b) => olho.observe(b));
}
