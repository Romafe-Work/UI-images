/* =========================================================
   ERP — v10 do início de sessão: a rede da empresa (19 out. 2026)
   Do briefing dela («ROMAFE ERP — Ultimate cinematic login»): o ERP com uma identidade própria, sem as peças
   de catálogo do GoParts. Ao fundo, uma rede 3D de peças da Romafe (19 out.: «mais
   rolamentos… coisa da Romafe») ligadas por linhas finas (comportamento/rede-cena.ts); ao centro, um cartão liso, sem vidro nem sombra.
     01 — só o correio: «Continuar» acende-se quando o endereço está bem escrito (isso não diz que a conta
          existe); ao continuar, o campo encolhe para a identificação e aparece a palavra-passe, no mesmo
          cartão (02). Um endereço de empresa com início de sessão próprio segue para o 03.
     02 — a palavra-passe: mostrar/ocultar, aviso das maiúsculas, «Entrar». Quando o servidor responde
          «entrou», a rede alinha-se e o cartão dá lugar ao ERP (10 · Compras).
     03 — a página da empresa (o Keycloak redireciona; não é nossa).
     04 — precisa de ajuda?
   O cartão tem sempre a mesma altura nos passos 01 e 02 (os dois passos ocupam a mesma célula): a troca
   faz-se com opacidade e deslocação, e nada à volta mexe. O ROMAFE é o de sempre (Motor, RGB 0 99 170).
   A ação principal é azul, como pede o briefing para o ERP; no GoParts continua laranja.
   Não há servidor neste protótipo: qualquer palavra-passe entra, exceto «errada», que mostra a recusa.
   Os outros desfechos (tentativas a mais, sem ligação, serviço parado, segundo fator) são estados.
   ========================================================= */
import type { EcraErp } from './ids';
import mail from 'lucide-static/icons/mail.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import keyRound from 'lucide-static/icons/key-round.svg?raw';
import userX from 'lucide-static/icons/user-x.svg?raw';
import lifeBuoy from 'lucide-static/icons/life-buoy.svg?raw';
import externalLink from 'lucide-static/icons/external-link.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import arrowBigUp from 'lucide-static/icons/arrow-big-up.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverCrash from 'lucide-static/icons/server-crash.svg?raw';
import shieldCheck from 'lucide-static/icons/shield-check.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-ccw.svg?raw';
import sun from 'lucide-static/icons/sun.svg?raw';
import moon from 'lucide-static/icons/moon.svg?raw';
import monitor from 'lucide-static/icons/monitor.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

export const VERSAO_REDE = 'v10';
export const NOTA_REDE = 'A rede da empresa (19 out., do briefing dela): rolamentos e outras peças da Romafe ligados em 3D à volta de um cartão liso ao centro; o correio passa a palavra-passe no mesmo cartão, e ao entrar a rede alinha-se e abre o ERP';
export const CORREIO = 'rui.matos@romafe.pt';

/* ---------- o desenho parado da rede (sem WebGL, com «reduzir movimento», e enquanto a cena carrega) ---------- */
function redeParada(): string {
  /* as peças em traço, como na cena: rolamentos (anéis e esferas) e um carreto */
  const n = 8, cx = 800, cy = 450;
  const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + 0.35; return [cx + Math.cos(a) * 610, cy + Math.sin(a) * 330]; });
  const rol = (x: number, y: number) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><circle r="26"/><circle r="21"/><circle r="11"/><circle r="8"/>${Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return `<circle r="3.6" cx="${(Math.cos(a) * 15.5).toFixed(1)}" cy="${(Math.sin(a) * 15.5).toFixed(1)}"/>`; }).join('')}</g>`;
  const ligs: [number, number][] = [...pts.map((_, i) => [i, (i + 1) % n] as [number, number]), [0, 3], [1, 5], [2, 6]];
  return `<svg class="rede__parada" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${ligs.map(([a, b]) => `<line x1="${pts[a][0].toFixed(0)}" y1="${pts[a][1].toFixed(0)}" x2="${pts[b][0].toFixed(0)}" y2="${pts[b][1].toFixed(0)}"/>`).join('')}
    ${pts.map(([x, y]) => rol(x, y)).join('')}
  </svg>`;
}
const PARADA = redeParada();

type Passo = 'correio' | 'passe' | 'empresa' | 'ajuda';
export interface Op {
  /** o que está escrito no correio (vazio = por escrever) */
  correio?: string;
  erroCorreio?: string;
  /** o aviso por cima do formulário: [ícone, título, texto, tipo] */
  aviso?: [string, string, string, 'erro' | 'info'];
  ocupado?: boolean;
  maiusculas?: boolean;
  passeEscrita?: boolean;
  erroPasse?: string;
  bloqueado?: boolean;
  repetir?: boolean;
  fator?: boolean;
  /** a fase da rede neste ecrã (data-rede) */
  rede?: string;
  /** 20 out.: a v11, o início de sessão geral (entrar-central.ts): a marca sem «ERP», textos de todas as
      aplicações, e depois da palavra-passe a escolha da empresa e da aplicação */
  geral?: boolean;
}

const tema = `<div class="rede__tema" role="group" aria-label="Tema">
  <button type="button" class="segmented__btn rede__tema-btn" data-tema="light" aria-label="Tema claro" title="Claro">${L(sun)}</button>
  <button type="button" class="segmented__btn rede__tema-btn" data-tema="dark" aria-label="Tema escuro" title="Escuro">${L(moon)}</button>
  <button type="button" class="segmented__btn rede__tema-btn" data-tema="auto" aria-label="Tema do sistema" title="Sistema">${L(monitor)}</button>
</div>`;

const marca = `<div class="rede__marca"><span class="romafe rede__romafe">ROMAFE</span><span class="rede__erp">ERP</span></div>`;
const marcaGeral = `<div class="rede__marca"><span class="romafe rede__romafe">ROMAFE</span></div>`;

export const aviso = (a?: Op['aviso']) => (a ? `<div class="rede__aviso rede__aviso--${a[3]}" role="${a[3] === 'erro' ? 'alert' : 'status'}">${L(a[0])}<div><p class="rede__aviso-titulo">${a[1]}</p><p>${a[2]}</p></div></div>` : '');

export const botao = (texto: string, icone: string, o: { depois?: boolean; ir?: string; rede?: string; desligado?: boolean; ocupado?: boolean; tipo?: 'submit' | 'button'; classe?: string } = {}) =>
  `<button type="${o.tipo || 'submit'}" class="btn rede__botao${o.classe ? ' ' + o.classe : ''}"${o.ir ? ` data-ir="${o.ir}"` : ''}${o.rede ? ` data-rede-acao="${o.rede}"` : ''}${o.desligado ? ' disabled' : ''}${o.ocupado ? ' aria-busy="true"' : ''}>${o.depois ? '' : L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span>${o.depois ? L(icone, 'btn__icone') : ''}<span class="rede__girar" aria-hidden="true"></span></button>`;

/* o passo do correio (01) */
function passoCorreio(k: string, o: Op): string {
  const valor = o.correio ?? '';
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  return `<div class="rede__passo rede__passo--correio">
    <h1 class="rede__escondido" id="rede-titulo-${k}">Iniciar sessão</h1>
    <p class="rede__sub rede__sub--abre">Entra na tua área de trabalho.</p>
    ${aviso(o.aviso)}
    <form class="rede__form" data-rede-form="correio" novalidate>
      <div class="rede__campo${o.erroCorreio ? ' is-erro' : ''}">
        <label for="rede-correio-${k}">Correio profissional</label>
        <div class="rede__caixa">${L(mail, 'rede__campo-icone')}<input id="rede-correio-${k}" name="username" type="email" inputmode="email" autocomplete="username" spellcheck="false" placeholder="nome@empresa.pt" required${valor ? ` value="${valor}"` : ''}${o.erroCorreio ? ` aria-invalid="true" aria-describedby="rede-correio-${k}-erro"` : ''}></div>
        <p class="rede__erro" id="rede-correio-${k}-erro"${o.erroCorreio ? '' : ' hidden'}>${L(circleAlert)}<span>${o.erroCorreio || ''}</span></p>
      </div>
      ${botao(o.ocupado ? 'A continuar…' : 'Continuar', arrowRight, { depois: true, ir: 'palavra-passe', rede: 'continuar', desligado: !valido || o.ocupado, ocupado: o.ocupado })}
    </form>
    <div class="rede__ajudas">
      <button type="button" class="rede__ligacao" data-ir="ajuda">${L(lifeBuoy)}Precisa de ajuda?</button>
    </div>
  </div>`;
}

/* o passo da palavra-passe (02), no mesmo cartão */
function passoPasse(k: string, o: Op): string {
  const conta = `<div class="rede__conta" data-rede-conta>${L(mail)}<span class="rede__conta-correio">${CORREIO}</span><button type="button" class="rede__mudar" data-ir="entrada" data-rede-acao="mudar">${L(pencil)}Mudar</button></div>`;
  if (o.fator) {
    return `<div class="rede__passo rede__passo--passe">
      <h1 class="rede__titulo" id="rede-titulo-${k}">Confirma que és tu</h1>
      <p class="rede__sub">A tua conta pede um segundo passo.</p>
      ${conta}
      <form class="rede__form" novalidate>
        <div class="rede__campo">
          <label for="rede-codigo-${k}">Código da aplicação de autenticação</label>
          <div class="rede__caixa">${L(shieldCheck, 'rede__campo-icone')}<input id="rede-codigo-${k}" name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="6 algarismos"></div>
          <p class="rede__nota">Abre a aplicação de autenticação no telemóvel e escreve o código que ela mostra.</p>
        </div>
        ${botao('Confirmar', shieldCheck, { desligado: true })}
      </form>
      <div class="rede__ajudas"><button type="button" class="rede__ligacao" data-ir="ajuda">${L(lifeBuoy)}Não tenho acesso à aplicação</button></div>
    </div>`;
  }
  return `<div class="rede__passo rede__passo--passe">
    <h1 class="rede__titulo" id="rede-titulo-${k}">Introduz a palavra-passe</h1>
    <p class="rede__sub">${o.geral ? 'Para entrares nas aplicações da Romafe.' : 'Para entrares no ROMAFE ERP.'}</p>
    ${conta}
    ${aviso(o.aviso)}
    <form class="rede__form" data-rede-form="passe" novalidate>
      <input type="email" name="username" autocomplete="username" value="${CORREIO}" hidden>
      <div class="rede__campo${o.erroPasse ? ' is-erro' : ''}">
        <div class="rede__rotulos"><label for="rede-passe-${k}">Palavra-passe</label><button type="button" class="rede__ligacao rede__ligacao--pequena" data-ir="ajuda">Esqueceste-te?</button></div>
        <div class="rede__caixa">${L(lock, 'rede__campo-icone')}<input id="rede-passe-${k}" name="password" type="password" autocomplete="current-password" required${o.passeEscrita ? ' value="••••••••••"' : ''}${o.erroPasse ? ` aria-invalid="true" aria-describedby="rede-passe-${k}-erro"` : ''}${o.bloqueado ? ' disabled' : ''}><button type="button" class="rede__olho" data-rede-acao="olho" aria-label="Mostrar a palavra-passe" aria-pressed="false">${L(eye)}</button></div>
        <p class="rede__maiusculas" data-rede-maiusculas${o.maiusculas ? '' : ' hidden'}>${L(arrowBigUp)}As maiúsculas estão ligadas.</p>
        <p class="rede__erro" id="rede-passe-${k}-erro"${o.erroPasse ? '' : ' hidden'}>${L(circleAlert)}<span>${o.erroPasse || ''}</span></p>
      </div>
      <label class="rede__manter"><input type="checkbox" name="manter"> <span>Manter a sessão neste computador</span></label>
      ${o.repetir
        ? botao('Tentar outra vez', rotateCw, { rede: 'entrar', ir: o.geral ? 'escolher-empresa' : 'compras' })
        : botao(o.ocupado ? 'A entrar…' : 'Entrar', logIn, { rede: 'entrar', ir: o.geral ? 'escolher-empresa' : 'compras', desligado: o.bloqueado || o.ocupado, ocupado: o.ocupado })}
    </form>
  </div>`;
}

export function moldura(k: string, passo: Passo | 'central', corpo: string, o: Op): string {
  return `<div class="rede${o.geral ? ' rede--geral' : ''}" data-passo="${passo}" data-rede="${o.rede || (passo === 'passe' ? 'passe' : 'neutro')}"${o.geral ? ' data-geral' : ''}>
  <div class="rede__palco" aria-hidden="true">${PARADA}<div class="rede__lugar"></div></div>
  <header class="rede__topo">${tema}</header>
  <main class="rede__centro">
    <section class="rede__cartao${passo === 'passe' ? ' is-passe' : ''}" aria-labelledby="rede-titulo-${k}">
      ${o.geral ? marcaGeral : marca}
      ${corpo}
    </section>
  </main>
  <footer class="rede__rodape"><span>2026 © Romafe SA</span><span>Versão 10.0 · compilação 2026.09</span></footer>
  <div class="rede__concha" aria-hidden="true"><div class="rede__concha-topo"></div><div class="rede__concha-lado"></div></div>
</div>`;
}

/* 01 e 02 levam os dois passos na mesma célula; só um está ativo (o outro fica inerte e invisível) */
function cartaoDois(k: string, ativo: 'correio' | 'passe', o: Op): string {
  const c = passoCorreio(k + (ativo === 'correio' ? '' : '-c'), ativo === 'correio' ? o : { correio: CORREIO, geral: o.geral });
  const p = passoPasse(k + (ativo === 'passe' ? '' : '-p'), ativo === 'passe' ? o : { geral: o.geral });
  const marcar = (html: string, sim: boolean) => (sim ? html : html.replace('class="rede__passo ', 'inert class="rede__passo ').replace(/ id="rede-titulo-[^"]*"/, ''));
  return `<div class="rede__passos">${marcar(c, ativo === 'correio')}${marcar(p, ativo === 'passe')}</div>`;
}

export const correio = (k: string, o: Op = {}) => moldura(k, 'correio', cartaoDois(k, 'correio', o), o);
export const passe = (k: string, o: Op = {}) => moldura(k, 'passe', cartaoDois(k, 'passe', o), o);

export const empresa = (k: string, geral = false) => moldura(k, 'empresa', `
  <div class="rede__passo">
    <h1 class="rede__titulo" id="rede-titulo-${k}">A conta da empresa</h1>
    <p class="rede__sub">Este endereço entra pela página da tua empresa.</p>
    <div class="rede__conta">${L(mail)}<span class="rede__conta-correio">ana.costa@grupo-exemplo.pt</span><button type="button" class="rede__mudar" data-ir="entrada">${L(pencil)}Mudar</button></div>
    <p class="rede__nota rede__nota--caixa">${L(building)}<span>A palavra-passe e o segundo fator são os da empresa. ${geral ? 'No fim voltas aqui, já com a sessão aberta, para escolheres a empresa e a aplicação.' : 'No fim voltas ao ROMAFE ERP, já com a sessão aberta.'}</span></p>
    <form class="rede__form" novalidate>${botao('Continuar na página da empresa', externalLink, { ir: geral ? 'escolher-empresa' : 'compras', rede: 'empresa', depois: true })}</form>
  </div>`, { rede: 'foco', geral });

export const ajuda = (k: string, geral = false) => moldura(k, 'ajuda', `
  <div class="rede__passo">
    <h1 class="rede__titulo" id="rede-titulo-${k}">Precisa de ajuda?</h1>
    <p class="rede__sub">Os casos mais comuns para ${geral ? 'entrar' : 'entrar no ERP'}.</p>
    <ul class="rede__casos">
      <li>${L(keyRound)}<div><p>Esqueci-me da palavra-passe</p><span>No passo da palavra-passe, «Esqueceste-te?»: recebes um correio para a mudar.</span></div></li>
      <li>${L(userX)}<div><p>Não tenho conta, ou está bloqueada</p><span>${geral ? 'As contas' : 'As contas do ERP'} são criadas pelo administrador da tua empresa. Fala com ele.</span></div></li>
      <li>${L(building)}<div><p>Entro com a conta da empresa</p><span>Escreve o endereço da empresa no primeiro passo: seguimos para a página dela.</span></div></li>
    </ul>
    ${botao('Voltar a entrar', arrowLeft, { ir: 'entrada', tipo: 'button' })}
  </div>`, { rede: 'neutro', geral });

/** A v10 de cada um dos quatro ecrãs de entrar. */
export const REDE_ENTRAR: Record<'entrada' | 'palavra-passe' | 'federado' | 'ajuda', string> = {
  entrada: correio('01', { correio: CORREIO, rede: 'valido' }),
  'palavra-passe': passe('02'),
  federado: empresa('03'),
  ajuda: ajuda('04'),
};

export type IdEstadoRede =
  | 'rede-vazio' | 'rede-invalido' | 'rede-a-continuar' | 'rede-sessao'
  | 'rede-recusa' | 'rede-maiusculas' | 'rede-a-entrar' | 'rede-fator' | 'rede-tentativas' | 'rede-sem-rede' | 'rede-servico';

/** Os estados da v10. Só existem nesta versão: cada um tem uma versão só, com o mesmo nome. */
export function estadosRede(): EcraErp[] {
  const e = (id: IdEstadoRede, de: 'entrada' | 'palavra-passe', nome: string, objetivo: string, html: string): EcraErp =>
    ({ id, nome, fluxo: 'Entrar', estadoDe: de, objetivo, versoes: [{ id: VERSAO_REDE, nota: NOTA_REDE, html }] });
  return [
    e('rede-vazio', 'entrada', '01.1 · Sem dados', 'Antes de escrever: o campo vazio com um exemplo, «Continuar» apagado. A rede está neutra, a rodar devagar.',
      correio('01-1', { rede: 'neutro' })),
    e('rede-invalido', 'entrada', '01.2 · Endereço incompleto', 'O correio não tem a forma de um endereço: o erro diz o que falta, no próprio campo, e «Continuar» fica apagado. Não se diz se a conta existe.',
      correio('01-2', { correio: 'rui.matos@romafe', erroCorreio: 'Falta o fim do endereço, por exemplo «@romafe.pt».', rede: 'foco' })),
    e('rede-a-continuar', 'entrada', '01.3 · A continuar', 'Depois de «Continuar»: o botão mostra a espera e a rede aperta-se e abranda enquanto o servidor decide o caminho (palavra-passe ou página da empresa).',
      correio('01-3', { correio: CORREIO, ocupado: true, rede: 'pedido' })),
    e('rede-sessao', 'entrada', '01.4 · Sessão expirada', 'A sessão terminou por inatividade: o aviso por cima e o correio já escrito; ao entrar, volta-se à página onde se estava.',
      correio('01-4', { correio: CORREIO, rede: 'valido', aviso: [clock, 'A sessão terminou', 'Por segurança, a sessão fecha-se ao fim de algum tempo sem uso. Entra outra vez para continuares onde estavas.', 'info'] })),
    e('rede-recusa', 'palavra-passe', '02.1 · Dados incorretos', 'O servidor recusou: a mesma mensagem esteja errado o correio ou a palavra-passe (não se confirma que a conta existe). A palavra-passe limpa-se, o correio fica, e a rede volta ao neutro, sem abanar nem pintar de vermelho.',
      passe('02-1', { erroPasse: 'O correio ou a palavra-passe não estão certos. Confirma e tenta outra vez.', rede: 'neutro' })),
    e('rede-maiusculas', 'palavra-passe', '02.2 · Maiúsculas ligadas', 'Enquanto se escreve com as maiúsculas ligadas, um aviso por baixo do campo (o navegador diz se estão ligadas).',
      passe('02-2', { passeEscrita: true, maiusculas: true })),
    e('rede-a-entrar', 'palavra-passe', '02.3 · A entrar', 'À espera da confirmação do servidor: o botão mostra a espera e a rede concentra-se. Só depois da resposta se mostra que se entrou.',
      passe('02-3', { passeEscrita: true, ocupado: true, rede: 'pedido' })),
    e('rede-fator', 'palavra-passe', '02.4 · Segundo fator', 'Só se o Keycloak tiver o segundo fator ligado para a conta: o código da aplicação de autenticação, no mesmo cartão. Não se mostram métodos que não existam.',
      passe('02-4', { fator: true, rede: 'pedido' })),
    e('rede-tentativas', 'palavra-passe', '02.5 · Demasiadas tentativas', 'O servidor travou as tentativas: o aviso diz para esperar e o campo e o botão ficam desligados. Não se diz quantas tentativas faltam.',
      passe('02-5', { bloqueado: true, rede: 'neutro', aviso: [clock, 'Demasiadas tentativas', 'Por segurança, espera alguns minutos antes de tentares outra vez, ou pede ajuda ao administrador.', 'erro'] })),
    e('rede-sem-rede', 'palavra-passe', '02.6 · Sem ligação', 'O pedido não saiu do computador: o que se escreveu fica, e «Tentar outra vez» repete-o quando a ligação voltar.',
      passe('02-6', { passeEscrita: true, repetir: true, rede: 'neutro', aviso: [wifiOff, 'Sem ligação à rede', 'Não foi possível contactar o servidor. Verifica a ligação e tenta outra vez.', 'erro'] })),
    e('rede-servico', 'palavra-passe', '02.7 · Serviço indisponível', 'O serviço de início de sessão não respondeu: o aviso diz isso e não culpa quem escreveu; «Tentar outra vez».',
      passe('02-7', { passeEscrita: true, repetir: true, rede: 'neutro', aviso: [serverCrash, 'O início de sessão não está a responder', 'O problema é do nosso lado. Tenta outra vez daqui a pouco.', 'erro'] })),
  ];
}
