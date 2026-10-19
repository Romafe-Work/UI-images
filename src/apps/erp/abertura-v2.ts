/* =========================================================
   ERP — 00 · Abertura v2 (19 out. 2026), do briefing dela «ERP — V2 Cinematic Opening Experience»
   «Um sistema. Todas as operações.» A história, em quatro tempos (cerca de 3 s, interrompível a qualquer
   momento, uma vez por sessão):
     1. Arranque   — alguns traços curtos, tortos, alinham-se com a grelha;
     2. Estrutura  — a grelha técnica desenha-se num plano inclinado; aparecem as molduras dos domínios
                     (Compras, Vendas, Armazém, Stocks, Logística, Financeiro, Administração), cada uma à
                     sua altura, soltas, ligadas por traços ortogonais;
     3. Convergência — as molduras descem ao plano e alinham-se à volta de uma moldura central; as ligações
                     reorganizam-se até ela; o plano roda para a frente (a câmara aproxima-se);
     4. Marca      — o ROMAFE (a marca, em Motor, azul) aparece dentro da moldura central, com «ROMAFE ERP» e
                     «Gestão integrada. Operações simplificadas.»; a estrutura recua e fica o lançador.
   Depois: a ação certa para o estado da sessão (sessao.ts) — «Entrar no ERP» sem sessão (vai ao 01 · Entrar
   v10) ou «Abrir espaço de trabalho» com sessão (vai ao 05 · Início) — e o lançador de módulos: só Compras
   está disponível («Abrir Compras», que abre as Encomendas a fornecedor e passa a moldura do cartão para o
   contentor do ERP); os outros dizem «Em desenvolvimento» e não se clicam.
   Diferente do GoParts e da v1: sem rolamento, sem fotografias, sem partículas nem brilhos. SVG e CSS
   (sem Three.js); o palco é decorativo (aria-hidden) e tudo o que conta está em HTML normal.
   A v1 fica como estava.
   ========================================================= */
import type { EcraErp } from './ids';
import { ic } from './inicio-icones';
import shoppingBag from 'lucide-static/icons/shopping-bag.svg?raw';
import trendingUp from 'lucide-static/icons/trending-up.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import landmark from 'lucide-static/icons/landmark.svg?raw';
import shield from 'lucide-static/icons/shield.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import layoutDashboard from 'lucide-static/icons/layout-dashboard.svg?raw';
import skipForward from 'lucide-static/icons/skip-forward.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

export const VERSAO_ABERTURA_V2 = 'v2';

/* ---------- os domínios: só Compras existe ---------- */
interface Dominio { id: string; nome: string; icone: string; desc: string; disponivel: boolean; p1: [number, number, number]; p2: [number, number] }
/* p1: onde está solto (x, y no plano de 1000 × 600, e a altura z); p2: onde fica alinhado */
export const DOMINIOS: Dominio[] = [
  { id: 'compras', nome: 'Compras', icone: shoppingBag, desc: 'Gestão de encomendas, fornecedores e processos de compra.', disponivel: true, p1: [90, 70, 90], p2: [155, 110] },
  { id: 'vendas', nome: 'Vendas', icone: trendingUp, desc: '', disponivel: false, p1: [760, 40, 40], p2: [335, 110] },
  { id: 'armazem', nome: 'Armazém', icone: warehouse, desc: '', disponivel: false, p1: [110, 420, 60], p2: [515, 110] },
  { id: 'stocks', nome: 'Stocks', icone: boxes, desc: '', disponivel: false, p1: [430, 480, 120], p2: [695, 110] },
  { id: 'logistica', nome: 'Logística', icone: truck, desc: '', disponivel: false, p1: [800, 380, 70], p2: [245, 440] },
  { id: 'financeiro', nome: 'Financeiro', icone: landmark, desc: '', disponivel: false, p1: [560, 150, 140], p2: [425, 440] },
  { id: 'admin', nome: 'Administração', icone: shield, desc: '', disponivel: false, p1: [300, 240, 30], p2: [605, 440] },
];
const W = 150, H = 64, C = { x: 320, y: 214, w: 360, h: 192 }; // a moldura central

/* ligações soltas (entre domínios, em L) e alinhadas (de cada domínio à moldura central) */
const PARES: [number, number][] = [[0, 6], [6, 5], [5, 1], [6, 2], [2, 3], [3, 4], [5, 4]];
const cx = (p: [number, number] | [number, number, number]) => p[0] + W / 2, cy = (p: [number, number] | [number, number, number]) => p[1] + H / 2;
const emL = (a: Dominio, b: Dominio) => `M${cx(a.p1)} ${cy(a.p1)} H${cx(b.p1)} V${cy(b.p1)}`;
function aoCentro(d: Dominio): string {
  const x = cx(d.p2), cima = d.p2[1] < C.y;
  const y0 = cima ? d.p2[1] + H : d.p2[1], yMeio = cima ? C.y - 16 : C.y + C.h + 16, yC = cima ? C.y : C.y + C.h;
  const xc = Math.max(C.x + 24, Math.min(C.x + C.w - 24, x));
  return `M${x} ${y0} V${yMeio} H${xc} V${yC}`;
}

function palco(): string {
  const grelha: string[] = [];
  for (let x = 0; x <= 1000; x += 50) grelha.push(`<line x1="${x}" y1="0" x2="${x}" y2="600" class="${x % 250 ? '' : 'is-forte'}" style="--i:${x / 50}"/>`);
  for (let y = 0; y <= 600; y += 50) grelha.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}" class="${y % 200 ? '' : 'is-forte'}" style="--i:${y / 50}"/>`);
  /* os traços do arranque: começam tortos e deslocados, e alinham-se com a grelha */
  const tracos = [[250, 150, 400, 150, -14, 30, -20], [600, 100, 600, 250, 18, -40, 10], [150, 350, 350, 350, 9, 20, 30], [700, 300, 900, 300, -11, -30, -25], [450, 400, 450, 550, -16, 25, -10], [500, 200, 650, 200, 12, -15, 35]];
  return `<div class="ab2__palco" aria-hidden="true"><div class="ab2__camara"><div class="ab2__plano">
    <svg class="ab2__grelha" viewBox="0 0 1000 600">${grelha.join('')}</svg>
    <svg class="ab2__tracos" viewBox="0 0 1000 600">${tracos.map(([x1, y1, x2, y2, r, dx, dy], i) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="--r:${r}deg;--dx:${dx}px;--dy:${dy}px;--i:${i}"/>`).join('')}</svg>
    <svg class="ab2__ligacoes ab2__ligacoes--soltas" viewBox="0 0 1000 600">${PARES.map(([a, b], i) => `<path d="${emL(DOMINIOS[a], DOMINIOS[b])}" pathLength="1" style="--i:${i}"/>`).join('')}</svg>
    <svg class="ab2__ligacoes ab2__ligacoes--centro" viewBox="0 0 1000 600">${DOMINIOS.map((d, i) => `<path d="${aoCentro(d)}" pathLength="1" style="--i:${i}"${d.disponivel ? ' class="is-disponivel"' : ''}/>`).join('')}</svg>
    <div class="ab2__central" style="--x:${C.x}px;--y:${C.y}px;--w:${C.w}px;--h:${C.h}px"><i></i></div>
    ${DOMINIOS.map((d, i) => `<div class="ab2__moldura${d.disponivel ? ' is-disponivel' : ''}" data-dominio="${d.id}" style="--x1:${d.p1[0]}px;--y1:${d.p1[1]}px;--z1:${d.p1[2]}px;--x2:${d.p2[0]}px;--y2:${d.p2[1]}px;--i:${i}">
      <span class="ab2__moldura-sombra"></span>
      <span class="ab2__moldura-nome">${L(d.icone)}${d.nome}</span><span class="ab2__moldura-estado">${d.disponivel ? 'disponível' : 'em desenvolvimento'}</span>
    </div>`).join('')}
  </div></div></div>`;
}

/* ---------- o que é HTML: a marca, a ação, o lançador, e as faixas de estado ---------- */
export type IdAberturaV2 = 'ab2-regresso' | 'ab2-sessao' | 'ab2-verificar' | 'ab2-sem-acesso' | 'ab2-erro' | 'ab2-offline' | 'ab2-quieto';
export type Cenario = 'normal' | 'regresso' | 'sessao' | 'verificar' | 'sem-acesso' | 'erro' | 'offline' | 'quieto';

function html(cen: Cenario): string {
  const sessao = cen === 'sessao' || cen === 'sem-acesso';
  return `<main class="ab2${cen === 'regresso' || cen === 'quieto' || sessao || cen === 'verificar' || cen === 'erro' || cen === 'offline' ? ' is-final is-ja' : ''}" data-ab2 data-ab2-cenario="${cen}" aria-label="ROMAFE ERP">
  ${palco()}
  <div class="ab2__topo">
    <div class="ab2__tema segmented" role="group" aria-label="Tema">
      <button type="button" class="segmented__btn ab2__tema-btn" data-tema="light" aria-label="Tema claro">${ic('sun')}</button>
      <button type="button" class="segmented__btn ab2__tema-btn" data-tema="dark" aria-label="Tema escuro">${ic('moon')}</button>
      <button type="button" class="segmented__btn ab2__tema-btn" data-tema="auto" aria-label="Tema do sistema">${ic('monitor')}</button>
    </div>
    <button type="button" class="btn btn--ghost btn--sm ab2__saltar" data-ab2-saltar>${L(skipForward, 'btn__icone')}<span class="btn__rotulo">Saltar introdução</span></button>
  </div>
  <div class="ab2__centro">
    <div class="ab2__marca"><span class="romafe ab2__romafe">ROMAFE</span></div>
    <h1 class="ab2__titulo">ROMAFE ERP</h1>
    <p class="ab2__sub">Gestão integrada. Operações simplificadas.</p>
    <p class="ab2__lema">Um sistema. Todas as operações.</p>
    <div class="ab2__faixa" data-ab2-faixa role="status" aria-live="polite">${cen === 'verificar' ? `<span class="ab2__girador" aria-hidden="true"></span>A verificar a sessão…` : cen === 'erro' ? `${ic('circle-alert')}<span>Não foi possível carregar o ERP.</span><button type="button" class="ab2__ligacao" data-ab2-repetir>Tentar outra vez</button>` : cen === 'offline' ? `${ic('wifi-off')}<span>Sem ligação à rede. Para entrar é preciso falar com o servidor.</span>` : ''}</div>
    <div class="ab2__accao" data-ab2-accao>${acao(cen)}</div>
    <section class="ab2__modulos" aria-labelledby="ab2-mod-t">
      <h2 class="ab2__modulos-titulo" id="ab2-mod-t">Módulos</h2>
      <ul class="ab2__lista" data-ab2-lista>${modulos(cen)}</ul>
    </section>
  </div>
  <p class="ab2__pe">Romafe, SA · desde 1945 · o ERP faz-se por módulos; o primeiro é Compras.</p>
</main>`;
}
/** A única ação principal, conforme a sessão. */
export function acao(cen: Cenario): string {
  if (cen === 'verificar' || cen === 'erro') return '';
  const sessao = cen === 'sessao' || cen === 'sem-acesso';
  const desligado = cen === 'offline' ? ' disabled aria-describedby="ab2-off"' : '';
  return sessao
    ? `<button type="button" class="btn btn--acao ab2__cta" data-ab2-ir="inicio">${L(layoutDashboard, 'btn__icone')}<span class="btn__rotulo">Abrir espaço de trabalho</span></button><p class="ab2__quem" data-ab2-quem></p>`
    : `<button type="button" class="btn btn--acao ab2__cta" data-ab2-ir="entrada"${desligado}>${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar no ERP</span></button>${cen === 'offline' ? '<p class="ab2__quem" id="ab2-off">Volta a ficar disponível quando a ligação voltar.</p>' : ''}`;
}
/** O lançador: Compras com a ação (só com sessão e acesso); os outros, em desenvolvimento, não se clicam. */
export function modulos(cen: Cenario): string {
  const sessao = cen === 'sessao' || cen === 'sem-acesso';
  return DOMINIOS.map((d) => {
    if (!d.disponivel) return `<li class="ab2__mod is-futuro" data-modulo="${d.id}"><span class="ab2__mod-icone">${L(d.icone)}</span><span class="ab2__mod-nome">${d.nome}</span><span class="ab2__mod-estado">Em desenvolvimento</span></li>`;
    const corpo = `<span class="ab2__mod-icone">${L(d.icone)}</span><span class="ab2__mod-texto"><span class="ab2__mod-nome">${d.nome}</span><span class="ab2__mod-desc">${d.desc}</span></span>`;
    if (!sessao) return `<li class="ab2__mod is-disponivel" data-modulo="${d.id}">${corpo}<span class="ab2__mod-estado ab2__mod-estado--ok">Disponível depois de entrares</span></li>`;
    if (cen === 'sem-acesso') return `<li class="ab2__mod is-disponivel is-fechado" data-modulo="${d.id}">${corpo}<span class="ab2__mod-estado">${ic('lock')}Sem acesso no teu perfil</span></li>`;
    return `<li class="ab2__mod is-disponivel" data-modulo="${d.id}">${corpo}<button type="button" class="btn btn--ghost btn--sm ab2__mod-abrir" data-ab2-ir="compras">${ic('arrow-right', 'btn__icone')}<span class="btn__rotulo">Abrir Compras</span></button></li>`;
  }).join('');
}

const NOTA = 'A abertura v2 (19 out., briefing «V2 Cinematic Opening»): molduras dos domínios numa grelha técnica que se alinham num só sistema e revelam o ROMAFE; a ação da sessão e o lançador (só Compras)';

export const versaoAberturaV2 = () => ({ id: VERSAO_ABERTURA_V2, nota: NOTA, html: html('normal') });

export function estadosAberturaV2(): EcraErp[] {
  const e = (id: IdAberturaV2, nome: string, objetivo: string, cen: Cenario): EcraErp =>
    ({ id, nome, fluxo: 'Entrar', estadoDe: 'abertura', objetivo, versoes: [{ id: VERSAO_ABERTURA_V2, nota: NOTA, html: html(cen) }] });
  return [
    e('ab2-regresso', '00.1 · Regresso', 'Já se viu nesta sessão: a composição final aparece logo, sem a sequência; a ação está pronta.', 'regresso'),
    e('ab2-sessao', '00.2 · Com sessão', 'Há sessão: a ação é «Abrir espaço de trabalho» (o Início) e Compras tem «Abrir Compras». Não se mostra «Entrar».', 'sessao'),
    e('ab2-verificar', '00.3 · A verificar a sessão', 'Enquanto o servidor confirma a sessão: «A verificar a sessão…» no sítio da ação, sem botão (não se sabe ainda qual é).', 'verificar'),
    e('ab2-sem-acesso', '00.4 · Sem acesso a Compras', 'Sessão de um perfil sem Compras (Vendas): o módulo diz «Sem acesso no teu perfil» e não se clica; o espaço de trabalho abre.', 'sem-acesso'),
    e('ab2-erro', '00.5 · Erro ao carregar', 'O ERP não carregou: a faixa diz isso e «Tentar outra vez» volta a carregar a página.', 'erro'),
    e('ab2-offline', '00.6 · Sem ligação', 'Sem rede: «Entrar no ERP» fica desligado com a razão por baixo; volta sozinho quando a ligação voltar.', 'offline'),
    e('ab2-quieto', '00.7 · Movimento reduzido', 'Com «reduzir movimento»: a composição final, parada; nada depende da animação.', 'quieto'),
  ];
}
