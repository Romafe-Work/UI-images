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
  /* confirmar abre logo a encomenda criada num separador (29 out.: com os separadores rápidos, já à frente) */
  sep('[data-dv2-acao="transferir-sim"]', 2200),
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
/* 29 out. (ela: «no reproduzir fluxo tenho de mostrar tudo o que pode fazer num ecrã» e «faz isso para todos os screens
   das compras»): depois de abrir cada ecrã pelo menu, a reprodução mostra o que se faz nele — as vistas, os modos de
   pesquisa, os filtros, os menus, um documento numa janela (e as abas dela), o Novo — e fecha o que abriu antes de
   seguir. Fica de fora o que muda os dados (Para encomenda, Transferir, Anular, Registar): a reprodução repete-se. */
type Feito = [string, string];
const ESC = 'esc';
const fechaJanDv2: Feito = ['Fechar a janela', '[data-dv2-jan-acao="fechar"]'];
const NO_ECRA: Record<string, Feito[]> = {
  'compras.faltas': [['Visualizar por', '[data-lf2-acao="visualizar"]'], ['', ESC], ['Mais filtros', '[data-lf2-acao="mais-filtros"]'], ['Menos filtros', '[data-lf2-acao="mais-filtros"]'],
    ['Ações de compra', '[data-lf2-acao="acoes"]'], ['', ESC], ['Mais ações: as colunas', '[data-lf2-acao="mais"]'], ['', ESC],
    ['Um artigo numa janela', 'tr[data-lf2-ref="30205"]'], ['Fechar a janela', '[data-lf2-jan-acao="fechar"]'], ['Escolher um artigo', 'tr[data-lf2-ref="0 986 424 797"] [data-lf2-escolher]'], ['Tirar a escolha', 'tr[data-lf2-ref="0 986 424 797"] [data-lf2-escolher]']],
  'compras.cotacoes': [['Pesquisar por data', '[data-dv2-modo="data"]'], ['Pesquisar por código', '[data-dv2-modo="codigo"]'], ['Pesquisar por descrição', '[data-dv2-modo="descricao"]'], ['Pesquisar por número', '[data-dv2-modo="numero"]'],
    ['Mais filtros', '[data-dv2-acao="mais-filtros"]'], ['Menos filtros', '[data-dv2-acao="mais-filtros"]'],
    ['Um orçamento numa janela', 'tr[data-dv2-id="PC 2026/0017|skf"]'], ['Linhas', '[data-dv2-jan-tab="linhas"]'], ['Documentos', '[data-dv2-jan-tab="documentos"]'], ['Anexos', '[data-dv2-jan-tab="anexos"]'], fechaJanDv2,
    ['Novo orçamento', '[data-dv2-acao="novo"]'], ['Fechar sem gravar', '[data-dv2-acao="fechar-ficha"]'], ['Mais ações', '[data-dv2-acao="mais"]'], ['', ESC]],
  'compras.encomendas': [['Uma encomenda numa janela', 'tr[data-dv2-id="EF 2026/0411"]'], ['Linhas', '[data-dv2-jan-tab="linhas"]'], ['Receções', '[data-dv2-jan-tab="rececoes"]'], ['EDI', '[data-dv2-jan-tab="edi"]'], ['Anexos', '[data-dv2-jan-tab="anexos"]'], fechaJanDv2,
    ['Agendamento', '[data-dv2-vista="agenda"]'], ['Agendamento em calendário', '[data-dv2-acao="ag-modo"][data-m="cal"]'], ['Pedidos de clientes', '[data-dv2-vista="clientes"]'], ['Receções', '[data-dv2-vista="rececoes"]'], ['Encomendas', '[data-dv2-vista="docs"]'],
    ['Mais filtros', '[data-dv2-acao="mais-filtros"]'], ['Menos filtros', '[data-dv2-acao="mais-filtros"]'], ['Enviar / Integrar', '[data-dv2-acao="edi"]'], ['', ESC],
    ['Nova encomenda', '[data-dv2-acao="novo"]'], ['Fechar sem gravar', '[data-dv2-acao="fechar-ficha"]'], ['Mais ações', '[data-dv2-acao="mais"]'], ['', ESC]],
  'compras.compras-guias-entrada': [['Uma guia numa janela', 'tr[data-gv3-rec]'], ['Fechar a janela', '[data-rc2-acao="fechar"]'], ['Transporte a fornecedor', '[data-gv3-vista="transporte"]'], ['Devolução', '[data-gv3-vista="devolucao"]'], ['Entrada', '[data-gv3-vista="entrada"]'],
    ['Nova guia', '[data-gv3-acao="novo"]'], ['Cancelar', '[data-gv3-fechar]'], ['Escolher uma guia', 'tr[data-gv3-rec]'], ['Fechar a janela', '[data-rc2-acao="fechar"]'], ['Corrigir a guia', '[data-gv3-acao="editar"]'], ['Cancelar', '[data-gv3-fechar]'], ['Anular a guia', '[data-gv3-acao="anular"]'], ['Cancelar', '[data-gv3-fechar]']],
  'compras.compras-faturas': [['Uma fatura numa janela', 'tr[data-dv2-id="FC 2026/00122"]'], ['Linhas', '[data-dv2-jan-tab="linhas"]'], ['Documentos', '[data-dv2-jan-tab="documentos"]'], ['Créditos', '[data-dv2-jan-tab="creditos"]'], ['Anexos', '[data-dv2-jan-tab="anexos"]'], fechaJanDv2,
    ['Notas de crédito', '[data-dv2-vista="notas"]'], ['Crédito por receber', '[data-dv2-vista="pendentes"]'], ['Verificação', '[data-dv2-vista="verificar"]'], ['Faturas', '[data-dv2-vista="docs"]'],
    ['Pesquisa avançada: mais uma condição', '[data-dv2-acao="crit-mais"]'], ['Mais filtros', '[data-dv2-acao="mais-filtros"]'], ['Menos filtros', '[data-dv2-acao="mais-filtros"]'],
    ['Nova fatura', '[data-dv2-acao="novo"]'], ['Fechar sem gravar', '[data-dv2-acao="fechar-ficha"]'], ['Mais ações', '[data-dv2-acao="mais"]'], ['', ESC]],
  'compras.mapas-tot-enc': [['Outra encomenda', 'tr[data-fx-i="2"]'], ['Detalhes (as linhas)', '[data-fx-par-vista="det"]'], ['Outra linha', 'tr[data-fx-i="3"]'], ['Totais', '[data-fx-par-vista="tot"]']],
  'compras.mapas-tot-ge': [['Outra guia', 'tr[data-fx-i="1"]'], ['Detalhes (as linhas)', '[data-fx-par-vista="det"]'], ['Outra linha', 'tr[data-fx-i="2"]'], ['Totais', '[data-fx-par-vista="tot"]']],
  'compras.mapas-recap': [['Todos os tipos de documento', '[data-rc-acao="todos"]'], ['Gerar dados', '[data-rc-acao="gerar"]'], ['Um fornecedor', '[data-rc-grelha] tbody tr'], ['Filtrar a tabela', '[data-rc-acao="filtrar"]'], ['Fechar os filtros', '[data-rc-acao="filtrar"]'], ['Alterar critérios', '[data-rc-acao="alterar"]']],
  'compras.analise-artigo': [['Gerar dados', '[data-cf-acao="gerar"]'], ['Artigo / Fornecedor', '[data-cf-modo="artigo-forn"]'], ['Gerar dados', '[data-cf-acao="gerar"]'], ['Família / Subfamília', '[data-cf-modo="familia"]'], ['Gerar dados', '[data-cf-acao="gerar"]'],
    ['Família / Subfamília / Fornecedor', '[data-cf-modo="familia-forn"]'], ['Gerar dados', '[data-cf-acao="gerar"]'], ['Somatórios', '[data-cf-acao="somas"]'], ['Somatórios', '[data-cf-acao="somas"]'], ['Mais ações', '[data-cf-acao="mais"]'], ['', ESC]],
  'compras.comp-geral-var': [['Gerar dados', '[data-cf-acao="gerar"]'], ['Gráfico', '[data-cf-acao="grafico"]'], ['Mês a mês', '[data-cf-modo="mensal"]'], ['Gerar dados', '[data-cf-acao="gerar"]'], ['Variações anuais', '[data-cf-modo="anual"]'],
    ['Por artigo', '[data-fx-par-vista="artigo"]'], ['Gerar dados', '[data-cf-acao="gerar"]'], ['Por família/subfamília', '[data-fx-par-vista="familia"]'], ['Gerar dados', '[data-cf-acao="gerar"]'],
    ['Por fornecedor', '[data-fx-par-vista="forn"]'], ['Gerar dados', '[data-cf-acao="gerar"]'], ['Geral', '[data-fx-par-vista="geral"]']],
  'compras.mapas-analise-forn': [['Outro fornecedor', 'tr[data-fx-i="2"]'], ['Outro fornecedor', 'tr[data-fx-i="3"]'], ['Outro fornecedor', 'tr[data-fx-i="4"]']],
  'compras.mapas-automatico': [['Gerar dados', '[data-ak-acao="gerar"]'], ['Um artigo', '[data-ak-grelha] tbody tr, .ak-grelha tbody tr'], ['Mais ações', '[data-ak-acao="mais"]'], ['', ESC]],
};
/** O documento do separador à frente (a área de trabalho). */
const docAtivo = () => { try { return casa()?.querySelector<HTMLIFrameElement>('.dk-painel.is-ativo iframe')?.contentDocument ?? null; } catch { return null; } };
/** Clica no que está à vista no separador (num diálogo aberto, primeiro); «esc» fecha o menu ou o diálogo aberto. */
function noSeparador(sel: string): void {
  const d = docAtivo(); if (!d) return;
  if (sel === ESC) { (d.activeElement ?? d.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return; }
  const el = [...d.querySelectorAll<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) ${sel.split(', ').join(', .ecra:not([hidden]) > .versao:not([hidden]) ')}`)].find((x) => !x.closest('[hidden]') && x.getClientRects().length > 0);
  if (el) el.click(); else console.warn(`reproduzir: não há «${sel}» neste ecrã`);
}
registarReproducao((): PassoReproducao[] => [
  { nome: '05 · Início', fazer: () => { mostrar('inicio'); mostrarVersao(''); document.dispatchEvent(new CustomEvent('romafe:rato-inicio', { detail: 'reproduzir' })); } },
  ...itensCompras().flatMap((el) => { const rota = el.dataset.dkAtalho!, nome = nomeItem(el);
    return [{ nome, fazer: () => abrirPeloMenu(rota) }, ...(NO_ECRA[rota] ?? []).map(([t, sel]) => ({ nome: t ? `${nome} · ${t}` : nome, fazer: () => noSeparador(sel) }))]; }),
]);
