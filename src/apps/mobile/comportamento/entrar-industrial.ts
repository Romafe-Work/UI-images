/* =========================================================
   PICK — 01 · Entrar v5: o que mexe (21 out. 2026)
   - 00 · Abertura: toca quando aparece (as barras, a linha que as lê, a estante, a caixa, as verificações) e
     «Entrar» leva à entrada; não avança sozinha, para se poder ver. 01 · Entrar: o formulário acende uma vez por
     sessão e funciona logo.
   - Mostrar/esconder a palavra-passe; um campo preenchido fica com a borda verde-clara (só diz que está escrito,
     não que está certo).
   - «Entrar» (ou Enter): campos vazios dizem qual falta; sem rede, diz-se e não se tenta; senão, «A entrar…»
     desligado (não entra duas vezes) e, depois da resposta, «Sessão iniciada» e o Inventário (≈ 300 ms).
     Não há servidor neste protótipo: qualquer utilizador e palavra-passe escritos fazem de resposta certa.
   - «Este PDA»: o modelo e o número de série, como o próprio aparelho os mostra.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-pki]');
const real = (pki: HTMLElement) => !/pki--/.test(pki.className);

/** A abertura toca sempre que aparece (≈ 1,9 s até «Entrar»); a entrada só acende o formulário, uma vez por sessão. */
function abrir(): void {
  if (quieto() || editando()) return;
  const pka = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-pka]');
  if (pka && !/pka--/.test(pka.className)) { pka.classList.remove('is-abrir'); void pka.offsetWidth; pka.classList.add('is-abrir'); window.setTimeout(() => pka.classList.remove('is-abrir'), 2000); return; }
  const pki = visivel(); if (!pki || !real(pki)) return;
  try { if (sessionStorage.getItem('pick:entrou')) return; sessionStorage.setItem('pick:entrou', '1'); } catch { return; }
  pki.classList.add('is-abrir');
  window.setTimeout(() => pki.classList.remove('is-abrir'), 600);
}
function aviso(pki: HTMLElement, k: 'erro' | 'aviso' | 'ok' | 'info', titulo: string, texto: string): void {
  pki.querySelector('.pki-aviso')?.remove();
  const s = document.createElement('section'); s.className = `pki-aviso pki-aviso--${k}`; s.setAttribute('role', k === 'erro' ? 'alert' : 'status');
  s.innerHTML = `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg></span><div><b></b><p></p></div>`;
  s.querySelector('b')!.textContent = titulo; s.querySelector('p')!.textContent = texto;
  pki.querySelector('.pki-ola')!.after(s);
}
function erroCampo(inp: HTMLInputElement, texto: string): void {
  const c = inp.closest<HTMLElement>('.pki-campo')!; c.classList.add('is-erro'); inp.setAttribute('aria-invalid', 'true');
  let p = c.querySelector<HTMLElement>('.pki-erro-campo'); if (!p) { p = document.createElement('p'); p.className = 'pki-erro-campo'; p.id = `${inp.id}-erro`; c.appendChild(p); inp.setAttribute('aria-describedby', p.id); }
  p.textContent = texto;
}
function limpar(inp: HTMLInputElement): void { const c = inp.closest('.pki-campo')!; c.classList.remove('is-erro'); inp.removeAttribute('aria-invalid'); c.querySelector('.pki-erro-campo')?.remove(); }

function entrar(form: HTMLFormElement): void {
  const pki = form.closest<HTMLElement>('[data-pki]')!, u = form.querySelector<HTMLInputElement>('#pki-u')!, p = form.querySelector<HTMLInputElement>('#pki-p')!, b = form.querySelector<HTMLButtonElement>('.pki-entrar')!;
  if (b.disabled) return;
  [u, p].forEach(limpar);
  if (!u.value.trim()) { erroCampo(u, 'Escreva o utilizador ou o email.'); u.focus(); return; }
  if (!p.value) { erroCampo(p, 'Escreva a palavra-passe.'); p.focus(); return; }
  if (!navigator.onLine) { aviso(pki, 'aviso', 'Sem rede', 'A Pick precisa de rede para entrar. Aproxime-se de uma zona com sinal.'); return; }
  const antes = b.innerHTML;
  b.disabled = true; b.setAttribute('aria-busy', 'true'); b.classList.add('is-a-entrar');
  b.innerHTML = '<span class="girador girador--claro" aria-hidden="true"></span><span>A entrar…</span>';
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.classList.remove('is-a-entrar'); b.classList.add('is-feito');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Sessão iniciada</span>';
    aviso(pki, 'ok', 'Sessão iniciada', `${u.value.trim()} · Arrumação · armazém 60.`);
    if (!quieto()) pki.classList.add('is-a-sair');
    window.setTimeout(() => { pki.classList.remove('is-a-sair'); b.innerHTML = antes; b.disabled = false; b.classList.remove('is-feito'); pki.querySelector('.pki-aviso')?.remove(); mostrar('inv-inicio'); }, quieto() ? 0 : 320);
  }, quieto() ? 150 : 700);
}

export function iniciar(): void {
  requestAnimationFrame(abrir);
  document.addEventListener('romafe:versao', () => requestAnimationFrame(abrir));
  document.addEventListener('submit', (ev) => { const f = ev.target as HTMLFormElement; if (!f.matches?.('[data-pki-form]')) return; ev.preventDefault(); if (!editando()) entrar(f); }, true);
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const ver = t.closest?.<HTMLElement>('[data-pki-ver]');
    if (ver) { const i = ver.parentElement!.querySelector<HTMLInputElement>('input')!; const sim = i.type === 'password'; i.type = sim ? 'text' : 'password'; ver.setAttribute('aria-pressed', String(sim)); ver.setAttribute('aria-label', sim ? 'Esconder a palavra-passe' : 'Mostrar a palavra-passe'); i.focus(); return; }
    const pda = t.closest?.<HTMLElement>('[data-pki-pda]');
    if (pda) { const pki = pda.closest<HTMLElement>('[data-pki]')!; aviso(pki, 'info', 'Este PDA', 'Honeywell EDA61K · Android 11 · série 24174B6440. Para o registar na Pick, fale com o gestor do turno.'); }
  });
  document.addEventListener('input', (ev) => { const i = ev.target as HTMLInputElement; if (!i.matches?.('.pki-caixa input')) return; limpar(i); i.classList.toggle('is-valido', !!i.value.trim()); });
}
