/* =========================================================
   PEÇA A PEÇA — 18 · Pesquisar peças v2 (25 nov. 2026): «Em destaque»
   Ela: «aqui no peça a peça coloca insights». Um bloco ao lado das Peças frequentes, no espaço que ficava vazio
   por baixo de «Continuar onde fiquei». Nada é inventado: cada destaque conta-se dos dados de exemplo do portal —
   os pedidos (o que mais se compra, o que ainda não saiu) e o catálogo (stock no Porto e em Sacavém, a mesma
   peça de outro fabricante mais barata). Cada um com uma ação só.
   ========================================================= */
import trendingUp from 'lucide-static/icons/trending-up.svg?raw';
import packageOpen from 'lucide-static/icons/package-open.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import lightbulb from 'lucide-static/icons/lightbulb.svg?raw';
import { PEDIDOS } from './pedidos-dados';
import { REFERENCIAS, euros } from './catalogo-dados';
import { L } from './inicio-espaco';

/** As famílias das linhas dos pedidos (pela primeira palavra que bate). */
const FAMILIAS: [string, RegExp][] = [
  ['rolamentos', /rolamento/i], ['amortecedores', /amortecedor/i], ['travagem', /trav|pastilha|disco/i],
  ['distribuição', /distribui|correia|tensor|bomba de água/i], ['embraiagem', /embraiagem|cilindro recetor/i], ['filtros', /filtro/i],
];
const pct = (n: number) => `${Math.round(n * 100)} %`;
const liquido = (pvp: number, desconto: number) => Math.round(pvp * (1 - desconto / 100) * 100) / 100;

type Destaque = { tom: 'azul' | 'verde' | 'laranja' | 'vermelho'; ic: string; titulo: string; texto: string; acao: string; dados: string };

export function destaques(): Destaque[] {
  const out: Destaque[] = [];
  /* 1. o que mais se compra (em valor) */
  const soma = new Map<string, number>(); let total = 0;
  for (const p of PEDIDOS) for (const [, , nome, v] of p.artigos) { total += v; const f = FAMILIAS.find(([, re]) => re.test(nome))?.[0]; if (f) soma.set(f, (soma.get(f) ?? 0) + v); }
  const [fam, val] = [...soma].sort((a, b) => b[1] - a[1])[0];
  out.push({ tom: 'azul', ic: trendingUp, titulo: `Os ${fam} são ${pct(val / total)} do que compras`, texto: `${euros(val)} em ${PEDIDOS.length} pedidos. Vê o catálogo desta família.`, acao: `Ver ${fam}`, dados: ' data-ir="catalogo"' });
  /* 2. os pedidos que ainda não saíram */
  const parados = PEDIDOS.filter((p) => p.percurso.some(([n, q]) => /levantar/i.test(n) && !q) && !p.guia);
  if (parados.length) out.push({ tom: 'laranja', ic: packageOpen, titulo: `${parados.length} ${parados.length === 1 ? 'pedido ainda não saiu' : 'pedidos ainda não saíram'}`, texto: parados.map((p) => `${p.num}: ${(p.percurso.find(([, q, nota]) => !q && nota)?.[2] ?? p.percurso.find(([, , nota]) => nota)?.[2] ?? 'em separação').toLowerCase()}`).join(' · '), acao: 'Ver pedidos', dados: ' data-ir="pedidos"' });
  /* 3. stock a acabar: pouco no Porto e nada em Sacavém */
  const pouco = REFERENCIAS.filter(([, , , , , , porto, sac]) => porto > 0 && porto <= 6 && !sac).sort((a, b) => a[6] - b[6]).find(([g]) => /rolamento/i.test(g)) ?? REFERENCIAS.find(([, , , , , , porto, sac]) => porto > 0 && porto <= 6 && !sac);
  if (pouco) out.push({ tom: 'vermelho', ic: triangleAlert, titulo: `${pouco[1]} ${pouco[2]}: restam ${pouco[6]} no Porto`, texto: `Em Sacavém não há. ${pouco[3]}.`, acao: 'Ver stock', dados: ` data-continuar="ref" data-fab="${pouco[1]}" data-ref="${pouco[2]}"` });
  /* 4. a mesma peça de outro fabricante, mais barata (o mesmo grupo e a mesma descrição) */
  let melhor: { cara: (typeof REFERENCIAS)[number]; barata: (typeof REFERENCIAS)[number]; poupa: number } | null = null;
  for (const a of REFERENCIAS) for (const b of REFERENCIAS) {
    if (a === b || a[0] !== b[0] || a[3] !== b[3] || a[1] === b[1]) continue;
    const poupa = liquido(a[4], a[5]) - liquido(b[4], b[5]);
    if (poupa > 0 && b[6] > 0 && (!melhor || poupa > melhor.poupa)) melhor = { cara: a, barata: b, poupa };
  }
  if (melhor) { const { cara, barata, poupa } = melhor; out.push({ tom: 'verde', ic: arrowLeftRight, titulo: `${barata[1]} ${barata[2]} poupa ${euros(poupa)} por unidade`, texto: `É equivalente à ${cara[1]} ${cara[2]} (${euros(liquido(cara[4], cara[5]))}): ${euros(liquido(barata[4], barata[5]))}, no Porto hoje.`, acao: 'Comparar', dados: ` data-continuar="ref" data-fab="${barata[1]}" data-ref="${barata[2]}"` }); }
  return out;
}

export function destaquesHtml(): string {
  return `<section class="ini4__bloco ini4__bloco--meio ini4__bloco--destaques pqd" aria-labelledby="pqd-t" style="order:1">
    <header class="ini4__bloco-cabeca"><h2 id="pqd-t">${L(lightbulb)}Em destaque</h2></header>
    <ul class="pqd__lista">${destaques().map((d, i) => `<li style="--i:${i}"><button type="button" class="pqd__item pqd--${d.tom}"${d.dados}>
      <span class="pqd__icone">${L(d.ic)}</span>
      <span class="pqd__texto"><b>${d.titulo}</b><span>${d.texto}</span></span>
      <span class="pqd__acao">${d.acao}${L(arrowRight)}</span>
    </button></li>`).join('')}</ul>
  </section>`;
}
