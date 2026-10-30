/* =========================================================
   PICK — a Separação e a Expedição, como estão nos documentos (30 out. 2026)
   Ela: «agora faz a app da expedição e separação no figma», depois de «só podem fazer aquilo que deixei nos docs».
   Os documentos: 05-design/07 · O menu da app (30 set.) e os ecrãs 29–54, 63, d1 e d4 do ~/projects/Figma-PDA-Armazem.
   Separação (29): Trabalho «Começar a recolher»; Operações Consultar guia, Consultar artigo, Consultar posição, Chamar o
     gestor; Tarefa · Início · Sair. 30 a tua próxima tarefa (o cartão com o porquê) → 31 a guia paragem a paragem →
     32 lê a posição, depois o artigo → 34 leva à prateleira de preparados → 35 guia fechada. Desvios: 33 falta
     quantidade (regista-se o que se tirou; a guia fica incompleta e mexer no stock é decisão do gestor), 36 o que se
     passa?, 37 escreve a posição, 18 problema registado. Não tem «Corrigir posição».
   Expedição (42): Trabalho «Começar a carregar»; Operações Camiões de hoje, Consultar guia, Chamar o gestor
     (ela, 30 out.: «só vê a tarefa que lhe é atribuída, não vê as próximas» — saiu o Ver a prateleira, que listava as
     guias à espera, e os camiões já não dizem quantas guias têm). 43 a sua tarefa → 45 confere volume a volume na prateleira → 46 leva ao cais →
     47 carregar e fechar a saída (63 pergunta antes de fechar incompleta, e diz-se porquê) → 48 saída fechada. Desvios:
     49 o que se passa?, 50 falta um volume, 51 escreve o cais, 18.
   Com os dados da Pick (ela, 28 out.): guias GS + 8 algarismos, a prateleira de preparados é a posição 60400101; o camião,
   o cais de saída e os volumes são os dos documentos. Os ecrãs partilhados (chamar o gestor, problema registado) voltam ao
   início da função de quem entrou — a regra que o 07 propõe em 8.1. Ninguém atribui nada: o motor dá uma guia de cada vez.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, aviso, posicao, quantidade, L, leitor, type Opcoes } from './inventario-v2';
import { barra } from './navegacao';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import pkgCheck from 'lucide-static/icons/package-check.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import mapPinOff from 'lucide-static/icons/map-pin-off.svg?raw';
import scanLine from 'lucide-static/icons/scan-line.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import basket from 'lucide-static/icons/shopping-basket.svg?raw';
import circleEllipsis from 'lucide-static/icons/circle-ellipsis.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import phone from 'lucide-static/icons/bell-ring.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import msg from 'lucide-static/icons/message-square.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import ruler from 'lucide-static/icons/ruler.svg?raw';

/* ---------- os dados ---------- */
const TIAGO = { nome: 'Tiago Lopes', iniciais: 'TL' }, PAULO = { nome: 'Paulo Reis', iniciais: 'PR' };
const PREP = '60400101';
/* a guia do Tiago: a GS13454212, quatro paragens pela ordem mais curta; o camião DPD fecha às 11h30 */
const GS = { ref: 'GS13454212', cli: 'Auto Reparadora Silva', camiao: 'DPD', fecha: '11h30' };
const PAR: { pos: string; ref: string; desc: string; q: number; lote?: string }[] = [
  { pos: '60100305', ref: 'SKF 6205-2Z', desc: 'Rolamento rígido de esferas', q: 6 },
  { pos: '60100802', ref: 'SKF VKMV 6PK1873', desc: 'Correia poli-V', q: 2 },
  { pos: '60120401', ref: 'CR 30x47x7', desc: 'Retentor de cambota', q: 4 },
  { pos: '60210302', ref: 'NGK BKR6E', desc: 'Vela de ignição', q: 8 },
];
/* a guia do Paulo: a GS13454209 (separada pelo Tiago às 09:40), 3 volumes, no mesmo camião DPD que outras duas */
const GE = { ref: 'GS13454209', cli: 'Pneus e Travões do Minho', vol: 3, cais: 'Cais de saída 2' };
const VOL = ['Caixa 1 · rolamentos', 'Caixa 2 · kits de roda', 'Caixa 3 · velas'];
const NO_CAMIAO: [string, string, number, number][] = [['GS13454207', 'Garagem Central de Braga', 2, 2], [GE.ref, GE.cli, 3, 3], ['GS13454208', 'Auto Peças Viana', 5, 3]];

const dl = (linhas: [string, string][]) => `<dl class="ta-resumo">${linhas.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
const escolhas = (xs: [string, string, string][]) => `<ul class="ta-escolhas" role="list">${xs.map(([ic, t, ir], i) => `<li style="--i:${i}"><button type="button" class="ta-escolha" data-ir="${ir}">${L(ic)}<span>${t}</span>${L(arrowRight)}</button></li>`).join('')}</ul>`;
const ops = (xs: [string, string, string][]) => `<div class="ta-ops">${xs.map(([ic, t, ir], i) => `<button type="button" class="ta-op${i === xs.length - 1 && xs.length % 2 ? ' ta-op--chamar' : ''}" data-ir="${ir}" style="--i:${i}">${L(ic)}<span>${t}</span></button>`).join('')}</div>`;

/* =========================================================
   O que é igual nas duas: o início, o cartão da tarefa, chamar o gestor, problema registado, sair, sem ligação
   ========================================================= */
interface Fun { k: 'separacao' | 'expedicao'; p: string; t: string; quem: { nome: string; iniciais: string }; primeiro: string; verbo: string; trabalho: [string, string]; ops: [string, string, string][]; tarefa: string; continuar: string }
const FS: Fun = { k: 'separacao', p: 'ts', t: 'Separação', quem: TIAGO, primeiro: 'Tiago', verbo: 'recolher', trabalho: [`Guia ${GS.ref} · ${PAR.length} linhas`, `Zona 10 · camião ${GS.camiao} às ${GS.fecha}`],
  ops: [[list, 'Consultar guia', 'ts-consultar-guia'], [search, 'Consultar artigo', 'ts-consultar-artigo'], [mapPin, 'Consultar posição', 'ts-consultar-posicao'], [phone, 'Chamar o gestor', 'ts-chamar']], tarefa: 'ts-tarefa', continuar: 'ts-paragem' };
const FX: Fun = { k: 'expedicao', p: 'tx', t: 'Expedição', quem: PAULO, primeiro: 'Paulo', verbo: 'carregar', trabalho: [`Guia ${GE.ref} · ${GE.vol} volumes`, `Prateleira ${PREP} · ${GS.camiao} às ${GS.fecha}`],
  ops: [[truck, 'Camiões de hoje', 'tx-camioes'], [list, 'Consultar guia', 'tx-consultar-guia'], [phone, 'Chamar o gestor', 'tx-chamar']], tarefa: 'tx-tarefa', continuar: 'tx-conferir' };
const O = (f: Fun, titulo: string, extra: Opcoes = {}): Opcoes => ({ titulo, funcao: f.t, quem: f.quem, ...extra });

function inicio(f: Fun, e: 'normal' | 'sem' | 'fim-turno' | 'sem-rede' = 'normal'): string {
  if (e === 'sem-rede') return ecra(`${aviso('erro', wifiOff, 'Sem ligação', 'O PDA não está ligado ao servidor desde as 10h22. Não pode começar nem fechar operações até a ligação voltar.')}${dl(f.k === 'separacao' ? [['Ficou gravado', `Paragem 2 de ${PAR.length} · confirmada às 10h21`], ['Por confirmar', `Paragem 3 de ${PAR.length}`]] : [['Ficou gravado', `Volume 2 de ${GE.vol} · conferido às 10h21`], ['Por conferir', `Volume 3 de ${GE.vol}`]])}<p class="gp-nota">Aproxime-se do corredor principal. Quando a ligação voltar, retoma onde ficou.</p>`, O(f, 'Início', { rede: false, pe: acao('Tentar de novo', refresh, ` data-ir="${f.p}-inicio"`) }));
  const fim = e === 'fim-turno';
  const trab = e === 'sem' ? `<section class="gi-vazio">${L(f.k === 'separacao' ? basket : truck)}<p><b>Não há trabalho para si agora.</b> Quando houver, o motor dá-lho aqui.</p></section>`
    : `<button type="button" class="ta-trabalho" data-ir="${f.tarefa}"><span class="ta-trabalho__ic">${L(f.k === 'separacao' ? basket : truck)}</span><span><b>Começar a ${f.verbo}</b><small>${fim ? (f.k === 'separacao' ? 'Uma guia de 1 linha · 2 min' : 'A guia seguinte do mesmo camião · 2 min') : f.trabalho[0]}</small><small>${fim ? 'É o que cabe no que falta' : f.trabalho[1]}</small></span>${L(arrowRight)}</button>`;
  return ecra(`<div class="gp-ola"><h1>Bom dia, ${f.primeiro}</h1><p>${fim ? 'Faltam 2 min · o seu turno acaba às 16h30' : 'Turno das 8h às 16h30'}</p></div>
    <section class="gp-sec"><h2 class="gp-h">Trabalho</h2>${trab}${fim ? '<p class="gp-nota">O motor já não dá o que não cabe em 2 min. Uma tarefa começada acaba-se: ninguém é interrompido.</p>' : ''}</section>
    ${fim ? '' : `<section class="gp-sec"><h2 class="gp-h">Operações</h2>${ops(f.ops)}</section>`}`, O(f, 'Início', { barra: barra(f.k, 'inicio') }));
}
/* 30 · 43 — A tua próxima tarefa: o cartão com o porquê (é daqui o único «Voltar» ao menu depois de começar) */
function cartao(f: Fun): string {
  const sep = f.k === 'separacao';
  return ecra(`<h1 class="gp-titulo">A sua tarefa</h1>
    <section class="gi-dom ta-prox"><p class="gi-tarefa__rot">${L(sep ? basket : truck)}Agora</p>
      <div class="gi-tarefa__cab"><b>${sep ? GS.ref : GE.ref}</b></div>
      <p class="gi-dom__meta">${sep ? `${GS.cli} · ${PAR.length} linhas` : `${GE.cli} · ${GE.vol} volumes · camião ${GS.camiao}`}</p>
      ${dl(sep ? [['Porquê', `O camião ${GS.camiao} fecha às ${GS.fecha}`], ['E também', 'As paragens ficam na zona 10, ao pé de onde acabou']] : [['Porquê', `O camião fecha às ${GS.fecha} e já está no cais`], ['E também', 'É a guia seguinte do mesmo camião: já está lá']])}
    </section>
    <p class="gp-nota">Só vê esta. Ninguém escolhe, e ninguém apanha a guia de outro.</p>`,
  O(f, 'Tarefa', { voltar: `${f.p}-inicio`, pe: acao('Começar trabalho', play, ` data-ir="${sep ? 'ts-guia' : 'tx-conferir'}"`), barra: barra(f.k, 'tarefa') }));
}
function chamar(f: Fun, e: 'escolher' | 'chamado' | 'resposta' = 'escolher'): string {
  const onde = f.k === 'separacao' ? [['Onde está', `Zona 10 · ${PAR[0].pos}`], ['O que tem em mãos', `Guia ${GS.ref} · paragem 1 de ${PAR.length}`]] as [string, string][] : [['Onde está', `Prateleira de preparados · ${PREP}`], ['O que tem em mãos', `Guia ${GE.ref} · ${GE.vol} volumes`]] as [string, string][];
  if (e === 'chamado') return ecra(`<section class="ta-bloq ta-bloq--chamada" role="status">${L(phone, 'ta-bloq__ic')}<h1>O gestor foi chamado</h1><p>Ana Ferreira · avisada às 10h26</p></section>
    <ol class="ta-linha-t" aria-label="O pedido"><li class="is-feito"><b>Pedido enviado</b><small>10h26</small></li><li class="is-atual"><b>Ainda não visto</b><small>—</small></li><li><b>Vem, ou responde daí</b><small>—</small></li></ol>
    ${dl([['A tarefa', 'fica consigo'], ['O motor', 'não lhe dá outra']])}<p class="gp-nota">Ela vê onde está e o que tem em mãos. Se não puder vir, responde pelo PDA — e, se for preciso, faz ela a tarefa.</p>`,
  O(f, 'Chamada', { voltar: f.continuar, pe: `${acao('Continuar a tarefa', play, ` data-ir="${f.continuar}"`)}${sec('Ver o pedido', msg, ` data-ir="${f.p}-chamado-resposta"`)}` }));
  if (e === 'resposta') return ecra(`<section class="gi-aviso gi-aviso--info ta-resposta" role="status"><span class="gi-aviso__ic">${L(msg)}</span><h1>A Ana Ferreira respondeu</h1><p>Às 10h31, cinco minutos depois de a chamar.</p></section>
    <blockquote class="ta-diz"><small>O que ela diz</small><p>${f.k === 'separacao' ? `Se na ${PAR[0].pos} houver menos, tire o que há e diga «Falta quantidade»: eu trato do stock.` : 'O camião DPD espera até às 11h40. Carregue o que está conferido.'}</p></blockquote>
    <ol class="ta-linha-t" aria-label="O pedido"><li class="is-feito"><b>Pedido enviado</b><small>10h26</small></li><li class="is-feito"><b>Visto por ela</b><small>10h27</small></li><li class="is-feito"><b>Respondeu daí — não vem</b><small>10h31</small></li></ol>
    <p class="gp-nota">Quem chamou decide se chega: se não chegar, chama outra vez e o pedido sobe de urgência no ecrã dela.</p>`,
  O(f, 'Chamada', { voltar: f.continuar, pe: `${acao('Continuar a tarefa', play, ` data-ir="${f.continuar}"`)}${sec('Não chega — chamar outra vez', phone, ` data-ir="${f.p}-chamado"`)}` }));
  return ecra(`<h1 class="gp-titulo">Chamar o gestor</h1><p class="gp-nota">Ela vai saber:</p>${dl(onde)}<p class="gp-nota">Diga-lhe o que é, para ela saber se vem ou se responde daí.</p>
    <ul class="ta-escolhas" role="list">${['Não sei o que fazer a isto', 'O que está aqui não é o que o PDA diz', 'Preciso de ajuda para mexer nisto', 'Outro motivo — escrever'].map((t, i) => `<li style="--i:${i}"><button type="button" class="ta-escolha" data-confirmar data-ir="${f.p}-chamado">${L(i === 3 ? circleEllipsis : msg)}<span>${t}</span>${L(arrowRight)}</button></li>`).join('')}</ul>`,
  O(f, 'Chamar o gestor', { voltar: `${f.p}-inicio` }));
}
function registado(f: Fun, motivo: string, nota: string): string {
  return ecra(`<section class="ta-bloq" role="status">${L(pkgX, 'ta-bloq__ic')}<h1>${motivo}</h1><p>Registado às 10h46 com o seu nome.</p></section>${dl([['O gestor', 'foi avisado'], ['A guia', nota], ['A tarefa', 'deixa de ser sua: o motor dá-lhe a seguinte']])}`,
  O(f, 'Problema', { pe: acao('Próxima tarefa', arrowRight, ` data-ir="${f.p}-inicio"`) }));
}
function foto(f: Fun, motivo: string, o_que: string): string {
  return ecra(`<h1 class="ta-passo-t">${motivo}</h1><p class="ta-onde"><b>${f.k === 'separacao' ? GS.ref : GE.ref}</b><span>${o_que}</span></p>
    <button type="button" class="ta-foto" data-ir="${f.p}-registado">${L(camera)}<span><b>Tirar fotografia</b><small>Opcional. Com fotografia, o gestor decide de onde está.</small></span></button>
    <p class="gp-nota">A fotografia fica presa à incidência, com a hora e o nome de quem a tirou. Sai com a incidência quando ela se fecha.</p>`,
  O(f, 'Problema', { voltar: f.continuar, pe: `${acao('Registar', check, ` data-confirmar data-ir="${f.p}-registado"`)}${sec('Registar sem fotografia', check, ` data-ir="${f.p}-registado"`)}` }));
}

/* =========================================================
   Separação · 31 a guia · 32 paragem · 33 falta · 34 prateleira · 35 fechada · 36 · 37 · 38 sair · 39–41
   ========================================================= */
const topoS = (i: number) => `<div class="ta-topo"><p><b>${GS.ref}</b><small>${GS.camiao} −00:27 · paragem ${i + 1} de ${PAR.length}</small></p><button type="button" class="ta-chamar" data-ir="ts-chamar">${L(phone)}<span>Chamar</span></button></div>`;
function guiaS(): string {
  return ecra(`<h1 class="gp-titulo">A sua guia</h1><p class="gp-nota">${GS.ref} · ${PAR.length} linhas · camião ${GS.camiao}, fecha às ${GS.fecha}</p>
    ${aviso('aviso', clock, 'Apertado', 'Faltam 27 min de trabalho para o camião.')}
    <h2 class="gp-h">As paragens</h2><ol class="ts-paragens">${PAR.map((p, i) => `<li><span>${i + 1}</span><code>${p.pos}</code><b>${p.q} × ${p.ref}</b></li>`).join('')}</ol>
    <div class="ta-alvo"><small>Prateleira de preparados</small>${posicao(PREP)}</div>
    <p class="gp-nota">Pela ordem mais curta. A prateleira já está reservada para esta guia: é lá que ela fica, inteira ou a meio.</p>`,
  O(FS, 'Guia', { voltar: 'ts-tarefa', pe: acao('Começar a recolher', play, ' data-ir="ts-paragem"') }));
}
type ES = 'paragem' | 'artigo' | 'ultima' | 'ultima-artigo' | 'errada' | 'falta' | 'problema' | 'escrever' | 'prateleira' | 'fechada' | 'fechada-incompleta';
function sep(e: ES): string {
  const i = e === 'ultima' || e === 'ultima-artigo' ? PAR.length - 1 : e === 'falta' ? 2 : 0, p = PAR[i];
  const vai = `<section class="ta-proposta"><p class="ta-proposta__n">Vai a</p>${posicao(p.pos)}<p class="ta-proposta__pq"><b>Tira</b>${p.q} × ${p.ref} · ${p.desc}</p><p class="ta-proposta__cam">${L(lock)}<span>Para a ${GS.ref}: o stock já está reservado para si.</span></p>${i < PAR.length - 1 ? `<p class="ta-proposta__cam">${L(arrowRight)}<span>A seguir: ${PAR[i + 1].pos} · 5 m</span></p>` : ''}</section>`;
  const C: Record<ES, () => [string, string, string?]> = {
    paragem: () => [`${topoS(i)}${vai}${leitor({ titulo: 'Leia a POSIÇÃO, depois o ARTIGO', texto: `Deve ser ${p.pos}`, ir: 'ts-artigo', tipo: 'posicao' })}`, `<div class="ta-pe2">${sec('Falta quantidade', hash, ' data-ir="ts-falta"')}${sec('Outro problema', circleEllipsis, ' data-ir="ts-problema"')}</div>${sec('Não consigo ler — escrever', keyboard, ' data-ir="ts-escrever"')}`],
    artigo: () => [`${topoS(i)}${aviso('ok', circleCheck, 'Posição certa', `${p.pos} · bip curto`)}${leitor({ titulo: 'Agora leia o ARTIGO', texto: `${p.q} × ${p.ref}`, ir: 'ts-ultima', tipo: 'artigo' })}<p class="gp-nota">As paragens 2 e 3 fazem-se igual.</p>`, `${sec('Falta quantidade', hash, ' data-ir="ts-falta"')}`],
    ultima: () => [`${topoS(i)}${vai}${leitor({ titulo: 'Leia a POSIÇÃO, depois o ARTIGO', texto: `Deve ser ${p.pos}`, ir: 'ts-ultima-artigo', tipo: 'posicao' })}`, `<div class="ta-pe2">${sec('Falta quantidade', hash, ' data-ir="ts-falta"')}${sec('Outro problema', circleEllipsis, ' data-ir="ts-problema"')}</div>`],
    'ultima-artigo': () => [`${topoS(i)}${aviso('ok', circleCheck, 'Posição certa', `${p.pos} · bip curto`)}${leitor({ titulo: 'Agora leia o ARTIGO', texto: `${p.q} × ${p.ref}`, ir: 'ts-prateleira', tipo: 'artigo' })}`, sec('Falta quantidade', hash, ' data-ir="ts-falta"')],
    errada: () => [`${topoS(i)}${aviso('erro', mapPin, 'Não é esta posição', `Leu a 60100306. Devia estar na <b>${p.pos}</b> · vibração e bip grave.`)}`, `${acao('Ler outra vez', scanBarcode, ' data-ir="ts-paragem"')}${sec('Não consigo ler — escrever', keyboard, ' data-ir="ts-escrever"')}`],
    falta: () => [`${topoS(i)}<h1 class="ta-passo-t">Aqui há 2 das ${p.q}</h1><p class="gp-nota">Registe o que tirou. A guia fica incompleta e não sai sem o resto.</p><div class="ta-alvo"><small>Posição</small>${posicao(p.pos)}</div>
      ${dl([['Precisa', `${p.q}`], ['Faltam', `${p.q - 2}`]])}${quantidade('2', { teclado: false, rotulo: 'Quantas tirou?' })}
      <p class="gp-nota">As 2 que tirou ficam na guia. A diferença fica registada nesta posição e o gestor vê o sinal — mexer no stock é decisão dele.</p>`, acao('Registar e seguir', check, ' data-confirmar data-ir="ts-ultima"')],
    problema: () => [`${topoS(i)}<h1 class="ta-passo-t">O que se passa?</h1><p class="ta-onde"><span>Em</span>${posicao(p.pos, 'gi-pos--peq')}</p>${escolhas([[mapPinOff, 'Não há nada na posição', 'ts-falta'], [hash, 'Está lá menos do que a guia pede', 'ts-falta'], [pkgX, 'Está lá outro artigo', 'ts-registado'], [scanLine, 'Etiqueta ilegível', 'ts-escrever'], [pkgX, 'Artigo danificado', 'ts-foto'], [circleEllipsis, 'Outro motivo — escrever', 'ts-registado']])}`, sec('Voltar à paragem', arrowLeft, ' data-ir="ts-paragem"')],
    escrever: () => [`${topoS(i)}<h1 class="ta-passo-t">Escreva a POSIÇÃO</h1><p class="gp-nota">Os oito algarismos da etiqueta da prateleira.</p><label class="gp-campo"><span>Código da posição</span><input inputmode="numeric" maxlength="8" value="${p.pos}" autocomplete="off"></label><p class="gp-nota">Fica registada como leitura à mão. Se a etiqueta falhar muitas vezes, o sistema aconselha a renová-la.</p>`, acao('Confirmar', check, ' data-ir="ts-artigo"')],
    prateleira: () => [`<div class="ta-topo"><p><b>${GS.ref}</b><small>${GS.camiao} −00:28 · fim da guia · ${PAR.length} de ${PAR.length}</small></p><button type="button" class="ta-chamar" data-ir="ts-chamar">${L(phone)}<span>Chamar</span></button></div>
      <h1 class="ta-passo-t">Leve à prateleira de preparados</h1><div class="ta-alvo"><small>Prateleira de preparados</small>${posicao(PREP)}</div>
      ${dl([['Parte', `do camião ${GS.camiao} · ${GS.fecha} · junto ao cais de saída`], ['A guia', `completa · ${PAR.length} linhas`]])}
      ${leitor({ titulo: 'Leia a posição da prateleira onde a pousa', texto: `Deve ser ${PREP}`, ir: 'ts-fechada', tipo: 'posicao' })}
      <p class="gp-nota">Incompleta, ficava na mesma prateleira à espera: o motor voltava a dá-la a alguém assim que o stock entrasse.</p>`, sec('Não consigo ler — escrever', keyboard, ' data-ir="ts-fechada"')],
    fechada: () => [`<section class="gi-movido" role="status">${L(pkgCheck, 'ta-ok__ic')}<h1>Guia fechada às 11h02</h1><p>${GS.ref} · completa · ${PAR.length} linhas</p></section>${dl([['Deixou', `na ${PREP}`], ['Camião', `${GS.camiao} · ${GS.fecha}`]])}<p class="gp-nota">A expedição leva-a quando o camião chegar.</p>`, acao('Próxima tarefa', arrowRight, ' data-ir="ts-tarefa"')],
    'fechada-incompleta': () => [`<section class="gi-movido" role="status">${L(pkg, 'ta-ok__ic')}<h1>Guia fechada incompleta</h1><p>${GS.ref} · ${PAR[2].ref}: 2 de ${PAR[2].q}</p></section>${dl([['Deixou', `na ${PREP}`], ['Não entra', 'na fila da expedição'], ['O resto', 'o motor dá-o outra vez a alguém quando o stock entrar']])}`, acao('Próxima tarefa', arrowRight, ' data-ir="ts-tarefa"')],
  };
  const [corpo, pe] = C[e]();
  return ecra(corpo, O(FS, 'Recolher', { voltar: 'ts-inicio', pe }));
}
function sairS(): string {
  return ecra(`<h1 class="gp-titulo">Tem a guia ${GS.ref} a meio</h1><p class="gp-nota">2 linhas recolhidas, 2 por recolher.</p>
    ${dl([['O que já tirou', `leva-o à ${PREP}`], ['As 2 que faltam', 'voltam ao motor'], ['O camião', `${GS.camiao} · ${GS.fecha}`]])}
    <p class="gp-nota">Nada volta à prateleira de origem: o que está no carro vai para a posição desta guia, e as linhas ficam registadas. Quem a apanhar continua na paragem 3 e junta o resto no mesmo sítio. O gestor vê quem saiu com uma guia aberta.</p>`,
  O(FS, 'Sair', { voltar: 'ts-inicio', pe: `${acao('Continuar a guia', play, ' data-ir="ts-paragem"')}${sec('Sair mesmo', logOut, ' data-login')}` }));
}
function consultarS(k: 'guia' | 'artigo' | 'posicao'): string {
  const v = sec('Voltar', arrowLeft, ' data-ir="ts-inicio"');
  return ecra(`${leitor({ titulo: 'Leia a guia ou escreva o número', texto: 'Só para ver: não muda nada', tipo: 'consulta' })}<h2 class="gp-h">${GS.ref}</h2>${dl([['Cliente', GS.cli], ['Camião', `${GS.camiao} · ${GS.fecha}`], ['Linhas', `${PAR.length}`], ['Recolhidas', '0'], ['Onde vai ficar', PREP], ['Estado', 'por recolher']])}`, O(FS, 'Consultar guia', { voltar: 'ts-inicio', pe: v }));
  if (k === 'artigo') return ecra(`${leitor({ titulo: 'Leia o artigo, ou escreva a referência', texto: 'Só para ver: não muda nada', tipo: 'consulta' })}<section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${PAR[0].ref}</p><p class="gi-artigo__desc">${PAR[0].desc} · zona 10</p></div></section><h2 class="gp-h">Onde está</h2>${dl([[PAR[0].pos, '24 un.'], ['60100306', '6 un.'], ['Reservado para guias', '12 un.']])}`, O(FS, 'Consultar artigo', { voltar: 'ts-inicio', pe: v }));
  return ecra(`${leitor({ titulo: 'Leia a posição', texto: 'Só para ver: não muda nada', tipo: 'consulta' })}<div class="ta-alvo"><small>Posição</small>${posicao(PAR[0].pos)}</div>${dl([['Artigo', `${PAR[0].ref} · ${PAR[0].desc}`], ['Quantidade', '24 un.'], ['Última saída', '9h40 · Tiago Lopes']])}<p class="gp-nota">A separação não corrige posições: se não bater, diga-o na guia («Falta quantidade») e o gestor decide.</p>`, O(FS, 'Consultar posição', { voltar: 'ts-inicio', pe: v }));
}

/* =========================================================
   Expedição · 44 camiões · 45 conferir · 46 cais · 47 carregar · 63/d4 fechar · 48 fechada · 49 · 50 · 51 · 52 · 53 · 54
   ========================================================= */
const topoX = (passo: number, falta = '−00:41') => `<div class="ta-topo"><p><b>${GE.ref}</b><small>${GS.camiao} ${falta} · passo ${passo} de 4</small></p><button type="button" class="ta-chamar" data-ir="tx-chamar">${L(phone)}<span>Chamar</span></button></div>`;
type EX = 'conferir' | 'conferir-2' | 'cais' | 'carregar' | 'perguntar' | 'porque' | 'fechada' | 'problema' | 'falta-volume' | 'escrever-cais' | 'carregada';
function exp(e: EX): string {
  const lidos = e === 'conferir-2' ? 2 : 0;
  const C: Record<EX, () => [string, string]> = {
    conferir: () => [`${topoX(1)}<p class="ta-esperado">${L(layers)}<b>${PREP}</b><span>na prateleira · ${GE.cli}</span></p><h1 class="ta-passo-t">Leia cada VOLUME</h1>
      <ul class="tx-vols" role="list">${VOL.map((v, i) => `<li class="${i < lidos ? 'is-lido' : ''}">${L(i < lidos ? circleCheck : pkg)}<span>${v}</span><code>V${i + 1}/${GE.vol}</code></li>`).join('')}</ul>
      ${leitor({ titulo: 'Leia o volume', texto: `${lidos} de ${GE.vol} lidos`, ir: e === 'conferir' ? 'tx-conferir-2' : 'tx-cais', tipo: 'volume' })}`, `<div class="ta-pe2">${sec('Falta um volume', pkgX, ' data-ir="tx-falta-volume"')}${sec('Outro problema', circleEllipsis, ' data-ir="tx-problema"')}</div>`],
    'conferir-2': () => C.conferir(),
    cais: () => [`${topoX(2, '−00:33')}${aviso('ok', circleCheck, `${GE.vol} de ${GE.vol} volumes conferidos`, 'A guia está completa.')}<h1 class="ta-passo-t">Leve ao cais</h1><p class="ta-esperado">${L(truck)}<b>${GE.cais}</b><span>onde o camião ${GS.camiao} está a encostar</span></p>
      ${leitor({ titulo: 'Leia a etiqueta do cais onde pousa', texto: `Deve ser o ${GE.cais.toLowerCase()}`, ir: 'tx-carregar', tipo: 'cais' })}`, sec('Não consigo ler — escrever', keyboard, ' data-ir="tx-escrever-cais"')],
    carregar: () => [`${topoX(3, '−00:22')}<p class="ta-esperado">${L(truck)}<b>${GS.camiao} · ${GE.cais}</b><span>8 de 10 volumes no camião</span></p>
      <h2 class="gp-h">Falta subir</h2><ul class="tx-vols" role="list">${['V4', 'V5'].map((v) => `<li>${L(pkg)}<span>GS13454208 · ${v}</span><code>${PREP}</code></li>`).join('')}</ul>
      ${leitor({ titulo: 'Leia cada volume quando sobe ao camião', texto: 'GS13454208 · Auto Peças Viana', ir: 'tx-fechada', tipo: 'volume' })}
      <p class="gp-nota">Quando a última guia subir, a saída fecha sozinha. Fechar antes disso é decisão de quem está no cais, e o PDA pergunta primeiro. Documentos de transporte: no computador da expedição.</p>`, `<div class="ta-pe2">${sec('Guia carregada', check, ' data-ir="tx-carregada"')}${sec('Fechar a saída', lock, ' data-ir="tx-perguntar"')}</div>`],
    perguntar: () => [`${topoX(3, '−00:22')}${aviso('aviso', lock, 'Fechar a saída INCOMPLETA?', 'Faltam 2 volumes da GS13454208. Se fechar, esses vão no camião seguinte, a guia fica incompleta, e tem de dizer porquê.')}`, `${acao('Fechar incompleta', lock, ' data-ir="tx-porque"')}${sec('Voltar a carregar', arrowLeft, ' data-ir="tx-carregar"')}`],
    porque: () => [`${topoX(3, '−00:22')}<h1 class="ta-passo-t">Fechar sem 2 volumes — porquê?</h1>${`<ul class="ta-escolhas" role="list">${['O transportador não pode esperar', 'Artigo indisponível', 'Volume danificado', 'Decisão do gestor', 'Outro motivo — escrever'].map((t, i) => `<li style="--i:${i}"><button type="button" class="ta-escolha" data-confirmar data-ir="tx-fechada-incompleta">${L(i === 4 ? circleEllipsis : msg)}<span>${t}</span>${L(arrowRight)}</button></li>`).join('')}</ul>`}<p class="gp-nota">Fica registado com o seu nome e a hora. É por aqui que se sabe, no fim do mês, porque é que as guias saem a meio.</p>`, sec('Voltar a carregar', arrowLeft, ' data-ir="tx-carregar"')],
    fechada: () => [`<section class="gi-movido" role="status">${L(truck, 'ta-ok__ic')}<h1>Saída ${GS.camiao} fechada às 11h28</h1><p>3 guias · 10 volumes carregados</p></section>${dl(NO_CAMIAO.map(([g, c, v]) => [g, `${c} · ${v} volumes`]))}<p class="gp-nota">Os documentos de transporte saem no computador da expedição.</p>`, acao('Próxima tarefa', arrowRight, ' data-ir="tx-tarefa"')],
    carregada: () => [`<section class="gi-movido" role="status">${L(pkgCheck, 'ta-ok__ic')}<h1>Guia carregada</h1><p>${GE.ref} · ${GE.vol} volumes no camião ${GS.camiao}</p></section><p class="gp-nota">A saída continua aberta: as outras guias do camião ainda sobem.</p>`, acao('Próxima tarefa', arrowRight, ' data-ir="tx-tarefa"')],
    problema: () => [`${topoX(1)}<h1 class="ta-passo-t">O que se passa?</h1><p class="ta-onde"><span>Na prateleira</span>${posicao(PREP, 'gi-pos--peq')}</p>${escolhas([[pkgX, 'Falta um volume na prateleira', 'tx-falta-volume'], [pkgX, 'Volume danificado', 'tx-foto'], [truck, 'O camião não chegou', 'tx-registado'], [scanLine, 'Etiqueta ilegível', 'tx-escrever-cais'], [ruler, 'Não cabe no camião', 'tx-registado'], [circleEllipsis, 'Outro motivo — escrever', 'tx-registado']])}`, sec('Voltar a conferir', arrowLeft, ' data-ir="tx-conferir"')],
    'falta-volume': () => [`${topoX(1)}<h1 class="ta-passo-t">Falta o volume V3/${GE.vol}</h1><p class="gp-nota">${GE.ref} · ${VOL[2]} · não está na prateleira.</p>${dl([['A guia', 'fica incompleta'], ['O que vai', `2 de ${GE.vol} volumes`], ['O resto', 'espera pelo camião seguinte']])}<p class="gp-nota">Fica um sinal no relatório: a guia saiu da prateleira sem um volume que devia lá estar. O gestor decide quem o vai procurar — a expedição não manda trabalho à separação.</p>`, `${acao('Registar e seguir', check, ' data-confirmar data-ir="tx-cais"')}${sec('Ver a guia', list, ' data-ir="tx-consultar-guia"')}`],
    'escrever-cais': () => [`${topoX(2, '−00:33')}<h1 class="ta-passo-t">Escreva o CAIS</h1><p class="gp-nota">O número do cais onde o camião está a encostar.</p><label class="gp-campo"><span>Cais</span><input inputmode="numeric" value="2" autocomplete="off"></label><p class="gp-nota">Fica registado como escrito à mão.</p>`, acao('Confirmar', check, ' data-ir="tx-carregar"')],
  };
  const [corpo, pe] = C[e]();
  return ecra(corpo, O(FX, 'Carregar', { voltar: 'tx-inicio', pe }));
}
function fechadaIncompleta(): string {
  return ecra(`<section class="gi-movido" role="status">${L(truck, 'ta-ok__ic')}<h1>Saída ${GS.camiao} fechada incompleta</h1><p>Às 11h28 · com o seu nome e o motivo</p></section>${dl([['Carregado', '3 guias · 8 volumes'], ['Ficou', 'GS13454208 · V4 e V5 · vão no camião seguinte'], ['Motivo', 'O transportador não pode esperar']])}`,
  O(FX, 'Carregar', { voltar: 'tx-inicio', pe: acao('Próxima tarefa', arrowRight, ' data-ir="tx-tarefa"') }));
}
function camioes(): string {
  const C: [string, string, string, string][] = [['DPD', '11h30', 'no cais de saída 2 · a carregar', 'Apertado'], ['GLS', '14h00', 'ainda não chegou', ''], ['Transportes Vilar', '17h30', 'ainda não chegou', '']];
  return ecra(`<h1 class="gp-titulo">Camiões de hoje</h1><p class="gp-nota">Por ordem de fecho.</p>
    <ul class="gp-lista" role="list">${C.map(([c, h, x, t], i) => `<li style="--i:${i}"><div class="ta-linha ta-linha--${t ? 'bloq' : 'curso'}"><span class="ta-linha__cab"><b>${c}</b>${t ? `<span class="gp-tag gp-tag--erro">${t}</span>` : `<small>${h}</small>`}</span><span class="ta-linha__art">${t ? `fecha às ${h} · ` : ''}${x}</span></div></li>`).join('')}</ul>`,
  O(FX, 'Camiões', { voltar: 'tx-inicio', pe: sec('Voltar ao início', arrowLeft, ' data-ir="tx-inicio"') }));
}
function sairX(): string {
  return ecra(`<h1 class="gp-titulo">Tem a guia ${GE.ref} a meio</h1><p class="gp-nota">2 volumes no camião, 1 ainda na prateleira.</p>
    ${dl([['Os 2 que já subiram', 'ficam registados'], ['O que falta', 'volta ao motor com a guia'], [`A saída ${GS.camiao}`, 'fica aberta']])}
    <p class="gp-nota">Nenhum volume desce do camião: os que já subiram ficam lá e registados. Quem apanhar a guia continua no volume 3, e o camião espera no cais até a saída fechar. O gestor vê quem saiu com uma guia aberta.</p>`,
  O(FX, 'Sair', { voltar: 'tx-inicio', pe: `${acao('Continuar a carregar', play, ' data-ir="tx-carregar"')}${sec('Sair mesmo', logOut, ' data-login')}` }));
}
function consultarX(): string {
  const v = sec('Voltar', arrowLeft, ' data-ir="tx-inicio"');
  return ecra(`${leitor({ titulo: 'Leia a guia ou escreva o número', texto: 'Só para ver: não muda nada', tipo: 'consulta' })}<h2 class="gp-h">${GE.ref}</h2>${dl([['Cliente', GE.cli], ['Volumes', `${GE.vol}`], ['Conferidos', '2'], ['Onde está', PREP], ['Prevista sair', `hoje · ${GS.fecha} · ${GS.camiao}`], ['Estado', 'incompleta']])}`, O(FX, 'Consultar guia', { voltar: 'tx-inicio', pe: v }));
}

/* =========================================================
   Os ecrãs
   ========================================================= */
const NOTA = 'A Separação e a Expedição como nos documentos (30 out.): 07 · O menu da app e os ecrãs 29–54, 63, d1 e d4 do Figma do armazém, com as guias GS e a prateleira de preparados 60400101.';
export function ecrasSeparacaoExpedicao(): Ecra<string>[] {
  const e = (fluxo: string, id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<string> => ({ id, nome, fluxo, objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  const S = (...a: [string, string, string, string, string?]) => e('Separação', ...a), X = (...a: [string, string, string, string, string?]) => e('Expedição', ...a);
  return [
    S('ts-inicio', '110 · Início da Separação (29)', '«Bom dia» e o turno; Trabalho «Começar a recolher»; Consultar guia, artigo e posição, e Chamar o gestor; Tarefa · Início · Sair.', inicio(FS)),
    S('ts-inicio-sem', '110.1 · Sem trabalho', 'O motor não tem nada para o Tiago.', inicio(FS, 'sem'), 'ts-inicio'),
    S('ts-inicio-fim-turno', '110.2 · Fim do turno à vista', 'Só o que cabe no que falta; as Operações saem da frente.', inicio(FS, 'fim-turno'), 'ts-inicio'),
    S('ts-inicio-sem-rede', '110.3 · Sem ligação (62)', 'Não há menu: o que ficou gravado e «Tentar de novo».', inicio(FS, 'sem-rede'), 'ts-inicio'),
    S('ts-tarefa', '111 · A sua tarefa (30)', 'O cartão com o porquê; o único «Voltar» ao menu antes de começar.', cartao(FS)),
    S('ts-guia', '112 · A sua guia (31)', 'As paragens pela ordem mais curta e a prateleira de preparados reservada.', guiaS()),
    S('ts-paragem', '113 · Paragem: lê a posição (32)', 'Vai a, tira, para que guia; lê a posição e depois o artigo.', sep('paragem')),
    S('ts-artigo', '113.1 · Posição certa: lê o artigo', 'Bip curto; agora o artigo.', sep('artigo'), 'ts-paragem'),
    S('ts-ultima', '113.2 · A última paragem', 'Paragem 4 de 4.', sep('ultima'), 'ts-paragem'),
    S('ts-ultima-artigo', '113.3 · A última: o artigo', 'Depois deste, a prateleira.', sep('ultima-artigo'), 'ts-paragem'),
    S('ts-errada', '113.4 · Não é esta posição', 'Vibração e bip grave; diz-se qual é.', sep('errada'), 'ts-paragem'),
    S('ts-falta', '113.5 · Falta quantidade (33)', 'Regista-se o que se tirou; a guia fica incompleta; mexer no stock é do gestor.', sep('falta'), 'ts-paragem'),
    S('ts-problema', '113.6 · O que se passa? (36)', 'Não há nada, há menos, outro artigo, etiqueta ilegível, danificado, outro motivo.', sep('problema'), 'ts-paragem'),
    S('ts-escrever', '113.7 · Escreve a posição (37)', 'Os 8 algarismos à mão.', sep('escrever'), 'ts-paragem'),
    S('ts-foto', '113.8 · Fotografia', 'Opcional; fica presa à incidência.', foto(FS, 'Artigo danificado', `${PAR[0].ref} · paragem 1`), 'ts-paragem'),
    S('ts-registado', '113.9 · Problema registado (18)', 'O gestor foi avisado; volta ao início da Separação.', registado(FS, 'Problema registado', 'fica na prateleira de preparados, incompleta'), 'ts-paragem'),
    S('ts-prateleira', '114 · Leva à prateleira de preparados (34)', 'A posição 60400101, perto do cais de saída; lê-se onde se pousa.', sep('prateleira')),
    S('ts-fechada', '115 · Guia fechada (35)', 'Completa: a expedição leva-a quando o camião chegar.', sep('fechada')),
    S('ts-fechada-incompleta', '115.1 · Fechada incompleta', 'Fica na prateleira, fora da fila da expedição, até o stock entrar.', sep('fechada-incompleta'), 'ts-fechada'),
    S('ts-chamar', '116 · Chamar o gestor (70)', 'Sem largar a tarefa; volta à paragem.', chamar(FS)),
    S('ts-chamado', '116.1 · O gestor foi chamado (71)', 'A tarefa fica consigo.', chamar(FS, 'chamado'), 'ts-chamar'),
    S('ts-chamado-resposta', '116.2 · O gestor respondeu', 'A resposta e «Continuar a tarefa».', chamar(FS, 'resposta'), 'ts-chamar'),
    S('ts-sair', '117 · Sair com a guia a meio (38)', 'O que se tirou vai à prateleira da guia; o resto volta ao motor.', sairS()),
    S('ts-consultar-guia', '118 · Consultar guia (39)', 'Só de ver.', consultarS('guia')),
    S('ts-consultar-artigo', '119 · Consultar artigo (40)', 'Onde está e quanto está reservado.', consultarS('artigo')),
    S('ts-consultar-posicao', '120 · Consultar posição (41)', 'Sem corrigir: a separação não corrige posições.', consultarS('posicao')),
    X('tx-inicio', '130 · Início da Expedição (42)', '«Bom dia» e o turno; Trabalho «Começar a carregar»; Camiões de hoje, Consultar guia, Chamar o gestor; Tarefa · Início · Sair.', inicio(FX)),
    X('tx-inicio-sem', '130.1 · Sem trabalho', 'O motor não tem nada para o Paulo.', inicio(FX, 'sem'), 'tx-inicio'),
    X('tx-inicio-fim-turno', '130.2 · Fim do turno à vista', 'Só o que cabe no que falta.', inicio(FX, 'fim-turno'), 'tx-inicio'),
    X('tx-inicio-sem-rede', '130.3 · Sem ligação (62)', 'O que ficou gravado e «Tentar de novo».', inicio(FX, 'sem-rede'), 'tx-inicio'),
    X('tx-tarefa', '131 · A sua tarefa (43)', 'O cartão com o porquê.', cartao(FX)),
    X('tx-camioes', '132 · Camiões de hoje (44)', 'Por hora de fecho, onde está cada um e o risco; sem as guias, que não são da pessoa.', camioes()),
    X('tx-conferir', '133 · Confere volume a volume (45)', 'Na prateleira de preparados: lê-se cada volume.', exp('conferir')),
    X('tx-conferir-2', '133.1 · 2 de 3 lidos', 'Falta o último volume.', exp('conferir-2'), 'tx-conferir'),
    X('tx-problema', '133.2 · O que se passa? (49)', 'Falta um volume, danificado, o camião não chegou, etiqueta ilegível, não cabe, outro motivo.', exp('problema'), 'tx-conferir'),
    X('tx-falta-volume', '133.3 · Falta um volume (50)', 'Regista-se e segue; o gestor decide quem o procura.', exp('falta-volume'), 'tx-conferir'),
    X('tx-foto', '133.4 · Fotografia', 'Opcional.', foto(FX, 'Volume danificado', VOL[1]), 'tx-conferir'),
    X('tx-registado', '133.5 · Problema registado (18)', 'O gestor foi avisado; volta ao início da Expedição.', registado(FX, 'Problema registado', 'fica na prateleira de preparados'), 'tx-conferir'),
    X('tx-cais', '134 · Leva ao cais (46)', 'A guia completa vai ao cais onde o camião encosta; lê-se a etiqueta do cais.', exp('cais')),
    X('tx-escrever-cais', '134.1 · Escreve o cais (51)', 'À mão, quando a etiqueta não se lê.', exp('escrever-cais'), 'tx-cais'),
    X('tx-carregar', '135 · Carregar e fechar a saída (47)', 'Lê-se cada volume quando sobe; a saída fecha sozinha com a última guia.', exp('carregar')),
    X('tx-carregada', '135.1 · Guia carregada', 'A saída continua aberta para as outras guias do camião.', exp('carregada'), 'tx-carregar'),
    X('tx-perguntar', '135.2 · Fechar incompleta? (63)', 'Pergunta-se antes de fechar a saída, que é o que não tem volta.', exp('perguntar'), 'tx-carregar'),
    X('tx-porque', '135.3 · Porquê? (d4)', 'Fica registado com o nome de quem decidiu.', exp('porque'), 'tx-carregar'),
    X('tx-fechada', '136 · Saída fechada (48)', 'O que foi carregado, guia a guia.', exp('fechada')),
    X('tx-fechada-incompleta', '136.1 · Fechada incompleta', 'O que ficou para o camião seguinte e o motivo.', fechadaIncompleta(), 'tx-fechada'),
    X('tx-chamar', '137 · Chamar o gestor (70)', 'Sem largar a tarefa; volta a conferir.', chamar(FX)),
    X('tx-chamado', '137.1 · O gestor foi chamado (71)', 'A tarefa fica consigo.', chamar(FX, 'chamado'), 'tx-chamar'),
    X('tx-chamado-resposta', '137.2 · O gestor respondeu', 'A resposta e «Continuar a tarefa».', chamar(FX, 'resposta'), 'tx-chamar'),
    X('tx-sair', '138 · Sair com a guia a meio (52)', 'Nenhum volume desce do camião; o resto volta ao motor.', sairX()),
    X('tx-consultar-guia', '139 · Consultar guia (53)', 'Só de ver.', consultarX()),
  ];
}
