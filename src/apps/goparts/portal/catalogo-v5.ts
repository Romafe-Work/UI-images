/* =========================================================
   GOPARTS — 11 · Catálogo v5 (13 out. 2026)
   A v4 (que ela já viu publicada) com o passo Veículos da terceira imagem
   dela: os Veículos ocupam a largura toda — em cima, uma barra «BMW / 1 (E81)»
   com a marca à direita; por baixo, «Filtrar veículos» com seis listas em
   duas linhas e «Limpar filtros»; depois, «9 veículos encontrados» com
   «Resultados por página», Tabela / Lista e a tabela com o (i) de cada linha,
   que abre os detalhes por baixo dela. A imagem era do GO REPAIR; aqui fica
   com a cara do GoParts. Marcas e Modelos ficam como na v4.
   ========================================================= */
import { catalogoV4 } from './catalogo-v4';
import { L } from './catalogo-v3';
import house from 'lucide-static/icons/house.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import engine from 'lucide-static/icons/engine.svg?raw';
import gauge from 'lucide-static/icons/gauge.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import ruler from 'lucide-static/icons/ruler.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import factory from 'lucide-static/icons/factory.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import listTree from 'lucide-static/icons/list-tree.svg?raw';
import columns3 from 'lucide-static/icons/columns-3.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import { GRUPOS, FABRICANTES, ARVORE } from './catalogo-dados';

const barra = `
      <div class="cat5__barra" data-so="veiculos" hidden>
        <a href="#" class="cat5__casa" data-ir="inicio" aria-label="Início">${L(house)}</a>
        <h1 class="cat5__titulo"><button type="button" class="cat5__t-marca" data-ir-vista="modelos"></button><span aria-hidden="true">/</span><span class="cat5__t-modelo"></span></h1>
        <div class="cat5__marca"><span class="cat5__logo" aria-hidden="true"></span><strong class="cat5__m-marca"></strong><span class="cat5__m-modelo"></span></div>
      </div>`;

const lista = (id: string, rotulo: string, icone: string, chave: string, vazio: string) =>
  `<div class="campo"><label class="campo__label" for="cat5-${id}">${rotulo}</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(icone)}</span><select class="input" id="cat5-${id}" data-filtro="${chave}" data-vazio="${vazio}"><option value="">${vazio}</option></select></div></div>`;
const filtros = `
      <div class="cat3__cartao cat5__cartao" data-so="veiculos" hidden>
        <div class="cat5__cartao-cabeca">
          <span class="cat5__funil" aria-hidden="true">${L(funnel)}</span>
          <div><h2 class="cat5__cartao-titulo">Filtrar veículos</h2><p class="cat5__cartao-sub">Refine a sua pesquisa para encontrar a variante pretendida.</p></div>
          <button type="button" class="btn btn--ghost cat3__limpar cat5__limpar">${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>
        </div>
        <div class="cat5__filtros">
          ${lista('veiculo', 'Veículo', car, 'versao', 'Selecionar veículo')}
          ${lista('ano', 'Ano', calendar, 'ano', 'Selecionar ano')}
          ${lista('motor', 'Motor', engine, 'motor', 'Selecionar motor')}
          ${lista('kw', 'kW', gauge, 'kw', 'Selecionar kW')}
          ${lista('cv', 'cv', zap, 'cv', 'Selecionar cv')}
          ${lista('cc', 'cc', ruler, 'cc', 'Selecionar cc')}
        </div>
      </div>`;

/* as colunas que se ordenam (a proposta dela: potência, ano, cilindrada) */
const ord = (k: string, t: string, cls = '') => `<th${cls ? ` class="${cls}"` : ''} aria-sort="none"><button type="button" class="cat5__ordenar" data-ordenar="${k}">${t}${L(arrowUpDown)}</button></th>`;
const resultados = `
      <div class="cat3__vista cat5__resultados" data-so="veiculos" data-modo="tabela" hidden>
        <div class="cat5__resultados-cabeca">
          <p class="cat3__conta"><strong>0</strong> veículos encontrados</p>
          <label class="cat5__por-pagina">Resultados por página:<span class="campo__caixa"><select class="input" id="cat5-por-pagina" data-por-pagina><option>10</option><option selected>25</option><option>50</option></select></span></label>
          <div class="cat5__modos" role="group" aria-label="Ver como">
            <button type="button" class="cat5__modo" data-modo="tabela" aria-pressed="true">${L(table)}Tabela</button>
            <button type="button" class="cat5__modo" data-modo="lista" aria-pressed="false">${L(list)}Lista</button>
          </div>
        </div>
        <div class="cg-tabela erp-tabela cat3__tabela cat5__tabela"><div class="erp-tabela__rolo"><table>
          <thead><tr><th class="cat5__i"><span class="sr-only">Detalhes</span></th><th>Veículo</th>${ord('ano', 'Ano')}<th>Combustível</th>${ord('kw', 'kW', 'erp-num')}${ord('cv', 'cv', 'erp-num')}${ord('cc', 'cc', 'erp-num')}<th>Tração</th><th>Tipo de carroçaria</th><th>Motor</th></tr></thead>
          <tbody></tbody>
        </table></div></div>
        <p class="cat3__vazio" hidden>Nenhum veículo com esses filtros. <button type="button" class="cat3__ligacao cat3__limpar">Limpar filtros</button></p>
      </div>`;

/* ---------- Referências (a quarta imagem dela) ----------
   Fabricantes em etiquetas (com «Adicionar»), Grupo de montagem, Agrupar;
   à direita, Comparar (n), Ver próprias e Tabela / Grelha. «Ver próprias»
   mostra só o que tem stock nos armazéns da Romafe (é o que pareceu querer
   dizer; o «D» da imagem não se percebeu e ficou de fora). */
const refsFiltros = `
      <div class="cat3__cartao cat5__cartao cat5__refs-filtros" data-so="referencias" hidden>
        <div class="cat5__refs-campos">
          <div class="campo cat5__campo-fab"><span class="campo__label" id="cat5-fab-rotulo">Fabricantes</span>
            <div class="cat5__chips" role="group" aria-labelledby="cat5-fab-rotulo"><span class="cat5__chips-lista"></span>
              <span class="campo__caixa cat5__mais"><span class="campo__chip" aria-hidden="true">${L(factory)}</span><select class="input" id="cat5-mais-fab" aria-label="Adicionar fabricante" data-mais-fabricante><option value="">Adicionar fabricante</option>${FABRICANTES.map((f) => `<option>${f}</option>`).join('')}</select></span></div></div>
          <div class="campo"><label class="campo__label" for="cat5-ref-grupo">Grupo de montagem</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(layers)}</span><select class="input" id="cat5-ref-grupo" data-ref-grupo><option value="">Todos os grupos</option>${GRUPOS.map((g) => `<option>${g}</option>`).join('')}</select></div></div>
          <div class="campo"><label class="campo__label" for="cat5-agrupar">Agrupar</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(listTree)}</span><select class="input" id="cat5-agrupar" data-agrupar><option value="">Sem agrupar</option><option value="fabricante">Por fabricante</option><option value="grupo">Por grupo de montagem</option></select></div></div>
        </div>
        <div class="cat5__refs-accoes">
          <button type="button" class="btn btn--ghost cat5__comparar" disabled>${L(scale, 'btn__icone')}<span class="btn__rotulo">Comparar (<span class="cat5__n-comparar">0</span>)</span></button>
          <button type="button" class="btn btn--ghost cat5__proprias" aria-pressed="false" data-dica="Só as referências com stock nos armazéns da Romafe">${L(warehouse, 'btn__icone')}<span class="btn__rotulo">Ver próprias</span></button>
          <div class="cat5__modos" role="group" aria-label="Ver como">
            <button type="button" class="cat5__modo" data-modo="tabela" aria-pressed="true">${L(table)}Tabela</button>
            <button type="button" class="cat5__modo" data-modo="grelha" aria-pressed="false">${L(layoutGrid)}Grelha</button>
          </div>
        </div>
      </div>`;
const ordRef = (k: string, t: string, cls = '') => `<th class="${cls}" aria-sort="none"><button type="button" class="cat5__ordenar" data-ordenar-ref="${k}">${t}${L(arrowUpDown)}</button></th>`;
const refsVista = `
      <div class="cat3__vista cat5__resultados cat5__refs" data-so="referencias" data-modo="tabela" hidden>
        <div class="cat5__resultados-cabeca"><p class="cat3__conta cat5__refs-conta"><strong>0</strong> referências</p><span class="cat2__exemplo">exemplo</span></div>
        <div class="cg-tabela erp-tabela cat3__tabela cat5__tabela cat5__tabela-refs"><div class="erp-tabela__rolo"><table>
          <thead><tr><th class="cat5__marcar"><input type="checkbox" class="cat5__todas" aria-label="Marcar todas para comparar"></th><th>Imagem</th><th>Referência</th><th>Descrição</th>${ordRef('preco', 'Preço', 'erp-num')}<th class="erp-num">Desc.</th><th class="erp-num">Líquido</th>${ordRef('stock', 'Stock')}</tr></thead>
          <tbody></tbody>
        </table></div></div>
        <p class="cat5__refs-vazio" hidden>Nenhuma referência com estes filtros. <button type="button" class="cat3__ligacao cat5__refs-limpar">Ver todos os fabricantes e grupos</button></p>
        <section class="cat5__comparacao" hidden aria-label="Comparação"><h3 class="cat5__comparacao-titulo">${L(scale)}Comparar referências</h3><div class="cat5__comparacao-grelha"></div></section>
      </div>`;

/* ---------- Universal (a quinta imagem dela) ---------- */
const arvore = ARVORE.map(([cat, grupos], i) => `<li class="cat5__ramo"><button type="button" class="cat5__abrir-ramo" aria-expanded="false" aria-controls="cat5-ramo-${i}"><span class="cat5__mais-menos" aria-hidden="true">${L(plus)}</span>${cat}</button><ul class="cat5__folhas" id="cat5-ramo-${i}" hidden>${grupos.map((g) => `<li><button type="button" class="cat5__folha" data-grupo="${g}">${g}</button></li>`).join('')}</ul></li>`).join('');
const todos = ARVORE.flatMap(([cat, gs]) => gs.map((g) => [g, cat] as const)).sort((a, b) => a[0].localeCompare(b[0], 'pt'));
const listaGrupos = todos.map(([g, cat]) => `<li><button type="button" class="cat5__folha" data-grupo="${g}">${g}<span class="cat5__folha-cat">${cat}</span></button></li>`).join('');
const colunas = `<ul class="cat5__col cat5__col--cat">${ARVORE.map(([cat], i) => `<li><button type="button" class="cat5__col-cat" data-cat="${i}"${i === 0 ? ' aria-current="true"' : ''}>${cat}${L(chevronRight)}</button></li>`).join('')}</ul>`
  + ARVORE.map(([, gs], i) => `<ul class="cat5__col cat5__col--grupos" data-de-cat="${i}"${i ? ' hidden' : ''}>${gs.map((g) => `<li><button type="button" class="cat5__folha" data-grupo="${g}">${g}</button></li>`).join('')}</ul>`).join('');
const universalProcura = `
      <div class="cat3__cartao cat5__cartao cat5__u-procura" data-so="universal" hidden>
        <div class="campo__caixa cat5__u-campo"><span class="campo__chip" aria-hidden="true">${L(search)}</span><input class="input" type="search" id="cat5-u-procura" placeholder="Introduza grupo de montagem" aria-label="Grupo de montagem"></div>
        <button type="button" class="btn btn--acao cat5__u-pesquisar">${L(search, 'btn__icone')}<span class="btn__rotulo">Pesquisar</span></button>
        <button type="button" class="btn btn--ghost cat5__u-limpar">${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar</span></button>
      </div>`;
const universal = `
      <div class="cat5__universal" data-so="universal" hidden>
        <section class="cat5__u-grupos" aria-label="Grupos de montagem">
          <nav class="cat5__formas" aria-label="Ver os grupos como">
            <button type="button" class="cat5__forma" data-forma="arvore" aria-current="true">${L(listTree)}Árvore</button>
            <button type="button" class="cat5__forma" data-forma="lista">${L(list)}Lista</button>
            <button type="button" class="cat5__forma" data-forma="colunas">${L(columns3)}Colunas</button>
          </nav>
          <ul class="cat5__arvore" data-de-forma="arvore">${arvore}</ul>
          <ul class="cat5__lista-grupos" data-de-forma="lista" hidden>${listaGrupos}</ul>
          <div class="cat5__colunas" data-de-forma="colunas" hidden>${colunas}</div>
          <p class="cat5__u-vazio" hidden>Nenhum grupo com esse nome.</p>
        </section>
        <aside class="cat5__u-lado" aria-live="polite">
          <div class="cat5__u-cabeca"><h2 class="cat5__u-grupo">Escolha um grupo de montagem</h2>
            <button type="button" class="btn btn--acao cat5__u-ver" disabled><span class="btn__rotulo">Ver referências</span>${L(arrowRight, 'btn__icone')}</button></div>
          <p class="cat5__u-sub">Os fabricantes aparecem aqui. Escolha um, ou «Todos».</p>
          <h3 class="cat5__u-titulo-fab">${L(factory)}Fabricantes</h3>
          <ul class="cat5__u-fabricantes"></ul>
        </aside>
      </div>`;

/** Troca o bloco que começa em `de` e acaba antes de `ate` por `novo`. */
function trocar(h: string, de: string, ate: string, novo: string): string {
  const a = h.indexOf(de), b = h.indexOf(ate, a);
  if (a < 0 || b < 0) throw new Error('catálogo v5: não encontrei ' + de);
  return h.slice(0, a) + novo.trim() + '\n    ' + h.slice(b);
}

function construir(): string {
  let h = catalogoV4.replace(/\bcat4-/g, 'cat5-');
  h = h.replace('portal--cat4"', 'portal--cat4 portal--cat5"');
  h = h.replace('<main class="cat2 cat3 cat4"', '<main class="cat2 cat3 cat4 cat5"');
  /* o caminho e a faixa da marca ficam só nos Modelos; nos Veículos entra a barra */
  h = h.replace('<nav class="cat4__caminho" aria-label="Onde está" data-so="modelos veiculos"', '<nav class="cat4__caminho" aria-label="Onde está" data-so="modelos"');
  h = h.replace('<section class="cat4__heroi" data-so="modelos veiculos" hidden>', '<section class="cat4__heroi" data-so="modelos" hidden>');
  h = h.replace(/(<section class="cat4__heroi"[\s\S]*?<\/section>)/, `$1${barra.replace('data-so="veiculos"', 'data-so="veiculos referencias"')}`);
  h = trocar(h, '<div class="cat3__cartao" data-so="veiculos" hidden>', '</section>', filtros + refsFiltros + universalProcura);
  h = trocar(h, '<div class="cat3__vista" data-so="veiculos" hidden>', '</section>', resultados + refsVista + universal);
  return h;
}

export const catalogoV5 = construir();
