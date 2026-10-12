/* =========================================================
   ROMAFE — a demonstração das animações (12 out. 2026)
   Ela: «quero implementar mesmo a demonstração de animação do Figma: a
   pessoa escolhe a animação que quer, pode ver o demo de cada ecrã, e
   abre num link externo». Como o modo de apresentação do Figma: no editor
   escolhe-se a animação e «Ver demonstração» abre um separador novo com o
   ecrã sozinho; lá, cada ligação (data-ir) leva ao ecrã seguinte com essa
   animação, e a barra de baixo troca de animação, anda pelo fluxo para a
   frente e para trás, e reproduz o fluxo inteiro sozinho.

   O endereço da demonstração: #so=ecra&demo=1&anim=<id>&ecra=<id>&v=<versão>
   — pode copiar-se e mandar a quem quiser ver.

   A animação é a View Transitions do navegador (demo.css diz como cada uma
   sai e entra). Sem ela, ou com «reduzir movimento», a troca é instantânea.
   ========================================================= */
import { ler, mostrar, mostrarVersao, definirTransicao, transitar, type Sentido } from './ecras';
import './css/demo.css';

export interface Animacao { id: string; nome: string; descricao: string }
export const ANIMACOES: Animacao[] = [
  { id: 'instantaneo', nome: 'Instantâneo', descricao: 'Troca sem animação.' },
  { id: 'dissolver', nome: 'Dissolver', descricao: 'Um ecrã desvanece-se no outro.' },
  { id: 'deslizar', nome: 'Deslizar', descricao: 'O novo entra de lado por cima do antigo.' },
  { id: 'empurrar', nome: 'Empurrar', descricao: 'O novo empurra o antigo para fora.' },
  { id: 'mover', nome: 'Mover por cima', descricao: 'O novo sobe de baixo, por cima do antigo.' },
  { id: 'aproximar', nome: 'Aproximar', descricao: 'O antigo cresce e some; o novo chega de perto.' },
  { id: 'virar', nome: 'Virar 3D', descricao: 'O ecrã vira como uma carta (o card 14 do shadcnspace).' },
  { id: 'cubo', nome: 'Rodar em cubo', descricao: 'Os dois ecrãs são faces de um cubo que roda.' },
];
const PADRAO = 'empurrar';
const CHAVE = 'romafe:demo:animacao';

export function animacaoGuardada(): string {
  try { return localStorage.getItem(CHAVE) || PADRAO; } catch { return PADRAO; }
}
export function guardarAnimacao(id: string): void {
  try { localStorage.setItem(CHAVE, id); } catch { /* sem armazenamento */ }
}

/** O endereço da demonstração de um ecrã, para abrir num separador novo. */
export function enderecoDemo(ecra: string, versao: string, anim: string): string {
  const p = ['so=ecra', 'demo=1', 'anim=' + encodeURIComponent(anim), 'ecra=' + encodeURIComponent(ecra)];
  if (versao) p.push('v=' + encodeURIComponent(versao));
  return location.origin + location.pathname + '#' + p.join('&');
}

/* ---------- na página da demonstração ---------- */
const raiz = document.documentElement;
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function escreverHash(chave: string, valor: string): void {
  const h = location.hash.replace(/^#/, '').split('&').filter((p) => p && p.indexOf(chave + '=') !== 0);
  h.push(chave + '=' + valor);
  try { history.replaceState(null, '', '#' + h.join('&')); } catch { /* ficheiro local */ }
}

function ecraVisivel(): HTMLElement | null { return document.querySelector<HTMLElement>('.ecra:not([hidden])'); }
/** Os ecrãs do mesmo fluxo do que se vê, pela ordem da app. */
function doFluxo(): HTMLElement[] {
  const e = ecraVisivel();
  const todos = Array.from(document.querySelectorAll<HTMLElement>('.ecra[data-ecra]'));
  return e ? todos.filter((x) => x.dataset.fluxo === e.dataset.fluxo) : todos;
}

const I = (d: string) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

let relogio: number | undefined;

export function iniciar(): void {
  if (ler('demo') !== '1') return;
  document.body.classList.add('demo');
  const inicial = ANIMACOES.some((a) => a.id === ler('anim')) ? ler('anim') : animacaoGuardada();
  raiz.dataset.anim = inicial;

  /* a versão com que cada ecrã foi aberto: ao voltar a ele, volta a essa
     (o endereço só guarda uma, e um ecrã só com v1 apagava a v2.3 do Início) */
  const versoes = new Map<string, string>();
  const lembrar = () => {
    const e = ecraVisivel();
    const v = e?.querySelector<HTMLElement>(':scope > .versao:not([hidden])')?.dataset.versao;
    if (e?.dataset.ecra && v && !versoes.has(e.dataset.ecra)) versoes.set(e.dataset.ecra, v);
  };
  lembrar();
  const repor = () => {
    const e = ecraVisivel();
    const v = e?.dataset.ecra ? versoes.get(e.dataset.ecra) : undefined;
    if (v) mostrarVersao(v); else lembrar();
  };

  /* a transição: a View Transitions do navegador, quando a há */
  definirTransicao((mudar0: () => void, sentido: Sentido) => {
    const mudar = () => { mudar0(); repor(); };
    raiz.dataset.sentido = sentido;
    const doc = document as Document & { startViewTransition?: (f: () => void) => unknown };
    if (!doc.startViewTransition || raiz.dataset.anim === 'instantaneo' || quieto()) { mudar(); pintar(); return; }
    doc.startViewTransition(() => { mudar(); pintar(); });
  });

  /* ---------- a barra de baixo ---------- */
  const barra = document.createElement('nav');
  barra.className = 'demo-barra';
  barra.setAttribute('aria-label', 'Demonstração');
  barra.innerHTML = `
    <span class="demo-barra__marca">${I('<polygon points="6 4 20 12 6 20 6 4"/>')}Demonstração</span>
    <label class="demo-barra__anim"><span>Animação</span>
      <select class="demo-barra__select">${ANIMACOES.map((a) => `<option value="${a.id}"${a.id === inicial ? ' selected' : ''}>${a.nome}</option>`).join('')}</select>
    </label>
    <button type="button" class="demo-barra__botao" data-demo="ant">${I('<path d="m15 5-7 7 7 7"/>')}<span>Anterior</span></button>
    <span class="demo-barra__onde" aria-live="polite"></span>
    <button type="button" class="demo-barra__botao" data-demo="seg"><span>Seguinte</span>${I('<path d="m9 5 7 7-7 7"/>')}</button>
    <button type="button" class="demo-barra__botao demo-barra__botao--acao" data-demo="tocar">${I('<polygon points="6 4 20 12 6 20 6 4"/>')}<span>Reproduzir o fluxo</span></button>
    <button type="button" class="demo-barra__botao" data-demo="copiar">${I('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>')}<span>Copiar o link</span></button>
    <p class="demo-barra__dica"></p>`;
  document.body.appendChild(barra);

  const select = barra.querySelector<HTMLSelectElement>('.demo-barra__select')!;
  const dica = barra.querySelector<HTMLElement>('.demo-barra__dica')!;
  select.addEventListener('change', () => {
    raiz.dataset.anim = select.value;
    escreverHash('anim', select.value);
    guardarAnimacao(select.value);
    pintar();
  });

  function passo(d: 1 | -1): void {
    const lista = doFluxo();
    const i = lista.indexOf(ecraVisivel()!);
    const alvo = lista[(i + d + lista.length) % lista.length];
    if (alvo?.dataset.ecra) transitar(() => { mostrar(alvo.dataset.ecra!); }, d === 1 ? 'frente' : 'tras');
  }
  function parar(): void {
    window.clearInterval(relogio); relogio = undefined;
    const b = barra.querySelector<HTMLElement>('[data-demo="tocar"]')!;
    b.innerHTML = `${I('<polygon points="6 4 20 12 6 20 6 4"/>')}<span>Reproduzir o fluxo</span>`;
  }
  barra.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<HTMLElement>('[data-demo]');
    if (!b) return;
    const o = b.dataset.demo;
    if (o === 'ant') { parar(); passo(-1); }
    else if (o === 'seg') { parar(); passo(1); }
    else if (o === 'tocar') {
      if (relogio) { parar(); return; }
      b.innerHTML = `${I('<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>')}<span>Parar</span>`;
      passo(1);
      relogio = window.setInterval(() => passo(1), 2600);
    } else if (o === 'copiar') {
      const t = location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => { dica.textContent = 'Link copiado.'; });
    }
  });
  document.addEventListener('keydown', (ev) => {
    if ((ev.target as Element).closest('input, select, textarea')) return;
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown') { parar(); passo(1); }
    if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { parar(); passo(-1); }
  });

  function pintar(): void {
    const lista = doFluxo();
    const e = ecraVisivel();
    const onde = barra.querySelector<HTMLElement>('.demo-barra__onde')!;
    onde.textContent = e ? `${e.dataset.nome || e.dataset.ecra} · ${lista.indexOf(e) + 1} de ${lista.length}` : '';
    const a = ANIMACOES.find((x) => x.id === raiz.dataset.anim);
    dica.textContent = (a ? a.descricao + ' ' : '') + 'Clique nas ligações do ecrã, ou use ← e →.';
  }
  pintar();
}
