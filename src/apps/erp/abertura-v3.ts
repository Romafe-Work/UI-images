/* =========================================================
   ERP — 00 · Abertura v3 (22 out. 2026), do briefing dela «ROMAFE ERP — Cinematic Opening Experience»
   «Uma empresa. Tudo ligado.» Só a abertura; não há login próprio — o início de sessão é o comum (ROMAFE
   Identity). A sequência, curta (≈1,5 s) e interrompível:
     A (150–400 ms)  — entram cinco peças do negócio, em 2.5D: compras, documento, armazém, pacote e transporte;
     B (400–750 ms)  — alinham-se numa cadeia (a encomenda → o documento → o armazém → o pacote → a entrega),
                       as linhas finas ligam-nas e um sinal laranja percorre-a;
     C (750–1050 ms) — convergem para o centro e a composição simplifica-se;
     D (1050–1300 ms)— fica a identidade: ROMAFE, ERP e «Gestão integrada. Operação conectada.»;
     E (1300–1500 ms)— a estrutura desfoca-se e a marca passa (view transition) à da barra do 05 · Início.
   Com sessão (a da ROMAFE Identity, ou a do ERP), segue para o Início ou para o destino pedido (?para=…);
   sem sessão, para o login comum; sem acesso, o estado próprio. A animação não atrasa ninguém: «Saltar
   introdução» e Esc passam logo; na mesma sessão, só um toque da marca; se o ERP não estiver pronto no fim,
   aparece o estado «A preparar o ERP» (e não um falso «pronto»).
   Desenho: SVG em projeção isométrica (feito aqui, com faces a três tons) e CSS (transform e opacidade);
   sem Three.js. Sempre escuro, com a paleta do briefing; o ROMAFE continua RGB(0, 99, 170), em Motor.
   ========================================================= */
import type { EcraErp } from './ids';
import { ic } from './inicio-icones';
import skipForward from 'lucide-static/icons/skip-forward.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import shieldX from 'lucide-static/icons/shield-x.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

export const VERSAO_ABERTURA_V3 = 'v3';

/* ---------- a projeção isométrica: x e y no chão, z para cima ---------- */
type P3 = [number, number, number];
const C30 = Math.cos(Math.PI / 6), S30 = .5;
const iso = ([x, y, z]: P3): [number, number] => [(x - y) * C30, (x + y) * S30 - z];
const pts = (l: P3[]) => l.map((p) => iso(p).map((v) => v.toFixed(1)).join(',')).join(' ');
const poli = (l: P3[], cls: string) => `<polygon class="${cls}" points="${pts(l)}"/>`;
const linha = (l: P3[], cls = 'ab3-tr') => `<polyline class="${cls}" points="${pts(l)}"/>`;
/** uma caixa: as três faces que se veem (a da frente, a da direita e o topo) */
export function caixa(x: number, y: number, z: number, w: number, d: number, h: number, extra = ''): string {
  return poli([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], `ab3-f1${extra}`)
    + poli([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], `ab3-f2${extra}`)
    + poli([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], `ab3-f3${extra}`);
}
/** uma roda: um círculo no plano vertical da frente (y constante) */
const roda = (cx: number, y: number, cz: number, r: number) => poli(Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r] as P3; }), 'ab3-roda');

/* as cinco peças (cada uma à volta da origem, para rodar e escalar no sítio) */
export const PECAS: { id: string; nome: string; svg: string }[] = [
  { id: 'compras', nome: 'Compras', svg: caixa(-15, -9, 0, 30, 18, 30) + linha([[-7, 9, 30], [-7, 9, 40], [-3, 9, 45], [3, 9, 45], [7, 9, 40], [7, 9, 30]], 'ab3-tr ab3-tr--forte') + linha([[-9, 9, 18], [9, 9, 18]]) },
  { id: 'documento', nome: 'Documento', svg: caixa(-17, -23, 0, 34, 46, 2) + linha([[-11, -15, 2], [11, -15, 2]]) + linha([[-11, -7, 2], [11, -7, 2]]) + linha([[-11, 1, 2], [11, 1, 2]]) + linha([[-11, 9, 2], [3, 9, 2]]) + poli([[9, -23, 2], [17, -23, 2], [17, -15, 2]], 'ab3-dobra') },
  { id: 'armazem', nome: 'Armazém', svg: caixa(-30, -18, 0, 60, 36, 22) + poli([[-30, -18, 22], [-30, 18, 22], [-30, 0, 34], [-30, -18, 22]], 'ab3-f1') + poli([[-30, 0, 34], [30, 0, 34], [30, 18, 22], [-30, 18, 22]], 'ab3-f3') + poli([[30, -18, 22], [30, 18, 22], [30, 0, 34]], 'ab3-f2') + poli([[30, -6, 0], [30, 8, 0], [30, 8, 14], [30, -6, 14]], 'ab3-porta') + linha([[30, 1, 0], [30, 1, 14]]) },
  { id: 'pacote', nome: 'Pacote', svg: caixa(-18, -18, 0, 36, 36, 30) + linha([[0, -18, 30], [0, 18, 30], [0, 18, 20]], 'ab3-tr ab3-tr--fita') + linha([[-18, 0, 30], [18, 0, 30], [18, 0, 20]], 'ab3-tr ab3-tr--fita') + poli([[4, 18, 8], [14, 18, 8], [14, 18, 15], [4, 18, 15]], 'ab3-etq') },
  { id: 'transporte', nome: 'Transporte', svg: caixa(-30, -12, 4, 40, 24, 30) + caixa(10, -12, 4, 18, 24, 20) + poli([[22, 12, 14], [28, 12, 14], [28, 12, 22], [20, 12, 22]], 'ab3-vidro') + roda(-18, 12, 4, 5) + roda(18, 12, 4, 5) },
];

/* onde cada peça está: a entrar (de fora), alinhada na cadeia, e no centro (no plano de 1000 × 600) */
const POS: { e: [number, number]; a: [number, number] }[] = [
  { e: [-60, 120], a: [140, 300] }, { e: [260, -60], a: [320, 300] }, { e: [500, 690], a: [500, 300] }, { e: [760, -60], a: [680, 300] }, { e: [1080, 470], a: [860, 300] },
];
/* a cadeia: entre cada par, um degrau ortogonal (sobe, corre, desce), e o sinal laranja percorre-a toda */
/* as linhas saem do topo de uma peça e chegam ao topo da seguinte, ou correm por baixo dos nomes; o sinal passa
   por dentro das peças (fica por baixo delas) */
const CADEIA = 'M140 250 V206 H320 V250 M320 392 V418 H500 V392 M500 250 V206 H680 V250 M680 392 V418 H860 V392';
const SINAL = "path('M140 250 V206 H320 V418 H500 V206 H680 V418 H860 V392')";

function palco(): string {
  /* o chão técnico: linhas em perspetiva para um ponto de fuga e horizontais que se apertam ao longe */
  const fuga: string[] = [];
  for (let i = -12; i <= 12; i++) fuga.push(`<line x1="${500 + i * 18}" y1="0" x2="${500 + i * 150}" y2="300"/>`);
  for (let k = 1; k <= 7; k++) { const y = 300 * (k / 7) ** 1.8; fuga.push(`<line x1="-200" y1="${y.toFixed(1)}" x2="1200" y2="${y.toFixed(1)}"/>`); }
  return `<div class="ab3__fundo" aria-hidden="true">
    <svg class="ab3__chao" viewBox="0 0 1000 300" preserveAspectRatio="none">${fuga.join('')}</svg>
    <svg class="ab3__arquitetura" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice"><path d="M0 120 L380 40 L1000 160"/><path d="M0 470 L420 560 L1000 430"/><path d="M380 40 V560"/><path d="M640 70 V520"/></svg>
  </div>
  <div class="ab3__palco" aria-hidden="true"><div class="ab3__plano">
    <svg class="ab3__cadeia" viewBox="0 0 1000 600"><path d="${CADEIA}" pathLength="1"/></svg>
    <i class="ab3__sinal" style="offset-path:${SINAL}"></i>
    <div class="ab3__nucleo"><i></i><i></i></div>
    ${PECAS.map((pc, i) => `<div class="ab3__peca" data-peca="${pc.id}" style="--ex:${POS[i].e[0]}px;--ey:${POS[i].e[1]}px;--ax:${POS[i].a[0]}px;--ay:${POS[i].a[1]}px;--i:${i}">
      <svg viewBox="-60 -62 120 92">${pc.svg}</svg><span class="ab3__peca-nome">${pc.nome}</span>
    </div>`).join('')}
  </div></div>`;
}

/* ---------- os cenários: o normal (que se decide ao correr) e os estados do ecrã ---------- */
export type CenarioV3 = 'normal' | 'iniciar' | 'intro' | 'pronto' | 'passagem' | 'autenticar' | 'sem-acesso' | 'offline' | 'falhou' | 'repetir' | 'saltada' | 'quieto';
export type IdAberturaV3 = `ab3-${Exclude<CenarioV3, 'normal'>}`;

/** A faixa de estado por baixo da marca (vazia no normal: a sequência não precisa de palavras). */
export function faixa(cen: CenarioV3): string {
  const btn = (t: string, i: string, extra: string, acao = false) => `<button type="button" class="btn${acao ? ' btn--acao' : ''} ab3__btn"${extra}>${L(i, 'btn__icone')}<span class="btn__rotulo">${t}</span></button>`;
  switch (cen) {
    case 'iniciar': case 'repetir': return `<p class="ab3__msg"><span class="ab3__girador" aria-hidden="true"></span>${cen === 'repetir' ? 'A tentar outra vez…' : 'A preparar o ERP…'}</p><span class="ab3__progresso" aria-hidden="true"><i></i></span>`;
    case 'pronto': return `<p class="ab3__msg ab3__msg--ok">${ic('circle-check')}O ERP está pronto.</p>`;
    case 'passagem': return `<p class="ab3__msg">${ic('arrow-right')}A abrir o espaço de trabalho…</p>`;
    case 'autenticar': return `<p class="ab3__msg">${ic('lock')}Para entrar no ERP, inicia sessão na ROMAFE.</p><p class="ab3__nota">Vais para o início de sessão comum; depois voltas aqui.</p><div class="ab3__accoes">${btn('Iniciar sessão na ROMAFE', logIn, ' data-ab3-login', true)}</div>`;
    case 'sem-acesso': return `<p class="ab3__msg ab3__msg--erro">${L(shieldX)}A tua conta não tem acesso ao ERP.</p><p class="ab3__nota">Pede o acesso ao administrador da tua empresa.</p><div class="ab3__accoes">${btn('Escolher outra aplicação', layoutGrid, ' data-ab3-aplicacoes', true)}${btn('Terminar sessão', logOut, ' data-ab3-login')}</div>`;
    case 'offline': return `<p class="ab3__msg ab3__msg--erro">${ic('wifi-off')}Sem ligação à rede.</p><p class="ab3__nota">O ERP precisa de falar com o servidor. Continua quando a ligação voltar.</p><div class="ab3__accoes">${btn('Tentar outra vez', rotateCw, ' data-ab3-repetir', true)}</div>`;
    case 'falhou': return `<p class="ab3__msg ab3__msg--erro">${ic('circle-alert')}Não foi possível iniciar o ERP.</p><p class="ab3__nota">Referência do erro: ERP-INIT-503. Se continuar, fala com o apoio.</p><div class="ab3__accoes">${btn('Tentar outra vez', rotateCw, ' data-ab3-repetir', true)}</div>`;
    default: return '';
  }
}

/* as fases que cada estado do ecrã mostra, parado */
const FASES_DE: Record<CenarioV3, string> = {
  normal: '', iniciar: 'is-a', intro: 'is-a is-b', pronto: 'is-a is-b is-c is-d', passagem: 'is-a is-b is-c is-d is-e', autenticar: 'is-a is-b is-c is-d', 'sem-acesso': 'is-a is-b is-c is-d',
  offline: 'is-a is-b is-c is-d', falhou: 'is-a is-b is-c is-d', repetir: 'is-a is-b is-c is-d', saltada: 'is-a is-b is-c is-d is-ja', quieto: 'is-a is-b is-c is-d is-ja',
};

function html(cen: CenarioV3): string {
  return `<main class="ab3 ${FASES_DE[cen]}" data-ab3 data-ab3-cenario="${cen}" aria-label="ROMAFE ERP">
  ${palco()}
  <button type="button" class="btn btn--ghost btn--sm ab3__saltar" data-ab3-saltar>${L(skipForward, 'btn__icone')}<span class="btn__rotulo">Saltar introdução</span></button>
  <div class="ab3__centro">
    <h1 class="ab3__marca"><span class="romafe ab3__romafe">ROMAFE</span><span class="ab3__erp">ERP</span></h1>
    <i class="ab3__risco" aria-hidden="true"></i>
    <p class="ab3__sub">Gestão integrada. Operação conectada.</p>
    <p class="ab3__lema">Uma empresa. Tudo ligado.</p>
    <div class="ab3__estado" data-ab3-estado role="status" aria-live="polite">${faixa(cen)}</div>
  </div>
</main>`;
}

const NOTA = 'A abertura v3 (22 out., briefing «Cinematic Opening Experience»): compras, documento, armazém, pacote e transporte ligam-se numa cadeia, convergem e revelam o ROMAFE ERP, que passa à barra do Início; sem login próprio';
export const versaoAberturaV3 = () => ({ id: VERSAO_ABERTURA_V3, nota: NOTA, html: html('normal') });

export function estadosAberturaV3(): EcraErp[] {
  const e = (cen: Exclude<CenarioV3, 'normal'>, nome: string, objetivo: string): EcraErp =>
    ({ id: `ab3-${cen}` as IdAberturaV3, nome, fluxo: 'Entrar', estadoDe: 'abertura', objetivo, versoes: [{ id: VERSAO_ABERTURA_V3, nota: NOTA, html: html(cen) }] });
  return [
    e('iniciar', '00.1 · A preparar o ERP', 'A introdução acabou e o ERP ainda não respondeu: «A preparar o ERP…» com uma barra fina, em vez de fingir que está pronto.'),
    e('intro', '00.2 · Introdução a correr', 'A meio da sequência: as cinco peças alinhadas na cadeia, ligadas pelas linhas, com o sinal laranja a percorrê-la.'),
    e('pronto', '00.3 · Pronto', 'A marca resolvida e o ERP pronto: daqui passa logo ao Início.'),
    e('passagem', '00.4 · A passar ao Início', 'A estrutura desfoca-se e a marca segue para a da barra do Início (a mesma peça, não um corte).'),
    e('autenticar', '00.5 · Sessão necessária', 'Sem sessão: não há login do ERP — leva ao início de sessão comum da ROMAFE e volta aqui depois.'),
    e('sem-acesso', '00.6 · Sem acesso ao ERP', 'A sessão existe, mas a conta não tem o ERP: diz isso, e oferece outra aplicação ou terminar a sessão.'),
    e('offline', '00.7 · Sem ligação', 'Sem rede: a marca fica, a razão por baixo e «Tentar outra vez»; não passa a lado nenhum.'),
    e('falhou', '00.8 · Não iniciou', 'O servidor não respondeu ao iniciar: a referência do erro e «Tentar outra vez».'),
    e('repetir', '00.9 · A tentar outra vez', 'Depois de «Tentar outra vez»: a mesma espera do 00.8, com a frase certa.'),
    e('saltada', '00.10 · Introdução saltada', '«Saltar introdução», Esc, ou já vista nesta sessão: a marca aparece logo, sem a sequência, e segue.'),
    e('quieto', '00.11 · Movimento reduzido', 'Com «reduzir movimento»: a composição final, parada; a passagem é imediata.'),
  ];
}
