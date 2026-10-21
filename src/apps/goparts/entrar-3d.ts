/* =========================================================
   GOPARTS — os quatro ecrãs de entrar (15 out. 2026), a partir de uma imagem dela («quero o ecrã de login do
   goparts do género da imagem»): a página toda escura, partida ao meio por uma linha fina.
     À esquerda — o título grande em maiúsculas, a frase, um traço e as três coisas que o Peça A Peça faz (ícones
                  laranja); por trás, linhas finas em onda e pontos laranja; em baixo, à direita do texto, o
                  rolamento 3D de sempre (um só canvas que comportamento/entrar-3d.ts passa de ecrã para ecrã),
                  que continua a montar-se de passo em passo: o anel exterior (01), o interior e as esferas (02),
                  a vista explodida com as cotas (03), as peças suspensas (04).
     À direita  — o ROMAFE (Motor, azul) com o risco laranja e o Peça A Peça, o «Bem-vindo», a frase, e o formulário
                  liso: campos sublinhados com o asterisco laranja, a ligação laranja à direita, o botão laranja
                  com ícone, e a pergunta final («Quer vender peças? Abrir loja»).
   Fica o fluxo de sempre (primeiro o correio, depois a palavra-passe ou a página da empresa). Uma só versão
   por ecrã (ela, 14 out.): esta substitui a do cartão partido. Claro e escuro (o escuro é o grafite, --g-*).
   Não há servidor neste protótipo: «Entrar» leva ao Início; o erro da palavra-passe é o estado 02.1.
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
import car from 'lucide-static/icons/car.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const BOTAO = (texto: string, icone: string, extra = '', depois = false) => `<button type="button" class="btn btn--acao ent3__botao"${extra}>${depois ? '' : L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span>${depois ? L(icone, 'btn__icone') : ''}</button>`;
const VOLTAR = (para: string, texto = 'Voltar') => `<button type="button" class="ent3__voltar" data-ir="${para}">${L(arrowLeft)}${texto}</button>`;

type Fase = 'entrada' | 'palavra' | 'empresa' | 'ajuda';
const COTAS: [string, string][] = [['ext', 'D 62 mm'], ['int', 'd 30 mm'], ['esf', '9 × Ø 9,525'], ['gai', 'Gaiola']];

/* o fundo: linhas finas em onda e pontos laranja espalhados (como na imagem dela), parados */
const ONDAS = `<svg class="ent3__ondas" aria-hidden="true" viewBox="0 0 1000 1000" preserveAspectRatio="none">
  <path pathLength="1" d="M-20 210 C 220 160, 420 260, 640 200 S 900 120, 1020 150"/>
  <path pathLength="1" class="is-laranja" d="M-20 470 C 180 420, 380 520, 600 470 S 860 400, 1020 430"/>
  <path pathLength="1" d="M-20 760 C 240 720, 420 820, 660 760 S 900 700, 1020 720"/>
</svg>`;
const PONTOS: [number, number][] = [[8, 14], [34, 9], [62, 6], [88, 11], [21, 38], [71, 31], [93, 47], [12, 62], [48, 58], [80, 69], [28, 84], [58, 91], [90, 88]];

function moldura(fase: Fase, corpo: string, k: string): string {
  return `<div class="ent3" data-fase="${fase}">
  <section class="ent3__palco" aria-label="Peça A Peça">
    ${ONDAS}
    <div class="ent3__pontos" aria-hidden="true">${PONTOS.map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join('')}</div>
    <div class="ent3__texto">
      <h2 class="ent3__lema"><span>A peça certa.</span> <span>À primeira.</span> <span>Sem voltas.</span></h2>
      <p class="ent3__frase">A oficina e a Romafe no mesmo sítio: catálogo, pedidos e guias sempre à mão.</p>
      <ul class="ent3__vantagens">
        <li>${L(car)}Peças pela matrícula ou pela referência</li>
        <li>${L(truck)}Pedidos acompanhados até à entrega</li>
        <li>${L(fileText)}Guias e faturas num só sítio</li>
      </ul>
    </div>
    <div class="ent3__peca" aria-hidden="true">
      <div class="ent3__lugar"></div>
      <svg class="ent3__grafismo" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet"><ellipse class="ent3__orbita" rx="96" ry="34"/><circle class="ent3__orbita ent3__orbita--fina" r="92"/></svg>
      ${fase === 'empresa' ? `<svg class="ent3__cotas">${COTAS.map(([c]) => `<g class="ent3__cota" data-cota="${c}"><line pathLength="1"/><circle r="3"/></g>`).join('')}</svg><div class="ent3__rotulos">${COTAS.map(([c, t]) => `<span class="ent3__rotulo" data-cota="${c}">${t}</span>`).join('')}</div>` : ''}
    </div>
    <p class="ent3__ficha" aria-hidden="true">SKF 6206 · D 62 · d 30 · B 16 mm</p>
  </section>
  <main class="ent3__lado">
    <div class="ent3__marca"><span class="romafe">ROMAFE</span><span class="ent3__produto">Peça A Peça</span></div>
    <div class="ent3__form" id="ent3-${k}">${corpo}</div>
    <footer class="ent3__rodape"><span>2026 © Romafe SA</span><a href="tel:+351226158300">${L(phone)}+351 226 158 300</a></footer>
  </main>
</div>`;
}

/* o asterisco laranja dos campos obrigatórios, como na imagem */
const campo = (id: string, rotulo: string, icone: string, input: string, extra = '', erro = '') =>
  `<div class="ent3__campo${erro ? ' is-erro' : ''}"><label for="${id}">${rotulo}<span class="ent3__obrig" aria-hidden="true">*</span></label><div class="ent3__caixa">${L(icone, 'ent3__campo-icone')}${input}${extra}</div>${erro ? `<p class="ent3__erro" id="${id}-erro">${L(circleAlert)}${erro}</p>` : ''}</div>`;
const conta = `<div class="ent3__conta">${L(mail)}<span>ana.ribeiro@exemplo.pt</span><button type="button" class="ent3__mudar" data-ir="entrada">mudar</button></div>`;
const cabeca = (titulo: string, sub: string, nota = '') => `<h1 class="ent3__titulo">${titulo}</h1><p class="ent3__sub">${sub}</p>${nota ? `<p class="ent3__sub2">${nota}</p>` : ''}`;

const entrada = (vazio: boolean) => moldura('entrada', `
  ${cabeca('Bem-vindo', 'Encomende as peças da oficina e acompanhe cada pedido até à entrega.', 'Inicie sessão para continuar de onde ficou.')}
  <div class="ent3__campos">
    ${campo(vazio ? 'e3v-correio' : 'e3-correio', 'Endereço de correio', mail, `<input id="${vazio ? 'e3v-correio' : 'e3-correio'}" type="email" required ${vazio ? 'placeholder="Escreva o seu endereço de correio"' : 'value="ana.ribeiro@exemplo.pt"'} autocomplete="username" inputmode="email">`)}
    <div class="ent3__linha"><button type="button" class="ent3__ligacao" data-ir="federado">${L(building)}Conta da empresa</button><button type="button" class="ent3__ligacao ent3__ligacao--laranja" data-ir="ajuda">Precisa de ajuda?</button></div>
    ${BOTAO('Continuar', arrowRight, vazio ? ' disabled aria-disabled="true"' : ' data-ir="palavra-passe" data-ent3="continuar"', true)}
  </div>
  <p class="ent3__vender">${L(store)}Quer vender peças? <a href="#">Abrir loja no Peça A Peça</a></p>`, vazio ? 'entrada-vazio' : 'entrada');

const palavra = (erro: boolean) => moldura('palavra', `
  ${VOLTAR('entrada')}
  ${cabeca('A palavra-passe', 'Só falta a palavra-passe da sua conta.')}
  ${conta}
  <div class="ent3__campos">
    ${campo(erro ? 'e3x-passe' : 'e3-passe', 'Palavra-passe', lock, `<input id="${erro ? 'e3x-passe' : 'e3-passe'}" type="password" required ${erro ? 'value="romafe2024" aria-invalid="true" aria-describedby="e3x-passe-erro"' : 'placeholder="Escreva a sua palavra-passe"'} autocomplete="current-password">`, `<button type="button" class="ent3__olho" data-ent3="olho" aria-label="Mostrar a palavra-passe" aria-pressed="false">${L(eye)}</button>`, erro ? 'A palavra-passe não está certa. Confirme as maiúsculas e tente outra vez.' : '')}
    <div class="ent3__linha"><label class="ent3__manter"><input type="checkbox"> <span>Manter sessão</span></label><button type="button" class="ent3__ligacao ent3__ligacao--laranja" data-ir="ajuda">Esqueceu-se da palavra-passe?</button></div>
    ${BOTAO('Entrar', logIn, ' data-ir="inicio" data-ent3="entrar"')}
  </div>
  <p class="ent3__vender">Num computador partilhado, não mantenha a sessão.</p>`, erro ? 'palavra-passe-erro' : 'palavra-passe');

const empresa = moldura('empresa', `
  ${VOLTAR('entrada')}
  ${cabeca('A conta da empresa', 'A sua empresa tem a sua própria página de início de sessão.')}
  ${conta}
  <p class="ent3__nota">${L(building)}<span>Este endereço pertence a uma empresa com início de sessão próprio. Vai continuar na página da empresa e volta ao Peça A Peça no fim.</span></p>
  <div class="ent3__campos">${BOTAO('Continuar na página da empresa', externalLink, ' data-ir="inicio" data-ent3="empresa"')}</div>
  <p class="ent3__vender">Não é a sua empresa? <button type="button" class="ent3__ligacao ent3__ligacao--laranja" data-ir="entrada">Usar outro endereço</button></p>`, 'federado');

/* as opções de ajuda: cada uma traz a sua peça à frente (data-peca) */
const ajuda = moldura('ajuda', `
  ${VOLTAR('entrada', 'Voltar a entrar')}
  ${cabeca('Precisa de ajuda?', 'Os casos mais comuns, e o apoio da Romafe.')}
  <ul class="ent3__ajudas">
    <li tabindex="0" data-peca="int">${L(keyRound)}<div><p>Esqueci-me da palavra-passe</p><span>Em «A palavra-passe», escolha «Esqueceu-se da palavra-passe?» e siga o correio que recebe.</span></div></li>
    <li tabindex="0" data-peca="ext">${L(userPlus)}<div><p>Ainda não tenho conta</p><span>Peça-a ao apoio da Romafe, ou abra loja no Peça A Peça para vender.</span></div></li>
    <li tabindex="0" data-peca="gai">${L(building)}<div><p>Entro com a conta da empresa</p><span>Escreva o endereço da empresa: seguimos para a página dela.</span></div></li>
    <li tabindex="0" data-peca="esf">${L(headset)}<div><p>Falar com o apoio</p><span>Dias úteis, das 9h às 18h.</span><a class="ent3__telefone" href="tel:+351226158300">${L(phone)}+351 226 158 300</a></div></li>
  </ul>
  ${BOTAO('Voltar a entrar', arrowLeft, ' data-ir="entrada"')}`, 'ajuda');

export function ecrasEntrar(): EcraGoParts[] {
  const NOTA = 'A única (15 out., da imagem dela): a página escura partida ao meio — à esquerda o título grande, as três vantagens e o rolamento 3D que se monta de ecrã para ecrã; à direita o login liso, campos sublinhados e o botão laranja';
  const v = (html: string) => [{ id: 'v4', nota: NOTA, html }] as EcraGoParts['versoes'];
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
