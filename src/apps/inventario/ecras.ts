/* =========================================================
   INVENTÁRIO — a app Kotlin do PDA, posta no Figma (26 nov. 2026)
   Os ecrãs são os da 2.0.0 (App.kt de ~/projects/inventario-pda), com os mesmos textos e a mesma ordem. Ela, 26 nov.:
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
import list from 'lucide-static/icons/list.svg?raw';
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
import listX from 'lucide-static/icons/list-x.svg?raw';

/* ---------- os dados de exemplo ---------- */
const QUEM = 'Inês Costa';
const RECENTES = ['Inês Costa', 'Joana Matos', 'Tiago Reis'];
type Linha = { codigo: string; n: number; escrito?: boolean };
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
const aviso = (t: string, tom: 'erro' | 'ok' | 'laranja' | 'azul') => `<p class="inv__aviso inv__aviso--${tom}">${t}</p>`;
const numero = (r: string, n: number | string, destaque = false) => `<div class="inv__numero${destaque ? ' is-destaque' : ''}"><b>${n}</b><span>${r}</span></div>`;

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

function posicaoGrande(codigo: string): string {
  const partes: [string, string][] = [['Arm.', codigo.slice(0, 2)], ['Zona', codigo.slice(2, 4)], ['Col.', codigo.slice(4, 6)], ['Prat.', codigo.slice(6, 8)]];
  return `<div class="inv__posicao" aria-label="Prateleira ${codigo}">${partes.map(([r, v]) => `<span><small>${r}</small><b>${v}</b></span>`).join('')}</div>`;
}

const cartao = (dentro: string, destino?: IdInventario) => `<div class="inv__cartao"${destino ? ` ${ir(destino)} role="button" tabindex="0"` : ''}>${dentro}</div>`;
const pe = (dentro: string) => `<footer class="inv__pe">${dentro}</footer>`;

/** A página: o topo, (a posição), o corpo que rola e o pé; por cima, um diálogo ou o «a falar com o servidor». */
function pagina(o: { k: string; topo: string; posicao?: string; corpo: string; pe?: string; sobre?: string; escuro?: boolean }): string {
  return `<div class="inv${o.escuro ? ' inv--camara' : ''}" data-inv="${o.k}" data-ir-ultima>
    ${o.topo}${o.posicao ? posicaoGrande(o.posicao) : ''}
    <main class="inv__corpo">${o.corpo}</main>
    ${o.pe ?? ''}${o.sobre ?? ''}
  </div>`;
}

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
type Sec = { nome: string; zona: string; est: 'por' | 'dec' | 'fim'; txt: string };
const SECCOES: Sec[] = [
  { nome: 'Óleos', zona: '80', est: 'dec', txt: 'A decorrer desde as 08:05 · 6 prateleiras · 1 a contar' },
  { nome: 'Auto', zona: '30', est: 'por', txt: 'Por iniciar · zona 30' },
  { nome: 'Rolamentos', zona: '10, 11, 20, 21, 22', est: 'fim', txt: 'Terminada às 10:12 · 14 prateleiras' },
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

function seccao(s: Sec, estado: Sec['est'] = s.est, txt = s.txt): string {
  const botao = estado === 'por' ? sec(`Iniciar ${s.nome}`, play, ` ${ir('inicio')}`)
    : estado === 'dec' ? fim(`Terminar ${s.nome}`, ` ${ir('inicio-terminar-seccao')}`) : '';
  return `<div class="inv__cartao inv__seccao">
    <div class="inv__linha"><div class="inv__cresce"><b class="inv__nome">${s.nome}</b><small class="${estado === 'dec' ? 'is-decorrer' : ''}">${txt}</small></div>${estado === 'fim' ? L(circleCheck, 'inv__certo') : ''}</div>
    ${botao}</div>`;
}

type EstInicio = '' | 'sem-inventario' | 'iniciar' | 'nenhuma-seccao' | 'terminar-seccao' | 'terminar' | 'por-fechar' | 'sem-servidor' | 'a-iniciar';
function inicio(e: EstInicio = ''): string {
  const trocar = `<button type="button" class="inv__trocar" ${ir('entrar')}>${L(logOut)}<span>Trocar</span></button>`;
  const semInv = e === 'sem-inventario' || e === 'iniciar' || e === 'a-iniciar';
  const nenhuma = e === 'nenhuma-seccao';
  const seccoes = nenhuma ? [seccao(SECCOES[0], 'por', 'Por iniciar · zona 80'), seccao(SECCOES[1]), seccao(SECCOES[2], 'por', 'Por iniciar · zonas 10, 11, 20, 21, 22')] : SECCOES.map((s) => seccao(s));
  const cabInv = cartao(`<div class="inv__linha"><div class="inv__cresce"><b class="inv__nome">${INV}</b><small>Desde hoje às 08:00 · Joana Matos</small></div>
      <div class="inv__direita"><strong class="inv__grande">${nenhuma ? 0 : 20}</strong><small>contadas</small></div></div>`);
  const ligado = `<button type="button" class="inv__ligada" ${ir('ligacao')}>${L(settings)}<span>Servidor: 127.0.0.1:5198</span><b>Mudar</b></button>`;
  const comuns = `${e === 'por-fechar' ? `${aviso('Sem ligação ao servidor (127.0.0.1:5198). Confirma a rede e tenta outra vez.', 'erro')}${sec('Fechar no servidor (2)', cloudUpload)}` : ''}
    ${sec('Histórico de uma prateleira ou artigo', history, ` ${ir('historico')}`)}
    ${sec('Ver as contagens deste PDA', list, ` ${ir('contagens')}`)}`;
  let corpo: string, rodape: string;
  if (e === 'sem-servidor') {
    corpo = `${aviso('Sem ligação ao servidor (127.0.0.1:5198). Confirma a rede e tenta outra vez.', 'erro')}${sec('Tentar outra vez', refresh, ` ${ir('inicio')}`)}${comuns}${ligado}`;
    rodape = acao('Tentar outra vez', refresh, ` ${ir('inicio')}`);
  } else if (semInv) {
    corpo = `${cartao('<b class="inv__nome">Nenhum inventário a decorrer</b><small class="inv__dica">O último: Inventário 12/11/2026, terminado a 12/11/2026 17:40 por Pedro Santos · 212 prateleiras</small>')}${comuns}${ligado}`;
    rodape = acao('Iniciar inventário', play, ` ${ir('inicio-iniciar')}`);
  } else {
    corpo = `${cabInv}
      ${nenhuma ? '' : alvo('Pica uma prateleira', 'De Óleos.', { destino: 'prateleira' })}
      ${rotulo('Secções')}${seccoes.join('')}
      ${comuns}${fim('Terminar inventário', ` ${ir('inicio-terminar')}`)}${ligado}`;
    rodape = nenhuma ? '<p class="inv__dica inv__dica--pe">Inicia uma secção para contar.</p>' : acao('Contar uma prateleira', scanBarcode, ` ${ir('prateleira')}`);
  }
  const sobre = e === 'iniciar' ? dialogo('Iniciar o inventário?', '<p>Começa o inventário de hoje. As secções ficam por iniciar: cada uma começa com o seu botão (ex.: «Iniciar Óleos»).</p>',
      acao('Iniciar inventário', play, ` ${ir('inicio-nenhuma-seccao')}`), sec('Voltar', arrowLeft, ` ${ir('inicio-sem-inventario')}`))
    : e === 'terminar-seccao' ? dialogo('Terminar Óleos?', '<p>Depois de terminar, as prateleiras de Óleos já não se contam neste inventário (6 prateleiras contadas).</p>',
      acao('Terminar Óleos', square, ` ${ir('inicio')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('inicio')}`))
    : e === 'terminar' ? dialogo('Terminar o inventário?', '<p>Depois de terminar não se conta mais nenhuma prateleira neste inventário. As secções a decorrer (Óleos) terminam também.</p>',
      acao('Terminar inventário', square, ` ${ir('inicio-sem-inventario')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('inicio')}`))
    : e === 'a-iniciar' ? ocupado('A iniciar o inventário…') : '';
  return pagina({ k: `inicio${e ? `-${e}` : ''}`, topo: topo('Inventário', QUEM, undefined, trocar), corpo, pe: pe(rodape), sobre });
}

type EstPrat = '' | 'escrever' | 'ocupada' | 'ja-contada' | 'nao-iniciada' | 'a-abrir' | 'fechada' | 'fechada-acertos';
function prateleira(e: EstPrat = ''): string {
  const feito = e === 'fechada' || e === 'fechada-acertos';
  const erro = e === 'ocupada' ? 'A 60800102 está a ser contada por Joana Matos desde as 09:42 (EDA61K-3896).'
    : e === 'ja-contada' ? 'A 60800101 já foi contada neste inventário, hoje às 08:15, por Joana Matos. Não se conta duas vezes.'
    : e === 'nao-iniciada' ? 'A 60300102 é da secção Auto, que ainda não começou. Inicia-a no Início.' : undefined;
  const banner = feito ? `<div class="inv__feito">${L(circleCheck)}<div><b>60800101 fechada</b><span>42 un. · 2 códigos · 2 min 05 s</span>
      <strong class="${e === 'fechada' ? '' : 'is-azul'}">${e === 'fechada' ? 'Sem diferenças: nenhum acerto.' : '1 acerto feito · 1 para o Gestor ver'}</strong></div></div>` : '';
  const sobre = e === 'escrever' ? dialogo('Escrever a prateleira', `${campo('O código da prateleira', '', { mono: true, dica: 'Ex.: 60300102' })}`,
      acao('Contar', check, ` ${ir('contar')}`), sec('Voltar', arrowLeft, ` ${ir('prateleira')}`))
    : e === 'a-abrir' ? ocupado('A abrir a prateleira 60800101…') : '';
  return pagina({
    k: `prateleira${e ? `-${e}` : ''}`,
    topo: topo('Contar uma prateleira', `${QUEM} · Óleos`, 'inicio'),
    corpo: `${banner}${alvo(feito ? 'Pica a próxima prateleira' : 'Pica a prateleira', 'Cada prateleira conta-se uma vez neste inventário.', { erro, leitor: 'gatilho', destino: 'prateleira-a-abrir', cresce: true })}`,
    pe: pe(sec('Escrever o código da prateleira', keyboard, ` ${ir('prateleira-escrever')}`)),
    sobre,
  });
}

const PO = '60800101';
const LINHAS_O: Linha[] = [{ codigo: '5601234567893', n: 18 }, { codigo: '5601234567886', n: 24 }, { codigo: 'OLEO-HID-46', n: 2, escrito: true }];

type EstContar = '' | 'lido' | 'escrever' | 'corrigir' | 'parece-prateleira' | 'mesma' | 'sair' | 'descartar';
function contar(e: EstContar = ''): string {
  const ls = e === '' ? [] : LINHAS_O;
  const ultima = e === 'lido' ? '5601234567893' : undefined;
  const erro = e === 'mesma' ? `Já estás na prateleira ${PO}. Pica os artigos.`
    : e === 'sair' ? `Acaba a ${PO} antes de sair: «Fechar prateleira» ou «Prateleira vazia».` : undefined;
  const direita = `<span class="inv__relogio" aria-label="Tempo de prateleira">${L(timer)}<b>${e === '' ? '00:04' : '01:52'}</b></span>
    <button type="button" class="inv__icone-topo" aria-label="Descartar esta contagem" ${ir('contar-descartar')}>${L(trash2)}</button>`;
  const linhas = ls.length === 0
    ? '<p class="inv__nada">Ainda nada. Se a prateleira não tem nada, carrega em «Prateleira vazia».</p>'
    : `<ul class="inv__linhas">${ls.map((l) => `<li class="inv__lin${l.codigo === ultima ? ' is-ultima' : ''}" ${ir('contar-corrigir')} role="button" tabindex="0">
        <div class="inv__cresce"><b class="inv__codigo">${l.codigo}</b>${l.escrito ? '<small>Escrito à mão</small>' : ''}</div>
        <strong class="inv__qtd">${l.n}</strong>${L(pencil, 'inv__lapis')}</li>`).join('')}</ul>`;
  const sobre = e === 'escrever' ? dialogo('Escrever o artigo',
      `${campo('Código do artigo', 'OLEO-HID-46', { mono: true })}${campo('Quantidade', '2', { tipo: 'number' })}
       <p class="inv__dica">Para artigos sem etiqueta ou com etiqueta que não lê. A linha fica marcada como escrita à mão.</p>`,
      acao('Somar 2', check, ` ${ir('contar-lido')}`), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : e === 'corrigir' ? dialogo('Corrigir a quantidade',
      `<p class="inv__codigo inv__codigo--grande">5601234567893</p>
       <div class="inv__passo"><button type="button" class="inv__quadrado" aria-label="Menos um">${L(minus)}</button><input type="number" value="17" aria-label="Quantidade"><button type="button" class="inv__quadrado" aria-label="Mais um">${L(plus)}</button></div>
       <p class="inv__dica">Estavam 18. A correção fica registada.</p>
       ${sec('Tirar da contagem', trash2, ` ${ir('contar-lido')}`)}`,
      acao('Guardar', check, ` ${ir('contar-lido')}`), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : e === 'parece-prateleira' ? dialogo('60800102 é uma prateleira',
      `<p>Acabaste a ${PO}? Podes fechá-la e passar à 60800102, ou contar este código como um artigo.</p>`,
      acao('Fechar e passar', check, ` ${ir('prateleira-fechada-acertos')}`), sec('Contar como artigo', plus, ` ${ir('contar-lido')}`))
    : e === 'descartar' ? dialogo('Descartar esta contagem?',
      `<p>Apaga o que já contaste na ${PO} e desbloqueia-a. A prateleira fica por contar.</p>`,
      acao('Descartar', trash2, ` ${ir('inicio')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : '';
  return pagina({
    k: `contar${e ? `-${e}` : ''}`,
    topo: topo(`Prateleira ${PO}`, `Óleos · ${QUEM}`, undefined, direita),
    posicao: PO,
    corpo: `${alvo(ls.length ? 'Pica o próximo artigo' : 'Pica o artigo', 'Cada leitura soma 1. Toca numa linha para corrigir.', { erro, leitor: 'gatilho', lido: !!ultima, destino: 'contar-lido' })}
      <div class="inv__cab-linhas">${rotulo('Contado nesta prateleira')}<b>${un(ls)} un. · ${codigos(ls.length)}</b></div>
      ${linhas}`,
    pe: pe(`${sec('Escrever artigo', keyboard, ` ${ir('contar-escrever')}`)}${ls.length ? acao('Fechar prateleira', check, ` ${ir('resumo')}`) : sec('Prateleira vazia', inbox, ` ${ir('resumo-vazia')}`)}`),
    sobre,
  });
}

function camaraEcra(lido: boolean): string {
  return pagina({
    k: lido ? 'camara-lido' : 'camara', escuro: true,
    topo: topo(`Prateleira ${PO}`, `${lido ? 43 : 42} un. · ${codigos(3)}`, lido ? 'contar-lido' : 'contar'),
    corpo: `<div class="inv__visor" aria-hidden="true"><div class="inv__mira${lido ? ' is-lido' : ''}"><span class="inv__feixe"></span></div></div>`,
    pe: `<footer class="inv__pe">${lido ? '<div class="inv__lida"><b class="inv__codigo">5601234567893</b><strong>19</strong></div>' : '<p class="inv__dica">Aponta a mira à etiqueta. A mesma etiqueta só volta a contar passados 2 segundos.</p>'}
      ${acao('Fechar a câmara', x, ` ${ir('contar-lido')}`)}</footer>`,
  });
}

type EstResumo = '' | 'vazia' | 'a-fechar' | 'ver';
function resumo(e: EstResumo = ''): string {
  const ver = e === 'ver', vazia = e === 'vazia';
  const ls = vazia ? [] : LINHAS_O;
  const titulo = ver ? `Prateleira ${PO}` : vazia ? 'Prateleira vazia?' : `Fechar ${PO}?`;
  const sub = ver ? `${QUEM} · 26/11/2026 10:26` : vazia ? 'Viste a prateleira toda e não tem nada?' : 'Vê se está tudo';
  return pagina({
    k: `resumo${e ? `-${e}` : ''}`,
    topo: topo(titulo, sub, ver ? 'contagens' : vazia ? 'contar' : 'contar-lido'),
    posicao: PO,
    corpo: `<div class="inv__numeros inv__numeros--3">${numero('Códigos', ls.length)}${numero('Unidades', un(ls))}${numero('Tempo', ver ? '2 min 05 s' : '02:01')}</div>
      ${ls.some((l) => l.escrito) ? aviso('1 código foi escrito à mão: confirma que está certo.', 'laranja') : ''}
      ${!ver && !vazia ? '<p class="inv__dica">Ao fechar, o que bate com o stock fica como está; as diferenças acertam-se sozinhas ou vão ao Gestor.</p>' : ''}
      ${ver ? '<p class="inv__info">Secção Óleos</p><p class="inv__info">Fechada no servidor a 26/11/2026 10:26 · Fechada em 2 min 05 s. 1 acerto feito, 1 para o Gestor ver.</p>' : ''}
      ${ls.length ? `<ul class="inv__linhas inv__linhas--resumo">${ls.map((l) => `<li><b class="inv__codigo">${l.codigo}</b><strong>${l.n}</strong></li>`).join('')}</ul>` : ''}`,
    pe: ver ? undefined : pe(`<div class="inv__par">${sec('Continuar', scanBarcode, ` ${ir(vazia ? 'contar' : 'contar-lido')}`)}${acao(vazia ? 'Está vazia' : 'Fechar', vazia ? inbox : check, ` ${ir(vazia ? 'prateleira-fechada' : 'resumo-a-fechar')}`, 'inv__btn--largo')}</div>`),
    sobre: e === 'a-fechar' ? ocupado(`A fechar a ${PO}…`) : '',
  });
}

function contagens(limpar: boolean): string {
  type C = { p: string; quem: string; quando: string; n: string; est: 'A meio' | 'Fechada' | 'Por fechar' };
  const cs: C[] = [
    { p: '60800101', quem: 'Inês Costa', quando: '26/11/2026 10:26 · 2 min 05 s', n: '44 un.', est: 'Fechada' },
    { p: '60800102', quem: 'Inês Costa', quando: '26/11/2026 10:21 · 1 min 40 s', n: '15 un.', est: 'Fechada' },
    { p: '60800201', quem: 'Inês Costa', quando: '26/11/2026 10:12 · 32 s', n: 'Vazia', est: 'Fechada' },
    { p: '60800202', quem: 'Inês Costa', quando: '26/11/2026 10:05 · 58 s', n: '4 un.', est: 'Por fechar' },
  ];
  return pagina({
    k: limpar ? 'contagens-limpar' : 'contagens',
    topo: topo('Contagens deste PDA', `${cs.length} contagens`, 'inicio'),
    corpo: cs.map((c) => cartao(`<div class="inv__linha"><div class="inv__cresce"><b class="inv__codigo">${c.p}</b><small>${c.quem} · ${c.quando}</small></div>
        <div class="inv__direita"><b>${c.n}</b><small class="inv__est inv__est--${c.est === 'Fechada' ? 'ok' : c.est === 'A meio' ? 'meio' : 'erro'}">${c.est}</small></div></div>`, 'ver')).join(''),
    pe: pe(sec('Limpar as já fechadas', listX, ` ${ir('contagens-limpar')}`)),
    sobre: limpar ? dialogo('Limpar as já fechadas?',
      '<p>Tira deste PDA as 3 contagens que já estão fechadas no servidor (e as da versão anterior). No servidor ficam todas.</p>',
      acao('Limpar', listX, ` ${ir('contagens')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('contagens')}`)) : '',
  });
}

type EstHist = '' | 'prateleira' | 'artigo' | 'escrever';
function historicoEcra(e: EstHist = ''): string {
  const prat = e !== 'artigo';
  type A = { ic: string; tom: string; t: string; sub: string; v: string };
  const linhas: A[] = e === 'prateleira' ? [
    { ic: acerto, tom: 'acerto', t: 'Acerto de inventário · 26/11/2026 10:26', sub: 'OLEO-15W40-5L · Contagem 261126-102401-3896 · Inês Costa', v: '-2' },
    { ic: scanBarcode, tom: 'contagem', t: 'Contada · 26/11/2026 10:24', sub: 'Inês Costa · 2 min 05 s · Óleos', v: '44 un.' },
    { ic: entrada, tom: 'entrada', t: 'Entrada · 25/11/2026 10:30', sub: 'OLEO-15W40-5L · Receção RC 2026/0412 · Sistema', v: '+6' },
    { ic: scanBarcode, tom: 'contagem', t: 'Contada · 12/11/2026 15:02', sub: 'Tiago Reis · 1 min 12 s · Óleos', v: '38 un.' },
  ] : e === 'artigo' ? [
    { ic: acerto, tom: 'acerto', t: 'Acerto de inventário · 26/11/2026 10:26', sub: '60800101 · Contagem 261126-102401-3896 · Inês Costa', v: '-2' },
    { ic: scanBarcode, tom: 'contagem', t: 'Contado · 26/11/2026 10:26', sub: '60800101 · Inês Costa', v: '18 un.' },
    { ic: saida, tom: 'saida', t: 'Saída · 25/11/2026 16:10', sub: '60800202 · Guia GR 2026/1190 · Sistema', v: '-1' },
    { ic: entrada, tom: 'entrada', t: 'Entrada · 25/11/2026 10:30', sub: '60800101 · Receção RC 2026/0412 · Sistema', v: '+6' },
  ] : [];
  const escolha = (t: string, ativa: boolean, dest: IdInventario) => `<button type="button" class="inv__escolha${ativa ? ' is-ativa' : ''}" ${ir(dest)}>${t}</button>`;
  const sub = e === 'prateleira' ? 'Prateleira 60800101' : e === 'artigo' ? 'Artigo 5601234567893' : 'De uma prateleira ou de um artigo';
  return pagina({
    k: `historico${e ? `-${e}` : ''}`,
    topo: topo('Histórico', sub, 'inicio'),
    corpo: `<div class="inv__par">${escolha('Prateleira', prat, 'historico-prateleira')}${escolha('Artigo', !prat, 'historico-artigo')}</div>
      ${linhas.length ? `<p class="inv__titulo-hist">${e === 'artigo' ? 'OLEO-15W40-5L' : 'Prateleira 60800101'}</p>${e === 'artigo' ? '<p class="inv__dica">Óleo motor 15W40 · bidão 5 L</p>' : ''}
        <ul class="inv__hist">${linhas.map((a) => `<li class="is-${a.tom}">${L(a.ic)}<div class="inv__cresce"><b>${a.t}</b><small>${a.sub}</small></div><strong>${a.v}</strong></li>`).join('')}</ul>`
        : alvo('Pica a etiqueta', prat ? 'Da prateleira.' : 'Do artigo.', { leitor: 'gatilho', destino: 'historico-prateleira' })}`,
    pe: pe(sec(prat ? 'Escrever a prateleira' : 'Escrever o artigo', keyboard, ` ${ir('historico-escrever')}`)),
    sobre: e === 'escrever' ? dialogo('Ver o histórico', `${campo('Prateleira ou artigo', '', { mono: true, dica: 'Ex.: 60800101, ou a referência ou o código de barras do artigo.' })}`,
      acao('Ver', history, ` ${ir('historico-prateleira')}`), sec('Voltar', arrowLeft, ` ${ir('historico')}`)) : '',
  });
}

type EstLig = '' | 'testada' | 'ocupada';
function ligacao(e: EstLig = ''): string {
  return pagina({
    k: `ligacao${e ? `-${e}` : ''}`,
    topo: topo('Ligação ao servidor', undefined, 'inicio'),
    corpo: `${e === 'ocupada' ? aviso('Há prateleiras a meio ou por fechar. Acaba-as antes de mudar de servidor: estão abertas no atual.', 'erro') : ''}
      ${campo('Endereço do servidor', 'http://127.0.0.1:5198', { tipo: 'url' })}
      <p class="inv__dica">Com o PDA ligado ao PC pelo cabo: http://127.0.0.1:5198 (e «adb reverse tcp:5198 tcp:5198» no PC). Pela rede: o endereço do PC, ex.: http://10.100.2.15:5198.</p>
      ${sec('Testar ligação', cloudUpload, ` ${ir('ligacao-testada')}`)}
      ${e === 'testada' ? aviso(`Ligação certa: o servidor respondeu (${INV} a decorrer).`, 'ok') : ''}`,
    pe: pe(acao('Guardar', check, e === 'ocupada' ? ' disabled' : ` ${ir('inicio')}`)),
  });
}

/* =========================================================
   A lista — 26 nov.: só a última versão (a da 2.0.0); a 1.8.1 saiu (com o Excel, as fotografias e a recontagem)
   ========================================================= */
const NOTA = 'Como a app Kotlin 2.0.0 (26 nov.): inventário e secções com início e fim, sem Excel nem fotos';
const v = (html: string): EcraInventario['versoes'] => [{ id: 'v2', nota: NOTA, html }];
const F = { ENTRAR: 'Entrar', INVENTARIO: 'Inventário e secções', CONTAR: 'Contar', HIST: 'Histórico e contagens' };
const est = (id: IdInventario, de: IdInventario, nome: string, fluxo: string, objetivo: string, html: string, noFluxo?: string): EcraInventario =>
  ({ id, nome, fluxo, estadoDe: de, objetivo, versoes: v(html), ...(noFluxo ? { noFluxo } : {}) });

export function ecrasInventario(): EcraInventario[] {
  return [
    { id: 'entrar', nome: '01 · Entrar', fluxo: F.ENTRAR, objetivo: 'Sem função nem palavra-passe: quem já entrou neste PDA toca no nome; outra pessoa escreve o seu.', versoes: v(entrar(false)) },
    est('entrar-primeira', 'entrar', '01.1 · Primeira vez no PDA', F.ENTRAR, 'Ainda ninguém entrou neste PDA: só o campo do nome.', entrar(true)),

    { id: 'inicio', nome: '02 · Início', fluxo: F.INVENTARIO, objetivo: 'O inventário a decorrer e as secções, cada uma com o seu botão de início e de fim (ex.: «Terminar Óleos»). Só se conta nas secções a decorrer. No fim, «Terminar inventário». Saiu o «Exportar para Excel».', versoes: v(inicio()) },
    est('inicio-sem-inventario', 'inicio', '02.1 · Nenhum inventário', F.INVENTARIO, 'Sem inventário a decorrer: um botão só, «Iniciar inventário».', inicio('sem-inventario')),
    est('inicio-iniciar', 'inicio', '02.2 · Iniciar o inventário', F.INVENTARIO, 'Confirma antes de começar; as secções ficam por iniciar.', inicio('iniciar'), 'Diálogo aberto'),
    est('inicio-a-iniciar', 'inicio', '02.3 · A iniciar no servidor', F.INVENTARIO, 'Enquanto o servidor responde, não se lê nada.', inicio('a-iniciar')),
    est('inicio-nenhuma-seccao', 'inicio', '02.4 · Nenhuma secção a decorrer', F.INVENTARIO, 'Inventário iniciado, secções por iniciar: ainda não se conta.', inicio('nenhuma-seccao')),
    est('inicio-terminar-seccao', 'inicio', '02.5 · Terminar uma secção', F.INVENTARIO, 'Depois de terminar, as prateleiras dessa secção já não se contam. Recusado se houver uma a ser contada.', inicio('terminar-seccao'), 'Diálogo aberto'),
    est('inicio-terminar', 'inicio', '02.6 · Terminar o inventário', F.INVENTARIO, 'Termina também as secções a decorrer. Recusado se houver prateleiras a ser contadas.', inicio('terminar'), 'Diálogo aberto'),
    est('inicio-por-fechar', 'inicio', '02.7 · Por fechar no servidor', F.INVENTARIO, 'O fecho falhou: as contagens ficam no PDA e fecham-se daqui.', inicio('por-fechar')),
    est('inicio-sem-servidor', 'inicio', '02.8 · Sem servidor', F.INVENTARIO, 'Sem o servidor não se conta: é ele que bloqueia a prateleira e sabe se já foi contada.', inicio('sem-servidor')),

    { id: 'prateleira', nome: '03 · Contar uma prateleira', fluxo: F.CONTAR, objetivo: 'Pica a etiqueta da prateleira (gatilho, toque longo ou câmara) ou escreve-a. O servidor abre-a (fica bloqueada) e diz de que secção é.', versoes: v(prateleira()) },
    est('prateleira-escrever', 'prateleira', '03.1 · Escrever a prateleira', F.CONTAR, 'A etiqueta não lê: escreve-se o código.', prateleira('escrever'), 'Diálogo aberto'),
    est('prateleira-a-abrir', 'prateleira', '03.2 · A abrir no servidor', F.CONTAR, 'Picou-se a prateleira: enquanto o servidor a abre, não se lê nada.', prateleira('a-abrir')),
    est('prateleira-ja-contada', 'prateleira', '03.3 · Já contada', F.CONTAR, 'Não se lê a mesma prateleira duas vezes no mesmo inventário: diz quem e quando.', prateleira('ja-contada')),
    est('prateleira-ocupada', 'prateleira', '03.4 · A ser contada', F.CONTAR, 'Outra pessoa tem a prateleira aberta: diz quem, desde quando e em que PDA.', prateleira('ocupada')),
    est('prateleira-nao-iniciada', 'prateleira', '03.5 · Secção por iniciar', F.CONTAR, 'A prateleira é de uma secção que ainda não começou (ou já terminou).', prateleira('nao-iniciada')),
    est('prateleira-fechada', 'prateleira', '03.6 · Fechada sem diferenças', F.CONTAR, 'Fechada com o tempo de prateleira; bateu com o stock, nenhum acerto.', prateleira('fechada')),
    est('prateleira-fechada-acertos', 'prateleira', '03.7 · Fechada com acertos', F.CONTAR, 'Fechar fez o acerto automático; o que não se acerta sozinho vai ao Gestor.', prateleira('fechada-acertos')),

    { id: 'contar', nome: '04 · Contar', fluxo: F.CONTAR, objetivo: 'Cada leitura soma 1; o escrito à mão leva a quantidade. O tempo de prateleira corre no topo. Sem pausa: só se sai a fechar, a confirmar vazia ou a descartar.', versoes: v(contar()) },
    est('contar-lido', 'contar', '04.1 · A contar', F.CONTAR, 'A última leitura fica a laranja e sobe para o topo; toca-se numa linha para corrigir.', contar('lido')),
    est('contar-escrever', 'contar', '04.2 · Escrever artigo', F.CONTAR, 'Artigo sem etiqueta ou que não lê: código e quantidade (1 a 9999); fica «Escrito à mão».', contar('escrever'), 'Diálogo aberto'),
    est('contar-corrigir', 'contar', '04.3 · Corrigir a quantidade', F.CONTAR, 'Menos, mais ou escrever o número; ou tirar da contagem. A correção fica no registo.', contar('corrigir'), 'Diálogo aberto'),
    est('contar-parece-prateleira', 'contar', '04.4 · É uma prateleira', F.CONTAR, 'Picou-se outra etiqueta de prateleira: fechar e passar, ou contar como artigo.', contar('parece-prateleira'), 'Diálogo aberto'),
    est('contar-mesma', 'contar', '04.5 · A mesma prateleira', F.CONTAR, 'Picou-se a etiqueta da prateleira onde já se está.', contar('mesma')),
    est('contar-sair', 'contar', '04.6 · Sair a meio', F.CONTAR, 'O botão voltar do Android só avisa: quem começa uma prateleira acaba-a.', contar('sair')),
    est('contar-descartar', 'contar', '04.7 · Descartar', F.CONTAR, 'Apaga o contado e desbloqueia a prateleira; fica por contar.', contar('descartar'), 'Diálogo aberto'),

    { id: 'camara', nome: '05 · Ler com a câmara', fluxo: F.CONTAR, objetivo: 'No PDA ao lado do gatilho, no telemóvel em vez dele: fica aberta da prateleira aos artigos; a mesma etiqueta só conta passados 2 s.', versoes: v(camaraEcra(false)) },
    est('camara-lido', 'camara', '05.1 · Lido', F.CONTAR, 'O que se leu aparece em baixo com a quantidade.', camaraEcra(true)),

    { id: 'resumo', nome: '06 · Fechar a prateleira', fluxo: F.CONTAR, objetivo: 'Ver se está tudo, com o tempo de prateleira. Fechar grava o contado à parte do stock e faz os acertos só onde há diferença.', versoes: v(resumo()) },
    est('resumo-vazia', 'resumo', '06.1 · Prateleira vazia', F.CONTAR, 'A vazia passa pelo mesmo resumo.', resumo('vazia')),
    est('resumo-a-fechar', 'resumo', '06.2 · A fechar no servidor', F.CONTAR, 'Enquanto o servidor fecha e acerta, não se lê nada.', resumo('a-fechar')),

    { id: 'contagens', nome: '07 · Contagens deste PDA', fluxo: F.HIST, objetivo: 'As contagens guardadas neste PDA, a mais recente primeiro, com o tempo: fechada, por fechar ou a meio.', versoes: v(contagens(false)) },
    est('contagens-limpar', 'contagens', '07.1 · Limpar as fechadas', F.HIST, 'Tira do PDA o que já está fechado no servidor.', contagens(true), 'Diálogo aberto'),
    { id: 'ver', nome: '08 · Ver uma contagem', fluxo: F.HIST, objetivo: 'Só leitura: números, tempo de prateleira, secção e o que o servidor respondeu ao fechar.', versoes: v(resumo('ver')) },

    { id: 'historico', nome: '09 · Histórico', fluxo: F.HIST, objetivo: 'Pica ou escreve uma prateleira ou um artigo: as contagens e os movimentos (entradas, saídas, acertos), o mais recente primeiro.', versoes: v(historicoEcra()) },
    est('historico-prateleira', 'historico', '09.1 · De uma prateleira', F.HIST, 'Quem a contou, quanto tempo demorou, e o que entrou, saiu e se acertou.', historicoEcra('prateleira')),
    est('historico-artigo', 'historico', '09.2 · De um artigo', F.HIST, 'Pela referência ou pelo código de barras: onde foi contado e os movimentos em todas as prateleiras.', historicoEcra('artigo')),
    est('historico-escrever', 'historico', '09.3 · Escrever o código', F.HIST, 'A etiqueta não lê: escreve-se.', historicoEcra('escrever'), 'Diálogo aberto'),

    { id: 'ligacao', nome: '10 · Ligação ao servidor', fluxo: F.HIST, objetivo: 'O endereço do servidor do inventário (endpoints inventados; base de dados num Excel no PC). Saiu o ERP de demonstração.', versoes: v(ligacao()) },
    est('ligacao-testada', 'ligacao', '10.1 · Testada', F.HIST, 'O servidor respondeu e diz se há inventário a decorrer.', ligacao('testada')),
    est('ligacao-ocupada', 'ligacao', '10.2 · Com prateleiras abertas', F.HIST, 'Não se muda de servidor com prateleiras a meio ou por fechar.', ligacao('ocupada')),
  ];
}
