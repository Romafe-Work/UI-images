/* =========================================================
   ERP — 20 · Lista de Faltas v2 (26 out. 2026), do briefing dela «Lista de Faltas V2 — Advanced Purchasing Workspace»
   e dos prints do ERP antigo (Compras ▸ Lista de Faltas, 26 out.). A v1 fica como estava.
   Um só espaço de trabalho, de cima para baixo:
     1. cabeçalho compacto e a barra do ERP antigo — Novo F5 (desligado, como no antigo), Editar F6, Apagar F8,
        Atualizar F9, Imprimir F11 — mais «Ações de compra» (as Opções do antigo, Ctrl+F1…F9) e «Mais ações»;
     2. os filtros do antigo — Armazém, Classe, Stock e a pesquisa sempre à vista; Indústria, Auto, Enc. fornecedor e
        Enc. cliente em «Mais filtros»; etiquetas com o que está ativo;
     3. a pesquisa como no antigo: «Visualizar por» (F1 Código, F2 Cód. art. enc., F3 Tipo enc., F4 Cl. reposição,
        F7 Família, F10 Subfamília, F12 Fornecedor) escolhe a ordem e o campo onde se procura; Shift+F1 «Iniciado por»
        e Shift+F2 «Contendo» escolhem como se compara — sem procura aproximada;
     4. a grelha «Artigos em rutura» com as colunas do antigo e, ao lado, a Encomenda ativa;
     5. clicar num artigo (ou Enter) abre os detalhes numa janela flutuante, como as da área de trabalho (26 out.: arrastar,
        redimensionar, minimizar, maximizar, fechar; uma por artigo): Stock por
        armazém, Classes de reposição em rutura e Rotatividade nos últimos N dias (calcula-se ao escrever), lado a lado
        ou em separadores quando a janela é estreita.
   Dados: os da v1 (compras/faltas.ts, que lê compras/dominio.ts). A classe de reposição sai da família (de exemplo,
   como a classe, o mínimo e a rotação da v1). O que o protótipo não tem — outros armazéns, embalagem, devolvido — fica
   «—» e diz-se. «Para encomenda» grava mesmo no rascunho (dominio.guardar), com as regras de lá.
   Comportamento: compras/faltas-v2-comportamento.ts. CSS: css/faltas-v2.css (assenta nas classes do Automático v2).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L } from '../espaco';
import { ecrasFaltas, faltas, semanas, type Falta } from './faltas';
import { artigo } from './dominio';
import packageX from 'lucide-static/icons/package-x.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import listOrdered from 'lucide-static/icons/list-ordered.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';

/* ---------- as linhas da v2: as faltas da v1 com a unidade e a classe de reposição ---------- */
/** A classe de reposição de cada família (de exemplo, até haver o modelo de reposição). */
export const CL_REP: Record<string, [string, string]> = {
  Travagem: ['R01', 'Travagem · reposição semanal'], Embraiagem: ['R02', 'Embraiagens · por consumo'],
  Distribuição: ['R03', 'Distribuição · por consumo'], Rolamentos: ['R04', 'Rolamentos industriais · quinzenal'],
};
export interface Linha2 extends Falta { un: string; clRep: string; clRepDesc: string; encCli: boolean }
export function linhas2(): Linha2[] {
  return faltas().map((f) => { const [c, d] = CL_REP[f.fam] ?? ['—', '—']; return { ...f, un: artigo(f.ref)?.un ?? 'un.', clRep: c, clRepDesc: d, encCli: f.cliente !== '—' }; });
}
/** As saídas por semana (as 12 da v1); só há 12 semanas no protótipo — acima de 84 dias, os dados são parciais. */
export const SEMANAS_MAX = 12;
export function rotatividade(f: Falta, dias: number): { semanas: number; parcial: boolean; saidas: number; entradas: number } {
  const s = semanas(f.ref), n = Math.min(SEMANAS_MAX, Math.max(1, Math.ceil(dias / 7)));
  const saidas = s.slice(-n).reduce((a, b) => a + b, 0);
  return { semanas: n, parcial: dias > SEMANAS_MAX * 7, saidas, entradas: Math.round(saidas * .82) };
}

/* ---------- as colunas: as do ERP antigo, pela ordem dele, e as que se acrescentam escondidas ---------- */
export type TipoCol2 = 'txt' | 'mono' | 'n' | 'data' | 'estado';
export interface Col2 { k: string; t: string; tipo: TipoCol2; w: number; presa?: boolean; antiga?: boolean }
export const COLS2: Col2[] = [
  { k: 'ref', t: 'Artigo', tipo: 'mono', w: 210, presa: true, antiga: true },
  { k: 'estado', t: 'Estado', tipo: 'estado', w: 170 },
  { k: 'classe', t: 'Classe', tipo: 'txt', w: 70, antiga: true },
  { k: 'refForn', t: 'Código do artigo na encomenda', tipo: 'mono', w: 150, antiga: true },
  { k: 'rutura', t: 'Data de rutura', tipo: 'data', w: 112, antiga: true },
  { k: 'tipo', t: 'Tipo de encomenda', tipo: 'txt', w: 132, antiga: true },
  { k: 'equiv', t: 'Equivalente', tipo: 'mono', w: 170, antiga: true },
  { k: 'opcoes', t: 'Opções', tipo: 'txt', w: 86, antiga: true },
  { k: 'conjunto', t: 'Conjunto', tipo: 'txt', w: 110, antiga: true },
  { k: 'clRep', t: 'Classe de reposição', tipo: 'txt', w: 150, antiga: true },
  { k: 'fam', t: 'Família', tipo: 'txt', w: 118, antiga: true },
  { k: 'sub', t: 'Subfamília', tipo: 'txt', w: 160, antiga: true },
  { k: 'fornNome', t: 'Fornecedor', tipo: 'txt', w: 160, antiga: true },
  { k: 'encomendada', t: 'Qtd. encomendada', tipo: 'n', w: 124, antiga: true },
  { k: 'pedida', t: 'Qtd. em rutura', tipo: 'n', w: 112, antiga: true },
  { k: 'conta', t: 'Conta', tipo: 'mono', w: 90, antiga: true },
  { k: 'stock', t: 'Stock', tipo: 'n', w: 84 },
  { k: 'min', t: 'Stock mínimo', tipo: 'n', w: 104 },
  { k: 'cliente', t: 'Cliente', tipo: 'txt', w: 170 },
  { k: 'sugestao', t: 'Qtd. sugerida', tipo: 'n', w: 112 },
];
/** As predefinições de colunas (a ordem conta). A «Qtd. sugerida» só aparece depois da Ajuda à compra. */
export const PREDEF: Record<string, [string, string[]]> = {
  geral: ['Geral', ['ref', 'estado', 'classe', 'refForn', 'rutura', 'tipo', 'equiv', 'opcoes', 'conjunto', 'clRep', 'fam', 'sub', 'fornNome', 'encomendada', 'pedida', 'conta']],
  reposicao: ['Reposição', ['ref', 'estado', 'clRep', 'tipo', 'stock', 'min', 'pedida', 'encomendada', 'sugestao', 'rutura']],
  fornecedor: ['Fornecedor', ['ref', 'fornNome', 'conta', 'refForn', 'tipo', 'encomendada', 'pedida', 'rutura']],
  stock: ['Stock', ['ref', 'estado', 'classe', 'stock', 'min', 'pedida', 'encomendada', 'fam', 'sub']],
};
/** «Visualizar por» do ERP antigo: a tecla, o nome, o campo onde se procura e por que se ordena. */
export const MODOS: { k: string; tecla: string; t: string; campo: string; dica: string }[] = [
  { k: 'codigo', tecla: 'F1', t: 'Código', campo: 'ref', dica: 'Código do artigo' },
  { k: 'codEnc', tecla: 'F2', t: 'Cód. art. encomenda', campo: 'refForn', dica: 'Código do artigo na encomenda' },
  { k: 'tipo', tecla: 'F3', t: 'Tipo de encomenda', campo: 'tipo', dica: 'Normal, Urgente ou Consignação' },
  { k: 'clRep', tecla: 'F4', t: 'Classe de reposição', campo: 'clRep', dica: 'Código da classe, ex.: R01' },
  { k: 'fam', tecla: 'F7', t: 'Família', campo: 'fam', dica: 'Família, ex.: Travagem' },
  { k: 'sub', tecla: 'F10', t: 'Subfamília', campo: 'sub', dica: 'Subfamília, ex.: Pastilhas' },
  { k: 'forn', tecla: 'F12', t: 'Fornecedor', campo: 'fornNome', dica: 'Nome do fornecedor' },
];
/** As Opções do ERP antigo (a coluna da esquerda), com as mesmas teclas. */
export const ACOES_COMPRA: { k: string; tecla: string; t: string; d: string; perigo?: boolean }[] = [
  { k: 'diarias', tecla: 'Ctrl+F1', t: 'Ruturas diárias', d: 'Só as ruturas com a data de hoje' },
  { k: 'gerar', tecla: 'Ctrl+F2', t: 'Gerar ruturas', d: 'Volta a calcular a lista com o stock de agora' },
  { k: 'ajuda', tecla: 'Ctrl+F3', t: 'Ajuda à compra', d: 'Mostra a quantidade sugerida de cada artigo' },
  { k: 'apagar-ruturas', tecla: 'Ctrl+F5', t: 'Apagar ruturas', d: 'Tira da lista as ruturas à vista', perigo: true },
  { k: 'encomenda', tecla: 'Ctrl+F6', t: 'Encomenda', d: 'Abre a encomenda ativa' },
  { k: 'para-encomenda', tecla: 'Ctrl+F7', t: 'Para encomenda', d: 'Junta os artigos escolhidos à encomenda ativa' },
  { k: 'ajuda-tipo', tecla: 'Ctrl+F8', t: 'Ajuda por tipo de encomenda', d: 'As faltas somadas por tipo de encomenda' },
  { k: 'ajuda-classe', tecla: 'Ctrl+F9', t: 'Ajuda por classe de reposição', d: 'As faltas somadas por classe de reposição' },
];

/* ---------- a página ---------- */
export type Cen2 = 'normal' | 'avancados' | 'carregar' | 'sem-resultados' | 'filtros' | 'vazia' | 'erro' | 'offline' | 'sem-ativa'
  /* só na v2 */
  | 'det-carregar' | 'sem-artigo' | 'a-atualizar' | 'gerar' | 'ajuda' | 'a-gravar' | 'confirmado' | 'invalido' | 'rejeitado'
  | 'apagar' | 'permissao' | 'sessao' | 'parcial' | 'restaurada' | 'visualizar' | 'acoes';
const TECLAS = 'F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 Escape';
const B = (k: string, ic: string, t: string, tecla: string, extra = '', cls = '') => `<button type="button" class="ak-btn${cls ? ` ${cls}` : ''}" data-lf2-acao="${k}"${tecla ? ` aria-keyshortcuts="${tecla}"${extra.includes('title=') ? '' : ` title="${t} (${tecla})"`}` : ''}${extra}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
const op = (v: string, t: string) => `<option value="${v}">${t}</option>`;

function html2(cen: Cen2): string {
  const id = (x: string) => `lf2-${x}-${cen}`;
  const campo = (k: string, t: string, input: string) => `<label class="ak-campo" for="${id(k)}"><span>${t}</span>${input}</label>`;
  const sel = (k: string, t: string, ops: string) => campo(k, t, `<select id="${id(k)}" data-lf2-f="${k}" data-lf2-campo>${ops}</select>`);
  return `<div class="hm ak lf2" data-hm data-lf2 data-lf2-cenario="${cen}" data-teclas="${TECLAS}">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Lista de Faltas', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(packageX)}</span>
    <div><h1>Lista de Faltas</h1><p>Consulta ruturas de stock e gere as necessidades de reposição.</p></div>
    <span class="lf2-restaurada" data-lf2-restaurada hidden></span>
  </header>

  <div class="ak-barra lf2-barra" role="toolbar" aria-label="Ações da Lista de Faltas">
    ${B('novo', plus, 'Novo', 'F5', ' aria-disabled="true" title="Na Lista de Faltas as faltas nascem das ruturas (Gerar ruturas, Ctrl+F2); não se criam à mão — como no ERP antigo."')}
    ${B('editar', pencil, 'Editar', 'F6')}
    ${B('apagar', trash, 'Apagar', 'F8')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('atualizar', refresh, 'Atualizar', 'F9')}
    ${B('imprimir', printer, 'Imprimir', 'F11')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="ak-menu-c">${B('acoes', shoppingCart, 'Ações de compra', '', ' aria-haspopup="menu" aria-expanded="false"', 'lf2-btn-compra')}
      <div class="ak-menu lf2-menu-acoes" role="menu" data-lf2-menu="acoes" data-por-cima hidden>
        <p class="ak-menu-t">Ações de compra</p>
        ${ACOES_COMPRA.map((a) => `${a.k === 'apagar-ruturas' || a.k === 'encomenda' || a.k === 'ajuda-tipo' ? '<i class="lf2-menu-sep" aria-hidden="true"></i>' : ''}<button type="button" role="menuitem" data-lf2-compra="${a.k}"${a.perigo ? ' class="is-perigo"' : ''}><span><b>${a.t}</b><small>${a.d}</small></span><kbd>${a.tecla}</kbd></button>`).join('')}
      </div></span>
    <span class="ak2-esp"></span>
    <span class="ak-menu-c">${B('mais', ellipsis, 'Mais ações', '', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu ak-menu--dir lf2-menu-mais" role="menu" data-lf2-menu="mais" data-por-cima hidden></div></span>
  </div>

  <section class="lf-filtros lf2-filtros" aria-label="Filtros">
    <div class="lf2-rapidos">
      ${sel('armazem', 'Armazém', op('', 'Todos') + op('60', '60 · Coimbra'))}
      ${sel('classe', 'Classe', op('', 'Todas') + op('A', 'A') + op('B', 'B') + op('C', 'C'))}
      ${sel('stock', 'Stock', op('', 'Todos') + op('rutura', 'Em rutura') + op('baixo', 'Abaixo do mínimo'))}
      <div class="ak-campo lf2-pesquisa" role="group" aria-labelledby="${id('pq-t')}">
        <span id="${id('pq-t')}">Pesquisa</span>
        <div class="lf2-pq">
          <span class="ak-menu-c"><button type="button" class="lf2-vis" data-lf2-acao="visualizar" aria-haspopup="menu" aria-expanded="false" title="Visualizar por (F1, F2, F3, F4, F7, F10, F12)">${L(listOrdered)}<span><small>Visualizar por</small><b data-lf2-vis-t>Código</b></span>${L(chevronDown)}</button>
            <div class="ak-menu lf2-menu-vis" role="menu" data-lf2-menu="visualizar" data-por-cima hidden>
              <label class="lf2-menu-procura">${L(search)}<input type="search" placeholder="Procurar modo…" aria-label="Procurar modo de visualização" data-lf2-vis-q></label>
              <div data-lf2-vis-l>${MODOS.map((m) => `<button type="button" role="menuitemradio" aria-checked="${m.k === 'codigo'}" data-lf2-modo="${m.k}"><span>${m.t}</span><kbd>${m.tecla}</kbd></button>`).join('')}</div>
              <p>Ordena a lista e escolhe o campo da pesquisa. Não apaga os filtros.</p>
            </div></span>
          <span class="lf2-comp" role="radiogroup" aria-label="Como compara">
            <button type="button" role="radio" aria-checked="true" data-lf2-comp="inicio" title="Pesquisa iniciada por (Shift+F1)">Iniciado por</button>
            <button type="button" role="radio" aria-checked="false" data-lf2-comp="contem" title="Pesquisa contendo (Shift+F2)">Contendo</button>
          </span>
          <label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-lf2-q data-lf2-campo data-ak-primeiro autocomplete="off" placeholder="Código do artigo" aria-label="Pesquisa: código do artigo, iniciado por"></label>
        </div>
      </div>
      <button type="button" class="lf2-mais-f" data-lf2-acao="mais-filtros" aria-expanded="${cen === 'avancados'}" aria-controls="${id('av')}">${L(sliders)}<span>Mais filtros</span><small data-lf2-n-av></small>${L(chevronDown, 'lf2-seta')}</button>
    </div>
    <div class="lf2-avancados" id="${id('av')}" data-lf2-av${cen === 'avancados' ? '' : ' hidden'}>
      <fieldset class="ak-campo lf2-ia"><legend>Mercado</legend><span><label><input type="checkbox" data-lf2-f="ind" data-lf2-campo>Indústria</label><label><input type="checkbox" data-lf2-f="auto" data-lf2-campo>Auto</label></span></fieldset>
      ${sel('encForn', 'Enc. fornecedor', op('', 'Todos') + op('com', 'Com encomenda') + op('sem', 'Sem encomenda'))}
      ${sel('encCli', 'Enc. cliente', op('', 'Todos') + op('com', 'Com encomenda de cliente') + op('sem', 'Sem encomenda de cliente'))}
      <p class="lf2-av-dica">Enter passa ao campo seguinte; no último, volta à pesquisa. Os filtros aplicam-se logo.</p>
    </div>
    <div class="lf2-ativos" data-lf2-ativos aria-live="polite"></div>
  </section>

  <div class="lf2-trabalho">
    <section class="lf2-lista" aria-labelledby="${id('lista-t')}">
      <div class="lf2-lista-cab"><h2 id="${id('lista-t')}">Artigos em rutura</h2><p class="lf2-resumo" data-lf2-resumo></p></div>
      <div class="lf2-grelha" data-lf2-grelha></div>
    </section>
    <aside class="lf2-ativa" data-lf2-ativa aria-label="Encomenda ativa"></aside>
  </div>

  <!-- 26 out. (ela: «era engraçado as coisas funcionarem como este quadrado»): os detalhes de cada artigo numa janela
       flutuante, como as da área de trabalho — arrastar, redimensionar, minimizar, maximizar, fechar; várias ao mesmo tempo -->
  <div class="lf2-janelas" data-lf2-janelas data-por-cima></div>

  <footer class="ak-estado lf2-estado" data-lf2-estado role="status" aria-live="polite"></footer>
  <div class="lf2-dlg-fundo" data-lf2-dlg data-por-cima hidden></div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

const NOTA2 = 'Lista de Faltas v2 (26 out., briefing «Advanced Purchasing Workspace» e os prints do ERP antigo): a barra do antigo (F5–F11), «Visualizar por» com as teclas F1…F12 e a pesquisa Iniciado por/Contendo (Shift+F1/F2), as Ações de compra (Ctrl+F1…F9), a grelha com as colunas do antigo e a Encomenda ativa ao lado; clicar num artigo abre os detalhes (stock, classes de reposição, rotatividade) numa janela flutuante que se arrasta, redimensiona, minimiza e maximiza.';
/** Os estados da v1 que também têm v2 (o mesmo id). */
const PARES: Partial<Record<string, Cen2>> = {
  'compras-faltas': 'normal', 'faltas-avancados': 'avancados', 'faltas-carregar': 'carregar', 'faltas-sem-resultados': 'sem-resultados',
  'faltas-filtros': 'filtros', 'faltas-vazia': 'vazia', 'faltas-erro': 'erro', 'faltas-offline': 'offline', 'faltas-sem-ativa': 'sem-ativa',
};
const ESTADOS2: [Cen2, string, string][] = [
  ['visualizar', '20.11 · Visualizar por', 'O menu «Visualizar por» aberto: os sete modos do ERP antigo com as teclas; procura-se o modo a escrever.'],
  ['acoes', '20.12 · Ações de compra', 'As Opções do ERP antigo num menu (Ctrl+F1…F9); «Apagar ruturas» pede confirmação.'],
  ['sem-artigo', '20.13 · Sem artigo escolhido', 'Nenhuma linha escolhida: os detalhes abrem-se numa janela ao clicar num artigo (ou Enter).'],
  ['det-carregar', '20.14 · A carregar o artigo', 'A janela do artigo aberta e os dados ainda a chegar: o corpo espera no seu sítio.'],
  ['a-atualizar', '20.15 · A atualizar (F9)', 'Atualizar volta a ler a lista: as linhas ficam à vista, esbatidas, e a escolhida mantém-se.'],
  ['gerar', '20.16 · A gerar ruturas', 'Gerar ruturas (Ctrl+F2) a correr: o botão espera e a lista refaz-se com o stock de agora.'],
  ['ajuda', '20.17 · Ajuda à compra', 'Ajuda à compra (Ctrl+F3): a coluna «Qtd. sugerida» e a regra que a calcula.'],
  ['a-gravar', '20.18 · A gravar na encomenda', 'Para encomenda (Ctrl+F7) a gravar no rascunho: o botão espera; nada se diz antes da resposta.'],
  ['confirmado', '20.19 · Juntado à encomenda', 'O rascunho aceitou as linhas: o aviso diz quantas e a encomenda ativa mostra o valor novo.'],
  ['invalido', '20.20 · Editar com erro', 'Editar (F6) com uma quantidade inválida: o campo marcado e a mensagem; nada se grava.'],
  ['rejeitado', '20.21 · Recusado', 'Para encomenda com um artigo de outro fornecedor: recusado, e diz-se porquê; nada se grava.'],
  ['apagar', '20.22 · Apagar ruturas', 'Ctrl+F5: a confirmação diz quantas ruturas saem e como voltam (Gerar ruturas).'],
  ['permissao', '20.23 · Sem permissão', 'O perfil não altera faltas nem encomendas: as ações dizem porquê e a consulta continua.'],
  ['sessao', '20.24 · Sessão terminada', 'A sessão terminou: voltar a entrar pelo login comum; os filtros ficam.'],
  ['parcial', '20.25 · Dados parciais', 'Rotatividade pedida a 120 dias: só há 12 semanas; mostra-se o que há e diz-se.'],
  ['restaurada', '20.26 · Área de trabalho reposta', 'Ao voltar ao separador: os filtros, a visualização e o artigo escolhido como estavam.'],
];
/** O 20 com as duas versões (a v2 é a mais nova e abre por omissão) e os estados só da v2. */
export function ecrasFaltasV2(): Ecra<IdErp>[] {
  const v2 = (cen: Cen2) => ({ id: 'v2', nota: NOTA2, html: html2(cen) });
  const base = ecrasFaltas().map((e) => { const c = PARES[e.id as string]; return c ? { ...e, nome: e.nome.replace('Lista de faltas', 'Lista de Faltas'), versoes: [...e.versoes, v2(c)] as Ecra<IdErp>['versoes'] } : e; });
  return [...base, ...ESTADOS2.map(([cen, nome, objetivo]) => ({ id: `faltas2-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'compras-faltas' as IdErp, objetivo, versoes: [v2(cen)] as Ecra<IdErp>['versoes'] }))];
}
export type IdFaltas2 = `faltas2-${'visualizar' | 'acoes' | 'sem-artigo' | 'det-carregar' | 'a-atualizar' | 'gerar' | 'ajuda' | 'a-gravar' | 'confirmado' | 'invalido' | 'rejeitado' | 'apagar' | 'permissao' | 'sessao' | 'parcial' | 'restaurada'}`;
