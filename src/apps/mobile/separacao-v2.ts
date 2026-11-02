/* =========================================================
   Pick · Separação v2 (2 nov., briefing dela): o Tiago responde em qualquer passo a «O que tenho de ler?»,
   «Quanto falta recolher?» e «O que faço se não conseguir avançar?».
   - Início: um cartão só, que muda com a guia (por iniciar · em curso · ajuda pedida · bloqueada · levar aos preparados);
     o prazo dos preparados em destaque e o camião em segundo.
   - Leitura: uma instrução de cada vez, a quantidade pedida com a unidade, a caixa (1 caixa = 10 un.), o resultado de
     cada leitura, «Corrigir última leitura» (só para leituras aceites) e a leitura recusada que não conta.
   - Falta: pedido · recolhido · falta na mesma linha; outra posição primeiro (regra dela, 2 nov.); só sem stock se chama
     o gestor, com a linha associada; continua-se nas outras linhas.
   - Carrinho C-07, «Não consigo ler a etiqueta», «Sem ligação» com o que o sistema confirmou e o que se lê outra vez (sem
     guardar nada no PDA, decisão de 17 set.), a prateleira validada.
   - «Pausar recolha» na tarefa e «Terminar sessão» na conta (as iniciais).
   As regras que a Romafe tem de validar estão em REGRAS; os dois lados de cada uma existem como estado.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, aviso, posicao, L, leitor, prog } from './inventario-v2';
import { barra } from './navegacao';
import { dl, ops, FS, O, GS, PREP, FALTA_OUTRA } from './separacao-expedicao';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import pkgCheck from 'lucide-static/icons/package-check.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import wifi from 'lucide-static/icons/wifi.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import basket from 'lucide-static/icons/shopping-basket.svg?raw';
import circleEllipsis from 'lucide-static/icons/circle-ellipsis.svg?raw';
import phone from 'lucide-static/icons/bell-ring.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import msg from 'lucide-static/icons/message-square.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import pause from 'lucide-static/icons/pause.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import tag from 'lucide-static/icons/tag.svg?raw';
import user from 'lucide-static/icons/user.svg?raw';

/* ---------- os dados de demonstração ---------- */
/* a GS13454212 na versão 2: quatro linhas que dão os casos do briefing (caixa de 10 numa linha de 12, falta de 3 em 8,
   corrigir a última caixa numa linha de 30) */
interface Linha { n: number; pos: string; ref: string; desc: string; q: number; cx?: number }
const LIN: Linha[] = [
  { n: 1, pos: '60100305', ref: 'SKF 6205-2Z', desc: 'Rolamento rígido de esferas', q: 12, cx: 10 },
  { n: 2, pos: '60100802', ref: 'SKF VKMV 6PK1873', desc: 'Correia poli-V', q: 2 },
  { n: 3, pos: '60120401', ref: 'CR 30x47x7', desc: 'Retentor de cambota', q: 8 },
  { n: 4, pos: '60210302', ref: 'NGK BKR6E', desc: 'Vela de ignição', q: 30, cx: 10 },
];
const CARRINHO = 'C-07', PRAZO = '11h15', ERRADA = '60400102';
/** As regras a validar pela Romafe (dados de demonstração; cada lado tem o seu estado). */
export const REGRAS = {
  /** pede-se a etiqueta do carrinho ao começar */
  carrinho: true,
  /** escrever o código à mão quando a etiqueta não se lê (não: só se comunica o problema) */
  leituraManual: true,
  /** uma guia com falta: «parcial» entrega o que há; «aguardar» espera pela decisão do gestor */
  falta: 'parcial' as 'parcial' | 'aguardar',
  /** com uma linha à espera do gestor, pode continuar-se nas outras */
  continuarComAjuda: true,
};

const un = (n: number) => `${n} un.`;
const NOTA2 = '2 nov. (briefing dela): o Início muda com a guia; a leitura por caixa e unidade, corrigir a última leitura, a falta ligada à linha, o carrinho, a etiqueta que não se lê, a rede e a prateleira validada; «Pausar recolha» na tarefa e «Terminar sessão» na conta.';
const conta = 'ts-conta';

/* ---------- peças ---------- */
/* a faixa da guia: referência, linha de quantas, carrinho; «Pausar» e «Chamar» à mão */
const topo = (l: number | string) => `<div class="ta-topo ts2-topo"><p><b>${GS.ref}</b><small>${typeof l === 'number' ? `Linha ${l} de ${LIN.length}` : l} · Carrinho ${CARRINHO}</small></p><span class="ts2-topo__bt"><button type="button" class="ta-chamar" data-ir="ts-sair">${L(pause)}<span>Pausar</span></button><button type="button" class="ta-chamar" data-ir="ts-chamar">${L(phone)}<span>Chamar</span></button></span></div>`;
/* o que se recolhe: a referência e a quantidade com a unidade, a caixa quando há */
const pedido = (l: Linha) => `<section class="ts2-pedido"><p class="ts2-pedido__q">Recolher <b>${un(l.q)}</b></p><p class="ts2-pedido__a"><b>${l.ref}</b> · ${l.desc}</p>${l.cx ? `<p class="ts2-pedido__cx">${L(pkg)}<span>1 caixa = ${un(l.cx)}</span></p>` : ''}</section>`;
/* quanto já está no carrinho desta linha */
const conta2 = (f: number, l: Linha) => `${prog(f, l.q, `Linha ${l.n} · ${l.ref}`)}<p class="ts2-falta">${f >= l.q ? 'Linha completa' : `${f} de ${un(l.q)} · faltam ${l.q - f}`}</p>`;
/* o histórico da linha: cada leitura e cada correção, com a hora */
const hist = (xs: [string, string, string?][]) => `<h2 class="gp-h">Histórico da linha</h2><ol class="ts2-hist">${xs.map(([h, t, k]) => `<li${k ? ` class="is-${k}"` : ''}><time>${h}</time><span>${t}</span></li>`).join('')}</ol>`;
/* a guia linha a linha, com o estado de cada uma */
const linhas = (est: ('feita' | 'falta' | 'atual' | '')[], extra: string[] = []) => `<ol class="ts-paragens ts2-linhas">${LIN.map((l, i) => `<li class="${est[i] ? `is-${est[i]}` : ''}"><span>${est[i] === 'feita' ? L(check) : est[i] === 'falta' ? L(hash) : l.n}</span><code>${l.pos}</code><b>${l.q} × ${l.ref}${extra[i] ? `<small>${extra[i]}</small>` : ''}</b></li>`).join('')}</ol>`;
/* os horários: o prazo dos preparados em destaque, o camião em segundo (só os que existem) */
const horas = () => `<p class="ts2-horas"><span class="ts2-horas__prazo">${L(clock)}Entregar nos preparados até às ${PRAZO}</span><span class="ts2-horas__cam">${L(truck)}${GS.camiao} · partida às ${GS.fecha}</span></p>`;
const B = () => barra('separacao', 'inicio', { so: ['tarefa', 'inicio'] });
const R = (titulo: string, pe: string, voltar = 'ts-inicio-curso') => O(FS, titulo, { voltar, pe, conta });

/* ---------- 110 · o Início: um cartão só, que muda com a guia ---------- */
type EI = 'novo' | 'curso' | 'ajuda' | 'ajuda-envio' | 'resposta' | 'bloqueada' | 'entregar';
function inicio(e: EI): string {
  const cartao = (ir: string, ic: string, t: string, linhas2: string[], tom = '') => `<button type="button" class="ta-trabalho${tom ? ` ts2-cartao--${tom}` : ''}" data-ir="${ir}"><span class="ta-trabalho__ic">${L(ic)}</span><span><b>${t}</b>${linhas2.map((x) => `<small>${x}</small>`).join('')}</span>${L(arrowRight)}</button>`;
  const C: Record<EI, () => [string, string]> = {
    novo: () => [cartao('ts-tarefa', basket, 'Começar a recolher', [`Guia ${GS.ref} · ${LIN.length} linhas`, 'Zona 10']), ''],
    curso: () => [cartao('ts-paragem-3', play, 'Continuar recolha', [`2 de ${LIN.length} linhas recolhidas`, `Leia a posição ${LIN[2].pos}`, `Carrinho ${CARRINHO}`]), ''],
    ajuda: () => [cartao('ts-paragem-4', play, 'Continuar nas restantes linhas', [`3 de ${LIN.length} linhas tratadas`, `Leia a posição ${LIN[3].pos}`]),
      `<p class="ts2-pedido-gestor">${L(phone)}<span><b>Ajuda pedida · linha 3</b><small>Recebida pelo gestor às 10h41 · ainda sem resposta</small></span></p>`],
    'ajuda-envio': () => [cartao('ts-paragem-4', play, 'Continuar nas restantes linhas', [`3 de ${LIN.length} linhas tratadas`, `Leia a posição ${LIN[3].pos}`]),
      `<p class="ts2-pedido-gestor is-envio">${L(wifiOff)}<span><b>O pedido de ajuda não saiu · linha 3</b><small>Sem rede, o gestor não o recebeu. Chame outra vez quando a ligação voltar.</small></span></p>`],
    resposta: () => [cartao('ts-paragem-4', play, 'Continuar nas restantes linhas', [`3 de ${LIN.length} linhas tratadas`, `Leia a posição ${LIN[3].pos}`]),
      `<button type="button" class="ts2-pedido-gestor is-resposta" data-ir="ts-chamado-resposta">${L(msg)}<span><b>Ver resposta do gestor · linha 3</b><small>Respondeu às 10h44</small></span>${L(arrowRight)}</button>`],
    bloqueada: () => [`<section class="ts2-espera" role="status">${L(clock)}<span><b>A aguardar resposta do gestor</b><small>Linha 3 · ${LIN[2].ref}: faltam 3 un. e não há mais stock. A guia não pode seguir sem a decisão dele.</small><small>Pedido recebido às 10h41</small></span></section>`, ''],
    entregar: () => [cartao('ts-prateleira', mapPin, 'Levar aos preparados', [`Prateleira ${PREP}`, `${LIN.length} de ${LIN.length} linhas tratadas · 1 com falta`, `Carrinho ${CARRINHO}`]), ''],
  };
  const [card, mais] = C[e]();
  return ecra(`<div class="gp-ola"><h1>Bom dia, Tiago</h1><p>Turno das 8h às 16h30</p></div>
    <section class="gp-sec"><h2 class="gp-h">Trabalho</h2>${card}${mais}${horas()}</section>
    <section class="gp-sec"><h2 class="gp-h">Operações</h2>${ops(FS.ops)}</section>`,
  O(FS, 'Início', { barra: B(), conta, ...(e === 'bloqueada' ? { pe: `${sec('Ver o pedido', msg, ' data-ir="ts-chamado"')}` } : {}) }));
}
function semRede(e: 'sem' | 'sincronizado'): string {
  if (e === 'sem') return ecra(`${aviso('erro', wifiOff, 'Sem ligação', 'O PDA não está ligado ao servidor desde as 10h52. Não pode começar nem fechar operações até a ligação voltar.')}
    ${dl([['Confirmado no sistema', `Linha 4 · ${LIN[3].ref} · 20 de 30 un. · 10h51`], ['Não chegou', 'a caixa lida às 10h52'], ['No carrinho', '30 un.: a caixa das 10h52 está lá']])}
    <p class="gp-nota">A Pick não guarda nada para enviar depois. Quando a ligação voltar, leia outra vez só a caixa das 10h52: o sistema fica igual ao carrinho.</p>`,
  O(FS, 'Início', { rede: false, conta, pe: acao('Tentar de novo', refresh, ' data-ir="ts-sincronizado"') }));
  return ecra(`<section class="gi-movido" role="status">${L(wifi, 'ta-ok__ic')}<h1>Ligação reposta</h1><p>Às 10h54</p></section>
    ${dl([['Linha 4', `${LIN[3].ref} · 20 de 30 un. no sistema`], ['Leia outra vez', 'a caixa das 10h52, que não chegou'], ['Depois', '30 de 30 · igual ao carrinho']])}`,
  O(FS, 'Início', { conta, pe: acao('Continuar recolha', play, ' data-ir="ts-l4-20"') }));
}

/* ---------- 112 · a guia e o carrinho ---------- */
function guia(): string {
  return ecra(`<h1 class="gp-titulo">A sua guia</h1><p class="gp-nota">${GS.ref} · ${LIN.length} linhas · zona 10</p>${horas()}
    <h2 class="gp-h">As linhas</h2>${linhas([], LIN.map((l) => l.cx ? `1 caixa = ${un(l.cx)}` : ''))}
    <div class="ta-alvo"><small>Prateleira de preparados</small>${posicao(PREP)}</div>`,
  O(FS, 'Guia', { voltar: 'ts-tarefa', conta, pe: acao('Começar a recolher', play, ` data-ir="${REGRAS.carrinho ? 'ts-carrinho' : 'ts-paragem'}"`) }));
}
function carrinho(): string {
  return ecra(`${topo('A começar')}<h1 class="ta-passo-t">Leia a etiqueta do carrinho</h1>
    ${leitor({ titulo: 'Leia o CARRINHO', texto: 'A etiqueta presa à pega', ir: 'ts-paragem', tipo: 'carrinho' })}
    <p class="gp-nota">O carrinho fica ligado à guia: na retoma e na entrega aparece «Carrinho ${CARRINHO}», para reconhecer o que deixou a meio.</p>`,
  R('Recolher', sec('Não consigo ler a etiqueta', keyboard, ' data-ir="ts-escrever"'), 'ts-guia'));
}

/* ---------- 113 · a recolha, linha a linha ---------- */
const PE_POS = `<div class="ta-pe2">${sec('Falta quantidade', hash, ' data-ir="ts-falta"')}${sec('Outro problema', circleEllipsis, ' data-ir="ts-problema"')}</div>${sec('Não consigo ler a etiqueta', keyboard, ' data-ir="ts-escrever"')}`;
function lerPosicao(l: Linha, ir: string, antes = ''): string {
  return ecra(`${topo(l.n)}${antes}<h1 class="ta-passo-t">Leia a posição</h1>${pedido(l)}<div class="ta-alvo"><small>Posição</small>${posicao(l.pos)}</div>
    ${leitor({ titulo: 'Leia a POSIÇÃO', texto: `Deve ser ${l.pos}`, ir, tipo: 'posicao' })}`, R('Recolher', PE_POS));
}
function lerArtigo(l: Linha, f: number, ir: string, cab: string, pe = '', extra = ''): string {
  return ecra(`${topo(l.n)}${cab}<h1 class="ta-passo-t">${l.cx && f ? 'Leia a caixa ou a unidade' : 'Leia o artigo'}</h1>${pedido(l)}${conta2(f, l)}
    ${leitor({ titulo: l.cx ? 'Leia a CAIXA ou a UNIDADE' : 'Leia o ARTIGO', texto: `${l.ref}${l.cx ? ` · caixa = ${un(l.cx)}, unidade = 1` : ''}`, ir, tipo: 'artigo' })}${extra}`,
  R('Recolher', pe || sec('Falta quantidade', hash, ' data-ir="ts-falta"')));
}
const corrigirBt = (cx: number) => `${sec(`Corrigir última leitura · −${cx} un.`, undo, ' data-ir="ts-corrigir"')}`;
function linhaCompleta(l: Linha, seguinte: string, t: string, h: [string, string, string?][]): string {
  return ecra(`${topo(l.n)}<section class="gi-movido" role="status">${L(circleCheck, 'ta-ok__ic')}<h1>Linha ${l.n} completa</h1><p>${l.q} de ${un(l.q)} · ${l.ref}</p></section>${hist(h)}`,
  R('Recolher', acao(t, arrowRight, ` data-ir="${seguinte}"`)));
}

/* falta: pedido · recolhido · falta na mesma linha; primeiro outra posição, o gestor só sem stock */
const faltaLinha = (rec: number, l = LIN[2]) => `<p class="ts2-faltalinha"><span>Pedidas <b>${un(l.q)}</b></span><span>recolhidas <b>${rec}</b></span><span class="is-falta">faltam <b>${l.q - rec}</b></span></p>`;
function falta(e: 'registar' | 'outra' | 'outra-artigo' | 'sem-stock' | 'enviada'): string {
  const l = LIN[2];
  if (e === 'registar') return ecra(`${topo(3)}<h1 class="ta-passo-t">Aqui há 5 das 8</h1>${faltaLinha(5)}<div class="ta-alvo"><small>Posição</small>${posicao(l.pos)}</div>
    <p class="gp-nota">Tire as 5 e leia-as. As 3 que faltam vai buscá-las a outra posição que o PDA indica. A diferença fica registada nesta posição.</p>`,
  R('Falta quantidade', acao('Ir buscar o resto', arrowRight, ' data-confirmar data-ir="ts-falta-outra"')));
  if (e === 'outra') return ecra(`${topo(3)}${faltaLinha(5)}<section class="ta-proposta"><p class="ta-proposta__n">Vá buscar o resto a</p>${posicao(FALTA_OUTRA)}<p class="ta-proposta__pq"><b>Tira</b>3 × ${l.ref} · ${l.desc}</p></section>
    ${leitor({ titulo: 'Leia a POSIÇÃO, depois o ARTIGO', texto: `Deve ser ${FALTA_OUTRA}`, ir: 'ts-falta-outra-artigo', tipo: 'posicao' })}`,
  R('Falta quantidade', sec('Aqui também falta', hash, ' data-ir="ts-falta-sem-stock"')));
  if (e === 'outra-artigo') return ecra(`${topo(3)}${aviso('ok', circleCheck, 'Posição certa', `${FALTA_OUTRA} · bip curto`)}${conta2(5, l)}
    ${leitor({ titulo: 'Leia o ARTIGO', texto: `3 × ${l.ref}`, ir: 'ts-paragem-4', tipo: 'artigo' })}<p class="gp-nota">Com estas 3, a linha fica completa: 5 + 3.</p>`,
  R('Falta quantidade', sec('Aqui também falta', hash, ' data-ir="ts-falta-sem-stock"')));
  if (e === 'sem-stock') return ecra(`${topo(3)}${aviso('erro', pkgX, `Não há mais ${l.ref}`, 'Nenhuma outra posição do armazém tem este artigo.')}${faltaLinha(5)}
    <h2 class="gp-h">O gestor vai saber</h2>${dl([['Guia', GS.ref], ['Linha', `3 de ${LIN.length}`], ['Artigo', `${l.ref} · ${l.desc}`], ['Posições', `${l.pos} e ${FALTA_OUTRA}`]])}
    <p class="gp-nota">Não precisa de escrever nada: o pedido leva a linha.</p>`,
  R('Falta quantidade', acao('Chamar o gestor', phone, ' data-confirmar data-ir="ts-ajuda-enviada"')));
  return ecra(`${topo(3)}<section class="ta-bloq ta-bloq--chamada" role="status">${L(phone, 'ta-bloq__ic')}<h1>Ajuda pedida · linha 3</h1><p>${l.ref} · faltam 3 un.</p></section>
    <ol class="ta-linha-t" aria-label="O pedido"><li class="is-feito"><b>Pedido enviado</b><small>10h41</small></li><li class="is-feito"><b>Pedido recebido</b><small>10h41</small></li><li class="is-atual"><b>Resposta do gestor</b><small>—</small></li></ol>
    <p class="gp-nota">${REGRAS.continuarComAjuda ? 'A linha 3 fica pendente e à vista no resumo. Pode seguir nas outras.' : 'A guia fica parada até ele responder.'}</p>`,
  R('Chamada', REGRAS.continuarComAjuda ? acao('Continuar nas restantes linhas', play, ' data-ir="ts-paragem-4"') : sec('Voltar ao início', arrowLeft, ' data-ir="ts-inicio-bloqueada"')));
}

/* corrigir a última leitura: só as aceites; fica no histórico */
function corrigir(e: 'perguntar' | 'feita'): string {
  const l = LIN[3];
  if (e === 'perguntar') return ecra(`${topo(4)}<h1 class="ta-passo-t">Retirar a última caixa de 10 un.?</h1>${dl([['Última leitura', 'caixa · +10 un. · 10h52'], ['Fica', '10 de 30 un.']])}
    <p class="gp-nota">Tire a caixa do carrinho. A correção fica no histórico da linha, com a hora e o seu nome.</p>`,
  R('Corrigir', `${acao('Retirar a caixa', undo, ' data-confirmar data-ir="ts-corrigida"')}${sec('Manter', arrowLeft, ' data-ir="ts-l4-20"')}`));
  return lerArtigo(l, 10, 'ts-linha4-completa', aviso('info', undo, 'Última leitura retirada', '−10 un. · 20 passou a 10'), '',
    hist([['10h51', 'Caixa · +10 un.'], ['10h52', 'Caixa · +10 un.'], ['10h53', 'Correção · −10 un. · Tiago Lopes', 'corr']]) + '<p class="gp-nota">Faltam 2 caixas: leia-as e a linha fecha.</p>');
}

/* ---------- 114 · o resumo e a entrega ---------- */
function resumo(r: 'parcial' | 'aguardar'): string {
  return ecra(`${topo('Fim da recolha')}<h1 class="ta-passo-t">3 linhas completas · 1 com falta</h1>
    ${linhas(['feita', 'feita', 'falta', 'feita'], ['', '', '5 de 8 · faltam 3 · gestor avisado', ''])}
    ${r === 'parcial' ? '<p class="gp-nota">Regra desta operação: entrega-se o que há. As 3 que faltam ficam com o gestor.</p>' : '<p class="gp-nota">Regra desta operação: com falta, a guia espera pela decisão do gestor antes de ir aos preparados.</p>'}`,
  R('Resumo', r === 'parcial' ? acao('Entregar recolha parcial', mapPin, ' data-ir="ts-prateleira"') : acao('Aguardar decisão do gestor', clock, ' data-ir="ts-inicio-bloqueada"')));
}
function prateleira(e: 'ler' | 'errada'): string {
  const cab = `${topo('Entrega')}<h1 class="ta-passo-t">Leia a prateleira de preparados</h1>`;
  const err = e === 'errada' ? aviso('erro', mapPin, 'Não é esta prateleira', `Leu a <b>${ERRADA}</b>. A esperada é a <b>${PREP}</b>. A guia continua aberta.`) : '';
  return ecra(`${cab}${err}<div class="ta-alvo"><small>Prateleira de preparados</small>${posicao(PREP)}</div>
    ${dl([['Carrinho', CARRINHO], ['A guia', '3 linhas completas · 1 com falta']])}
    ${leitor({ titulo: e === 'errada' ? 'Leia outra vez só a prateleira' : 'Leia a PRATELEIRA onde pousa', texto: `Deve ser ${PREP}`, ir: e === 'errada' ? 'ts-fechada' : 'ts-prateleira-errada', tipo: 'posicao' })}`,
  R('Entregar', sec('Não consigo ler a etiqueta', keyboard, ' data-ir="ts-escrever"')));
}
function fechada(e: 'sistema' | 'pda'): string {
  if (e === 'pda') return ecra(`${aviso('erro', wifiOff, 'Entrega não confirmada', 'A ligação caiu às 11h09, antes de o sistema confirmar a prateleira.')}${dl([['Prateleira', PREP], ['A guia', 'continua aberta'], ['No sistema', 'nada mudou']])}
    <p class="gp-nota">A Pick não guarda a leitura para depois. Fique junto à prateleira: quando a ligação voltar, leia-a outra vez.</p>`, O(FS, 'Entregar', { rede: false, conta, pe: acao('Ler outra vez', refresh, ' data-ir="ts-prateleira"') }));
  return ecra(`<section class="gi-movido" role="status">${L(pkgCheck, 'ta-ok__ic')}<h1>Entrega confirmada no sistema</h1><p>${GS.ref} · 11h09</p></section>
    ${dl([['Deixou', `na ${PREP}`], ['Carrinho', `${CARRINHO} · livre`], ['A guia', '3 linhas completas · 1 com falta (o gestor tem-na)'], ['Camião', `${GS.camiao} · partida às ${GS.fecha}`]])}`,
  O(FS, 'Guia fechada', { conta, pe: acao('Próxima tarefa', arrowRight, ' data-ir="ts-inicio"') }));
}

/* ---------- a etiqueta que não se lê ---------- */
function escrever(e: 'manual' | 'comunicar'): string {
  const l = LIN[0];
  if (e === 'comunicar') return ecra(`${topo(1)}<h1 class="ta-passo-t">Etiqueta ilegível</h1><p class="gp-nota">Nesta operação não se escreve o código à mão. Comunique o problema: a posição já vai preenchida.</p>
    ${dl([['Posição', l.pos], ['Guia', `${GS.ref} · linha 1`], ['Problema', 'Etiqueta ilegível']])}`,
  R('Problema', acao('Comunicar etiqueta danificada', tag, ' data-confirmar data-ir="ts-registado"'), 'ts-paragem'));
  return ecra(`${topo(1)}<h1 class="ta-passo-t">Escreva a POSIÇÃO</h1><p class="gp-nota">Os oito algarismos da etiqueta da prateleira.</p>
    <label class="gp-campo"><span>Código da posição</span><input inputmode="numeric" maxlength="8" value="${l.pos}" autocomplete="off"></label>
    <p class="gp-nota">Valida-se como uma leitura: tem de ser a ${l.pos}. Fica registada como leitura à mão, e o sistema aconselha a renovar a etiqueta.</p>`,
  R('Escrever', `${acao('Confirmar', check, ' data-ir="ts-artigo"')}${sec('Comunicar etiqueta danificada', tag, ' data-ir="ts-etiqueta-comunicar"')}`, 'ts-paragem'));
}

/* ---------- pausar, a conta e terminar sessão ---------- */
function pausar(): string {
  return ecra(`<h1 class="gp-titulo">Pausar recolha</h1><p class="gp-nota">${GS.ref} · 2 de ${LIN.length} linhas recolhidas</p>
    ${dl([['Fica guardado', 'as 2 linhas lidas e as quantidades'], ['O material', `no carrinho ${CARRINHO}`], ['Ao voltar', `«Continuar recolha» abre a linha 3 · ${LIN[2].pos}`]])}
    <p class="gp-nota">Nada se lê outra vez. O prazo dos preparados continua a contar: às ${PRAZO}.</p>`,
  O(FS, 'Pausar', { voltar: 'ts-paragem-3', conta, pe: `${acao('Pausar recolha', pause, ' data-ir="ts-inicio-curso"')}${sec('Continuar a recolher', play, ' data-ir="ts-paragem-3"')}` }));
}
function contaE(e: 'conta' | 'guia' | 'terminada'): string {
  if (e === 'terminada') return ecra(`<section class="gi-movido" role="status">${L(logOut, 'ta-ok__ic')}<h1>Sessão terminada</h1><p>Tiago Lopes · 11h20</p></section>
    ${dl([['A guia', `${GS.ref} · pausada · 2 de ${LIN.length} linhas`], ['O material', `no carrinho ${CARRINHO}`], ['Quem a apanhar', 'continua na linha 3']])}`,
  O(FS, 'Sessão', { pe: acao('Entrar', user, ' data-login') }));
  if (e === 'guia') return ecra(`<h1 class="gp-titulo">Tem a guia ${GS.ref} a meio</h1><p class="gp-nota">2 linhas recolhidas, 2 por recolher.</p>
    ${dl([['O que já tirou', `fica no carrinho ${CARRINHO}`], ['As 2 que faltam', 'voltam ao motor'], ['Quem a apanhar', 'continua na linha 3, sem repetir leituras']])}
    <p class="gp-nota">O gestor vê quem saiu com uma guia aberta.</p>`,
  O(FS, 'Terminar sessão', { voltar: 'ts-conta', pe: `${acao('Terminar sessão', logOut, ' data-ir="ts-sessao-terminada"')}${sec('Continuar a guia', play, ' data-ir="ts-paragem-3"')}` }));
  return ecra(`<section class="ts2-conta"><span class="gp-conta">TL</span><p><b>Tiago Lopes</b><small>Separação · Armazém 60</small></p></section>
    ${dl([['Turno', '8h às 16h30'], ['Em mãos', `${GS.ref} · 2 de ${LIN.length} linhas`], ['Carrinho', CARRINHO]])}`,
  O(FS, 'Conta', { voltar: 'ts-inicio-curso', pe: sec('Terminar sessão', logOut, ' data-ir="ts-conta-guia"') }));
}

/* ---------- as versões e os estados ---------- */
export function comSeparacaoV2<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  /* v2 por cima da v1 nos ecrãs que já existem */
  const V: Record<string, [() => string, string]> = {
    'ts-inicio': [() => inicio('novo'), 'Um cartão só, que muda com a guia; o prazo dos preparados em destaque e o camião em segundo; a conta nas iniciais.'],
    'ts-inicio-sem-rede': [() => semRede('sem'), 'O que o sistema confirmou e o que não chegou; nada fica à espera no PDA.'],
    'ts-guia': [guia, 'As linhas com a quantidade e a caixa, os horários e a prateleira reservada.'],
    'ts-paragem': [() => lerPosicao(LIN[0], 'ts-artigo'), 'Uma instrução de cada vez: «Leia a posição»; a quantidade pedida com a unidade e a caixa.'],
    'ts-artigo': [() => lerArtigo(LIN[0], 0, 'ts-caixa-lida', aviso('ok', circleCheck, 'Posição certa', `${LIN[0].pos} · bip curto`)), 'Posição certa; agora o artigo: a caixa soma 10, a unidade soma 1.'],
    'ts-errada': [() => ecra(`${topo(1)}${aviso('erro', mapPin, 'Não é esta posição', `Leu a 60100306. Devia estar na <b>${LIN[0].pos}</b> · vibração e bip grave.`)}${pedido(LIN[0])}`, R('Recolher', sec('Não consigo ler a etiqueta', keyboard, ' data-ir="ts-escrever"'))), 'Vibração e bip grave; diz-se qual é; a quantidade não mexe.'],
    'ts-falta': [() => falta('registar'), 'Pedidas · recolhidas · faltam, na mesma linha; vai-se buscar o resto a outra posição.'],
    'ts-falta-outra': [() => falta('outra'), 'O resto noutra posição; «Aqui também falta» se não chegar.'],
    'ts-falta-outra-artigo': [() => falta('outra-artigo'), 'A linha fica completa (5 + 3) e segue-se.'],
    'ts-falta-sem-stock': [() => falta('sem-stock'), 'Não há mais: chama-se o gestor com a guia, a linha, o artigo e as posições já associados.'],
    'ts-escrever': [() => escrever('manual'), '«Não consigo ler a etiqueta»: à mão, validada como uma leitura, e registada como manual.'],
    'ts-prateleira': [() => prateleira('ler'), 'Lê-se a prateleira de preparados; o carrinho e o que vai.'],
    'ts-fechada': [() => fechada('sistema'), 'Só fecha com a entrega confirmada no sistema; o Início fica pronto para a próxima tarefa.'],
    'ts-chamado-resposta': [() => ecra(`<section class="gi-aviso gi-aviso--info ta-resposta" role="status"><span class="gi-aviso__ic">${L(msg)}</span><h1>Resposta do gestor · linha 3</h1><p>${LIN[2].ref} · faltam 3 un. · às 10h44</p></section>
      <blockquote class="ta-diz"><small>O que ele diz</small><p>Entregue o que tem. As 3 ficam comigo: entram amanhã.</p></blockquote>
      <ol class="ta-linha-t" aria-label="O pedido"><li class="is-feito"><b>Pedido enviado</b><small>10h41</small></li><li class="is-feito"><b>Pedido recebido</b><small>10h41</small></li><li class="is-feito"><b>Resposta do gestor</b><small>10h44</small></li></ol>`,
    O(FS, 'Chamada', { voltar: 'ts-inicio-resposta', conta, pe: acao('Continuar nas restantes linhas', play, ' data-ir="ts-paragem-4"') })), 'A resposta presa à linha 3; continua-se nas outras.'],
    'ts-sair': [pausar, '«Pausar recolha», da faixa da guia: o que fica guardado e onde se retoma.'],
    'ts-consultar-artigo': [() => ecra(`${leitor({ titulo: 'Leia o artigo, ou escreva a referência', texto: 'Só para ver: não muda nada', tipo: 'consulta' })}<section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${LIN[2].ref}</p><p class="gi-artigo__desc">${LIN[2].desc} · zona 12</p></div></section><h2 class="gp-h">Onde está</h2>${dl([[LIN[2].pos, '5 un.'], [FALTA_OUTRA, '0 un.'], ['Reservado para guias', '8 un.']])}<p class="gp-nota">A sua recolha continua guardada: 2 de ${LIN.length} linhas.</p>`,
      O(FS, 'Consultar artigo', { voltar: 'ts-inicio-curso', conta, pe: sec('Voltar', arrowLeft, ' data-ir="ts-inicio-curso"') })), 'Onde está e quanto está reservado; voltar não perde a recolha.'],
  };
  /* os estados da v1 que a v2 substitui saem da lista (ficam na v1) */
  const FORA = new Set(['ts-ultima', 'ts-ultima-artigo', 'ts-ultima-inc', 'ts-ultima-artigo-inc', 'ts-prateleira-inc', 'ts-fechada-incompleta']);
  const vs = ecras.map((x) => {
    if (FORA.has(x.id)) return { ...x, foraDaLista: true };
    const v = V[x.id];
    return v ? { ...x, objetivo: v[1], versoes: [...x.versoes, { id: `v${x.versoes.length + 1}`, nota: NOTA2, html: v[0]() }] as Ecra<T>['versoes'] } : x;
  });
  const S = (id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<T> => ({ id: id as T, nome, fluxo: 'Separação', objetivo, ...(de ? { estadoDe: de as T } : {}), versoes: [{ id: 'v1', nota: NOTA2, html }] });
  const novos: Ecra<T>[] = [
    S('ts-inicio-curso', '110.4 · Recolha em curso', '«Continuar recolha · 2 de 4 linhas recolhidas» e a próxima posição; abre o passo exato.', inicio('curso'), 'ts-inicio'),
    S('ts-inicio-ajuda', '110.5 · Ajuda pedida', '«Ajuda pedida · linha 3», recebida pelo gestor; continua-se nas outras linhas.', inicio('ajuda'), 'ts-inicio'),
    S('ts-inicio-ajuda-envio', '110.6 · O pedido não saiu', 'Sem rede, o pedido não chegou ao gestor: chama-se outra vez quando a ligação voltar (nada fica à espera no PDA).', inicio('ajuda-envio'), 'ts-inicio'),
    S('ts-inicio-resposta', '110.7 · O gestor respondeu', '«Ver resposta do gestor · linha 3», e continuar.', inicio('resposta'), 'ts-inicio'),
    S('ts-inicio-bloqueada', '110.8 · A aguardar o gestor', 'A guia não pode seguir: o motivo e a hora do pedido.', inicio('bloqueada'), 'ts-inicio'),
    S('ts-inicio-entregar', '110.9 · Levar aos preparados', 'Todas as linhas tratadas: a ação passa a «Levar aos preparados».', inicio('entregar'), 'ts-inicio'),
    S('ts-sincronizado', '110.10 · Ligação reposta', 'O que o sistema confirmou e a leitura a repetir; depois, o sistema bate com o carrinho.', semRede('sincronizado'), 'ts-inicio'),
    S('ts-carrinho', '112.1 · Leia o carrinho', 'O carrinho fica ligado à guia (Carrinho C-07).', carrinho(), 'ts-guia'),
    S('ts-caixa-lida', '113.15 · Caixa lida', '«Caixa lida · +10 un.» e «10 de 12 un. · faltam 2»; pode corrigir-se.', lerArtigo(LIN[0], 10, 'ts-caixa-recusada', aviso('ok', circleCheck, 'Caixa lida · +10 un.', 'Bip curto'), `${corrigirBt(10)}${sec('Falta quantidade', hash, ' data-ir="ts-falta"')}`), 'ts-paragem'),
    S('ts-caixa-recusada', '113.16 · Leitura recusada', '«Faltam 2 un. Esta caixa contém 10.»: não conta e não se corrige.', lerArtigo(LIN[0], 10, 'ts-unidade-lida', aviso('erro', pkgX, 'Faltam 2 un. Esta caixa contém 10.', 'Leitura recusada · bip grave. Continua em 10. Leia unidades.')), 'ts-paragem'),
    S('ts-unidade-lida', '113.17 · Unidade lida', '«+1 un.»: 11 de 12.', lerArtigo(LIN[0], 11, 'ts-linha-completa', aviso('ok', circleCheck, 'Unidade lida · +1 un.', 'Bip curto'), `${sec('Corrigir última leitura · −1 un.', undo, ' data-ir="ts-corrigir"')}`), 'ts-paragem'),
    S('ts-linha-completa', '113.18 · Linha completa', '12 de 12; o histórico; segue para a linha 2.', linhaCompleta(LIN[0], 'ts-paragem-2', `Seguinte: linha 2 · ${LIN[1].pos}`, [['10h31', 'Caixa · +10 un.'], ['10h31', 'Caixa · recusada (faltavam 2)', 'rec'], ['10h32', 'Unidade · +1 un.'], ['10h32', 'Unidade · +1 un.']]), 'ts-paragem'),
    S('ts-paragem-2', '113.19 · Linha 2: leia a posição', 'A linha seguinte, igual.', lerPosicao(LIN[1], 'ts-linha2-completa'), 'ts-paragem'),
    S('ts-linha2-completa', '113.20 · Linha 2 completa', '2 de 4 linhas; voltar ao Início guarda tudo.', linhaCompleta(LIN[1], 'ts-paragem-3', `Seguinte: linha 3 · ${LIN[2].pos}`, [['10h36', 'Artigo · +1 un.'], ['10h36', 'Artigo · +1 un.']]), 'ts-paragem'),
    S('ts-paragem-3', '113.21 · Linha 3: leia a posição', 'Onde «Continuar recolha» retoma, sem repetir leituras.', lerPosicao(LIN[2], 'ts-falta', aviso('info', play, 'Retoma na linha 3', '2 de 4 linhas já recolhidas · nada se lê outra vez')), 'ts-paragem'),
    S('ts-ajuda-enviada', '113.22 · Ajuda pedida · linha 3', 'Enviado · recebido · resposta; a linha fica pendente e segue-se.', falta('enviada'), 'ts-paragem'),
    S('ts-paragem-4', '113.23 · Linha 4: leia a posição', 'A última linha, com a 3 pendente.', lerPosicao(LIN[3], 'ts-l4-20', `<p class="ts2-pedido-gestor">${L(phone)}<span><b>Linha 3 pendente</b><small>Ajuda pedida ao gestor · faltam 3 un.</small></span></p>`), 'ts-paragem'),
    S('ts-l4-20', '113.24 · Duas caixas lidas', '20 de 30 un.; «Corrigir última leitura».', lerArtigo(LIN[3], 20, 'ts-linha4-completa', aviso('ok', circleCheck, 'Caixa lida · +10 un.', 'Bip curto'), `${corrigirBt(10)}${sec('Falta quantidade', hash, ' data-ir="ts-falta"')}`), 'ts-paragem'),
    S('ts-corrigir', '113.25 · Retirar a última leitura?', '«Retirar a última caixa de 10 un.?»; só para leituras aceites.', corrigir('perguntar'), 'ts-paragem'),
    S('ts-corrigida', '113.26 · Leitura corrigida', 'De 20 para 10; a correção no histórico.', corrigir('feita'), 'ts-paragem'),
    S('ts-linha4-completa', '113.27 · Linha 4 completa', '30 de 30; segue para o resumo.', linhaCompleta(LIN[3], REGRAS.falta === 'parcial' ? 'ts-resumo-parcial' : 'ts-resumo-aguardar', 'Ver o resumo', [['10h51', 'Caixa · +10 un.'], ['10h52', 'Caixa · +10 un.'], ['10h53', 'Correção · −10 un.', 'corr'], ['10h54', 'Caixa · +10 un.'], ['10h55', 'Caixa · +10 un.']]), 'ts-paragem'),
    S('ts-leu-artigo', '113.28 · Leu um artigo', '«Leu um artigo. Leia a etiqueta da posição.»; a quantidade não mexe.', ecra(`${topo(4)}${aviso('erro', tag, 'Leu um artigo. Leia a etiqueta da posição.', 'Bip grave · a quantidade não mexe.')}${conta2(10, LIN[3])}<div class="ta-alvo"><small>Posição</small>${posicao(LIN[3].pos)}</div>
      ${leitor({ titulo: 'Leia a POSIÇÃO', texto: `Deve ser ${LIN[3].pos}`, ir: 'ts-corrigida', tipo: 'posicao' })}`, R('Recolher', sec('Não consigo ler a etiqueta', keyboard, ' data-ir="ts-escrever"'))), 'ts-paragem'),
    S('ts-etiqueta-comunicar', '113.29 · Comunicar etiqueta', 'Quando não se pode escrever à mão: comunica-se, com a posição preenchida.', escrever('comunicar'), 'ts-paragem'),
    S('ts-resumo-parcial', '114.2 · Resumo: entregar parcial', '«3 linhas completas · 1 com falta»; a regra deixa entregar o que há.', resumo('parcial'), 'ts-prateleira'),
    S('ts-resumo-aguardar', '114.3 · Resumo: aguardar o gestor', 'A regra manda esperar pela decisão do gestor.', resumo('aguardar'), 'ts-prateleira'),
    S('ts-prateleira-errada', '114.4 · Não é esta prateleira', 'A lida e a esperada; a guia continua aberta e repete-se só este passo.', prateleira('errada'), 'ts-prateleira'),
    S('ts-fechada-pda', '115.2 · Entrega não confirmada', 'A ligação caiu antes da confirmação: a guia continua aberta e lê-se a prateleira outra vez.', fechada('pda'), 'ts-fechada'),
    S('ts-conta', '121 · A sua conta', 'Nas iniciais: quem, o turno, o que tem em mãos; «Terminar sessão».', contaE('conta')),
    S('ts-conta-guia', '121.1 · Terminar com a guia a meio', 'O que fica feito e onde se retoma.', contaE('guia'), 'ts-conta'),
    S('ts-sessao-terminada', '121.2 · Sessão terminada', 'O fim: a guia pausada no carrinho e «Entrar».', contaE('terminada'), 'ts-conta'),
  ];
  const i = vs.findIndex((x) => x.id === 'ts-consultar-posicao');
  return [...vs.slice(0, i + 1), ...novos, ...vs.slice(i + 1)];
}
