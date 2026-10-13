/* =========================================================
   GOPARTS — o Catálogo v4 (13 out. 2026): o painel «Encontrar veículo» recolhe
   A proposta que ela colou pedia «Width + opacity, 250 ms», mas animar a
   largura mexe a página toda a cada fotograma (e ela não quer a página a
   mexer). Faz-se assim: a grelha muda de uma vez, e cada peça da direita
   desliza do sítio antigo para o novo (FLIP, só transform, 250 ms); os campos
   do painel aparecem a desvanecer. Fechado, o painel fica numa barra estreita
   com o botão para o abrir. Com «reduzir movimento», muda sem animar.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function alternar(main: HTMLElement, botao: HTMLButtonElement): void {
  const fechar = botao.getAttribute('aria-expanded') === 'true';
  const marcas = main.querySelector<HTMLElement>('.cat2__marcas')!;
  /* o que se move à direita: o cabeçalho, a faixa e cada cartão de marca ou a tabela */
  const pecas = Array.from(marcas.querySelectorAll<HTMLElement>('.cat2__marcas-cabeca, .cat4__faixa, .cat2__marca:not([hidden]), .cat3__vista:not([hidden])'));
  const antes = new Map(pecas.map((p) => [p, p.getBoundingClientRect()]));
  const caixa = marcas.getBoundingClientRect();
  main.classList.toggle('is-recolhido', fechar);
  botao.setAttribute('aria-expanded', String(!fechar));
  const texto = fechar ? 'Abrir o painel' : 'Recolher o painel';
  botao.setAttribute('aria-label', texto);
  botao.dataset.dica = texto;
  if (quieto()) return;
  const depois = marcas.getBoundingClientRect();
  marcas.animate([{ transform: `translateX(${caixa.left - depois.left}px)` }, { transform: 'none' }], { duration: 250, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  pecas.forEach((p) => {
    const a = antes.get(p)!, d = p.getBoundingClientRect();
    const dx = a.left - d.left - (caixa.left - depois.left), dy = a.top - d.top;
    if (dx || dy) p.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 250, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  });
  if (!fechar) {
    main.querySelectorAll<HTMLElement>('.cat4__painel > :not(.cat4__recolher):not([hidden])').forEach((c, i) =>
      c.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: 60 + i * 30, easing: 'ease-out', fill: 'backwards' }));
  }
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    if (document.body.classList.contains('editando')) return;
    const b = (ev.target as Element).closest<HTMLButtonElement>('.cat4__recolher');
    const main = b?.closest<HTMLElement>('.cat4');
    if (b && main) alternar(main, b);
  });
}
