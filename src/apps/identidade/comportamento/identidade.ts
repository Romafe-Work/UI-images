/* =========================================================
   ROMAFE IDENTITY — o que mexe (21 out. 2026)
   - E-mail → «Continuar»: valida a forma (nome@empresa.pt); «A verificar…» um instante; passa à palavra-passe com o
     e-mail à vista. Nada diz se o e-mail tem conta.
   - Palavra-passe → «Entrar»: vazia, o campo abana; «errada» (para experimentar) dá o erro de credenciais, que não
     diz qual dos dois está mal; outra qualquer entra e mostra «Onde queres trabalhar?».
   - Mostrar/esconder a palavra-passe; o aviso das maiúsculas.
   - Abrir uma aplicação: o cartão espera e a página dela abre (as do protótipo).
   - A abertura (a cena da esquerda) corre uma vez por visita; com «reduzir movimento», nada se anima.
   ========================================================= */
import { mostrar, transitar } from '../../../comum/ecras';
import { L } from '../../goparts/portal/inicio-espaco';
import eye from 'lucide-static/icons/eye.svg?raw';
import eyeOff from 'lucide-static/icons/eye-off.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando');
const espera = (ms: number) => new Promise((r) => window.setTimeout(r, quieto() ? Math.min(ms, 120) : ms));
const CHAVE = 'romafe:identity:correio';
const roda = '<span class="id__roda" aria-hidden="true"></span>';
const valido = (s: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s.trim());

function ir(id: string): void { transitar(() => { mostrar(id); }); }
function vivo(): HTMLElement | null { return document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .id'); }
function abanar(el: Element | null): void { if (el && !quieto()) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 220 }); }
async function ocupar(b: HTMLButtonElement, texto: string, ms: number): Promise<() => void> {
  const antes = b.innerHTML; b.disabled = true; b.setAttribute('aria-busy', 'true');
  b.innerHTML = `${roda}<span class="btn__rotulo">${texto}</span>`;
  await espera(ms);
  return () => { b.innerHTML = antes; b.disabled = false; b.removeAttribute('aria-busy'); };
}
function erroCampo(campo: HTMLElement, msg: string | null): void {
  const inp = campo.querySelector<HTMLInputElement>('input')!, e = campo.querySelector<HTMLElement>('.id__erro');
  campo.classList.toggle('is-erro', !!msg);
  if (msg) { inp.setAttribute('aria-invalid', 'true'); if (e) { e.innerHTML = `${L(circleAlert)}${msg}`; e.hidden = false; inp.setAttribute('aria-describedby', e.id || ''); } abanar(campo); inp.focus(); }
  else { inp.removeAttribute('aria-invalid'); if (e) e.hidden = true; }
}
/** O aviso de credenciais erradas, posto por cima do formulário (o mesmo do estado 02.2). */
function avisoCredenciais(form: HTMLElement): void {
  form.parentElement!.querySelector('.id__aviso--erro')?.remove();
  form.insertAdjacentHTML('beforebegin', `<div class="id__aviso id__aviso--erro" role="alert">${L(circleAlert)}<div><b>O e-mail ou a palavra-passe não estão certos.</b><span>Confirma os dois e tenta outra vez.</span></div></div>`);
  const a = form.previousElementSibling; if (a && !quieto()) a.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200 });
}

async function submeter(form: HTMLFormElement): Promise<void> {
  const tipo = form.dataset.idForm, b = form.querySelector<HTMLButtonElement>('button[type="submit"]'); if (!b || b.disabled) return;
  if (tipo === 'correio' || tipo === 'recuperar') {
    const campo = form.querySelector<HTMLElement>('.id__campo')!, v = campo.querySelector<HTMLInputElement>('input')!.value.trim();
    if (!valido(v)) { erroCampo(campo, v ? 'Escreve o e-mail completo, como nome@empresa.pt.' : 'Escreve o teu e-mail.'); return; }
    erroCampo(campo, null);
    const repor = await ocupar(b, tipo === 'correio' ? 'A verificar…' : 'A enviar…', 500); repor();
    if (tipo === 'recuperar') { ir('recuperar-enviado'); return; }
    try { sessionStorage.setItem(CHAVE, v); } catch { /* fica o de exemplo */ }
    ir('palavra-passe');
    requestAnimationFrame(() => { const id = vivo(); id?.querySelectorAll<HTMLElement>('[data-id-correio]').forEach((x) => { x.textContent = v; }); id?.querySelector<HTMLInputElement>('input[name="passe"]')?.focus(); });
    return;
  }
  if (tipo === 'passe') {
    const inp = form.querySelector<HTMLInputElement>('input[name="passe"]')!;
    if (!inp.value) { abanar(inp.closest('.id__campo')); inp.focus(); return; }
    const repor = await ocupar(b, 'A entrar…', 700); repor();
    if (inp.value.toLowerCase() === 'errada') { avisoCredenciais(form); inp.value = ''; inp.closest('.id__campo')?.classList.add('is-erro'); inp.focus(); return; }
    ir('aplicacoes');
    return;
  }
  if (tipo === 'restaurada') { const repor = await ocupar(b, 'A entrar…', 400); repor(); ir('aplicacoes'); }
}

async function abrir(b: HTMLButtonElement): Promise<void> {
  b.disabled = true; b.setAttribute('aria-busy', 'true');
  const ab = b.querySelector<HTMLElement>('.id-app__abrir'); if (ab) ab.innerHTML = `${roda}A abrir…`;
  await espera(600);
  /* (22 out.) leva o modo em que se está (só o ecrã, a demonstração) para a app que se abre */
  const [pagina, hash = ''] = (b.dataset.idAbrir || '').split('#'), h = new URLSearchParams(location.hash.slice(1)), q = new URLSearchParams(hash);
  ['so', 'demo', 'anim'].forEach((k) => { const v = h.get(k); if (v) q.set(k, v); });
  location.href = `../${pagina}#${q.toString()}`;
}

export function iniciar(): void {
  /* a abertura: uma vez por visita (depois, a cena fica parada) */
  window.setTimeout(() => document.documentElement.classList.add('id-ja-abriu'), 1600);
  document.addEventListener('submit', (ev) => {
    const form = (ev.target as Element).closest?.<HTMLFormElement>('.id [data-id-form]'); if (!form) return;
    ev.preventDefault(); if (editando()) return;
    void submeter(form);
  });
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const ver = t.closest?.<HTMLButtonElement>('.id [data-id-ver]');
    if (ver) {
      const inp = ver.parentElement!.querySelector<HTMLInputElement>('input')!, mostra = inp.type === 'password';
      inp.type = mostra ? 'text' : 'password'; ver.setAttribute('aria-pressed', String(mostra)); ver.setAttribute('aria-label', mostra ? 'Esconder a palavra-passe' : 'Mostrar a palavra-passe');
      ver.innerHTML = L(mostra ? eyeOff : eye); inp.focus(); return;
    }
    const ab = t.closest?.<HTMLButtonElement>('.id [data-id-abrir]'); if (ab) { void abrir(ab); return; }
    const tentar = t.closest?.<HTMLButtonElement>('.id [data-id-tentar]');
    if (tentar) { void ocupar(tentar, 'A tentar…', 800).then((repor) => { repor(); tentar.closest('.id__aviso')?.remove(); }); }
  });
  /* as maiúsculas ligadas, na palavra-passe */
  document.addEventListener('keyup', (ev) => {
    const t = ev.target as HTMLInputElement; if (!t.matches?.('.id input[name="passe"]')) return;
    const c = t.closest('.id__campo')?.querySelector<HTMLElement>('[data-id-caps]'); if (c) c.hidden = !ev.getModifierState?.('CapsLock');
  });
}
