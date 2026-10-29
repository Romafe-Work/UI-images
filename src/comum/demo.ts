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
import { temRoteiro, roteiros, tocar as tocarRato, iniciar as iniciarRato } from './demo-rato';
import { iniciarEncaixe } from './demo-encaixar';

export interface Animacao { id: string; nome: string; descricao: string; grupo: string }
export const ANIMACOES: Animacao[] = [
  { grupo: 'Simples', id: 'instantaneo', nome: 'Instantâneo', descricao: 'Troca sem animação.' },
  { grupo: 'Simples', id: 'dissolver', nome: 'Dissolver', descricao: 'Um ecrã desvanece-se no outro.' },
  { grupo: 'Simples', id: 'desfocar', nome: 'Desfocar', descricao: 'O antigo desfoca-se e some; o novo entra a ganhar foco.' },
  { grupo: 'Deslizar', id: 'deslizar', nome: 'Deslizar', descricao: 'O novo entra de lado por cima do antigo.' },
  { grupo: 'Deslizar', id: 'empurrar', nome: 'Empurrar', descricao: 'O novo empurra o antigo para fora.' },
  { grupo: 'Deslizar', id: 'elastico', nome: 'Elástico', descricao: 'Empurrar, com o novo a passar um pouco e a voltar, como uma mola.' },
  { grupo: 'Deslizar', id: 'sair', nome: 'Deslizar para fora', descricao: 'O antigo sai de lado e deixa ver o novo por baixo.' },
  { grupo: 'Deslizar', id: 'mover', nome: 'Mover por cima', descricao: 'O novo sobe de baixo, por cima do antigo.' },
  { grupo: 'Deslizar', id: 'cartas', nome: 'Pilha de cartas', descricao: 'O antigo cai para trás como uma carta; o novo sobe para o topo da pilha.' },
  { grupo: 'Escala', id: 'aproximar', nome: 'Aproximar', descricao: 'O antigo cresce e some; o novo chega de perto.' },
  { grupo: 'Escala', id: 'afastar', nome: 'Afastar', descricao: 'O antigo encolhe para longe; o novo vem de mais perto.' },
  { grupo: '3D', id: 'virar', nome: 'Virar 3D', descricao: 'O ecrã vira como uma carta (o card 14 do shadcnspace).' },
  { grupo: '3D', id: 'virar-vertical', nome: 'Virar na vertical', descricao: 'Vira de cima para baixo, como uma folha de calendário.' },
  { grupo: '3D', id: 'cubo', nome: 'Rodar em cubo', descricao: 'Os dois ecrãs são faces de um cubo que roda.' },
  { grupo: '3D', id: 'porta', nome: 'Abrir a porta', descricao: 'O antigo abre-se pela aresta esquerda como uma porta, e o novo está atrás.' },
  { grupo: 'Revelar', id: 'circulo', nome: 'Revelar em círculo', descricao: 'O novo abre-se num círculo a partir do sítio onde se clicou.' },
  { grupo: 'Revelar', id: 'limpar', nome: 'Limpar', descricao: 'O novo passa por cima da esquerda para a direita, como um limpa-vidros.' },
  { grupo: 'Inteligente', id: 'inteligente', nome: 'Animação inteligente', descricao: 'Como o «Smart Animate» do Figma: a barra, as abas e o menu ficam ou vão para o sítio novo; só o conteúdo muda.' },
];

/** As opções de uma lista, agrupadas como no Figma (para o editor e para a barra). */
export function opcoesAnimacao(escolhida: string): string {
  const grupos = Array.from(new Set(ANIMACOES.map((a) => a.grupo)));
  return grupos.map((g) => `<optgroup label="${g}">${ANIMACOES.filter((a) => a.grupo === g).map((a) => `<option value="${a.id}" title="${a.descricao}"${a.id === escolhida ? ' selected' : ''}>${a.nome}</option>`).join('')}</optgroup>`).join('');
}
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

/* 28 out. (ela: «reproduzir fluxo no erp está mal no menu»): uma app pode trocar o que «Reproduzir o fluxo» percorre.
   Sem registo, anda pelos ecrãs do fluxo que se vê (como sempre); o ERP regista o menu lateral — o Início e cada ecrã do
   menu Compras, abertos pelo menu como faria quem trabalha (apps/erp/roteiro.ts). Cada passo traz o nome para a barra. */
export interface PassoReproducao { nome: string; fazer: () => void }
let reproducao: (() => PassoReproducao[]) | null = null;
export function registarReproducao(passos: () => PassoReproducao[]): void { reproducao = passos; }
let emCurso = '';

export function iniciar(): void {
  if (ler('demo') !== '1') return;
  document.body.classList.add('demo');
  iniciarEncaixe();
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

  /* de onde parte o «Revelar em círculo»: o sítio do último clique no ecrã */
  document.addEventListener('pointerdown', (ev) => {
    const naBarra = (ev.target as Element).closest('.demo-barra');
    raiz.style.setProperty('--demo-x', naBarra ? '50%' : ev.clientX + 'px');
    raiz.style.setProperty('--demo-y', naBarra ? '50%' : ev.clientY + 'px');
  }, true);

  /* ---------- a barra de baixo ---------- */
  const barra = document.createElement('nav');
  barra.className = 'demo-barra';
  barra.setAttribute('aria-label', 'Demonstração');
  barra.innerHTML = `
    <span class="demo-barra__marca">${I('<polygon points="6 4 20 12 6 20 6 4"/>')}Demonstração</span>
    <label class="demo-barra__anim"><span>Animação</span>
      <select class="demo-barra__select">${opcoesAnimacao(inicial)}</select>
    </label>
    <button type="button" class="demo-barra__botao" data-demo="ant">${I('<path d="m15 5-7 7 7 7"/>')}<span>Anterior</span></button>
    <span class="demo-barra__onde" aria-live="polite"></span>
    <button type="button" class="demo-barra__botao" data-demo="seg"><span>Seguinte</span>${I('<path d="m9 5 7 7-7 7"/>')}</button>
    <button type="button" class="demo-barra__botao demo-barra__botao--acao" data-demo="tocar">${I('<polygon points="6 4 20 12 6 20 6 4"/>')}<span>Reproduzir o fluxo</span></button>
    ${roteiros().length > 1 ? `<label class="demo-barra__anim"><span>Com o rato</span><select class="demo-barra__select demo-barra__roteiro" aria-label="Que demonstração ver com o rato">${roteiros().map(([id, t]) => `<option value="${id}">${t}</option>`).join('')}</select></label>` : ''}
    ${temRoteiro() ? `<button type="button" class="demo-barra__botao demo-barra__botao--acao" data-demo="rato">${I('<path d="M4 2v17l4.6-4.2 3 6.6 3-1.4-3-6.4H18Z"/>')}<span>Ver o fluxo com o rato</span></button>` : ''}
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
    if (emCurso) { emCurso = ''; pintar(); }
    const b = barra.querySelector<HTMLElement>('[data-demo="tocar"]')!;
    b.innerHTML = `${I('<polygon points="6 4 20 12 6 20 6 4"/>')}<span>Reproduzir o fluxo</span>`;
  }
  barra.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<HTMLElement>('[data-demo]');
    if (!b) return;
    const o = b.dataset.demo;
    if (o === 'ant') { parar(); passo(-1); }
    else if (o === 'seg') { parar(); passo(1); }
    else if (o === 'rato') { parar(); void tocarRato(barra.querySelector<HTMLSelectElement>('.demo-barra__roteiro')?.value || undefined); }
    else if (o === 'tocar') {
      if (relogio) { parar(); return; }
      b.innerHTML = `${I('<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>')}<span>Parar</span>`;
      const lista = reproducao?.() ?? [];
      if (lista.length) {
        let i = 0;
        const dar = () => { const p = lista[i]; emCurso = `${p.nome} · ${i + 1} de ${lista.length}`; i = (i + 1) % lista.length; p.fazer(); pintar(); };
        dar();
        relogio = window.setInterval(dar, 2600);
        return;
      }
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

  /* 28 out. (ela: «na simulação do fluxo da app do gestor diz ao lado o que está a acontecer, em pt»): nas apps de
     telemóvel, um painel ao lado da moldura diz o ecrã que se vê e para que serve (o objetivo dele, ou o do estado);
     com o rato a tocar, a legenda do roteiro ocupa o mesmo lugar (css/demo.css). */
  const lado = raiz.classList.contains('tela-telemovel') ? document.createElement('aside') : null;
  if (lado) { lado.className = 'demo-lado'; lado.setAttribute('aria-live', 'polite'); lado.setAttribute('aria-label', 'O que está a acontecer'); document.body.appendChild(lado); }
  const escapar = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  function pintarLado(e: HTMLElement | null): void {
    if (!lado || !e) return;
    const pai = e.dataset.estadoDe ? document.querySelector<HTMLElement>(`.ecra[data-ecra="${e.dataset.estadoDe}"]`) : null;
    lado.innerHTML = `<p class="demo-lado__fluxo">${escapar(e.dataset.fluxo || '')}</p><h2 class="demo-lado__t">${escapar(e.dataset.nome || e.dataset.ecra || '')}</h2>
      ${pai ? `<p class="demo-lado__de">Um estado de ${escapar(pai.dataset.nome || '')}</p>` : ''}<p class="demo-lado__o">${escapar(e.dataset.objetivo || '')}</p>`;
    if (!quieto()) lado.animate([{ opacity: .4, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 200, easing: 'ease-out' });
  }

  function pintar(): void {
    const lista = doFluxo();
    const e = ecraVisivel();
    pintarLado(e);
    const onde = barra.querySelector<HTMLElement>('.demo-barra__onde')!;
    onde.textContent = emCurso || (e ? `${e.dataset.nome || e.dataset.ecra} · ${lista.indexOf(e) + 1} de ${lista.length}` : '');
    const a = ANIMACOES.find((x) => x.id === raiz.dataset.anim);
    dica.textContent = (a ? a.descricao + ' ' : '') + 'Clique nas ligações do ecrã, ou use ← e →.';
  }
  pintar();
  document.addEventListener('romafe:mostrado', () => pintar());
  /* 27 out.: o rato que clica nos botões (demo-rato.ts); &rato=1 começa sozinho */
  iniciarRato();
}
