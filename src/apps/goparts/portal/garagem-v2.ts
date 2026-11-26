/* =========================================================
   PEÇA A PEÇA — 09 · A minha garagem v2 (26 nov. 2026)
   Do briefing «Premium B2B Automotive Portal — Complete UI/UX Redesign»: a garagem como lista de trabalho.
   - Um veículo está sempre EM USO (o escolhido; por omissão o favorito). Vê-se pelo traço azul, pela etiqueta
     «Em uso» e pelo botão principal a laranja — só nesse; nos outros, o mesmo botão é neutro (uma ação forte
     por ecrã, não uma por cartão).
   - A identidade do veículo primeiro (matrícula, nome, marca/modelo/versão), depois a ficha técnica do catálogo
     (ano, combustível, potência, cilindrada, código do motor) e só depois o contexto (última pesquisa).
   - Adicionar é uma barra compacta em cima, pela matrícula; sem matrícula, «Escolher marca e modelo» abre o
     Catálogo (a identificação manual que já existe).
   - A imagem é a silhueta da carroçaria em traço, parada e pequena: não há fotografias licenciadas.
   Os dados e o comportamento são os da v1 (garagem no navegador, comportamento/inicio-espaco.ts): as mesmas
   marcas data-* e as classes ini4__carro/ini4__menu que o comportamento procura.
   ========================================================= */
import { L, IC, type Carro, type Dados, versaoDe, marcaNome, modeloCurto, carrocariaDe } from './inicio-espaco';
import { silhueta } from './carros';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn ini4__btn gar2__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

/** O veículo em uso fica guardado no navegador (num servidor, no perfil da conta). */
export const CHAVE_EM_USO = 'goparts:garagem-em-uso:v1';
export function emUsoDe(g: Carro[]): string {
  let m = '';
  try { m = localStorage.getItem(CHAVE_EM_USO) || ''; } catch { /* sem armazenamento */ }
  if (m && g.some((c) => c.matricula === m)) return m;
  return (g.find((c) => c.favorito) ?? g[0])?.matricula ?? '';
}

/** A silhueta da carroçaria em traço, sem as classes que o 3D procura (comportamento/carros-3d.ts). */
const desenho = (c: Carro) => silhueta(carrocariaDe(c)).replace('class="cat6__silhueta"', 'class="gar2__silhueta"').replace(/ data-carro="[^"]*"/, '');

function carroV2(c: Carro, emUso: boolean): string {
  const v = versaoDe(c), base = `${marcaNome(c.marca)} ${modeloCurto(c.marca, c.modelo)}`;
  const nome = c.nome || base;
  const ficha: [string, string][] = [['Ano', String(c.ano)]];
  if (v) ficha.push(['Combustível', v.combustivel], ['Potência', `${v.kw} kW · ${v.cv} cv`], ['Cilindrada', `${v.cc.toLocaleString('pt-PT')} cm³`], ['Motor', v.motor.split(',')[0]]);
  const idNome = `gar2-n-${c.id}`;
  return `<li class="ini4__carro gar2__carro${emUso ? ' is-em-uso' : ''}" data-carro="${c.id}" data-matricula="${c.matricula}" aria-labelledby="${idNome}"${emUso ? ' aria-current="true"' : ''}>
    <label class="gar2__escolha" title="${emUso ? 'Veículo em uso' : 'Usar este veículo'}">
      <input type="radio" name="gar2-em-uso" value="${c.matricula}"${emUso ? ' checked' : ''} data-gar2-usar aria-label="Usar ${esc(nome)} (${c.matricula})">
      <span class="gar2__radio" aria-hidden="true"></span>
    </label>
    <div class="gar2__figura" aria-hidden="true">${desenho(c)}</div>
    <div class="gar2__id">
      <div class="gar2__linha1">
        <span class="gar2__matricula"><i aria-hidden="true">P</i>${c.matricula}</span>
        ${c.favorito ? `<span class="gar2__selo gar2__selo--fav">${L(IC.star)}Favorito</span>` : ''}
        <span class="gar2__selo gar2__selo--uso"${emUso ? '' : ' hidden'}>${L(circleCheck)}Em uso</span>
      </div>
      <b class="ini4__carro-nome gar2__nome" id="${idNome}" data-nome>${esc(nome)}</b>
      <span class="gar2__versao">${esc(c.nome ? `${base} ` : '')}${esc(v?.versao ?? '')}${v ? ` · ${esc(v.carrocaria)}` : ''}</span>
    </div>
    <dl class="gar2__ficha">${ficha.map(([k, val]) => `<div><dt>${k}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>
    <p class="gar2__ultima">${L(IC.history)}${c.ultima ? `<span><span class="gar2__rotulo">Última pesquisa</span>${esc(c.ultima)}${c.quando ? ` · ${esc(c.quando)}` : ''}</span>` : '<span>Ainda sem pesquisas</span>'}</p>
    <div class="gar2__acoes">
      ${btn('Ver peças compatíveis', IC.arrowRight, ` data-pecas-matricula="${c.matricula}"`, `gar2__principal${emUso ? ' btn--acao' : ''}`)}
      ${btn('Usar na pesquisa', IC.search, ` data-usar-matricula="${c.matricula}"`, 'gar2__secundario')}
      <button type="button" class="gar2__icone ini4__estrela" data-favorito aria-pressed="${!!c.favorito}" aria-label="${c.favorito ? 'Tirar dos favoritos' : 'Marcar como favorito'}" title="${c.favorito ? 'Tirar dos favoritos' : 'Marcar como favorito'}">${L(IC.star)}</button>
      <div class="ini4__menu-sitio gar2__menu-sitio"><button type="button" class="gar2__icone ini4__carro-mais" data-menu-carro aria-haspopup="menu" aria-expanded="false" aria-label="Mais ações para ${c.matricula}" title="Mais ações">${L(IC.ellipsis)}</button>
        <ul class="ini4__menu" role="menu" hidden><li role="none"><button type="button" role="menuitem" data-renomear>${L(IC.pencil)}Mudar o nome</button></li><li role="none"><button type="button" role="menuitem" data-remover-carro>${L(IC.trash)}Tirar da garagem</button></li></ul></div>
    </div>
  </li>`;
}

/** O bloco da garagem (o comportamento troca-o inteiro por [data-bloco="garagem"]). */
export function garagemV2Html(d: Dados, emUso = emUsoDe(d.garagem)): string {
  const carros = d.garagem.slice().sort((a, b) => Number(!!b.favorito) - Number(!!a.favorito));
  const n = carros.length;
  const corpo = n
    ? `<ul class="ini4__garagem gar2__lista" aria-label="Veículos guardados">${carros.map((c) => carroV2(c, c.matricula === emUso)).join('')}</ul>`
    : `<div class="gar2__vazio">${L(IC.carFront)}<div><b>Ainda não há veículos na garagem</b><p>Escreva a matrícula em «Adicionar veículo»: o veículo fica guardado e pode abrir as peças compatíveis com um clique.</p></div></div>`;
  return `<section class="ini4__bloco gar2__bloco" data-bloco="garagem" aria-labelledby="gar2-lista-t">
    <header class="gar2__bloco-cabeca"><h2 id="gar2-lista-t">Veículos guardados</h2><span class="gar2__contagem">${n} ${n === 1 ? 'veículo' : 'veículos'}</span>
</header>
    ${corpo}
  </section>`;
}

/** A barra de adicionar: matrícula portuguesa, identificar, e a alternativa sem matrícula. */
export function novoV2Html(): string {
  return `<form class="gar2__novo" data-garagem-nova novalidate aria-labelledby="gar2-novo-t">
    <div class="gar2__novo-texto"><b id="gar2-novo-t">Adicionar veículo</b><span id="gar2-novo-ajuda">A matrícula chega para identificarmos a versão exata.</span></div>
    <div class="gar2__novo-campo">
      <label class="gar2__placa" for="i4-nova-mat"><i aria-hidden="true">P</i><span class="sr-only">Matrícula</span>
        <input id="i4-nova-mat" placeholder="AA-00-AA" autocomplete="off" spellcheck="false" maxlength="10" aria-describedby="gar2-novo-ajuda i4-nova-erro"></label>
      <button type="submit" class="btn ini4__btn gar2__identificar">${L(IC.plus, 'btn__icone')}<span class="btn__rotulo">Identificar e adicionar</span></button>
    </div>
    <button type="button" class="gar2__manual" data-gar2-manual>${L(IC.layoutGrid)}Sem matrícula? Escolher marca e modelo</button>
    <p class="ini4__novo-erro gar2__erro" id="i4-nova-erro" role="alert"></p>
  </form>`;
}

/* =========================================================
   v3 (26 nov. 2026) — ela: «aqui quero ter mesmo o efeito como se fosse mesmo uma garagem».
   Cada veículo num LUGAR de estacionamento visto de cima: o chão, as riscas pintadas em U (aberto para o corredor),
   o número do lugar pintado no chão, o carro em traço visto de cima e a matrícula à frente. A luz do teto acende-se
   no lugar que se aponta (rato ou teclado). O último lugar está LIVRE: é aí que se adiciona, pela matrícula.
   Ela: «todas as ações devem fazer sentido» — por isso só ficam as que fazem alguma coisa: o lugar (ou «Ver peças
   compatíveis») abre o Grupo montagem da versão exata; a estrela põe o veículo no lugar 01; «…» muda o nome ou
   tira-o da garagem (com confirmação). Saíram o «em uso» (não mudava nada noutro ecrã), o «Usar na pesquisa»
   (repetia «Ver peças») e o «Sem matrícula?» (não adicionava nada).
   ========================================================= */
/** O carro visto de cima, de frente para o corredor (em baixo). Comprimento pela carroçaria. */
function deCima(c: Carro): string {
  const cat = carrocariaDe(c), L0 = cat === 'Carrinha' || cat === 'Monovolume' || cat === 'Furgão' ? 214 : cat === 'SUV' ? 206 : 196;
  const y0 = (230 - L0) / 2, y1 = y0 + L0, w = cat === 'SUV' ? 86 : 80, x0 = (120 - w) / 2, x1 = x0 + w;
  const vf = y1 - L0 * .30, vt = y0 + L0 * .2; /* vidro da frente / de trás */
  const roda = (x: number, y: number) => `<rect class="gar3__roda" x="${x}" y="${y}" width="7" height="26" rx="2.5"/>`;
  return `<svg class="gar3__carro-svg" viewBox="0 0 120 230" aria-hidden="true">
    ${roda(x0 - 4, y0 + 26)}${roda(x1 - 3, y0 + 26)}${roda(x0 - 4, y1 - 52)}${roda(x1 - 3, y1 - 52)}
    <rect class="gar3__corpo" x="${x0}" y="${y0}" width="${w}" height="${L0}" rx="26"/>
    <path class="gar3__vidro" d="M${x0 + 8} ${vf} Q60 ${vf - 12} ${x1 - 8} ${vf} L${x1 - 13} ${vf - 30} Q60 ${vf - 38} ${x0 + 13} ${vf - 30}Z"/>
    <path class="gar3__vidro" d="M${x0 + 10} ${vt} Q60 ${vt + 8} ${x1 - 10} ${vt} L${x1 - 14} ${vt + 20} Q60 ${vt + 26} ${x0 + 14} ${vt + 20}Z"/>
    <path class="gar3__linha" d="M${x0 + 13} ${vt + 22}V${vf - 32}M${x1 - 13} ${vt + 22}V${vf - 32}M${x0 + 18} ${y1 - 14}Q60 ${y1 - 4} ${x1 - 18} ${y1 - 14}"/>
    <path class="gar3__espelho" d="M${x0} ${vf - 22}l-9 4v5l9-1M${x1} ${vf - 22}l9 4v5l-9-1"/>
    <path class="gar3__farol" d="M${x0 + 8} ${y1 - 9}h12M${x1 - 20} ${y1 - 9}h12"/>
  </svg>`;
}
const lugarN = (i: number) => String(i + 1).padStart(2, '0');

function lugarV3(c: Carro, i: number): string {
  const v = versaoDe(c), base = `${marcaNome(c.marca)} ${modeloCurto(c.marca, c.modelo)}`, nome = c.nome || base, idNome = `gar3-n-${c.id}`;
  const ficha: [string, string][] = [['Ano', String(c.ano)]];
  if (v) ficha.push(['Combustível', v.combustivel], ['Potência', `${v.kw} kW · ${v.cv} cv`], ['Cilindrada', `${v.cc.toLocaleString('pt-PT')} cm³`], ['Motor', v.motor.split(',')[0]]);
  const fav = c.favorito ? 'Favorito: fica no lugar 01 (tirar)' : 'Marcar como favorito: passa para o lugar 01';
  return `<li class="ini4__carro gar2__carro gar3__lugar" data-carro="${c.id}" data-matricula="${c.matricula}" aria-labelledby="${idNome}">
    <div class="gar3__chao" data-gar3-abrir title="Ver as peças compatíveis com ${esc(nome)}">
      <span class="gar3__luz" aria-hidden="true"></span>
      <span class="gar3__n" aria-hidden="true">${lugarN(i)}</span>
      <span class="gar3__carro">${deCima(c)}</span>
      <span class="gar2__matricula gar3__matricula"><i aria-hidden="true">P</i>${c.matricula}</span>
    </div>
    <div class="gar3__info">
      <div class="gar2__linha1">
        <b class="ini4__carro-nome gar2__nome" id="${idNome}" data-nome>${esc(nome)}</b>
        ${c.favorito ? `<span class="gar2__selo gar2__selo--fav">${L(IC.star)}Favorito</span>` : ''}
      </div>
      <span class="gar2__versao">${esc(c.nome ? `${base} ` : '')}${esc(v?.versao ?? '')}${v ? ` · ${esc(v.carrocaria)}` : ''}</span>
      <dl class="gar3__ficha">${ficha.map(([k, val]) => `<div><dt>${k}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>
      <p class="gar2__ultima">${L(IC.history)}${c.ultima ? `<span><span class="gar2__rotulo">Última pesquisa</span>${esc(c.ultima)}${c.quando ? ` · ${esc(c.quando)}` : ''}</span>` : '<span>Ainda sem pesquisas</span>'}</p>
      <div class="gar3__acoes">
        ${btn('Ver peças compatíveis', IC.arrowRight, ` data-pecas-matricula="${c.matricula}"`, 'gar2__principal btn--acao')}
        <button type="button" class="gar2__icone ini4__estrela" data-favorito aria-pressed="${!!c.favorito}" aria-label="${fav}" title="${fav}">${L(IC.star)}</button>
        <div class="ini4__menu-sitio gar2__menu-sitio"><button type="button" class="gar2__icone ini4__carro-mais" data-menu-carro aria-haspopup="menu" aria-expanded="false" aria-label="Mais ações para ${c.matricula}" title="Mudar o nome ou tirar da garagem">${L(IC.ellipsis)}</button>
          <ul class="ini4__menu" role="menu" hidden><li role="none"><button type="button" role="menuitem" data-renomear>${L(IC.pencil)}Mudar o nome</button></li><li role="none"><button type="button" role="menuitem" data-remover-carro>${L(IC.trash)}Tirar da garagem</button></li></ul></div>
      </div>
    </div>
  </li>`;
}
/** O lugar livre: adicionar um veículo pela matrícula (a garagem guarda-se pela matrícula). */
function livreV3(i: number): string {
  return `<li class="gar3__lugar gar3__lugar--livre">
    <div class="gar3__chao"><span class="gar3__n" aria-hidden="true">${lugarN(i)}</span><span class="gar3__livre-t" aria-hidden="true">Livre</span></div>
    <form class="gar3__info gar3__novo" data-garagem-nova novalidate aria-labelledby="gar3-novo-t">
      <div class="gar3__novo-t">${L(IC.plus)}<b id="gar3-novo-t">Adicionar veículo</b></div>
      <span class="gar2__versao" id="gar3-novo-ajuda">Escreva a matrícula: identificamos a marca, o modelo e a versão.</span>
      <label class="gar2__placa gar3__placa" for="i4-nova-mat"><i aria-hidden="true">P</i><span class="sr-only">Matrícula</span>
        <input id="i4-nova-mat" placeholder="AA-00-AA" autocomplete="off" spellcheck="false" maxlength="10" aria-describedby="gar3-novo-ajuda i4-nova-erro"></label>
      <p class="ini4__novo-erro gar2__erro gar3__erro" id="i4-nova-erro" role="alert"></p>
      <button type="submit" class="btn ini4__btn gar2__identificar gar3__identificar">${L(IC.plus, 'btn__icone')}<span class="btn__rotulo">Adicionar à garagem</span></button>
    </form>
  </li>`;
}
export function garagemV3Html(d: Dados): string {
  const carros = d.garagem.slice().sort((a, b) => Number(!!b.favorito) - Number(!!a.favorito)), n = carros.length;
  return `<section class="ini4__bloco gar2__bloco gar3__bloco" data-bloco="garagem" aria-labelledby="gar3-lista-t">
    <h2 id="gar3-lista-t" class="sr-only">Veículos na garagem</h2>
    <ul class="ini4__garagem gar2__lista gar3__lugares" aria-label="${n} ${n === 1 ? 'veículo' : 'veículos'} na garagem">${carros.map((c, i) => lugarV3(c, i)).join('')}${livreV3(n)}</ul>
  </section>`;
}
