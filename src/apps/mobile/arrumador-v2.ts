/* =========================================================
   PICK — o trabalhador da Arrumação, V2 (30 out. 2026), do briefing «Figma interativo V2 · Trabalhador de Arrumação»
   Versões novas dos ecrãs do 30 out. (85–88, 79 e o 80), e os que faltavam: 89 · As minhas tarefas, 100 · Histórico de
   arrumações e 101 · a arrumação no histórico. Um só percurso de arrumar — o 80, agora pela ordem do briefing:
     Tarefa → Origem → Artigo → Quantidade → Destino → Confirmação,
   com os comandos «Simular…» da demonstração em cada leitura, e as quatro decisões do Gestor (destino novo, outra pessoa,
   posição libertada, continua bloqueada), cada uma com o ecrã que chega ao PDA da Inês.
   O que está decidido e muda o briefing:
     - a pessoa não vê a fila (24 set., e ela de novo hoje, «fazer, sem a fila»): nas Tarefas e no Início só o que é dela —
       em curso, bloqueadas, concluídas —, sem «Por iniciar» nem «Ver todas»; a seguinte entrega-a o motor;
     - a origem é o cais e lê-se a etiqueta da palete (não há «REC-A03»); os destinos são posições de 8 algarismos;
     - o Inventário é de todos (30 out.): as contagens ficam no Início;
     - só com rede; nada se dá como arrumado antes de o servidor confirmar («A registar…» no Confirmar).
   A barra da Arrumação passa a Início · Tarefas · Ler · Mais (o briefing; o Histórico vai para o Mais).
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, esperar, aviso, posicao, quantidade, L, leitor, type Opcoes } from './inventario-v2';
import { GUIAS, cenaArrumacao } from './arrumacao';
import { barra } from './navegacao';
import { asMinhasContagens } from './inventario-estados';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
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
import imageIc from 'lucide-static/icons/image.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import userRoundX from 'lucide-static/icons/user-round-x.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import msg from 'lucide-static/icons/message-square-warning.svg?raw';
import unlock from 'lucide-static/icons/lock-open.svg?raw';
import smartphone from 'lucide-static/icons/smartphone.svg?raw';

/* ---------- os dados: a GA-2026-0330 da Inês, no artigo 2 de 2 (o 1 já está arrumado) ---------- */
const INES = { nome: 'Inês Rocha', iniciais: 'IR' };
const G = GUIAS[1], A1 = G.linhas[0], A = G.linhas[1], SEG = GUIAS[0];
const D = G.destino, NOVO = '60120402', HORA = '10:42', DIA = '30/10/2026', PARCIAL = 10;
const T = (titulo: string, extra: Opcoes = {}): Opcoes => ({ titulo, funcao: 'Arrumação', quem: INES, ...extra });
const comBarra = (ativo: string) => barra('arrumacao', ativo);
const naoConsigo = (motivo = '') => `<button type="button" class="ta-nao" data-ir="${motivo ? `ta-problema-${motivo}` : 'ta-problema'}">${L(octagon)}<span>Não consigo arrumar</span></button>`;
const simular = (...b: [string, string][]) => `<div class="ta-sim" role="group" aria-label="Demonstração: simular a leitura"><small>Demonstração</small>${b.map(([t, ir]) => `<button type="button" data-ir="${ir}">${t}</button>`).join('')}</div>`;
const dl = (linhas: [string, string][]) => `<dl class="ta-resumo">${linhas.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;

/* =========================================================
   85 v2 · As minhas arrumações (o Início)
   ========================================================= */
type E85 = 'normal' | 'nova' | 'sem' | 'seguinte' | 'resolvida' | 'carregar' | 'sem-rede' | 'servidor' | 'sessao';
function inicio(e: E85 = 'normal'): string {
  if (e === 'carregar') return ecra(`<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A carregar as suas arrumações…</p><div class="gp-esq"><i></i><i></i><i></i></div>`, T('Início', { barra: comBarra('inicio') }));
  if (e === 'sem-rede') return ecra(aviso('erro', wifiOff, 'Sem rede', 'A Pick precisa de rede: não mostra uma tarefa velha como se fosse de agora. Continua sozinha quando houver sinal.'), T('Início', { rede: false, pe: acao('Tentar outra vez', refresh, ' data-ir="ta-inicio"') }));
  if (e === 'servidor') return ecra(aviso('erro', serverOff, 'O servidor não respondeu', 'Não foi possível ler as suas arrumações. Nada mudou: a palete fica onde está.') + '<p class="gi-ref">Referência <code>PK-3010-B2C4</code></p>', T('Início', { pe: acao('Tentar outra vez', refresh, ' data-ir="ta-inicio"') }));
  if (e === 'sessao') return ecra(aviso('aviso', clock, 'A sessão terminou', 'Entre outra vez: a tarefa continua sua, no mesmo passo.'), T('Início', { pe: acao('Entrar outra vez', logIn, ' data-login') }));
  const n = e === 'seguinte' ? [1, 1, 2] : e === 'sem' ? [0, 0, 3] : e === 'resolvida' ? [1, 0, 2] : [1, 0, 2];
  const prox = e === 'seguinte' || e === 'nova' ? { g: SEG, l: SEG.linhas[0], dest: SEG.destino, est: ['Nova', 'planeada'], passo: 'artigo 1 de 3', ir: 'arr-op-seguinte' }
    : { g: G, l: A, dest: e === 'resolvida' ? NOVO : D, est: e === 'resolvida' ? ['Atualizada', 'validar'] : ['Em curso', 'curso'], passo: 'artigo 2 de 2', ir: e === 'resolvida' ? 'ta-resolvido' : 'arr-op' };
  const cartao = e === 'sem' ? `<section class="gi-vazio">${L(inbox)}<p><b>Não tem arrumações agora.</b> Quando houver mercadoria para arrumar, o sistema entrega-lhe a tarefa aqui.</p></section>`
    : `<section class="gi-dom ta-prox${e === 'resolvida' ? ' ta-guia--nova' : ''}" aria-labelledby="ta-t85">
      <p class="gi-tarefa__rot">${L(box)}Próxima tarefa</p>
      <div class="gi-tarefa__cab"><b id="ta-t85">${prox.g.ref}</b><span class="gp-tag gp-tag--${prox.est[1]}">${prox.est[0]}</span></div>
      <div class="ta-prox__art"><b>${prox.l.ref}</b><span>${prox.l.desc}</span><strong>${prox.l.q} un.</strong></div>
      <p class="gi-percurso"><span>${L(truck)}${prox.g.origem}</span>${L(arrowRight, 'gi-percurso__seta')}${posicao(prox.dest, 'gi-pos--peq')}</p>
      <small class="ta-prox__passo">${prox.passo} · da ${prox.g.ch}</small>
      ${e === 'resolvida' ? `<p class="ta-mudou">${L(mapPin)}<span>O gestor mudou o destino: a ${D} estava ocupada.</span></p>` : ''}
      ${acao(e === 'resolvida' ? 'Ver a tarefa atualizada' : 'Iniciar arrumação', e === 'resolvida' ? arrowRight : scanBarcode, ` data-ir="${prox.ir}"`)}
    </section>`;
  return ecra(`<div class="ta-ola">${cenaArrumacao(true)}<div><h1>As minhas arrumações</h1><p>${INES.nome} · armazém 60</p></div></div>
    <div class="gi-tres ta-tres">${([['Em curso', 'ta-tarefas'], ['Bloqueadas', 'ta-tarefas-bloq'], ['Concluídas hoje', 'ta-tarefas-feitas']] as const).map(([t, ir], i) => `<button type="button" class="gi-num${i === 1 && n[1] ? ' is-aviso' : ''}" data-ir="${ir}"><b>${n[i]}</b><span>${t}</span></button>`).join('')}</div>
    ${cartao}
    ${asMinhasContagens([0, 0, 1])}`, T('Início', { barra: comBarra('inicio') }));
}

/* =========================================================
   89 · As minhas tarefas (só as da pessoa: a fila é do motor)
   ========================================================= */
type Linha89 = { ref: string; art: string; desc: string; q: number; origem: string; dest: string; est: 'curso' | 'bloq' | 'feita'; ir: string; hora?: string };
function tarefas(sel: 'curso' | 'bloq' | 'feita' = 'curso', depoisDoProblema = false, vazia = false): string {
  const L89: Linha89[] = vazia ? [] : [
    depoisDoProblema ? { ref: SEG.ref, art: SEG.linhas[0].ref, desc: SEG.linhas[0].desc, q: SEG.linhas[0].q, origem: SEG.origem, dest: SEG.destino, est: 'curso', ir: 'arr-op-seguinte' }
      : { ref: G.ref, art: A.ref, desc: A.desc, q: A.q, origem: G.origem, dest: D, est: 'curso', ir: 'ta-guia' },
    ...(depoisDoProblema ? [{ ref: G.ref, art: A.ref, desc: A.desc, q: A.q, origem: G.origem, dest: D, est: 'bloq' as const, ir: 'ta-enviado' }] : []),
    { ref: 'GA-2026-0325', art: A1.ref, desc: A1.desc, q: A1.q, origem: G.origem, dest: D, est: 'feita', ir: 'ta-hist-det', hora: '07:50' },
    { ref: 'GA-2026-0327', art: 'SKF 6204-2RSH', desc: 'Rolamento rígido de esferas', q: 50, origem: 'Cais 1', dest: '60100802', est: 'feita', ir: 'ta-hist-det', hora: '08:12' },
  ];
  const SEPS: [Linha89['est'], string][] = [['curso', 'Em curso'], ['bloq', 'Bloqueadas'], ['feita', 'Concluídas']];
  const TAG = { curso: ['Em curso', 'curso'], bloq: ['Aguarda o gestor', 'erro'], feita: ['Concluída', 'ok'] };
  const VAZIO = { curso: 'Não tem nenhuma arrumação em curso. A seguinte chega pelo motor, no Início.', bloq: 'Nenhuma arrumação bloqueada.', feita: 'Ainda não concluiu nenhuma arrumação hoje.' };
  return ecra(`<h1 class="gp-titulo">As minhas tarefas</h1>
    <div class="gp-filtros" role="tablist" aria-label="Estado">${SEPS.map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === sel}" data-gi-sep="${k}">${t} <span>${L89.filter((x) => x.est === k).length}</span></button>`).join('')}</div>
    ${SEPS.map(([k]) => { const xs = L89.filter((x) => x.est === k); return `<ul class="gp-lista ta-lista" role="list" data-gi-painel="${k}"${k === sel ? '' : ' hidden'}>${xs.length ? xs.map((x, i) => `<li style="--i:${i}"><button type="button" class="ta-linha ta-linha--${x.est}" data-ir="${x.ir}">
        <span class="ta-linha__cab"><b>${x.ref}</b><span class="gp-tag gp-tag--${TAG[x.est][1]}">${TAG[x.est][0]}</span></span>
        <span class="ta-linha__art"><b>${x.art}</b> ${x.desc} · ${x.q} un.</span>
        <span class="ta-linha__pc">${L(truck)}${x.origem}${L(arrowRight)}<code>${x.dest}</code>${x.hora ? `<small>às ${x.hora}</small>` : ''}</span></button></li>`).join('') : `<li><p class="gi-vazio-l">${VAZIO[k]}</p></li>`}</ul>`; }).join('')}
    <p class="gp-nota">A fila não se mostra: o motor entrega-lhe uma arrumação de cada vez.</p>`,
  T('Tarefas', { barra: comBarra('tarefas') }));
}

/* =========================================================
   86 v2 · Detalhe da tarefa
   ========================================================= */
function detalhe(): string {
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${G.ref}</h1><span class="gp-tag gp-tag--curso">Em curso</span></div>
    <section class="ta-det">
      <div class="ta-det__art">${L(pkg)}<div><b>${A.ref}</b><span>${A.desc}</span></div><strong>${A.q} <small>un.</small></strong></div>
      <p class="gi-percurso"><span>${L(truck)}${G.origem}</span>${L(arrowRight, 'gi-percurso__seta')}${posicao(D, 'gi-pos--peq')}</p>
      ${dl([['Receção', `${G.ch} · registada às 08:40`], ['Na guia', `${G.linhas.length} artigos · ${A1.ref} já arrumado`], ['Unidade', 'un. (à unidade)']])}
    </section>`,
  T('Tarefa', { voltar: 'ta-tarefas', pe: `${acao('Começar', play, ' data-ir="arr-op"')}${sec('Comunicar problema', octagon, ' data-ir="ta-problema"')}` }));
}

/* =========================================================
   80 v3 · Arrumar: origem → artigo → quantidade → destino → confirmar
   ========================================================= */
const PASSOS = ['Origem', 'Artigo', 'Quant.', 'Destino', 'Confirmar'];
const passos = (n: number) => `<ol class="gi-passos ta-passos" aria-label="Passos da arrumação">${PASSOS.map((p, i) => `<li class="${i < n ? 'is-feito' : i === n ? 'is-atual' : ''}"${i === n ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${p}</span></li>`).join('')}</ol>`;
interface Cfg { dest: string; q: number; ids: Record<string, string>; banner?: string; g?: typeof G; a?: typeof A; n?: string; semSim?: boolean }
const GUIA = G, ARTIGO = A;
const BASE: Cfg = { dest: D, q: A.q, ids: {} };
type Passo = 'origem' | 'origem-errada' | 'artigo' | 'artigo-errado' | 'artigo-desconhecido' | 'quantidade' | 'parcial' | 'qtd-invalida' | 'destino' | 'destino-errado' | 'bloqueada' | 'ocupada' | 'resumo' | 'a-confirmar' | 'confirmado' | 'parcial-ok' | 'sem-leitor' | 'sem-rede' | 'recusado';
const N: Record<Passo, number> = { origem: 0, 'origem-errada': 0, artigo: 1, 'artigo-errado': 1, 'artigo-desconhecido': 1, quantidade: 2, parcial: 2, 'qtd-invalida': 2, destino: 3, 'destino-errado': 3, bloqueada: 3, ocupada: 3, resumo: 4, 'a-confirmar': 4, confirmado: 5, 'parcial-ok': 5, 'sem-leitor': 0, 'sem-rede': 0, recusado: 4 };
function passo(p: Passo, c: Cfg = BASE): string {
  /* a guia e o artigo da tarefa (a GA-2026-0330 por omissão; a seguinte, GA-2026-0331, no percurso «seg») */
  const G = c.g ?? GUIA, A = c.a ?? ARTIGO;
  const id = (k: string) => c.ids[k] ?? k;
  const sim = (...b: [string, string][]) => c.semSim ? '' : simular(...b);
  const q = c.q, parc = q < A.q;
  const topo = `<div class="ta-topo"><p><b>${G.ref}</b><small>${c.n ?? 'artigo 2 de 2'}</small></p>${naoConsigo(p === 'bloqueada' ? 'bloqueada' : p === 'ocupada' ? 'escolhido' : '')}</div>${c.banner && p === 'origem' ? `<p class="ta-mudou">${L(mapPin)}<span>${c.banner}</span></p>` : ''}${passos(N[p])}`;
  const art = (meta = `${A.q} un. na guia`) => `<section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${A.ref}</p><p class="gi-artigo__desc">${A.desc}</p><p class="gi-artigo__meta">${meta}</p></div></section>`;
  const alvo = `<div class="ta-alvo"><small>Destino proposto</small>${posicao(c.dest)}</div>`;
  const qtdSim = sim([`Exata (${A.q})`, id('arr-op-destino')], [`Parcial (${PARCIAL})`, id('arr-op-parcial')], ['Inválida (20)', id('arr-op-qtd-invalida')]);
  const t = (s: string) => `<h1 class="ta-passo-t">${s}</h1>`;
  const C: Record<Passo, () => [string, string]> = {
    origem: () => [`${t('Ler a origem')}<p class="ta-esperado">${L(truck)}<b>${G.origem}</b><span>a etiqueta da palete da ${G.ch}</span></p>${leitor({ titulo: 'Leia a palete', texto: `No ${G.origem.toLowerCase()}`, ir: id('arr-op-artigo'), tipo: 'arrumar' })}${sim(['Simular leitura correta', id('arr-op-artigo')], ['Simular origem errada', id('arr-op-origem-errada')])}`, sec('Escrever à mão', scanLine, ` data-ir="${id('arr-op-artigo')}"`)],
    'origem-errada': () => [`${t('Ler a origem')}${aviso('erro', truck, 'Esta palete não é da guia', `Leu a palete da CH-2026-0412, no cais 1. A ${G.ref} está no <b>${G.origem.toLowerCase()}</b>.`)}`, acao('Ler outra vez', scanBarcode, ` data-ir="${id('arr-op')}"`)],
    artigo: () => [`${t('Ler o artigo')}${art()}${leitor({ titulo: 'Leia o artigo', texto: `Na palete: ${A.ref}`, ir: id('arr-op-quantidade'), tipo: 'arrumar' })}${sim(['Código certo', id('arr-op-quantidade')], ['Artigo errado', id('arr-op-artigo-errado')], ['Código desconhecido', id('arr-op-artigo-desconhecido')])}`, sec('Escrever à mão', scanLine, ` data-ir="${id('arr-op-quantidade')}"`)],
    'artigo-errado': () => [`${t('Ler o artigo')}${aviso('erro', pkgX, 'Este artigo não é da guia', `Leu ${A1.ref}, que já está arrumado. Deixe-o na palete e leia o <b>${A.ref}</b>.`)}`, acao('Ler outra vez', scanBarcode, ` data-ir="${id('arr-op-artigo')}"`)],
    'artigo-desconhecido': () => [`${t('Ler o artigo')}${aviso('erro', scanLine, 'Código desconhecido', 'Este código não corresponde a nenhum artigo. Leia a etiqueta do artigo; se estiver ilegível, comunique o problema.')}`, `${acao('Ler outra vez', scanBarcode, ` data-ir="${id('arr-op-artigo')}"`)}`],
    quantidade: () => [`${t('Confirmar quantidade')}${art(`A guia tem ${A.q} un.`)}${quantidade(String(A.q), { rotulo: 'Quantas vai arrumar?' })}${qtdSim}`, acao('Confirmar quantidade', check, ` data-ir="${id('arr-op-destino')}"`)],
    parcial: () => [`${t('Confirmar quantidade')}${art(`A guia tem ${A.q} un.`)}${quantidade(String(PARCIAL), { rotulo: 'Quantas vai arrumar?' })}${aviso('aviso', hash, 'Arrumação parcial', `Arruma ${PARCIAL} de ${A.q}. As ${A.q - PARCIAL} que faltam ficam na guia, pendentes, no ${G.origem.toLowerCase()}.`)}`, acao(`Confirmar ${PARCIAL}`, check, ` data-ir="${id('arr-op-destino-parcial')}"`)],
    'qtd-invalida': () => [`${t('Confirmar quantidade')}${art(`A guia tem ${A.q} un.`)}${quantidade('20', { rotulo: 'Quantas vai arrumar?', erro: `A guia tem ${A.q}: não se arrumam mais do que as que vieram. Se na palete há mais, comunique o problema.` })}`, `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande" disabled aria-disabled="true">${L(check)}<span data-rotulo>Confirmar quantidade</span></button>`],
    destino: () => [`${t('Ler o destino')}${alvo}${art(`${q} un. a arrumar${parc ? ` · ${A.q - q} ficam pendentes` : ''}`)}${leitor({ titulo: 'Leia a posição de destino', texto: 'Só a posição proposta aceita o movimento', ir: id(parc ? 'arr-op-resumo-parcial' : 'arr-op-resumo'), tipo: 'arrumar' })}${sim(['Destino certo', id(parc ? 'arr-op-resumo-parcial' : 'arr-op-resumo')], ['Destino errado', id('arr-op-destino-errado')], ['Posição bloqueada', id('arr-op-bloqueada')], ['Posição ocupada', id('arr-op-ocupada')])}`, sec('Escrever à mão', scanLine, ` data-ir="${id(parc ? 'arr-op-resumo-parcial' : 'arr-op-resumo')}"`)],
    'destino-errado': () => [`${t('Ler o destino')}${aviso('erro', mapPin, 'Este não é o destino proposto', `Leu a 60120403. O movimento só se confirma na <b>${c.dest}</b>.`)}${alvo}`, acao('Ler o destino certo', scanBarcode, ` data-ir="${id('arr-op-destino')}"`)],
    bloqueada: () => [`${t('Ler o destino')}${aviso('erro', lock, 'Posição bloqueada', `A ${c.dest} está bloqueada. Não se arruma numa posição bloqueada: comunique o problema e o gestor decide.`)}${alvo}`, acao('Comunicar problema', octagon, ' data-ir="ta-problema-bloqueada"')],
    ocupada: () => [`${t('Ler o destino')}${aviso('aviso', mapPinX, 'A posição está ocupada', `A ${c.dest} tem outra mercadoria. Não arrume por cima nem ao lado: comunique o problema.`)}${alvo}`, acao('Comunicar problema', octagon, ' data-ir="ta-problema-escolhido"')],
    resumo: () => [`${t('Confirmar arrumação')}${dl([['Artigo', `${A.ref} · ${A.desc}`], ['Quantidade', `${q} un.${parc ? ` (de ${A.q}; ${A.q - q} pendentes)` : ''}`], ['Origem', `${G.origem} · ${G.ch}`], ['Destino', `<span class="ta-dd-pos">${posicao(c.dest, 'gi-pos--peq')}</span>`]])}<p class="gp-nota">Só fica arrumado quando o servidor confirmar.</p>`, `${acao('Confirmar arrumação', check, ` data-confirmar data-ir="${id(parc ? 'arr-op-parcial-ok' : 'arr-op-confirmado')}"`)}${sec('Voltar', arrowLeft, ` data-ir="${id(parc ? 'arr-op-destino-parcial' : 'arr-op-destino')}"`)}`],
    'a-confirmar': () => [`${t('Confirmar arrumação')}${dl([['Artigo', A.ref], ['Quantidade', `${q} un.`], ['Destino', c.dest]])}`, esperar('A registar…')],
    confirmado: () => [`<section class="gi-movido" role="status">${cenaArrumacao()}<h1>Arrumação concluída</h1></section>${dl([['Artigo', `${A.ref} · ${A.desc}`], ['Confirmado', `${q} un.`], ['Destino', c.dest], ['Tarefa', `${G.ref} · concluída`]])}`, `${acao('Próxima tarefa', arrowRight, ` data-ir="${id('ta-inicio-nova')}"`)}${sec('Voltar às tarefas', list, ` data-ir="${id('ta-tarefas-feitas')}"`)}`],
    'parcial-ok': () => [`<section class="gi-movido" role="status">${cenaArrumacao()}<h1>Arrumação parcial registada</h1></section>${dl([['Artigo', `${A.ref} · ${A.desc}`], ['Confirmado', `${PARCIAL} un. na ${c.dest}`], ['Pendente', `${A.q - PARCIAL} un. no ${G.origem.toLowerCase()}`], ['Tarefa', `${G.ref} · continua em curso`]])}<p class="gp-nota">As ${A.q - PARCIAL} que faltam ficam na guia; o motor propõe outro destino para elas.</p>`, `${acao('Continuar com as pendentes', arrowRight, ` data-ir="${id('arr-op')}"`)}${sec('Voltar às tarefas', list, ' data-ir="ta-tarefas"')}`],
    'sem-leitor': () => [`${t('Ler a origem')}${leitor({ titulo: 'Leitor indisponível', texto: 'A tecla de leitura não envia códigos', estado: 'parado' })}`, `${acao('Reiniciar o leitor', refresh, ` data-ir="${id('arr-op')}"`)}${sec('Escrever à mão', scanLine, ` data-ir="${id('arr-op-artigo')}"`)}`],
    'sem-rede': () => [`${aviso('erro', wifiOff, 'A Pick parou: sem rede', 'Sem rede nada se confirma e nada fica à espera no PDA. A palete fica onde está.')}<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A procurar rede…</p>`, acao('Tentar outra vez', refresh, ` data-ir="${id('arr-op')}"`)],
    recusado: () => [`${t('Confirmar arrumação')}${aviso('erro', serverOff, 'O servidor recusou o movimento', `A ${c.dest} foi desativada há instantes. Nada se moveu; comunique o problema para o gestor escolher outro destino.`)}`, acao('Comunicar problema', octagon, ' data-ir="ta-problema"')],
  };
  const [corpo, pe] = C[p]();
  const semTopo = p === 'confirmado' || p === 'parcial-ok' || p === 'sem-rede';
  return ecra(`${semTopo ? '' : topo}${corpo}`, T('Arrumar', { voltar: 'ta-inicio', rede: p !== 'sem-rede', pe }));
}
/* a guia retomada: o mesmo percurso, desde a origem, com as ligações para os passos «retomar» */
const RET = (dest: string): Cfg => ({ dest, q: A.q, banner: dest === D ? `O gestor libertou a ${D}: o destino é o mesmo. Leia outra vez a palete.` : `Destino novo: a ${dest}. Leia outra vez a palete.`, ids: dest === D ? {} : { 'arr-op': 'arr-op-retomar', 'arr-op-artigo': 'arr-op-retomar-artigo', 'arr-op-quantidade': 'arr-op-retomar-quantidade', 'arr-op-destino': 'arr-op-retomar-destino', 'arr-op-resumo': 'arr-op-retomar-resumo', 'arr-op-confirmado': 'arr-op-retomar-ok' } });
const PARC: Cfg = { dest: D, q: PARCIAL, ids: {} };
/* a guia seguinte (o motor entregou-a): o caminho certo só, sem as simulações de erro */
const SEGC: Cfg = { dest: SEG.destino, q: SEG.linhas[0].q, g: SEG, a: SEG.linhas[0], n: `artigo 1 de ${SEG.linhas.length}`, semSim: true, ids: { 'arr-op': 'arr-op-seguinte', 'arr-op-artigo': 'arr-op-seg-artigo', 'arr-op-quantidade': 'arr-op-seg-quantidade', 'arr-op-destino': 'arr-op-seg-destino', 'arr-op-resumo': 'arr-op-seg-resumo', 'arr-op-confirmado': 'arr-op-seg-ok', 'ta-inicio-nova': 'ta-inicio' } };

/* =========================================================
   87 v2 · Não consigo arrumar
   ========================================================= */
const MOTIVOS: [string, string, string, string][] = [
  ['ocupada', mapPinX, 'Posição ocupada', 'Tem outra mercadoria, ou não cabe'],
  ['bloqueada', lock, 'Posição bloqueada', 'Fechada, com fita ou interdita'],
  ['artigo', pkgX, 'Artigo errado', 'Na palete está outro artigo'],
  ['quantidade', hash, 'Quantidade incorreta', 'Há mais ou menos do que a guia diz'],
  ['danificada', box, 'Mercadoria danificada', 'Caixas abertas, molhadas ou partidas'],
  ['ilegivel', scanLine, 'Código ilegível', 'A etiqueta da palete, do artigo ou da posição'],
  ['sem-posicao', mapPinOff, 'Sem posição disponível', 'Não há onde arrumar'],
  ['outro', circleEllipsis, 'Outro', 'Escreva-o nas observações'],
];
type E87 = 'normal' | 'escolhido' | 'bloqueada' | 'foto' | 'a-enviar' | 'sem-rede' | 'mudou';
function problema(e: E87 = 'normal'): string {
  if (e === 'mudou') return ecra(aviso('info', refresh, 'A tarefa mudou entretanto', `O gestor já tinha mudado a ${G.ref}: o destino agora é a ${NOVO}. Não há nada a comunicar sobre um destino que já não é o seu.`), T('Problema', { voltar: 'arr-op-destino', pe: acao('Ver a tarefa atualizada', arrowRight, ' data-ir="ta-resolvido"') }));
  const k = e === 'bloqueada' ? 'bloqueada' : e === 'normal' ? '' : 'ocupada', parado = e === 'a-enviar';
  return ecra(`<h1 class="gp-titulo">Não consigo arrumar</h1>
    <p class="ta-onde"><b>${G.ref}</b><span>${A.ref} · ${A.q} un.</span>${posicao(D, 'gi-pos--peq')}</p>
    ${e === 'sem-rede' ? aviso('erro', wifiOff, 'Sem rede: não foi comunicado', 'O gestor ainda não sabe. Nada fica à espera no PDA: quando houver sinal, comunique outra vez. A palete fica onde está.') : ''}
    <fieldset class="ta-motivos"><legend>O que se passa?</legend>${MOTIVOS.map(([m, ic, t, x], i) => `<label class="ta-motivo" style="--i:${i}"${e === 'normal' && (m === 'ocupada' || m === 'bloqueada') ? ` data-ir="ta-problema-${m === 'ocupada' ? 'escolhido' : 'bloqueada'}"` : ''}><input type="radio" name="ta2-motivo-${e}" value="${m}"${m === k ? ' checked' : ''}${parado ? ' disabled' : ''}><span class="ta-motivo__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span></label>`).join('')}</fieldset>
    <label class="gp-campo"><span>Observações (opcional)</span><input${k === 'ocupada' ? ' value="Tem caixas da Valeo até cima"' : k === 'bloqueada' ? ' value="Fita vermelha na prateleira"' : ''} placeholder="Ex.: tem caixas de outro artigo"${parado ? ' disabled' : ''}></label>
    ${e === 'foto' ? `<div class="ta-foto-ok">${L(imageIc)}<span><b>Fotografia anexada</b><small>Tirada às 10:41 · vai com o problema</small></span><button type="button" data-ir="ta-problema-escolhido">Tirar</button></div>`
      : `<button type="button" class="ta-foto"${parado ? ' disabled' : ''} data-ir="ta-problema-foto">${L(camera)}<span><b>Anexar fotografia</b><small>Opcional · mostra ao gestor o que viu</small></span></button>`}`,
  T('Problema', { voltar: 'arr-op-destino', rede: e !== 'sem-rede', pe: parado ? esperar('A comunicar…') : `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande" data-ir="ta-enviado"${k ? '' : ' disabled aria-disabled="true"'}>${L(send)}<span data-rotulo>${e === 'sem-rede' ? 'Comunicar outra vez' : 'Comunicar problema'}</span></button>` }));
}

/* =========================================================
   88 v2 · Arrumação bloqueada, e o que chega do Gestor
   ========================================================= */
type E88 = 'bloqueada' | 'estado' | 'resolvido' | 'libertada' | 'reatribuida' | 'mantida';
function bloqueada(e: E88 = 'bloqueada'): string {
  const ficha = dl([['Tarefa', G.ref], ['Artigo', `${A.ref} · ${A.q} un.`], ['Problema', 'Posição ocupada · «Tem caixas da Valeo até cima»'], ['Posição', D], ['Comunicado', `${DIA} às ${HORA}`], ['Estado', e === 'estado' ? 'O gestor está a ver' : 'Aguarda o gestor']]);
  const ja = `<p class="ta-ja">${L(circleCheck)}<span>Os ${A1.q} un. de ${A1.ref} já arrumados ficam confirmados. A palete fica no ${G.origem.toLowerCase()}.</span></p>`;
  if (e === 'resolvido' || e === 'libertada') return ecra(`<section class="gi-aviso gi-aviso--info ta-resposta" role="status"><span class="gi-aviso__ic">${L(e === 'resolvido' ? mapPin : unlock)}</span><h1>Tarefa atualizada</h1><p>${e === 'resolvido' ? `A Ana Ferreira escolheu um destino novo para o ${A.ref}.` : `A Ana Ferreira libertou a ${D}: a mercadoria que lá estava foi para o lugar dela.`}</p></section>
    ${dl([['Problema anterior', `Posição ocupada · ${D}`], ['Instruções novas', e === 'resolvido' ? 'Arrume na posição ao lado' : 'Arrume no mesmo destino'], ['Destino', `<span class="ta-dd-pos">${posicao(e === 'resolvido' ? NOVO : D, 'gi-pos--peq')}</span>`]])}
    <p class="gp-nota">Lê-se outra vez a palete, o artigo e o destino: nada se dá por lido.</p>`, T('Tarefa atualizada', { voltar: 'ta-inicio', pe: acao('Retomar arrumação', play, ` data-ir="${e === 'resolvido' ? 'arr-op-retomar' : 'arr-op-retomar-mesmo'}"`) }));
  if (e === 'reatribuida') return ecra(`${aviso('aviso', userRoundX, 'A tarefa passou para outra pessoa', `A Ana Ferreira deu a ${G.ref} ao Tiago Lopes. Daqui já não se continua: o servidor recusa as leituras desta tarefa neste PDA.`)}${ja}`, T('Tarefa', { voltar: 'ta-inicio', pe: acao('Ver tarefas', list, ' data-ir="ta-tarefas"') }));
  if (e === 'mantida') return ecra(`${aviso('aviso', lock, 'Continua bloqueada', 'A Ana Ferreira está a tratar com a Valeo a mercadoria que ocupa a posição. Não arrume esta tarefa até haver resposta.')}${ficha}`, T('Tarefa', { voltar: 'ta-inicio', pe: `${acao('Ver tarefas', list, ' data-ir="ta-tarefas-bloq"')}` }));
  return ecra(`<section class="ta-bloq" role="status">${L(msg, 'ta-bloq__ic')}<h1>Arrumação bloqueada</h1><p>Problema comunicado. Aguarda intervenção do Gestor.</p></section>
    ${e === 'estado' ? `<ol class="ta-linha-t" aria-label="Estado"><li class="is-feito"><b>Comunicado</b><small>às ${HORA}</small></li><li class="is-feito"><b>A Ana Ferreira abriu o problema</b><small>às 10:44</small></li><li class="is-atual"><b>À espera da decisão</b><small>A resposta chega a este PDA</small></li></ol>` : ficha}${ja}`,
  T('Bloqueada', { voltar: 'ta-inicio', pe: e === 'estado' ? acao('Ver tarefas', list, ' data-ir="ta-tarefas-bloq"') : `${acao('Ver tarefas', list, ' data-ir="ta-tarefas-bloq"')}${sec('Consultar estado', clock, ' data-ir="ta-enviado-a-ver"')}` }));
}

/* =========================================================
   79 v2 · O Gestor decide (quatro decisões, cada uma com o que chega ao PDA da Inês)
   ========================================================= */
type Dec = 'destino' | 'outra' | 'libertar' | 'manter';
const DECS: [Dec, string, string, string][] = [
  ['destino', mapPin, 'Mudar o destino', 'Outra posição ativa, fora das zonas em contagem'],
  ['outra', userPlus, 'Dar a outra pessoa', 'Quem está livre na arrumação'],
  ['libertar', unlock, 'A posição ficou livre', 'Já se tirou o que lá estava: arruma-se no mesmo sítio'],
  ['manter', lock, 'Manter bloqueada', 'Ainda não se pode arrumar; diz-se porquê'],
];
function gestor(dec: Dec = 'destino', fase: 'escolher' | 'a-gravar' | 'feito' = 'escolher'): string {
  const GG: Opcoes = { titulo: 'Problema', voltar: 'arr-excecoes', gestor: true, funcao: 'Gestor' };
  const PDA: Record<Dec, [string, string, string]> = {
    destino: ['Destino novo enviado à Inês', `A ${G.ref} volta para a Inês com a ${NOVO}. Ela lê outra vez a palete, o artigo e o destino.`, 'ta-resolvido'],
    outra: ['A tarefa passou para o Tiago', `O Tiago Lopes recebe a ${G.ref} quando acabar a que tem; a Inês já não a continua.`, 'ta-reatribuida'],
    libertar: ['Posição libertada', `A ${D} volta a aceitar movimentos; a Inês retoma no mesmo destino.`, 'ta-libertada'],
    manter: ['Continua bloqueada', 'A Inês vê porquê e não arruma esta tarefa até haver decisão.', 'ta-continua-bloqueada'],
  };
  if (fase === 'feito') return ecra(`<section class="gi-movido" role="status">${dec === 'manter' ? L(lock, 'ta-bloq__ic') : cenaArrumacao()}<h1>${PDA[dec][0]}</h1><p>O servidor confirmou. ${PDA[dec][1]} Fica no histórico da tarefa quem decidiu, quando e porquê.</p></section>`,
    { ...GG, pe: `${acao('Ver no PDA da Inês', smartphone, ` data-ir="${PDA[dec][2]}"`)}${sec('Voltar às exceções', arrowLeft, ' data-ir="arr-excecoes"')}` });
  const parado = fase === 'a-gravar';
  const ESTADO: Record<Dec, string> = { destino: 'arr-problema', outra: 'arr-problema-reatribuir', libertar: 'arr-problema-libertar', manter: 'arr-problema-manter' };
  const FEITO: Record<Dec, string> = { destino: 'arr-problema-resolvido', outra: 'arr-problema-reatribuida', libertar: 'arr-problema-libertada', manter: 'arr-problema-mantida' };
  const detalheDec: Record<Dec, string> = {
    destino: `<ul class="gp-escolha" role="radiogroup" aria-label="Destino novo">${([[NOVO, 'Ao lado · livre', 'ok'], ['60120501', 'Zona 12 · mesma família', 'ok'], [D, 'A comunicada como ocupada', 'x'], ['60300104', 'Zona 30 · em contagem', 'bloq']] as const).map(([p, t, k], i) => `<li><label class="gp-op gi-dest${k !== 'ok' ? ' is-ocupada' : ''}"><input type="radio" name="ta2-dest-${fase}"${i === 0 ? ' checked' : ''}${k !== 'ok' || parado ? ' disabled' : ''}>${posicao(p, 'gi-pos--peq')}<span><small>${t}</small></span>${k === 'bloq' ? `<em class="is-nao">${L(lock)}Em contagem</em>` : k === 'x' ? '<em class="is-nao">Comunicada</em>' : ''}</label></li>`).join('')}</ul>`,
    outra: `<ul class="gp-escolha" role="radiogroup" aria-label="Quem arruma">${([['Tiago Lopes', 'TL', 'Livre · separação, entre duas guias', ''], ['Joana Silva', 'JS', 'Na contagem INV-2026-014', 'o']] as const).map(([q, ini, t, k], i) => `<li><label class="gp-op${k ? ' is-ocupada' : ''}"><input type="radio" name="ta2-quem-${fase}"${i === 0 ? ' checked' : ''}${k || parado ? ' disabled' : ''}><span class="gp-av">${ini}</span><span><b>${q}</b><small>${t}</small></span></label></li>`).join('')}</ul><label class="gp-campo"><span>Motivo</span><input value="A Inês está noutra tarefa; o Tiago está livre"${parado ? ' disabled' : ''}></label>`,
    libertar: `<p class="gp-nota">Confirme que a ${D} já está vazia: o servidor volta a aceitar movimentos nela.</p><label class="gp-campo"><span>O que se fez</span><input value="As caixas da Valeo foram para a 60210302"${parado ? ' disabled' : ''}></label>`,
    manter: `<label class="gp-campo"><span>Porquê (a Inês vê)</span><input value="A tratar com a Valeo a mercadoria na posição"${parado ? ' disabled' : ''}></label>`,
  };
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${G.ref}</h1><span class="gp-tag gp-tag--erro">Bloqueada</span></div>
    <section class="ta-caso">
      <p class="ta-caso__mot">${L(msg)}<span><b>Posição ocupada</b><small>«Tem caixas da Valeo até cima» · com fotografia</small></span></p>
      ${dl([['Quem', `${INES.nome} · ${DIA} às ${HORA}`], ['Artigo', `${A.ref} · ${A.desc} · ${A.q} un.`], ['Origem', `${G.origem} · da ${G.ch}`], ['Recusado', D], ['Já confirmado', `${A1.ref} · ${A1.q} un. (1 de 2)`]])}
    </section>
    <fieldset class="ta-motivos"><legend>O que decide?</legend>${DECS.map(([k, ic, t, x], i) => `<label class="ta-motivo" style="--i:${i}"${k !== dec && !parado ? ` data-ir="${ESTADO[k]}"` : ''}><input type="radio" name="ta2-dec-${dec}-${fase}" value="${k}"${k === dec ? ' checked' : ''}${parado ? ' disabled' : ''}><span class="ta-motivo__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span></label>`).join('')}</fieldset>
    ${detalheDec[dec]}`,
  { ...GG, pe: parado ? esperar('A enviar…') : acao('Confirmar a decisão', check, ` data-confirmar data-ir="${FEITO[dec]}"`) });
}

/* =========================================================
   100 · Histórico de arrumações · 101 · Uma arrumação no histórico
   ========================================================= */
function historicoArr(): string {
  type H = [string, string, string, number, string, string, string];
  const HOJE: H[] = [[G.ref, A1.ref, A1.desc, A1.q, G.origem, D, 'hoje às 10:38'], ['GA-2026-0327', 'SKF 6204-2RSH', 'Rolamento rígido de esferas', 50, 'Cais 1', '60100802', 'hoje às 08:12']];
  const SEMANA: H[] = [...HOJE, ['GA-2026-0319', 'NGK BKR6E', 'Vela de ignição', 40, 'Cais 1', '60210302', '28/10 às 15:20'], ['GA-2026-0312', 'TRW GDB1330', 'Pastilhas de travão', 24, 'Cais 2', '60300101', '27/10 às 09:05']];
  const MES: H[] = [...SEMANA, ['GA-2026-0270', 'SKF VKBA 6556', 'Kit de rolamento de roda', 12, 'Cais 1', '60101203', '14/10 às 11:47']];
  const P: [string, string, H[]][] = [['hoje', 'Hoje', HOJE], ['7', 'Últimos 7 dias', SEMANA], ['30', 'Últimos 30 dias', MES]];
  return ecra(`<h1 class="gp-titulo">Histórico de arrumações</h1>
    <div class="gp-filtros" role="tablist" aria-label="Período">${P.map(([k, t, xs], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-gi-sep="${k}">${t} <span>${xs.length}</span></button>`).join('')}</div>
    ${P.map(([k, , xs], i) => `<ul class="gp-lista ta-lista" role="list" data-gi-painel="${k}"${i ? ' hidden' : ''}>${xs.map(([ref, art, desc, q, o, d, quando], j) => `<li style="--i:${j}"><button type="button" class="ta-linha ta-linha--feita" data-ir="ta-hist-det">
        <span class="ta-linha__cab"><b>${art}</b><small>${quando}</small></span>
        <span class="ta-linha__art">${desc} · <b>${q} un.</b> · ${ref}</span>
        <span class="ta-linha__pc">${L(truck)}${o}${L(arrowRight)}<code>${d}</code></span></button></li>`).join('')}</ul>`).join('')}
    <p class="gp-nota">Só o que o servidor confirmou.</p>`,
  T('Histórico', { voltar: 'op-mais', barra: comBarra('mais') }));
}
function historicoDet(): string {
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${A1.ref}</h1><span class="gp-tag gp-tag--ok">${L(check)}Arrumado</span></div>
    ${dl([['Artigo', `${A1.ref} · ${A1.desc}`], ['Quantidade', `${A1.q} un.`], ['Origem', `${G.origem} · da ${G.ch}`], ['Destino', `<span class="ta-dd-pos">${posicao(D, 'gi-pos--peq')}</span>`], ['Tarefa', G.ref], ['Confirmado', `${DIA} às 10:38 · pelo servidor`], ['Por', INES.nome]])}
    <p class="gp-nota">Só de leitura: um movimento confirmado não se muda daqui.</p>`, T('Histórico', { voltar: 'ta-historico' }));
}

/* =========================================================
   Os ecrãs
   ========================================================= */
const NOTA = 'V2 do trabalhador da Arrumação (30 out., briefing «Figma interativo V2»): Tarefa → Origem → Artigo → Quantidade → Destino → Confirmação, com «Simular…» em cada leitura; o problema vai ao Gestor, que tem quatro decisões, e cada uma chega ao PDA. Sem a fila (ela): só as tarefas da pessoa.';
/** Ecrãs novos (89, 100, 101 e os estados que não existiam) */
export function ecrasArrumadorV2(): Ecra<string>[] {
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<string> => ({ id, nome, fluxo: 'Arrumação', objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  return [
    e('ta-tarefas', '89 · As minhas tarefas', 'Só as tarefas da pessoa, por estado (em curso, bloqueadas, concluídas), cada linha com a tarefa, o artigo, a origem, o destino, a quantidade e o estado; a fila é do motor e não se mostra.', tarefas()),
    e('ta-tarefas-bloq', '89.1 · Bloqueadas', 'Depois de comunicar o problema: a GA-2026-0330 aguarda o gestor e a seguinte está em curso.', tarefas('bloq', true), 'ta-tarefas'),
    e('ta-tarefas-feitas', '89.2 · Concluídas', 'As concluídas hoje.', tarefas('feita'), 'ta-tarefas'),
    e('ta-tarefas-vazia', '89.3 · Sem tarefas', 'Nada em curso, bloqueado nem concluído: diz-se em cada separador.', tarefas('curso', false, true), 'ta-tarefas'),
    e('ta-historico', '100 · Histórico de arrumações', 'As arrumações confirmadas pelo servidor, por período (hoje, 7 dias, 30 dias): artigo, quantidade, origem, destino e hora.', historicoArr()),
    e('ta-hist-det', '101 · Arrumação no histórico', 'Uma arrumação confirmada, só de leitura.', historicoDet()),
    e('ta-problema-bloqueada', '87.5 · Posição bloqueada', 'Vindo do destino bloqueado: o motivo já escolhido.', problema('bloqueada'), 'ta-problema'),
    e('ta-problema-foto', '87.6 · Com fotografia', 'A fotografia anexada vai com o problema.', problema('foto'), 'ta-problema'),
    e('ta-libertada', '88.5 · Posição libertada', 'O gestor libertou a posição: retoma-se no mesmo destino, lendo tudo outra vez.', bloqueada('libertada'), 'ta-enviado'),
    e('ta-continua-bloqueada', '88.6 · Continua bloqueada', 'O gestor mantém o bloqueio e diz porquê; não há como contornar.', bloqueada('mantida'), 'ta-enviado'),
    e('arr-problema-reatribuir', '79.3 · Dar a outra pessoa', 'A decisão «dar a outra pessoa»: quem está livre e o motivo.', gestor('outra'), 'arr-problema'),
    e('arr-problema-libertar', '79.4 · Posição libertada', 'A decisão «a posição ficou livre»: o que se fez.', gestor('libertar'), 'arr-problema'),
    e('arr-problema-manter', '79.5 · Manter bloqueada', 'A decisão «manter bloqueada»: porquê, que a Inês vê.', gestor('manter'), 'arr-problema'),
    e('arr-problema-reatribuida', '79.6 · Passou para o Tiago', 'Confirmado; «Ver no PDA da Inês».', gestor('outra', 'feito'), 'arr-problema'),
    e('arr-problema-libertada', '79.7 · Libertada', 'Confirmado; «Ver no PDA da Inês».', gestor('libertar', 'feito'), 'arr-problema'),
    e('arr-problema-mantida', '79.8 · Continua bloqueada', 'Confirmado; «Ver no PDA da Inês».', gestor('manter', 'feito'), 'arr-problema'),
    e('arr-op-origem-errada', '80.22 · Origem errada', 'Leu a palete de outra chegada: não se continua; lê-se outra vez.', passo('origem-errada'), 'arr-op'),
    e('arr-op-artigo-desconhecido', '80.23 · Código desconhecido', 'O código não é de nenhum artigo.', passo('artigo-desconhecido'), 'arr-op'),
    e('arr-op-qtd-invalida', '80.24 · Quantidade inválida', 'Mais do que a guia tem: o Confirmar fica desligado e diz-se porquê.', passo('qtd-invalida'), 'arr-op'),
    e('arr-op-ocupada', '80.25 · Posição ocupada', 'O destino tem outra mercadoria: só «Comunicar problema».', passo('ocupada'), 'arr-op'),
    e('arr-op-resumo', '80.26 · Confirmar arrumação', 'O resumo (artigo, quantidade, origem, destino) e «Confirmar arrumação»: «A registar…» até o servidor responder.', passo('resumo'), 'arr-op'),
    e('arr-op-destino-parcial', '80.27 · Destino (parcial)', 'Com 10 de 16: lê-se o destino.', passo('destino', PARC), 'arr-op'),
    e('arr-op-resumo-parcial', '80.28 · Confirmar parcial', 'O resumo com as pendentes.', passo('resumo', PARC), 'arr-op'),
    e('arr-op-parcial-ok', '80.29 · Parcial registada', 'O servidor confirmou 10; as 6 ficam pendentes na guia, que continua em curso.', passo('parcial-ok', PARC), 'arr-op'),
    e('arr-op-retomar-resumo', '80.30 · Retomar: confirmar', 'O resumo com o destino novo.', passo('resumo', RET(NOVO)), 'arr-op'),
    e('arr-op-seg-artigo', '80.32 · A seguinte: o artigo', 'A GA-2026-0331: o artigo.', passo('artigo', SEGC), 'arr-op'),
    e('arr-op-seg-quantidade', '80.33 · A seguinte: a quantidade', 'A GA-2026-0331: a quantidade.', passo('quantidade', SEGC), 'arr-op'),
    e('arr-op-seg-destino', '80.34 · A seguinte: o destino', 'A GA-2026-0331: o destino.', passo('destino', SEGC), 'arr-op'),
    e('arr-op-seg-resumo', '80.35 · A seguinte: confirmar', 'A GA-2026-0331: o resumo.', passo('resumo', SEGC), 'arr-op'),
    e('arr-op-seg-ok', '80.36 · A seguinte: concluída', 'O servidor confirmou o artigo 1 da GA-2026-0331.', passo('confirmado', SEGC), 'arr-op'),
    e('arr-op-retomar-mesmo', '80.31 · Retomar no mesmo destino', 'A posição foi libertada: o mesmo percurso, desde a palete.', passo('origem', RET(D)), 'arr-op'),
  ];
}
/** Versões novas dos ecrãs que já existiam */
export function comArrumadorV2<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const R = RET(NOVO);
  const V: Record<string, () => string> = {
    'ta-inicio': () => inicio(), 'ta-inicio-nova': () => inicio('nova'), 'ta-inicio-vazia': () => inicio('sem'), 'ta-inicio-seguinte': () => inicio('seguinte'), 'ta-inicio-resolvida': () => inicio('resolvida'),
    'ta-inicio-carregar': () => inicio('carregar'), 'ta-inicio-sem-rede': () => inicio('sem-rede'), 'ta-inicio-erro': () => inicio('servidor'), 'ta-inicio-sessao': () => inicio('sessao'),
    'ta-guia': detalhe,
    'ta-problema': () => problema(), 'ta-problema-escolhido': () => problema('escolhido'), 'ta-problema-a-enviar': () => problema('a-enviar'), 'ta-problema-sem-rede': () => problema('sem-rede'), 'ta-problema-mudou': () => problema('mudou'),
    'ta-enviado': () => bloqueada(), 'ta-enviado-a-ver': () => bloqueada('estado'), 'ta-resolvido': () => bloqueada('resolvido'), 'ta-reatribuida': () => bloqueada('reatribuida'),
    'arr-problema': () => gestor(), 'arr-problema-a-gravar': () => gestor('destino', 'a-gravar'), 'arr-problema-resolvido': () => gestor('destino', 'feito'),
    'arr-op': () => passo('origem'), 'arr-op-artigo': () => passo('artigo'), 'arr-op-quantidade': () => passo('quantidade'), 'arr-op-destino': () => passo('destino'), 'arr-op-a-confirmar': () => passo('a-confirmar'),
    'arr-op-confirmado': () => passo('confirmado'), 'arr-op-destino-errado': () => passo('destino-errado'), 'arr-op-artigo-errado': () => passo('artigo-errado'), 'arr-op-bloqueada': () => passo('bloqueada'),
    'arr-op-parcial': () => passo('parcial'), 'arr-op-recusado': () => passo('recusado'), 'arr-op-sem-leitor': () => passo('sem-leitor'), 'arr-op-sem-rede': () => passo('sem-rede'),
    'arr-op-seguinte': () => passo('origem', SEGC),
    'arr-op-retomar': () => passo('origem', R), 'arr-op-retomar-artigo': () => passo('artigo', R), 'arr-op-retomar-quantidade': () => passo('quantidade', R), 'arr-op-retomar-destino': () => passo('destino', R), 'arr-op-retomar-ok': () => passo('confirmado', R),
  };
  return ecras.map((x) => V[x.id] ? { ...x, versoes: [...x.versoes, { id: `v${x.versoes.length + 1}`, nota: NOTA, html: V[x.id]() }] as Ecra<T>['versoes'] } : x);
}
