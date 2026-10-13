/* =========================================================
   GOPARTS — os quatro ecrãs de entrar no estilo do Início v2.2 (12 out. 2026)
   Ela não gostou da «Família Romafe» e pediu um login novo com a cara do
   ecrã 10 — e «imagens como tinha». À esquerda, a fotografia da oficina com
   o bloco de motor (a do login atual do GoParts), nítida, sem véus, cortada
   em diagonal como o herói da v2.2, com os números da Romafe numa caixa
   clara por cima. À direita, o cartão azul da Romafe dos cartões do carrossel,
   com os campos escuros, o botão laranja e os ícones do Lucide. O cartão fica
   no mesmo sítio nos quatro ecrãs; muda só o que tem dentro.
   Depois, ela: «continuo a não gostar, quero login no meio» — a fotografia passou
   ao fundo todo, nítida, e o cartão ao centro; os números numa faixa clara por
   baixo dele. É a única versão destes ecrãs no GoParts.
   ========================================================= */
import type { EcraGoParts } from './ids';
import mail from 'lucide-static/icons/mail.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import shield from 'lucide-static/icons/shield-check.svg?raw';
import headset from 'lucide-static/icons/headset.svg?raw';
import keyRound from 'lucide-static/icons/key-round.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import phone from 'lucide-static/icons/phone.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import disc from 'lucide-static/icons/disc-3.svg?raw';
import smartphone from 'lucide-static/icons/smartphone.svg?raw';
import globe from 'lucide-static/icons/globe.svg?raw';
import fachada from '../../comum/img/fachada.webp';
import corredor from '../../comum/img/corredor.webp';
import separacao from '../../comum/img/separacao.webp';
import oficina from '../../comum/img/oficina.webp';

/** Um ícone do Lucide, limpo do comentário da licença e com a classe que se pedir. */
const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const BOTAO = (texto: string, icone: string, tipo = 'btn--acao', extra = '') => `<button type="button" class="btn ${tipo}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

/** A moldura: a barra de cima, a fotografia com os números, e o cartão azul com o conteúdo do ecrã. */
function moldura(titulo: string, sub: string, corpo: string, rodapeCartao = '', _passo = 0): string {
  return `<div class="portal portal--v22 portal--noite login22">
  <header class="login22__topo">
    <div class="portal__marca">
      <span class="romafe portal__romafe">ROMAFE</span>
      <span class="portal__risco" aria-hidden="true"></span>
      <span class="portal__produto">GoParts<span class="portal__produto-sub">O marketplace de peças auto</span></span>
    </div>
    <button type="button" class="login22__idioma">${L(globe)}Português</button>
  </header>
  <main class="login22__palco">
    <div class="login22__imagem" role="img" aria-label="Bloco de motor numa bancada de oficina"></div>
    <section class="login22__centro">
      <div class="c22__cartao c22__cartao--azul login22__cartao">
        <p class="login22__boas"><span class="login22__titulo">${titulo}</span><span class="login22__sub">${sub}</span></p>
        ${corpo}
      </div>
      ${rodapeCartao}
      <ul class="login22__factos" aria-label="A Romafe">
        <li class="login22__facto login22__facto--numero"><strong class="login22__numero">75 000</strong><span>referências auto</span></li>
        <li class="login22__facto">${L(disc)}Distribuidor SKF desde 1975</li>
        <li class="login22__facto">${L(shield)}ISO 9001 desde 2006</li>
        <li class="login22__facto">${L(truck)}Expedição do Porto e de Sacavém</li>
      </ul>
    </section>
  </main>
  <footer class="login22__rodape">
    <span>2026 © Romafe SA</span><a href="#">Aviso legal e política de cookies</a><a href="#">Condições de venda</a><span>${L(phone)}+351 226 158 300</span>
  </footer>
</div>`;
}

/* ---------- v2 (13 out.): «melhora a página de login» — na linguagem da abertura e da página pública ----------
   O cartão continua ao meio e no azul da Romafe (os dois foram pedidos dela). À volta: o azul-noite da
   página pública, duas colunas de fotografias da Romafe que deslizam devagar em sentidos opostos (o
   armazém a mexer, sem tapar o cartão), o passo em que se está (1 de 2, 2 de 2) com a barra a encher,
   «Voltar à página» para a página pública, e os números em texto claro direto no fundo liso. */
const FOTOS = [fachada, corredor, separacao, oficina];
const coluna = (lado: string, ordem: number[]) => `<div class="login23__coluna login23__coluna--${lado}" aria-hidden="true"><div>${[...ordem, ...ordem].map((i) => `<img src="${FOTOS[i]}" alt="">`).join('')}</div></div>`;
function moldura2(titulo: string, sub: string, corpo: string, rodapeCartao = '', passo = 0): string {
  return `<div class="portal portal--v22 portal--noite login22 login23">
  <header class="login22__topo">
    <a class="portal__marca" href="#" data-ir="publico" data-sem-seta aria-label="Romafe GoParts: a página pública">
      <span class="romafe portal__romafe">ROMAFE</span>
      <span class="portal__risco" aria-hidden="true"></span>
      <span class="portal__produto">GoParts<span class="portal__produto-sub">O marketplace de peças auto</span></span>
    </a>
    <div class="login23__topo-dir"><button type="button" class="login23__voltar" data-ir="publico" data-sem-seta>${L(arrowLeft)}Voltar<span class="login23__mais"> à página</span></button><button type="button" class="login22__idioma">${L(globe)}Português</button></div>
  </header>
  <main class="login22__palco login23__palco">
    ${coluna('esq', [0, 2, 1, 3])}${coluna('dir', [1, 3, 0, 2])}
    <section class="login22__centro">
      <div class="c22__cartao c22__cartao--azul login22__cartao">
        ${passo ? `<p class="login23__passo" style="--passo:${passo}"><span>Passo ${passo} de 2</span><i aria-hidden="true"><b></b></i></p>` : ''}
        <p class="login22__boas"><span class="login22__titulo">${titulo}</span><span class="login22__sub">${sub}</span></p>
        ${corpo}
      </div>
      ${rodapeCartao}
      <ul class="login23__factos" aria-label="A Romafe">
        <li><strong>75 000</strong>referências auto</li>
        <li>${L(disc)}Distribuidor SKF desde 1975</li>
        <li>${L(shield)}ISO 9001 desde 2006</li>
        <li>${L(truck)}Expedição do Porto e de Sacavém</li>
      </ul>
    </section>
  </main>
  <footer class="login22__rodape">
    <span>2026 © Romafe SA</span><a href="#">Aviso legal e política de cookies</a><a href="#">Condições de venda</a><span>${L(phone)}+351 226 158 300</span>
  </footer>
</div>`;
}

const campo = (id: string, rotulo: string, icone: string, input: string, extra = '') =>
  `<div class="campo login22__campo"><label class="campo__label" for="l22-${id}">${rotulo}</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(icone)}</span>${input}${extra}</div></div>`;
const conta = (mudar = 'entrada') => `<div class="login22__conta">${L(mail)}<span>ana.ribeiro@exemplo.pt</span><button type="button" class="login22__mudar" data-ir="${mudar}">mudar</button></div>`;
const cabeca = (icone: string, titulo: string, sub: string) => `<div class="login22__cabeca"><span class="c22__marca login22__icone" aria-hidden="true">${L(icone)}</span><div><h2 class="login22__cartao-titulo">${titulo}</h2><p class="login22__cartao-sub">${sub}</p></div></div>`;
const vender = `<p class="login22__vender">${L(store)}<span>Quer vender peças? <a href="#">Abrir loja no GoParts</a></span></p>`;

const entrada = (m: typeof moldura2 = moldura) => m('Bem-vindo ao GoParts', 'Entre com o endereço de correio da sua conta.',
  `${cabeca(logIn, 'Entrar', 'Comece pelo seu endereço de correio.')}
   <div class="login22__form">
     ${campo('correio', 'Endereço de correio', mail, '<input class="input" id="l22-correio" type="email" value="ana.ribeiro@exemplo.pt" autocomplete="username">')}
     ${BOTAO('Continuar', arrowRight, 'btn--acao login22__botao', ' data-ir="palavra-passe"')}
   </div>
   <div class="login22__opcoes">
     <button type="button" class="login22__ligacao" data-ir="federado">${L(building)}Entrar com a conta da empresa</button>
     <button type="button" class="login22__ligacao" data-ir="ajuda">${L(headset)}Precisa de ajuda?</button>
   </div>`, vender, 1);

const palavraPasse = (m: typeof moldura2 = moldura) => m('Bem-vindo de volta', 'Só falta a palavra-passe.',
  `${cabeca(lock, 'A palavra-passe', 'A da sua conta GoParts.')}
   ${conta()}
   <div class="login22__form">
     ${campo('passe', 'Palavra-passe', lock, '<input class="input" id="l22-passe" type="password" placeholder="A sua palavra-passe" autocomplete="current-password">', `<button type="button" class="login22__olho" aria-label="Mostrar palavra-passe">${L(eye)}</button>`)}
     <label class="login22__manter"><input type="checkbox"> <span>Manter sessão iniciada<small>Não usar em computadores partilhados</small></span></label>
     ${BOTAO('Entrar', logIn, 'btn--acao login22__botao', ' data-ir="inicio"')}
   </div>
   <div class="login22__opcoes"><button type="button" class="login22__ligacao" data-ir="ajuda">${L(keyRound)}Esqueceu-se da palavra-passe?</button></div>`, vender, 2);

const federado = (m: typeof moldura2 = moldura) => m('Conta da empresa', 'A sua empresa entra pela página dela.',
  `${cabeca(building, 'Exemplo, Lda.', 'Entra pela página do fornecedor da empresa (o Entra ID dela).')}
   ${conta()}
   <div class="login22__form">
     ${campo('fator', 'Segundo fator', smartphone, '<input class="input" id="l22-fator" inputmode="numeric" placeholder="Código da aplicação">')}
     ${BOTAO('Entrar na Exemplo', logIn, 'btn--acao login22__botao', ' data-ir="inicio"')}
   </div>
   <div class="login22__opcoes"><button type="button" class="login22__ligacao" data-ir="entrada">${L(arrowLeft)}Não é a sua empresa? Usar outro endereço</button></div>`, '', 2);

const ajuda = (m: typeof moldura2 = moldura) => m('Precisa de ajuda?', 'Os casos mais comuns, e o apoio da Romafe.',
  `${cabeca(headset, 'Precisa de ajuda?', 'Escolha o que lhe está a acontecer.')}
   <ul class="login22__ajudas">
     <li>${L(keyRound)}<div><p>Esqueci-me da palavra-passe</p><span>No passo seguinte, «Esqueceu-se da palavra-passe?».</span></div></li>
     <li>${L(userPlus)}<div><p>Ainda não tenho conta</p><span>Peça-a ao apoio, ou abra loja no GoParts para vender.</span></div></li>
     <li>${L(building)}<div><p>Entro com a conta da empresa</p><span>Escreva o endereço: seguimos para a página dela.</span></div></li>
   </ul>
   <a class="login22__apoio" href="tel:+351226158300">${L(phone)}<span>Apoio Romafe</span><strong>+351 226 158 300</strong></a>
   ${BOTAO('Voltar a entrar', arrowLeft, 'btn--acao login22__botao', ' data-ir="entrada"')}`);

export function ecrasEntrar22(): EcraGoParts[] {
  /* 13 out. 2026: fica só a v2 (ela: «escolhe o que achares melhor»); a v1, o cartão azul sobre a
     fotografia da oficina, saiu da lista — a moldura dela continua aqui, por omissão */
  const NOTA2 = 'Melhorada a 13 out. («melhora a página de login»): o mesmo cartão ao meio, no azul-noite da página pública, com as fotografias da Romafe a deslizar dos lados, o passo em que se está e «Voltar à página»';
  const e = (id: 'entrada' | 'palavra-passe' | 'federado' | 'ajuda', nome: string, objetivo: string, fn: (m?: typeof moldura2) => string): EcraGoParts =>
    ({ id, nome, fluxo: 'Entrar', objetivo, versoes: [{ id: 'v2', nota: NOTA2, html: fn(moldura2) }] });
  return [
    e('entrada', '01 · Entrar', 'O primeiro passo: o endereço de correio. Daqui segue-se para a palavra-passe, para a conta da empresa, ou para a ajuda.', entrada),
    e('palavra-passe', '02 · A palavra-passe', 'A conta é nossa: a palavra-passe, manter a sessão, e entrar no Início.', palavraPasse),
    e('federado', '03 · O início de sessão da empresa', 'A conta é de uma empresa com a sua própria página de entrar: segue-se para ela, com o segundo fator.', federado),
    e('ajuda', '04 · Precisa de ajuda?', 'Os três casos mais comuns e o telefone do apoio; o botão volta a entrar.', ajuda),
  ];
}
