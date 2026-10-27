/* =========================================================
   PICK — o Inventário completo, do briefing «ROMAFE Warehouse — Android PDA Inventory System» (27 out. 2026)
   Ela colou o briefing da app Kotlin e, perguntada, respondeu «apenas com rede» e «no figma»: os ecrãs ficam aqui,
   na Pick do editor, e a Pick continua a não trabalhar sem rede (16–17 set.) — por isso não há «Guardado no
   dispositivo», «Por sincronizar», fila local nem conflitos de sincronização: sem rede, para e diz porquê.
   O nome fica Pick e o cabeçalho ROMAFE | Pick (8 out.), e não «ROMAFE Warehouse».
   O que o briefing pedia e a Pick ainda não tinha:
     - 57 · Início do Operador — «A minha próxima tarefa» e «Iniciar contagem»; as tarefas atribuídas, em curso e
       concluídas; nada do Gestor;
     - 43 · Ler e contar — a leitura num só ecrã (o ponto 10 do briefing): o estado da leitura grande, a posição, o
       artigo lido, a quantidade, Confirmar e o último registado; depois de confirmar volta logo a «pronto a ler»,
       na mesma posição; com os estados artigo de fora, repetido, desconhecido, leitor indisponível, sem rede,
       inventário bloqueado e tarefa já concluída;
     - 62 · Acompanhar o inventário — as tarefas, quem conta, o progresso real e as exceções;
     - 63 · Validar e fechar — decidir cada divergência (aceitar ou recontar), e fechar: o ajuste de stock segue
       para o ERP numa transação do servidor, com auditoria; a Pick nunca ajusta stock;
     - 64 · Histórico — os inventários fechados;
     - 61.1 · Criar inventário v2 (o âmbito: zonas, posições ou artigos) e 61.2 · Atribuir v2 (por secções, sem
       pôr a mesma posição em duas pessoas).
   Os dados são os de exemplo da Pick (inventario.ts e gestor.ts).
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, esperar, aviso, nota, prog, posicao, quantidade, h2, L, OPERADOR } from './inventario-v2';
import { INV, POS } from './inventario';
import { INVENTARIOS } from './gestor';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import pkgSearch from 'lucide-static/icons/package-search.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import rotate from 'lucide-static/icons/rotate-ccw.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import radio from 'lucide-static/icons/radio.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import shieldCheck from 'lucide-static/icons/shield-check.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import folder from 'lucide-static/icons/folder.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';

/* ---------- os artigos que se lêem no 43 ---------- */
interface Art { ref: string; desc: string; marca: string; ean: string; un: string }
const A1: Art = { ref: 'SKF VKBA 6556', desc: 'Kit de rolamento de roda', marca: 'SKF', ean: '7316201250277', un: 'un.' };
const A0: Art = { ref: 'SKF VKMV 6PK1873', desc: 'Correia poli-V', marca: 'SKF', ean: '7316573061736', un: 'un.' };
const artigoLido = (a: Art, cls = '') => `<section class="gi-artigo${cls ? ` ${cls}` : ''}"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${a.ref}</p><p class="gi-artigo__desc">${a.desc} · ${a.marca}</p><p class="gi-artigo__meta">EAN ${a.ean} · ${a.un}</p></div></section>`;
const porLer = `<section class="gi-artigo gi-artigo--vazio" aria-label="Artigo por ler"><span class="gi-artigo__ic">${L(pkgSearch)}</span><div><p class="gi-artigo__desc">Ainda sem artigo</p><p class="gi-artigo__meta">Leia a etiqueta do artigo; a quantidade abre-se a seguir.</p></div></section>`;
const ultimo = (a: Art, q: string, quando: string) => `<p class="gi-ultimo">${L(circleCheck)}<span><small>Último registado · ${quando}</small><b>${a.ref} · ${q}</b></span></p>`;

/* ---------- 43 · Ler e contar: o estado grande, a posição, o artigo, a quantidade e o último ---------- */
type E43 = 'pronto' | 'lido' | 'registado' | 'fora' | 'repetido' | 'desconhecido' | 'sem-leitor' | 'sem-rede' | 'bloqueado' | 'concluida';
const ESTADO_LEITURA: Record<E43, [string, string, string]> = {
  pronto: ['pronto', 'Pronto a ler', 'Prima a tecla de leitura no artigo'],
  lido: ['lido', 'Artigo lido', 'Diga quantos estão nesta posição'],
  registado: ['ok', 'Registado', 'Pronto para o artigo seguinte'],
  fora: ['erro', 'Artigo fora desta contagem', 'Leia outro artigo'],
  repetido: ['aviso', 'Já contado nesta posição', 'Somar ou corrigir'],
  desconhecido: ['erro', 'Código desconhecido', 'Leia outra etiqueta'],
  'sem-leitor': ['erro', 'Leitor indisponível', 'A tecla de leitura não envia códigos'],
  'sem-rede': ['erro', 'Sem rede', 'Nada se regista até voltar'],
  bloqueado: ['erro', 'Inventário bloqueado', 'O gestor parou esta contagem'],
  concluida: ['ok', 'Tarefa já concluída', 'Esta contagem já foi submetida'],
};
const faixaLeitura = (e: E43) => { const [tom, t, x] = ESTADO_LEITURA[e]; return `<button type="button" class="gi-faixa-ler gi-faixa-ler--${tom}" data-ler="${A1.ean}" data-tipo-leitura="artigo"${e === 'pronto' || e === 'registado' ? ' data-depois="inv-ler-lido"' : ''}${['sem-leitor', 'sem-rede', 'bloqueado', 'concluida'].includes(e) ? ' disabled' : ''} aria-live="polite">
    <span class="gi-faixa-ler__ic">${L(tom === 'ok' ? circleCheck : tom === 'erro' ? (e === 'sem-rede' ? wifiOff : e === 'bloqueado' ? lock : triangle) : tom === 'aviso' ? triangle : scanBarcode)}</span>
    <span><b>${t}</b><small>${x}</small></span>${tom === 'pronto' ? '<i class="gi-faixa-ler__varre" aria-hidden="true"></i>' : ''}</button>`; };
const posLinha = () => `<div class="gi-ler-pos">${L(mapPin)}${posicao(POS, 'gi-pos--peq')}<button type="button" class="gi-mudar" data-ir="inv-posicao">${L(mapPin)}<span>Mudar</span></button></div>`;
function lerContar(e: E43 = 'pronto'): string {
  const parado = ['sem-leitor', 'sem-rede', 'bloqueado', 'concluida'].includes(e);
  const meio = e === 'lido' ? `${artigoLido(A1, 'is-novo')}${quantidade('', { rotulo: 'Quantas estão aqui?' }).replace('id="gi-qtd-n" value=""', 'id="gi-qtd-n" value="" placeholder="0"')}`
    : e === 'fora' ? `${artigoLido(A0, 'gi-artigo--erro')}${aviso('erro', pkgX, 'Este artigo não é desta contagem', `O ${INV} conta os artigos da <b>zona 30, colunas 01 a 12</b>. A correia não fica registada aqui.`)}`
    : e === 'repetido' ? `${artigoLido(A1)}${aviso('aviso', triangle, 'Já contou este artigo aqui', 'Registou <b>4 un.</b> às 10:42. Se encontrou mais, some; se a primeira estava errada, corrija — a anterior fica guardada.')}`
    : e === 'desconhecido' ? aviso('erro', pkgX, 'O código não é de nenhum artigo', 'Leu <b>5601234000017</b>. Não está no catálogo nem nesta contagem. Leia outra etiqueta, ou separe o artigo como por identificar.')
    : e === 'sem-leitor' ? aviso('erro', radio, 'O leitor não está a enviar códigos', 'Prima a tecla de novo. Se não ler, reinicie o leitor; até lá pode escrever o código à mão — fica marcado como escrito.')
    : e === 'sem-rede' ? `${aviso('erro', wifiOff, 'A Pick parou: sem rede', 'Sem rede nada se regista, e nada fica à espera no PDA. O que já confirmou está no servidor.')}<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A procurar rede…</p>`
    : e === 'bloqueado' ? aviso('erro', lock, 'O gestor bloqueou esta contagem', `O ${INV} está a ser validado. O que contou até agora fica como está; se for preciso recontar, a tarefa volta-lhe.`)
    : e === 'concluida' ? aviso('ok', send, 'Esta contagem já foi submetida', 'Já não se conta nem se corrige. Se o gestor pedir recontagem, a tarefa aparece-lhe no início.')
    : porLer;
  const pe = e === 'lido' ? acao('Confirmar contagem', check, ' data-confirmar data-ir="inv-ler-registado"')
    : e === 'fora' || e === 'desconhecido' ? `${acao('Ler outro artigo', scanBarcode, ' data-ir="inv-ler"')}${e === 'desconhecido' ? sec('Separar por identificar', pkgX, ' data-ir="inv-ler"') : ''}`
    : e === 'repetido' ? `${acao('Somar unidades', plus, ' data-ir="inv-ler-lido"')}${sec('Corrigir', rotate, ' data-ir="inv-corrigir"')}`
    : e === 'sem-leitor' ? `${acao('Reiniciar o leitor', refresh)}${sec('Escrever à mão', keyboard)}`
    : e === 'sem-rede' ? acao('Tentar de novo', refresh) : e === 'bloqueado' || e === 'concluida' ? acao('Voltar ao início', arrowLeft, ' data-ir="op-inicio"')
    : sec('Acabei esta posição', check, ' data-ir="inv-fim-posicao"');
  return ecra(`<p class="gi-ler-inv"><b>${INV}</b><span>Zona 30 · às cegas · 18 de 46 posições</span></p>
    ${faixaLeitura(e)}
    ${parado && e !== 'sem-leitor' ? '' : posLinha()}
    ${meio}
    ${e === 'registado' ? ultimo(A1, '4 un.', 'agora') : e === 'pronto' || e === 'lido' ? ultimo(A0, '12 un.', '10:40') : ''}`,
  { rede: e !== 'sem-rede', titulo: 'Ler e contar', pe });
}

/* ---------- 57 · Início do Operador ---------- */
type E57 = 'normal' | 'nova' | 'sem';
function inicioOperador(e: E57 = 'normal'): string {
  const tarefa = e === 'sem' ? `<section class="gi-vazio">${L(clock)}<p><b>Não tem tarefas agora.</b> Quando o gestor lhe atribuir uma contagem, o sistema entrega-a aqui. Não precisa de fazer nada.</p></section>`
    : `<section class="gi-dom gi-tarefa" aria-labelledby="gi-t57">
      <p class="gi-tarefa__rot">${L(listChecks)}A minha próxima tarefa</p>
      <div class="gi-tarefa__cab"><b id="gi-t57">${e === 'nova' ? 'INV-2026-015' : INV}</b><span class="gp-tag gp-tag--${e === 'nova' ? 'planeada' : 'curso'}">${e === 'nova' ? 'Nova' : 'A meio'}</span></div>
      <p class="gi-dom__meta">${e === 'nova' ? 'Cíclica · zona 10 · rolamentos · às cegas' : 'Por posição · zona 30 · colunas 01–12 · às cegas'}</p>
      ${e === 'nova' ? '<p class="gi-dom__onde">' + L(mapPin) + '<span>Começa em</span>' + posicao('60100101', 'gi-pos--peq') + '</p>' + prog(0, 30) : '<p class="gi-dom__onde">' + L(mapPin) + '<span>Parou em</span>' + posicao(POS, 'gi-pos--peq') + '</p>' + prog(18, 46)}
      ${acao(e === 'nova' ? 'Iniciar contagem' : 'Continuar contagem', e === 'nova' ? scanBarcode : play, ' data-ir="inv-ler"')}
    </section>`;
  const n = e === 'sem' ? [0, 0, 1] : e === 'nova' ? [1, 0, 1] : [2, 1, 1];
  return ecra(`<div class="gp-ola"><h1>Bom dia, ${OPERADOR.primeiro}</h1><p>Arrumação · armazém 60</p></div>
    ${tarefa}
    <section class="gp-sec">${h2('As minhas contagens')}
      <div class="gi-tres">
        <button type="button" class="gi-num" data-ir="inv-lista"><b>${n[0]}</b><span>Atribuídas</span></button>
        <button type="button" class="gi-num" data-ir="inv-lista"><b>${n[1]}</b><span>Em curso</span></button>
        <button type="button" class="gi-num" data-ir="inv-lista"><b>${n[2]}</b><span>Concluídas</span></button>
      </div>
    </section>
    <section class="gp-sec">${h2('Módulos')}<div class="gp-modulos"><button type="button" class="gp-pasta" data-ir="inv-inicio"><span class="gp-pasta-g">${L(folder)}${L(pkg)}</span><b>Inventário</b></button></div></section>`,
  { titulo: 'Início' });
}

/* ---------- 61.1 · Criar inventário v2: o âmbito ---------- */
const ZONAS: [string, string, number][] = [['10', 'Rolamentos', 30], ['12', 'Retentores', 24], ['21', 'Kits de distribuição', 16], ['30', 'Travagem e diversos', 46]];
function criar(): string {
  return ecra(`<h1 class="gp-titulo">Criar inventário</h1>
    <fieldset class="gi-seg"><legend>O que se conta</legend>${['Zonas', 'Posições', 'Artigos'].map((t, i) => `<label><input type="radio" name="gi-ambito"${i === 0 ? ' checked' : ''}><span>${t}</span></label>`).join('')}</fieldset>
    <fieldset class="gi-zonas"><legend>Zonas do armazém 60</legend>${ZONAS.map(([z, t, n], i) => `<label class="gi-zona${i === 3 ? ' is-ocupada' : ''}"><input type="checkbox"${i === 1 ? ' checked' : ''}${i === 3 ? ' disabled' : ''}><span><b>Zona ${z}</b><small>${t} · ${n} posições</small></span>${i === 3 ? '<em>Em contagem</em>' : ''}</label>`).join('')}</fieldset>
    <label class="gp-campo"><span>Colunas</span><input value="Todas" aria-describedby="gi-col-n"></label><p class="gi-mini" id="gi-col-n">Deixe «Todas», ou escreva um intervalo (ex.: 01–06).</p>
    <label class="gi-interruptor"><input type="checkbox" checked><span><b>Às cegas</b><small>O operador não vê as quantidades do sistema.</small></span></label>
    <div class="gi-resumo-l"><span>Fica com</span><b>24 posições</b><span>na zona 12 · retentores</span></div>
    ${nota('A zona 30 está em contagem (INV-2026-014): não entra noutro inventário até fechar.')}`,
  { voltar: 'gestor-inventario', titulo: 'Novo inventário', gestor: true, pe: `${acao('Criar e atribuir', userPlus, ' data-ir="gestor-atribuir"')}` });
}

/* ---------- 61.2 · Atribuir v2: por secções, sem dupla atribuição ---------- */
function atribuir(): string {
  const SEC: [string, number, string, string][] = [['Colunas 01–06', 15, 'Inês Rocha', 'ines'], ['Colunas 07–12', 15, '', '']];
  const OP: [string, string, string, string][] = [['Inês Rocha', 'IR', 'Conta as colunas 01–06 desta', ''], ['Tiago Lopes', 'TL', 'Separação · tarefas do motor', ''], ['Joana Silva', 'JS', 'Já conta o INV-2026-014', 'ocupada']];
  return ecra(`<h1 class="gp-titulo">Atribuir contagem</h1>
    <div class="gp-cartao"><b>INV-2026-015</b><small>Cíclica · zona 10 · rolamentos · 30 posições</small></div>
    ${h2('Secções')}
    <ul class="gi-secoes" role="list">${SEC.map(([t, n, quem]) => `<li class="gi-secao${quem ? ' is-feita' : ' is-atual'}"><span><b>${t}</b><small>${n} posições</small></span>${quem ? `<span class="gi-secao__quem"><i class="gp-av">IR</i>${quem}</span>` : `<span class="gp-tag gp-tag--planeada">Por atribuir</span>`}</li>`).join('')}</ul>
    ${h2('Colunas 07–12 para')}
    <ul class="gp-escolha" role="radiogroup" aria-label="Operador">${OP.map(([n, ini, t, k], i) => `<li><label class="gp-op${k ? ' is-ocupada' : ''}"><input type="radio" name="gi-op"${i === 1 ? ' checked' : ''}${k ? ' disabled' : ''}><span class="gp-av">${ini}</span><span><b>${n}</b><small>${t}</small></span>${i === 0 ? '<em>Já tem 01–06</em>' : k ? '<em class="is-nao">Ocupada</em>' : ''}</label></li>`).join('')}</ul>
    ${nota('Uma posição só tem uma pessoa. A tarefa chega ao PDA de quem a recebe quando entrar ou acabar a que tem.')}`,
  { voltar: 'gestor-inventario', titulo: 'Atribuir', gestor: true, pe: acao('Atribuir colunas 07–12', userPlus, ' data-ir="gestor-acompanhar"') });
}

/* ---------- 62 · Acompanhar o inventário ---------- */
type E62 = 'normal' | 'sem-rede';
function acompanhar(e: E62 = 'normal'): string {
  const v = INVENTARIOS[0];
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${v.ref}</h1><span class="gp-tag gp-tag--curso">Em curso</span></div>
    <p class="gp-nota">${v.tipo} · ${v.area} · às cegas · desde ${v.data}</p>
    <section class="gi-dom">${prog(v.feitas, v.total)}
      <dl class="gi-resumo"><div><dt>Contadas</dt><dd>${v.feitas}</dd></div><div><dt>Por contar</dt><dd>${v.total - v.feitas}</dd></div><div><dt>Correções</dt><dd>1</dd></div><div class="is-aviso"><dt>Exceções</dt><dd>2</dd></div></dl></section>
    <section class="gp-sec">${h2('Tarefas')}
      <ul class="gi-secoes" role="list"><li class="gi-secao is-atual"><span><b>Colunas 01–12</b><small>${v.feitas} de ${v.total} posições · última às 10:46</small></span><span class="gi-secao__quem"><i class="gp-av">JS</i>${v.quem}</span></li></ul></section>
    <section class="gp-sec">${h2('Exceções', 2)}
      <ul class="gp-lista" role="list">
        <li><button type="button" class="gp-item gp-item--aviso" data-ir="inv-contados"><span class="gp-item-ic">${L(keyboard)}</span><span class="gp-item-t"><b>Posição escrita à mão</b><small>60300107 · o leitor não leu a etiqueta</small></span><span class="gp-item-e">Ver</span></button></li>
        <li><button type="button" class="gp-item gp-item--info" data-ir="inv-contados"><span class="gp-item-ic">${L(rotate)}</span><span class="gp-item-t"><b>Contagem corrigida</b><small>60300101 · SKF VKPC 88618 · com motivo</small></span><span class="gp-item-e">Ver</span></button></li>
      </ul></section>
    ${nota('Às cegas também para o gestor enquanto se conta: as quantidades do sistema só aparecem na validação.')}`,
  { voltar: 'gestor-inventario', titulo: 'Acompanhar', gestor: true, rede: e !== 'sem-rede', pe: `${sec('Bloquear a contagem', lock, e === 'sem-rede' ? ' disabled' : '')}${sec('Ver o que se contou', list, ' data-ir="inv-contados"')}` });
}

/* ---------- 63 · Validar e fechar ---------- */
type E63 = 'normal' | 'decidido' | 'a-fechar' | 'fechado' | 'recusado';
function validar(e: E63 = 'normal'): string {
  const v = INVENTARIOS[2];
  const DV: [string, string, number, number, 'rever' | 'recontar' | 'aceite'][] = [['60210302', 'SKF VKPC 88618 · Bomba de água', 2, 5, e === 'normal' ? 'rever' : 'aceite'], ['60210401', 'INA 530 0089 10 · Kit de distribuição', 0, 3, 'recontar']];
  if (e === 'fechado') return ecra(`${aviso('ok', shieldCheck, `${v.ref} fechado`, 'O ajuste de stock seguiu para o ERP numa transação do servidor; a auditoria guarda quem validou, quando e cada contagem.')}
    <dl class="gi-resumo"><div><dt>Posições</dt><dd>${v.total}</dd></div><div><dt>Ajustes</dt><dd>1</dd></div><div><dt>Recontadas</dt><dd>1</dd></div><div><dt>Sem diferença</dt><dd>14</dd></div></dl>`,
  { titulo: 'Validar', gestor: true, pe: acao('Ver no histórico', history, ' data-ir="gestor-historico"') });
  const porDecidir = DV.filter((d) => d[4] === 'rever').length;
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">Validar ${v.ref}</h1><span class="gp-tag gp-tag--validar">Por validar</span></div>
    <p class="gp-nota">${v.tipo} · ${v.area} · submetido por ${v.quem} a ${v.data}</p>
    <dl class="gi-resumo"><div><dt>Posições</dt><dd>${v.total}</dd></div><div><dt>Sem diferença</dt><dd>14</dd></div><div class="is-aviso"><dt>Divergências</dt><dd>${DV.length}</dd></div><div><dt>Por decidir</dt><dd>${porDecidir}</dd></div></dl>
    ${e === 'recusado' ? aviso('erro', serverOff, 'O servidor não fechou o inventário', 'Alguém pediu uma recontagem depois de abrir esta página. Nada se ajustou; reveja as divergências e feche outra vez.') : ''}
    <section class="gp-sec">${h2('Divergências', DV.length)}
      <ul class="gp-lista" role="list">${DV.map(([p, a, c, s, k]) => `<li><div class="gi-div gi-div--${k === 'rever' ? '' : k === 'recontar' ? 'recontar' : 'ok'}">${posicao(p, 'gi-pos--peq')}<p class="gi-div__art">${a}</p>
        <dl><div><dt>Contado</dt><dd>${c}</dd></div><div><dt>Sistema</dt><dd>${s}</dd></div><div><dt>Diferença</dt><dd class="is-menos">−${s - c}</dd></div></dl>
        ${k === 'rever' ? `<div class="gi-div__acoes"><button type="button" class="gp-btn gp-btn--acao" data-ir="gestor-validar-decidido">${L(check)}<span>Aceitar</span></button><button type="button" class="gp-btn gp-btn--sec" data-ir="inv-recontar">${L(rotate)}<span>Recontar</span></button></div>`
        : k === 'recontar' ? `<span class="gp-tag gp-tag--planeada">${L(rotate)}Recontagem feita · confirmou 0</span>` : `<span class="gp-tag gp-tag--ok">${L(check)}Aceite: ajuste de −3</span>`}</div></li>`).join('')}</ul></section>
    ${nota('Aceitar não ajusta o stock: o ajuste só se faz ao fechar, pelo servidor, e fica na auditoria.')}`,
  { voltar: 'gestor-inventario', titulo: 'Validar', gestor: true,
    pe: e === 'a-fechar' ? esperar('A fechar o inventário…') : porDecidir ? `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande" disabled aria-describedby="gi-porque">${L(lock)}<span>Fechar o inventário</span></button><p class="gi-porque" id="gi-porque">Falta decidir ${porDecidir} ${porDecidir === 1 ? 'divergência' : 'divergências'}.</p>`
    : acao('Fechar o inventário', shieldCheck, ' data-ir="gestor-validar-fechado"') });
}

/* ---------- 64 · Histórico ---------- */
function historico(): string {
  const H: [string, string, string, string, number, number][] = [['INV-2026-011', 'Por posição · zona 21', 'Joana Silva', 'Fechado hoje', 1, 16], ['INV-2026-009', 'Cíclica · zona 12 · retentores', 'Tiago Lopes', 'Fechado a 14/10', 2, 24]];
  return ecra(`<h1 class="gp-titulo">Histórico</h1>
    <ul class="gp-lista" role="list">${H.map(([r, t, q, d, aj, n], i) => `<li style="--i:${i}"><div class="gp-inv-card"><p><b>${r}</b><span class="gp-tag gp-tag--ok">Fechado</span></p><small>${t} · ${n} posições · ${q}</small><small>${d} · ${aj} ${aj === 1 ? 'ajuste' : 'ajustes'} enviados ao ERP</small>
      <div class="gp-inv-acoes"><button type="button" class="gp-btn gp-btn--sec" data-ir="inv-contados">${L(list)}<span>Ver as contagens</span></button></div></div></li>`).join('')}</ul>
    ${nota('Cada contagem, correção, recontagem e decisão fica na auditoria do servidor, com quem e quando.')}`,
  { voltar: 'gestor-inventario', titulo: 'Histórico', gestor: true });
}

/* =========================================================
   Os ecrãs
   ========================================================= */
/** Os ecrãs e estados novos do Inventário (este ficheiro e inventario-estados.ts). */
export type IdInvCompleto = `op-${string}` | `inv-${string}` | `gestor-${string}`;
const NOTA = 'Do briefing «ROMAFE Warehouse — Android PDA Inventory System» (27 out.), só com rede (ela: «apenas com rede») e na Pick do editor (ela: «no figma»), no desenho da v2.';
const um = (html: string): Ecra['versoes'] => [{ id: 'v1', nota: NOTA, html }];
export function ecrasInventarioCompleto(): Ecra<string>[] {
  const ecr = (id: string, nome: string, fluxo: string, objetivo: string, html: string, de?: string): Ecra<string> => ({ id, nome, fluxo, objetivo, ...(de ? { estadoDe: de } : {}), versoes: um(html) });
  const LER: [E43, string, string][] = [
    ['lido', '43.1 · Artigo lido', 'O artigo aparece e a quantidade abre-se com o cursor lá (sem a do sistema); Enter ou Confirmar regista.'],
    ['registado', '43.2 · Registado', 'O verde por um instante, o último registado em baixo e o leitor já pronto, na mesma posição.'],
    ['fora', '43.3 · Artigo fora da contagem', 'Um artigo que não é do âmbito desta contagem: diz qual é o âmbito e não regista.'],
    ['repetido', '43.4 · Leitura repetida', 'O mesmo artigo já contado nesta posição: somar ou corrigir; nada se substitui em silêncio.'],
    ['desconhecido', '43.5 · Código desconhecido', 'Nem do catálogo nem da contagem: ler outra etiqueta ou separar como por identificar.'],
    ['sem-leitor', '43.6 · Leitor indisponível', 'A tecla de leitura não envia códigos: reiniciar o leitor, ou escrever à mão (marcado como escrito).'],
    ['sem-rede', '43.7 · Sem rede', 'A Pick para e nada fica à espera no PDA; o que se confirmou está no servidor.'],
    ['bloqueado', '43.8 · Inventário bloqueado', 'O gestor bloqueou a contagem para validar: a leitura fica desligada e diz-se porquê.'],
    ['concluida', '43.9 · Tarefa já concluída', 'A contagem já foi submetida: não se conta nem se corrige; recontagens chegam ao início.'],
  ];
  return [
    ecr('op-inicio', '57 · Início do Operador', 'Inventário', 'A página do operador depois da abertura: «A minha próxima tarefa» com Continuar ou Iniciar contagem, as contagens atribuídas, em curso e concluídas, e os módulos que tem. Nada do gestor.', inicioOperador()),
    ecr('op-nova', '57.1 · Tarefa nova', 'Inventário', 'O sistema entregou uma contagem nova: onde começa e «Iniciar contagem».', inicioOperador('nova'), 'op-inicio'),
    ecr('op-sem', '57.2 · Sem tarefas', 'Inventário', 'Nada atribuído: diz-se que o sistema entrega a próxima, sem fila para ver.', inicioOperador('sem'), 'op-inicio'),
    ecr('inv-ler', '43 · Ler e contar', 'Inventário', 'A leitura num só ecrã: o estado da leitura grande (tocar faz de tecla), a posição, o artigo, a quantidade, Confirmar e o último registado; depois de confirmar, volta logo a pronto a ler.', lerContar()),
    ...LER.map(([k, nome, objetivo]) => ecr(`inv-ler-${k}`, nome, 'Inventário', objetivo, lerContar(k), 'inv-ler')),
    ecr('gestor-acompanhar', '62 · Acompanhar o inventário', 'Gestor', 'Um inventário em curso: o progresso real em posições, as tarefas e quem conta, e as exceções (escrito à mão, corrigido); bloquear para validar.', acompanhar()),
    ecr('gestor-acompanhar-sem-rede', '62.1 · Sem rede', 'Gestor', 'Sem rede, a Pick não mostra dados velhos como se fossem de agora: diz-se e as ações esperam.', acompanhar('sem-rede'), 'gestor-acompanhar'),
    ecr('gestor-validar', '63 · Validar e fechar', 'Gestor', 'Um inventário submetido: cada divergência com contado, sistema e diferença; aceitar ou recontar; fechar só quando todas estão decididas.', validar()),
    ecr('gestor-validar-decidido', '63.1 · Tudo decidido', 'Gestor', 'Todas as divergências decididas: Fechar o inventário fica ativo.', validar('decidido'), 'gestor-validar'),
    ecr('gestor-validar-a-fechar', '63.2 · A fechar', 'Gestor', 'O servidor fecha e ajusta o stock numa transação; só o botão espera.', validar('a-fechar'), 'gestor-validar'),
    ecr('gestor-validar-fechado', '63.3 · Fechado', 'Gestor', 'Fechado: o ajuste seguiu para o ERP e a auditoria guarda tudo.', validar('fechado'), 'gestor-validar'),
    ecr('gestor-validar-recusado', '63.4 · Fecho recusado', 'Gestor', 'Outro pedido mudou o inventário entretanto: nada se ajustou; rever e fechar outra vez.', validar('recusado'), 'gestor-validar'),
    ecr('gestor-historico', '64 · Histórico', 'Gestor', 'Os inventários fechados: âmbito, quem contou, quando fechou e os ajustes enviados ao ERP.', historico()),
  ];
}
/** O 61.1 e o 61.2 do Gestor ganham a v2 (o âmbito e as secções). */
export function comGestorV2<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, () => string> = { 'gestor-inv-novo': criar, 'gestor-atribuir': atribuir };
  return ecras.map((e) => V[e.id] ? { ...e, versoes: [...e.versoes, { id: 'v2', nota: `${NOTA} 61.1: o âmbito (zonas, posições, artigos), as zonas ocupadas e às cegas. 61.2: por secções, sem pôr a mesma posição em duas pessoas.`, html: V[e.id]() }] as Ecra<T>['versoes'] } : e);
}
