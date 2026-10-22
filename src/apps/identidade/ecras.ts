/* =========================================================
   ROMAFE IDENTITY — um início de sessão, todas as aplicações (21 out. 2026)
   Do briefing «ROMAFE Identity — One login, three applications». Ela escolheu: só os ecrãs (sem Keycloak nem
   servidor neste protótipo) e sem o «Bem-vindo» (como decidiu a 20 out. no ERP) — o título é «Entrar na ROMAFE».
   - Não é o Peça A Peça nem a Pick: é a porta da ROMAFE. Desktop partido ao meio — à esquerda a cena das peças
     do negócio que se ligam no ROMAFE (a caixa, o rolamento, a estante), à direita o painel de entrar.
   - E-mail primeiro, depois a palavra-passe (o que o fornecedor de identidade tem hoje). Nada de entrar sem
     palavra-passe, SSO ou segundo fator inventados: quando houver, entram como passos novos.
   - Depois de entrar: uma aplicação autorizada → abre-se logo; várias → «Onde queres trabalhar?»; nenhuma → diz-se
     isso. Se se veio de uma aplicação (ex.: o Peça A Peça), volta-se a ela.
   - As aplicações são as do registo (as quatro do protótipo); só aparecem as autorizadas.
   - Os erros não dizem se um e-mail tem conta.
   A abertura (≈1,2 s) não atrasa nada: o formulário está pronto desde o início.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdIdentidade } from './ids';
import { L } from '../goparts/portal/inicio-espaco';
import mail from 'lucide-static/icons/mail.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import layoutDashboard from 'lucide-static/icons/layout-dashboard.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import clockAlert from 'lucide-static/icons/clock-alert.svg?raw';
import shieldX from 'lucide-static/icons/shield-x.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import lifeBuoy from 'lucide-static/icons/life-buoy.svg?raw';
import keyRound from 'lucide-static/icons/key-round.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import building from 'lucide-static/icons/building.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import userX from 'lucide-static/icons/user-x.svg?raw';
import smartphone from 'lucide-static/icons/smartphone.svg?raw';

export const CORREIO = 'rui.matos@romafe.pt';
const FLUXO = 'Entrar';

/* ---------- o registo das aplicações (o que o servidor devolve depois de entrar; aqui, as do protótipo) ---------- */
export type App = { id: string; nome: string; desc: string; icone: string; pagina?: string; so?: string };
export const APPS: App[] = [
  { id: 'erp', nome: 'ERP', desc: 'Compras, stocks, vendas e a gestão da empresa.', icone: layoutDashboard, pagina: 'erp/#ecra=inicio' },
  { id: 'pecaapeca', nome: 'Peça A Peça', desc: 'O marketplace de peças auto para as oficinas.', icone: store, pagina: 'peca-a-peca/#ecra=abertura' },
  { id: 'goshop', nome: 'GoShop', desc: 'A loja online de peças.', icone: shoppingCart, so: 'Ainda sem ecrãs depois de entrar' },
  { id: 'pick', nome: 'Pick', desc: 'A aplicação do armazém.', icone: scanBarcode, so: 'Abre-se no PDA' },
];

/* ---------- peças pequenas ---------- */
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn id__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
const acao = (texto: string, icone: string, extra = '') => `<button type="submit" class="btn btn--acao id__btn id__btn--acao"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
type Tom = 'erro' | 'aviso' | 'info' | 'ok';
const aviso = (tom: Tom, ic: string, titulo: string, texto: string, accoes = '') => `<div class="id__aviso id__aviso--${tom}" role="${tom === 'erro' ? 'alert' : 'status'}">${L(ic)}<div><b>${titulo}</b><span>${texto}</span>${accoes ? `<div class="id__aviso-accoes">${accoes}</div>` : ''}</div></div>`;
const roda = '<span class="id__roda" aria-hidden="true"></span>';

/* ---------- a cena da esquerda: as peças do negócio que se ligam no ROMAFE ----------
   A caixa (o armazém e a logística), o rolamento (as peças), a estante (o stock) e o ecrã (a gestão): cada uma
   entra do seu lado, as linhas desenham-se até ao centro e o ROMAFE aparece. Só SVG e CSS. */
const CENA = `<svg class="id-cena__svg" viewBox="0 0 600 600" fill="none" aria-hidden="true" focusable="false">
  <g class="id-cena__grelha">${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 60} 0V600M0 ${i * 60}H600"/>`).join('')}</g>
  <g class="id-cena__linhas">
    <path class="id-cena__l id-cena__l--1" d="M300 300 150 170"/><path class="id-cena__l id-cena__l--2" d="M300 300 455 160"/>
    <path class="id-cena__l id-cena__l--3" d="M300 300 140 440"/><path class="id-cena__l id-cena__l--4" d="M300 300 460 445"/>
  </g>
  <g class="id-cena__no id-cena__no--caixa" transform="translate(150 170)"><g>
    <path class="id-cena__face1" d="M-38 -10 0 -30 38 -10 0 10Z"/><path class="id-cena__face2" d="M-38 -10 0 10V52L-38 32Z"/><path class="id-cena__face3" d="M38 -10 0 10V52L38 32Z"/>
    <path class="id-cena__fita" d="M-19 -20 19 0M0 10V52"/><rect class="id-cena__etq" x="-30" y="8" width="18" height="12" transform="skewY(27)"/></g></g>
  <g class="id-cena__no id-cena__no--rol" transform="translate(455 160)"><g class="id-cena__rol">
    <circle r="40"/><circle r="31"/><circle r="14"/><circle r="8"/>${Array.from({ length: 9 }, (_, k) => { const a = (k / 9) * Math.PI * 2; return `<circle cx="${(Math.cos(a) * 22.5).toFixed(1)}" cy="${(Math.sin(a) * 22.5).toFixed(1)}" r="4.2"/>`; }).join('')}</g></g>
  <g class="id-cena__no id-cena__no--estante" transform="translate(140 440)"><g>
    <path d="M-44 -46V46M44 -46V46M-44 -46H44M-44 -14H44M-44 18H44M-44 46H44"/>
    <rect class="id-cena__cx" x="-36" y="-38" width="22" height="20"/><rect class="id-cena__cx" x="-8" y="-36" width="18" height="18"/><rect class="id-cena__cx" x="16" y="-6" width="22" height="20"/><rect class="id-cena__cx" x="-34" y="24" width="26" height="18"/></g></g>
  <g class="id-cena__no id-cena__no--ecra" transform="translate(460 445)"><g>
    <rect x="-46" y="-34" width="92" height="62" rx="6"/><path d="M-12 40H12M0 28V40"/>
    <path class="id-cena__barras" d="M-30 14V2M-16 14V-8M-2 14V-2M12 14V-14M26 14V-4"/></g></g>
  <circle class="id-cena__centro-anel" cx="300" cy="300" r="70"/>
</svg>`;
function cena(): string {
  return `<aside class="id-cena" aria-hidden="true">
    ${CENA}
    <div class="id-cena__marca"><span class="romafe id-cena__romafe">ROMAFE</span></div>
    <p class="id-cena__frase">Desde 1945 · <i>Rolling your way</i></p>
  </aside>`;
}

/* ---------- a moldura: a cena e o painel ---------- */
type Moldura = { k: string; corpo: string; app?: string; abrir?: boolean };
function moldura(o: Moldura): string {
  return `<div class="id${o.abrir ? ' id--abrir' : ''}" data-id="${o.k}">
    ${cena()}
    <main class="id__painel">
      <div class="id__caixa">
        <header class="id__marca"><span class="romafe id__romafe">ROMAFE</span><span class="id__conta-romafe">Conta ROMAFE</span></header>
        ${o.app ? `<p class="id__vem">${L(arrowLeftRight)}<span>Para continuar no <b>${o.app}</b></span></p>` : ''}
        ${o.corpo}
      </div>
      <footer class="id__pe"><span>Uma conta para o ERP, o Peça A Peça, o GoShop e a Pick.</span><a href="#" data-ir="recuperar">${L(lifeBuoy)}Precisas de ajuda?</a></footer>
    </main>
  </div>`;
}

/* ---------- 01 · Entrar (o e-mail) ---------- */
export type EstEntrada = '' | 'de-app' | 'erro-email' | 'a-verificar' | 'servico' | 'offline' | 'sessao' | 'saida' | 'redirecionamento' | 'restaurada';
export function entrada(e: EstEntrada = ''): string {
  const valor = e === 'erro-email' ? 'rui.matos@romafe' : e === 'a-verificar' || e === 'servico' ? CORREIO : '';
  const topo = e === 'sessao' ? aviso('aviso', clockAlert, 'A tua sessão terminou.', 'Por segurança, entra outra vez. Voltas ao sítio onde estavas.')
    : e === 'saida' ? aviso('ok', circleCheck, 'Saíste da ROMAFE.', 'A sessão terminou nesta janela e nas aplicações web. No PDA, termina na própria Pick.')
    : e === 'redirecionamento' ? aviso('erro', shieldX, 'Este endereço de regresso não é de uma aplicação ROMAFE.', 'Por segurança, não te levamos lá. Entra e escolhe a aplicação.')
    : e === 'offline' ? aviso('erro', wifiOff, 'Sem ligação à Internet.', 'Liga-te à rede e tenta de novo. O que escreveste fica no campo.')
    : e === 'servico' ? aviso('erro', serverOff, 'O serviço de entrada não está a responder.', 'Não é da tua conta. Tenta daqui a um minuto; se continuar, fala com o apoio.', btn('Tentar de novo', arrowRight, ' data-id-tentar'))
    : '';
  if (e === 'restaurada') return moldura({ k: 'entrada-restaurada', corpo: `
    <h1 class="id__titulo">Continuar na ROMAFE</h1>
    <p class="id__sub">A tua sessão ainda está aberta neste navegador.</p>
    <div class="id__eu"><span class="id__eu-inicial" aria-hidden="true">RM</span><span><b>Rui Matos</b><small>${CORREIO}</small></span></div>
    <form class="id__form" data-id-form="restaurada" novalidate>${acao('Continuar como Rui', arrowRight, ' data-id-continuar')}</form>
    <button type="button" class="id__link" data-ir="entrada">Usar outra conta</button>` });
  return moldura({ k: `entrada${e ? `-${e}` : ''}`, app: e === 'de-app' ? 'Peça A Peça' : undefined, corpo: `
    <h1 class="id__titulo">Entrar na ROMAFE</h1>
    <p class="id__sub">Uma conta. Todas as tuas ferramentas.</p>
    ${topo}
    <form class="id__form" data-id-form="correio" novalidate>
      <div class="id__campo${e === 'erro-email' ? ' is-erro' : ''}">
        <label for="id-correio-${e || 'v'}">E-mail</label>
        <span class="id__caixa-campo">${L(mail)}<input id="id-correio-${e || 'v'}" class="id__input" type="email" name="correio" autocomplete="username" inputmode="email" spellcheck="false" placeholder="nome@empresa.pt" value="${valor}"${e === 'erro-email' ? ' aria-invalid="true" aria-describedby="id-correio-erro"' : ''}${e === 'a-verificar' ? ' readonly' : ''}></span>
        <small class="id__erro" id="id-correio-erro"${e === 'erro-email' ? '' : ' hidden'}>${L(circleAlert)}Escreve o e-mail completo, como nome@empresa.pt.</small>
      </div>
      ${e === 'a-verificar' ? `<button type="submit" class="btn btn--acao id__btn id__btn--acao" disabled aria-busy="true">${roda}<span class="btn__rotulo">A verificar…</span></button>` : acao('Continuar', arrowRight, ' data-id-continuar')}
    </form>
    <p class="id__nota">Entras com a mesma conta em todas as aplicações ROMAFE.</p>` });
}

/* ---------- 02 · Palavra-passe ---------- */
export type EstPasse = '' | 'a-entrar' | 'credenciais' | 'bloqueada' | 'sucesso';
export function passe(e: EstPasse = ''): string {
  const topo = e === 'credenciais' ? aviso('erro', circleAlert, 'O e-mail ou a palavra-passe não estão certos.', 'Confirma os dois e tenta outra vez. Depois de 5 tentativas, a conta fica bloqueada 15 minutos.')
    : e === 'bloqueada' ? aviso('erro', lock, 'A conta está bloqueada por agora.', 'Houve demasiadas tentativas. Tenta daqui a 15 minutos, ou muda a palavra-passe.', btn('Mudar a palavra-passe', keyRound, ' data-ir="recuperar"'))
    : e === 'sucesso' ? aviso('ok', circleCheck, 'Entraste.', 'A abrir o Peça A Peça…')
    : '';
  const ocupado = e === 'a-entrar' || e === 'sucesso';
  return moldura({ k: `passe${e ? `-${e}` : ''}`, app: e === 'sucesso' ? 'Peça A Peça' : undefined, abrir: e === 'sucesso', corpo: `
    <h1 class="id__titulo">A tua palavra-passe</h1>
    <div class="id__eu id__eu--curto"><span class="id__eu-inicial" aria-hidden="true">RM</span><span><small data-id-correio>${CORREIO}</small></span><button type="button" class="id__link" data-ir="entrada">Mudar</button></div>
    ${topo}
    <form class="id__form" data-id-form="passe" novalidate>
      <input type="email" name="correio" autocomplete="username" value="${CORREIO}" hidden>
      <div class="id__campo${e === 'credenciais' ? ' is-erro' : ''}">
        <label for="id-passe-${e || 'v'}">Palavra-passe</label>
        <span class="id__caixa-campo">${L(lock)}<input id="id-passe-${e || 'v'}" class="id__input" type="password" name="passe" autocomplete="current-password" value="${e === 'credenciais' || e === 'a-entrar' || e === 'sucesso' ? '••••••••••' : ''}"${e === 'credenciais' ? ' aria-invalid="true"' : ''}${ocupado || e === 'bloqueada' ? ' disabled' : ''}>
          <button type="button" class="id__ver" data-id-ver aria-pressed="false" aria-label="Mostrar a palavra-passe"${ocupado || e === 'bloqueada' ? ' disabled' : ''}>${L(eye)}</button></span>
        <small class="id__caps" data-id-caps hidden>As maiúsculas estão ligadas.</small>
      </div>
      ${ocupado ? `<button type="submit" class="btn btn--acao id__btn id__btn--acao" disabled aria-busy="true">${roda}<span class="btn__rotulo">${e === 'sucesso' ? 'A abrir…' : 'A entrar…'}</span></button>` : acao('Entrar', logIn, `${e === 'bloqueada' ? ' disabled' : ''} data-id-entrar`)}
    </form>
    <button type="button" class="id__link" data-ir="recuperar">Esqueci-me da palavra-passe</button>` });
}

/* ---------- 03 · Onde queres trabalhar? ---------- */
export type EstApps = '' | 'uma' | 'nenhuma' | 'indisponivel' | 'revogado' | 'a-abrir';
export function aplicacoes(e: EstApps = ''): string {
  const lista = e === 'uma' ? APPS.filter((a) => a.id === 'erp') : e === 'nenhuma' ? [] : APPS;
  const cartao = (a: App, i: number) => {
    const fora = e === 'indisponivel' && a.id === 'pecaapeca' ? 'Em manutenção até às 07:00' : a.so;
    const corpo = `<span class="id-app__icone">${L(a.icone)}</span><span class="id-app__nome">${a.nome}</span><span class="id-app__desc">${a.desc}</span>`;
    if (fora) return `<li style="--i:${i}"><div class="id-app is-fechada" data-app="${a.id}">${corpo}<span class="id-app__estado">${L(a.id === 'pick' ? smartphone : clockAlert)}${fora}</span></div></li>`;
    const abrir = e === 'a-abrir' && a.id === 'erp';
    return `<li style="--i:${i}"><button type="button" class="id-app" data-app="${a.id}" data-id-abrir="${a.pagina}"${abrir ? ' aria-busy="true" disabled' : ''}>${corpo}<span class="id-app__abrir">${abrir ? `${roda}A abrir…` : `Abrir${L(arrowRight)}`}</span></button></li>`;
  };
  const conta = `<div class="id__eu id__eu--curto"><span class="id__eu-inicial" aria-hidden="true">RM</span><span><b>Rui Matos</b><small>${CORREIO}</small></span><button type="button" class="id__link" data-ir="entrada" data-id-sair>${L(logOut)}Sair</button></div>`;
  if (e === 'uma') return moldura({ k: 'apps-uma', abrir: true, corpo: `
    <h1 class="id__titulo">A abrir o ERP…</h1>
    <p class="id__sub">É a única aplicação da tua conta: entras diretamente.</p>
    ${conta}
    <div class="id__a-abrir" role="status">${roda}<span>A preparar a tua sessão no ERP</span></div>` });
  if (e === 'nenhuma' || e === 'revogado') return moldura({ k: `apps-${e}`, app: e === 'revogado' ? 'Peça A Peça' : undefined, corpo: `
    <h1 class="id__titulo">${e === 'revogado' ? 'Não tens acesso a esta aplicação.' : 'Ainda sem aplicações'}</h1>
    <p class="id__sub">${e === 'revogado' ? 'O acesso da tua conta ao Peça A Peça foi retirado ou ainda não foi dado.' : 'A tua conta entrou, mas ainda não tem acesso a nenhuma aplicação ROMAFE.'}</p>
    ${conta}
    ${aviso('info', userX, 'Quem dá o acesso é o administrador da tua empresa.', 'Quando o tiveres, volta a entrar e a aplicação aparece aqui.')}
    <div class="id__accoes">${e === 'revogado' ? btn('Ver as minhas aplicações', layoutDashboard, ' data-ir="aplicacoes"', 'btn--acao') : ''}${btn('Sair', logOut, ' data-ir="entrada"')}</div>` });
  return moldura({ k: `apps${e ? `-${e}` : ''}`, corpo: `
    <h1 class="id__titulo">Onde queres trabalhar?</h1>
    <p class="id__sub">Escolhe a aplicação que pretendes utilizar.</p>
    ${conta}
    <p class="id__empresa">${L(building)}<span>Romafe — Rolamentos e Ferramentas, S.A.</span></p>
    <ul class="id-apps" role="list" aria-label="As tuas aplicações">${lista.map(cartao).join('')}</ul>` });
}

/* ---------- 04 · Recuperar a palavra-passe ---------- */
export function recuperar(enviado = false): string {
  return moldura({ k: `recuperar${enviado ? '-enviado' : ''}`, corpo: enviado ? `
    <h1 class="id__titulo">Verifica o teu e-mail</h1>
    ${aviso('ok', mail, 'Se este e-mail tiver conta ROMAFE, enviámos uma ligação para criar uma palavra-passe nova.', 'A ligação vale 30 minutos. Não chegou? Vê o lixo eletrónico ou pede outra.')}
    <div class="id__accoes">${btn('Voltar a entrar', arrowLeft, ' data-ir="entrada"', 'btn--acao')}</div>` : `
    <h1 class="id__titulo">Mudar a palavra-passe</h1>
    <p class="id__sub">Escreve o e-mail da tua conta. Enviamos uma ligação para criares uma palavra-passe nova.</p>
    <form class="id__form" data-id-form="recuperar" novalidate>
      <div class="id__campo"><label for="id-rec">E-mail</label><span class="id__caixa-campo">${L(mail)}<input id="id-rec" class="id__input" type="email" name="correio" autocomplete="username" inputmode="email" placeholder="nome@empresa.pt"></span>
        <small class="id__erro" hidden>${L(circleAlert)}Escreve o e-mail completo, como nome@empresa.pt.</small></div>
      ${acao('Enviar a ligação', mail)}
    </form>
    <button type="button" class="id__link" data-ir="entrada">${L(arrowLeft)}Voltar a entrar</button>` });
}

/* ---------- 05 · No PDA: a mesma conta, no navegador do sistema ----------
   A Pick abre a página da ROMAFE Identity no separador seguro do Android (não numa WebView) e volta à app pelo
   endereço registado. Composição compacta: sem a cena, campos grandes, o botão sempre à vista. */
export function pda(): string {
  return `<div class="id-pda">
    <div class="id-pda__aparelho" role="img" aria-label="Exemplo: o início de sessão ROMAFE no PDA">
      <div class="id-pda__barra"><span>${L(lock)}login.romafe.pt</span><span>Pick</span></div>
      <div class="id-pda__ecra">
        <span class="romafe id-pda__romafe">ROMAFE</span>
        <p class="id__vem">${L(arrowLeftRight)}<span>Para continuar na <b>Pick</b></span></p>
        <h1 class="id-pda__titulo">Entrar na ROMAFE</h1>
        <div class="id__campo"><label>E-mail</label><span class="id__caixa-campo">${L(mail)}<input class="id__input" value="${CORREIO}" tabindex="-1" readonly></span></div>
        <div class="id__campo"><label>Palavra-passe</label><span class="id__caixa-campo">${L(lock)}<input class="id__input" type="password" value="••••••••" tabindex="-1" readonly></span></div>
        <span class="btn btn--acao id__btn id__btn--acao">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar</span></span>
      </div>
    </div>
    <div class="id-pda__texto">
      <h1 class="id__titulo">No PDA</h1>
      <p class="id__sub">A Pick abre esta página no navegador seguro do Android e volta sozinha à app quando entras.</p>
      <ul class="id-pda__lista">
        <li>${L(circleCheck)}<span>A mesma conta ROMAFE; a palavra-passe nunca passa pela Pick.</span></li>
        <li>${L(circleCheck)}<span>Campos de 48 px, teclado de e-mail, o botão sempre à vista.</span></li>
        <li>${L(circleCheck)}<span>Se a sessão do navegador ainda estiver aberta, não se pede de novo — salvo quando a segurança o exige.</span></li>
        <li>${L(wifiOff)}<span>Sem rede, a Pick não entra (decisão de 17 set.): diz «Sem ligação» e espera.</span></li>
      </ul>
    </div>
  </div>`;
}

/* ---------- os ecrãs e os estados ---------- */
/* (22 out.) ela: «quero o login assim» (a imagem do login escuro do Peça A Peça). A v2 de cada ecrã: a página
   escura partida ao meio — à esquerda o título grande, a frase, o que a conta abre e o rolamento 3D de sempre
   (o canvas do Peça A Peça, comportamento/entrar-3d.ts); à direita o ROMAFE com o risco laranja, o título, campos
   sublinhados e o botão laranja. Sem o «Bem-vindo» (decisão de 20 out.): o título continua «Entrar na ROMAFE».
   O PDA não muda (é outra composição). */
const NOTA_V2 = 'Como o login escuro do Peça A Peça (22 out., da imagem dela): título grande, rolamento 3D, campos sublinhados';
const ONDAS = `<svg class="ent3__ondas" aria-hidden="true" viewBox="0 0 1000 1000" preserveAspectRatio="none">
  <path pathLength="1" d="M-20 210 C 220 160, 420 260, 640 200 S 900 120, 1020 150"/>
  <path pathLength="1" class="is-laranja" d="M-20 470 C 180 420, 380 520, 600 470 S 860 400, 1020 430"/>
  <path pathLength="1" d="M-20 760 C 240 720, 420 820, 660 760 S 900 700, 1020 720"/>
</svg>`;
const PONTOS: [number, number][] = [[8, 14], [34, 9], [62, 6], [88, 11], [21, 38], [71, 31], [93, 47], [12, 62], [48, 58], [80, 69], [28, 84], [58, 91], [90, 88]];
const PALCO = `<section class="ent3__palco" aria-label="ROMAFE">
    ${ONDAS}
    <div class="ent3__pontos" aria-hidden="true">${PONTOS.map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join('')}</div>
    <div class="ent3__texto">
      <p class="ent3__lema" role="presentation"><span>A peça certa.</span> <span>À primeira.</span> <span>Sem voltas.</span></p>
      <p class="ent3__frase">A Romafe num só sítio: o ERP, o Peça A Peça, o GoShop e a Pick, com a mesma conta.</p>
    </div>
    <div class="ent3__peca" aria-hidden="true">
      <div class="ent3__lugar"></div>
      <svg class="ent3__grafismo" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet"><ellipse class="ent3__orbita" rx="96" ry="34"/><circle class="ent3__orbita ent3__orbita--fina" r="92"/></svg>
    </div>
    <p class="ent3__ficha" aria-hidden="true">SKF 6206 · D 62 · d 30 · B 16 mm</p>
  </section>`;
/** a fase do rolamento de cada ecrã: montar-se no e-mail, completar-se na palavra-passe, desmontado na ajuda */
const fase = (k: string) => (k.startsWith('passe') || k.startsWith('aplicacoes') ? 'palavra' : k.startsWith('recuperar') ? 'ajuda' : 'entrada');
function paraV2(html: string): string {
  return html
    .replace(/^<div class="id( id--abrir)?" data-id="([^"]+)">/, (_, ab: string | undefined, k: string) => `<div class="ent3 id id--v2${ab || ''}" data-id="${k}" data-fase="${fase(k)}" data-ciclo>`)
    .replace(/<aside class="id-cena"[\s\S]*?<\/aside>/, PALCO)
    .replace('<main class="id__painel">', '<main class="id__painel ent3__lado">')
    .replace(/<header class="id__marca">[\s\S]*?<\/header>/, '<header class="id__marca ent3__marca"><span class="romafe">ROMAFE</span><span class="ent3__produto">Conta ROMAFE</span></header>');
}
/* (22 out.) ela, depois de ver a v2: tirar as três linhas do que a conta abre e a v1 — uma só versão por ecrã */
const um = (html: string, nota: string): Ecra<IdIdentidade>['versoes'] => (html.includes('class="id-cena"') ? [{ id: 'v2', nota: NOTA_V2, html: paraV2(html) }] : [{ id: 'v1', nota, html }]);
const NOTA = 'ROMAFE Identity (21 out., do briefing «One login, three applications»)';
export function ecrasIdentidade(): Ecra<IdIdentidade>[] {
  const est = <E extends string>(de: IdIdentidade, l: [E, IdIdentidade, string, string][], f: (e: E) => string) => l.map(([e, id, nome, objetivo]) => ({ id, nome, fluxo: FLUXO, objetivo, estadoDe: de, versoes: um(f(e), NOTA) }));
  return [
    { id: 'entrada', nome: '01 · Entrar', fluxo: FLUXO, objetivo: 'A porta da ROMAFE: e-mail primeiro e «Continuar». À esquerda, as peças do negócio (caixa, rolamento, estante, gestão) ligam-se no ROMAFE; o formulário está pronto desde o início.', versoes: um(entrada(), NOTA) },
    ...est<EstEntrada>('entrada', [
      ['de-app', 'entrada-de-app', '01.1 · Veio de uma aplicação', 'Começou no Peça A Peça: diz para onde se volta depois de entrar.'],
      ['erro-email', 'entrada-erro-email', '01.2 · E-mail incompleto', 'O erro no campo, com o exemplo; o que se escreveu fica.'],
      ['a-verificar', 'entrada-a-verificar', '01.3 · A verificar', 'Depois de «Continuar»: o botão espera, o campo fica só de leitura.'],
      ['servico', 'entrada-servico', '01.4 · Serviço indisponível', 'O fornecedor de identidade não responde: diz que não é da conta e dá «Tentar de novo».'],
      ['offline', 'entrada-offline', '01.5 · Sem ligação', 'Sem rede: o aviso e o campo como estava.'],
      ['sessao', 'entrada-sessao', '01.6 · Sessão terminada', 'A sessão acabou: entra-se outra vez e volta-se ao mesmo sítio.'],
      ['saida', 'entrada-saida', '01.7 · Saíste', 'Depois de sair: diz onde a sessão terminou (web) e onde não (PDA).'],
      ['redirecionamento', 'entrada-redirecionamento', '01.8 · Regresso inválido', 'O endereço de regresso não está no registo: não se segue; entra-se e escolhe-se a aplicação.'],
      ['restaurada', 'entrada-restaurada', '01.9 · Sessão restaurada', 'A sessão do navegador ainda está aberta: «Continuar como Rui» ou outra conta.'],
    ], entrada),
    { id: 'palavra-passe', nome: '02 · Palavra-passe', fluxo: FLUXO, objetivo: 'O e-mail fica à vista com «Mudar»; a palavra-passe com mostrar/esconder e o aviso das maiúsculas; «Entrar».', versoes: um(passe(), NOTA) },
    ...est<EstPasse>('palavra-passe', [
      ['a-entrar', 'passe-a-entrar', '02.1 · A entrar', 'O botão espera; os campos ficam como estavam.'],
      ['credenciais', 'passe-credenciais', '02.2 · Credenciais erradas', '«O e-mail ou a palavra-passe não estão certos.» — nunca diz qual, nem se o e-mail tem conta.'],
      ['bloqueada', 'passe-bloqueada', '02.3 · Conta bloqueada', 'Depois de demasiadas tentativas: quanto tempo e como mudar a palavra-passe.'],
      ['sucesso', 'passe-sucesso', '02.4 · Entrou e volta à aplicação', 'Veio do Peça A Peça e tem acesso: volta logo a ele, sem passar pela escolha.'],
    ], passe),
    { id: 'aplicacoes', nome: '03 · Onde queres trabalhar?', fluxo: FLUXO, objetivo: 'Com várias aplicações e sem destino pedido: os cartões das aplicações autorizadas, do registo; as que não abrem daqui dizem porquê.', versoes: um(aplicacoes(), NOTA) },
    ...est<EstApps>('aplicacoes', [
      ['a-abrir', 'apps-a-abrir', '03.1 · A abrir o ERP', 'Depois de escolher: o cartão espera e a página muda.'],
      ['uma', 'apps-uma', '03.2 · Uma só aplicação', 'Só o ERP está autorizado: abre-se logo, sem escolha.'],
      ['indisponivel', 'apps-indisponivel', '03.3 · Aplicação indisponível', 'O Peça A Peça em manutenção: o cartão diz até quando e não abre.'],
      ['nenhuma', 'apps-nenhuma', '03.4 · Sem aplicações', 'A conta entrou mas não tem nenhuma aplicação: quem dá o acesso.'],
      ['revogado', 'apps-revogado', '03.5 · Sem acesso a esta aplicação', 'Veio do Peça A Peça, mas o acesso foi retirado: «Não tens acesso a esta aplicação.» e as outras.'],
    ], aplicacoes),
    { id: 'recuperar', nome: '04 · Mudar a palavra-passe', fluxo: FLUXO, objetivo: 'O e-mail e «Enviar a ligação»; a resposta é a mesma quer o e-mail tenha conta, quer não.', versoes: um(recuperar(), NOTA) },
    { id: 'recuperar-enviado', nome: '04.1 · Ligação enviada', fluxo: FLUXO, estadoDe: 'recuperar', objetivo: '«Se este e-mail tiver conta…» — não revela se tem.', versoes: um(recuperar(true), NOTA) },
    { id: 'pda', nome: '05 · No PDA', fluxo: FLUXO, objetivo: 'A mesma conta na Pick: o navegador seguro do Android, a composição compacta e o regresso à app.', versoes: um(pda(), NOTA) },
  ];
}
