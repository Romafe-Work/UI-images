/* =========================================================
   ROMAFE — qual ecrã se vê, e o protótipo

   #ecra=menu          abre nesse ecrã (o editor também o lê)
   #ecra=menu&v=v1     e nessa versão; sem v, abre na mais nova
   #so=ecra&ecra=menu  esse ecrã sem a moldura do editor
   #so=fluxo           só o mapa de navegação
   #doc=fluxo          o editor, já no mapa

   Fora do editor, os ecrãs funcionam como protótipo: clicar numa peça com
   data-ir leva ao ecrã que ela diz. No editor o clique escolhe a peça, e o
   ecrã a que ela leva está no painel de propriedades.
   ========================================================= */
import { fluxo } from './fluxo';

export function ler(chave: string): string {
  const m = new RegExp('(?:^|[#&])' + chave + '=([^&]+)').exec(location.hash);
  return m ? decodeURIComponent(m[1]) : '';
}

function existe(nome: string | undefined): nome is string {
  return !!(nome && document.querySelector('.ecra[data-ecra="' + nome + '"]'));
}

function escreverEndereco(chave: string, valor: string): void {
  const h = location.hash.replace(/^#/, '').split('&').filter((p) => p && p.indexOf(chave + '=') !== 0);
  if (valor) h.push(chave + '=' + valor);
  try { history.replaceState(null, '', '#' + h.join('&')); } catch { /* ficheiro local */ }
}

function ecraActual(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.ecra:not([hidden])');
}

/* ---------------- versões ----------------
   Cada ecrã tem uma ou mais versões (v1, v2…). Os separadores em cima
   escolhem qual se vê; ao passar a outro ecrã, fica-se na mesma versão se
   ele a tiver, senão na mais nova dele. */
let barra: HTMLElement | null = null;

export function mostrarVersao(v: string): void {
  const e = ecraActual();
  if (!e) return;
  const versoes = Array.from(e.querySelectorAll<HTMLElement>(':scope > .versao'));
  if (!versoes.length) return;
  const alvo = versoes.find((x) => x.dataset.versao === v) || versoes[versoes.length - 1];
  versoes.forEach((x) => { x.hidden = x !== alvo; });
  escreverEndereco('v', alvo.dataset.versao || '');
  pintarBarra();
  document.dispatchEvent(new CustomEvent('romafe:versao'));
}

/* Onde ficam os separadores: no editor, no painel da esquerda, por baixo
   de Ecrãs · Fluxo, uma linha por versão com a nota (ela, 8 out. 2026).
   Sem o editor (#so=ecra): na barra de topo do ecrã, ao lado de Claro ·
   Escuro · Auto, quando o ecrã a tem; senão a flutuar por cima dele. */
export function pintarBarra(): void {
  if (!barra) return;
  const e = ecraActual();
  const versoes = e ? Array.from(e.querySelectorAll<HTMLElement>(':scope > .versao')) : [];
  const actual = versoes.find((x) => !x.hidden);
  const painel = document.querySelector<HTMLElement>('.ed-painel--esq .ed-vistas');
  if (painel) {
    barra.textContent = '';
    barra.className = 'versoes versoes--painel';
    painel.after(barra);
    const rot = document.createElement('p');
    rot.className = 'versoes__rotulo';
    rot.textContent = 'Versões · ' + versoes.length;
    barra.appendChild(rot);
    versoes.forEach((x) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'versoes__linha';
      b.setAttribute('aria-pressed', String(x === actual));
      b.innerHTML = '<span class="versoes__id"></span><span class="versoes__texto"></span>';
      b.querySelector('.versoes__id')!.textContent = x.dataset.versao || '';
      b.querySelector('.versoes__texto')!.textContent = x.dataset.nota || '';
      b.title = b.textContent || '';
      b.addEventListener('click', () => mostrarVersao(x.dataset.versao || ''));
      barra!.appendChild(b);
    });
    return;
  }
  const topo = actual?.querySelector<HTMLElement>('.topo__accoes');

  barra.textContent = '';
  barra.className = topo ? 'versoes versoes--topo segmented' : 'versoes';
  if (topo) topo.insertBefore(barra, topo.firstChild);
  else document.body.appendChild(barra);

  if (!topo) {
    const rot = document.createElement('span');
    rot.className = 'versoes__rotulo';
    rot.textContent = 'Versões';
    barra.appendChild(rot);
  }
  versoes.forEach((x) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = topo ? 'segmented__btn' : 'versoes__aba';
    b.textContent = x.dataset.versao || '';
    b.title = (x.dataset.versao || '') + ' · ' + (x.dataset.nota || '');
    b.setAttribute('aria-pressed', String(x === actual));
    b.addEventListener('click', () => mostrarVersao(x.dataset.versao || ''));
    barra!.appendChild(b);
  });
  if (!topo) {
    const nota = document.createElement('span');
    nota.className = 'versoes__nota';
    nota.textContent = actual?.dataset.nota || '';
    barra.appendChild(nota);
  }
}

export function mostrar(nome: string): boolean {
  if (!existe(nome)) return false;
  document.querySelectorAll<HTMLElement>('.ecra').forEach((e) => {
    e.hidden = e.dataset.ecra !== nome;
  });
  /* o endereço diz onde se está, para recarregar e voltar ao mesmo ecrã */
  escreverEndereco('ecra', nome);
  mostrarVersao(ler('v'));
  window.scrollTo(0, 0);
  return true;
}

export function iniciar(): void {
  barra = document.createElement('nav');
  barra.className = 'versoes';
  barra.setAttribute('aria-label', 'Versões do ecrã');
  document.body.appendChild(barra);

  const pedido = ler('ecra');
  if (existe(pedido)) mostrar(pedido);
  else mostrarVersao(ler('v'));

  const so = ler('so');
  if (so) document.body.classList.add('so-' + so);

  /* O protótipo. Corre na fase de captura, antes do comportamento de cada
     ecrã, para a navegação ganhar à recusa de exemplo. */
  document.addEventListener('click', (ev) => {
    if (document.body.classList.contains('editando')) return;
    if (document.body.classList.contains('com-fluxo')) return;
    const peca = (ev.target as Element).closest?.<HTMLElement>('[data-ir]');
    if (!peca || !existe(peca.dataset.ir)) return;
    ev.preventDefault();
    ev.stopPropagation();
    mostrar(peca.dataset.ir);
  }, true);

  if (so === 'fluxo') fluxo.ligar({});
}
