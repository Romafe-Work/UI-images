/* =========================================================
   GOPARTS — os números do cabeçalho a mexer (15 out. 2026; Pedidos, Guias e Faturas)
   Ela, com a imagem dos quatro números das Faturas: «quero mais animação aqui e noutros screens».
   - CONTAR (ela, depois: «aqui seria engraçado aparecer como aparece na lista de compras»): como os totais da Minha
     lista, o número conta do valor antigo até ao novo (420 ms) e acende a laranja; à entrada conta a partir do 0.
     (A fita de algarismos que rolavam, da primeira versão, saiu.)
   - DIFERENÇA: quando o número muda com um filtro, aparece no lugar do nome do número «+2» ou «−1 234,56 €», que
     sobe e se apaga em 1,6 s, e o nome volta (posição absoluta: nada à volta se mexe).
   - BARRA: uma risca fina no fundo de cada número diz a parte do total do período (scaleX, 450 ms).
   A largura do número fica a do valor final enquanto conta; a diferença e a risca só usam transform e opacity. Com «reduzir movimento»,
   o número troca de uma vez e não há diferença a subir.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Como na Minha lista (ela: «aqui seria engraçado aparecer como aparece na lista de compras»): o número conta do
    valor que lá estava até ao novo (420 ms) e acende a laranja. A largura fica a do maior valor já mostrado, para
    nada à volta se mexer enquanto conta nem quando o número encolhe. */
function contarComoNaLista(el: HTMLElement, de: number, para: number, fmt: (n: number) => string): void {
  el.setAttribute('aria-label', fmt(para));
  el.textContent = fmt(para);
  /* a caixa nunca encolhe: fica com a largura do maior valor que já mostrou (um filtro não puxa o cabeçalho) */
  if (!el.hasAttribute('data-kpi-lista')) el.style.minWidth = `${Math.max(parseFloat(el.style.minWidth) || 0, el.offsetWidth)}px`; /* no resumo (linhas a toda a largura) não é preciso */
  if (quieto() || de === para) return;
  const t0 = performance.now();
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / 420), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(de + (para - de) * e); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
  el.classList.remove('is-mudou'); void el.offsetWidth; el.classList.add('is-mudou');
}

/** A diferença no lugar do nome do número: sobe e apaga-se. */
function diferenca(el: HTMLElement, d: number, fmt: (n: number) => string): void {
  if (quieto() || !d) return;
  const caixa = el.closest<HTMLElement>('dl > div'); if (!caixa) return;
  caixa.querySelector('.kpi-dif')?.remove();
  const s = document.createElement('span');
  s.className = `kpi-dif ${d > 0 ? 'kpi-dif--mais' : 'kpi-dif--menos'}`; s.setAttribute('aria-hidden', 'true');
  s.textContent = `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}`;
  caixa.appendChild(s);
  s.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none', offset: .18 }, { opacity: 1, transform: 'none', offset: .7 }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 1600, easing: 'cubic-bezier(.22, 1, .36, 1)' }).finished.then(() => s.remove(), () => s.remove());
}

/** A risca fina do fundo: a parte do total do período. */
function barra(el: HTMLElement, frac: number): void {
  if (el.tagName !== 'DD') return; /* dois números na mesma caixa (Faturas · Notas de crédito): sem risca */
  const caixa = el.closest<HTMLElement>('dl > div'); if (!caixa) return;
  let b = caixa.querySelector<HTMLElement>('.kpi-barra');
  if (!b) { b = document.createElement('span'); b.className = 'kpi-barra'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = '<i></i>'; caixa.appendChild(b); }
  b.style.setProperty('--f', String(Math.max(0, Math.min(1, frac))));
}

/** O número do cabeçalho passa a `para`: rola, mostra a diferença e acerta a barra (`base` = o total do período). */
export function kpi(el: HTMLElement | null, para: number, fmt: (n: number) => string): void {
  if (!el) return;
  const de = Number(el.dataset.valor ?? para);
  if (!el.dataset.base) el.dataset.base = String(de || para);
  el.dataset.valor = String(para);
  contarComoNaLista(el, de, para, fmt);
  if (el.hasAttribute('data-kpi-lista')) return; /* o resumo das Faturas é o da Minha lista: só conta e acende */
  if (de !== para) diferenca(el, para - de, fmt);
  const base = Number(el.dataset.base);
  barra(el, base ? Math.abs(para) / Math.abs(base) : 0);
}

/** A entrada da página: os números aparecem a contar a partir do 0 (o mesmo gesto da lista) e as riscas enchem-se. */
export function kpiEntrada(raiz: HTMLElement, fmts: Record<string, (n: number) => string>): void {
  raiz.querySelectorAll<HTMLElement>('[data-kpi]').forEach((el) => {
    const fmt = fmts[el.dataset.kpi!]; if (!fmt || el.dataset.entrou) return;
    el.dataset.entrou = '1';
    const v = Number(el.dataset.valor ?? 0);
    if (!el.dataset.base) el.dataset.base = String(v);
    const base = Number(el.dataset.base);
    contarComoNaLista(el, 0, v, fmt);
    requestAnimationFrame(() => barra(el, base ? Math.abs(v) / Math.abs(base) : 0));
  });
}
