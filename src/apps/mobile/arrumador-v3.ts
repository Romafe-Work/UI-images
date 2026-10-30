/* =========================================================
   PICK — a Arrumação como está nos documentos (30 out. 2026)
   Ela: «na arrumação ninguém atribui nada a ninguém. Na arrumação eles recebem a guia de arrumação e fazem-na, e só
   podem fazer aquilo que deixei nos docs. Nem insights.» Os documentos são o 05-design/07 · O menu da app (30 set.) e os
   ecrãs 02–28, 66, 67, 70 e 71 do Figma do armazém (~/projects/Figma-PDA-Armazem). Fica só isto:
     - Início (02): «Bom dia», o turno e quanto trabalho espera no armazém (nunca a fila da pessoa); Trabalho com uma
       opção só, «Começar a arrumar» — a guia que o motor deu; Operações: Chegou um camião, Corrigir posição, Consultar
       artigo, Consultar posição, Chamar o gestor; separadores Tarefa · Início · Sair;
     - a tarefa, palete a palete (10 → 11 → 13 → 14): lê o artigo → vai à proposta 1 de 3 → lê a posição → arrumada;
       «Está ocupada» regista-a e passa à proposta seguinte (12); «Outro problema» (15) leva à posição escrita (17), à
       fotografia (f1) ou a «Problema registado» (18: a tarefa deixa de ser da pessoa, o motor dá-lhe a seguinte);
     - Chamar o gestor (70 → 71 → resposta): sem largar a tarefa, que fica com quem chamou;
     - Sair com a guia a meio (66), Chegou um camião (67), Consultar artigo (27) e posição (28); Corrigir posição é a do
       Inventário (55).
   Saem da Arrumação as Tarefas, o Histórico, o Mais, os números, as contagens no Início, a quantidade a confirmar e
   toda a atribuição (ninguém dá tarefas a ninguém: é o motor). Do lado do Gestor, a chamada e o problema registado.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, aviso, posicao, L, leitor, type Opcoes } from './inventario-v2';
import { GUIAS, cenaArrumacao } from './arrumacao';
import { barra } from './navegacao';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import mapPinX from 'lucide-static/icons/map-pin-x.svg?raw';
import scanLine from 'lucide-static/icons/scan-line.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import box from 'lucide-static/icons/box.svg?raw';
import circleEllipsis from 'lucide-static/icons/circle-ellipsis.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import phone from 'lucide-static/icons/bell-ring.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import ruler from 'lucide-static/icons/ruler.svg?raw';
import msg from 'lucide-static/icons/message-square.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';

/* ---------- os dados: a GA-2026-0330 da Inês, palete 2 de 2 (a 1 já está arrumada) ---------- */
const INES = { nome: 'Inês Rocha', iniciais: 'IR' };
const G = GUIAS[1], A1 = G.linhas[0], A = G.linhas[1];
const P: [string, string][] = [[G.destino, 'Os retentores estão na zona 12, e a coluna 04 fica a 6 m do cais 2.'], ['60120402', 'É a seguinte mais perto do cais, ao lado da mesma família.'], ['60120501', 'A primeira livre da coluna 05, ainda na zona 12.']];
const T = (titulo: string, extra: Opcoes = {}): Opcoes => ({ titulo, funcao: 'Arrumação', quem: INES, ...extra });
const comBarra = (ativo: string) => barra('arrumacao', ativo);
/* a faixa da tarefa: a guia e a palete, o passo, e o «Chamar o gestor» que está em todos os ecrãs (07, 30 set.) */
const faixa = (passo: number) => `<div class="ta-topo"><p><b>${G.ref}</b><small>palete 2 de ${G.paletes} · passo ${passo} de 4</small></p><button type="button" class="ta-chamar" data-ir="ta-chamar">${L(phone)}<span>Chamar</span></button></div>`;
const dl = (linhas: [string, string][]) => `<dl class="ta-resumo">${linhas.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
const esperado = `<section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${A.ref}</p><p class="gi-artigo__desc">${A.desc}</p><p class="gi-artigo__meta">${A.q} un. · do ${G.origem.toLowerCase()}</p></div></section>`;

/* =========================================================
   02 · Início da Arrumação
   ========================================================= */
type E02 = 'normal' | 'sem' | 'fim-turno' | 'sem-rede' | 'carregar' | 'sessao';
function inicio(e: E02 = 'normal'): string {
  if (e === 'sem-rede') return ecra(`${aviso('erro', wifiOff, 'Sem ligação', 'O PDA não está ligado ao servidor desde as 10h22. Não pode começar nem acabar arrumações até a ligação voltar.')}${dl([['Ficou gravado', `${A1.ref} · palete 1 de ${G.paletes} · arrumada às 10h38`], ['Por fazer', `palete 2 de ${G.paletes} · retoma-se aqui`]])}<p class="gp-nota">Aproxime-se do corredor principal.</p>`, T('Início', { rede: false, pe: acao('Tentar de novo', refresh, ' data-ir="ta-inicio"') }));
  if (e === 'carregar') return ecra(`<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A carregar…</p><div class="gp-esq"><i></i><i></i><i></i></div>`, T('Início', { barra: comBarra('inicio') }));
  if (e === 'sessao') return ecra(aviso('aviso', clock, 'A sessão terminou', 'Entre outra vez: a guia continua sua, na mesma palete.'), T('Início', { pe: acao('Entrar outra vez', play, ' data-login') }));
  const fim = e === 'fim-turno';
  const trabalho = e === 'sem' ? `<section class="gi-vazio">${L(box)}<p><b>Não há trabalho para si agora.</b> Quando houver, o motor dá-lho aqui.</p></section>`
    : `<button type="button" class="ta-trabalho" data-ir="arr-op"><span class="ta-trabalho__ic">${L(box)}</span><span><b>Começar a arrumar</b><small>${fim ? 'Palete vazia ao parque · 2 min' : `Guia ${G.ref} · ${G.paletes} paletes`}</small><small>${fim ? 'É o que cabe no que falta' : `${G.origem} · zona 12 · há 2h10`}</small></span>${L(arrowRight)}</button>`;
  const OPS: [string, string, string][] = [[truck, 'Chegou um camião', 'ta-chegada'], [pencil, 'Corrigir posição', 'inv-corrigir-posicao'], [search, 'Consultar artigo', 'ta-consultar-artigo'], [mapPin, 'Consultar posição', 'ta-consultar-posicao'], [phone, 'Chamar o gestor', 'ta-chamar']];
  return ecra(`<div class="gp-ola"><h1>Bom dia, Inês</h1><p>${fim ? 'Faltam 2 min · o seu turno acaba às 16h30' : 'Turno das 8h · 8 tarefas à espera no armazém'}</p></div>
    <section class="gp-sec"><h2 class="gp-h">Trabalho</h2>${trabalho}${fim ? '<p class="gp-nota">O motor já não dá o que não cabe em 2 min. Uma tarefa começada acaba-se: ninguém é interrompido.</p>' : ''}</section>
    ${fim ? '' : `<section class="gp-sec"><h2 class="gp-h">Operações</h2><div class="ta-ops">${OPS.map(([ic, t, ir], i) => `<button type="button" class="ta-op${i === OPS.length - 1 ? ' ta-op--chamar' : ''}" data-ir="${ir}" style="--i:${i}">${L(ic)}<span>${t}</span></button>`).join('')}</div></section>`}`,
  T('Início', { barra: comBarra('inicio') }));
}

/* =========================================================
   10 → 11 → 13 → 14 · Arrumar uma palete, e os desvios (12, 15, 16, 17, f1, 18)
   ========================================================= */
type Passo = 'artigo' | 'artigo-errado' | 'escrever-artigo' | 'proposta' | 'ocupada' | 'problema' | 'ler-posicao' | 'ler-posicao-2' | 'posicao-errada' | 'escrever-posicao' | 'arrumada' | 'arrumada-2' | 'foto' | 'registado' | 'sem-rede';
function passo(p: Passo): string {
  const proposta = (i: number) => `<section class="ta-proposta">
      <p class="ta-proposta__n">Vai a · proposta ${i + 1} de 3</p>${posicao(P[i][0])}
      <p class="ta-proposta__pq"><b>Porquê aqui</b>${P[i][1]}</p>
      <p class="ta-proposta__cam">${L(mapPin)}<span>Sai do ${G.origem.toLowerCase()} para a zona 12, coluna ${P[i][0].slice(4, 6)} à esquerda.</span></p></section>`;
  const C: Record<Passo, () => [number, string, string]> = {
    artigo: () => [1, `<h1 class="ta-passo-t">Leia o artigo</h1><p class="gp-nota">A etiqueta da caixa ou da palete que tem à frente.</p>${esperado}${leitor({ titulo: 'Aponte e carregue no gatilho', texto: 'Esperado: ' + A.ref, ir: 'arr-op-destino', tipo: 'arrumar' })}`, `${sec('Não consigo ler — escrever', keyboard, ' data-ir="arr-op-escrever-artigo"')}`],
    'artigo-errado': () => [1, `${aviso('erro', pkgX, 'Não é este artigo', `Leu ${A1.ref}, que já está arrumado. Esta palete é do <b>${A.ref}</b>.`)}${esperado}`, `${acao('Ler outra vez', scanBarcode, ' data-ir="arr-op"')}${sec('Não consigo ler — escrever', keyboard, ' data-ir="arr-op-escrever-artigo"')}`],
    'escrever-artigo': () => [1, `<h1 class="ta-passo-t">Escreva o artigo</h1><p class="gp-nota">A etiqueta não se lê. Escreva a referência que está na caixa.</p><label class="gp-campo"><span>Referência do artigo</span><input value="${A.ref}" autocomplete="off"></label><p class="gp-nota">Fica registado como escrito à mão.</p>`, acao('Confirmar', check, ' data-ir="arr-op-destino"')],
    proposta: () => [2, proposta(0), `${acao('Ler a posição', scanBarcode, ' data-ir="arr-op-ler-posicao"')}<div class="ta-pe2">${sec('Está ocupada', mapPinX, ' data-ir="arr-op-ocupada"')}${sec('Outro problema', circleEllipsis, ' data-ir="arr-op-problema"')}</div>`],
    ocupada: () => [2, `${aviso('aviso', mapPinX, `${P[0][0]} ficou registada como ocupada`, 'O gestor vai ver porque é que o sistema a julgava livre.')}${proposta(1)}<p class="gp-nota">Só pode escolher outra posição se a 3.ª também estiver ocupada.</p>`, `${acao('Ler a posição', scanBarcode, ' data-ir="arr-op-ler-posicao-2"')}<div class="ta-pe2">${sec('Está ocupada', mapPinX, ' data-ir="arr-op-problema"')}${sec('Outro problema', circleEllipsis, ' data-ir="arr-op-problema"')}</div>`],
    problema: () => [2, `<h1 class="ta-passo-t">O que se passa?</h1><p class="ta-onde"><span>Em</span>${posicao(P[0][0], 'gi-pos--peq')}</p>
      <ul class="ta-escolhas" role="list">${([[mapPinX, 'Posição ocupada', 'arr-op-ocupada'], [ruler, 'Não cabe', 'arr-op-ocupada'], [ban, 'Posição inacessível', 'arr-op-ocupada'], [pkgX, 'Artigo danificado', 'arr-op-foto'], [scanLine, 'Etiqueta ilegível', 'arr-op-escrever-posicao'], [circleEllipsis, 'Outro motivo — escrever', 'arr-op-foto']] as const).map(([ic, t, ir], i) => `<li style="--i:${i}"><button type="button" class="ta-escolha" data-ir="${ir}">${L(ic)}<span>${t}</span>${L(arrowRight)}</button></li>`).join('')}</ul>`, sec('Voltar à proposta', arrowLeft, ' data-ir="arr-op-destino"')],
    'ler-posicao': () => [3, `<h1 class="ta-passo-t">Leia a posição</h1><p class="gp-nota">A etiqueta na prateleira onde pousou a palete.</p><div class="ta-alvo"><small>Deve ser</small>${posicao(P[0][0])}</div>${leitor({ titulo: 'Aponte e carregue no gatilho', texto: 'O sistema confirma de novo, ao ler, que a posição ainda serve', ir: 'arr-op-confirmado', tipo: 'arrumar' })}`, sec('Não consigo ler — escrever', keyboard, ' data-ir="arr-op-escrever-posicao"')],
    'ler-posicao-2': () => [3, `<h1 class="ta-passo-t">Leia a posição</h1><p class="gp-nota">A etiqueta na prateleira onde pousou a palete.</p><div class="ta-alvo"><small>Deve ser</small>${posicao(P[1][0])}</div>${leitor({ titulo: 'Aponte e carregue no gatilho', texto: 'O sistema confirma de novo, ao ler, que a posição ainda serve', ir: 'arr-op-arrumada-2', tipo: 'arrumar' })}`, sec('Não consigo ler — escrever', keyboard, ' data-ir="arr-op-escrever-posicao"')],
    'posicao-errada': () => [3, `${aviso('erro', mapPin, 'Não é esta posição', `Leu a 60120403. Devia estar na <b>${P[0][0]}</b>.`)}`, `${acao('Ler outra vez', scanBarcode, ' data-ir="arr-op-ler-posicao"')}${sec('Não consigo ler — escrever', keyboard, ' data-ir="arr-op-escrever-posicao"')}`],
    'escrever-posicao': () => [3, `<h1 class="ta-passo-t">Escreva a posição</h1><p class="gp-nota">Os oito algarismos da etiqueta da prateleira.</p><label class="gp-campo"><span>Código da posição</span><input inputmode="numeric" maxlength="8" value="${P[0][0]}" autocomplete="off"></label><p class="gp-nota">Fica registada como leitura à mão. Se a etiqueta falhar muitas vezes, o sistema aconselha a renová-la.</p>`, acao('Confirmar', check, ' data-ir="arr-op-confirmado"')],
    arrumada: () => [4, arrumada(P[0][0]), `${acao('Próxima tarefa', arrowRight, ' data-ir="ta-inicio"')}`],
    'arrumada-2': () => [4, arrumada(P[1][0]), `${acao('Próxima tarefa', arrowRight, ' data-ir="ta-inicio"')}`],
    foto: () => [2, `<h1 class="ta-passo-t">Artigo danificado</h1><p class="ta-onde"><b>${A.ref}</b><span>${A.desc} · palete 2 de ${G.paletes}</span></p>
      <button type="button" class="ta-foto" data-ir="arr-op-registado">${L(camera)}<span><b>Tirar fotografia</b><small>Opcional. Com fotografia, o gestor decide de onde está.</small></span></button>
      <p class="gp-nota">A fotografia fica presa à incidência, com a hora e o nome de quem a tirou. Serve para decidir, não para arquivar: sai com a incidência quando ela se fecha.</p>`, `${acao('Registar', check, ' data-confirmar data-ir="arr-op-registado"')}${sec('Registar sem fotografia', check, ' data-ir="arr-op-registado"')}`],
    registado: () => [2, `<section class="ta-bloq" role="status">${L(pkgX, 'ta-bloq__ic')}<h1>Artigo danificado</h1><p>Registado às 10h46 com o seu nome.</p></section>${dl([['O gestor', 'foi avisado'], ['A palete', `fica no ${G.origem.toLowerCase()} até ele decidir`], ['A tarefa', 'deixa de ser sua: o motor dá-lhe a seguinte']])}`, acao('Próxima tarefa', arrowRight, ' data-ir="ta-inicio"')],
    'sem-rede': () => [1, `${aviso('erro', wifiOff, 'Sem ligação', 'Não se arruma sem servidor. A palete 1 ficou gravada às 10h38; retoma-se na palete 2.')}`, acao('Tentar de novo', refresh, ' data-ir="arr-op"')],
  };
  const [n, corpo, pe] = C[p]();
  const semFaixa = p === 'arrumada' || p === 'arrumada-2' || p === 'registado';
  return ecra(`${semFaixa ? '' : `${faixa(n)}${passos(n)}`}${corpo}`, T('Arrumar', { voltar: 'ta-inicio', rede: p !== 'sem-rede', pe }));
}
const PASSOS = ['Artigo', 'Proposta', 'Posição', 'Arrumada'];
const passos = (n: number) => `<ol class="gi-passos" aria-label="Passos da palete">${PASSOS.map((t, i) => `<li class="${i < n - 1 ? 'is-feito' : i === n - 1 ? 'is-atual' : ''}"${i === n - 1 ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${t}</span></li>`).join('')}</ol>`;
function arrumada(pos: string): string {
  return `<section class="gi-movido" role="status">${cenaArrumacao()}<h1>Palete arrumada em ${pos}</h1><p>${A.q} × ${A.ref} · registado com o seu nome às 10h44.</p></section>
    ${dl([['Antes', `A aguardar arrumação · ${G.origem.toLowerCase()}`], ['Agora', `Armazenado · ${pos}`], ['Esta guia', `${G.paletes} de ${G.paletes} paletes arrumadas`]])}
    <p class="gp-nota">Era a última palete: a guia fechou, e o motor dá-lhe a seguinte.</p>`;
}

/* =========================================================
   70 · Chamar o gestor → 71 · O gestor foi chamado → a resposta
   ========================================================= */
function chamar(e: 'escolher' | 'chamado' | 'resposta' = 'escolher'): string {
  if (e === 'chamado') return ecra(`<section class="ta-bloq ta-bloq--chamada" role="status">${L(phone, 'ta-bloq__ic')}<h1>O gestor foi chamado</h1><p>Ana Ferreira · avisada às 10h26</p></section>
    <ol class="ta-linha-t" aria-label="O pedido"><li class="is-feito"><b>Pedido enviado</b><small>10h26</small></li><li class="is-atual"><b>Ainda não visto</b><small>—</small></li><li><b>Vem, ou responde daí</b><small>—</small></li></ol>
    ${dl([['A tarefa', 'fica consigo'], ['O motor', 'não lhe dá outra']])}<p class="gp-nota">Ela vê onde está e o que tem em mãos. Se não puder vir, responde pelo PDA — e, se for preciso, faz ela a tarefa.</p>`,
  T('Chamada', { voltar: 'arr-op-destino', pe: `${acao('Continuar a tarefa', play, ' data-ir="arr-op-destino"')}${sec('Ver o pedido', msg, ' data-ir="ta-chamado-resposta"')}` }));
  if (e === 'resposta') return ecra(`<section class="gi-aviso gi-aviso--info ta-resposta" role="status"><span class="gi-aviso__ic">${L(msg)}</span><h1>A Ana Ferreira respondeu</h1><p>Às 10h31, cinco minutos depois de a chamar.</p></section>
    <blockquote class="ta-diz"><small>O que ela diz</small><p>As caixas na ${P[0][0]} são da Valeo e vão sair hoje. Diga «Está ocupada» e siga para a proposta seguinte.</p></blockquote>
    <ol class="ta-linha-t" aria-label="O pedido"><li class="is-feito"><b>Pedido enviado</b><small>10h26</small></li><li class="is-feito"><b>Visto por ela</b><small>10h27</small></li><li class="is-feito"><b>Respondeu daí — não vem</b><small>10h31</small></li></ol>
    <p class="gp-nota">Quem chamou decide se chega: se não chegar, chama outra vez e o pedido sobe de urgência no ecrã dela.</p>`,
  T('Chamada', { voltar: 'arr-op-destino', pe: `${acao('Continuar a tarefa', play, ' data-ir="arr-op-destino"')}${sec('Não chega — chamar outra vez', phone, ' data-ir="ta-chamado"')}` }));
  return ecra(`<h1 class="gp-titulo">Chamar o gestor</h1><p class="gp-nota">Ela vai saber:</p>
    ${dl([['Onde está', `Zona 12 · ${P[0][0]}`], ['O que tem em mãos', `Guia ${G.ref} · palete 2 de ${G.paletes}`]])}
    <p class="gp-nota">Diga-lhe o que é, para ela saber se vem ou se responde daí.</p>
    <ul class="ta-escolhas" role="list">${['Não sei o que fazer a isto', 'O que está aqui não é o que o PDA diz', 'Preciso de ajuda para mexer nisto', 'Outro motivo — escrever'].map((t, i) => `<li style="--i:${i}"><button type="button" class="ta-escolha" data-confirmar data-ir="ta-chamado">${L(i === 3 ? circleEllipsis : msg)}<span>${t}</span>${L(arrowRight)}</button></li>`).join('')}</ul>`,
  T('Chamar o gestor', { voltar: 'arr-op-destino' }));
}

/* =========================================================
   66 · Sair com a guia a meio · 67 · Chegou um camião · 27/28 · Consultar
   ========================================================= */
function sair(): string {
  return ecra(`<h1 class="gp-titulo">Tem a guia ${G.ref} a meio</h1><p class="gp-nota">Falta 1 das ${G.paletes} paletes por arrumar.</p>
    ${dl([['A palete já arrumada', 'fica feita'], ['A que falta', 'volta ao motor'], ['Onde está', G.origem.toLowerCase()]])}
    <p class="gp-nota">Cada palete fica registada assim que é arrumada, por isso não se perde trabalho. O motor dá a que falta à próxima pessoa, e o gestor vê quem saiu com uma guia aberta.</p>`,
  T('Sair', { voltar: 'ta-inicio', pe: `${acao('Continuar a guia', play, ' data-ir="arr-op"')}${sec('Sair mesmo', logOut, ' data-login')}` }));
}
function chegada(e: 'registar' | 'feito' | 'sua' = 'registar'): string {
  if (e !== 'registar') return ecra(`<section class="gi-movido" role="status">${L(circleCheck, 'ta-ok__ic')}<h1>Chegada registada</h1><p>CH-2026-0413 · Transportes Gonçalves · cais 1 · às 10h50.</p></section>
    <p class="gp-nota">${e === 'sua' ? 'A tarefa de picar esta chegada é sua: o motor dá-lha a seguir, no Trabalho.' : 'A tarefa de picar foi para o motor, que a dá a quem estiver livre.'}</p>`,
  T('Chegada', { voltar: 'ta-inicio', pe: acao('Voltar ao início', arrowLeft, ' data-ir="ta-inicio"') }));
  return ecra(`<h1 class="gp-titulo">Chegou um camião</h1><p class="gp-nota">O sistema não sabe o que vem a caminho. Enquanto isto não for registado, o camião não existe para o motor.</p>
    <label class="gp-campo"><span>Quem trouxe</span><input value="Transportes Gonçalves"></label>
    <label class="gp-campo"><span>Onde encostou</span><input value="Cais 1"></label>
    <p class="gp-nota">Quantas paletes vieram conta-as quem for picar. Isto só cria a tarefa — e é agora que o relógio começa.</p>`,
  T('Chegada', { voltar: 'ta-inicio', pe: `${acao('Registar e ficar com ela', check, ' data-confirmar data-ir="ta-chegada-sua"')}${sec('Só registar', check, ' data-ir="ta-chegada-feita"')}` }));
}
function consultar(k: 'artigo' | 'posicao'): string {
  if (k === 'artigo') return ecra(`${leitor({ titulo: 'Leia o artigo, ou escreva a referência', texto: 'Só para ver: não muda nada', tipo: 'consulta' })}
    <section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${A.ref}</p><p class="gi-artigo__desc">${A.desc} · vai para a zona 12</p></div></section>
    <h2 class="gp-h">Onde está</h2>${dl([[P[1][0], '24 un.'], ['60120403', '8 un.'], [G.origem, `${A.q} a arrumar`]])}
    <p class="gp-nota">A consulta não muda nada. O trabalho continua onde estava.</p>`, T('Consultar artigo', { voltar: 'ta-inicio', pe: sec('Voltar', arrowLeft, ' data-ir="ta-inicio"') }));
  return ecra(`${leitor({ titulo: 'Leia a posição', texto: 'Só para ver: não muda nada', tipo: 'consulta' })}
    <div class="ta-alvo"><small>Posição</small>${posicao(P[1][0])}</div>
    ${dl([['Artigo', `${A.ref} · ${A.desc}`], ['Quantidade', '24 un.'], ['Última entrada', '29/10 · Inês Rocha']])}
    <button type="button" class="ta-escolha" data-ir="inv-corrigir-posicao">${L(pencil)}<span>Não é isto que lá está? Corrigir</span>${L(arrowRight)}</button>`, T('Consultar posição', { voltar: 'ta-inicio', pe: sec('Voltar', arrowLeft, ' data-ir="ta-inicio"') }));
}

/* =========================================================
   Gestor · a chamada e o problema registado (73 v3, 79 v3)
   ========================================================= */
function gestorChamada(e: 'ver' | 'respondido' = 'ver'): string {
  const GG: Opcoes = { titulo: 'Chamada', voltar: 'arr-excecoes', gestor: true, funcao: 'Gestor' };
  if (e === 'respondido') return ecra(`<section class="gi-movido" role="status">${L(msg, 'ta-ok__ic')}<h1>Resposta enviada à Inês</h1><p>Chega ao PDA dela; a tarefa continua com ela.</p></section>`, { ...GG, pe: `${acao('Ver no PDA da Inês', play, ' data-ir="ta-chamado-resposta"')}${sec('Voltar às exceções', arrowLeft, ' data-ir="arr-excecoes"')}` });
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">A Inês chamou</h1><span class="gp-tag gp-tag--validar">10h26</span></div>
    ${dl([['Motivo', 'O que está aqui não é o que o PDA diz'], ['Onde está', `Zona 12 · ${P[0][0]}`], ['O que tem em mãos', `${G.ref} · palete 2 de ${G.paletes} · ${A.ref}`]])}
    <label class="gp-campo"><span>Responder daí</span><input value="As caixas na ${P[0][0]} são da Valeo e vão sair hoje. Diga «Está ocupada» e siga para a proposta seguinte."></label>`,
  { ...GG, pe: `${acao('Enviar a resposta', msg, ' data-confirmar data-ir="arr-chamada-respondida"')}${sec('Vou aí', arrowRight, ' data-ir="arr-chamada-respondida"')}` });
}
function gestorProblema(e: 'ver' | 'feito' = 'ver'): string {
  const GG: Opcoes = { titulo: 'Problema', voltar: 'arr-excecoes', gestor: true, funcao: 'Gestor' };
  if (e === 'feito') return ecra(`<section class="gi-movido" role="status">${cenaArrumacao()}<h1>A palete volta ao motor</h1><p>Passou na verificação: o motor dá-a a quem estiver livre na arrumação. Fica no histórico da guia quem decidiu e porquê.</p></section>`, { ...GG, pe: sec('Voltar às exceções', arrowLeft, ' data-ir="arr-excecoes"') });
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${G.ref}</h1><span class="gp-tag gp-tag--erro">Problema</span></div>
    <section class="ta-caso"><p class="ta-caso__mot">${L(pkgX)}<span><b>Artigo danificado</b><small>Registado pela Inês Rocha às 10h46 · com fotografia</small></span></p>
    ${dl([['Artigo', `${A.ref} · ${A.desc} · ${A.q} un.`], ['Palete', `2 de ${G.paletes} · no ${G.origem.toLowerCase()}`], ['Já arrumada', `${A1.ref} · palete 1`]])}</section>
    <p class="gp-nota">A palete fica no cais até decidir. A tarefa já não é da Inês: quando a palete voltar ao motor, ele dá-a a quem estiver livre.</p>
    <label class="gp-campo"><span>O que se decidiu</span><input value="Só a caixa de cima está molhada: tirada para quarentena Q-02"></label>`,
  { ...GG, pe: `${acao('Devolver a palete ao motor', check, ' data-confirmar data-ir="arr-problema-resolvido"')}` });
}
function excecoesV3(): string {
  const xs: [string, string, string, string, string][] = [
    [phone, 'Chamada · a Inês', `${G.ref} · zona 12 · às 10h26`, 'Responder', 'arr-problema-chamada'],
    [pkgX, 'Artigo danificado', `${G.ref} · palete 2 · ${A.ref}`, 'Decidir', 'arr-problema'],
    [mapPinX, 'Posição ocupada', `${P[0][0]} · registada pela Inês · o sistema julgava-a livre`, 'Ver a posição', 'g-posicao'],
  ];
  return ecra(`<h1 class="gp-titulo">Exceções</h1>
    <ul class="gp-lista" role="list">${xs.map(([ic, t, x, b, ir], i) => `<li style="--i:${i}"><div class="gi-exc"><span class="gi-exc__ic">${L(ic)}</span><div><b>${t}</b><small>${x}</small></div><button type="button" class="gp-btn gp-btn--acao" data-ir="${ir}">${L(arrowRight)}<span>${b}</span></button></div></li>`).join('')}</ul>`,
  { titulo: 'Exceções', voltar: 'arr-inicio', gestor: true, funcao: 'Gestor' });
}

/* =========================================================
   Os ecrãs: versões novas dos que ficam, ecrãs novos, e os que saem
   ========================================================= */
const NOTA = 'A Arrumação como nos documentos (30 out., ela: «só podem fazer aquilo que deixei nos docs»): 07 · O menu da app e os ecrãs 02–28, 66, 67, 70 e 71 — a guia do motor, palete a palete, Chamar o gestor; sem tarefas, histórico, números nem atribuição.';
/** Os ecrãs que a Arrumação deixa de ter (ficam no código, saem da Pick) */
export const SAEM_DA_ARRUMACAO = new Set([
  'ta-inicio-nova', 'ta-inicio-vazia', 'ta-inicio-seguinte', 'ta-inicio-resolvida', 'ta-inicio-erro', 'ta-guia', 'ta-tarefas', 'ta-tarefas-bloq', 'ta-tarefas-feitas', 'ta-tarefas-vazia', 'ta-historico', 'ta-hist-det',
  'ta-problema', 'ta-problema-escolhido', 'ta-problema-a-enviar', 'ta-problema-sem-rede', 'ta-problema-mudou', 'ta-problema-bloqueada', 'ta-problema-foto',
  'ta-enviado', 'ta-enviado-a-ver', 'ta-resolvido', 'ta-reatribuida', 'ta-cancelada', 'ta-libertada', 'ta-continua-bloqueada',
  'arr-guia-a-atribuir', 'arr-guia-atribuida', 'arr-guia-ja-atribuida',
  'arr-problema-a-gravar', 'arr-problema-reatribuir', 'arr-problema-libertar', 'arr-problema-manter', 'arr-problema-reatribuida', 'arr-problema-libertada', 'arr-problema-mantida',
  'arr-op-quantidade', 'arr-op-a-confirmar', 'arr-op-destino-errado', 'arr-op-bloqueada', 'arr-op-parcial', 'arr-op-desconhecida', 'arr-op-recusado', 'arr-op-sem-leitor', 'arr-op-sessao', 'arr-op-concluida-outro',
  'arr-op-retomar', 'arr-op-retomar-artigo', 'arr-op-retomar-destino', 'arr-op-retomar-quantidade', 'arr-op-retomar-ok', 'arr-op-retomar-resumo', 'arr-op-retomar-mesmo', 'arr-op-seguinte', 'arr-op-seg-artigo', 'arr-op-seg-quantidade', 'arr-op-seg-destino', 'arr-op-seg-resumo', 'arr-op-seg-ok',
  /* as páginas da função Arrumação de 27 out. (58 Tarefas, 59 Ler, 67 Histórico, 68 Mais): não estão nos documentos */
  /* e as páginas «o módulo ainda não está na Pick» da Separação e da Expedição (57.3, 57.4): já estão (separacao-expedicao.ts) */
  'op-separacao', 'op-expedicao',
  'op-tarefas', 'op-ler', 'op-ler-lido', 'op-ler-sem-contexto', 'op-historico', 'op-historico-vazio', 'op-mais', 'op-mais-separacao', 'op-mais-expedicao',
  'arr-op-origem-errada', 'arr-op-artigo-desconhecido', 'arr-op-qtd-invalida', 'arr-op-resumo', 'arr-op-destino-parcial', 'arr-op-resumo-parcial', 'arr-op-parcial-ok',
]);
export function ecrasArrumadorV3(): Ecra<string>[] {
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<string> => ({ id, nome, fluxo: 'Arrumação', objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  return [
    e('ta-inicio-sem', '85.1 · Sem trabalho', 'O motor não tem nada para a Inês: diz-se, e não se mostra a fila.', inicio('sem'), 'ta-inicio'),
    e('ta-inicio-fim-turno', '85.2 · Fim do turno à vista (68)', 'Faltam 2 min: o motor só dá o que cabe, e as Operações saem da frente.', inicio('fim-turno'), 'ta-inicio'),
    e('arr-op-escrever-artigo', '80.2 · Escreve o artigo (16)', 'A etiqueta não se lê: escreve-se a referência; fica registado como escrito à mão.', passo('escrever-artigo'), 'arr-op'),
    e('arr-op-problema', '80.4 · O que se passa? (15)', 'Com um toque: ocupada, não cabe, inacessível (proposta seguinte), artigo danificado (fotografia), etiqueta ilegível (escrever).', passo('problema'), 'arr-op'),
    e('arr-op-ler-posicao', '80.5 · Lê a posição (13)', 'Confirmar pela leitura que a palete ficou na posição proposta.', passo('ler-posicao'), 'arr-op'),
    e('arr-op-ler-posicao-2', '80.6 · Lê a posição (proposta 2)', 'A mesma leitura, na proposta 2.', passo('ler-posicao-2'), 'arr-op'),
    e('arr-op-posicao-errada', '80.7 · Não é esta posição', 'Leu outra posição: não se arruma lá; lê-se outra vez.', passo('posicao-errada'), 'arr-op'),
    e('arr-op-escrever-posicao', '80.8 · Escreve a posição (17)', 'Os 8 algarismos à mão; conta para aconselhar a renovar a etiqueta.', passo('escrever-posicao'), 'arr-op'),
    e('arr-op-arrumada-2', '80.9 · Arrumada (proposta 2)', 'A palete ficou na proposta 2.', passo('arrumada-2'), 'arr-op'),
    e('arr-op-foto', '80.10 · Fotografia (f1)', 'Opcional; fica presa à incidência.', passo('foto'), 'arr-op'),
    e('arr-op-registado', '80.11 · Problema registado (18)', 'O gestor foi avisado; a palete fica onde está; a tarefa deixa de ser da pessoa e o motor dá a seguinte.', passo('registado'), 'arr-op'),
    e('ta-chamar', '86 · Chamar o gestor (70)', 'Sem largar a tarefa: onde está, o que tem em mãos, e o motivo com um toque.', chamar()),
    e('ta-chamado', '86.1 · O gestor foi chamado (71)', 'A tarefa fica consigo e o motor não dá outra; «Continuar a tarefa».', chamar('chamado'), 'ta-chamar'),
    e('ta-chamado-resposta', '86.2 · O gestor respondeu', 'A resposta, a linha do pedido e «Não chega — chamar outra vez».', chamar('resposta'), 'ta-chamar'),
    e('ta-sair', '87 · Sair com a guia a meio (66)', 'O que fica feito e o que volta ao motor; «Continuar a guia» ou «Sair mesmo».', sair()),
    e('ta-chegada', '88 · Chegou um camião (67)', 'Registar a chegada, que é o que cria a tarefa de picar.', chegada()),
    e('ta-chegada-feita', '88.1 · Só registar', 'A tarefa de picar vai para o motor.', chegada('feito'), 'ta-chegada'),
    e('ta-chegada-sua', '88.2 · Registar e ficar com ela', 'A tarefa de picar é de quem registou.', chegada('sua'), 'ta-chegada'),
    e('ta-consultar-artigo', '89 · Consultar artigo (27)', 'Onde está um artigo e quanto há; só de ver.', consultar('artigo')),
    e('ta-consultar-posicao', '100 · Consultar posição (28)', 'O que está numa posição; se não bater, corrigir.', consultar('posicao')),
    e('arr-problema-chamada', '79.1 · A Inês chamou', 'A chamada no Gestor: o motivo, onde está e o que tem em mãos; responder daí ou ir lá.', gestorChamada()),
    e('arr-chamada-respondida', '79.2 · Resposta enviada', 'Chega ao PDA da Inês.', gestorChamada('respondido'), 'arr-problema-chamada'),
  ];
}
/** Versões novas dos ecrãs que ficam, e tira os que saem */
export function comArrumadorV3<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, [string, () => string, string?]> = {
    'ta-inicio': ['85 · Início da Arrumação (02)', () => inicio(), 'O início dos documentos: «Bom dia», o turno e o trabalho à espera no armazém; Trabalho com uma opção só (a guia que o motor deu); Operações: Chegou um camião, Corrigir posição, Consultar artigo, Consultar posição, Chamar o gestor; Tarefa · Início · Sair.'], 'ta-inicio-carregar': ['85.3 · A carregar', () => inicio('carregar')], 'ta-inicio-sem-rede': ['85.4 · Sem ligação (62)', () => inicio('sem-rede'), 'Não há menu: o ecrã diz desde quando, o que ficou gravado e «Tentar de novo».'], 'ta-inicio-sessao': ['85.5 · Sessão terminada', () => inicio('sessao')],
    'arr-op': ['80 · Arrumar uma palete (10 · Lê o artigo)', () => passo('artigo'), 'A guia que o motor deu, palete a palete: lê-se o artigo da palete que se tem à frente.'],
    'arr-op-artigo-errado': ['80.12 · Não é este artigo', () => passo('artigo-errado')],
    'arr-op-destino': ['80.1 · Vai à proposta (11)', () => passo('proposta'), 'Para onde levar a palete, e porquê: proposta 1 de 3, com o caminho; «Ler a posição», «Está ocupada» ou «Outro problema».'],
    'arr-op-confirmado': ['80.13 · Arrumada (14)', () => passo('arrumada'), 'Registado com o nome de quem arrumou; antes e agora; a guia fecha na última palete e o motor dá a seguinte.'],
    'arr-op-sem-rede': ['80.14 · Sem ligação', () => passo('sem-rede')],
    'arr-op-ocupada': ['80.3 · Proposta seguinte (12)', () => passo('ocupada'), 'A posição ficou registada como ocupada; o gestor vai ver porquê; vai-se à proposta 2 de 3.'],
    'arr-excecoes': ['73 · Exceções da arrumação', excecoesV3],
    'arr-problema': ['79 · Problema registado (Gestor)', () => gestorProblema(), 'O problema que a arrumação registou: o que é, quem, a palete; o Gestor decide e devolve a palete ao motor — não a dá a ninguém.'],
    'arr-problema-resolvido': ['79.3 · A palete volta ao motor', () => gestorProblema('feito')],
  };
  /* o 10 · Lê o artigo é o próprio 80 (o arr-op-artigo era o «ler o artigo» depois da origem, que os documentos não têm) */
  return ecras.filter((x) => !SAEM_DA_ARRUMACAO.has(x.id) && x.id !== 'arr-op-artigo')
    .map((x) => { const v = V[x.id]; return v ? { ...x, nome: v[0], ...(v[2] ? { objetivo: v[2] } : {}), versoes: [...x.versoes, { id: `v${x.versoes.length + 1}`, nota: NOTA, html: v[1]() }] as Ecra<T>['versoes'] } : x; });
}
