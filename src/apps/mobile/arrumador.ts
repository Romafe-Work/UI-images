/* =========================================================
   PICK — o trabalhador da Arrumação (30 out. 2026), do briefing «Trabalhador de Arrumação V1»
   Ela escolheu «fazer, sem a fila»: quem arruma vê só a guia em mãos — o motor entrega uma de cada vez (24 set.) —, e não
   há «As minhas tarefas» nem a barra Tarefas (27 out.). O que o briefing pede e já existia fica como está e reaproveita-se:
   o 80 · Arrumar (palete → artigo → destino → quantidade → confirmar; só o destino da guia aceita) e as exceções do Gestor.
   O que é novo:
     - 85 · A minha arrumação: a guia em mãos, de onde para onde, e «Continuar» (ou «Iniciar») a arrumação;
     - 86 · A guia: os artigos, o que já se arrumou, a origem e o destino; sem preços;
     - «Não consigo arrumar», sempre à mão no 80 (v2) e na guia → 87 · Não consigo arrumar: o motivo, uma nota e uma
       fotografia, se quiser → 88 · Problema comunicado: a guia fica com o Gestor e o motor entrega a seguinte;
     - 79 · Problema comunicado, no Gestor: a guia, o artigo, quem, a origem, o destino recusado, o motivo, a hora e o que já
       está confirmado; muda o destino (só posições ativas, fora das zonas em contagem) ou dá a guia a outra pessoa;
     - a resposta chega ao PDA: 88.2 destino novo (e lê-se outra vez a palete, o artigo e o destino), 88.3 a guia passou
       para outra pessoa, 88.4 cancelada — o que já se arrumou fica sempre confirmado.
   O que se decidiu e muda o briefing: os destinos são posições de 8 algarismos (60 · zona · coluna · prateleira), não
   «A-03-02»; não se marca uma posição como livre nem se inventa um destino — isso é do Gestor; só com rede, e nada fica à
   espera no PDA; os motivos são os do briefing menos «Destino em contagem», que o servidor já deteta sozinho (80.8).
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, esperar, aviso, prog, posicao, h2, L, type Opcoes } from './inventario-v2';
import { GUIAS, arrumar, cenaArrumacao } from './arrumacao';
import { barra } from './navegacao';
import { asMinhasContagens } from './inventario-estados';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import octagon from 'lucide-static/icons/octagon-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import mapPinX from 'lucide-static/icons/map-pin-x.svg?raw';
import mapPinOff from 'lucide-static/icons/map-pin-off.svg?raw';
import scanLine from 'lucide-static/icons/scan-line.svg?raw';
import box from 'lucide-static/icons/box.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import circleEllipsis from 'lucide-static/icons/circle-ellipsis.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import userRoundX from 'lucide-static/icons/user-round-x.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import repeat from 'lucide-static/icons/repeat.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import msg from 'lucide-static/icons/message-square-warning.svg?raw';

/* ---------- os dados: a guia em mãos é a GA-2026-0330 da Inês (a mesma que o Gestor acompanha no 72) ---------- */
const INES = { nome: 'Inês Rocha', iniciais: 'IR' };
const G = GUIAS[1], A1 = G.linhas[0], A2 = G.linhas[1];
const RECUSADA = G.destino, NOVO = '60120402', HORA = '10:42';
const SEGUINTE = GUIAS[0];
const T = (titulo: string, extra: Opcoes = {}): Opcoes => ({ titulo, funcao: 'Arrumação', quem: INES, ...extra });
/* a barra da Arrumação (Início · Ler · Histórico); o Início é esta página */
const barraArr = () => barra('arrumacao', 'inicio');
const percurso = (destino = G.destino, riscado = false) => `<p class="gi-percurso"><span>${L(truck)}${G.origem}</span>${L(arrowRight, 'gi-percurso__seta')}${posicao(destino, `gi-pos--peq${riscado ? ' gi-pos--erro' : ''}`)}</p>`;
/** «Não consigo arrumar»: sempre à mão durante a guia */
export const naoConsigo = (cls = '') => `<button type="button" class="ta-nao${cls ? ` ${cls}` : ''}" data-ir="ta-problema">${L(octagon)}<span>Não consigo arrumar</span></button>`;

/* =========================================================
   85 · A minha arrumação
   ========================================================= */
type E85 = 'normal' | 'nova' | 'sem' | 'seguinte' | 'resolvida' | 'carregar' | 'sem-rede' | 'servidor' | 'sessao';
function inicio(e: E85 = 'normal'): string {
  if (e === 'carregar') return ecra(`<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A carregar a sua guia…</p><div class="gp-esq"><i></i><i></i><i></i></div>`, T('Início', { barra: barraArr() }));
  if (e === 'sem-rede') return ecra(aviso('erro', wifiOff, 'Sem rede', 'A Pick precisa de rede: não mostra uma guia velha como se fosse de agora. Continua sozinha quando houver sinal.'), T('Início', { rede: false, pe: acao('Tentar outra vez', refresh) }));
  if (e === 'servidor') return ecra(aviso('erro', serverOff, 'O servidor não respondeu', 'Não foi possível ler a sua guia. Nada mudou: a palete fica onde está.') + '<p class="gi-ref">Referência <code>PK-3010-B2C4</code></p>', T('Início', { pe: acao('Tentar outra vez', refresh) }));
  if (e === 'sessao') return ecra(aviso('aviso', clock, 'A sessão terminou', 'Entre outra vez: a guia continua sua, no mesmo artigo.'), T('Início', { pe: acao('Entrar outra vez', logIn, ' data-login') }));
  const g = e === 'seguinte' ? SEGUINTE : G;
  const feitas = e === 'nova' || e === 'seguinte' ? 0 : e === 'resolvida' ? 1 : G.feitas;
  const tag = e === 'resolvida' ? ['Destino novo', 'validar'] : feitas ? ['A meio', 'curso'] : ['Nova', 'planeada'];
  const tarefa = e === 'sem' ? `<section class="gi-vazio">${L(inbox)}<p><b>Não tem guias agora.</b> Quando houver mercadoria para arrumar, o sistema entrega-lhe a guia aqui. Não precisa de fazer nada.</p></section>`
    : `<section class="gi-dom gi-tarefa ta-guia${e === 'resolvida' ? ' ta-guia--nova' : ''}" aria-labelledby="ta-t85">
      <p class="gi-tarefa__rot">${L(box)}A minha guia</p>
      <div class="gi-tarefa__cab"><b id="ta-t85">${g.ref}</b><span class="gp-tag gp-tag--${tag[1]}">${tag[0]}</span></div>
      <p class="gi-dom__meta">${g.paletes} ${g.paletes === 1 ? 'palete' : 'paletes'} · ${g.linhas.length} ${g.linhas.length === 1 ? 'artigo' : 'artigos'} · ${g.linhas.reduce((s, l) => s + l.q, 0)} un. · da ${g.ch}</p>
      ${e === 'seguinte' ? `<p class="gi-percurso"><span>${L(truck)}${g.origem}</span>${L(arrowRight, 'gi-percurso__seta')}${posicao(g.destino, 'gi-pos--peq')}</p>` : percurso(e === 'resolvida' ? NOVO : G.destino)}
      ${e === 'resolvida' ? `<p class="ta-mudou">${L(mapPin)}<span>O gestor mudou o destino: a ${RECUSADA} estava cheia.</span></p>` : ''}
      ${prog(feitas, g.linhas.length, 'Artigos arrumados')}
      ${acao(feitas ? 'Continuar a arrumação' : 'Iniciar arrumação', feitas ? play : scanBarcode, ` data-ir="${e === 'resolvida' ? 'arr-op-retomar' : e === 'seguinte' ? 'arr-op-seguinte' : 'arr-op'}"`)}
      ${e === 'seguinte' ? '' : `<button type="button" class="gp-btn gi-btn-sec" data-ir="ta-guia">${L(list)}<span>Ver a guia</span></button>`}
    </section>`;
  const comGestor = e === 'seguinte' ? `<button type="button" class="ta-espera" data-ir="ta-enviado">${L(clock)}<span><b>${G.ref} com o gestor</b><small>Posição cheia · comunicado às ${HORA}. A resposta chega aqui.</small></span>${L(arrowRight)}</button>` : '';
  return ecra(`<div class="gp-ola"><h1>Arrumação</h1><p>A minha guia de arrumação</p></div>${comGestor}${tarefa}${asMinhasContagens([0, 0, 1])}`, T('Início', { barra: barraArr() }));
}

/* =========================================================
   86 · A guia
   ========================================================= */
function guia(): string {
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${G.ref}</h1><span class="gp-tag gp-tag--curso">A meio</span></div>
    <p class="gp-nota">Da ${G.ch} · ${G.paletes} palete no ${G.origem.toLowerCase()} · entregue pelo motor às 10:31</p>
    <section class="gp-sec">${h2('De onde para onde')}${percurso()}</section>
    <section class="gp-sec">${h2('Artigos', G.linhas.length)}<ul class="gi-linhas" role="list">${G.linhas.map((l, i) => `<li class="gi-linha${i < G.feitas ? ' is-feita' : ''}"><div><b>${l.ref}</b><span>${l.desc}</span></div><div class="gi-linha__q"><b>${l.q} un.</b>${i < G.feitas ? `<span class="gp-tag gp-tag--ok">${L(check)}Arrumado</span>` : '<span class="gp-tag gp-tag--planeada">Por arrumar</span>'}</div></li>`).join('')}</ul></section>`,
  T('Guia', { voltar: 'ta-inicio', pe: `${acao('Continuar a arrumação', play, ' data-ir="arr-op"')}${naoConsigo('ta-nao--pe')}` }));
}

/* =========================================================
   87 · Não consigo arrumar
   ========================================================= */
const MOTIVOS: [string, string, string, string][] = [
  ['cheia', mapPinX, 'Posição cheia ou ocupada', 'Não cabe, ou já tem outra mercadoria'],
  ['bloqueada', lock, 'Posição bloqueada', 'Fechada, com fita ou interdita'],
  ['etiqueta', scanLine, 'Etiqueta ilegível', 'A da palete, do artigo ou da posição'],
  ['artigo', pkgX, 'O artigo não corresponde', 'Na palete está outro artigo'],
  ['quantidade', hash, 'Quantidade diferente', 'Há mais ou menos do que a guia diz'],
  ['danificada', box, 'Mercadoria danificada', 'Caixas abertas, molhadas ou partidas'],
  ['sem-posicao', mapPinOff, 'Não encontro a posição', 'A posição não está onde devia'],
  ['outro', circleEllipsis, 'Outro motivo', 'Escreva-o na nota'],
];
type E87 = 'normal' | 'escolhido' | 'a-enviar' | 'sem-rede' | 'mudou';
function problema(e: E87 = 'normal'): string {
  if (e === 'mudou') return ecra(aviso('info', repeat, 'A guia mudou entretanto', `O gestor já tinha mudado a ${G.ref}: o destino agora é a ${NOVO}. O problema não foi enviado — não há nada a comunicar sobre um destino que já não é o seu.`), T('Problema', { voltar: 'arr-op-destino', pe: acao('Ver a guia como está', list, ' data-ir="ta-resolvido"') }));
  const escolhido = e !== 'normal';
  return ecra(`<h1 class="gp-titulo">Não consigo arrumar</h1>
    <p class="ta-onde"><b>${G.ref}</b><span>${A2.ref} · ${A2.q} un.</span>${posicao(RECUSADA, 'gi-pos--peq')}</p>
    ${e === 'sem-rede' ? aviso('erro', wifiOff, 'Sem rede: não foi enviado', 'O gestor ainda não sabe. Nada fica à espera no PDA: quando houver sinal, envie outra vez. A palete fica onde está.') : ''}
    <fieldset class="ta-motivos"><legend>Porquê?</legend>${MOTIVOS.map(([k, ic, t, x], i) => `<label class="ta-motivo" style="--i:${i}"${e === 'normal' && k === 'cheia' ? ' data-ir="ta-problema-escolhido"' : ''}><input type="radio" name="ta-motivo-${e}" value="${k}"${escolhido && k === 'cheia' ? ' checked' : ''}${e === 'a-enviar' ? ' disabled' : ''}><span class="ta-motivo__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span></label>`).join('')}</fieldset>
    <label class="gp-campo"><span>Nota (se ajudar)</span><input${escolhido ? ' value="Tem caixas da Valeo até cima"' : ''} placeholder="Ex.: tem caixas de outro artigo"${e === 'a-enviar' ? ' disabled' : ''}></label>
    <button type="button" class="ta-foto"${e === 'a-enviar' ? ' disabled' : ''}>${L(camera)}<span><b>Tirar fotografia</b><small>Se quiser mostrar ao gestor</small></span></button>
    <p class="gp-nota">O gestor recebe o problema com a guia, o artigo e a posição. Não se marca a posição como livre nem se escolhe outro destino daqui.</p>`,
  T('Problema', { voltar: 'arr-op-destino', rede: e !== 'sem-rede', pe: e === 'a-enviar' ? esperar('A enviar ao gestor…') : `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande" data-ir="ta-enviado"${escolhido ? '' : ' disabled aria-disabled="true"'}>${L(send)}<span data-rotulo>${e === 'sem-rede' ? 'Enviar outra vez' : 'Enviar ao gestor'}</span></button>` }));
}

/* =========================================================
   88 · Problema comunicado (e a resposta do Gestor)
   ========================================================= */
type E88 = 'enviado' | 'a-ver' | 'resolvido' | 'reatribuida' | 'cancelada';
function enviado(e: E88 = 'enviado'): string {
  const resumo = `<dl class="ta-resumo"><div><dt>Guia</dt><dd>${G.ref}</dd></div><div><dt>Artigo</dt><dd>${A2.ref} · ${A2.q} un.</dd></div><div><dt>Destino</dt><dd>${RECUSADA}</dd></div><div><dt>Motivo</dt><dd>Posição cheia · «Tem caixas da Valeo até cima»</dd></div><div><dt>Enviado</dt><dd>às ${HORA}</dd></div></dl>`;
  const ja = `<p class="ta-ja">${L(circleCheck)}<span>Os ${A1.q} un. de ${A1.ref} já arrumados na ${RECUSADA} ficam confirmados.</span></p>`;
  if (e === 'resolvido') return ecra(`<section class="gi-aviso gi-aviso--info ta-resposta" role="status"><span class="gi-aviso__ic">${L(mapPin)}</span><h1>O gestor mudou o destino</h1><p>A Ana Ferreira escolheu a <b>${NOVO}</b> para o ${A2.ref}. Leia outra vez a palete, o artigo e o destino: só o destino novo aceita o movimento.</p></section>
    ${percurso(NOVO)}${ja}`, T('Guia', { voltar: 'ta-inicio', pe: acao('Continuar a guia', play, ' data-ir="arr-op-retomar"') }));
  if (e === 'reatribuida') return ecra(`${aviso('aviso', userRoundX, 'A guia passou para outra pessoa', `A Ana Ferreira deu a ${G.ref} ao Tiago Lopes. Daqui já não se continua — o servidor recusaria qualquer leitura desta guia neste PDA.`)}${ja}`, T('Guia', { voltar: 'ta-inicio', pe: acao('Começar a tarefa seguinte', arrowRight, ' data-ir="ta-inicio-seguinte"') }));
  if (e === 'cancelada') return ecra(`${aviso('aviso', ban, 'O gestor cancelou o resto da guia', `O ${A2.ref} já não se arruma por esta guia; a palete fica no ${G.origem.toLowerCase()}.`)}${ja}`, T('Guia', { voltar: 'ta-inicio', pe: acao('Começar a tarefa seguinte', arrowRight, ' data-ir="ta-inicio-seguinte"') }));
  return ecra(`<section class="ta-enviado" role="status">${L(send, 'ta-enviado__ic')}<h1>${e === 'a-ver' ? 'O gestor está a ver' : 'Enviado ao gestor'}</h1><p>${e === 'a-ver' ? `A Ana Ferreira abriu o problema às 10:44. Quando decidir, a resposta chega ao seu PDA.` : `A ${G.ref} fica com o gestor. A palete fica no ${G.origem.toLowerCase()}; não a leve para outro sítio.`}</p></section>
    ${resumo}${ja}`,
  T('Enviado', { voltar: 'ta-inicio', pe: `${acao('Começar a tarefa seguinte', arrowRight, ' data-ir="ta-inicio-seguinte"')}` }));
}

/* =========================================================
   79 · Problema comunicado (Gestor)
   ========================================================= */
function noGestor(e: 'normal' | 'a-gravar' | 'resolvido' = 'normal'): string {
  const GG: Opcoes = { titulo: 'Problema', voltar: 'arr-excecoes', gestor: true, funcao: 'Gestor' };
  if (e === 'resolvido') return ecra(`<section class="gi-movido" role="status">${cenaArrumacao()}<h1>Destino novo enviado à Inês</h1><p>O servidor confirmou: a ${G.ref} volta para a Inês com a ${NOVO}. Ela lê outra vez a palete, o artigo e o destino. Fica no histórico da guia quem mudou, quando e porquê.</p></section>`,
    { ...GG, pe: `${acao('Voltar às exceções', arrowLeft, ' data-ir="arr-excecoes"')}` });
  const D: [string, string, string][] = [[NOVO, 'Ao lado · livre', 'ok'], ['60120501', 'Zona 12 · mesma família', 'ok'], [RECUSADA, 'A comunicada como cheia', 'cheia'], ['60300104', 'Zona 30 · em contagem', 'bloq']];
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${G.ref}</h1><span class="gp-tag gp-tag--erro">Bloqueada</span></div>
    <section class="ta-caso">
      <p class="ta-caso__mot">${L(msg)}<span><b>Posição cheia ou ocupada</b><small>«Tem caixas da Valeo até cima»</small></span></p>
      <dl class="ta-resumo"><div><dt>Quem</dt><dd>${INES.nome} · às ${HORA}</dd></div><div><dt>Artigo</dt><dd>${A2.ref} · ${A2.desc} · ${A2.q} un.</dd></div><div><dt>Origem</dt><dd>${G.origem} · da ${G.ch}</dd></div><div><dt>Recusado</dt><dd>${RECUSADA}</dd></div><div><dt>Já confirmado</dt><dd>${A1.ref} · ${A1.q} un. (1 de 2)</dd></div><div><dt>Fotografia</dt><dd>Sem fotografia</dd></div></dl>
    </section>
    <section class="gp-sec">${h2('Destino novo')}
      <ul class="gp-escolha" role="radiogroup" aria-label="Destino novo">${D.map(([p, t, k], i) => `<li><label class="gp-op gi-dest${k !== 'ok' ? ' is-ocupada' : ''}"><input type="radio" name="ta-dest-${e}"${i === 0 ? ' checked' : ''}${k !== 'ok' || e === 'a-gravar' ? ' disabled' : ''}>${posicao(p, 'gi-pos--peq')}<span><small>${t}</small></span>${k === 'bloq' ? `<em class="is-nao">${L(lock)}Em contagem</em>` : k === 'cheia' ? '<em class="is-nao">Comunicada</em>' : ''}</label></li>`).join('')}</ul></section>`,
  { ...GG, pe: e === 'a-gravar' ? esperar('A enviar à Inês…') : `${acao('Enviar o destino novo à Inês', mapPin, ' data-ir="arr-problema-resolvido"')}${sec('Dar a guia a outra pessoa', repeat, ' data-ir="arr-guia"')}` });
}
/** 73 v2: o problema que a Inês comunicou aparece primeiro, com quem e a hora */
function excecoesV2(): string {
  const xs: [string, string, string, string, string][] = [
    [msg, 'Posição cheia · comunicado', `${G.ref} → ${RECUSADA} · ${INES.nome} às ${HORA}`, 'Resolver', 'arr-problema'],
    [lock, 'Destino em contagem', 'GA-2026-0329 → 60300104 · zona 30 às cegas', 'Mudar o destino', 'arr-guia-bloqueada'],
    [triangle, 'Quantidade diferente', 'GA-2026-0328 · NGK BKR6E · 12 na guia, 10 arrumadas', 'Ver o movimento', 'arr-op-parcial'],
    [serverOff, 'Movimento recusado', 'GA-2026-0326 · o servidor recusou o destino 60100105 (inativa)', 'Rever a guia', 'arr-guia-sem-destino'],
  ];
  return ecra(`<h1 class="gp-titulo">Exceções</h1>
    <ul class="gp-lista" role="list">${xs.map(([ic, t, x, b, ir], i) => `<li style="--i:${i}"><div class="gi-exc"><span class="gi-exc__ic">${L(ic)}</span><div><b>${t}</b><small>${x}</small></div><button type="button" class="gp-btn gp-btn--acao" data-ir="${ir}">${L(arrowRight)}<span>${b}</span></button></div></li>`).join('')}</ul>`,
  { titulo: 'Exceções', voltar: 'arr-inicio', gestor: true, funcao: 'Gestor' });
}

/* =========================================================
   80 v2 · Arrumar com «Não consigo arrumar», e a guia retomada com o destino novo
   ========================================================= */
type E80 = Parameters<typeof arrumar>[0];
const COM_NAO: E80[] = ['origem', 'artigo', 'destino', 'quantidade', 'destino-errado', 'artigo-errado', 'parcial', 'desconhecida', 'recusado', 'sem-leitor'];
const comNao = (html: string) => html.replace(/(<p class="gi-ler-inv">[\s\S]*?<\/p>)/, `$1${naoConsigo()}`);
const arrumarV2 = (e: E80) => comNao(arrumar(e, { quem: INES }));
/* a mesma guia, com o destino que o gestor escolheu: a posição troca-se em todo o lado */
const comDestino = (html: string) => html.split(posicao(RECUSADA, 'gi-pos--peq')).join(posicao(NOVO, 'gi-pos--peq')).split(RECUSADA).join(NOVO).replace(`${RECUSADA.slice(0, 4)}…`, `${NOVO.slice(0, 4)}…`);
const RET: Record<string, string> = { 'arr-op-artigo': 'arr-op-retomar-artigo', 'arr-op-destino': 'arr-op-retomar-destino', 'arr-op-quantidade': 'arr-op-retomar-quantidade', 'arr-op-confirmado': 'arr-op-retomar-ok', 'op-inicio': 'ta-inicio-seguinte' };
const retomar = (e: E80) => {
  const h = comDestino(arrumar(e, { quem: INES }, RET));
  return e === 'origem' ? comNao(h.replace(/(<p class="gi-ler-inv">[\s\S]*?<\/p>)/, `$1<p class="ta-mudou">${L(mapPin)}<span>Destino novo: a ${NOVO}. Leia outra vez a palete.</span></p>`)) : e === 'confirmado' ? h : comNao(h);
};

/* =========================================================
   Os ecrãs
   ========================================================= */
const NOTA = 'Do briefing «Trabalhador de Arrumação V1» (30 out.), sem a fila (ela escolheu): só a guia em mãos, «Não consigo arrumar» sempre à mão, o problema chega ao Gestor (79) e a resposta volta ao PDA; posições de 8 algarismos, só com rede.';
export function ecrasArrumador(): Ecra<string>[] {
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string, fluxo = 'Arrumação'): Ecra<string> => ({ id, nome, fluxo, objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  return [
    e('ta-inicio', '85 · A minha arrumação', 'A página de quem arruma: só a guia em mãos (o motor entrega uma de cada vez), de onde para onde, quantos artigos já se arrumaram e «Continuar a arrumação»; sem fila nem números do armazém.', inicio()),
    e('ta-inicio-nova', '85.1 · Guia nova', 'O motor acabou de entregar a guia: «Iniciar arrumação».', inicio('nova'), 'ta-inicio'),
    e('ta-inicio-vazia', '85.2 · Sem guias', 'Nada para arrumar: a guia aparece aqui quando houver; não se faz nada.', inicio('sem'), 'ta-inicio'),
    e('ta-inicio-seguinte', '85.3 · Com um problema no gestor', 'Depois de comunicar um problema: a guia bloqueada fica com o gestor e o motor entrega a seguinte.', inicio('seguinte'), 'ta-inicio'),
    e('ta-inicio-resolvida', '85.4 · A guia voltou', 'O gestor resolveu: a guia volta com o destino novo, e lê-se tudo outra vez.', inicio('resolvida'), 'ta-inicio'),
    e('ta-inicio-carregar', '85.5 · A carregar', 'A guia a chegar do servidor.', inicio('carregar'), 'ta-inicio'),
    e('ta-inicio-sem-rede', '85.6 · Sem rede', 'A Pick para e não mostra uma guia velha.', inicio('sem-rede'), 'ta-inicio'),
    e('ta-inicio-erro', '85.7 · O servidor não respondeu', 'Não se leu a guia; nada mudou.', inicio('servidor'), 'ta-inicio'),
    e('ta-inicio-sessao', '85.8 · Sessão terminada', 'Entrar outra vez; a guia continua sua.', inicio('sessao'), 'ta-inicio'),
    e('ta-guia', '86 · A guia', 'A guia em mãos: de onde vem, de onde para onde, os artigos e o que já está arrumado; «Continuar» e «Não consigo arrumar». Sem preços.', guia()),
    e('ta-problema', '87 · Não consigo arrumar', 'O motivo (oito, com ícone), uma nota e uma fotografia se quiser; «Enviar ao gestor» só depois de escolher o motivo. Daqui não se liberta a posição nem se escolhe outro destino.', problema()),
    e('ta-problema-escolhido', '87.1 · Motivo escolhido', '«Posição cheia», com a nota: pronto a enviar.', problema('escolhido'), 'ta-problema'),
    e('ta-problema-a-enviar', '87.2 · A enviar', 'Só o botão espera; nada se dá como enviado antes do servidor.', problema('a-enviar'), 'ta-problema'),
    e('ta-problema-sem-rede', '87.3 · Sem rede', 'Não foi enviado, e diz-se; nada fica à espera no PDA.', problema('sem-rede'), 'ta-problema'),
    e('ta-problema-mudou', '87.4 · A guia mudou entretanto', 'O gestor mudou a guia antes de o problema chegar: não se envia, mostra-se a guia como está.', problema('mudou'), 'ta-problema'),
    e('ta-enviado', '88 · Problema comunicado', 'O servidor registou: a guia fica com o gestor, a palete fica no cais, o que já se arrumou fica confirmado, e o motor entrega a tarefa seguinte.', enviado()),
    e('ta-enviado-a-ver', '88.1 · O gestor está a ver', 'O gestor abriu o problema: a resposta chega ao PDA.', enviado('a-ver'), 'ta-enviado'),
    e('ta-resolvido', '88.2 · Destino novo', 'A resposta do gestor: o destino novo; lê-se outra vez a palete, o artigo e o destino.', enviado('resolvido'), 'ta-enviado'),
    e('ta-reatribuida', '88.3 · Passou para outra pessoa', 'O gestor deu a guia a outra pessoa: este PDA já não a continua.', enviado('reatribuida'), 'ta-enviado'),
    e('ta-cancelada', '88.4 · Cancelada', 'O gestor cancelou o resto da guia; o que se arrumou fica.', enviado('cancelada'), 'ta-enviado'),
    e('arr-problema', '79 · Problema comunicado (Gestor)', 'O que a Inês comunicou, ligado à guia: o motivo e a nota, quem e a hora, o artigo, a origem, o destino recusado e o que já está confirmado; o Gestor escolhe um destino novo (só posições ativas, fora das zonas em contagem) ou dá a guia a outra pessoa.', noGestor()),
    e('arr-problema-a-gravar', '79.1 · A enviar', 'O servidor grava a decisão; nada se mostra antes.', noGestor('a-gravar'), 'arr-problema'),
    e('arr-problema-resolvido', '79.2 · Destino novo enviado', 'Confirmado: a guia volta à Inês com o destino novo, com o histórico de quem mudou e porquê.', noGestor('resolvido'), 'arr-problema'),
    e('arr-op-retomar', '80.16 · Retomar com o destino novo', 'A guia voltou: lê-se outra vez a palete; o destino é o novo.', retomar('origem'), 'arr-op'),
    e('arr-op-retomar-artigo', '80.17 · Retomar: o artigo', 'Lê-se outra vez o artigo.', retomar('artigo'), 'arr-op'),
    e('arr-op-retomar-destino', '80.18 · Retomar: o destino novo', 'Só o destino novo aceita.', retomar('destino'), 'arr-op'),
    e('arr-op-retomar-quantidade', '80.19 · Retomar: a quantidade', 'Destino novo certo: quantas se arrumaram.', retomar('quantidade'), 'arr-op'),
    e('arr-op-seguinte', '80.21 · A guia seguinte', 'Com a GA-2026-0330 no gestor, o motor entregou a GA-2026-0331: lê-se a palete no cais 1.', comNao(arrumar('origem', { quem: INES }, {}, 0, 0)), 'arr-op'),
    e('arr-op-retomar-ok', '80.20 · Guia concluída', 'O servidor confirmou: a guia acaba, e o motor entrega a seguinte.', retomar('confirmado'), 'arr-op'),
  ];
}
/** As versões novas dos ecrãs que já existiam: o 80 (e os seus estados) com «Não consigo arrumar», e o 73 com o problema comunicado. */
export function comArrumador<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, () => string> = { 'arr-op': () => arrumarV2('origem'), 'arr-excecoes': excecoesV2 };
  COM_NAO.forEach((k) => { if (k !== 'origem') V[`arr-op-${k}`] = () => arrumarV2(k); });
  return ecras.map((x) => V[x.id] ? { ...x, versoes: [...x.versoes, { id: 'v2', nota: NOTA, html: V[x.id]() }] as Ecra<T>['versoes'] } : x);
}
