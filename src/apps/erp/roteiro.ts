/* =========================================================
   ERP — as demonstrações com o rato (28 out. 2026)
   Ela: «faz a mesma demonstração de casos no erp com rato mas sem texto». Os casos das Compras, um por roteiro, só
   com o rato e os cliques verdadeiros (semTexto): a partir do Início, abre-se o ecrã pelo menu lateral e o rato
   trabalha dentro do separador (separador: true). Escolhe-se em «Com o rato», na barra da demonstração.
   Link para mandar: …/erp/#so=ecra&demo=1&anim=dissolver&ecra=inicio&rato=<id>
   ========================================================= */
import { registarRoteiro, percurso, type Passo } from '../../comum/demo-rato';
import { registarReproducao, type PassoReproducao } from '../../comum/demo';
import { mostrar, mostrarVersao } from '../../comum/ecras';

const SEM = { semTexto: true };
/* 6 nov. (ela: «quero o ver fluxo com o rato com todos os cenários e de todos os ecrãs possíveis»): «Tudo» é o primeiro
   da lista — os casos todos, um a seguir ao outro, e depois todos os ecrãs e estados com a explicação de cada um */
const CASOS: Passo[] = [];
const registarCaso = (id: string, titulo: string, passos: Passo[], o = SEM): void => { registarRoteiro(id, titulo, passos, o); CASOS.push(...passos); };
registarRoteiro('erp-tudo', 'Tudo: todos os casos, ecrãs e estados', () => [...CASOS, ...todosEcras()]);

/** Abre um ecrã pelo Explorador (o Início v3, 6 nov.) e espera que o separador carregue. */
const menu = (rota: string): Passo => ({ legenda: '', clicar: `.ide-x-g [data-ide-abrir="${rota}"]`, pausa: 1800 });
/** Um clique dentro do separador ativo. */
const sep = (clicar: string, pausa = 0): Passo => ({ legenda: '', clicar, separador: true, pausa });

/* 28 out. (ela: «melhora o fluxo no erp!!!»): cada caso acaba no resultado à vista — a encomenda com as linhas novas,
   a ficha com as receções — e as janelas fecham-se antes de passar ao seguinte, como faria quem trabalha */
registarCaso('erp-faltas', 'Lista de Faltas: da falta à encomenda', [
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

registarCaso('erp-encomendas', 'Encomendas: uma encomenda e as quatro vistas', [
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

registarCaso('erp-orcamentos', 'Orçamentos: da proposta à encomenda', [
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

registarCaso('erp-guias-faturas', 'Guias e faturas', [
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

registarCaso('erp-mapas', 'Mapas: documentos e análise', [
  { ecra: 'inicio', ...menu('compras.mapas-tot-enc') },
  sep('[data-fx-par-vista="det"]'),
  menu('compras.analise-artigo'),
  sep('[data-cf-modo="familia"]'),
  sep('[data-cf-acao="gerar"]', 1200),
  { legenda: '' },
], SEM);

/* =========================================================
   6 nov. (ela: «a demonstração de ver o fluxo com o rato deve estar a funcionar com todos os screens e cenários possíveis
   para mostrar ao meu chefe»): a área de trabalho (abrir, dividir, arrastar, acoplar, ocultar, flutuar, guardar e repor
   a disposição), o que é como o VS Code (barra lateral, painel, paleta, teclas), os documentos ligados, os mapas que
   faltavam, e dois percursos com explicação: os estados do Início e todos os ecrãs e estados do ERP.
   ========================================================= */
const IDE = '.ecra:not([hidden]) > .versao:not([hidden]) .ide ';
const q = (sel: string) => document.querySelector<HTMLElement>(IDE + sel);
const grupoDe = (item: string) => q(`[data-ide-grupo]:has(:is([data-ide-tab="${item}"], [data-ide-tit="${item}"]))`);
/** O centro de uma guia de acoplar do grupo que tem este separador (o losango: ao centro do corpo do grupo). */
const guia = (item: string, zona: 'esq' | 'dir' | 'cima' | 'baixo' | 'centro') => () => {
  const g = grupoDe(item); if (!g) return null;
  const r = g.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + 30 + (r.height - 30) / 2, d = 38;
  return { esq: { x: cx - d, y: cy }, dir: { x: cx + d, y: cy }, cima: { x: cx, y: cy - d }, baixo: { x: cx, y: cy + d }, centro: { x: cx, y: cy } }[zona];
};
/** A seta de acoplar numa borda da área inteira. */
const bordaArea = (lado: 'esq' | 'dir') => () => { const a = q('[data-ide-area]'); if (!a) return null; const r = a.getBoundingClientRect(); return { x: lado === 'esq' ? r.left + 25 : r.right - 25, y: r.top + r.height / 2 }; };
/** Um sítio livre (sem guia por baixo) dentro do grupo deste separador: largar aí põe a flutuar. */
const livre = (item: string) => () => { const g = grupoDe(item); if (!g) return null; const r = g.getBoundingClientRect(); return { x: r.left + 90, y: r.top + 110 }; };
const deslocar = (sel: string, dx: number, dy: number) => () => { const el = q(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 + dx, y: r.top + r.height / 2 + dy }; };
const abrirEx = (rota: string, pausa = 1400): Passo => ({ legenda: '', clicar: `.ide-x-g [data-ide-abrir="${rota}"]`, pausa });
const noQuadro = (item: string, clicar: string, pausa = 0): Passo => ({ legenda: '', clicar, separador: `${IDE}iframe[data-ide-frame="${item}"]`, pausa });
const FAL = 'doc:compras.faltas', ENC = 'doc:compras.encomendas';

registarCaso('erp-area-trabalho', 'Área de trabalho: dividir, acoplar, flutuar e guardar a disposição', [
  { ecra: 'inicio', ...abrirEx('compras.encomendas') },
  abrirEx('compras.faltas', 1800),
  { legenda: '', arrastar: { de: `[data-ide-tab="${FAL}"]`, para: guia(FAL, 'dir') }, pausa: 1200 },
  { legenda: '', arrastar: { de: `[data-ide-no]:has(> [data-ide-grupo] [data-ide-tab="${ENC}"]) + [data-ide-sep]`, para: deslocar(`[data-ide-no]:has(> [data-ide-grupo] [data-ide-tab="${ENC}"]) + [data-ide-sep]`, -140, 0) } },
  { legenda: '', clicar: '[data-ide-atv-f="stock"]', pausa: 600 },
  noQuadro(FAL, 'tr[data-lf2-ref="0 986 494 524"]', 900),
  noQuadro(FAL, '[data-lf2-jan-acao="fechar"]'),
  { legenda: '', clicar: '[data-ide-grupo]:has([data-ide-tit="ferr:explorador"]) [data-ide-g-acao="ocultar"]', pausa: 500 },
  { legenda: '', clicar: '[data-ide-oculto="ferr:explorador"]', pausa: 900 },
  { legenda: '', clicar: `[data-ide-tab="${ENC}"]` },
  { legenda: '', arrastar: { de: '[data-ide-tit="ferr:stock"]', para: bordaArea('esq') }, pausa: 900 },
  { legenda: '', arrastar: { de: '[data-ide-tit="ferr:stock"]', para: livre(ENC) }, pausa: 900 },
  { legenda: '', arrastar: { de: '[data-ide-fj-arrastar]', para: deslocar('[data-ide-fj-arrastar]', 160, 60) } },
  { legenda: '', clicar: '[data-ide-fj-acao="acoplar"]', pausa: 700 },
  { legenda: '', clicar: '[data-ide-estado] [data-ide-cmd="menu-disposicoes"]' },
  { legenda: '', clicar: '[data-ide-pop] [data-ide-cmd="guardar-disp"]' },
  { legenda: '', escrever: ['[data-ide-disp-nome-in]', 'Compras'] },
  { legenda: '', clicar: '[data-ide-disp-form] button[type="submit"]', pausa: 600 },
  { legenda: '', clicar: '[data-ide-dlg] [data-ide-dlg-fechar]' },
  { legenda: '', clicar: '[data-ide-estado] [data-ide-cmd="menu-disposicoes"]' },
  { legenda: '', clicar: '[data-ide-pop] [data-ide-cmd="preset:artigos"]', pausa: 1800 },
  { legenda: '', clicar: '[data-ide-estado] [data-ide-cmd="menu-disposicoes"]' },
  { legenda: '', clicar: '[data-ide-pop] [data-ide-cmd="disp:Compras"]', pausa: 2200 },
  { legenda: '' },
], SEM);

registarCaso('erp-vscode', 'Como o VS Code: barra lateral, painel, paleta e teclas', [
  { ecra: 'inicio', legenda: '', tecla: 'Control+B', pausa: 400 },
  { legenda: '', tecla: 'Control+B', pausa: 400 },
  { legenda: '', clicar: '[data-ide-atv-f="explorador"]', pausa: 400 },
  { legenda: '', clicar: '[data-ide-atv-f="explorador"]', pausa: 400 },
  { legenda: '', clicar: '[data-ide-atv-f="pesquisa"]' },
  { legenda: '', escrever: ['[data-ide-f-q="pesquisa"]', 'skf'], pausa: 500 },
  { legenda: '', clicar: '[data-ide-ferr="ferr:pesquisa"] [data-ide-ctx^="artigo:"]', pausa: 900 },
  { legenda: '', tecla: 'Control+J', pausa: 600 },
  { legenda: '', tecla: 'Control+J', pausa: 600 },
  { legenda: '', tecla: 'Control+P' },
  { legenda: '', escrever: ['[data-ide-pal-q]', 'faltas'], pausa: 300 },
  { legenda: '', tecla: 'Enter', pausa: 1600 },
  { legenda: '', tecla: 'Control+\\', pausa: 1000 },
  { legenda: '', tecla: 'Control+K Control+ArrowLeft', pausa: 600 },
  { legenda: '', tecla: 'Control+Shift+P' },
  { legenda: '', escrever: ['[data-ide-pal-q]', '>zen'], pausa: 300 },
  { legenda: '', tecla: 'Enter', pausa: 1600 },
  { legenda: '', tecla: 'Escape', pausa: 600 },
  { legenda: '', tecla: 'Control+K Control+S', pausa: 2400 },
  { legenda: '', tecla: 'Escape' },
  { legenda: '' },
], SEM);

registarCaso('erp-contexto', 'Documentos ligados: stock, propriedades e relacionados', [
  { ecra: 'inicio', legenda: '', clicar: '[data-ide-estado] [data-ide-cmd="menu-disposicoes"]' },
  { legenda: '', clicar: '[data-ide-pop] [data-ide-cmd="preset:compras"]', pausa: 2400 },
  noQuadro(FAL, 'tr[data-lf2-ref="0 986 494 524"]', 900),
  noQuadro(FAL, '[data-lf2-jan-acao="fechar"]'),
  { legenda: '', clicar: '[data-ide-tab="ferr:propriedades"]', pausa: 700 },
  { legenda: '', clicar: '[data-ide-ferr="ferr:propriedades"] [data-ide-f-pin]', pausa: 600 },
  noQuadro(FAL, 'tr[data-lf2-ref="0 986 424 797"]', 900),
  noQuadro(FAL, '[data-lf2-jan-acao="fechar"]'),
  { legenda: '', clicar: '[data-ide-tab="ferr:stock"]', pausa: 900 },
  noQuadro(FAL, 'tr[data-lf2-ref="0 986 494 524"]', 700),
  noQuadro(FAL, '[data-lf2-jan-acao="fechar"]'),
  { legenda: '', clicar: '[data-ide-atv-f="relacionados"]', pausa: 700 },
  { legenda: '', clicar: '[data-ide-ferr="ferr:relacionados"] [data-ide-enc]', pausa: 2400 },
  { legenda: '' },
], SEM);

registarCaso('erp-mapas-2', 'Mapas: guias, recapitulativo, comparativos, fornecedores e automático', [
  { ecra: 'inicio', ...menu('compras.mapas-tot-ge') },
  sep('[data-fx-par-vista="det"]', 900),
  menu('compras.mapas-recap'),
  sep('[data-rc-acao="gerar"]', 1400),
  menu('compras.comp-geral-var'),
  sep('[data-cf-acao="gerar"]', 1400),
  menu('compras.mapas-analise-forn'),
  sep('tr[data-fx-i="2"]', 900),
  menu('compras.mapas-automatico'),
  sep('[data-ak-acao="gerar"]', 1600),
  { legenda: '' },
], SEM);

/* os percursos com explicação (nome e objetivo de cada um): os estados do Início, e todos os ecrãs e estados do ERP */
registarRoteiro('erp-estados-inicio', 'Os estados da área de trabalho, um a um', () => percurso((e) => e.dataset.ecra === 'inicio' || e.dataset.estadoDe === 'inicio'));
/* 6 nov. (ela: «no ver fluxo com o rato também»): primeiro os ecrãs das Compras abertos pelos Módulos, como quem
   trabalha; depois todos os ecrãs e estados, cada um com a explicação */
function todosEcras(): Passo[] { return [
  { ecra: 'inicio', legenda: '' },
  ...[...(document.querySelector('.ecra[data-ecra="inicio"] > .versao:not([hidden])')?.querySelectorAll<HTMLElement>('.ide-x-g [data-ide-abrir]') ?? [])].map((el) => menu(el.dataset.ideAbrir!)),
  ...percurso(),
]; }
registarRoteiro('erp-todos', 'Todos os ecrãs e estados do ERP', todosEcras);

/* 28 out. (ela: «reproduzir fluxo no erp está mal no menu»): «Reproduzir o fluxo» andava pelos 31 estados do Início
   (menu recolhido, em esqueleto, sem módulos, sessão expirada…) e nunca passava pelo menu Compras. Agora segue o menu
   lateral: começa no Início limpo (menu aberto, Compras desdobrado) e abre, pela ordem do menu, cada ecrã do menu
   Compras no separador da área de trabalho — com o clique verdadeiro, por isso o item fica marcado a laranja. Os
   estados do Início continuam no seletor de estados (e em Anterior / Seguinte). */
const casa = () => document.querySelector<HTMLElement>('.ecra[data-ecra="inicio"]');
/* 6 nov.: o Início é só a v3 (o IDE): os ecrãs abrem-se pelo Explorador ROMAFE (a árvore dos módulos, sem os Favoritos
   nem os Abertos há pouco, que repetem itens) */
const versaoCasa = () => casa()?.querySelector<HTMLElement>(':scope > .versao:not([hidden])') ?? null;
/** Os itens do menu Compras que abrem ecrã, pela ordem do menu. */
const itensCompras = () => [...(versaoCasa()?.querySelectorAll<HTMLElement>('.ide-x-g [data-ide-abrir]') ?? [])];
/** O nome do item com as pastas de dentro do Compras («Mapas · Análise de compras»). */
function nomeItem(el: HTMLElement): string {
  const pastas: string[] = [];
  for (let g = el.closest<HTMLElement>('.ide-x-g'); g; g = g.parentElement?.closest<HTMLElement>('.ide-x-g') ?? null) pastas.unshift(g.querySelector(':scope > .ide-x-gt span')?.textContent?.trim() ?? '');
  return [...pastas.filter((p) => p && p !== 'Compras'), el.textContent?.trim() ?? ''].join(' · ');
}
/** Abre um item pelo Explorador: primeiro as pastas fechadas que o escondem (cada clique redesenha a árvore), depois o item. */
function abrirPeloMenu(rota: string): void {
  if (casa()?.hidden) { mostrar('inicio'); mostrarVersao(''); }
  for (let k = 0; k < 4; k++) {
    const el = versaoCasa()?.querySelector<HTMLElement>(`.ide-x-g [data-ide-abrir="${CSS.escape(rota)}"]`);
    if (!el) return;
    const fechada = [...versaoCasa()!.querySelectorAll<HTMLElement>('.ide-x-g:not(.is-aberto)')].find((g) => g.contains(el));
    if (!fechada) { el.click(); requestAnimationFrame(() => aVista(rota)); return; }
    fechada.querySelector<HTMLElement>(':scope > [data-ide-exp-g]')?.click();
  }
}
/** O item aberto fica à vista: os últimos mapas ficavam por baixo da barra da demonstração. Só rola a caixa do Explorador. */
function aVista(rota: string): void {
  const el = versaoCasa()?.querySelector<HTMLElement>(`.ide-x-g [data-ide-abrir="${CSS.escape(rota)}"]`); if (!el) return;
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
const docAtivo = () => { try { return [...(versaoCasa()?.querySelectorAll<HTMLIFrameElement>('iframe.ide-frame:not(.is-espelho)') ?? [])].find((f) => f.style.visibility === 'visible')?.contentDocument ?? null; } catch { return null; } };
/** Clica no que está à vista no separador (num diálogo aberto, primeiro); «esc» fecha o menu ou o diálogo aberto. */
function noSeparador(sel: string): void {
  const d = docAtivo(); if (!d) return;
  if (sel === ESC) { (d.activeElement ?? d.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return; }
  const el = [...d.querySelectorAll<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) ${sel.split(', ').join(', .ecra:not([hidden]) > .versao:not([hidden]) ')}`)].find((x) => !x.closest('[hidden]') && x.getClientRects().length > 0);
  /* 6 nov.: a barra de ações do ecrã está por cima, na área de trabalho — o clique vai ao botão de cima (os menus abrem à vista) */
  const cima = el && (window as unknown as { ideEspelho?: (e: Element) => HTMLElement | null }).ideEspelho?.(el);
  if (cima) cima.click(); else if (el) el.click(); else console.warn(`reproduzir: não há «${sel}» neste ecrã`);
}
/* 6 nov. (ela: «no fluxo do ERP deve ter todos os estados de screen»): depois do trabalho nos ecrãs das Compras, a
   reprodução passa por todos os ecrãs e estados da lista, pela ordem do número (os mesmos do percurso «Todos os ecrãs
   e estados» com o rato), e volta ao Início. */
const ecraEstados = () => percurso().map((p) => p.ir!).filter((id) => id !== 'inicio');
const nomeEcra = (id: string) => document.querySelector<HTMLElement>(`.ecra[data-ecra="${CSS.escape(id)}"]`)?.dataset.nome ?? id;
registarReproducao((): PassoReproducao[] => [
  { nome: '05 · Início', fazer: () => { mostrar('inicio'); mostrarVersao(''); document.dispatchEvent(new CustomEvent('romafe:rato-inicio', { detail: 'reproduzir' })); } },
  ...itensCompras().flatMap((el) => { const rota = el.dataset.ideAbrir!, nome = nomeItem(el);
    return [{ nome, fazer: () => abrirPeloMenu(rota) }, ...(NO_ECRA[rota] ?? []).map(([t, sel]) => ({ nome: t ? `${nome} · ${t}` : nome, fazer: () => noSeparador(sel) }))]; }),
  ...ecraEstados().map((id) => ({ nome: nomeEcra(id), fazer: () => { mostrar(id); mostrarVersao(''); } })),
  { nome: '05 · Início', fazer: () => { mostrar('inicio'); mostrarVersao(''); } },
]);
