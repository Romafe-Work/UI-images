/* =========================================================
   INVENTÁRIO — a app Kotlin do PDA, posta no Figma (26 nov. 2026)
   v3 = a 2.0.7 (testada por ela no CK62): «Continuar <secção>» por cima de «Terminar»; prateleira só se começa por 60;
   picar uma prateleira de outra secção abre um diálogo (mudar no PDA ou ir à zona); o nome do artigo picado e «Já
   picado» na contagem; histórico por blocos (contagem, acertos, entradas e saídas); sem «Ver as contagens deste PDA».
   Os ecrãs eram os da 2.0.0 (App.kt de ~/projects/inventario-pda), com os mesmos textos e a mesma ordem. Ela, 26 nov.:
   «esquece o exportar para excel no figma e na nova app; quero o button iniciar inventario e terminar» — e por secção
   («inicio dos oleos e button de fim de oleos»); não se lê a mesma prateleira duas vezes; regista-se o tempo de
   prateleira; fechar a prateleira faz o acerto automático; histórico por prateleira e artigo; sem fotos.
   Entrar só com o nome → Início (inventário e secções) → picar a prateleira (o servidor abre-a ou recusa-a) → picar
   os artigos (cada leitura soma 1) → fechar. Os diálogos e os «a falar com o servidor» são estados do ecrã.
   ========================================================= */
import type { EcraInventario, IdInventario } from './ids';
import { ir } from './ids';
import { L } from '../goparts/portal/inicio-espaco';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import home from 'lucide-static/icons/house.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import square from 'lucide-static/icons/square.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import timer from 'lucide-static/icons/timer.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import entrada from 'lucide-static/icons/arrow-down-to-line.svg?raw';
import saida from 'lucide-static/icons/arrow-up-from-line.svg?raw';
import acerto from 'lucide-static/icons/sliders-horizontal.svg?raw';
import cloudUpload from 'lucide-static/icons/cloud-upload.svg?raw';
import settings from 'lucide-static/icons/settings.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import trash2 from 'lucide-static/icons/trash-2.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import lockOpen from 'lucide-static/icons/lock-open.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';

/* ---------- os dados de exemplo ---------- */
const QUEM = 'Inês Costa';
/** 26 nov. (ela: «só o gestor fará isso»): os acertos são do gestor; a operadora não vê «Acertar». */
const GESTOR = 'Pedro Santos';
/** O estado da prateleira, como vem da API. */
/** 26 nov. (ela: «quero o termo trancar»): Livre → Trancada a contar → Trancada para o acerto → Liberta. */
const estadoPrat = (e: 'LIVRE' | 'TRANCADA_A_CONTAR' | 'TRANCADA_PARA_ACERTO', msg?: string) => {
  const [t, ic, cls] = e === 'TRANCADA_PARA_ACERTO' ? ['Trancada para o acerto', lock, 'fechada'] : e === 'TRANCADA_A_CONTAR' ? ['Trancada · a contar', lock, 'contagem'] : ['Livre · separação e expedição', lockOpen, 'aberta'];
  return `<div class="inv__estado-prat is-${cls}">${L(ic)}<div><b>${t}</b>${msg ? `<small>${msg}</small>` : ''}</div></div>`;
};
const RECENTES = ['Inês Costa', 'Joana Matos', 'Tiago Reis'];
type Linha = { codigo: string; nome: string; n: number; escrito?: boolean };
const un = (ls: Linha[]) => ls.reduce((s, l) => s + l.n, 0);
const codigos = (n: number) => `${n} ${n === 1 ? 'código' : 'códigos'}`;

/* ---------- as peças (as mesmas do App.kt) ---------- */
type Alvo = 'sem' | 'gatilho';
const iniciais = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
const acao = (t: string, ic: string, extra = '', cls = '') => `<button type="button" class="inv__btn inv__btn--acao${cls ? ` ${cls}` : ''}"${extra}>${L(ic)}<span>${t}</span></button>`;
const sec = (t: string, ic: string, extra = '', cls = '') => `<button type="button" class="inv__btn inv__btn--sec${cls ? ` ${cls}` : ''}"${extra}>${L(ic)}<span>${t}</span></button>`;
/** O que acaba alguma coisa (terminar a secção ou o inventário): contorno vermelho, com ícone e texto. */
const fim = (t: string, extra = '') => sec(t, square, extra, 'inv__btn--fim');
const rotulo = (t: string) => `<p class="inv__rotulo">${t}</p>`;
/** 27 nov. (ela: «tens de dizer o que significa −2, +1»): cada diferença com a frase que vem da API. */
type Dif = [number, string, string];
const DIFS_FECHO: Dif[] = [
  [-2, 'Óleo motor 15W40 · bidão 5 L', 'O sistema tem 7, contaste 5: faltam 2 na prateleira. O acerto tira 2 ao stock.'],
  [1, 'Óleo hidráulico ISO 46 · 20 L', 'O sistema tem 3, contaste 4: há 1 a mais na prateleira. O acerto soma 1 ao stock.'],
  [1, 'Código que não está no stock', 'Código que não está no stock: contaste 1. Vai ao gestor para ver que artigo é.'],
];
const DIFS_ACERTO: Dif[] = [
  [-2, 'Óleo motor 15W40 · bidão 5 L', 'O stock tinha 7, estão 5: tirou 2 ao stock (faltavam na prateleira).'],
  [1, 'Óleo hidráulico ISO 46 · 20 L', 'O stock tinha 3, estão 4: somou 1 ao stock (havia a mais na prateleira).'],
  [-1, 'Óleo de engrenagens 80W90 · 5 L', 'O stock tinha 1, estão 0: tirou 1 ao stock (faltava na prateleira).'],
];
const difLinhas = (ds: Dif[]) => `<ul class="inv__difs">${ds.map(([n, a, t]) => `<li><b>${n > 0 ? `+${n}` : n}</b><span><strong>${a}</strong><small>${t}</small></span></li>`).join('')}</ul>`;
const aviso = (t: string, tom: 'erro' | 'ok' | 'laranja' | 'azul') => `<p class="inv__aviso inv__aviso--${tom}">${t}</p>`;

function topo(titulo: string, sub?: string, voltar?: IdInventario, direita = ''): string {
  const esq = voltar
    ? `<button type="button" class="inv__voltar" aria-label="Voltar" ${ir(voltar)}>${L(arrowLeft)}</button>`
    : '<span class="inv__marca">ROMAFE</span>';
  return `<header class="inv__topo">${esq}<div class="inv__titulos"><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${direita}</header>`;
}

/** O alvo da leitura: diz o que picar e mostra o erro em texto. Com o gatilho, também «Usar a câmara». */
function alvo(titulo: string, sub: string, o: { erro?: string; leitor?: Alvo; lido?: boolean; destino?: IdInventario; cresce?: boolean } = {}): string {
  const cls = `inv__alvo${o.erro ? ' is-erro' : ''}${o.lido ? ' is-lido' : ''}${o.cresce ? ' is-cresce' : ''}`;
  const leva = o.destino ? ` ${ir(o.destino)}` : '';
  return `<div class="${cls}"${leva}${o.destino ? ' role="button" tabindex="0"' : ''}>
    ${L(o.erro ? triangleAlert : scanBarcode, 'inv__alvo-ic')}
    <p class="inv__alvo-titulo">${titulo}</p>
    <p class="inv__alvo-sub">${o.erro ?? sub}</p>
    ${o.leitor === 'gatilho' ? `<p class="inv__alvo-dica">Gatilho ou toque longo aqui para ler</p>
    <button type="button" class="inv__camara-btn" ${ir('camara')}>${L(camera)}<span>Usar a câmara</span></button>` : ''}
  </div>`;
}

/** 27 nov.: o alvo numa faixa (lê na mesma, com o gatilho ou a câmara), para a lista do que se picou caber no CK62. */
function alvoCompacto(titulo: string, o: { erro?: string; lido?: boolean; destino?: IdInventario } = {}): string {
  const cls = `inv__alvo inv__alvo--faixa${o.erro ? ' is-erro' : ''}${o.lido ? ' is-lido' : ''}`;
  return `<div class="${cls}"${o.destino ? ` ${ir(o.destino)} role="button" tabindex="0"` : ''}>
    ${L(o.erro ? triangleAlert : scanBarcode, 'inv__alvo-ic')}
    <div class="inv__cresce"><p class="inv__alvo-titulo">${titulo}</p>${o.erro ? `<p class="inv__alvo-sub">${o.erro}</p>` : ''}</div>
    <button type="button" class="inv__icone-camara" aria-label="Usar a câmara" ${ir('camara')}>${L(camera)}</button>
  </div>`;
}

/** 27 nov.: a posição numa faixa fina com o cadeado, a contar depois do primeiro artigo (a lista do picado tem espaço no CK62). */
/** 27 nov. (ela: «na app tenho de ver quando fica destrancada»): as prateleiras da secção e o estado de cada uma (vem da base
 *  de dados, atualiza de 5 em 5 s): vê-se a prateleira passar de trancada a liberta quando o gestor acerta. */
const PRATS: [string, 'TRANCADA_PARA_ACERTO' | 'TRANCADA_A_CONTAR' | 'LIBERTA' | 'LIVRE', string][] = [
  ['60800103', 'TRANCADA_PARA_ACERTO', 'A 60800103 está trancada para o acerto: foi contada por Inês Costa e tem 2 diferenças. Só fica liberta depois de o gestor acertar.'],
  ['60800201', 'TRANCADA_PARA_ACERTO', 'A 60800201 está trancada para o acerto: foi contada por Joana Matos e não tem diferenças. Só fica liberta depois de o gestor acertar.'],
  ['60800202', 'TRANCADA_A_CONTAR', 'A 60800202 está trancada: a ser contada por Tiago Reis desde as 10:31. Ninguém mexe nela.'],
  ['60800101', 'LIBERTA', 'A 60800101 está liberta: contada por Inês Costa e acertada por Pedro Santos às 10:29. Pode ser usada na separação e na expedição.'],
  ['60800102', 'LIBERTA', 'A 60800102 está liberta: contada por Joana Matos e acertada por Pedro Santos às 10:12. Pode ser usada na separação e na expedição.'],
  ['60800203', 'LIVRE', ''], ['60800301', 'LIVRE', ''], ['60800302', 'LIVRE', ''],
];
function prateleirasEcra(): string {
  const rot = { TRANCADA_PARA_ACERTO: ['Trancada para o acerto', lock, 'is-laranja'], TRANCADA_A_CONTAR: ['Trancada · a contar', lock, 'is-azul'], LIBERTA: ['Liberta', lockOpen, 'is-verde'], LIVRE: ['Livre · por contar', lockOpen, ''] } as const;
  return pagina({
    k: 'prateleiras',
    topo: topo('Prateleiras de Óleos', 'Atualiza sozinha', 'inicio'),
    corpo: `<ul class="inv__linhas inv__prats">${PRATS.map(([p, e, m]) => `<li class="inv__prat${e === 'LIBERTA' ? ' is-liberta' : ''}">
      <div class="inv__linha"><b class="inv__codigo inv__cresce">${p}</b><span class="inv__prat-est ${rot[e][2]}">${L(rot[e][1])}${rot[e][0]}</span></div>${m ? `<small>${m}</small>` : ''}</li>`).join('')}</ul>`,
  });
}

function posicaoFaixa(codigo: string): string {
  const partes: [string, string][] = [['Arm.', codigo.slice(0, 2)], ['Zona', codigo.slice(2, 4)], ['Col.', codigo.slice(4, 6)], ['Prat.', codigo.slice(6, 8)]];
  return `<div class="inv__posicao inv__posicao--faixa" aria-label="Prateleira ${codigo}, trancada a contar">${partes.map(([r, v]) => `<span><small>${r}</small><b>${v}</b></span>`).join('')}${L(lock, 'inv__posicao-cadeado')}</div>`;
}

function posicaoGrande(codigo: string): string {
  const partes: [string, string][] = [['Arm.', codigo.slice(0, 2)], ['Zona', codigo.slice(2, 4)], ['Col.', codigo.slice(4, 6)], ['Prat.', codigo.slice(6, 8)]];
  return `<div class="inv__posicao" aria-label="Prateleira ${codigo}">${partes.map(([r, v]) => `<span><small>${r}</small><b>${v}</b></span>`).join('')}</div>`;
}

const cartao = (dentro: string, destino?: IdInventario) => `<div class="inv__cartao"${destino ? ` ${ir(destino)} role="button" tabindex="0"` : ''}>${dentro}</div>`;
const pe = (dentro: string) => `<footer class="inv__pe">${dentro}</footer>`;

/** A página: o topo, (a posição), o corpo que rola e o pé; por cima, um diálogo ou o «a falar com o servidor». */
function pagina(o: { k: string; topo: string; posicao?: string; faixa?: boolean; corpo: string; pe?: string; sobre?: string; escuro?: boolean; semRede?: string; aviso?: string }): string {
  return `<div class="inv${o.escuro ? ' inv--camara' : ''}" data-inv="${o.k}" data-ir-ultima>
    ${o.semRede ? semRede(o.semRede) : ''}${o.aviso ?? ''}${o.topo}${o.posicao ? (o.faixa ? posicaoFaixa(o.posicao) : posicaoGrande(o.posicao)) : ''}
    <main class="inv__corpo">${o.corpo}</main>
    ${o.pe ?? ''}${o.sobre ?? ''}
  </div>`;
}

/**
 * 2.1.0 (ela: «não te esqueças de implementar todos os estados sem rede … e colocar no Figma também»): a faixa SEM REDE
 * por cima de todos os ecrãs (menos Entrar e Ligação); a app tenta sozinha de 5 em 5 s.
 */
const REDE = { geral: 'O servidor não responde. A tentar outra vez…', contar: 'Continua a picar: fica no PDA. Ao trancar, espera pela rede.', acertar: 'O que mudares fica aqui; o acerto só se faz com rede.' };
/** 27 nov. (ela: «ele deve agir logo»): a faixa do gestor — o PDA vibra e mostra a prateleira trancada, em qualquer ecrã. Sem tempos. */
// 27 nov. (ela: «o acertar deve aparecer no screen principal e não acima»; «mantém sempre em cor laranja até à próxima ação»; «sê mais explícito»)
const cartaoGestor = `<button type="button" class="inv__cartao-gestor" ${ir('acertar')}>
  <span class="inv__linha">${L(lock)}<b>Tens de acertar a 60800103</b></span>
  <p>Inês Costa contou-a e trancou-a: tem 2 diferenças entre o que está na prateleira e o stock do sistema.</p>
  <p>Enquanto não a acertares, ninguém pode separar nem expedir desta prateleira.</p>
  <p><strong>A separação já tentou tirar artigos daqui e foi recusada: está à espera de ti.</strong></p>
  <small>Depois desta, há mais 2 prateleiras à espera do acerto.</small>
  <em>${L(acerto)}<span>Acertar a 60800103 agora</span></em></button>`;
const semRede = (t: string) => `<div class="inv__semrede" role="status">${L(wifiOff)}<div class="inv__cresce"><b>Sem rede</b><small>${t}</small></div><button type="button">Tentar</button></div>`;

/* ---------- diálogos (AlertDialog) ---------- */
function dialogo(titulo: string, corpo: string, sim: string, nao: string): string {
  return `<div class="inv__veu"><div class="inv__dialogo" role="dialog" aria-modal="true" aria-label="${titulo.replace(/<[^>]+>/g, '')}">
    <h2>${titulo}</h2><div class="inv__dialogo-corpo">${corpo}</div>
    <div class="inv__dialogo-botoes">${nao}${sim}</div>
  </div></div>`;
}
const ocupado = (t: string) => `<div class="inv__veu"><p class="inv__ocupado" role="status"><span class="inv__roda" aria-hidden="true"></span>${t}</p></div>`;
const campo = (rot: string, valor = '', o: { mono?: boolean; erro?: string; tipo?: string; dica?: string } = {}) => `<label class="inv__campo${o.erro ? ' is-erro' : ''}">
    <span>${rot}</span><input type="${o.tipo ?? 'text'}" value="${valor}"${o.mono ? ' class="is-mono"' : ''}>${o.erro ? `<small>${o.erro}</small>` : ''}</label>${o.dica ? `<p class="inv__dica">${o.dica}</p>` : ''}`;

/* =========================================================
   Os ecrãs
   ========================================================= */
const INV = 'Inventário 26/11/2026';
type Sec = { nome: string; zona: string; est: 'por' | 'dec' | 'fim'; txt: string; acertar?: number; tr?: number; lib?: number };
const SECCOES: Sec[] = [
  { nome: 'Óleos', zona: '80', est: 'dec', txt: 'A decorrer desde as 08:05 · 6 prateleiras · 1 a contar · 3 trancadas à espera do acerto', acertar: 5, tr: 3, lib: 2 },
  { nome: 'Auto', zona: '30', est: 'dec', txt: 'A decorrer desde as 09:30 · 3 prateleiras', tr: 0, lib: 3 },
  { nome: 'Rolamentos', zona: '10, 11, 20, 21, 22', est: 'fim', txt: 'Terminada às 10:12 · 14 prateleiras', tr: 0, lib: 14 },
];

function entrar(primeira: boolean): string {
  const lista = primeira ? '' : `${rotulo('Já entraram neste PDA')}
    ${RECENTES.map((n) => cartao(`<div class="inv__linha"><span class="inv__iniciais">${iniciais(n)}</span><b class="inv__nome">${n}</b>${L(play, 'inv__seta')}</div>`, 'inicio')).join('')}
    ${rotulo('Outra pessoa')}`;
  return pagina({
    k: primeira ? 'entrar-primeira' : 'entrar',
    topo: topo('Inventário', 'Quem vai contar?'),
    corpo: `${lista}${campo('O teu nome', primeira ? 'Inês Costa' : '')}`,
    pe: pe(acao('Entrar', check, ` ${ir('inicio')}${primeira ? '' : ' disabled'}`)),
  });
}

function seccao(s: Sec, estado: Sec['est'] = s.est, txt = s.txt, gestor = false): string {
  const botao = estado === 'por' ? sec(`Iniciar ${s.nome}`, play, ` ${ir('inicio')}`)
    // 26 nov. (ela: «o botão de acertar óleos por baixo do continuar óleos, e é assim que se fazem os acertos»)
    // 27 nov. (ela: «simplifica todos os ecrãs»): «Acertar» e «Terminar» lado a lado por baixo do «Continuar» (o nome já está no cartão)
    : estado === 'dec' ? `${acao(`Continuar ${s.nome}`, play, ` ${ir('prateleira')}`)}<div class="inv__par">${gestor ? sec(s.acertar ? `Acertar (${s.acertar})` : 'Acertar', acerto, ` ${ir('acertar-picar')}`) : ''}${fim('Terminar', ` ${ir('inicio-terminar-seccao')}`)}</div>` : '';
  return `<div class="inv__cartao inv__seccao">
    <div class="inv__linha"><div class="inv__cresce"><b class="inv__nome">${s.nome}</b><small class="${estado === 'dec' ? 'is-decorrer' : ''}">${txt}</small></div>${estado === 'fim' ? L(circleCheck, 'inv__certo') : ''}</div>
    ${estado !== 'por' ? `<button type="button" class="inv__trancadas" ${ir('prateleiras')}>${L(lock, s.tr ? 'is-laranja' : '')}<b>${s.tr ?? 0} ${s.tr === 1 ? 'trancada' : 'trancadas'}</b>${L(lockOpen, 'is-verde')}<b class="inv__cresce">${s.lib ?? 0} ${s.lib === 1 ? 'liberta' : 'libertas'}</b><span>Prateleiras</span>${L(chevronRight)}</button>` : ''}
    ${botao}</div>`;
}

type EstInicio = '' | 'gestor' | 'gestor-aviso' | 'sem-inventario' | 'iniciar' | 'nenhuma-seccao' | 'terminar-seccao' | 'terminar' | 'por-fechar' | 'sem-servidor' | 'a-iniciar';
function inicio(e: EstInicio = ''): string {
  const trocar = `<button type="button" class="inv__trocar" ${ir('entrar')}>${L(logOut)}<span>Trocar</span></button>`;
  const semInv = e === 'sem-inventario' || e === 'iniciar' || e === 'a-iniciar';
  const nenhuma = e === 'nenhuma-seccao';
  const lista = SECCOES;
  const seccoes = nenhuma ? [seccao(SECCOES[0], 'por', 'Por iniciar · zona 80'), seccao(SECCOES[1]), seccao(SECCOES[2], 'por', 'Por iniciar · zonas 10, 11, 20, 21, 22')] : lista.map((s) => seccao(s, s.est, s.txt, e === 'gestor' || e === 'gestor-aviso'));
  const cabInv = cartao(`<div class="inv__linha"><div class="inv__cresce"><b class="inv__nome">${INV}</b><small>Desde hoje às 08:00 · Joana Matos</small></div>
      <div class="inv__direita"><strong class="inv__grande">${nenhuma ? 0 : 20}</strong><small>contadas</small></div></div>`);
  const ligado = `<button type="button" class="inv__ligada" ${ir('ligacao')}>${L(settings)}<span>Servidor: 127.0.0.1:5198</span><b>Mudar</b></button>`;
  const comuns = `${e === 'por-fechar' ? `${aviso('Sem ligação ao servidor (127.0.0.1:5198). Confirma a rede e tenta outra vez.', 'erro')}${sec('Trancar no servidor (2)', cloudUpload)}` : ''}
    ${sec('Histórico de uma prateleira ou artigo', history, ` ${ir('historico')}`)}`;
  let corpo: string, rodape: string;
  if (e === 'sem-servidor') {
    corpo = `${aviso('Sem ligação ao servidor (127.0.0.1:5198). Confirma a rede e tenta outra vez.', 'erro')}${sec('Tentar outra vez', refresh, ` ${ir('inicio')}`)}${comuns}${ligado}`;
    rodape = acao('Tentar outra vez', refresh, ` ${ir('inicio')}`);
  } else if (semInv) {
    corpo = `${cartao('<b class="inv__nome">Nenhum inventário a decorrer</b><small class="inv__dica">O último: Inventário 12/11/2026, terminado a 12/11/2026 17:40 por Pedro Santos · 212 prateleiras</small>')}${comuns}${ligado}`;
    rodape = acao('Iniciar inventário', play, ` ${ir('inicio-iniciar')}`);
  } else {
    corpo = `${e === 'gestor-aviso' ? cartaoGestor : ''}${cabInv}
      ${rotulo('Secções')}${seccoes.join('')}
      ${comuns}${fim('Terminar inventário', ` ${ir('inicio-terminar')}`)}${ligado}`;
    // 27 nov. (ela: «simplifica todos os ecrãs»): conta-se pelo «Continuar Óleos»; sem o alvo que não lia nem o «Contar uma prateleira» repetido
    rodape = '';
  }
  const sobre = e === 'iniciar' ? dialogo('Iniciar o inventário?', '<p>Começa o inventário de hoje. As secções ficam por iniciar: cada uma começa com o seu botão (ex.: «Iniciar Óleos»).</p>',
      acao('Iniciar inventário', play, ` ${ir('inicio-nenhuma-seccao')}`), sec('Voltar', arrowLeft, ` ${ir('inicio-sem-inventario')}`))
    : e === 'terminar-seccao' ? dialogo('Terminar Óleos?', '<p>Depois de terminar, as prateleiras de Óleos já não se contam neste inventário (6 prateleiras contadas).</p>',
      acao('Terminar Óleos', square, ` ${ir('inicio')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('inicio')}`))
    : e === 'terminar' ? dialogo('Terminar o inventário?', '<p>Depois de terminar não se conta mais nenhuma prateleira neste inventário. As secções a decorrer (Óleos, Auto) terminam também.</p>',
      acao('Terminar inventário', square, ` ${ir('inicio-sem-inventario')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('inicio')}`))
    : e === 'a-iniciar' ? ocupado('A iniciar o inventário…') : '';
  return pagina({ k: `inicio${e ? `-${e}` : ''}`, topo: topo('Inventário', e === 'gestor' || e === 'gestor-aviso' ? GESTOR : QUEM, undefined, trocar), corpo, pe: rodape ? pe(rodape) : undefined, sobre, semRede: e === 'sem-servidor' || e === 'por-fechar' ? REDE.geral : undefined });
}

type EstPrat = '' | 'gestor' | 'sem-rede' | 'por-fechar' | 'escrever' | 'ocupada' | 'ja-contada' | 'nao-iniciada' | 'a-abrir' | 'fechada' | 'fechada-acertos' | 'artigo' | 'outra-seccao' | 'ficar';
function prateleira(e: EstPrat = ''): string {
  const feito = e === 'fechada' || e === 'fechada-acertos' || e === 'por-fechar' || e === 'gestor';
  const erro = e === 'ocupada' ? 'A 60800102 está a ser contada por Joana Matos desde as 09:42 (EDA61K-3896).'
    : e === 'ja-contada' ? 'A 60800101 já foi contada neste inventário, hoje às 08:15, por Joana Matos. Não se conta duas vezes.'
    : e === 'nao-iniciada' ? 'A 60100102 é da secção Rolamentos, que ainda não começou. Inicia-a no Início.'
    : e === 'artigo' ? 'Isso é um artigo (Óleo motor 15W40 · bidão 5 L). Pica primeiro a etiqueta da prateleira: começa por 60.'
    : e === 'ficar' ? 'Pica uma prateleira de Auto (zona 30).'
    : e === 'sem-rede' ? 'Sem rede: a 60800102 não abre, porque é o servidor que a tranca para mais ninguém a contar. Pica outra vez quando a rede voltar.' : undefined;
  const banner = feito ? `<div class="inv__feito">${L(circleCheck)}<div><b>60800101 trancada</b><span>42 un. · 2 códigos · 2 min 05 s</span>
      <strong class="${e === 'fechada' ? '' : e === 'por-fechar' ? 'is-erro' : 'is-azul'}">${e === 'fechada' ? 'Trancada em 2 min 05 s: bate com o stock, não precisa de acerto. Ficou liberta.' : e === 'por-fechar' ? 'Por trancar: sem rede. Fica no PDA e tranca-se sozinha quando a rede voltar.' : '2 diferenças por acertar · 1 fora do stock, para o Gestor'}</strong>${e === 'fechada-acertos' || e === 'gestor' ? difLinhas(DIFS_FECHO) : ''}${e === 'gestor' ? acao('Acertar agora', acerto, ` ${ir('acertar')}`) : ''}</div></div>` : '';
  const sobre = e === 'fechada' ? dialogo('A 60800101 bate com o stock', '<p>Não precisa de acerto: ficou liberta para a separação e a expedição.</p>',
      acao('Continuar Óleos', play, ` ${ir('prateleira')}`), sec('Voltar ao Início', home, ` ${ir('inicio')}`))
    : e === 'escrever' ? dialogo('Escrever a prateleira', `${campo('O código da prateleira', '', { mono: true, dica: 'Ex.: 60300102' })}`,
      acao('Contar', check, ` ${ir('contar')}`), sec('Voltar', arrowLeft, ` ${ir('prateleira')}`))
    : e === 'a-abrir' ? ocupado('A abrir a prateleira 60800101…')
    : e === 'outra-seccao' ? dialogo('Prateleira de Óleos',
      '<p>Estás a contar Auto (zona 30), e a 60800101 é da zona 80, de Óleos. Mudas para Óleos no PDA, ou vais à zona 30 no armazém?</p>',
      acao('Mudar para Óleos', arrowLeftRight, ` ${ir('contar')}`), sec('Vou à zona 30', arrowLeft, ` ${ir('prateleira-ficar')}`)) : '';
  // 26 nov. (ela: «relatar os vários estados de acordo com o que está a acontecer — isso recebo da DB»)
  const estadoApi = e === 'ocupada' ? estadoPrat('TRANCADA_A_CONTAR', 'A 60800102 está trancada: a ser contada por Joana Matos desde as 09:42. Ninguém mexe nela.')
    : e === 'ja-contada' ? estadoPrat('TRANCADA_PARA_ACERTO', 'A 60800101 está trancada para o acerto: foi contada por Joana Matos e tem 3 diferenças. Só fica liberta depois de o gestor acertar.')
    : e === 'fechada-acertos' ? estadoPrat('TRANCADA_PARA_ACERTO', 'A 60800101 está trancada para o acerto: foi contada por Inês Costa e tem 2 diferenças. Só fica liberta depois de o gestor acertar.')
    : e === 'fechada' ? estadoPrat('TRANCADA_PARA_ACERTO', 'A 60800101 está trancada para o acerto: foi contada por Inês Costa e não tem diferenças. Só fica liberta depois de o gestor acertar.') : '';
  // entra-se por «Continuar Auto» (a secção fica escolhida); o 03 normal vem de «Continuar Óleos»
  const auto = e === 'outra-seccao' || e === 'ficar';
  return pagina({
    k: `prateleira${e ? `-${e}` : ''}`,
    topo: topo('Contar uma prateleira', `${e === 'gestor' ? GESTOR : QUEM} · ${auto ? 'Auto · zona 30' : 'Óleos · zona 80'}`, 'inicio'),
    corpo: `${feito ? '' : estadoApi}${banner}${alvo(feito ? 'Pica a próxima prateleira' : 'Pica a prateleira', 'Cada prateleira conta-se uma vez neste inventário.', { erro, leitor: 'gatilho', destino: 'prateleira-a-abrir', cresce: true })}`,
    pe: pe(sec('Escrever o código da prateleira', keyboard, ` ${ir('prateleira-escrever')}`)),
    sobre,
    semRede: e === 'sem-rede' || e === 'por-fechar' ? REDE.geral : undefined,
  });
}

const PO = '60800101';
const LINHAS_O: Linha[] = [
  { codigo: '5601234567892', nome: 'Óleo motor 15W40 · bidão 5 L · OLEO-15W40-5L', n: 3 },
  { codigo: '5601234567885', nome: 'Óleo motor 10W40 · 1 L · OLEO-10W40-1L', n: 4 },
  { codigo: '5601234567878', nome: 'Óleo hidráulico ISO 46 · 20 L · OLEO-HID-46-20L', n: 1 },
  { codigo: '7316570483925', nome: 'Massa LGMT 2 · 1 kg · MASSA-LGMT2-1KG', n: 2, escrito: true },
  { codigo: '5600000000014', nome: '', n: 1 },
];
const nomeDe = (l: Linha) => l.nome || '<span class="inv__fora">Código que não está no stock</span>';

type EstContar = '' | 'sem-rede' | 'lido' | 'escrever' | 'corrigir' | 'parece-prateleira' | 'mesma' | 'sair' | 'descartar';
function contar(e: EstContar = ''): string {
  const ls = e === '' ? [] : LINHAS_O;
  const rede = e === 'sem-rede';
  const ultima = e === 'lido' ? '5601234567892' : undefined;
  const picado = false;  // 26 nov. (ela): «o já picado não deve ser botão» — a lista vê-se ao trancar
  const erro = e === 'mesma' ? `Já estás na prateleira ${PO}. Pica os artigos.`
    : e === 'sair' ? `Acaba a ${PO} antes de sair: «Trancar prateleira» ou «Vazia».` : undefined;
  const direita = `<span class="inv__relogio" aria-label="Tempo de prateleira">${L(timer)}<b>${e === '' ? '00:04' : '01:52'}</b></span>
    <button type="button" class="inv__icone-topo" aria-label="Descartar esta contagem" ${ir('contar-descartar')}>${L(trash2)}</button>`;
  const linhas = ls.length === 0
    ? '<p class="inv__nada">Ainda nada. Se a prateleira não tem nada, carrega em «Prateleira vazia».</p>'
    : `<ul class="inv__linhas">${ls.map((l) => `<li class="inv__lin${l.codigo === ultima ? ' is-ultima' : ''}" ${ir('contar-corrigir')} role="button" tabindex="0">
        <div class="inv__cresce"><b class="inv__nome-art">${nomeDe(l)}</b><small class="inv__codigo-peq">${l.codigo}${l.escrito ? ' · escrito à mão' : ''}</small></div>
        <strong class="inv__qtd">${l.n}</strong>${L(pencil, 'inv__lapis')}</li>`).join('')}</ul>`;
  const sobre = e === 'escrever' ? dialogo('Escrever o artigo',
      `${campo('Código do artigo', '7316570483925', { mono: true })}${campo('Quantidade', '2', { tipo: 'number' })}
       <p class="inv__dica">Para artigos sem etiqueta ou com etiqueta que não lê. A linha fica marcada como escrita à mão.</p>`,
      acao('Somar 2', check, ` ${ir('contar-lido')}`), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : e === 'corrigir' ? dialogo('Corrigir a quantidade',
      `<p class="inv__codigo inv__codigo--grande">5601234567892</p><p class="inv__dica">Óleo motor 15W40 · bidão 5 L</p>
       <div class="inv__passo"><button type="button" class="inv__quadrado" aria-label="Menos um">${L(minus)}</button><input type="number" value="2" aria-label="Quantidade"><button type="button" class="inv__quadrado" aria-label="Mais um">${L(plus)}</button></div>
       <p class="inv__dica">Estavam 3. A correção fica registada.</p>
       ${sec('Tirar da contagem', trash2, ` ${ir('contar-lido')}`)}`,
      acao('Guardar', check, ` ${ir('contar-lido')}`), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : e === 'parece-prateleira' ? dialogo('60800102 é uma prateleira',
      `<p>Acabaste a ${PO}? Podes trancá-la e passar à 60800102, ou contar este código como um artigo.</p>`,
      acao('Trancar e passar', lock, ` ${ir('prateleira-fechada-acertos')}`), sec('Contar como artigo', plus, ` ${ir('contar-lido')}`))
    : e === 'descartar' ? dialogo('Descartar esta contagem?',
      `<p>Apaga o que já contaste na ${PO}. A prateleira volta a ficar livre, por contar.</p>`,
      acao('Descartar', trash2, ` ${ir('inicio')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : '';
  return pagina({
    k: `contar${e ? `-${e}` : ''}`,
    topo: topo('Óleos', QUEM, undefined, direita),
    posicao: PO,
    // 27 nov. (ela: «enquanto pico quero os artigos que vou picando nessa prateleira» e «tem muita coisa no ecrã, o item
    // picado fica cortado»): depois do primeiro artigo a posição passa a faixa fina com o cadeado (sai a caixa do estado),
    // o alvo a uma faixa e Escrever e Trancar a uma linha, para a lista do picado ficar com o ecrã
    faixa: ls.length > 0,
    corpo: `${ls.length ? '' : estadoPrat('TRANCADA_A_CONTAR', `A ${PO} está trancada: a ser contada por ${QUEM} desde as 10:24. Ninguém mexe nela.`)}${picado ? '' : ls.length
      ? alvoCompacto('Pica o próximo artigo', { erro, lido: !!ultima, destino: 'contar-lido' })
      : alvo('Pica o artigo', 'Cada leitura soma 1. Toca numa linha para corrigir.', { erro, leitor: 'gatilho', destino: 'contar-lido' })}
      <div class="inv__cab-linhas">${rotulo('Picado nesta prateleira')}<b>${un(ls)} un. · ${codigos(ls.length)}</b></div>
      ${linhas}`,
    pe: pe(`<div class="inv__par${ls.length ? ' inv__par--trancar' : ''}">${sec('Escrever', keyboard, ` ${ir('contar-escrever')}`)}${ls.length
      ? acao('Trancar', lock, ` ${ir(rede ? 'prateleira-por-fechar' : 'resumo')}`) : sec('Vazia', inbox, ` ${ir('resumo-vazia')}`)}</div>`),
    sobre,
    semRede: rede ? REDE.contar : undefined,
  });
}

function camaraEcra(lido: boolean): string {
  return pagina({
    k: lido ? 'camara-lido' : 'camara', escuro: true,
    topo: topo(`Prateleira ${PO}`, `${lido ? 12 : 11} un. · ${codigos(5)}`, lido ? 'contar-lido' : 'contar'),
    corpo: `<div class="inv__visor" aria-hidden="true"><div class="inv__mira${lido ? ' is-lido' : ''}"><span class="inv__feixe"></span></div></div>`,
    pe: `<footer class="inv__pe">${lido ? '<div class="inv__lida"><b class="inv__codigo">5601234567892</b><strong>4</strong></div>' : '<p class="inv__dica">Aponta a mira à etiqueta. A mesma etiqueta só volta a contar passados 2 segundos.</p>'}
      ${acao('Fechar a câmara', x, ` ${ir('contar-lido')}`)}</footer>`,
  });
}

type EstResumo = '' | 'vazia' | 'a-fechar';
function resumo(e: EstResumo = ''): string {
  const ver = false, vazia = e === 'vazia';
  const ls = vazia ? [] : LINHAS_O;
  const titulo = ver ? `Prateleira ${PO}` : vazia ? 'Prateleira vazia?' : `Trancar ${PO}?`;
  const sub = ver ? `${QUEM} · 26/11/2026 10:26` : vazia ? 'Viste a prateleira toda e não tem nada?' : 'Vê se está tudo';
  return pagina({
    k: `resumo${e ? `-${e}` : ''}`,
    topo: topo(titulo, sub, vazia ? 'contar' : 'contar-lido'),
    posicao: PO, faixa: true,
    corpo: `<div class="inv__totais"><b>${codigos(ls.length)} · ${un(ls)} un.</b><span>${L(timer)}02:01</span></div>
      ${ls.some((l) => l.escrito) ? aviso('1 código foi escrito à mão: confirma que está certo.', 'laranja') : ''}
      ${ls.length ? `<ul class="inv__linhas inv__linhas--resumo">${ls.map((l) => `<li><div class="inv__cresce"><b class="inv__nome-art">${nomeDe(l)}</b><small class="inv__codigo-peq">${l.codigo}</small></div><strong>${l.n}</strong></li>`).join('')}</ul>` : ''}`,
    pe: ver ? undefined : pe(`<div class="inv__par">${sec('Continuar', scanBarcode, ` ${ir(vazia ? 'contar' : 'contar-lido')}`)}${acao(vazia ? 'Está vazia' : 'Trancar', vazia ? inbox : lock, ` ${ir(vazia ? 'prateleira-fechada' : 'resumo-a-fechar')}`, 'inv__btn--largo')}</div>`),
    sobre: e === 'a-fechar' ? ocupado(`A trancar a ${PO}…`) : '',
  });
}

/* =========================================================
   ACERTAR (2.0.9). Ela: «quando faço acertar óleo tenho de picar a prateleira e depois posso editar o que tenho …
   manualmente ou picando todos os artigos». Acertar Óleos → picar a prateleira → editar → Acertar prateleira.
   ========================================================= */
type EstAcPicar = '' | 'sem-rede' | 'feito' | 'nao-contada' | 'outra';
function acertarPicar(e: EstAcPicar = ''): string {
  const erro = e === 'nao-contada' ? 'A 60800203 ainda não foi contada neste inventário: conta-a primeiro («Continuar»).'
    : e === 'outra' ? 'A 60300102 é de Auto, não de Óleos.'
    : e === 'sem-rede' ? 'Sem rede: não consigo ver a 60800101. Pica outra vez quando a rede voltar.' : undefined;
  return pagina({
    k: `acertar-picar${e ? `-${e}` : ''}`,
    topo: topo('Acertar Óleos', `${GESTOR} · zona 80`, 'inicio-gestor'),
    corpo: `${e === 'feito' ? `<div class="inv__aviso inv__aviso--ok">60800101 acertada: 3 acertos feitos. A prateleira está liberta para a separação e a expedição.${difLinhas(DIFS_ACERTO)}</div>` : ''}
      ${alvoCompacto('Pica a prateleira ou toca numa', { erro, destino: 'acertar' })}
      <div class="inv__cab-linhas">${rotulo('Trancadas à espera do acerto')}<b>${e === 'feito' ? 2 : 3}</b></div>
      <ul class="inv__linhas">${(e === 'feito' ? FECHADAS.slice(1) : FECHADAS).map(([p, n, quem]) => `<li class="inv__lin" ${ir('acertar')} role="button" tabindex="0">${L(lock, 'inv__cadeado')}
        <div class="inv__cresce"><b class="inv__codigo">${p}</b><small>${n} ${n === 1 ? "diferença" : "diferenças"} · contada por ${quem}</small></div>${L(chevronRight, 'inv__lapis')}</li>`).join('')}</ul>`,
    pe: pe(sec('Escrever o código da prateleira', keyboard, ` ${ir('acertar')}`)),
    semRede: e === 'sem-rede' ? REDE.geral : undefined,
  });
}

const FECHADAS: [string, number, string][] = [['60800101', 3, 'Joana Matos'], ['60800102', 1, 'Inês Costa'], ['60800203', 2, 'Inês Costa']];
type LAc = { codigo: string; nome: string; stock: number; contado: number };
const AC: LAc[] = [
  { codigo: '5601234567892', nome: 'Óleo motor 15W40 · bidão 5 L', stock: 5, contado: 3 },
  { codigo: '5601234567885', nome: 'Óleo motor 10W40 · 1 L', stock: 4, contado: 4 },
  { codigo: '5601234567878', nome: 'Óleo hidráulico ISO 46 · 20 L', stock: 1, contado: 1 },
  { codigo: '7316570483925', nome: 'Massa LGMT 2 · 1 kg', stock: 0, contado: 2 },
  { codigo: '5600000000014', nome: '', stock: 0, contado: 1 },
];
type EstAc = '' | 'sem-rede' | 'lido' | 'mudar' | 'de-novo' | 'zerado' | 'confirmar' | 'a-acertar';
function acertarEcra(e: EstAc = ''): string {
  const ls = AC.map((l) => e === 'zerado' ? { ...l, contado: 0 } : e === 'lido' && l.codigo === '5601234567892' ? { ...l, contado: 4 } : l);
  const ultima = e === 'lido' ? '5601234567892' : undefined;
  const difs = ls.filter((l) => l.contado !== l.stock).length;
  const linhas = `<ul class="inv__linhas">${ls.map((l) => {
    const d = l.contado - l.stock;
    return `<li class="inv__lin${l.codigo === ultima ? ' is-ultima' : ''}" ${ir('acertar-mudar')} role="button" tabindex="0">
      <div class="inv__cresce"><b class="inv__nome-art">${l.nome || '<span class="inv__fora">Código que não está no stock</span>'}</b><small class="inv__codigo-peq">${l.codigo} · stock ${l.stock}</small></div>
      ${d ? `<b class="inv__dif">${d > 0 ? `+${d}` : d}<small>${d > 0 ? 'a mais' : d === -1 ? 'falta' : 'faltam'}</small></b>` : ''}<strong class="inv__qtd">${l.contado}</strong>${L(pencil, 'inv__lapis')}</li>`;
  }).join('')}</ul>`;
  const sobre = e === 'mudar' ? dialogo('Corrigir a quantidade',
      `<p class="inv__codigo inv__codigo--grande">5601234567892</p><p class="inv__dica">Óleo motor 15W40 · bidão 5 L · stock 5</p>
       <div class="inv__passo"><button type="button" class="inv__quadrado" aria-label="Menos um">${L(minus)}</button><input type="number" value="5" aria-label="Quantidade"><button type="button" class="inv__quadrado" aria-label="Mais um">${L(plus)}</button></div>
       ${sec('Tirar da contagem', trash2, ` ${ir('acertar')}`)}`,
      acao('Guardar', check, ` ${ir('acertar-lido')}`), sec('Voltar', arrowLeft, ` ${ir('acertar')}`))
    : e === 'de-novo' ? dialogo('Picar tudo de novo?', '<p>Põe o contado de todos os artigos a zero; depois pica-se cada artigo da prateleira (cada leitura soma 1).</p>',
      acao('Pôr a zero', rotateCcw, ` ${ir('acertar-zerado')}`), sec('Voltar', arrowLeft, ` ${ir('acertar')}`))
    : e === 'confirmar' ? dialogo('Acertar a 60800101?', `<p>O stock fica igual ao contado: ${difs} acertos. Cada acerto fica no registo e no histórico da prateleira.</p>`,
      acao('Acertar', acerto, ` ${ir('acertar-picar-feito')}`), sec('Voltar', arrowLeft, ` ${ir('acertar')}`))
    : e === 'a-acertar' ? ocupado('A acertar a 60800101…') : '';
  return pagina({
    k: `acertar${e ? `-${e}` : ''}`,
    topo: topo('Acertar', 'Óleos · contada por Joana Matos', 'acertar-picar', `<button type="button" class="inv__trocar" ${ir('acertar-de-novo')}>${L(rotateCcw)}<span>De novo</span></button>`),
    posicao: PO, faixa: true,
    corpo: `${e === 'sem-rede' ? aviso('Sem rede: o acerto não foi feito. O que mudaste continua aqui; carrega outra vez em «Acertar» quando a rede voltar.', 'erro') : ''}<div class="inv__cab-linhas">${rotulo('Contado · stock')}<b class="${difs ? 'is-laranja' : 'is-ok'}">${difs ? `${difs} diferenças` : 'Bate com o stock'}</b></div>
      ${linhas}`,
    pe: pe(`<div class="inv__par inv__par--trancar">${sec('Escrever', keyboard, ` ${ir('acertar-lido')}`)}${acao(`Acertar (${difs})`, acerto, ` ${ir('acertar-confirmar')}`)}</div>`),
    sobre,
    semRede: e === 'sem-rede' ? REDE.acertar : undefined,
  });
}

type EstHist = '' | 'prateleira' | 'artigo' | 'escrever' | 'vazio' | 'sem-rede';
/** 26 nov. (ela: «uma prateleira sofre uma contagem inicial e depois só sofre acertos … o histórico organiza melhor»): por blocos. */
function historicoEcra(e: EstHist = ''): string {
  const prat = e !== 'artigo';
  type A = { ic?: string; tom: string; t: string; sub: string; v: string; dentro?: boolean };
  type B = { t: string; vazio: string; ls: A[] };
  const blocos: B[] = e === 'prateleira' ? [
    { t: 'Contagem', vazio: 'Ainda não foi contada.', ls: [
      { ic: scanBarcode, tom: 'contagem', t: 'Contada · 26/11/2026 10:26', sub: 'Inês Costa · 2 min 05 s · Óleos', v: '11 un.' },
      { tom: 'dentro', t: 'Óleo motor 15W40 · bidão 5 L', sub: 'OLEO-15W40-5L', v: '3', dentro: true },
      { tom: 'dentro', t: 'Óleo motor 10W40 · 1 L', sub: 'OLEO-10W40-1L', v: '4', dentro: true },
      { tom: 'dentro', t: 'Óleo hidráulico ISO 46 · 20 L', sub: 'OLEO-HID-46-20L', v: '1', dentro: true },
      { tom: 'dentro', t: 'Massa LGMT 2 · 1 kg', sub: 'MASSA-LGMT2-1KG', v: '2', dentro: true },
      { tom: 'dentro', t: 'Código que não está no stock', sub: '5600000000014', v: '1', dentro: true },
    ] },
    { t: 'Acertos', vazio: 'Sem acertos.', ls: [
      { ic: acerto, tom: 'acerto', t: 'Óleo motor 15W40 · bidão 5 L · 26/11/2026 11:40', sub: 'Feito no «Acertar Óleos» · Pedro Santos', v: '-2' },
      { ic: acerto, tom: 'acerto', t: 'Código que não está no stock · 26/11/2026 10:26', sub: 'Por rever pelo Gestor · Código que não existe no stock.', v: '+1' },
    ] },
    { t: 'Entradas e saídas', vazio: 'Sem entradas nem saídas.', ls: [
      { ic: entrada, tom: 'entrada', t: 'Entrada · 25/11/2026 10:30', sub: 'OLEO-15W40-5L · Receção RC 2026/0412 · Sistema', v: '+2' },
      { ic: saida, tom: 'saida', t: 'Saída · 25/11/2026 16:10', sub: 'OLEO-10W40-1L · Guia GR 2026/1184 · Sistema', v: '-1' },
    ] },
  ] : e === 'artigo' ? [
    { t: 'Contado', vazio: 'Ainda não foi contado.', ls: [
      { ic: scanBarcode, tom: 'contagem', t: 'Prateleira 60800101 · 26/11/2026 10:26', sub: 'Inês Costa', v: '3 un.' },
      { ic: scanBarcode, tom: 'contagem', t: 'Prateleira 60800202 · 26/11/2026 10:41', sub: 'Inês Costa', v: '2 un.' },
    ] },
    { t: 'Acertos', vazio: 'Sem acertos.', ls: [
      { ic: acerto, tom: 'acerto', t: 'Prateleira 60800101 · 26/11/2026 11:40', sub: 'Feito no «Acertar Óleos» · Pedro Santos', v: '-2' },
    ] },
    { t: 'Entradas e saídas', vazio: 'Sem entradas nem saídas.', ls: [
      { ic: entrada, tom: 'entrada', t: 'Entrada · 25/11/2026 10:30', sub: '60800101 · Receção RC 2026/0412 · Sistema', v: '+2' },
    ] },
  ] : e === 'vazio' ? [
    { t: 'Contagem', vazio: 'Ainda não foi contada.', ls: [] }, { t: 'Acertos', vazio: 'Sem acertos.', ls: [] }, { t: 'Entradas e saídas', vazio: 'Sem entradas nem saídas.', ls: [] },
  ] : [];
  const escolha = (t: string, ativa: boolean, dest: IdInventario) => `<button type="button" class="inv__escolha${ativa ? ' is-ativa' : ''}" ${ir(dest)}>${t}</button>`;
  const sub = e === 'prateleira' || e === 'vazio' ? 'Prateleira 60800101' : e === 'artigo' ? 'Artigo 5601234567892' : 'De uma prateleira ou de um artigo';
  const linha = (a: A) => `<li class="is-${a.tom}">${a.ic ? L(a.ic) : ''}<div class="inv__cresce"><b>${a.t}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div><strong>${a.v}</strong></li>`;
  return pagina({
    k: `historico${e ? `-${e}` : ''}`,
    topo: topo('Histórico', sub, 'inicio'),
    corpo: `<div class="inv__par">${escolha('Prateleira', prat, 'historico-prateleira')}${escolha('Artigo', !prat, 'historico-artigo')}</div>
      ${blocos.length ? `<p class="inv__titulo-hist">${e === 'artigo' ? 'OLEO-15W40-5L' : 'Prateleira 60800101'}</p><p class="inv__dica">${e === 'artigo' ? 'Óleo motor 15W40 · bidão 5 L' : 'Óleos'}</p>${e === 'prateleira' ? estadoPrat('LIVRE', 'A 60800101 está liberta: foi contada e acertada. Pode ser usada na separação e na expedição.') : e === 'vazio' ? estadoPrat('LIVRE', 'A 60800101 está livre: ainda não foi contada neste inventário.') : ''}
        ${blocos.map((b) => `<div class="inv__cab-linhas">${rotulo(b.t)}${b.ls.length ? `<b>${b.ls.filter((a) => !a.dentro).length}</b>` : ''}</div>
          ${b.ls.length ? `<ul class="inv__hist">${b.ls.map(linha).join('')}</ul>` : `<p class="inv__nada">${b.vazio}</p>`}`).join('')}`
        : alvo('Pica a etiqueta', prat ? 'Da prateleira.' : 'Do artigo.', { leitor: 'gatilho', destino: 'historico-prateleira', erro: e === 'sem-rede' ? 'Sem ligação ao servidor (127.0.0.1:5198). Confirma a rede e tenta outra vez.' : undefined })}`,
    pe: pe(sec(prat ? 'Escrever a prateleira' : 'Escrever o artigo', keyboard, ` ${ir('historico-escrever')}`)),
    sobre: e === 'escrever' ? dialogo('Ver o histórico', `${campo('Prateleira ou artigo', '', { mono: true, dica: 'Ex.: 60800101, ou a referência ou o código de barras do artigo.' })}`,
      acao('Ver', history, ` ${ir('historico-prateleira')}`), sec('Voltar', arrowLeft, ` ${ir('historico')}`)) : '',
    semRede: e === 'sem-rede' ? REDE.geral : undefined,
  });
}

type EstLig = '' | 'testada' | 'ocupada';
function ligacao(e: EstLig = ''): string {
  return pagina({
    k: `ligacao${e ? `-${e}` : ''}`,
    topo: topo('Ligação ao servidor', undefined, 'inicio'),
    corpo: `${e === 'ocupada' ? aviso('Há prateleiras a meio ou por trancar. Acaba-as antes de mudar de servidor: estão abertas no atual.', 'erro') : ''}
      ${campo('Endereço do servidor', 'http://127.0.0.1:5198', { tipo: 'url' })}
      <p class="inv__dica">Com o PDA ligado ao PC pelo cabo: http://127.0.0.1:5198 (e «adb reverse tcp:5198 tcp:5198» no PC). Pela rede: o endereço do PC, ex.: http://10.100.2.15:5198.</p>
      ${sec('Testar ligação', cloudUpload, ` ${ir('ligacao-testada')}`)}
      ${e === 'testada' ? aviso(`Ligação certa: o servidor respondeu (${INV} a decorrer).`, 'ok') : ''}`,
    pe: pe(acao('Guardar', check, e === 'ocupada' ? ' disabled' : ` ${ir('inicio')}`)),
  });
}

/* =========================================================
   A lista — 26 nov.: só a última versão (v3 = a 2.0.7); a v2 (2.0.0) saiu, como antes a 1.8.1
   ========================================================= */
const NOTA = 'Como a app Kotlin 2.4.0 (27 nov., testada no CK62; o gestor é avisado e acerta logo, a que bate com o stock fica liberta, e o −2 / +1 diz-se em palavras): trancar — livre, trancada a contar, trancada para o acerto, liberta;: só o gestor acerta, o estado da prateleira vem da API em cada passo;: Continuar e Acertar (prateleira a prateleira) por secção, estados sem rede, prateleira começa por 60, outra secção, Já picado, histórico por blocos';
const v = (html: string): EcraInventario['versoes'] => [{ id: 'v3', nota: NOTA, html }];
const F = { ENTRAR: 'Entrar', INVENTARIO: 'Inventário e secções', CONTAR: 'Contar', ACERTAR: 'Acertar', HIST: 'Histórico' };
const est = (id: IdInventario, de: IdInventario, nome: string, fluxo: string, objetivo: string, html: string, noFluxo?: string): EcraInventario =>
  ({ id, nome, fluxo, estadoDe: de, objetivo, versoes: v(html), ...(noFluxo ? { noFluxo } : {}) });

export function ecrasInventario(): EcraInventario[] {
  return [
    { id: 'entrar', nome: '01 · Entrar', fluxo: F.ENTRAR, objetivo: 'Sem função nem palavra-passe: quem já entrou neste PDA toca no nome; outra pessoa escreve o seu.', versoes: v(entrar(false)) },
    est('entrar-primeira', 'entrar', '01.1 · Primeira vez no PDA', F.ENTRAR, 'Ainda ninguém entrou neste PDA: só o campo do nome.', entrar(true)),

    { id: 'inicio', nome: '02 · Início', fluxo: F.INVENTARIO, objetivo: 'O inventário a decorrer e as secções, visto pela operadora. Por iniciar: «Iniciar Óleos». A decorrer: «Continuar Óleos» e, por baixo, «Terminar» (e «Acertar», ao gestor, ao lado), e quantas prateleiras estão trancadas à espera do acerto. «Acertar» só o gestor vê (02.9). No fim, «Terminar inventário». Sem pausa do inventário nem «Ver as contagens deste PDA».', versoes: v(inicio()) },
    est('inicio-gestor-aviso', 'inicio', '02.10 · Uma prateleira trancada (gestor)', F.ACERTAR, 'O gestor age logo: quando uma prateleira fica trancada para o acerto, o PDA dele vibra e o Início mostra este cartão laranja no ecrã, que fica até ele acertar (nos outros ecrãs é uma faixa em cima). Primeiro as que a separação já tentou usar. Sem tempos no ecrã.', inicio('gestor-aviso')),
    est('inicio-gestor', 'inicio', '02.9 · O gestor', F.INVENTARIO, 'Só o gestor acerta: a ele aparece «Acertar Óleos» entre «Continuar» e «Terminar». A lista de gestores vem da API.', inicio('gestor')),
    est('inicio-sem-inventario', 'inicio', '02.1 · Nenhum inventário', F.INVENTARIO, 'Sem inventário a decorrer: um botão só, «Iniciar inventário».', inicio('sem-inventario')),
    est('inicio-iniciar', 'inicio', '02.2 · Iniciar o inventário', F.INVENTARIO, 'Confirma antes de começar; as secções ficam por iniciar.', inicio('iniciar'), 'Diálogo aberto'),
    est('inicio-a-iniciar', 'inicio', '02.3 · A iniciar no servidor', F.INVENTARIO, 'Enquanto o servidor responde, não se lê nada.', inicio('a-iniciar')),
    est('inicio-nenhuma-seccao', 'inicio', '02.4 · Nenhuma secção a decorrer', F.INVENTARIO, 'Inventário iniciado, secções por iniciar: ainda não se conta.', inicio('nenhuma-seccao')),
    est('inicio-terminar-seccao', 'inicio', '02.5 · Terminar uma secção', F.INVENTARIO, 'Depois de terminar, as prateleiras dessa secção já não se contam. Recusado se houver uma a ser contada.', inicio('terminar-seccao'), 'Diálogo aberto'),
    est('inicio-terminar', 'inicio', '02.6 · Terminar o inventário', F.INVENTARIO, 'Termina também as secções a decorrer. Recusado se houver prateleiras a ser contadas.', inicio('terminar'), 'Diálogo aberto'),
    est('inicio-por-fechar', 'inicio', '02.7 · Por trancar no servidor', F.INVENTARIO, 'O trancar falhou: as contagens ficam no PDA e trancam-se daqui.', inicio('por-fechar')),
    est('inicio-sem-servidor', 'inicio', '02.8 · Sem rede', F.INVENTARIO, 'A faixa «Sem rede» em cima (em todos os ecrãs); sem o servidor não se conta: é ele que tranca a prateleira. Tenta sozinho de 5 em 5 s.', inicio('sem-servidor')),

    { id: 'prateleira', nome: '03 · Contar uma prateleira', fluxo: F.CONTAR, objetivo: 'Entra-se por «Continuar Óleos»: pica a etiqueta da prateleira (começa sempre por 60) ou escreve-a. O servidor tranca-a enquanto se conta; uma prateleira conta-se uma vez e depois só tem acertos.', versoes: v(prateleira()) },
    est('prateleira-escrever', 'prateleira', '03.1 · Escrever a prateleira', F.CONTAR, 'A etiqueta não lê: escreve-se o código.', prateleira('escrever'), 'Diálogo aberto'),
    est('prateleira-a-abrir', 'prateleira', '03.2 · A abrir no servidor', F.CONTAR, 'Picou-se a prateleira: enquanto o servidor a abre, não se lê nada.', prateleira('a-abrir')),
    est('prateleira-ja-contada', 'prateleira', '03.3 · Já contada', F.CONTAR, 'Não se lê a mesma prateleira duas vezes no mesmo inventário: diz quem e quando.', prateleira('ja-contada')),
    est('prateleira-ocupada', 'prateleira', '03.4 · A ser contada', F.CONTAR, 'Outra pessoa tem a prateleira aberta: diz quem, desde quando e em que PDA.', prateleira('ocupada')),
    est('prateleira-nao-iniciada', 'prateleira', '03.5 · Secção por iniciar', F.CONTAR, 'A prateleira é de uma secção que ainda não começou (ou já terminou).', prateleira('nao-iniciada')),
    est('prateleira-sem-rede', 'prateleira', '03.11 · Sem rede', F.CONTAR, 'A prateleira não abre sem rede: é o servidor que a tranca para mais ninguém a contar.', prateleira('sem-rede')),
    est('prateleira-por-fechar', 'prateleira', '03.12 · Trancada sem rede', F.CONTAR, 'Trancou-se sem rede: fica no PDA «por trancar» e tranca-se sozinha quando a rede voltar.', prateleira('por-fechar')),
    est('prateleira-artigo', 'prateleira', '03.8 · Picou um artigo', F.CONTAR, 'As etiquetas das prateleiras começam sempre por 60: um artigo aqui é recusado e diz-se qual é.', prateleira('artigo')),
    est('prateleira-outra-seccao', 'prateleira', '03.9 · Prateleira de outra secção', F.CONTAR, 'A contar Auto, picou-se uma prateleira de Óleos: muda-se para Óleos no PDA (ou «Iniciar Óleos e mudar»), ou vai-se à zona 30.', prateleira('outra-seccao'), 'Diálogo aberto'),
    est('prateleira-ficar', 'prateleira', '03.10 · Fica na zona', F.CONTAR, 'Escolheu-se ir à zona 30: pede uma prateleira da Auto.', prateleira('ficar')),
    est('prateleira-gestor', 'prateleira', '03.13 · Trancada por um gestor', F.ACERTAR, 'Quem contou é gestor: «Acertar agora» abre logo o acerto — o ciclo da prateleira faz-se seguido.', prateleira('gestor')),
    est('prateleira-fechada', 'prateleira', '03.6 · Bate com o stock', F.CONTAR, 'Trancada sem diferenças: não precisa de acerto e fica liberta logo (27 nov.). O diálogo pergunta: continuar Óleos ou voltar ao Início.', prateleira('fechada'), 'Diálogo aberto'),
    est('prateleira-fechada-acertos', 'prateleira', '03.7 · Trancada com diferenças', F.CONTAR, 'Trancada para o acerto. Cada diferença diz o que significa («faltam 2 na prateleira: o acerto tira 2 ao stock»); só o gestor a liberta. Um código fora do stock vai ao Gestor.', prateleira('fechada-acertos')),

    { id: 'contar', nome: '04 · Contar', fluxo: F.CONTAR, objetivo: 'Cada leitura soma 1; o escrito à mão leva a quantidade. O tempo de prateleira corre no topo. Sem pausa: só se sai a trancar, a confirmar vazia ou a descartar.', versoes: v(contar()) },
    est('contar-lido', 'contar', '04.1 · A contar', F.CONTAR, 'Enquanto se pica vê-se o que já se picou nesta prateleira: depois do primeiro artigo o alvo passa a uma faixa (o gatilho lê na mesma) e a lista fica com o ecrã. A última leitura fica a laranja e sobe para o topo; toca-se numa linha para corrigir.', contar('lido')),
    est('contar-sem-rede', 'contar', '04.9 · Sem rede a contar', F.CONTAR, 'A meio da prateleira a rede cai: continua-se a picar (fica no PDA); ao trancar, espera pela rede.', contar('sem-rede')),
    est('contar-escrever', 'contar', '04.2 · Escrever artigo', F.CONTAR, 'Artigo sem etiqueta ou que não lê: código e quantidade (1 a 9999); fica «Escrito à mão».', contar('escrever'), 'Diálogo aberto'),
    est('contar-corrigir', 'contar', '04.3 · Corrigir a quantidade', F.CONTAR, 'Menos, mais ou escrever o número; ou tirar da contagem. A correção fica no registo.', contar('corrigir'), 'Diálogo aberto'),
    est('contar-parece-prateleira', 'contar', '04.4 · É uma prateleira', F.CONTAR, 'Picou-se outra etiqueta de prateleira: trancar e passar, ou contar como artigo.', contar('parece-prateleira'), 'Diálogo aberto'),
    est('contar-mesma', 'contar', '04.5 · A mesma prateleira', F.CONTAR, 'Picou-se a etiqueta da prateleira onde já se está.', contar('mesma')),
    est('contar-sair', 'contar', '04.6 · Sair a meio', F.CONTAR, 'O botão voltar do Android só avisa: quem começa uma prateleira acaba-a.', contar('sair')),
    est('contar-descartar', 'contar', '04.7 · Descartar', F.CONTAR, 'Apaga o contado e a prateleira volta a ficar livre, por contar.', contar('descartar'), 'Diálogo aberto'),

    { id: 'camara', nome: '05 · Ler com a câmara', fluxo: F.CONTAR, objetivo: 'No PDA ao lado do gatilho, no telemóvel em vez dele: fica aberta da prateleira aos artigos; a mesma etiqueta só conta passados 2 s.', versoes: v(camaraEcra(false)) },
    est('camara-lido', 'camara', '05.1 · Lido', F.CONTAR, 'O que se leu aparece em baixo com a quantidade.', camaraEcra(true)),

    { id: 'resumo', nome: '06 · Trancar a prateleira', fluxo: F.CONTAR, objetivo: 'Aqui vê-se o que se picou (o «Já picado» deixou de ser botão). Trancar grava o contado à parte do stock e as diferenças; a prateleira fica trancada para o acerto até o gestor acertar.', versoes: v(resumo()) },
    est('resumo-vazia', 'resumo', '06.1 · Prateleira vazia', F.CONTAR, 'A vazia passa pelo mesmo resumo.', resumo('vazia')),
    est('resumo-a-fechar', 'resumo', '06.2 · A trancar no servidor', F.CONTAR, 'Enquanto o servidor tranca a prateleira e grava as diferenças, não se lê nada.', resumo('a-fechar')),

    { id: 'acertar-picar', nome: '07 · Acertar Óleos', fluxo: F.ACERTAR, objetivo: 'Só o gestor. Do «Acertar Óleos»: pica-se a prateleira, ou toca-se numa das trancadas à espera do acerto (contadas, trancadas até ao acerto).', versoes: v(acertarPicar()) },
    est('acertar-picar-feito', 'acertar-picar', '07.1 · Prateleira acertada', F.ACERTAR, 'Volta-se aqui depois de acertar, com quantos acertos se fizeram, para picar a próxima.', acertarPicar('feito')),
    est('acertar-picar-nao-contada', 'acertar-picar', '07.2 · Ainda não contada', F.ACERTAR, 'Só se acerta uma prateleira que já foi contada neste inventário.', acertarPicar('nao-contada')),
    est('acertar-picar-sem-rede', 'acertar-picar', '07.4 · Sem rede', F.ACERTAR, 'Sem rede não se vê a prateleira (o stock e o contado estão no servidor).', acertarPicar('sem-rede')),
    est('acertar-picar-outra', 'acertar-picar', '07.3 · De outra secção', F.ACERTAR, 'A prateleira é de outra secção: acerta-se pelo botão dessa secção.', acertarPicar('outra')),
    { id: 'acertar', nome: '08 · Acertar a prateleira', fluxo: F.ACERTAR, objetivo: 'Cada artigo com o stock de agora e o contado (o da contagem ou o do último acerto), com a diferença a laranja. Muda-se à mão ou pica-se de novo («De novo», no topo); «Acertar» (em baixo) põe o stock igual ao contado.', versoes: v(acertarEcra()) },
    est('acertar-lido', 'acertar', '08.1 · Picou um artigo', F.ACERTAR, 'Cada leitura soma 1 ao contado; a linha fica a laranja.', acertarEcra('lido')),
    est('acertar-mudar', 'acertar', '08.2 · Mudar à mão', F.ACERTAR, 'Toca-se na linha: menos, mais, escrever o número, ou tirar.', acertarEcra('mudar'), 'Diálogo aberto'),
    est('acertar-de-novo', 'acertar', '08.3 · Picar tudo de novo', F.ACERTAR, 'Põe o contado a zero para se picar a prateleira toda outra vez.', acertarEcra('de-novo'), 'Diálogo aberto'),
    est('acertar-zerado', 'acertar', '08.4 · A zero', F.ACERTAR, 'Tudo a zero: pica-se cada artigo.', acertarEcra('zerado')),
    est('acertar-confirmar', 'acertar', '08.5 · Confirmar o acerto', F.ACERTAR, 'Quantos acertos vai fazer; cada um fica no registo e no histórico da prateleira.', acertarEcra('confirmar'), 'Diálogo aberto'),
    est('acertar-sem-rede', 'acertar', '08.7 · Sem rede ao acertar', F.ACERTAR, 'O acerto não se fez; o que se mudou continua no ecrã para tentar outra vez.', acertarEcra('sem-rede')),
    est('acertar-a-acertar', 'acertar', '08.6 · A acertar no servidor', F.ACERTAR, 'Enquanto o servidor acerta, não se lê nada.', acertarEcra('a-acertar')),

    { id: 'historico', nome: '09 · Histórico', fluxo: F.HIST, objetivo: 'Pica ou escreve uma prateleira ou um artigo. Por blocos: a contagem (com o que se contou), os acertos que daí vieram, e as entradas e saídas. Aqui se vê também o que se contou (saiu «Ver as contagens deste PDA»).', versoes: v(historicoEcra()) },
    est('historico-prateleira', 'historico', '09.1 · De uma prateleira', F.HIST, 'Uma contagem inicial (quem, quanto tempo, cada artigo) e depois só acertos; as entradas e saídas à parte.', historicoEcra('prateleira')),
    est('historico-artigo', 'historico', '09.2 · De um artigo', F.HIST, 'Pela referência ou pelo código de barras: quanto se contou em cada prateleira, os acertos e as entradas e saídas.', historicoEcra('artigo')),
    est('historico-vazio', 'historico', '09.4 · No início do inventário', F.HIST, 'O histórico é só do inventário a decorrer: quando ele começa, está vazio.', historicoEcra('vazio')),
    est('historico-sem-rede', 'historico', '09.5 · Sem rede', F.HIST, 'O histórico vem do servidor: sem rede, diz-se e tenta-se outra vez.', historicoEcra('sem-rede')),
    est('historico-escrever', 'historico', '09.3 · Escrever o código', F.HIST, 'A etiqueta não lê: escreve-se.', historicoEcra('escrever'), 'Diálogo aberto'),

    { id: 'prateleiras', nome: '11 · Prateleiras da secção', fluxo: F.INVENTARIO, objetivo: 'Do cartão da secção («3 trancadas · 2 libertas › Prateleiras»): todas as prateleiras com o estado que vem da base de dados, as trancadas primeiro; atualiza de 5 em 5 s, por isso vê-se quando o gestor a liberta.', versoes: v(prateleirasEcra()) },
    { id: 'ligacao', nome: '10 · Ligação ao servidor', fluxo: F.HIST, objetivo: 'O endereço do servidor do inventário (endpoints inventados; base de dados num Excel no PC). Saiu o ERP de demonstração.', versoes: v(ligacao()) },
    est('ligacao-testada', 'ligacao', '10.1 · Testada', F.HIST, 'O servidor respondeu e diz se há inventário a decorrer.', ligacao('testada')),
    est('ligacao-ocupada', 'ligacao', '10.2 · Com prateleiras abertas', F.HIST, 'Não se muda de servidor com prateleiras a meio ou por fechar.', ligacao('ocupada')),
  ];
}
