/* =========================================================
   GOPARTS — 11 · Catálogo v3 (13 out. 2026)
   Ela, com as imagens do GO REPAIR: «faz os modelos e veículos no catálogo».
   É a v2 (que ela já viu e não se mexe) com os passos Modelos e Veículos
   feitos: a marca abre a tabela dos modelos (Modelo · Fabricado desde ·
   Fabricado até) e o modelo a dos veículos (Veículo · Ano · Combustível ·
   kW · cv · cc · Tração · Carroçaria · Motor). Os filtros de cada passo vão
   para o cartão azul de cima: o cartão fica no sítio e muda o que tem dentro.
   O HTML parte do da v2; o comportamento está em comportamento/catalogo-v3.ts.
   ========================================================= */
import catalogoV2 from './catalogo-v2.html?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import filterX from 'lucide-static/icons/filter-x.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';
import engine from 'lucide-static/icons/engine.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import gauge from 'lucide-static/icons/gauge.svg?raw';
import ruler from 'lucide-static/icons/ruler.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

const campoTexto = (id: string, rotulo: string, icone: string, ph: string, so: string) =>
  `<div class="campo"><label class="campo__label" for="cat3-${id}">${rotulo}</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(icone)}</span><input class="input" type="search" id="cat3-${id}" placeholder="${ph}" data-filtro="${so}"></div></div>`;
const campoLista = (id: string, rotulo: string, icone: string, chave: string) =>
  `<div class="campo"><label class="campo__label" for="cat3-${id}">${rotulo}</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(icone)}</span><select class="input" id="cat3-${id}" data-filtro="${chave}"><option value="">Todos</option></select></div></div>`;
const limpar = `<button type="button" class="btn btn--ghost cat3__limpar">${L(filterX, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>`;

/* no cartão azul: o cabeçalho e os filtros de cada passo */
const cartaoModelos = `
      <div class="cat3__cartao" data-so="modelos" hidden>
        <div class="cat2__pesquisa-cabeca"><span class="c22__marca cat2__icone" aria-hidden="true">${L(list)}</span><div><h1 class="cat2__titulo">Modelos <span class="cat3__de"></span></h1><p class="cat2__sub">Escolha o modelo. Filtre pelo nome ou pelo ano em que o veículo foi fabricado.</p></div></div>
        <div class="cat3__filtros cat3__filtros--modelos">
          ${campoTexto('modelo', 'Modelo', search, 'Ex.: Série 1, E87', 'texto')}
          ${campoLista('ano-modelo', 'Ano', calendar, 'ano')}
          ${limpar}
        </div>
      </div>`;
const cartaoVeiculos = `
      <div class="cat3__cartao" data-so="veiculos" hidden>
        <div class="cat2__pesquisa-cabeca"><span class="c22__marca cat2__icone" aria-hidden="true">${L(car)}</span><div><h1 class="cat2__titulo">Veículos <span class="cat3__de"></span></h1><p class="cat2__sub">Escolha a versão do veículo: o motor e a potência que estão no livrete.</p></div></div>
        <div class="cat3__filtros cat3__filtros--veiculos">
          ${campoTexto('veiculo', 'Veículo', search, 'Ex.: 1.5 dCi, 118d', 'texto')}
          ${campoLista('ano-veiculo', 'Ano', calendar, 'ano')}
          ${campoLista('motor', 'Motor', engine, 'motor')}
          ${campoLista('kw', 'kW', zap, 'kw')}
          ${campoLista('cv', 'cv', gauge, 'cv')}
          ${campoLista('cc', 'cc', ruler, 'cc')}
          ${limpar}
        </div>
      </div>`;

const topo = (volta: string, para: string, conta: string) =>
  `<div class="cat3__topo"><button type="button" class="btn btn--ghost btn--sm cat3__voltar" data-voltar="${para}">${L(arrowLeft, 'btn__icone')}<span class="btn__rotulo">${volta}</span></button><p class="cat3__conta"><strong>0</strong> ${conta}</p><span class="cat2__exemplo">exemplo</span></div>`;

/* na secção branca: as tabelas */
const vistas = `
      <div class="cat3__vista" data-so="modelos" hidden>
        ${topo('Marcas', 'marcas', 'modelos')}
        <div class="cg-tabela erp-tabela cat3__tabela cat3__tabela--modelos"><div class="erp-tabela__rolo"><table>
          <thead><tr><th>Modelo</th><th>Fabricado desde</th><th>Fabricado até</th><th class="cat3__ir"><span class="sr-only">Abrir</span></th></tr></thead>
          <tbody></tbody>
        </table></div></div>
        <p class="cat3__vazio" hidden>Nenhum modelo com esse nome ou desse ano. <button type="button" class="cat3__ligacao cat3__limpar">Limpar filtros</button></p>
      </div>
      <div class="cat3__vista" data-so="veiculos" hidden>
        ${topo('Modelos', 'modelos', 'veículos')}
        <div class="cg-tabela erp-tabela cat3__tabela cat3__tabela--veiculos"><div class="erp-tabela__rolo"><table>
          <thead><tr><th>Veículo</th><th>Ano</th><th>Combustível</th><th class="erp-num">kW</th><th class="erp-num">cv</th><th class="erp-num">cc</th><th>Tração</th><th>Carroçaria</th><th>Motor</th><th class="cat3__ir"><span class="sr-only">Escolher</span></th></tr></thead>
          <tbody></tbody>
        </table></div></div>
        <p class="cat3__vazio" hidden>Nenhum veículo com esses filtros. <button type="button" class="cat3__ligacao cat3__limpar">Limpar filtros</button></p>
      </div>`;

function construir(): string {
  let h = catalogoV2.replace(/\bcat2-/g, 'cat3-');
  h = h.replace('portal--cat2"', 'portal--cat2 portal--cat3"');
  h = h.replace('<main class="cat2">', '<main class="cat2 cat3" data-vista="marcas">');
  h = h.replace('<div class="cat2__pesquisa-cabeca">', '<div class="cat2__pesquisa-cabeca" data-so="marcas">');
  h = h.replace('<div class="cat2__campos">', '<div class="cat2__campos" data-so="marcas">');
  /* os filtros entram no fim do cartão azul */
  const fimCartao = h.indexOf('</section>');
  h = h.slice(0, fimCartao) + cartaoModelos + cartaoVeiculos + '\n    ' + h.slice(fimCartao);
  h = h.replace('<header class="cat2__marcas-cabeca">', '<header class="cat2__marcas-cabeca" data-so="marcas">');
  h = h.replace('<ul class="cat2__grelha"', '<ul class="cat2__grelha" data-so="marcas"');
  /* os modelos de exemplo da v2 dão lugar às duas tabelas */
  const a = h.indexOf('<div class="cat2__modelos" hidden>');
  const b = h.indexOf('</section>', a);
  h = h.slice(0, a) + vistas.trim() + '\n    ' + h.slice(b);
  return h;
}

export const catalogoV3 = construir();
