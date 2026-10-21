/* =========================================================
   GOPARTS — as imagens dos modelos (14 out. 2026)
   Ela pediu fotografias dos modelos (3/4 de frente, fundo transparente), mas o próprio briefing diz para usar
   imagens licenciadas da geração exata e, sem elas, «uma silhueta vetorial limpa da categoria». Não há
   fotografias licenciadas neste protótipo (e o repositório é público): ficam as silhuetas, todas com a mesma
   câmara (de lado), a mesma proporção (240 × 100) e o mesmo traço. Quando a Romafe tiver as imagens (o
   fornecedor do catálogo costuma tê-las por geração), basta pô-las em FOTOS, pelo nome do modelo: o cartão
   usa a fotografia (com o carregamento preguiçoso) e, se falhar, volta à silhueta.
   ========================================================= */

/** Fotografias licenciadas por modelo (vazio por agora): { '3 (G20, G80)': '/img/bmw-g20.webp' }. */
export const FOTOS: Record<string, string> = {};

/* a carroçaria e as janelas de cada categoria; as rodas são comuns (ou maiores no SUV e no furgão) */
const FORMAS: Record<string, [string, string, number]> = {
  Hatchback: ['M20 78V62q2-10 20-12l30-4 25-16q5-3 15-3h62q8 0 12 6l14 20 6 6v19Z', 'M99 33h70l12 15H80Zm33 0v15', 78],
  Berlina: ['M14 78V62q2-10 20-12l32-4 26-15q5-3 14-3h46q10 0 18 8l12 10 34 3q10 3 10 13v16Z', 'M96 34h53l14 13H78Zm28 0v13', 78],
  Carrinha: ['M14 78V62q2-10 20-12l32-4 26-16q5-3 14-3h102q8 0 12 7l6 18v26Z', 'M96 33h108l6 14H78Zm28 0v14m40-14v14', 78],
  'Coupé': ['M16 78V62q2-9 20-11l38-4 30-15q6-2 16-2h28q12 1 28 14l38 6q10 3 10 12v16Z', 'M108 36h38q9 1 20 11H86Z', 78],
  Cabriolet: ['M16 78V62q2-9 20-11l44-3h16l8-12h4l-2 12h108q10 3 10 13v16Z', 'M100 48l8-12', 78],
  SUV: ['M14 80V56q2-10 20-12l30-4 24-18q6-4 16-4h92q10 0 16 8l10 18q6 4 6 12v24Z', 'M94 25h112l9 17H70Zm32 0v17m44-17v17', 80],
  Monovolume: ['M16 78V58q2-10 14-12l22-4 32-22q6-3 16-3h100q10 0 14 9l8 22 2 30Z', 'M90 24h112l7 20H62Zm34 0v20m44-20v20', 78],
  'Furgão': ['M14 80V54q2-10 16-12l20-2 18-22q4-4 14-4h136q8 0 8 8v58Z', 'M74 21h34v20H56Z', 80],
};

/** A forma de uma categoria (carroçaria, janelas, y das rodas), para quem desenha por cima dela (17 · Inf. técnica). */
export const formaDe = (carrocaria: string) => FORMAS[carrocaria] || FORMAS.Hatchback;

/** A silhueta da categoria (ou do hatchback, se não houver). */
export function silhueta(carrocaria: string): string {
  const [corpo, janelas, y] = FORMAS[carrocaria] || FORMAS.Hatchback;
  const r = y === 80 ? 17 : 15;
  const roda = (x: number) => `<circle class="cat6__roda" cx="${x}" cy="${y}" r="${r}"/><circle class="cat6__jante" cx="${x}" cy="${y}" r="${r * 0.45}"/><path class="cat6__raios" d="M${x - r * 0.7} ${y}h${r * 1.4}M${x} ${y - r * 0.7}v${r * 1.4}"/>`;
  return `<svg class="cat6__silhueta" viewBox="0 0 240 100" aria-hidden="true"><path class="cat6__chao" d="M8 ${y + r + 1}h224"/><path class="cat6__corpo" d="${corpo}"/><path class="cat6__janelas" d="${janelas}"/>${roda(58)}${roda(182)}</svg>`;
}

/** A imagem do modelo: a fotografia licenciada, se houver, senão a silhueta. */
export function imagemModelo(modelo: string, carrocaria: string): string {
  const f = FOTOS[modelo];
  return f ? `<img src="${f}" alt="" loading="lazy" decoding="async" data-silhueta="${carrocaria}">` : silhueta(carrocaria);
}
