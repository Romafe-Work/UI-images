/* =========================================================
   ERP — as demonstrações com o rato (28 out. 2026)
   Ela: «faz a mesma demonstração de casos no erp com rato mas sem texto». Os casos das Compras, um por roteiro, só
   com o rato e os cliques verdadeiros (semTexto): a partir do Início, abre-se o ecrã pelo menu lateral e o rato
   trabalha dentro do separador (separador: true). Escolhe-se em «Com o rato», na barra da demonstração.
   Link para mandar: …/erp/#so=ecra&demo=1&anim=dissolver&ecra=inicio&rato=<id>
   ========================================================= */
import { registarRoteiro, type Passo } from '../../comum/demo-rato';
import { registarReproducao, type PassoReproducao } from '../../comum/demo';
import { mostrar, mostrarVersao } from '../../comum/ecras';

const SEM = { semTexto: true };
/** Abre um item do menu lateral (no Início) e espera que o separador carregue. */
const menu = (rota: string): Passo => ({ legenda: '', clicar: `.dk7-i[data-dk-atalho="${rota}"]`, pausa: 1800 });
/** Um clique dentro do separador ativo. */
const sep = (clicar: string, pausa = 0): Passo => ({ legenda: '', clicar, separador: true, pausa });

/* 28 out. (ela: «melhora o fluxo no erp!!!»): cada caso acaba no resultado à vista — a encomenda com as linhas novas,
   a ficha com as receções — e as janelas fecham-se antes de passar ao seguinte, como faria quem trabalha */
registarRoteiro('erp-faltas', 'Lista de Faltas: da falta à encomenda', [
  { ecra: 'inicio', ...menu('compras.faltas') },
  sep('tr[data-lf2-ref="0 986 424 797"]', 1200),
  sep('[data-lf2-jan-acao="fechar"]'),
  sep('tr[data-lf2-ref="0 986 424 797"] [data-lf2-escolher]'),
  sep('tr[data-lf2-ref="0 986 494 524"] [data-lf2-escolher]'),
  sep('[data-lf2-acao="para-encomenda"]', 1600),
  sep('[data-lf2-acao="encomenda"]', 1800),
  sep('[data-dv2-jan-tab="linhas"]', 600),
  sep('[data-dv2-jan-acao="max"]', 2200),
  { legenda: '' },
], SEM);

registarRoteiro('erp-encomendas', 'Encomendas: uma encomenda e as quatro vistas', [
  { ecra: 'inicio', ...menu('compras.encomendas') },
  sep('tr[data-dv2-id="EF 2026/0411"]', 1000),
  sep('[data-dv2-jan-tab="linhas"]', 900),
  sep('[data-dv2-jan-tab="rececoes"]', 1200),
  sep('[data-dv2-jan-acao="fechar"]'),
  sep('[data-dv2-vista="agenda"]', 900),
  sep('[data-dv2-acao="ag-modo"][data-m="cal"]', 1200),
  sep('[data-dv2-vista="clientes"]', 1000),
  sep('[data-dv2-vista="rececoes"]', 1000),
  sep('[data-dv2-vista="docs"]'),
  sep('[data-dv2-acao="novo"]', 1500),
  { legenda: '' },
], SEM);

registarRoteiro('erp-orcamentos', 'Orçamentos: da proposta à encomenda', [
  { ecra: 'inicio', ...menu('compras.cotacoes') },
  sep('[data-dv2-modo="data"]', 600),
  sep('tr[data-dv2-id="PC 2026/0016|gates"]', 1200),
  sep('[data-dv2-jan-acao="fechar"]'),
  sep('tr[data-dv2-id="PC 2026/0017|skf"]', 900),
  sep('[data-dv2-jan-tab="linhas"]', 1200),
  sep('[data-dv2-acao="transferir"]', 700),
  sep('[data-dv2-acao="transferir-sim"]', 1500),
  sep('[data-dv2-acao="abrir-doc"][data-rota="compras.encomenda"]', 1800),
  sep('[data-dv2-jan-tab="linhas"]', 2200),
  { legenda: '' },
], SEM);

registarRoteiro('erp-guias-faturas', 'Guias e faturas', [
  { ecra: 'inicio', ...menu('compras.compras-guias-entrada') },
  sep('tr[data-rc2-abrir="gui:GR 88213"]', 1800),
  sep('[data-rc2-acao="fechar"]'),
  sep('[data-gv3-vista="transporte"]', 900),
  sep('[data-gv3-vista="devolucao"]', 900),
  menu('compras.compras-faturas'),
  sep('tr[data-dv2-id="FC 2026/00122"]', 1000),
  sep('[data-dv2-jan-tab="linhas"]', 1200),
  sep('[data-dv2-jan-acao="fechar"]'),
  sep('[data-dv2-vista="notas"]', 900),
  sep('[data-dv2-vista="pendentes"]', 900),
  sep('[data-dv2-vista="verificar"]', 1500),
  { legenda: '' },
], SEM);

registarRoteiro('erp-mapas', 'Mapas: documentos e análise', [
  { ecra: 'inicio', legenda: '', clicar: '[data-dk7-grupo="compras-mapas"]' },
  menu('compras.mapas-tot-enc'),
  sep('[data-fx-par-vista="det"]'),
  menu('compras.analise-artigo'),
  sep('[data-cf-modo="familia"]'),
  sep('[data-cf-acao="gerar"]', 1200),
  { legenda: '' },
], SEM);

/* 28 out. (ela: «reproduzir fluxo no erp está mal no menu»): «Reproduzir o fluxo» andava pelos 31 estados do Início
   (menu recolhido, em esqueleto, sem módulos, sessão expirada…) e nunca passava pelo menu Compras. Agora segue o menu
   lateral: começa no Início limpo (menu aberto, Compras desdobrado) e abre, pela ordem do menu, cada ecrã do menu
   Compras no separador da área de trabalho — com o clique verdadeiro, por isso o item fica marcado a laranja. Os
   estados do Início continuam no seletor de estados (e em Anterior / Seguinte). */
const casa = () => document.querySelector<HTMLElement>('.ecra[data-ecra="inicio"]');
/** Os itens do menu Compras que abrem ecrã, pela ordem do menu (os do ERP antigo, a cinzento, não). */
const itensCompras = () => [...(casa()?.querySelectorAll<HTMLElement>('[data-dk8-g="compras"] .dk7-i[data-dk-atalho]') ?? [])];
/** O nome do item com as pastas de dentro do Compras («Mapas · Comparação · Geral»). */
function nomeItem(el: HTMLElement): string {
  const pastas: string[] = [];
  for (let g = el.closest<HTMLElement>('.dk7-g--sub'); g; g = g.parentElement?.closest<HTMLElement>('.dk7-g--sub') ?? null) pastas.unshift(g.querySelector(':scope > .dk8-g-cab .dk7-g-t > span:not([aria-hidden])')?.textContent?.trim() ?? '');
  return [...pastas.filter(Boolean), el.textContent?.trim() ?? ''].join(' · ');
}
/** Abre um item pelo menu: primeiro as pastas fechadas que o escondem (cada clique redesenha o menu), depois o item. */
function abrirPeloMenu(rota: string): void {
  if (casa()?.hidden) { mostrar('inicio'); mostrarVersao(''); }
  for (let k = 0; k < 4; k++) {
    const el = casa()?.querySelector<HTMLElement>(`.dk7-i[data-dk-atalho="${rota}"]`);
    if (!el) return;
    const fechada = [...casa()!.querySelectorAll<HTMLElement>('.dk7-g:not(.is-aberto)')].find((g) => g.contains(el));
    if (!fechada) { el.click(); requestAnimationFrame(aVista); return; }
    fechada.querySelector<HTMLElement>(':scope > .dk8-g-cab [data-dk7-grupo]')?.click();
  }
}
/** O item marcado fica à vista: os últimos mapas ficavam por baixo da barra da demonstração. Só rola a caixa do menu. */
function aVista(): void {
  const el = casa()?.querySelector<HTMLElement>('[data-dk7-lado] .dk7-i.is-ativo'); if (!el) return;
  const fundo = Math.min(document.querySelector('.demo-barra')?.getBoundingClientRect().top ?? innerHeight, innerHeight) - 12;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (!/(auto|scroll)/.test(getComputedStyle(p).overflowY) || p.scrollHeight <= p.clientHeight + 1) continue;
    const r = el.getBoundingClientRect(), q = p.getBoundingClientRect(), baixo = Math.min(q.bottom, fundo);
    if (r.top < q.top + 4 || r.bottom > baixo - 4) p.scrollBy({ top: r.top - q.top - (baixo - q.top - r.height) / 2 });
    return;
  }
}
registarReproducao((): PassoReproducao[] => [
  { nome: '05 · Início', fazer: () => { mostrar('inicio'); mostrarVersao(''); document.dispatchEvent(new CustomEvent('romafe:rato-inicio', { detail: 'reproduzir' })); } },
  ...itensCompras().map((el) => ({ nome: nomeItem(el), fazer: () => abrirPeloMenu(el.dataset.dkAtalho!) })),
]);
