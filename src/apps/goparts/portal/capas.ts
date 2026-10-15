/* =========================================================
   GOPARTS — as fotografias dos cabeçalhos (15 out. 2026)
   Ela: «preciso de mais imagens em todos os screens». Fotografias verdadeiras de romafe.com (src/comum/img), uma por
   ecrã, escolhida pelo que o ecrã faz: os Pedidos com a separação nas estantes, as Guias com o corredor do armazém
   de onde saem as entregas, as Faturas com a fachada da sede, a Minha lista com a oficina. Nítidas, sem véus nem
   efeitos; a legenda numa etiqueta lisa. Entram com uma revelação da esquerda para a direita (clip-path, 600 ms) e,
   com o rato por cima, aproximam-se 3 % (transform), dentro da sua moldura.
   ========================================================= */
import separacao from '../../../comum/img/separacao.webp';
import corredor from '../../../comum/img/corredor.webp';
import fachada from '../../../comum/img/fachada.webp';
import oficina from '../../../comum/img/oficina.webp';

const CAPAS = {
  pedidos: [separacao, 'A separar pedidos no armazém da Romafe', '60% 40%'],
  guias: [corredor, 'O armazém de onde saem as entregas', '50% 55%'],
  faturas: [fachada, 'A sede da Romafe, no Porto', '30% 35%'],
  lista: [oficina, 'Na oficina', '55% 60%'],
} as const;

export function capa(k: keyof typeof CAPAS): string {
  const [src, legenda, pos] = CAPAS[k];
  return `<figure class="pg-capa"><img src="${src}" alt="${legenda}" loading="lazy" decoding="async" style="object-position:${pos}"><figcaption>${legenda}</figcaption></figure>`;
}
