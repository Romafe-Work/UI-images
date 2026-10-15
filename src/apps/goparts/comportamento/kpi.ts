/* =========================================================
   GOPARTS — os números do cabeçalho a mexer (15 out. 2026; Pedidos, Guias e Faturas)
   Ela, com a imagem dos quatro números das Faturas: «quero mais animação aqui e noutros screens».
   - CONTADOR: cada algarismo é uma fita 0–9 que rola (transform, 520 ms, da direita para a esquerda, 28 ms entre
     algarismos) até ao valor novo; na entrada da página, os algarismos rolam a partir do 0. O texto inteiro fica
     no aria-label (os algarismos são decorativos para o leitor de ecrã).
   - DIFERENÇA: quando o número muda com um filtro, aparece no lugar do nome do número «+2» ou «−1 234,56 €», que
     sobe e se apaga em 1,6 s, e o nome volta (posição absoluta: nada à volta se mexe).
   - BARRA: uma risca fina no fundo de cada número diz a parte do total do período (scaleX, 450 ms).
   Só transform e opacity; a largura do número não anima (algarismos de largura fixa). Com «reduzir movimento»,
   o número troca de uma vez e não há diferença a subir.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DIG = '0123456789';

/** Escreve `texto` no elemento como algarismos em fita; os que já existiam (contados da direita) rolam até ao novo. */
function odometro(el: HTMLElement, texto: string): void {
  el.setAttribute('aria-label', texto);
  const velhos = Array.from(el.querySelectorAll<HTMLElement>(':scope > .kpi-c'));
  const chars = [...texto];
  const novos = chars.map((ch, i) => {
    const j = velhos.length - (chars.length - i), antigo = j >= 0 ? velhos[j] : null;
    if (DIG.includes(ch)) {
      if (antigo?.classList.contains('kpi-c--d')) return antigo;
      const s = document.createElement('span'); s.className = 'kpi-c kpi-c--d'; s.setAttribute('aria-hidden', 'true');
      s.innerHTML = `<span class="kpi-fita">${[...DIG].map((d) => `<span>${d}</span>`).join('')}</span>`;
      s.style.setProperty('--d', '0');
      s.dataset.novo = '1';
      return s;
    }
    if (antigo && !antigo.classList.contains('kpi-c--d') && antigo.textContent === ch) return antigo;
    const s = document.createElement('span'); s.className = 'kpi-c'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; s.dataset.novo = '1';
    return s;
  });
  el.textContent = '';
  novos.forEach((n) => el.appendChild(n));
  void el.offsetWidth; /* o estado de partida fica calculado, para a fita rolar a partir dele */
  /* no próximo quadro, cada algarismo rola até ao seu; os novos entram de baixo */
  const n = novos.length;
  requestAnimationFrame(() => novos.forEach((s, i) => {
    const atraso = quieto() ? 0 : (n - 1 - i) * 28;
    if (s.classList.contains('kpi-c--d')) { s.style.transitionDelay = `${atraso}ms`; s.style.setProperty('--d', chars[i]); }
    if (s.dataset.novo && !quieto()) s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: atraso, easing: 'ease-out', fill: 'backwards' });
    delete s.dataset.novo;
  }));
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
  odometro(el, fmt(para));
  if (de !== para) diferenca(el, para - de, fmt);
  const base = Number(el.dataset.base);
  barra(el, base ? Math.abs(para) / Math.abs(base) : 0);
}

/** A entrada da página: os algarismos rolam do 0 até ao valor e as riscas enchem-se. */
export function kpiEntrada(raiz: HTMLElement, fmts: Record<string, (n: number) => string>): void {
  raiz.querySelectorAll<HTMLElement>('[data-kpi]').forEach((el) => {
    const k = el.dataset.kpi!, fmt = fmts[k]; if (!fmt || el.querySelector('.kpi-c')) return;
    const v = Number(el.dataset.valor ?? 0);
    el.dataset.base = String(v);
    const zero = fmt(v).replace(/\d/g, '0');
    odometro(el, zero);
    requestAnimationFrame(() => requestAnimationFrame(() => { odometro(el, fmt(v)); barra(el, v ? 1 : 0); }));
  });
}
