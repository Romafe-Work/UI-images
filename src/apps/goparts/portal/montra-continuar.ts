/* =========================================================
   PEÇA A PEÇA — 10 · Início v8 (25 nov. 2026): «Continuar de onde ficaste», mais wow
   Ela: «quero esta parte mais wow». Os mesmos três (o pedido em curso, o veículo favorito, a lista em rascunho),
   só com o que os dados têm, mas cada um contado a sério:
   - o pedido, grande à esquerda: a rota do armazém até à oficina com as horas reais do percurso; a carrinha anda
     até à etapa em que o pedido está quando a secção entra no ecrã (e a estrada enche atrás dela); a nota da
     etapa seguinte (o que ainda falta) por baixo;
   - o carro, em traço, que se desenha ao entrar; ao passar o rato as rodas rodam; a matrícula como a portuguesa;
   - a lista, as peças em leque (abrem ao passar o rato), o total e quantas há no Porto.
   Só transformações e opacidade (nada mexe a página); sem brilhos; com movimento reduzido, tudo parado no fim.
   CSS: css/montra-continuar.css. Os cliques são os da v7 (data-abrir-pedido, data-pecas-matricula, data-pn-atalho).
   ========================================================= */
import packageIcon from 'lucide-static/icons/package.svg?raw';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import wrench from 'lucide-static/icons/wrench.svg?raw';
import { LINHAS_TODAS, euros } from './painel-dados';
import { GARAGEM, nomeCarro, L } from './inicio-espaco';
import { LISTAS } from './lista';
import { azulejoPeca } from './pecas-img';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Um hatchback de perfil, em traço (pathLength=1 para se desenhar); as rodas são grupos que rodam. */
const roda = (cx: number) => `<g class="mtc-roda" style="transform-origin:${cx}px 96px"><circle cx="${cx}" cy="96" r="17" pathLength="1"/><circle cx="${cx}" cy="96" r="7" pathLength="1"/><path d="M${cx} 79v10M${cx} 103v10M${cx - 17} 96h10M${cx + 7} 96h10" pathLength="1"/></g>`;
const CARRO = `<svg class="mtc-carro" viewBox="0 0 300 124" fill="none" aria-hidden="true">
  <path class="mtc-traco" pathLength="1" d="M18 96h22M84 96h132M260 96h18c6 0 8-4 8-9v-14c0-6-3-10-9-12l-34-9-30-25c-5-4-11-6-18-6H96c-8 0-14 3-19 8L52 54l-24 5c-8 2-12 7-12 14v15c0 5 1 8 2 8"/>
  <path class="mtc-traco mtc-fino" pathLength="1" d="M84 52l20-21c3-3 7-5 12-5h32v26zM158 26h28c6 0 10 2 14 5l22 21h-64z"/>
  <path class="mtc-traco mtc-fino" pathLength="1" d="M150 60v30M104 64h12M178 64h12M272 66h8M20 66h10"/>
  ${roda(62)}${roda(238)}
  <path class="mtc-chao" d="M6 114h288" pathLength="1"/>
</svg>`;

export function continuarV2(): string {
  const pedido = LINHAS_TODAS.find((x) => x.etapa.k !== 'concluido');
  const carro = GARAGEM.find((c) => c.favorito) ?? GARAGEM[0];
  const lista = LISTAS.find((l) => l.estado === 'rascunho');
  const cartoes: string[] = [];

  if (pedido) {
    const passos = pedido.p.percurso, n = passos.length;
    const k = Math.max(0, passos.reduce((a, [, q], i) => (q ? i : a), 0));
    const arts = [...pedido.p.artigos].sort((a, b) => (a[1] < a[0] ? -1 : 0) - (b[1] < b[0] ? -1 : 0) || b[3] - a[3]);
    const falta = passos.slice(k + 1).find(([, , nota]) => nota)?.[2] ?? passos[k][2] ?? '';
    cartoes.push(`<li class="mtc-pedido"><button type="button" class="mtc" data-abrir-pedido="${pedido.l.num}">
      <span class="mtc-topo">${L(packageIcon)}Pedido em curso<span class="mtc-estado">${esc(pedido.etapa.nome)}</span></span>
      <b class="mtc-num">${pedido.l.num}</b>
      <span class="mtc-meta">${pedido.artigos} ${pedido.artigos === 1 ? 'artigo' : 'artigos'} · <b>${euros(pedido.valor)}</b></span>
      <span class="mtc-rota" style="--n:${n};--k:${k}" aria-label="Etapa ${k + 1} de ${n}: ${esc(passos[k][0])}">
        <span class="mtc-pontas"><span>${L(warehouse)}Armazém ${esc(pedido.l.armazem.replace(/\s*\(\d+\)/, ''))}</span><span>A tua oficina${L(wrench)}</span></span>
        <span class="mtc-estrada" aria-hidden="true"><i class="mtc-cheia"></i><span class="mtc-viagem"><span class="mtc-carrinha">${L(truck)}</span></span></span>
        <span class="mtc-paragens">${passos.map(([nome, q], i) => `<span class="${i < k ? 'is-feita' : i === k ? 'is-atual' : ''}"><i></i><b>${esc(nome)}</b><small>${q ? esc(q) : '—'}</small></span>`).join('')}</span>
      </span>
      ${falta ? `<span class="mtc-falta">${esc(falta)}</span>` : ''}
      <span class="mtc-artigos">${arts.slice(0, 5).map(([q, e, nome]) => `<span class="${e < q ? 'is-falta' : ''}"><b>${esc(nome)}</b><small>${e < q ? `${e} de ${q}` : `${q} ${q === 1 ? 'un.' : 'un.'}`}</small><i style="--f:${q ? e / q : 1}"></i></span>`).join('')}${arts.length > 5 ? `<em>e mais ${arts.length - 5} ${arts.length - 5 === 1 ? 'linha' : 'linhas'}</em>` : ''}</span>
      <span class="mtc-acao">Ver o pedido${L(arrowRight, 'mt__seta')}</span>
    </button></li>`);
  }
  if (carro) {
    const [a, b] = carro.matricula.split(/-(.*)/s);
    cartoes.push(`<li class="mtc-veiculo"><button type="button" class="mtc" data-pecas-matricula="${carro.matricula}">
      <span class="mtc-topo">${L(carFront)}${carro.favorito ? 'Veículo favorito' : 'Na tua garagem'}</span>
      <span class="mtc-visual">${CARRO}</span>
      <span class="mtc-linha"><span><b class="mtc-t">${esc(nomeCarro(carro))}</b><span class="mtc-meta">${esc(carro.marca)} ${esc(carro.modelo)}</span></span>
        <span class="mtc-matricula" aria-label="Matrícula ${carro.matricula}"><i>P</i>${a}-${b}</span></span>
      <span class="mtc-acao">Ver peças compatíveis${L(arrowRight, 'mt__seta')}</span>
    </button></li>`);
  }
  if (lista) {
    const pecas = lista.pecas.filter((p) => p.ref);
    const total = pecas.reduce((s, p) => s + (p.liquido ?? 0) * p.qtd, 0);
    const noPorto = pecas.filter((p) => (p.porto ?? 0) > 0).length;
    const mostra = pecas.slice(0, 4);
    cartoes.push(`<li class="mtc-lista"><button type="button" class="mtc" data-pn-atalho="lista">
      <span class="mtc-topo">${L(listChecks)}Lista em rascunho</span>
      <span class="mtc-leque" style="--n:${mostra.length}" aria-hidden="true">${mostra.map((p, i) => `<span style="--i:${i}">${azulejoPeca(p.desc, 'mtc-peca', p.ref)}</span>`).join('')}${pecas.length > mostra.length ? `<em>+${pecas.length - mostra.length}</em>` : ''}</span>
      <span class="mtc-linha"><span><b class="mtc-t">${esc(lista.nome)}</b><span class="mtc-meta">${pecas.length} peças · ${esc(lista.atualizada)}</span></span>
        <span class="mtc-numero"><b>${euros(total)}</b><small>${noPorto} de ${pecas.length} no Porto</small></span></span>
      <span class="mtc-acao">Continuar a lista${L(arrowRight, 'mt__seta')}</span>
    </button></li>`);
  }
  if (!cartoes.length) return '';
  return `<section class="mt__sec mt__cont mtc-sec" aria-labelledby="mt-cont-t"><h2 class="mt__sec-t" id="mt-cont-t">Continuar de onde ficaste.</h2><ul class="mtc-grelha" role="list">${cartoes.join('')}</ul></section>`;
}
