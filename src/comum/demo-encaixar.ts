/* =========================================================
   ROMAFE — o ecrã do telemóvel inteiro à vista na demonstração (29 out. 2026)
   Ela: «coloca um screen maior para conseguir ver tudo na demonstração sem ter de fazer scroll», e «sim» a reduzir os
   ecrãs compridos. A moldura já cresce até à barra da demonstração (telemovel.css); quando o ecrã é mais alto do que
   isso, a moldura fica com a altura toda do ecrã e encolhe por igual (scale) até caber, mas nunca mais estreito do que o
   ecrã de 320 px de antes (80 % dos 412 da demonstração). O desenho não muda: tudo fica
   proporcionalmente mais pequeno, e os cliques e o rato da demonstração continuam certos (medem já com a escala).
   Só nas apps de tela estreita e com a janela larga; num telemóvel de verdade, a página rola como sempre.
   ========================================================= */
/** a borda da moldura; o espaço de cima; o de baixo (32 de margem + os 120 do body.demo::after, onde fica a barra) */
const BORDA = 20, CIMA = 24, MARGEM = 32, BAIXO = MARGEM + 120;

function encaixar(): void {
  const raiz = document.documentElement;
  if (!raiz.classList.contains('tela-telemovel') || window.innerWidth <= 600) return;
  document.querySelectorAll<HTMLElement>('body > .ecra').forEach((e) => {
    e.style.removeProperty('height'); e.style.removeProperty('transform'); e.style.removeProperty('margin-bottom');
  });
  const e = document.querySelector<HTMLElement>('body > .ecra:not([hidden])'); if (!e) return;
  const caixa = e.clientHeight, alto = e.scrollHeight;
  if (alto <= caixa + 2) return;
  const livre = window.innerHeight - CIMA - BAIXO - BORDA;
  /* (ela: «faz um ecrã de PDA maior») nunca mais pequeno do que o ecrã de antes (320 de 412, 80 %): aí rola o resto */
  const k = Math.max(.8, livre / alto);
  /* a 80 % o ecrã enche a janela e o resto rola por dentro (como antes), para o rato da demonstração o encontrar */
  const h = Math.min(alto, Math.floor(livre / k));
  e.style.height = `${h}px`;
  e.style.transform = `scale(${k.toFixed(4)})`;
  /* o transform não muda o espaço que a moldura ocupa: tira-se a parte que encolheu, para a página não rolar */
  e.style.marginBottom = `${MARGEM - (h + BORDA) * (1 - k)}px`;
}

let pedido = 0;
const depois = () => { cancelAnimationFrame(pedido); pedido = requestAnimationFrame(() => requestAnimationFrame(encaixar)); };

export function iniciarEncaixe(): void {
  depois();
  ['romafe:mostrado', 'romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, depois));
  window.addEventListener('resize', depois);
  window.addEventListener('hashchange', depois);
  /* um separador ou um cartão aberto muda a altura do ecrã */
  document.addEventListener('click', depois, true);
  document.fonts?.ready.then(depois);
}
