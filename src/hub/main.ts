/* =========================================================
   ROMAFE — a porta de entrada
   As três apps e a procura. O catálogo sai das próprias apps: um ecrã
   acrescentado a uma app aparece aqui sem mais nada.
   ========================================================= */
import '../comum/css/tokens.css';
import '../comum/css/base.css';
import './hub.css';

import type { App } from '../comum/tipos';
import { iniciar as iniciarTema } from '../comum/tema';
import { erp } from '../apps/erp/app';
import { pecaapeca } from '../apps/pecaapeca/app';
import { partpicker } from '../apps/partpicker/app';
import { mobile } from '../apps/mobile/app';

const APPS: App[] = [erp, pecaapeca, partpicker, mobile];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string | null, txt?: string | null): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}

function ligacao(href: string, txt: string): HTMLAnchorElement {
  const a = el('a', null, txt);
  a.href = href;
  return a;
}

iniciarTema();

const apps = document.getElementById('apps') as HTMLElement;
APPS.forEach((a) => {
  const n = a.ecras.length;
  const card = n ? ligacao(a.id + '/', '') : el('div');
  card.className = 'app' + (n ? '' : ' app--vazia');
  /* a família só se escreve quando diz alguma coisa («Web» por cima do
     Peça a Peça); nas outras fica a linha em branco, para os nomes alinharem */
  card.appendChild(el('p', 'app__grupo', a.grupo === a.nome ? '\u00a0' : a.grupo));
  card.appendChild(el('p', 'app__nome', a.nome));
  card.appendChild(el('p', 'app__sub', a.sub));
  card.appendChild(el('p', 'app__conta', n ? n + (n === 1 ? ' ecrã' : ' ecrãs') : 'por começar'));
  apps.appendChild(card);
});

/* sem acentos e sem maiúsculas: «palavra passe» encontra «Palavra-passe» */
function limpo(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-·]/g, ' ').toLowerCase();
}

const res = document.getElementById('resultados') as HTMLElement;
const procura = document.getElementById('procura') as HTMLInputElement;

function mostrar(): void {
  const termos = limpo(procura.value).split(/\s+/).filter(Boolean);
  res.textContent = '';
  let algum = false;
  APPS.forEach((a) => {
    const achados = a.ecras.filter((e) => {
      const texto = limpo([a.nome, e.nome, e.fluxo, e.objetivo, e.id].join(' '));
      return termos.every((t) => texto.includes(t));
    });
    if (!achados.length) return;
    algum = true;
    const g = el('div', 'grupo');
    g.appendChild(el('h2', 'grupo__titulo', a.grupo === a.nome ? a.nome : a.grupo + ' · ' + a.nome));
    const ul = el('ul', 'lista');
    achados.forEach((e) => {
      const li = el('li'), txt = el('div'), acc = el('div', 'lista__accoes');
      const nome = el('p', 'lista__nome', e.nome);
      nome.appendChild(el('span', 'lista__fluxo', e.fluxo + ' · ' + e.versoes.map((v) => v.id).join(', ')));
      txt.appendChild(nome);
      if (e.objetivo) txt.appendChild(el('p', 'lista__obj', e.objetivo));
      acc.appendChild(ligacao(a.id + '/#so=ecra&ecra=' + encodeURIComponent(e.id), 'Ver'));
      acc.appendChild(ligacao(a.id + '/#ecra=' + encodeURIComponent(e.id), 'Editar'));
      li.append(txt, acc);
      ul.appendChild(li);
    });
    g.appendChild(ul);
    res.appendChild(g);
  });
  if (!algum) res.appendChild(el('p', 'vazio', 'Nenhum ecrã com «' + procura.value + '».'));
}

procura.addEventListener('input', mostrar);
mostrar();
