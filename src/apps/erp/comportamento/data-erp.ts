/* =========================================================
   ERP — as datas em dd/mm/aaaa (29 out. 2026). Ela mostrou as datas dos mapas a sair «10/19/2026»: o <input type="date">
   escreve a data na língua do navegador, e não na do ERP. Como nas listas de escolha (select-erp.ts), cada campo de data
   ganha por cima um campo de texto em dd/mm/aaaa e um botão com o calendário; o <input type="date"> continua por baixo e
   manda (é dele o valor que as páginas leem, em aaaa-mm-dd): escrever a data muda o valor dele e dispara «input» e
   «change»; quando o código lhe muda o valor, ou o desliga, o texto acompanha.
   - Escreve-se só com os números (as barras entram sozinhas); aceita também 1/2/26. Uma data que não existe fica marcada
     e o valor não muda.
   - Os atributos de navegação das páginas (-campo, -primeiro: o Enter passa ao seguinte) mudam-se para o texto.
   ========================================================= */
const ALVO = 'input[type="date"]:not([data-edata-nao])';
const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>';
const textos = new WeakMap<HTMLInputElement, HTMLInputElement>();
let n = 0;

const paraPt = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';
/** dd/mm/aaaa (ou d/m/aa) → aaaa-mm-dd; '' quando vazio; null quando não é uma data. */
function paraIso(t: string): string | null {
  if (!t.trim()) return '';
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\s*$/.exec(t); if (!m) return null;
  const a = m[3].length === 2 ? `20${m[3]}` : m[3], iso = `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(+d) || d.getUTCDate() !== Number(m[1]) || d.getUTCMonth() + 1 !== Number(m[2]) ? null : iso;
}
function pintar(nat: HTMLInputElement): void {
  const t = textos.get(nat); if (!t) return;
  if (document.activeElement !== t) t.value = paraPt(nat.value);
  t.disabled = nat.disabled; t.readOnly = nat.readOnly;
  if (nat.min) t.dataset.min = nat.min;
  t.toggleAttribute('aria-invalid', nat.getAttribute('aria-invalid') === 'true');
}
/** Enquanto se escreve, as barras entram sozinhas: 19102026 → 19/10/2026. Quem escreve as barras (1/2/26) fica como escreveu. */
function formatar(t: HTMLInputElement, ev: Event): void {
  if (!t.value) { delete t.dataset.manual; return; }
  if ((ev as InputEvent).data === '/') t.dataset.manual = '1';
  if (t.dataset.manual || /[^\d/]/.test(t.value)) return;
  const d = t.value.replace(/\D/g, '').slice(0, 8);
  t.value = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function melhorar(nat: HTMLInputElement): void {
  if (textos.has(nat) || !nat.isConnected) return;
  const id = nat.id || `edata-${++n}`; if (!nat.id) nat.id = id;
  const caixa = document.createElement('span'); caixa.className = 'edata';
  const t = document.createElement('input');
  t.type = 'text'; t.id = `${id}-texto`; t.className = 'edata__texto'; t.inputMode = 'numeric'; t.autocomplete = 'off'; t.placeholder = 'dd/mm/aaaa'; t.maxLength = 10;
  [...nat.attributes].forEach((a) => {
    if (/^data-[a-z0-9]+-(campo|primeiro)$/.test(a.name)) { t.setAttribute(a.name, a.value); nat.removeAttribute(a.name); }
    if (a.name === 'aria-label' || a.name === 'aria-describedby' || a.name === 'title') t.setAttribute(a.name, a.value);
  });
  const b = document.createElement('button'); b.type = 'button'; b.className = 'edata__cal'; b.tabIndex = -1; b.setAttribute('aria-label', 'Abrir o calendário'); b.innerHTML = CAL;
  /* o rótulo passa a ser do texto (no ecrã do campo, e não na página inteira: são 552 ecrãs) */
  (nat.closest('.ecra') ?? document).querySelectorAll<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`).forEach((l) => { l.htmlFor = t.id; });
  nat.parentNode!.insertBefore(caixa, nat); caixa.append(t, nat, b);
  nat.tabIndex = -1; nat.setAttribute('aria-hidden', 'true'); nat.classList.add('edata__nativo');
  textos.set(nat, t); pintar(nat);
  if (document.activeElement === nat) t.focus({ preventScroll: true });
  t.addEventListener('input', (ev) => { formatar(t, ev); t.removeAttribute('aria-invalid'); });
  t.addEventListener('change', (ev) => {
    ev.stopPropagation();
    const iso = paraIso(t.value);
    if (iso === null) { t.setAttribute('aria-invalid', 'true'); t.title = 'Data inválida: dd/mm/aaaa'; return; }
    t.removeAttribute('title');
    if (nat.value !== iso) { nat.value = iso; nat.dispatchEvent(new Event('input', { bubbles: true })); nat.dispatchEvent(new Event('change', { bubbles: true })); }
    t.value = paraPt(nat.value); delete t.dataset.manual;
  });
  /* o input do texto não chega às páginas (só o do campo de data, que é o que elas sabem ler) */
  t.addEventListener('input', (ev) => ev.stopPropagation());
  nat.addEventListener('change', () => pintar(nat)); nat.addEventListener('input', () => pintar(nat));
  b.addEventListener('click', () => { if (nat.disabled || nat.readOnly) return; try { nat.showPicker(); } catch { t.focus(); } });
  new MutationObserver(() => pintar(nat)).observe(nat, { attributes: true, attributeFilter: ['disabled', 'readonly', 'aria-invalid', 'min', 'max'] });
}
/* o código muda o valor (campo.value = …) sem «change»: o texto tem de acompanhar */
for (const prop of ['value', 'valueAsDate'] as const) {
  const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, prop)!;
  Object.defineProperty(HTMLInputElement.prototype, prop, { ...d, set(this: HTMLInputElement, v: never) { d.set!.call(this, v); if (textos.has(this)) pintar(this); } });
}

export function iniciar(): void {
  const varrer = (r: ParentNode = document) => r.querySelectorAll<HTMLInputElement>(ALVO).forEach(melhorar);
  requestAnimationFrame(() => varrer());
  /* só o que entrou, e não a página toda de cada vez que um ecrã se redesenha */
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((x) => { if (!(x instanceof Element)) return; if (x.matches(ALVO)) melhorar(x as HTMLInputElement); else varrer(x); }))).observe(document.body, { childList: true, subtree: true });
}
