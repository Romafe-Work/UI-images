/* =========================================================
   ROMAFE — os ecrãs de carregamento (GoShop e GoParts)
   Ela, 8 out. 2026: «faz os screens de loading para ambas as apps, o
   loading de full page, loading em tabela, skeletons… todos os tipos».
   Os mesmos sete nas duas apps, dentro da moldura do portal de cada uma.

   Regras: o esqueleto tem a forma do que vai aparecer (o ecrã não salta
   quando chega); o girador só aparece onde não se sabe a forma; a barra
   com percentagem só quando se sabe quanto falta; e nada mexe com
   «reduzir movimento». Os botões a carregar mantêm ícone e texto.
   ========================================================= */
import type { Ecra } from '../tipos';
import { portal, type Produto } from '../../apps/goparts/portal/base';

export type IdCarregar = 'carga-pagina' | 'carga-inicio' | 'carga-tabela' | 'carga-pesquisa' | 'carga-mais' | 'carga-progresso' | 'carga-pecas';

const I = (d: string, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const GIRADOR = (cls = '') => `<span class="girador${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;
/** uma barra de esqueleto: largura em %, e a altura pela classe */
const E = (largura: number | string, cls = '') => `<span class="esq${cls ? ' ' + cls : ''}" style="width:${typeof largura === 'number' ? largura + '%' : largura}"></span>`;

const I_PDF = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>';
const I_X = '<path d="M18 6 6 18M6 6l12 12"/>';
const I_DE_NOVO = '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>';
const I_GUARDAR = '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>';
const I_SEM_REDE = '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M16.8 11.2a10 10 0 0 1 2.2 1.7"/><path d="M12 20h.01"/>';

/* ---------- 20 · a página inteira ---------- */
function pagina(p: Produto): string {
  return `<div class="carga-pagina" role="status" aria-live="polite">
    <span class="romafe carga-pagina__romafe">ROMAFE</span>
    <span class="carga-pagina__risco" aria-hidden="true"></span>
    <p class="carga-pagina__produto">${p.nome}</p>
    <div class="progresso progresso--indeterminado carga-pagina__barra" aria-hidden="true"><span></span></div>
    <p class="carga-pagina__texto">A preparar a sua conta…</p>
  </div>`;
}

/* ---------- 21 · o Início em esqueleto ---------- */
function painelEsq(campos: number, cor: string): string {
  return `<section class="cg-painel" aria-hidden="true">
      <div class="cg-painel__cabeca cg-painel__cabeca--${cor}">${E(36, 'esq--escuro esq--titulo')}</div>
      <div class="cg-painel__corpo">${Array.from({ length: campos }, () => `
        <div class="cg-campo">${E(30, 'esq--rotulo')}${E('100%', 'esq--campo')}</div>`).join('')}
      </div>
      <div class="cg-painel__pe">${E('96px', 'esq--botao')}</div>
    </section>`;
}
function inicio(p: Produto): string {
  return portal(null, `<div class="portal portal--carga" aria-busy="true">
  <main class="cg-paineis">
    <p class="sr-only" role="status">A carregar o Início</p>
    ${painelEsq(4, 'azul')}${painelEsq(4, 'azul')}${painelEsq(1, 'laranja')}
  </main>
</div>`, p);
}

/* ---------- 22 · uma tabela a carregar ---------- */
function linhasEsq(n: number, colunas: number[]): string {
  return Array.from({ length: n }, (_, i) => `<tr class="cg-linha">${colunas.map((c) => `<td>${E(Math.max(30, c - (i % 3) * 12), 'esq--texto')}</td>`).join('')}</tr>`).join('');
}
const CABECA = ['Pedido', 'Data', 'Armazém', 'Morada de entrega', 'O seu pedido', 'Valor', 'Estado', 'Ações'];
function tabela(corpo: string, rodape = '', barra = true): string {
  return `<section class="cg-tabela">
      <div class="cg-tabela__topo"><h2 class="cg-tabela__titulo">Os seus pedidos</h2><p class="cg-tabela__estado" role="status">${barra ? GIRADOR('girador--pequeno') + 'A carregar pedidos…' : 'A mostrar 3 de 48'}</p></div>
      ${barra ? '<div class="progresso progresso--indeterminado progresso--fino" aria-hidden="true"><span></span></div>' : ''}
      <table><thead><tr>${CABECA.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${corpo}</tbody></table>
      ${rodape}
    </section>`;
}
function filtrosFeitos(): string {
  return `<section class="cg-filtros">
      <div class="campo"><label class="campo__label">Data a partir de</label><input class="input" value="01/09/2026" disabled></div>
      <div class="campo"><label class="campo__label">Data até</label><input class="input" value="08/10/2026" disabled></div>
      <div class="campo"><label class="campo__label">Referência</label><input class="input" placeholder="Introduza a referência" disabled></div>
      <button type="button" class="btn btn--acao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A pesquisar…</span></button>
    </section>`;
}
function cabecalho(titulo: string, sub: string): string {
  return `<header class="cg-cabeca"><h1 class="cg-cabeca__titulo">${titulo}</h1><p class="cg-cabeca__sub">${sub}</p></header>`;
}
function emTabela(p: Produto): string {
  return portal('pedidos', `<div class="portal portal--carga" aria-busy="true">
  <main class="cg-pagina">
    ${cabecalho('Histórico de pedidos', 'Pesquise e acompanhe os seus pedidos.')}
    ${filtrosFeitos()}
    ${tabela(linhasEsq(7, [70, 60, 50, 90, 60, 50, 60, 40]))}
  </main>
</div>`, p);
}

/* ---------- 23 · uma pesquisa em curso ---------- */
function cartaoPeca(): string {
  return `<article class="cg-peca" aria-hidden="true">
      ${E('100%', 'esq--imagem')}
      ${E(40, 'esq--rotulo')}${E(85, 'esq--texto')}${E(60, 'esq--texto')}
      <div class="cg-peca__pe">${E(30, 'esq--preco')}${E('40px', 'esq--botao esq--quadrado')}</div>
    </article>`;
}
function pesquisa(p: Produto): string {
  return portal('catalogo', `<div class="portal portal--carga" aria-busy="true">
  <main class="cg-pagina">
    <section class="cg-pesquisa">
      <div class="campo"><label class="campo__label">Matrícula</label><input class="input" value="AA-00-BB" disabled></div>
      <div class="campo"><label class="campo__label">Família</label><input class="input" value="Travagem" disabled></div>
      <button type="button" class="btn btn--acao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A pesquisar…</span></button>
    </section>
    <p class="cg-procura" role="status">${GIRADOR()}A procurar peças de travagem para o Renault Clio IV 1.5 dCi…</p>
    <div class="cg-pecas">${Array.from({ length: 8 }, cartaoPeca).join('')}</div>
  </main>
</div>`, p);
}

/* ---------- 24 · carregar mais, no fim da tabela ---------- */
const LINHAS_FEITAS = [
  ['P2026/001256', '07/10/2026', 'Porto', 'Rua da Indústria, 123', '5 artigos', '342,50 €', 'Processado'],
  ['P2026/001233', '06/10/2026', 'Lisboa', 'Av. Infante D. Henrique, 55', '12 artigos', '1 245,90 €', 'Processado'],
  ['P2026/001198', '02/10/2026', 'Porto', 'Rua da Indústria, 123', '3 artigos', '87,30 €', 'Por recolher'],
];
function mais(p: Produto): string {
  const feitas = LINHAS_FEITAS.map((l) => `<tr>${l.map((c, i) => `<td>${i === 6 ? `<span class="cg-estado${c === 'Processado' ? '' : ' cg-estado--aviso'}">${c}</span>` : c}</td>`).join('')}<td><button type="button" class="btn btn--ghost btn--sm">${I('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 'btn__icone')}<span class="btn__rotulo">Ver</span></button></td></tr>`).join('');
  return portal('pedidos', `<div class="portal portal--carga">
  <main class="cg-pagina">
    ${cabecalho('Histórico de pedidos', 'Os pedidos chegam aos poucos: os primeiros já se veem, os outros estão a vir.')}
    ${tabela(feitas + linhasEsq(2, [70, 60, 50, 90, 60, 50, 60, 40]), `<div class="cg-mais" role="status">${GIRADOR('girador--pequeno')}A carregar mais pedidos… <span class="cg-mais__conta">3 de 48</span></div>`, false)}
  </main>
</div>`, p);
}

/* ---------- 25 · progresso com percentagem ---------- */
function progresso(p: Produto): string {
  return portal('guias', `<div class="portal portal--carga">
  <main class="cg-pagina cg-pagina--atras" aria-hidden="true">
    ${cabecalho('Guias de remessa', 'Consulte e acompanhe os seus documentos de expedição.')}
    ${tabela(linhasEsq(5, [70, 60, 50, 90, 60, 50, 60, 40]).replace(/class="esq /g, 'class="esq esq--parado '), '', false).replace('Os seus pedidos', 'As suas guias')}
  </main>
  <div class="cg-veu"></div>
  <section class="cg-dialogo" role="dialog" aria-labelledby="cg-dialogo-titulo">
    <div class="cg-dialogo__icone">${I(I_PDF)}</div>
    <h2 class="cg-dialogo__titulo" id="cg-dialogo-titulo">A gerar o PDF</h2>
    <p class="cg-dialogo__texto">Guia GR-2026-001256 · 12 páginas</p>
    <div class="progresso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="64"><span style="width:64%"></span></div>
    <p class="cg-dialogo__conta"><span>Página 8 de 12</span><strong>64%</strong></p>
    <button type="button" class="btn btn--ghost btn--bloco">${I(I_X, 'btn__icone')}<span class="btn__rotulo">Cancelar</span></button>
  </section>
</div>`, p);
}

/* ---------- 26 · as peças a carregar ---------- */
function pecas(p: Produto): string {
  return portal(null, `<div class="portal portal--carga">
  <main class="cg-pagina cg-montra">
    ${cabecalho('Os estados de carregamento', 'As peças que esperam, e o que se vê quando a espera falha.')}
    <div class="cg-grelha">
      <section class="cg-caso"><h3>Botão a carregar</h3>
        <div class="cg-caso__linha">
          <button type="button" class="btn btn--acao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A entrar…</span></button>
          <button type="button" class="btn btn--ghost is-a-carregar" disabled>${GIRADOR()}<span class="btn__rotulo">A guardar…</span></button>
        </div>
        <p class="cg-caso__nota">O botão fica com a mesma largura, desliga-se, e o ícone passa a girador.</p></section>
      <section class="cg-caso"><h3>Lista a carregar</h3>
        <div class="campo"><label class="campo__label">Modelo</label>
          <div class="cg-select">${GIRADOR('girador--pequeno')}<span>A carregar modelos da Renault…</span></div></div>
        <p class="cg-caso__nota">A lista só abre quando chega; até lá diz o que está a vir.</p></section>
      <section class="cg-caso"><h3>Campo a verificar</h3>
        <div class="campo"><label class="campo__label">Matrícula</label>
          <div class="cg-input-girador"><input class="input" value="AA-00-BB" readonly>${GIRADOR('girador--pequeno')}</div></div>
        <p class="cg-caso__nota">A verificar a matrícula enquanto se escreve, sem bloquear o resto.</p></section>
      <section class="cg-caso"><h3>Aviso a guardar</h3>
        <div class="cg-toast" role="status">${GIRADOR('girador--pequeno')}<span>A guardar a lista «Revisão Clio»…</span></div>
        <div class="cg-toast cg-toast--feito" role="status">${I(I_GUARDAR)}<span>Lista guardada</span></div>
        <p class="cg-caso__nota">O aviso troca de texto quando acaba; não aparece outro por cima.</p></section>
      <section class="cg-caso"><h3>Imagem a carregar</h3>
        <div class="cg-imagens">${E('100%', 'esq--imagem')}${E('100%', 'esq--imagem')}<div class="cg-imagem-feita">${I('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>')}<span>Disco de travão</span></div></div>
        <p class="cg-caso__nota">O espaço da imagem fica reservado; o texto à volta não salta.</p></section>
      <section class="cg-caso"><h3>Falhou o carregamento</h3>
        <div class="cg-falha">${I(I_SEM_REDE)}<div><p class="cg-falha__titulo">Não foi possível carregar os pedidos</p><p class="cg-falha__texto">Verifique a ligação. O que já tinha escrito ficou guardado.</p></div>
          <button type="button" class="btn btn--ghost btn--sm">${I(I_DE_NOVO, 'btn__icone')}<span class="btn__rotulo">Tentar de novo</span></button></div>
        <p class="cg-caso__nota">Diz o que falhou e dá uma saída, no sítio onde ia aparecer o conteúdo.</p></section>
    </div>
  </main>
</div>`, p);
}

/** Os sete ecrãs de carregamento, para a app que os pede. */
export function ecrasCarregar(p: Produto): Ecra<IdCarregar>[] {
  const FLUXO = 'Carregamento';
  const e = (id: IdCarregar, nome: string, objetivo: string, html: string): Ecra<IdCarregar> =>
    ({ id, nome, fluxo: FLUXO, objetivo, versoes: [{ id: 'v1', nota: 'Primeira versão', html }] });
  return [
    e('carga-pagina', '20 · A carregar a página', 'Depois de entrar, enquanto o portal ainda não existe: o ROMAFE, o nome da app e uma barra sem fim. Não há girador ao centro sozinho: a barra diz que está a andar.', pagina(p)),
    e('carga-inicio', '21 · Esqueleto do Início', 'O Início com a forma dos três painéis em esqueleto: quando os dados chegam, nada muda de sítio.', inicio(p)),
    e('carga-tabela', '22 · Tabela a carregar', 'Os filtros já escolhidos e a tabela com a cabeça à vista, uma barra fina por cima e linhas em esqueleto.', emTabela(p)),
    e('carga-pesquisa', '23 · Pesquisa em curso', 'O botão em «A pesquisar…», a frase do que se está a procurar e os cartões das peças em esqueleto.', pesquisa(p)),
    e('carga-mais', '24 · Carregar mais', 'Os primeiros pedidos já se veem e os seguintes vêm a caminho, no fim da tabela.', mais(p)),
    e('carga-progresso', '25 · Progresso com percentagem', 'Quando se sabe quanto falta (gerar um PDF de 12 páginas): a barra cheia até onde vai, a página e a percentagem, e «Cancelar».', progresso(p)),
    e('carga-pecas', '26 · Estados de carregamento', 'As peças pequenas: botão, lista, campo a verificar, aviso a guardar, imagem a carregar e a falha com «Tentar de novo».', pecas(p)),
  ];
}

export const DESCRICAO_CARREGAR = 'O que se vê enquanto se espera: a página inteira, esqueletos, tabelas, pesquisas, progresso e as peças pequenas.';
