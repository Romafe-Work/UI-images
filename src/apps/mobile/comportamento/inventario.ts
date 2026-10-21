/* =========================================================
   PICK — o que mexe no Inventário (21 out. 2026)
   - O leitor: no EDA61K a leitura chega pela Data Collection Intent API quando se prime a tecla física; aqui,
     tocar na área do leitor faz de tecla. A leitura certa dá um apito curto e agudo, uma vibração de 40 ms e o
     verde por 180 ms; depois segue (sem esperar pela animação). Na contagem à unidade, cada leitura soma 1.
   - A quantidade: − e +, o teclado do ecrã (e o físico), «Limpar» e «Apagar»; um número que não é inteiro num
     artigo à unidade diz porquê e desliga «Confirmar». Enter confirma.
   Com «reduzir movimento», sem animações (o som e a vibração ficam: são o retorno da leitura).
   ========================================================= */
import { mostrar } from '../../../comum/ecras';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
let audio: AudioContext | null = null;
/** O apito: certo (curto, agudo) ou erro (dois graves). */
function apitar(certo: boolean): void {
  try {
    audio ??= new AudioContext();
    const tons = certo ? [[1850, 0, .07]] : [[320, 0, .12], [320, .16, .12]];
    tons.forEach(([f, t, d]) => { const o = audio!.createOscillator(), g = audio!.createGain(); o.frequency.value = f; o.type = 'square'; g.gain.value = .05; o.connect(g).connect(audio!.destination); o.start(audio!.currentTime + t); o.stop(audio!.currentTime + t + d); });
  } catch { /* sem som */ }
  try { navigator.vibrate?.(certo ? 40 : [60, 60, 60]); } catch { /* sem vibração */ }
}
function qtdDe(el: Element): HTMLInputElement | null { return el.closest('.pk')?.querySelector<HTMLInputElement>('.iv-qtd__n') ?? null; }
function validar(inp: HTMLInputElement): void {
  const ok = /^\d+$/.test(inp.value.trim()) && Number(inp.value) >= 0;
  const caixa = inp.closest<HTMLElement>('.iv-qtd')!;
  caixa.classList.toggle('is-erro', !ok); inp.setAttribute('aria-invalid', String(!ok));
  let p = caixa.querySelector<HTMLElement>('.iv-qtd__erro');
  if (!ok && !p) { p = document.createElement('p'); p.className = 'iv-qtd__erro'; p.id = 'iv-qtd-erro'; p.setAttribute('role', 'alert'); p.textContent = 'Este artigo conta-se à unidade: escreva um número inteiro.'; caixa.querySelector('.iv-qtd__linha')!.after(p); inp.setAttribute('aria-describedby', 'iv-qtd-erro'); }
  if (ok && p) { p.remove(); inp.removeAttribute('aria-describedby'); }
  const b = inp.closest('.pk')?.querySelector<HTMLButtonElement>('[data-confirmar]'); if (b) b.disabled = !ok;
}
const mudou = (el: Element) => { el.classList.remove('is-mudou'); void (el as HTMLElement).offsetWidth; el.classList.add('is-mudou'); };

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const leitor = t.closest?.<HTMLElement>('.iv-leitor');
    if (leitor) {
      ev.preventDefault();
      apitar(true); mudou(leitor); leitor.classList.add('is-lido');
      if (leitor.dataset.tipoLeitura === 'unidade') { const s = leitor.closest('.pk')?.querySelector<HTMLElement>('[data-soma]'); if (s) { s.textContent = String(Number(s.textContent) + 1); mudou(s); const b = leitor.closest('.pk')?.querySelector('.pk__pe .btn__rotulo'); if (b) b.textContent = `Confirmar ${s.textContent} unidades`; } return; }
      const depois = leitor.dataset.depois; if (depois) window.setTimeout(() => mostrar(depois), 200);
      return;
    }
    const passo = t.closest?.<HTMLElement>('[data-qtd-passo]');
    if (passo) { const i = qtdDe(passo); if (!i) return; const n = Math.max(0, (parseInt(i.value, 10) || 0) + Number(passo.dataset.qtdPasso)); i.value = String(n); mudou(i); validar(i); return; }
    const tecla = t.closest?.<HTMLElement>('[data-tecla]');
    if (tecla) {
      const i = qtdDe(tecla); if (!i) return; const k = tecla.dataset.tecla!;
      i.value = k === 'limpar' ? '' : k === 'apagar' ? i.value.slice(0, -1) : (i.value === '0' ? '' : i.value) + k;
      mudou(i); validar(i); return;
    }
  }, true);
  document.addEventListener('input', (ev) => { const i = ev.target as HTMLElement; if (i.matches?.('.iv-qtd__n')) validar(i as HTMLInputElement); });
  document.addEventListener('keydown', (ev) => {
    const i = ev.target as HTMLElement;
    if (ev.key === 'Enter' && i.matches?.('.iv-qtd__n')) { ev.preventDefault(); const b = i.closest('.pk')?.querySelector<HTMLButtonElement>('[data-confirmar]'); if (b && !b.disabled) { apitar(true); b.click(); } else apitar(false); }
  });
}
