/* =========================================================
   INVENTÁRIO — a app Kotlin do PDA, posta no Figma (26 nov. 2026)
   Ela: «coloca no figma a app do inventario». Os ecrãs são os da 1.8.1 (App.kt de ~/projects/inventario-pda), com
   os mesmos textos e a mesma ordem: entrar só com o nome → Início → picar a prateleira (fica bloqueada no ERP) →
   picar os artigos (cada leitura soma 1; o escrito à mão leva a quantidade) → concluir com a fotografia de frente →
   enviar ao ERP e exportar para Excel. Sem pausa: quem começa uma prateleira acaba-a. Recontagem às cegas (20 %).
   Os diálogos e os «a falar com o ERP» são estados do ecrã onde aparecem.
   ========================================================= */
import type { EcraInventario, IdInventario } from './ids';
import { ir } from './ids';
import { L } from '../goparts/portal/inicio-espaco';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import cloudUpload from 'lucide-static/icons/cloud-upload.svg?raw';
import fileDown from 'lucide-static/icons/file-down.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import settings from 'lucide-static/icons/settings.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import trash2 from 'lucide-static/icons/trash-2.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import imagePlus from 'lucide-static/icons/image-plus.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import listX from 'lucide-static/icons/list-x.svg?raw';

/* ---------- os dados de exemplo ---------- */
const QUEM = 'Inês Costa';
const RECENTES = ['Inês Costa', 'Joana Matos', 'Tiago Reis'];
const P = '60300102';
type Linha = { codigo: string; n: number; escrito?: boolean };
const LINHAS: Linha[] = [
  { codigo: '6204-2RSH', n: 12 },
  { codigo: '5601234567893', n: 4 },
  { codigo: '22210-E1-K', n: 2, escrito: true },
];
const un = (ls: Linha[]) => ls.reduce((s, l) => s + l.n, 0);
const codigos = (n: number) => `${n} ${n === 1 ? 'código' : 'códigos'}`;

/* ---------- as peças (as mesmas do App.kt) ---------- */
type Alvo = 'sem' | 'gatilho';
const iniciais = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
const acao = (t: string, ic: string, extra = '', cls = '') => `<button type="button" class="inv__btn inv__btn--acao${cls ? ` ${cls}` : ''}"${extra}>${L(ic)}<span>${t}</span></button>`;
const sec = (t: string, ic: string, extra = '', cls = '') => `<button type="button" class="inv__btn inv__btn--sec${cls ? ` ${cls}` : ''}"${extra}>${L(ic)}<span>${t}</span></button>`;
const rotulo = (t: string) => `<p class="inv__rotulo">${t}</p>`;
const aviso = (t: string, tom: 'erro' | 'ok' | 'laranja' | 'azul') => `<p class="inv__aviso inv__aviso--${tom}">${t}</p>`;
const numero = (r: string, n: number, destaque = false) => `<div class="inv__numero${destaque ? ' is-destaque' : ''}"><b>${n}</b><span>${r}</span></div>`;

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

function posicaoGrande(codigo = P): string {
  const partes: [string, string][] = [['Arm.', codigo.slice(0, 2)], ['Zona', codigo.slice(2, 4)], ['Col.', codigo.slice(4, 6)], ['Prat.', codigo.slice(6, 8)]];
  return `<div class="inv__posicao" aria-label="Prateleira ${codigo}">${partes.map(([r, v]) => `<span><small>${r}</small><b>${v}</b></span>`).join('')}</div>`;
}

const cartao = (dentro: string, destino?: IdInventario) => `<div class="inv__cartao"${destino ? ` ${ir(destino)} role="button" tabindex="0"` : ''}>${dentro}</div>`;
const pe = (dentro: string) => `<footer class="inv__pe">${dentro}</footer>`;

/** A página: o topo, (a posição), o corpo que rola e o pé; por cima, um diálogo ou o «a falar com o ERP». */
function pagina(o: { k: string; topo: string; posicao?: boolean; corpo: string; pe?: string; sobre?: string; escuro?: boolean }): string {
  return `<div class="inv${o.escuro ? ' inv--camara' : ''}" data-inv="${o.k}" data-ir-ultima>
    ${o.topo}${o.posicao ? posicaoGrande() : ''}
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

type EstInicio = '' | 'vazio' | 'por-enviar' | 'recontar' | 'a-bloquear';
function inicio(e: EstInicio = ''): string {
  const hoje = e === 'vazio' ? 0 : 7, porEnviar = e === 'por-enviar' ? 2 : 0, total = e === 'vazio' ? 0 : 7;
  const novas: number = e === 'vazio' ? 0 : 3;
  const trocar = `<button type="button" class="inv__trocar" ${ir('entrar')}>${L(logOut)}<span>Trocar</span></button>`;
  const recontar = e === 'recontar' ? `${rotulo('Por recontar (2)')}
    ${cartao(`<div class="inv__linha"><div class="inv__cresce"><b class="inv__codigo">60300405</b><small>Sorteada para recontagem</small></div><span class="inv__mais">${L(scanBarcode)}Recontar</span></div>`, 'prateleira')}
    ${cartao(`<div class="inv__linha"><div class="inv__cresce"><b class="inv__codigo">60301101</b><small>As contagens não bateram: falta mais uma</small></div><span class="inv__mais">${L(scanBarcode)}Recontar</span></div>`, 'prateleira')}` : '';
  const exportar = novas > 0 ? `Exportar para Excel (${novas} ${novas === 1 ? 'nova' : 'novas'})` : `Exportar para Excel (${total})`;
  return pagina({
    k: `inicio${e ? `-${e}` : ''}`,
    topo: topo('Inventário', QUEM, undefined, trocar),
    corpo: `${alvo('Pica uma prateleira', 'Ou carrega em «Contar uma prateleira».', { destino: 'prateleira' })}
      ${recontar}
      <div class="inv__numeros">${numero('Concluídas hoje', hoje)}${numero('Por enviar ao ERP', porEnviar, porEnviar > 0)}</div>
      ${porEnviar > 0 ? `${aviso('Sem ligação ao ERP (10.100.2.70:8080). Confirma a rede e tenta outra vez.', 'erro')}${sec(`Enviar ao ERP (${porEnviar})`, cloudUpload)}` : ''}
      ${sec(exportar, fileDown, total > 0 ? ` ${ir('exportado')}` : ' disabled')}
      ${sec('Ver as contagens deste PDA', list, ` ${ir('contagens')}`)}
      <button type="button" class="inv__ligada" ${ir('ligacao')}>${L(settings)}<span>Ligada a: ERP de demonstração (neste aparelho)</span><b>Mudar</b></button>`,
    pe: pe(acao('Contar uma prateleira', scanBarcode, ` ${ir('prateleira')}`)),
    sobre: e === 'a-bloquear' ? ocupado(`A bloquear a prateleira ${P} no ERP…`) : '',
  });
}

type EstPrat = '' | 'escrever' | 'ocupada' | 'ja-contada' | 'concluida' | 'sorteada' | 'recontar-outra';
function prateleira(e: EstPrat = ''): string {
  const feito = e === 'concluida' || e === 'sorteada';
  const erro = e === 'ocupada' ? `A ${P} está a ser contada por Joana Matos desde as 09:42 (23176B3896). Pica outra.`
    : e === 'recontar-outra' ? 'A 60300405 tem de ser recontada por outra pessoa.' : undefined;
  const banner = feito ? `<div class="inv__feito">${L(circleCheck)}<div><b>${P} concluída</b><span>${un(LINHAS)} un. · ${codigos(LINHAS.length)} · enviada ao ERP</span>
      ${e === 'sorteada' ? '<strong class="is-azul">Sorteada: vai ser recontada por outra pessoa.</strong>' : ''}</div></div>` : '';
  const sobre = e === 'escrever' ? dialogo('Escrever a prateleira',
      `${campo('O código da prateleira', '', { mono: true, dica: 'Ex.: 60300102' })}`,
      acao('Contar', check, ` ${ir('contar')}`), sec('Voltar', arrowLeft, ` ${ir('prateleira')}`))
    : e === 'ja-contada' ? dialogo('Já contada',
      `<p>A ${P} foi contada hoje às 08:15 por Joana Matos. Se contares outra vez, as duas contagens vão para o ERP e o Gestor decide.</p>`,
      acao('Contar outra vez', scanBarcode, ` ${ir('contar')}`), sec('Pica outra', arrowLeft, ` ${ir('prateleira')}`))
    : '';
  return pagina({
    k: `prateleira${e ? `-${e}` : ''}`,
    topo: topo('Contar uma prateleira', QUEM, 'inicio'),
    corpo: `${banner}${alvo(feito ? 'Pica a próxima prateleira' : 'Pica a prateleira', 'A etiqueta da prateleira.', { erro, leitor: 'gatilho', destino: 'contar', cresce: true })}`,
    pe: pe(sec('Escrever o código da prateleira', keyboard, ` ${ir('prateleira-escrever')}`)),
    sobre,
  });
}

type EstContar = '' | 'lido' | 'escrever' | 'corrigir' | 'parece-prateleira' | 'mesma' | 'sair' | 'descartar';
function contar(e: EstContar = ''): string {
  const ls = e === '' ? [] : LINHAS;
  const ultima = e === 'lido' ? '6204-2RSH' : undefined;
  const erro = e === 'mesma' ? `Já estás na prateleira ${P}. Pica os artigos.`
    : e === 'sair' ? `Acaba a ${P} antes de sair: «Concluir prateleira» ou «Prateleira vazia».` : undefined;
  const descartar = `<button type="button" class="inv__icone-topo" aria-label="Descartar esta contagem" ${ir('contar-descartar')}>${L(trash2)}</button>`;
  const linhas = ls.length === 0
    ? '<p class="inv__nada">Ainda nada. Se a prateleira não tem nada, carrega em «Prateleira vazia».</p>'
    : `<ul class="inv__linhas">${ls.map((l) => `<li class="inv__lin${l.codigo === ultima ? ' is-ultima' : ''}" ${ir('contar-corrigir')} role="button" tabindex="0">
        <div class="inv__cresce"><b class="inv__codigo">${l.codigo}</b>${l.escrito ? '<small>Escrito à mão</small>' : ''}</div>
        <strong class="inv__qtd">${l.n}</strong>${L(pencil, 'inv__lapis')}</li>`).join('')}</ul>`;
  const sobre = e === 'escrever' ? dialogo('Escrever o artigo',
      `${campo('Código do artigo', '22210-E1-K', { mono: true })}${campo('Quantidade', '2', { tipo: 'number' })}
       <p class="inv__dica">Para artigos sem etiqueta ou com etiqueta que não lê. A linha fica marcada como escrita à mão.</p>`,
      acao('Somar 2', check, ` ${ir('contar-lido')}`), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : e === 'corrigir' ? dialogo('Corrigir a quantidade',
      `<p class="inv__codigo inv__codigo--grande">6204-2RSH</p>
       <div class="inv__passo"><button type="button" class="inv__quadrado" aria-label="Menos um">${L(minus)}</button><input type="number" value="11" aria-label="Quantidade"><button type="button" class="inv__quadrado" aria-label="Mais um">${L(plus)}</button></div>
       <p class="inv__dica">Estavam 12. A correção fica registada e vai para o ERP.</p>
       ${sec('Tirar da contagem', trash2, ` ${ir('contar-lido')}`)}`,
      acao('Guardar', check, ` ${ir('contar-lido')}`), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : e === 'parece-prateleira' ? dialogo('60300103 é uma prateleira',
      `<p>Acabaste a ${P}? Podes concluí-la e passar à 60300103, ou contar este código como um artigo.</p>`,
      acao('Concluir e passar', check, ` ${ir('prateleira-concluida')}`), sec('Contar como artigo', plus, ` ${ir('contar-lido')}`))
    : e === 'descartar' ? dialogo('Descartar esta contagem?',
      `<p>Apaga o que já contaste na ${P} e desbloqueia-a no ERP. A prateleira fica por contar.</p>`,
      acao('Descartar', trash2, ` ${ir('inicio')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('contar-lido')}`))
    : '';
  return pagina({
    k: `contar${e ? `-${e}` : ''}`,
    topo: topo(`Prateleira ${P}`, `Contada por ${QUEM}`, undefined, descartar),
    posicao: true,
    corpo: `${alvo(ls.length ? 'Pica o próximo artigo' : 'Pica o artigo', 'Cada leitura soma 1. Toca numa linha para corrigir.', { erro, leitor: 'gatilho', lido: !!ultima, destino: 'contar-lido' })}
      <div class="inv__cab-linhas">${rotulo('Contado nesta prateleira')}<b>${un(ls)} un. · ${codigos(ls.length)}</b></div>
      ${linhas}`,
    pe: pe(`${sec('Escrever artigo', keyboard, ` ${ir('contar-escrever')}`)}${ls.length ? acao('Concluir prateleira', check, ` ${ir('resumo')}`) : sec('Prateleira vazia', inbox, ` ${ir('resumo-vazia')}`)}`),
    sobre,
  });
}

type EstResumo = '' | 'com-fotos' | 'vazia' | 'ver';
function resumo(e: EstResumo = ''): string {
  const ver = e === 'ver', vazia = e === 'vazia';
  const ls = vazia ? [] : LINHAS;
  const fotos = e === 'com-fotos';
  const foto = (t: string, sub: string, feita: boolean, obrig: boolean) => `<button type="button" class="inv__foto${feita ? ' is-feita' : obrig ? ' is-obrigatoria' : ''}">
      ${L(feita ? circleCheck : imagePlus)}<b>${t}</b><small>${feita ? `Tirada às ${t === 'De frente' ? '10:24' : '10:25'} · tocar para repetir` : sub}</small></button>`;
  const leituras = ls.filter((l) => !l.escrito).reduce((s, l) => s + l.n, 0) + ls.filter((l) => l.escrito).length;
  const titulo = ver ? `Prateleira ${P}` : vazia ? 'Prateleira vazia?' : `Concluir ${P}?`;
  const sub = ver ? `${QUEM} · 26/11 10:26` : vazia ? 'Viste a prateleira toda e não tem nada?' : 'Vê se está tudo';
  return pagina({
    k: `resumo${e ? `-${e}` : ''}`,
    topo: topo(titulo, sub, ver ? 'contagens' : vazia ? 'contar' : 'contar-lido'),
    posicao: true,
    corpo: `${ver ? '' : `<div class="inv__fotos">${foto('De frente', 'a prateleira toda', fotos, true)}${foto('De cima', 'opcional', fotos, false)}</div>`}
      <div class="inv__numeros inv__numeros--3">${numero('Códigos', ls.length)}${numero('Unidades', un(ls))}${numero('Leituras', leituras)}</div>
      ${ls.some((l) => l.escrito) ? aviso('1 código foi escrito à mão: confirma que está certo.', 'laranja') : ''}
      ${ver ? `<p class="inv__info">Fotografias: frente às 10:24, cima às 10:25</p><p class="inv__info">Exportada para Excel a 26/11 11:02</p><p class="inv__info">Enviada ao ERP a 26/11 10:26 · n.º DEMO-0007</p>` : ''}
      ${ls.length ? `<ul class="inv__linhas inv__linhas--resumo">${ls.map((l) => `<li><b class="inv__codigo">${l.codigo}</b><strong>${l.n}</strong></li>`).join('')}</ul>` : ''}`,
    pe: ver ? undefined : pe(`${fotos ? '' : '<p class="inv__dica">Falta a fotografia de frente: fica como registo da contagem.</p>'}
      <div class="inv__par">${sec('Continuar', scanBarcode, ` ${ir(vazia ? 'contar' : 'contar-lido')}`)}${acao(vazia ? 'Está vazia' : 'Concluir', vazia ? inbox : check, fotos ? ` ${ir('prateleira-concluida')}` : ' disabled', 'inv__btn--largo')}</div>`),
  });
}

function camaraEcra(lido: boolean): string {
  return pagina({
    k: lido ? 'camara-lido' : 'camara', escuro: true,
    topo: topo(`Prateleira ${P}`, `${lido ? 13 : 12} un. · ${codigos(lido ? 3 : 2)}`, lido ? 'contar-lido' : 'contar'),
    corpo: `<div class="inv__visor" aria-hidden="true"><div class="inv__mira${lido ? ' is-lido' : ''}"><span class="inv__feixe"></span></div></div>`,
    pe: `<footer class="inv__pe">${lido ? '<div class="inv__lida"><b class="inv__codigo">6204-2RSH</b><strong>13</strong></div>' : '<p class="inv__dica">Aponta a mira à etiqueta. A mesma etiqueta só volta a contar passados 2 segundos.</p>'}
      ${acao('Fechar a câmara', x, ` ${ir('contar-lido')}`)}</footer>`,
  });
}

function contagens(limpar: boolean): string {
  type C = { p: string; quem: string; quando: string; n: string; est: 'A meio' | 'Enviada' | 'Por enviar'; recontar?: boolean };
  const cs: C[] = [
    { p: '60300102', quem: 'Inês Costa', quando: '26/11 10:26', n: '18 un.', est: 'Enviada' },
    { p: '60300405', quem: 'Joana Matos', quando: '26/11 09:58', n: 'Por recontar', est: 'Enviada', recontar: true },
    { p: '60300401', quem: 'Joana Matos', quando: '26/11 09:31', n: 'Vazia', est: 'Enviada' },
    { p: '60301101', quem: 'Tiago Reis', quando: '26/11 09:12', n: '42 un.', est: 'Por enviar' },
    { p: '60301102', quem: 'Tiago Reis', quando: '26/11 08:47', n: '7 un.', est: 'Enviada' },
  ];
  return pagina({
    k: limpar ? 'contagens-limpar' : 'contagens',
    topo: topo('Contagens deste PDA', `${cs.length} contagens`, 'inicio'),
    corpo: cs.map((c) => cartao(`<div class="inv__linha"><div class="inv__cresce"><b class="inv__codigo">${c.p}</b><small>${c.quem} · ${c.quando}</small></div>
        <div class="inv__direita"><b${c.recontar ? ' class="is-azul"' : ''}>${c.n}</b><small class="inv__est inv__est--${c.est === 'Enviada' ? 'ok' : c.est === 'A meio' ? 'meio' : 'erro'}">${c.est}</small></div></div>`, c.recontar ? undefined : 'ver')).join(''),
    pe: pe(sec('Limpar as já exportadas', listX, ` ${ir('contagens-limpar')}`)),
    sobre: limpar ? dialogo('Limpar as já exportadas?',
      '<p>Tira deste PDA as 4 contagens que já saíram no Excel, e as fotografias delas. Confirma primeiro que o ficheiro chegou ao escritório.</p>',
      acao('Limpar', listX, ` ${ir('contagens')}`, 'inv__btn--perigo'), sec('Voltar', arrowLeft, ` ${ir('contagens')}`)) : '',
  });
}

function exportado(erro: boolean): string {
  return pagina({
    k: erro ? 'exportado-erro' : 'exportado',
    topo: topo('Exportar para Excel', undefined, 'inicio'),
    corpo: erro ? aviso('A app não tem autorização para escrever em Download. Dá-a nas definições do Android, em Aplicações › Inventário › Armazenamento.', 'erro')
      : `<div class="inv__feito">${L(circleCheck)}<div><b>Ficheiro escrito</b></div></div>
        ${rotulo('Ficheiro')}<p class="inv__codigo">inventario-20261126-1102-23176B3896.xlsx</p>
        ${rotulo('Onde')}<p class="inv__texto">Download/Inventario · 9 fotografias em Download/Inventario/fotos</p>
        <p class="inv__dica">Para o tirar: ligar o PDA ao PC pelo cabo USB e abrir a pasta Download › Inventario, ou «Enviar o ficheiro».</p>`,
    pe: pe(`${erro ? '' : sec('Enviar o ficheiro', send)}${acao('Voltar ao início', arrowLeft, ` ${ir('inicio')}`)}`),
  });
}

type EstLig = '' | 'ligada' | 'a-meio';
function ligacao(e: EstLig = ''): string {
  const ligada = e === 'ligada', meio = e === 'a-meio';
  return pagina({
    k: `ligacao${e ? `-${e}` : ''}`,
    topo: topo('Ligação ao ERP', undefined, 'inicio'),
    corpo: `${cartao(`<div class="inv__linha"><div class="inv__cresce"><b class="inv__nome">${ligada ? 'Enviar ao ERP Rolgest' : 'ERP de demonstração'}</b><small>${ligada ? 'As contagens e as fotografias vão para a API.' : 'Fica tudo neste aparelho, como se fosse o ERP.'}</small></div>
        <span class="inv__interruptor${ligada ? ' is-ligado' : ''}${meio ? ' is-inativo' : ''}" role="switch" aria-checked="${ligada}" ${ir(ligada ? 'ligacao' : 'ligacao-ligada')}><i></i></span></div>`)}
      ${meio ? aviso('Há uma prateleira a meio. Acaba-a antes de mudar a ligação: o bloqueio dela está no ERP atual.', 'erro') : ''}
      ${campo('Endereço', ligada ? 'http://10.100.2.70:8080' : '', { tipo: 'url' })}
      ${campo('Empresa (ex.: emp-000001)', ligada ? 'emp-000001' : '')}
      ${campo('Token (temporário)', ligada ? 'eyJhbGciOi' : '', { tipo: 'password' })}
      <p class="inv__dica">O token cola-se aqui até haver o início de sessão comum. Fica só neste aparelho.</p>
      ${sec('Testar ligação', cloudUpload, meio ? ' disabled' : '')}
      ${ligada ? aviso('O ERP responde, mas ainda não tem o inventário (404). Falta a equipa do Rolgest fazer esta parte da API.', 'erro') : ''}
      <p class="inv__dica">O Excel continua disponível no Início, com o ERP ligado ou não.</p>`,
    pe: pe(acao('Guardar', check, meio ? ' disabled' : ` ${ir('inicio')}`)),
  });
}

/* =========================================================
   A lista
   ========================================================= */
const NOTA = 'Como a app Kotlin 1.8.1 (25 nov.)';
const v = (html: string): EcraInventario['versoes'] => [{ id: 'v1', nota: NOTA, html }];
const F = { ENTRAR: 'Entrar', CONTAR: 'Contar', ENVIAR: 'Enviar e exportar' };
const est = (id: IdInventario, de: IdInventario, nome: string, fluxo: string, objetivo: string, html: string, noFluxo?: string): EcraInventario =>
  ({ id, nome, fluxo, estadoDe: de, objetivo, versoes: v(html), ...(noFluxo ? { noFluxo } : {}) });

export function ecrasInventario(): EcraInventario[] {
  return [
    { id: 'entrar', nome: '01 · Entrar', fluxo: F.ENTRAR, objetivo: 'Sem função nem palavra-passe: quem já entrou neste PDA toca no nome; outra pessoa escreve o seu.', versoes: v(entrar(false)) },
    est('entrar-primeira', 'entrar', '01.1 · Primeira vez no PDA', F.ENTRAR, 'Ainda ninguém entrou neste PDA: só o campo do nome.', entrar(true)),

    { id: 'inicio', nome: '02 · Início', fluxo: F.CONTAR, objetivo: 'Picar uma prateleira começa logo; os números do dia, exportar para Excel, ver as contagens deste PDA e a ligação ao ERP. Se a app fechou a meio de uma prateleira, abre-a logo.', versoes: v(inicio()) },
    est('inicio-vazio', 'inicio', '02.1 · Nada contado', F.CONTAR, 'Ainda nada contado neste PDA: o Excel fica inativo.', inicio('vazio')),
    est('inicio-por-enviar', 'inicio', '02.2 · Por enviar ao ERP', F.CONTAR, 'O envio falhou: diz porquê, as contagens ficam no PDA e enviam-se daqui.', inicio('por-enviar')),
    est('inicio-recontar', 'inicio', '02.3 · Por recontar', F.CONTAR, 'Prateleiras de outras pessoas sorteadas (20 %) ou que não bateram: reconta-se às cegas, picando a etiqueta.', inicio('recontar')),
    est('inicio-a-bloquear', 'inicio', '02.4 · A bloquear no ERP', F.CONTAR, 'Picou-se a prateleira: enquanto o ERP a bloqueia, não se lê nada.', inicio('a-bloquear')),

    { id: 'prateleira', nome: '03 · Contar uma prateleira', fluxo: F.CONTAR, objetivo: 'Pica a etiqueta da prateleira (gatilho, toque longo ou câmara) ou escreve-a. Começar é bloqueá-la no ERP.', versoes: v(prateleira()) },
    est('prateleira-escrever', 'prateleira', '03.1 · Escrever a prateleira', F.CONTAR, 'A etiqueta não lê: escreve-se o código.', prateleira('escrever'), 'Diálogo aberto'),
    est('prateleira-ocupada', 'prateleira', '03.2 · Já a ser contada', F.CONTAR, 'Outra pessoa tem a prateleira bloqueada: diz quem, desde quando e em que PDA.', prateleira('ocupada')),
    est('prateleira-ja-contada', 'prateleira', '03.3 · Já contada', F.CONTAR, 'Já foi contada: contar outra vez manda as duas ao ERP e o Gestor decide.', prateleira('ja-contada'), 'Diálogo aberto'),
    est('prateleira-concluida', 'prateleira', '03.4 · Concluída', F.CONTAR, 'A anterior ficou concluída e enviada; pica-se a próxima.', prateleira('concluida')),
    est('prateleira-sorteada', 'prateleira', '03.5 · Sorteada para recontagem', F.CONTAR, 'A que acabou foi sorteada: outra pessoa vai recontá-la às cegas.', prateleira('sorteada')),
    est('prateleira-recontar-outra', 'prateleira', '03.6 · Recontagem de outra pessoa', F.CONTAR, 'Quem contou não pode recontar a mesma prateleira.', prateleira('recontar-outra')),

    { id: 'contar', nome: '04 · Contar', fluxo: F.CONTAR, objetivo: 'Cada leitura soma 1; o escrito à mão leva a quantidade. Sem pausa nem voltar: só se sai a concluir, a confirmar vazia ou a descartar.', versoes: v(contar()) },
    est('contar-lido', 'contar', '04.1 · A contar', F.CONTAR, 'A última leitura fica a laranja e sobe para o topo; toca-se numa linha para corrigir.', contar('lido')),
    est('contar-escrever', 'contar', '04.2 · Escrever artigo', F.CONTAR, 'Artigo sem etiqueta ou que não lê: código e quantidade (1 a 9999); fica «Escrito à mão».', contar('escrever'), 'Diálogo aberto'),
    est('contar-corrigir', 'contar', '04.3 · Corrigir a quantidade', F.CONTAR, 'Menos, mais ou escrever o número; ou tirar da contagem. A correção fica no registo.', contar('corrigir'), 'Diálogo aberto'),
    est('contar-parece-prateleira', 'contar', '04.4 · É uma prateleira', F.CONTAR, 'Picou-se outra etiqueta de prateleira: concluir e passar, ou contar como artigo.', contar('parece-prateleira'), 'Diálogo aberto'),
    est('contar-mesma', 'contar', '04.5 · A mesma prateleira', F.CONTAR, 'Picou-se a etiqueta da prateleira onde já se está.', contar('mesma')),
    est('contar-sair', 'contar', '04.6 · Sair a meio', F.CONTAR, 'O botão voltar do Android só avisa: quem começa uma prateleira acaba-a.', contar('sair')),
    est('contar-descartar', 'contar', '04.7 · Descartar', F.CONTAR, 'Apaga o contado e desbloqueia a prateleira no ERP.', contar('descartar'), 'Diálogo aberto'),

    { id: 'camara', nome: '05 · Ler com a câmara', fluxo: F.CONTAR, objetivo: 'No PDA ao lado do gatilho, no telemóvel em vez dele: fica aberta da prateleira aos artigos; a mesma etiqueta só conta passados 2 s.', versoes: v(camaraEcra(false)) },
    est('camara-lido', 'camara', '05.1 · Lido', F.CONTAR, 'O que se leu aparece em baixo com a quantidade.', camaraEcra(true)),

    { id: 'resumo', nome: '06 · Concluir a prateleira', fluxo: F.CONTAR, objetivo: 'Ver se está tudo e fotografar: de frente com a etiqueta (obrigatória) e de cima (opcional). Concluir envia logo ao ERP.', versoes: v(resumo()) },
    est('resumo-com-fotos', 'resumo', '06.1 · Com as fotografias', F.CONTAR, 'Com a de frente tirada, já se conclui.', resumo('com-fotos')),
    est('resumo-vazia', 'resumo', '06.2 · Prateleira vazia', F.CONTAR, 'A vazia passa pelo mesmo resumo, com a fotografia de frente que a comprova.', resumo('vazia')),

    { id: 'contagens', nome: '07 · Contagens deste PDA', fluxo: F.ENVIAR, objetivo: 'As contagens guardadas neste PDA, a mais recente primeiro: enviada, por enviar ou a meio; as por recontar não mostram números.', versoes: v(contagens(false)) },
    est('contagens-limpar', 'contagens', '07.1 · Limpar as exportadas', F.ENVIAR, 'Tira do PDA o que já saiu no Excel, e as fotografias.', contagens(true), 'Diálogo aberto'),
    { id: 'ver', nome: '08 · Ver uma contagem', fluxo: F.ENVIAR, objetivo: 'Só leitura: números, fotografias, quando foi exportada e o n.º do ERP.', versoes: v(resumo('ver')) },

    { id: 'exportado', nome: '09 · Exportar para Excel', fluxo: F.ENVIAR, objetivo: 'O .xlsx (Contagens, Prateleiras, Registo, Recontagens, Fotos) e as fotografias em Download/Inventario; tira-se por cabo ou «Enviar o ficheiro».', versoes: v(exportado(false)) },
    est('exportado-erro', 'exportado', '09.1 · Sem autorização', F.ENVIAR, 'O Android não deixou escrever: diz onde se dá a autorização.', exportado(true)),

    { id: 'ligacao', nome: '10 · Ligação ao ERP', fluxo: F.ENVIAR, objetivo: 'Desligada, o ERP de demonstração faz o mesmo no aparelho; ligada, a API Rolgest com endereço, empresa e token temporário.', versoes: v(ligacao()) },
    est('ligacao-ligada', 'ligacao', '10.1 · Ligada ao Rolgest', F.ENVIAR, 'Testar ligação: o ERP respondeu, mas ainda não tem o inventário.', ligacao('ligada')),
    est('ligacao-a-meio', 'ligacao', '10.2 · Com uma prateleira a meio', F.ENVIAR, 'Não se muda a ligação com uma prateleira a meio: o bloqueio está no ERP atual.', ligacao('a-meio')),
  ];
}
