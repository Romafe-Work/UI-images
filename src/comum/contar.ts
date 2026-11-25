/* =========================================================
   Os números dos indicadores contam até ao valor (25 nov. 2026; ela: «falta brilho e vida», no Peça A Peça; depois
   «faz» o mesmo no ERP). A primeira vez que um número se vê, conta de 0 até ao valor em 700 ms,
   com as mesmas casas decimais e o mesmo formato («3 449,60 €», «6 · 2»). Com movimento reduzido, nada.
   ========================================================= */
const NUM = /\d[\d\s  .]*(?:,\d+)?/g;
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const formatar = (v: number, casas: number) => v.toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas }).replace(/\./g, ' ');

function contar(dd: HTMLElement): void {
  if (dd.dataset.contou) return;
  dd.dataset.contou = '1';
  const modelo = dd.textContent || '';
  const alvos = [...modelo.matchAll(NUM)].map((m) => { const s = m[0].trim(); const casas = (s.split(',')[1] || '').length; return { s, casas, v: Number(s.replace(/[\s  .]/g, '').replace(',', '.')) }; });
  if (!alvos.length || alvos.every((a) => !a.v)) return;
  const t0 = performance.now(), dur = 700;
  const passo = (t: number) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    let i = 0;
    dd.textContent = modelo.replace(NUM, (m) => { const a = alvos[i++]; const fim = m.endsWith(' ') ? ' ' : ''; return (k < 1 ? formatar(a.v * e, a.casas) : a.s) + fim; });
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function verVisiveis(sel: string): void {
  if (quieto()) return;
  document.querySelectorAll<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) :is(${sel})`).forEach((dd) => {
    if (dd.children.length) return;
    contar(dd);
  });
}

/** Liga a contagem aos números que `sel` apanha (só os que não têm filhos). */
export function contarNumeros(sel: string): void {
  const ver = () => verVisiveis(sel);
  /* os indicadores de alguns ecrãs só se preenchem depois de o ecrã aparecer: vê-se outra vez um pouco depois */
  const ver2 = () => { requestAnimationFrame(ver); window.setTimeout(ver, 350); };
  ver2();
  ['romafe:mostrado', 'romafe:versao'].forEach((e) => document.addEventListener(e, ver2));
}
