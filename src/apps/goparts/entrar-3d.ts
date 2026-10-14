/* =========================================================
   GOPARTS — os quatro ecrãs de entrar (14 out. 2026): «Engineering your access»
   Do briefing dela: os quatro ecrãs são uma só viagem à volta de um rolamento 3D que nunca
   desaparece nem recomeça; cada passo é uma fase da montagem. Ela também: «só quero uma versão
   por screen» — esta é a única (saíram a v1 e a v2).
     01 Entrar        — o anel exterior entra e roda; as esferas giram à volta. Só o correio.
     02 A palavra-passe — o anel interior encaixa e as esferas alinham-se. Ao entrar: completa-se,
                        aparece a marca laranja de alinhamento e a câmara atravessa o centro.
     03 A empresa     — vista explodida com as cotas, a câmara roda ~20°; ao continuar, as peças juntam-se.
     04 Ajuda         — desmontado, as peças suspensas; a opção escolhida traz a sua peça à frente.
   À esquerda (55 %) o palco escuro com o rolamento (um só canvas, que comportamento/entrar-3d.ts
   passa de ecrã para ecrã), as anotações técnicas e os grafismos; à direita (45 %) o formulário,
   liso. Sem vidro, sem brilhos, sem fotografias. O ROMAFE é o de sempre: a letra Motor, azul.
   Não há servidor neste protótipo: «Entrar» leva ao Início como nos outros ecrãs; o erro da
   palavra-passe é o estado 02.1.
   ========================================================= */
import type { EcraGoParts } from './ids';
import type { IdEstadoEntrar } from './ids';
import mail from 'lucide-static/icons/mail.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import headset from 'lucide-static/icons/headset.svg?raw';
import keyRound from 'lucide-static/icons/key-round.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import phone from 'lucide-static/icons/phone.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import externalLink from 'lucide-static/icons/external-link.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const BOTAO = (texto: string, icone: string, extra = '', depois = false) => `<button type="button" class="btn btn--acao ent3__botao"${extra}>${depois ? '' : L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span>${depois ? L(icone, 'btn__icone') : ''}</button>`;
const VOLTAR = (para: string, texto = 'Voltar') => `<button type="button" class="ent3__voltar" data-ir="${para}">${L(arrowLeft)}${texto}</button>`;

type Fase = 'entrada' | 'palavra' | 'empresa' | 'ajuda';
/* as fases da montagem (os quatro passos em baixo); a etiqueta «01 / 04 · Anel exterior» saiu (ela, 14 out.) */
const FASES: Record<Fase, [string, string]> = {
  entrada: ['01', 'Anel exterior'],
  palavra: ['02', 'Anel interior e esferas'],
  empresa: ['03', 'Vista explodida'],
  ajuda: ['04', 'Componentes suspensos'],
};
const COTAS: [string, string][] = [['ext', 'Anel exterior · D 62 mm'], ['int', 'Anel interior · d 30 mm'], ['esf', '9 esferas · Ø 9,525 mm'], ['gai', 'Gaiola']];

function moldura(fase: Fase, corpo: string, k: string): string {
  /* (ela, 14 out.: «aqui preciso de mais azul da Romafe, e isto no header») — a marca vai para o cabeçalho da
     página; o «Voltar», o título e o subtítulo vão para a faixa azul no topo do cartão */
  const m = /^\s*((?:<button type="button" class="ent3__voltar"[\s\S]*?<\/button>\s*)?<h1 class="ent3__titulo">[\s\S]*?<\/h1>\s*<p class="ent3__sub">[\s\S]*?<\/p>)/.exec(corpo);
  const faixa = m ? m[1] : '';
  if (m) corpo = corpo.slice(m[0].length);
  return `<div class="ent3" data-fase="${fase}">
  <section class="ent3__palco" aria-hidden="true">
    <div class="ent3__lugar"></div>
    <svg class="ent3__grafismo" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet"><circle class="ent3__orbita" r="88"/><circle class="ent3__orbita ent3__orbita--fina" r="96"/><path class="ent3__mira" d="M-100 0h18M82 0h18M0 -100v18M0 82v18"/></svg>
    ${fase === 'empresa' ? `<svg class="ent3__cotas">${COTAS.map(([c]) => `<g class="ent3__cota" data-cota="${c}"><line pathLength="1"/><circle r="3"/></g>`).join('')}</svg><div class="ent3__rotulos">${COTAS.map(([c, t]) => `<span class="ent3__rotulo" data-cota="${c}">${t}</span>`).join('')}</div>` : ''}
    <p class="ent3__ficha">SKF 6206 · D 62 · d 30 · B 16 mm</p>
    <ol class="ent3__passos">${(Object.keys(FASES) as Fase[]).map((f) => `<li${f === fase ? ' aria-current="step"' : ''}></li>`).join('')}</ol>
  </section>
  <header class="ent3__topo"><div class="ent3__marca"><span class="romafe">ROMAFE</span><span class="ent3__risco" aria-hidden="true"></span><span class="ent3__produto">GoParts</span></div></header>
  <main class="ent3__lado">
    <div class="ent3__faixa">${faixa}</div>
    <div class="ent3__form" id="ent3-${k}">${corpo}</div>
    <footer class="ent3__rodape"><span>2026 © Romafe SA</span><a href="tel:+351226158300">${L(phone)}+351 226 158 300</a></footer>
  </main>
</div>`;
}

const campo = (id: string, rotulo: string, icone: string, input: string, extra = '', erro = '') =>
  `<div class="ent3__campo${erro ? ' is-erro' : ''}"><label for="${id}">${rotulo}</label><div class="ent3__caixa">${L(icone, 'ent3__campo-icone')}${input}${extra}</div>${erro ? `<p class="ent3__erro" id="${id}-erro">${L(circleAlert)}${erro}</p>` : ''}</div>`;
const conta = `<div class="ent3__conta">${L(mail)}<span>ana.ribeiro@exemplo.pt</span><button type="button" class="ent3__mudar" data-ir="entrada">mudar</button></div>`;

const entrada = (vazio: boolean) => moldura('entrada', `
  <h1 class="ent3__titulo">Bem-vindo ao GoParts</h1>
  <p class="ent3__sub">A sua plataforma de peças auto.</p>
  <div class="ent3__campos">
    ${campo(vazio ? 'e3v-correio' : 'e3-correio', 'Endereço de correio', mail, `<input id="${vazio ? 'e3v-correio' : 'e3-correio'}" type="email" ${vazio ? 'placeholder="o.seu@endereco.pt"' : 'value="ana.ribeiro@exemplo.pt"'} autocomplete="username" inputmode="email">`)}
    ${BOTAO('Continuar', arrowRight, vazio ? ' disabled aria-disabled="true"' : ' data-ir="palavra-passe" data-ent3="continuar"', true)}
  </div>
  <div class="ent3__ligacoes">
    <button type="button" class="ent3__ligacao" data-ir="federado">${L(building)}Entrar com a conta da empresa</button>
    <button type="button" class="ent3__ligacao" data-ir="ajuda">${L(headset)}Precisa de ajuda?</button>
  </div>
  <p class="ent3__vender">${L(store)}Quer vender peças? <a href="#">Abrir loja no GoParts</a></p>`, vazio ? 'entrada-vazio' : 'entrada');

const palavra = (erro: boolean) => moldura('palavra', `
  ${VOLTAR('entrada')}
  <h1 class="ent3__titulo">A palavra-passe</h1>
  <p class="ent3__sub">Só falta a palavra-passe da sua conta.</p>
  ${conta}
  <div class="ent3__campos">
    ${campo(erro ? 'e3x-passe' : 'e3-passe', 'Palavra-passe', lock, `<input id="${erro ? 'e3x-passe' : 'e3-passe'}" type="password" ${erro ? 'value="romafe2024" aria-invalid="true" aria-describedby="e3x-passe-erro"' : 'placeholder="A sua palavra-passe"'} autocomplete="current-password">`, `<button type="button" class="ent3__olho" data-ent3="olho" aria-label="Mostrar a palavra-passe" aria-pressed="false">${L(eye)}</button>`, erro ? 'A palavra-passe não está certa. Confirme as maiúsculas e tente outra vez.' : '')}
    <label class="ent3__manter"><input type="checkbox"> <span>Manter a sessão iniciada<small>Não use em computadores partilhados</small></span></label>
    ${BOTAO('Entrar', logIn, ' data-ir="inicio" data-ent3="entrar"')}
  </div>
  <div class="ent3__ligacoes"><button type="button" class="ent3__ligacao" data-ir="ajuda">${L(keyRound)}Esqueceu-se da palavra-passe?</button></div>`, erro ? 'palavra-passe-erro' : 'palavra-passe');

const empresa = moldura('empresa', `
  ${VOLTAR('entrada')}
  <h1 class="ent3__titulo">Início de sessão da empresa</h1>
  <p class="ent3__sub">A sua empresa tem a sua própria página de início de sessão.</p>
  ${conta}
  <p class="ent3__nota">${L(building)}<span>Este endereço pertence a uma empresa com início de sessão próprio. Vai continuar na página da empresa e volta ao GoParts no fim.</span></p>
  <div class="ent3__campos">${BOTAO('Continuar na página da empresa', externalLink, ' data-ir="inicio" data-ent3="empresa"')}</div>
  <div class="ent3__ligacoes"><button type="button" class="ent3__ligacao" data-ir="entrada">${L(mail)}Não é a sua empresa? Usar outro endereço</button></div>`, 'federado');

/* as opções de ajuda: cada uma traz a sua peça à frente (data-peca) */
const ajuda = moldura('ajuda', `
  ${VOLTAR('entrada', 'Voltar a entrar')}
  <h1 class="ent3__titulo">Precisa de ajuda?</h1>
  <p class="ent3__sub">Estamos aqui para ajudar.</p>
  <ul class="ent3__ajudas">
    <li tabindex="0" data-peca="int">${L(keyRound)}<div><p>Esqueci-me da palavra-passe</p><span>Em «A palavra-passe», escolha «Esqueceu-se da palavra-passe?» e siga o correio que recebe.</span></div></li>
    <li tabindex="0" data-peca="ext">${L(userPlus)}<div><p>Ainda não tenho conta</p><span>Peça-a ao apoio da Romafe, ou abra loja no GoParts para vender.</span></div></li>
    <li tabindex="0" data-peca="gai">${L(building)}<div><p>Entro com a conta da empresa</p><span>Escreva o endereço da empresa: seguimos para a página dela.</span></div></li>
    <li tabindex="0" data-peca="esf">${L(headset)}<div><p>Falar com o apoio</p><span>Dias úteis, das 9h às 18h.</span><a class="ent3__telefone" href="tel:+351226158300">${L(phone)}+351 226 158 300</a></div></li>
  </ul>
  ${BOTAO('Voltar a entrar', arrowLeft, ' data-ir="entrada"')}`, 'ajuda');

export function ecrasEntrar(): EcraGoParts[] {
  const NOTA = 'A única (14 out.): os quatro ecrãs à volta de um rolamento 3D que nunca recomeça — o anel exterior (01), o interior e as esferas (02), a vista explodida (03), as peças suspensas (04); à esquerda o palco, à direita o formulário';
  const v = (html: string) => [{ id: 'v3', nota: NOTA, html }] as EcraGoParts['versoes'];
  const estado = (id: IdEstadoEntrar, de: EcraGoParts['id'], nome: string, objetivo: string, html: string): EcraGoParts => ({ id, nome, fluxo: 'Entrar', estadoDe: de, objetivo, versoes: v(html) });
  return [
    { id: 'entrada', nome: '01 · Entrar', fluxo: 'Entrar', objetivo: 'O primeiro passo: só o endereço de correio. O anel exterior do rolamento entra e roda, as esferas giram à volta; com o campo em foco, abranda; «Continuar» trava o anel e passa à palavra-passe.', versoes: v(entrada(false)) },
    estado('entrada-vazio', 'entrada', '01.1 · Sem dados', 'O primeiro passo antes de escrever: o campo vazio com um exemplo, «Continuar» apagado até haver um endereço.', entrada(true)),
    { id: 'palavra-passe', nome: '02 · A palavra-passe', fluxo: 'Entrar', objetivo: 'A conta é nossa: a palavra-passe. O anel interior encaixa e as esferas alinham-se; «Entrar» completa o rolamento, acende a marca laranja e a câmara atravessa-o até ao Início.', versoes: v(palavra(false)) },
    estado('palavra-passe-erro', 'palavra-passe', '02.1 · Palavra-passe errada', 'A resposta do servidor foi «palavra-passe errada»: o aviso no próprio campo e o anel interior a resistir, sem abanar o ecrã nem bloquear nada.', palavra(true)),
    { id: 'federado', nome: '03 · O início de sessão da empresa', fluxo: 'Entrar', objetivo: 'A conta é de uma empresa com página de início de sessão própria: a vista explodida com as cotas; ao continuar, as peças juntam-se e segue-se para a página da empresa.', versoes: v(empresa) },
    { id: 'ajuda', nome: '04 · Precisa de ajuda?', fluxo: 'Entrar', objetivo: 'Os casos mais comuns e o apoio da Romafe; as peças ficam suspensas e a opção escolhida traz a sua à frente. O botão volta a entrar.', versoes: v(ajuda) },
  ];
}
