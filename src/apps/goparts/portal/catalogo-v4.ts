/* =========================================================
   GOPARTS — 11 · Catálogo v4 (13 out. 2026)
   Ela mandou a imagem de um catálogo novo: «Encontrar veículo» num painel à
   esquerda (campos uns por baixo dos outros, «Pesquisar» laranja em baixo) e
   as Marcas à direita, com a procura, Favoritas/Todas, a contagem, uma faixa
   a dizer o que fazer e cartões de marca maiores. Depois colou uma proposta
   de animações ligadas ao que o utilizador faz (cartões, Marca → Modelo,
   estrela, procura, painel que recolhe, risca dos passos), sem brilhos.
   Parte da v3 (os passos Modelos e Veículos continuam): o painel fica no
   sítio e troca o conteúdo; os filtros de Modelos e Veículos vão para ele.
   ========================================================= */
import { catalogoV3, L } from './catalogo-v3';
import info from 'lucide-static/icons/info.svg?raw';
import panelLeftClose from 'lucide-static/icons/panel-left-close.svg?raw';
import panelLeftOpen from 'lucide-static/icons/panel-left-open.svg?raw';
import house from 'lucide-static/icons/house.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';

const recolher = `<button type="button" class="cat4__recolher" aria-expanded="true" aria-label="Recolher o painel" data-dica="Recolher o painel">${L(panelLeftClose, 'cat4__recolher-fechar')}${L(panelLeftOpen, 'cat4__recolher-abrir')}</button>`;

/* ---------- os Modelos como na segunda imagem dela (13 out.) ----------
   Em cima, o caminho (Catálogo › Marcas › BMW › Modelos) no lugar dos passos;
   por baixo, a faixa da marca com o logótipo, «Remover dos favoritos» e os
   passos em botões; à esquerda, «Filtrar modelos»; à direita, a tabela com o
   código, o tipo e o botão de abrir, e «Ordenar por». */
const S = L(chevronRight, 'cat4__sep');
const caminho = `
      <nav class="cat4__caminho" aria-label="Onde está" data-so="modelos veiculos" hidden><ol>
        <li><a href="#" data-ir="inicio" aria-label="Início">${L(house)}</a></li>
        <li>${S}<span>Catálogo</span></li>
        <li>${S}<button type="button" data-ir-vista="marcas">Marcas</button></li>
        <li>${S}<button type="button" data-ir-vista="modelos" class="cat4__c-marca"></button></li>
        <li class="cat4__c-modelo">${S}<span></span></li>
        <li>${S}<span class="cat4__c-atual" aria-current="page"></span></li>
      </ol></nav>`;
const PASSOS = ['Marcas', 'Modelos', 'Veículos', 'Grupo montagem', 'Referências', 'Detalhes'];
const heroi = `
      <section class="cat4__heroi" data-so="modelos veiculos" hidden>
        <span class="cat4__heroi-logo" aria-hidden="true"></span>
        <div class="cat4__heroi-texto"><h1 class="cat4__heroi-titulo"></h1><p class="cat4__heroi-sub"></p></div>
        <button type="button" class="btn btn--ghost cat4__favorita" aria-pressed="true">${L(star, 'btn__icone')}<span class="btn__rotulo">Remover dos favoritos</span></button>
        <nav class="cat4__pilulas" aria-label="Passos do catálogo">${PASSOS.map((p, i) => `<button type="button" class="cat2__passo cat4__pilula" data-passo="${i}"${i > 1 ? ' disabled' : ''}>${p}</button>`).join('')}</nav>
      </section>`;
const filtrarModelos = `
      <div class="cat3__cartao cat4__filtrar" data-so="modelos" hidden>
        <h2 class="cat4__filtrar-titulo">${L(search)}Filtrar modelos</h2>
        <div class="cat4__procura"><input class="input" type="search" id="cat4-modelo" placeholder="Pesquisar modelo" aria-label="Pesquisar modelo" data-filtro="texto"><span class="cat4__procura-lupa" aria-hidden="true">${L(search)}</span></div>
        <fieldset class="cat4__grupo"><legend>Ano de fabrico</legend>
          <div class="cat4__de-ate">
            <div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(calendar)}</span><select class="input" id="cat4-de" aria-label="Fabricado de" data-filtro="de"><option value="">De</option></select></div>
            <span aria-hidden="true">–</span>
            <div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(calendar)}</span><select class="input" id="cat4-ate" aria-label="Fabricado até" data-filtro="ate"><option value="">Até</option></select></div>
          </div>
        </fieldset>
        <fieldset class="cat4__grupo"><legend>Tipo de carroçaria</legend><ul class="cat4__tipos"></ul></fieldset>
        <button type="button" class="btn btn--ghost cat3__limpar cat4__limpar">${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>
      </div>`;
const vistaModelos = `
      <div class="cat3__vista cat4__vista-modelos" data-so="modelos" hidden>
        <div class="cat4__cabeca">
          <span class="c22__marca cat4__cabeca-icone" aria-hidden="true">${L(list)}</span>
          <div><h2 class="cat4__cabeca-titulo">Modelos <span class="cat4__de-marca"></span></h2><p class="cat4__cabeca-sub">Selecione o modelo para ver os veículos e peças disponíveis.</p></div>
          <p class="cat3__conta"><strong>0</strong> modelos encontrados</p>
          <div class="cat4__ordem campo__caixa"><label class="campo__chip cat4__ordem-rotulo" for="cat4-ordem">${L(arrowUpDown)}Ordenar por</label><select class="input" id="cat4-ordem" data-ordem><option value="az">Nome (A-Z)</option><option value="za">Nome (Z-A)</option><option value="novos">Mais recentes</option><option value="antigos">Mais antigos</option></select></div>
        </div>
        <div class="cg-tabela erp-tabela cat3__tabela cat4__tabela"><div class="erp-tabela__rolo"><table>
          <thead><tr><th>Modelo</th><th>Código</th><th>Fabricado desde</th><th>Fabricado até</th><th>Tipo</th><th class="cat4__accoes">Ações</th></tr></thead>
          <tbody></tbody>
        </table></div></div>
        <p class="cat3__vazio" hidden>Nenhum modelo com esses filtros. <button type="button" class="cat3__ligacao cat3__limpar">Limpar filtros</button></p>
      </div>`;

/** Troca o bloco que começa em `de` e acaba antes de `ate` por `novo`. */
function trocar(h: string, de: string, ate: string, novo: string): string {
  const a = h.indexOf(de), b = h.indexOf(ate, a);
  if (a < 0 || b < 0) throw new Error('catálogo v4: não encontrei ' + de);
  return h.slice(0, a) + novo.trim() + '\n      ' + h.slice(b);
}

function construir(): string {
  let h = catalogoV3.replace(/\bcat3-/g, 'cat4-');
  h = h.replace('portal--cat3"', 'portal--cat3 portal--cat4"');
  h = h.replace('<main class="cat2 cat3"', '<main class="cat2 cat3 cat4"');
  /* o painel da esquerda: o mesmo cartão, com outro título e o botão de recolher */
  h = h.replace('<section class="cat2__pesquisa c22__cartao c22__cartao--azul">', `<section class="cat2__pesquisa c22__cartao c22__cartao--azul cat4__painel" aria-label="Encontrar veículo">\n      ${recolher}`);
  h = h.replace('<h1 class="cat2__titulo">Identificar veículo</h1><p class="cat2__sub">Pela matrícula, pelo n.º de chassis, pelo motor ou pela descrição.</p>',
    '<h1 class="cat2__titulo">Encontrar veículo</h1><p class="cat2__sub">Selecione os dados do veículo para encontrar as peças compatíveis.</p>');
  /* as marcas: o texto da imagem, a contagem e a faixa */
  h = h.replace('<p class="cat2__marcas-sub">Escolha a marca do veículo. A estrela marca as suas favoritas.</p>', '<p class="cat2__marcas-sub">Escolha uma marca para continuar. A estrela marca as suas favoritas.</p>');
  h = h.replace('placeholder="Procurar marca"', 'placeholder="Procurar marca…"');
  h = h.replace(/(<nav class="cat2__filtro"[\s\S]*?<\/nav>)/, '$1\n        <p class="cat4__total" aria-live="polite"><span class="cat2__total">0</span> marcas</p>');
  /* os Modelos da segunda imagem */
  h = trocar(h, '<div class="cat3__cartao" data-so="modelos" hidden>', '<div class="cat3__cartao" data-so="veiculos" hidden>', filtrarModelos);
  h = trocar(h, '<div class="cat3__vista" data-so="modelos" hidden>', '<div class="cat3__vista" data-so="veiculos" hidden>', vistaModelos);
  /* nos Veículos, o painel diz só o que é (o modelo já está na faixa de cima) */
  h = h.replace(/(<div class="cat3__cartao" data-so="veiculos" hidden>\s*)<div class="cat2__pesquisa-cabeca">[\s\S]*?<\/p><\/div><\/div>/, `$1<h2 class="cat4__filtrar-titulo">${L(search)}Filtrar veículos</h2>`);
  h = h.replace('<main class="cat2 cat3 cat4" data-vista="marcas">', `<main class="cat2 cat3 cat4" data-vista="marcas">${caminho}${heroi}`);
  h = h.replace('</header>\n      <ul class="cat2__grelha"', `</header>\n      <p class="cat4__faixa" data-so="marcas">${L(info)}<span>Escolha uma marca para ver os modelos, veículos e peças disponíveis.</span></p>\n      <ul class="cat2__grelha"`);
  return h;
}

export const catalogoV4 = construir();
