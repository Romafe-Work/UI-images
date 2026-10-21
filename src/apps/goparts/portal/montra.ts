/* =========================================================
   PEÇA A PEÇA — 10 · Início V10: a montra (21 out. 2026)
   Dos briefings «The Living Machine» e «Beyond the Dashboard» (ela: «o Início passa a ser a montra do Peça a
   Peça»). Deixa de ser um painel: é uma página para encontrar peças, com o rolamento como fio condutor.
   1. Abertura: à esquerda «A peça certa. À primeira.», «Encontrar peças», «Explorar catálogo», os três atalhos
      da pesquisa (Matrícula, Veículo, Referência) e, discreto, o que a conta tem em curso e o que é urgente;
      à direita o SKF 6206 em 3D, grande.
   2. O rolamento vivo: a mesma cena fica presa enquanto se desce; o scroll desmonta-o (anel exterior, gaiola,
      esferas, anel interior) e acaba em «Da engenharia à peça certa.» → «Explorar rolamentos».
   3. «Encontra o que procuras.»: os grupos que o catálogo tem de facto, com o número de referências.
   4. «Precisão em cada componente.»: uma referência verdadeira do catálogo (preço líquido, stock, equivalentes).
   5. «Continuar de onde ficaste»: o pedido em curso, o veículo favorito e a lista em rascunho — só o que existe.
   6. No fim, outra vez a pesquisa.
   Os desenhos das peças são ilustrativos (pecas-img.ts); não há fotografias inventadas nem especificações a mais.
   Comportamento: comportamento/montra.ts. CSS: css/montra.css.
   ========================================================= */
import { REFERENCIAS, equivalentes, saida } from './catalogo-dados';
import { LINHAS_TODAS, alertasPn, euros } from './painel-dados';
import { GARAGEM, nomeCarro, saudacao, liquido, L } from './inicio-espaco';
import { LISTAS } from './lista';
import { azulejoPeca } from './pecas-img';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';

export type EstadoMontra = '' | 'carga' | 'primeira' | 'sem-3d' | 'offline' | 'sessao' | 'parcial';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn mt__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

/* ---------- 1 + 2. A abertura e o rolamento vivo (uma só cena, presa enquanto se desce) ---------- */
function abertura(e: EstadoMontra): string {
  const agora = new Date();
  const emCurso = e === 'primeira' ? 0 : LINHAS_TODAS.filter((x) => x.etapa.k !== 'concluido').length;
  const urgentes = e === 'primeira' ? [] : alertasPn().filter((a) => a.grupo === 'urgente');
  const conta = e === 'primeira' ? '' : `<p class="mt__conta">
      <button type="button" class="mt__conta-item" data-pn-ir="pedidos">${L(packageIcon)}<span><b>${emCurso}</b> ${emCurso === 1 ? 'pedido em curso' : 'pedidos em curso'}</span>${L(arrowRight, 'mt__seta')}</button>
      ${urgentes.length ? `<button type="button" class="mt__conta-item mt__conta-item--urgente"${urgentes[0].attr}>${L(triangleAlert)}<span><b>${urgentes.length}</b> ${urgentes[0].titulo.toLowerCase()}${urgentes.length > 1 ? ' e mais' : ''}</span>${L(arrowRight, 'mt__seta')}</button>` : ''}
    </p>`;
  const passo = (i: number, titulo: string, texto: string) => `<div class="mt__passo" data-mt-passo="${i}" aria-hidden="true"><p class="mt__passo-n">0${i}</p><h2 class="mt__passo-t">${titulo}</h2><p>${texto}</p></div>`;
  return `<section class="mt__palco" data-mt-palco aria-labelledby="mt-t">
    <div class="mt__fixo">
      <div class="mt__texto">
        <div class="mt__heroi" data-mt-heroi>
          <p class="mt__ola">${saudacao(agora.getHours())}, Fernando · Conta Porto</p>
          <h1 class="mt__titulo" id="mt-t">A peça certa.<br><span>À primeira.</span></h1>
          <p class="mt__lead">Encontra componentes, confirma referências e encomenda com a confiança de quem conhece o teu negócio.</p>
          <div class="mt__accoes">${btn('Encontrar peças', search, ' data-pn-ir="pesquisa"', 'btn--acao mt__btn--grande')}${btn('Explorar catálogo', layoutGrid, ' data-pn-ir="catalogo"', 'mt__btn--grande')}</div>
          <p class="mt__atalhos"><span>Pesquisar por</span>
            <button type="button" class="mt__atalho" data-pn-modo="0">${L(carFront)}Matrícula</button>
            <button type="button" class="mt__atalho" data-pn-modo="1">${L(car)}Veículo</button>
            <button type="button" class="mt__atalho" data-pn-modo="2">${L(hash)}Referência</button></p>
          ${conta}
        </div>
        ${passo(1, 'O anel exterior sai.', 'Fica à vista a pista onde as esferas rolam, cavada na face de dentro do anel.')}
        ${passo(2, 'A gaiola e as esferas.', 'Nove esferas de 9,525 mm, guardadas pela gaiola à mesma distância umas das outras.')}
        ${passo(3, 'Cada peça no seu eixo.', 'A vista explodida do SKF 6206, pela ordem em que se monta. d 30 · D 62 · B 16 mm.')}
        <div class="mt__fim" data-mt-fim aria-hidden="true">
          <h2 class="mt__fim-t">Da engenharia à peça certa.</h2>
          <p>Os rolamentos de roda do catálogo, com o preço da tua conta e o stock de agora.</p>
          ${btn('Explorar rolamentos', arrowRight, ' data-mt-grupo="Rolamento de roda" tabindex="-1"', 'btn--acao mt__btn--grande')}
        </div>
      </div>
      <div class="mt__cena">
        <canvas class="mt__tela" aria-hidden="true"></canvas>
        <div class="mt__etiquetas" aria-hidden="true"><span data-etq="ext">Anel exterior</span><span data-etq="gaiola">Gaiola</span><span data-etq="esferas">9 esferas</span><span data-etq="int">Anel interior</span></div>
        <div class="mt__reserva"${e === 'sem-3d' ? '' : ' hidden'}>${rolamentoSvg('mt', 'carregar', 'mt__reserva-svg', 1)}<p>O modelo 3D não abriu neste navegador; a página funciona igual.</p></div>
        <p class="mt__nota-3d">SKF 6206 · ilustrativo</p>
      </div>
      <div class="mt__progresso" aria-hidden="true"><i data-mt-barra></i></div>
    </div>
  </section>`;
}

/* ---------- 3. As categorias que o catálogo tem ---------- */
function categorias(e: EstadoMontra): string {
  const grupos = [...new Set(REFERENCIAS.map((r) => r[0]))].map((g) => ({ g, refs: REFERENCIAS.filter((r) => r[0] === g) })).sort((a, b) => b.refs.length - a.refs.length);
  if (e === 'carga') return `<section class="mt__sec" aria-busy="true"><h2 class="mt__sec-t">Encontra o que procuras.</h2><ul class="mt__cats">${grupos.map((_, i) => `<li class="mt__cat mt__cat--esq" style="--i:${i}" aria-hidden="true"></li>`).join('')}</ul></section>`;
  return `<section class="mt__sec" aria-labelledby="mt-cats-t">
    <header class="mt__sec-cabeca"><h2 class="mt__sec-t" id="mt-cats-t">Encontra o que procuras.</h2><button type="button" class="mt__mais" data-pn-ir="catalogo">Todo o catálogo${L(arrowRight)}</button></header>
    <ul class="mt__cats" role="list">${grupos.map(({ g, refs }, i) => `<li style="--i:${i}"><button type="button" class="mt__cat" data-mt-grupo="${esc(g)}">
      <span class="mt__cat-img">${azulejoPeca(refs[0][3], 'mt__cat-azulejo', refs[0][2])}</span>
      <span class="mt__cat-texto"><b>${esc(g)}</b><small>${refs.length} ${refs.length === 1 ? 'referência' : 'referências'} · ${[...new Set(refs.map((r) => r[1]))].join(', ')}</small></span>
      ${L(arrowRight, 'mt__cat-seta')}
    </button></li>`).join('')}</ul>
  </section>`;
}

/* ---------- 4. Uma peça em destaque (dados do catálogo) ---------- */
function destaque(): string {
  const r = REFERENCIAS.find((x) => x[2] === 'VKBA 6556') ?? REFERENCIAS[0];
  const [grupo, fab, ref, desc, pvp, d, porto, sacavem] = r, eq = equivalentes(r);
  return `<section class="mt__sec mt__destaque" aria-labelledby="mt-dest-t">
    <div class="mt__dest-img">${azulejoPeca(desc, 'mt__dest-azulejo', ref)}<p class="mt__nota-3d">Imagem ilustrativa do tipo de peça</p></div>
    <div class="mt__dest-texto">
      <h2 class="mt__sec-t" id="mt-dest-t">Precisão em cada componente.</h2>
      <p class="mt__dest-marca">${esc(fab)} · ${esc(grupo)}</p>
      <p class="mt__dest-ref">${esc(ref)}</p>
      <p class="mt__dest-desc">${esc(desc)}</p>
      <dl class="mt__dest-dados">
        <div><dt>Preço da tua conta</dt><dd><b>${euros(liquido(r))}</b><small>PVP ${euros(pvp)} · −${d} % · sem IVA</small></dd></div>
        <div><dt>Disponibilidade</dt><dd><b>${saida(porto, sacavem)}</b><small>${L(warehouse)}Porto ${porto} · Sacavém ${sacavem}</small></dd></div>
        <div><dt>Equivalentes no catálogo</dt><dd><b>${eq.length}</b><small>${eq.map((q) => `${q[1]} ${q[2]}`).join(', ') || '—'}</small></dd></div>
      </dl>
      <div class="mt__accoes">${btn('Adicionar ao carrinho', cart, ` data-mt-pedir="${esc(ref)}"`, 'btn--acao')}${btn('Ver ficha', fileText, ` data-mt-ficha="${esc(ref)}" data-mt-fab="${esc(fab)}"`)}</div>
    </div>
  </section>`;
}

/* ---------- 5. Continuar de onde ficaste (só o que existe; sem nada, a secção não aparece) ---------- */
function continuar(e: EstadoMontra): string {
  if (e === 'primeira') return '';
  if (e === 'parcial') return `<section class="mt__sec mt__cont" aria-labelledby="mt-cont-t"><h2 class="mt__sec-t mt__sec-t--pequeno" id="mt-cont-t">Continuar de onde ficaste</h2>
    <p class="mt__falha" role="alert">${L(triangleAlert)}<span>A tua atividade não carregou agora. A pesquisa e o catálogo funcionam.</span>${btn('Tentar de novo', rotateCcw, ' data-mt-tentar', 'mt__btn--leve')}</p></section>`;
  const pedido = LINHAS_TODAS.find((x) => x.etapa.k !== 'concluido');
  const carro = GARAGEM.find((c) => c.favorito) ?? GARAGEM[0];
  const lista = LISTAS.find((l) => l.estado === 'rascunho');
  const itens = [
    pedido ? `<li><button type="button" class="mt__cont-item" data-abrir-pedido="${pedido.l.num}">${L(packageIcon)}<span><small>Pedido em curso</small><b>${pedido.l.num}</b><em>${esc(pedido.etapa.nome)}</em></span>${L(arrowRight, 'mt__seta')}</button></li>` : '',
    carro ? `<li><button type="button" class="mt__cont-item" data-pecas-matricula="${carro.matricula}">${L(carFront)}<span><small>Veículo favorito</small><b>${esc(nomeCarro(carro))}</b><em>${carro.matricula} · peças compatíveis</em></span>${L(arrowRight, 'mt__seta')}</button></li>` : '',
    lista ? `<li><button type="button" class="mt__cont-item" data-pn-atalho="lista">${L(listChecks)}<span><small>Lista em rascunho</small><b>${esc(lista.nome)}</b><em>${lista.pecas.length} peças · ${esc(lista.atualizada)}</em></span>${L(arrowRight, 'mt__seta')}</button></li>` : '',
  ].filter(Boolean);
  if (!itens.length) return '';
  return `<section class="mt__sec mt__cont" aria-labelledby="mt-cont-t"><h2 class="mt__sec-t mt__sec-t--pequeno" id="mt-cont-t">Continuar de onde ficaste</h2><ul class="mt__cont-lista" role="list">${itens.join('')}</ul></section>`;
}

/* ---------- 6. No fim, a pesquisa ---------- */
const final = () => `<section class="mt__sec mt__final" aria-labelledby="mt-fim-t">
    <h2 class="mt__sec-t" id="mt-fim-t">Pronto para a próxima peça?</h2>
    <div class="mt__accoes">
      <button type="button" class="mt__atalho mt__atalho--grande" data-pn-modo="0">${L(carFront)}Pela matrícula</button>
      <button type="button" class="mt__atalho mt__atalho--grande" data-pn-modo="1">${L(car)}Pelo veículo</button>
      <button type="button" class="mt__atalho mt__atalho--grande" data-pn-modo="2">${L(hash)}Pela referência</button>
    </div>
  </section>`;

export function montraHtml(e: EstadoMontra = ''): string {
  const aviso = e === 'offline' ? `<p class="mt__aviso" role="status">${L(wifiOff)}<span><b>Sem ligação.</b> Os preços e o stock são os da última vez que a página carregou.</span></p>` : '';
  const sessao = e === 'sessao' ? `<div class="mt__sessao" data-por-cima role="alertdialog" aria-modal="true" aria-labelledby="mt-s-t"><div class="mt__veu"></div><div class="mt__dialogo"><span class="mt__dialogo-icone">${L(lock)}</span><h2 id="mt-s-t">A tua sessão expirou.</h2><p>Por segurança, entra outra vez. Voltas a esta página.</p><button type="button" class="btn btn--acao mt__btn" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Iniciar sessão</span></button></div></div>` : '';
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--mt">
  <main class="mt${e === 'sem-3d' ? ' is-sem-3d' : ''}"${e ? ` data-estado="${e}"` : ''}${e === 'sessao' ? ' inert aria-hidden="true"' : ''}>
    ${aviso}${abertura(e)}${categorias(e)}${destaque()}${continuar(e)}${final()}
  </main>${sessao}
  <p class="sr-only" role="status" aria-live="polite" data-mt-aviso></p>
</div>`;
}
