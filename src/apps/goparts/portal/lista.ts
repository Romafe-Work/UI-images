/* =========================================================
   GOPARTS — 15 · Minha lista (16 out. 2026: o espaço de orçamento)
   Do briefing dela («Premium My List & Quotation Builder») e do esquema que escolheu («Minha lista / Reparação
   Peugeot 308 · Rascunho / Por guardar / Peças … Preço pendente / Mão-de-obra / Resumo … Pré-visualizar · Guardar
   lista»). Substitui a versão de 14 out. (uma só versão por ecrã):
   - cabeçalho compacto: MINHA LISTA, a frase, o nome editável, o estado (Nova / Rascunho / Guardada / Enviada), a
     última atualização e «Por guardar»; à direita «Guardar lista» (laranja) e «Mais ações» (Nova lista, Duplicar,
     Pôr no carrinho, Limpar, Eliminar — eliminar e limpar pedem confirmação e dizem o que acontece);
   - duas colunas: à esquerda Peças, Mão-de-obra, Outros custos e Notas; à direita o Resumo, preso ao rolar, com
     «Pré-visualizar» e «Enviar»; em ecrã estreito, uma barra em baixo com o total e «Ver resumo»;
   - «Minhas listas → Editar lista» no mesmo ecrã (no lugar de Criar / Pesquisar): procurar, estado, datas,
     artigos e total; abrir repõe o que foi guardado;
   - a gaveta «Adicionar peças» (referência, marca ou descrição; as mais usadas nas tuas listas; a disponibilidade;
     a quantidade), a pré-visualização do orçamento (rascunho, não emitido) e os diálogos.
   Dados: as referências e os preços são os do catálogo (catalogo-dados.ts, de exemplo); a SKF02553 «Autocolante»
   é a do ecrã antigo que ela mandou e não tem preço — «Preço indisponível» nunca é 0,00 €. IVA só a 23 % (a única
   taxa nos dados). Contas: linha = Qtd. × PVP × (1 − Desc.), arredondada ao cêntimo; base = peças + mão-de-obra +
   outros custos − descontos; IVA sobre a base. As regras de arredondamento verdadeiras são as do Peça A Peça.
   Comportamento: comportamento/lista.ts. CSS: css/lista.css.
   ========================================================= */
import { silhueta } from './carros';
import { azulejoPeca } from './pecas-img';
import { REFERENCIAS, saida, type Referencia } from './catalogo-dados';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import save from 'lucide-static/icons/save.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import wrench from 'lucide-static/icons/wrench.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import alert from 'lucide-static/icons/triangle-alert.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import folderOpen from 'lucide-static/icons/folder-open.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import rotate from 'lucide-static/icons/rotate-ccw.svg?raw';
import mail from 'lucide-static/icons/mail.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import note from 'lucide-static/icons/sticky-note.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import filePlus from 'lucide-static/icons/file-plus.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import packageX from 'lucide-static/icons/package-x.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
export const IC = { save, search, send, trash, plus, minus, wrench, pkg, copy, x, check, alert, lock, folderOpen, pencil, info, rotate, mail, ellipsis, eye, cart, fileText, printer, undo, clock, arrowLeft, eraser, receipt, note, logIn, filePlus, wifiOff, packageX, chevronRight };

/** 1 245,90 € — o espaço fino inquebrável entre milhares (o pt-PT do navegador não agrupa os de 4 algarismos). */
export function euros(n: number): string {
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  return `${n < -0.004 ? '−' : ''}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d} €`;
}
/** Um preço no campo: sempre com dois decimais (112,40). */
export const dinheiro = (n: number) => n.toFixed(2).replace('.', ',');
export const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',').replace(/,?0+$/, ''));
export const cent = (n: number) => Math.round(n * 100) / 100;
export const IVA = 0.23;

/* ---------- o modelo ---------- */
/** Uma peça: o preço de tabela (PVP, o que a oficina cobra) e o líquido (o que paga à Romafe). Sem preço: null. */
export type Peca = { marca: string; ref: string; desc: string; qtd: number; liquido: number | null; pvp: number | null; d: number; porto?: number; sacavem?: number };
/** Um serviço: por hora (horas × preço/hora) ou a preço fixo (1 × preço). */
export type Mao = { desc: string; modo: 'hora' | 'fixo'; horas: number; preco: number; d: number };
export type Custo = { desc: string; valor: number };
export type EstadoDaLista = 'nova' | 'rascunho' | 'guardada' | 'enviada';
export type Lista = { id: string; nome: string; estado: EstadoDaLista; criada: string; atualizada: string; carro?: string; pecas: Peca[]; mao: Mao[]; custos: Custo[]; notas: string };

export const doCatalogo = (r: Referencia, qtd = 1, d = 0): Peca => ({ marca: r[1], ref: r[2], desc: r[3], qtd, liquido: cent(r[4] * (1 - r[5] / 100)), pvp: r[4], d, porto: r[6], sacavem: r[7] });
const peca = (ref: string, qtd: number, d: number) => doCatalogo(REFERENCIAS.find((x) => x[2] === ref)!, qtd, d);
/** A peça do ecrã antigo (a imagem dela): o GO REPAIR não lhe dá preço nem stock. */
export const AUTOCOLANTE: Peca = { marca: 'SKF', ref: 'SKF02553', desc: 'Autocolante', qtd: 1, liquido: null, pvp: null, d: 0 };

export const LISTAS: Lista[] = [
  { id: 'L2024/000318', nome: 'Reparação Peugeot 308', estado: 'rascunho', criada: '14/10/2026', atualizada: 'hoje às 10:42', carro: 'Hatchback',
    pecas: [peca('VKMC 01250-2', 1, 0), peca('VKPC 88618', 1, 5), peca('VKMV 6PK1873', 1, 0), peca('VKBA 6556', 2, 10), AUTOCOLANTE],
    mao: [{ desc: 'Substituição do kit de distribuição e da bomba de água', modo: 'hora', horas: 2.5, preco: 38, d: 0 }, { desc: 'Substituição dos rolamentos de roda (eixo dianteiro)', modo: 'hora', horas: 1.2, preco: 38, d: 10 }],
    custos: [], notas: '' },
  { id: 'L2024/000301', nome: 'Revisão BMW Série 3', estado: 'guardada', criada: '08/10/2026', atualizada: '10/10/2026', carro: 'Berlina',
    pecas: [peca('VKMV 6PK1873', 1, 0), peca('VKM 38236', 1, 0)],
    mao: [{ desc: 'Revisão', modo: 'fixo', horas: 1, preco: 65, d: 0 }], custos: [], notas: '' },
  { id: 'L2024/000287', nome: 'Material para oficina', estado: 'guardada', criada: '02/10/2026', atualizada: '02/10/2026', pecas: [], mao: [], custos: [], notas: '' },
  { id: 'L2024/000276', nome: 'Renault Scénic II · 12-AB-34', estado: 'enviada', criada: '29/09/2026', atualizada: '10/10/2026', carro: 'Monovolume',
    pecas: [peca('VKBA 6557', 2, 0), peca('VKJA 5446', 1, 5)], mao: [{ desc: 'Substituição dos rolamentos de roda (eixo traseiro)', modo: 'hora', horas: 1.5, preco: 38, d: 0 }], custos: [], notas: '' },
];
export const NOVA = (): Lista => ({ id: '', nome: 'Nova lista', estado: 'nova', criada: 'hoje', atualizada: 'ainda não guardada', pecas: [], mao: [], custos: [], notas: '' });
export const listaDe = (id: string) => LISTAS.find((l) => l.id === id);

/* ---------- as contas ---------- */
export const totalPeca = (p: Peca) => (p.pvp === null ? null : cent(p.qtd * p.pvp * (1 - p.d / 100)));
export const totalMao = (m: Mao) => cent((m.modo === 'fixo' ? 1 : m.horas) * m.preco * (1 - m.d / 100));
export function contas(l: Pick<Lista, 'pecas' | 'mao' | 'custos'>) {
  const comPreco = l.pecas.filter((p) => p.pvp !== null);
  const brutoP = cent(comPreco.reduce((s, p) => s + cent(p.qtd * p.pvp!), 0)), brutoM = cent(l.mao.reduce((s, m) => s + cent((m.modo === 'fixo' ? 1 : m.horas) * m.preco), 0));
  const liqP = cent(comPreco.reduce((s, p) => s + totalPeca(p)!, 0)), liqM = cent(l.mao.reduce((s, m) => s + totalMao(m), 0));
  const outros = cent(l.custos.reduce((s, c) => s + c.valor, 0));
  const base = cent(liqP + liqM + outros), iva = cent(base * IVA);
  return { pecas: brutoP, mao: brutoM, outros, descontos: cent(brutoP + brutoM - liqP - liqM), base, iva, total: cent(base + iva),
    custo: cent(l.pecas.filter((p) => p.liquido !== null).reduce((s, p) => s + p.qtd * p.liquido!, 0)),
    semPreco: l.pecas.filter((p) => p.pvp === null), nPecas: l.pecas.length, nMao: l.mao.length, nCustos: l.custos.length,
    noCarrinho: l.pecas.filter((p) => p.pvp !== null && (p.porto ?? 0) + (p.sacavem ?? 0) > 0).length };
}
export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/* ---------- peças pequenas ---------- */
const botao = (cls: string, icone: string, texto: string, extra = '') => `<button type="button" class="btn ${cls}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
export { botao as botaoLista };
const campoNum = (cls: string, rotulo: string, valor: string, extra = '') => `<input class="lst__num ${cls}" inputmode="decimal" aria-label="${rotulo}" value="${valor}"${extra}>`;
const passos = (cls: string, v: number, rot: string, so = false, extra = '') => `<span class="lst__qtd"><button type="button" class="lst__qtd-b" data-passo="-1" aria-label="Menos um — ${rot}"${so ? ' disabled' : ''}>${L(minus)}</button>${campoNum(cls, rot, num(v), (so ? ' readonly' : '') + extra)}<button type="button" class="lst__qtd-b" data-passo="1" aria-label="Mais um — ${rot}"${so ? ' disabled' : ''}>${L(plus)}</button></span>`;
const erroCampo = (id: string, msg: string) => `<p class="lst__erro" id="${id}">${L(alert)}${msg}</p>`;
const accoesLinha = (so: boolean, nome: string) => so ? '' : `<span class="lst__linha-accoes"><button type="button" class="lst__icone" data-duplicar aria-label="Duplicar ${nome}" data-dica="Duplicar">${L(copy)}</button><button type="button" class="lst__icone lst__icone--remover" data-remover aria-label="Remover ${nome}" data-dica="Remover">${L(trash)}</button></span>`;

/** A disponibilidade, só quando o catálogo a dá (Porto hoje / Sacavém amanhã / por encomenda). */
export function disponibilidade(p: Pick<Peca, 'porto' | 'sacavem'>): string {
  if (p.porto === undefined || p.sacavem === undefined) return '<span class="lst__disp lst__disp--nada"><i aria-hidden="true"></i>Disponibilidade por confirmar</span>';
  const k = p.porto + p.sacavem === 0 ? 'sem' : p.porto ? 'ok' : 'pouco';
  return `<span class="lst__disp lst__disp--${k}"><i aria-hidden="true"></i>${saida(p.porto, p.sacavem)}</span>`;
}

export type OpcoesLinha = { so?: boolean; nova?: boolean; erroQtd?: string; erroD?: string; indisponivel?: boolean };
export function linhaPeca(p: Peca, i: number, o: OpcoesLinha = {}): string {
  const so = !!o.so, t = totalPeca(p), nome = `${p.marca} ${p.ref}`, sem = p.pvp === null;
  const disp = o.indisponivel ? '<span class="lst__disp lst__disp--sem"><i aria-hidden="true"></i>Indisponível de momento — sem stock no Porto nem em Sacavém</span>' : disponibilidade(p);
  return `<li class="lst__linha lst__linha--peca${o.nova ? ' is-nova' : ''}${sem ? ' is-sem-preco' : ''}${o.indisponivel ? ' is-indisponivel' : ''}" data-tipo="peca" data-flip data-ref="${p.ref}" data-liquido="${p.liquido ?? ''}" style="--i:${i}">
    ${azulejoPeca(p.desc, 'lst__img', p.ref)}
    <div class="lst__id-peca"><p class="lst__ref-l"><span class="lst__marca">${p.marca}</span><b class="lst__ref">${p.ref}</b></p><p class="lst__desc">${p.desc}</p><p class="lst__info">${disp}${p.liquido !== null ? `<span class="lst__liq" data-dica="O que a oficina paga à Romafe, por unidade, sem IVA">Líquido Romafe ${euros(p.liquido)}/un.</span>` : ''}</p></div>
    <div class="lst__c lst__c--qtd${o.erroQtd ? ' is-erro' : ''}"><span class="lst__rot" aria-hidden="true">Qtd.</span>${passos('lst__q', p.qtd, `Quantidade de ${nome}`, so, o.erroQtd ? ` aria-invalid="true" aria-describedby="lst-eq-${i}"` : '').replace(`value="${num(p.qtd)}"`, o.erroQtd ? `value="${o.erroQtd}"` : `value="${num(p.qtd)}"`)}${o.erroQtd ? erroCampo(`lst-eq-${i}`, 'Inteiro, 1 ou mais') : ''}</div>
    <div class="lst__c lst__c--pvp"><span class="lst__rot" aria-hidden="true">PVP un.</span>${sem ? `<span class="lst__pendente" data-dica="O Peça A Peça não devolveu preço para esta referência"><span class="sr-only">${nome}: </span>Preço indisponível</span>` : campoNum('lst__pvp', `PVP unitário de ${nome}, sem IVA`, dinheiro(p.pvp!), so ? ' readonly' : '')}</div>
    <div class="lst__c lst__c--d${o.erroD ? ' is-erro' : ''}"><span class="lst__rot" aria-hidden="true">Desc. %</span>${campoNum('lst__d', `Desconto de ${nome}, em percentagem`, o.erroD ?? num(p.d), (so || sem ? ' readonly' : '') + (o.erroD ? ` aria-invalid="true" aria-describedby="lst-ed-${i}"` : ''))}${o.erroD ? erroCampo(`lst-ed-${i}`, 'De 0 a 100 %') : ''}</div>
    <div class="lst__c lst__c--total"><span class="lst__rot" aria-hidden="true">Total</span><b class="lst__total" data-total>${t === null || o.erroQtd || o.erroD ? '<span class="lst__sem">— €</span>' : euros(t)}</b></div>
    <div class="lst__c--fim">${accoesLinha(so, nome)}</div>
  </li>`;
}
export function linhaMao(m: Mao, i: number, o: { so?: boolean; nova?: boolean } = {}): string {
  const so = !!o.so, fixo = m.modo === 'fixo';
  return `<li class="lst__linha lst__linha--mao${o.nova ? ' is-nova' : ''}" data-tipo="mao" data-modo="${m.modo}" data-flip style="--i:${i}">
    <span class="lst__img lst__img--mao" aria-hidden="true">${L(wrench)}</span>
    <div class="lst__id-peca"><input class="lst__texto" aria-label="Descrição do serviço" value="${m.desc}" placeholder="Ex.: Diagnóstico"${so ? ' readonly' : ''}>
      <p class="lst__info"><span class="lst__modo" role="group" aria-label="Como se cobra"><button type="button" data-modo="hora" aria-pressed="${!fixo}"${so ? ' disabled' : ''}>Por hora</button><button type="button" data-modo="fixo" aria-pressed="${fixo}"${so ? ' disabled' : ''}>Preço fixo</button></span></p></div>
    <div class="lst__c lst__c--qtd"><span class="lst__rot" aria-hidden="true">${fixo ? 'Qtd.' : 'Horas'}</span>${fixo ? '<span class="lst__fixo-1">1 serviço</span>' : passos('lst__q', m.horas, 'Horas', so)}</div>
    <div class="lst__c lst__c--pvp"><span class="lst__rot" aria-hidden="true">${fixo ? 'Preço' : 'Preço/hora'}</span>${campoNum('lst__pvp', fixo ? 'Preço do serviço, sem IVA' : 'Preço por hora, sem IVA', dinheiro(m.preco), so ? ' readonly' : '')}</div>
    <div class="lst__c lst__c--d"><span class="lst__rot" aria-hidden="true">Desc. %</span>${campoNum('lst__d', 'Desconto, em percentagem', num(m.d), so ? ' readonly' : '')}</div>
    <div class="lst__c lst__c--total"><span class="lst__rot" aria-hidden="true">Total</span><b class="lst__total" data-total>${euros(totalMao(m))}</b></div>
    <div class="lst__c--fim">${accoesLinha(so, 'o serviço')}</div>
  </li>`;
}
export function linhaCusto(c: Custo, i: number, o: { so?: boolean; nova?: boolean } = {}): string {
  const so = !!o.so;
  return `<li class="lst__linha lst__linha--custo${o.nova ? ' is-nova' : ''}" data-tipo="custo" data-flip style="--i:${i}">
    <span class="lst__img lst__img--mao" aria-hidden="true">${L(receipt)}</span>
    <div class="lst__id-peca"><input class="lst__texto" aria-label="Descrição do custo" value="${c.desc}" placeholder="Ex.: Deslocação"${so ? ' readonly' : ''}></div>
    <div class="lst__c lst__c--pvp"><span class="lst__rot" aria-hidden="true">Valor</span>${campoNum('lst__pvp', 'Valor do custo, sem IVA', dinheiro(c.valor), so ? ' readonly' : '')}</div>
    <div class="lst__c lst__c--total"><span class="lst__rot" aria-hidden="true">Total</span><b class="lst__total" data-total>${euros(c.valor)}</b></div>
    <div class="lst__c--fim">${accoesLinha(so, 'o custo')}</div>
  </li>`;
}

/* ---------- os estados ---------- */
export type EstadoLista = '' | 'vazia' | 'nova' | 'pecas' | 'mao' | 'completa' | 'sem-preco' | 'indisponivel' | 'qtd-invalida' | 'desc-invalido'
  | 'sujo' | 'a-guardar' | 'guardada' | 'falhou-guardar' | 'offline' | 'sem-resultados' | 'adicionar' | 'remover' | 'remover-ultima'
  | 'a-carregar' | 'duplicar' | 'eliminar' | 'a-enviar' | 'falhou-enviar' | 'sessao' | 'enviada' | 'leitura' | 'sem-permissao'
  | 'previsualizar' | 'listas' | 'servico';

/** A lista que cada estado mostra (as listas guardadas, ou a nova). */
function listaDoEstado(e: EstadoLista): Lista {
  const base = structuredClone(LISTAS[0]);
  const semAutocolante = (l: Lista) => ({ ...l, pecas: l.pecas.filter((p) => p.pvp !== null) });
  switch (e) {
    case 'nova': return NOVA();
    case 'vazia': return structuredClone(LISTAS[2]);
    case 'pecas': return { ...semAutocolante(base), mao: [] };
    case 'mao': return { ...base, pecas: [], nome: 'Diagnóstico Peugeot 308' };
    case 'completa': case 'sujo': case 'a-guardar': case 'guardada': case 'falhou-guardar': case 'a-enviar': case 'falhou-enviar': case 'qtd-invalida': case 'desc-invalido': case 'remover': case 'adicionar': case 'sem-resultados': case 'indisponivel':
      return semAutocolante(base);
    case 'sem-preco': return { ...base, mao: [], pecas: base.pecas.map((p) => ({ ...p, pvp: null, liquido: null })) };
    case 'remover-ultima': return { ...base, pecas: [base.pecas[3]], mao: [] };
    case 'duplicar': return { ...semAutocolante(base), id: '', nome: 'Reparação Peugeot 308 (cópia)', estado: 'nova', criada: 'hoje', atualizada: 'ainda não guardada' };
    case 'enviada': return { ...semAutocolante(base), estado: 'enviada', atualizada: 'hoje às 10:51' };
    case 'leitura': return structuredClone(LISTAS[3]);
    case 'sem-permissao': return structuredClone(LISTAS[1]);
    default: return base;
  }
}

export const ESTADO_NOME: Record<EstadoDaLista, string> = { nova: 'Nova', rascunho: 'Rascunho', guardada: 'Guardada', enviada: 'Enviada' };
/** O indicador da gravação, ao lado do estado: por guardar · a guardar · guardada · não guardada. */
export function gravacao(k: 'sujo' | 'a-guardar' | 'guardada' | 'erro' | '' , texto = ''): string {
  if (!k) return '<span class="lst__grav" data-grav role="status" aria-live="polite"></span>';
  const t = texto || { sujo: 'Por guardar', 'a-guardar': 'A guardar…', guardada: 'Guardada agora', erro: 'Não foi guardada' }[k];
  const ic = k === 'a-guardar' ? rolamentoSvg('grav-' + Math.random().toString(36).slice(2, 7), 'pesquisar', 'lst__rs-mini') : k === 'guardada' ? L(check) : k === 'erro' ? L(alert) : '<i aria-hidden="true"></i>';
  return `<span class="lst__grav lst__grav--${k}" data-grav role="status" aria-live="polite">${ic}${t}</span>`;
}

/** A parte de baixo do resumo (e a barra do telemóvel): o total, ou «— €» quando nada tem preço. */
function totalTexto(c: ReturnType<typeof contas>): string { return c.nPecas && c.semPreco.length === c.nPecas && !c.nMao && !c.nCustos ? '— €' : euros(c.total); }

export function resumoHtml(l: Lista, o: { so?: boolean; e?: EstadoLista } = {}): string {
  const c = contas(l), e = o.e ?? '', carregar = e === 'a-carregar';
  const v = (n: number, neg = false) => carregar ? '<span class="lst__sem">—</span>' : euros(neg ? -n : n);
  const falta = c.semPreco.length ? `<p class="lst__falta" data-falta>${L(alert)}<span><b>Total parcial.</b> Falta o preço de ${plural(c.semPreco.length, 'peça', 'peças')} (${c.semPreco.map((p) => p.ref).join(', ')}); entra quando o Peça A Peça o devolver.</span></p>` : '<p class="lst__falta" data-falta hidden></p>';
  const aEnviar = e === 'a-enviar', vazia = !c.nPecas && !c.nMao && !c.nCustos;
  const enviar = aEnviar ? `<button type="button" class="btn lst__sec" aria-busy="true" disabled>${rolamentoSvg('lst-e', 'pesquisar', 'lst__rs')}<span class="btn__rotulo">A enviar…</span></button>`
    : botao('lst__sec', send, 'Enviar', ` data-enviar${vazia || o.so || ['qtd-invalida', 'desc-invalido', 'offline'].includes(e) ? ' disabled' : ''}`);
  return `<aside class="lst__resumo" id="lst-resumo" aria-labelledby="lst-resumo-t">
      <header class="lst__resumo-cabeca"><h2 class="lst__resumo-titulo" id="lst-resumo-t">Resumo da lista</h2><button type="button" class="lst__icone lst__resumo-fechar" data-fechar-resumo aria-label="Fechar o resumo">${L(x)}</button></header>
      <p class="lst__resumo-n"><span><b data-n="pecas">${c.nPecas}</b> ${c.nPecas === 1 ? 'peça' : 'peças'}</span><span><b data-n="mao">${c.nMao}</b> ${c.nMao === 1 ? 'serviço' : 'serviços'}</span><span><b data-n="custos">${c.nCustos}</b> ${c.nCustos === 1 ? 'outro custo' : 'outros custos'}</span></p>
      <dl>
        <div><dt>Peças <small>PVP</small></dt><dd data-soma="pecas">${v(c.pecas)}</dd></div>
        <div><dt>Mão-de-obra</dt><dd data-soma="mao">${v(c.mao)}</dd></div>
        <div><dt>Outros custos</dt><dd data-soma="outros">${v(c.outros)}</dd></div>
        <div><dt>Descontos</dt><dd data-soma="descontos" class="lst__menos">${v(c.descontos, true)}</dd></div>
        <div class="lst__resumo-linha"><dt>Base tributável <small>sem IVA</small></dt><dd data-soma="base">${v(c.base)}</dd></div>
        <div><dt>IVA <small>23 %</small></dt><dd data-soma="iva">${v(c.iva)}</dd></div>
        <div class="lst__resumo-total"><dt>Total <small>com IVA</small></dt><dd data-soma="total">${carregar ? '<span class="lst__sem">—</span>' : totalTexto(c)}</dd></div>
      </dl>
      ${falta}
      <div class="lst__resumo-accoes">${botao('lst__sec', eye, 'Pré-visualizar', ` data-previa${vazia ? ' disabled' : ''}`)}${enviar}</div>
      ${o.so ? '' : `<button type="button" class="lst__carrinho" data-carrinho${c.noCarrinho ? '' : ' disabled'}>${L(cart)}<span>Pôr <b data-n="carrinho">${plural(c.noCarrinho, 'peça', 'peças')}</b> no carrinho</span></button>`}
      <p class="lst__custo">${L(info)}<span>Custo das peças na Romafe: <b data-soma="custo">${v(c.custo)}</b> (líquido, sem IVA)</span></p>
      <p class="lst__exemplo">Valores de exemplo, do catálogo; os preços, as regras comerciais e os arredondamentos são os do Peça A Peça.</p>
    </aside>`;
}

const cabecaSeccao = (id: string, icone: string, titulo: string, sub: string, n: number, acao: string) =>
  `<header class="lst__seccao-cabeca"><div><h2 id="${id}">${L(icone)}${titulo} <span class="lst__cont" data-n="${id.replace('lst-t-', '')}">${n}</span></h2><p class="lst__seccao-sub">${sub}</p></div>${acao}</header>`;
const vazioSeccao = (txt: string, acao: string) => `<div class="lst__vazio" data-vazio><p>${txt}</p>${acao}</div>`;
export const colunas = (tipo: 'peca' | 'mao' | 'custo') => `<div class="lst__colunas lst__colunas--${tipo}" aria-hidden="true"><span>${tipo === 'peca' ? 'Peça' : tipo === 'mao' ? 'Serviço' : 'Custo'}</span>${tipo === 'custo' ? '' : `<span>${tipo === 'peca' ? 'Qtd.' : 'Horas'}</span>`}<span>${tipo === 'peca' ? 'PVP un.' : tipo === 'mao' ? 'Preço' : 'Valor'}</span>${tipo === 'custo' ? '' : '<span>Desc. %</span>'}<span>Total</span><span></span></div>`;

/** O editor de um serviço novo (inline, por baixo da secção). As sugestões só preenchem a descrição. */
export function editorServico(aberto = false): string {
  return `<form class="lst__editor" data-editor-servico data-enter="seguinte" data-enter-fim="submeter"${aberto ? '' : ' hidden'} aria-label="Novo serviço">
      <label class="lst__campo"><span>Descrição do serviço</span><input name="desc" required placeholder="Ex.: Substituição de rolamento" autocomplete="off"></label>
      <p class="lst__sugestoes-servico"><span>Sugestões:</span>${['Substituição de rolamento', 'Diagnóstico', 'Montagem', 'Revisão'].map((s) => `<button type="button" class="lst__chip" data-sugestao="${s}">${s}</button>`).join('')}</p>
      <div class="lst__editor-linha">
        <fieldset class="lst__modo lst__modo--grande"><legend class="sr-only">Como se cobra</legend><button type="button" data-modo="hora" aria-pressed="true">Por hora</button><button type="button" data-modo="fixo" aria-pressed="false">Preço fixo</button></fieldset>
        <label class="lst__campo lst__campo--n" data-so-hora><span>Horas</span><input name="horas" inputmode="decimal" value="1"></label>
        <label class="lst__campo lst__campo--n"><span data-rot-preco>Preço/hora <small>sem IVA</small></span><input name="preco" inputmode="decimal" placeholder="0,00" required></label>
        <label class="lst__campo lst__campo--n"><span>Desc. %</span><input name="d" inputmode="decimal" value="0"></label>
        <p class="lst__campo lst__campo--n lst__editor-total"><span>Total</span><b data-editor-total>— €</b></p>
      </div>
      <p class="lst__erro" data-editor-erro hidden></p>
      <div class="lst__editor-accoes">${botao('btn--ghost', x, 'Cancelar', ' data-cancelar-servico')}${botao('btn--acao', plus, 'Adicionar serviço', ' type="submit"').replace('type="button" ', '')}</div>
    </form>`;
}

/** O editor (Editar lista). */
export function editorHtml(l: Lista, e: EstadoLista = ''): string {
  const so = e === 'leitura' || e === 'sem-permissao' || l.estado === 'enviada', carregar = e === 'a-carregar';
  const c = contas(l);
  const erroQtd = e === 'qtd-invalida' ? 1 : -1, erroD = e === 'desc-invalido' ? 1 : -1;
  const linhasP = l.pecas.map((p, i) => linhaPeca(p, i, { so, erroQtd: i === erroQtd ? '1,5' : '', erroD: i === erroD ? '120' : undefined, nova: e === 'adicionar' && i === l.pecas.length - 1, indisponivel: e === 'indisponivel' && i === 2 })).join('');
  const linhasM = l.mao.map((m, i) => linhaMao(m, i, { so })).join('');
  const linhasC = l.custos.map((x, i) => linhaCusto(x, i, { so })).join('');
  const addP = so ? '' : botao('lst__adicionar', plus, 'Adicionar peças', ' data-adicionar="peca" aria-haspopup="dialog" aria-keyshortcuts="Alt+A"');
  const addM = so ? '' : botao('lst__adicionar', plus, 'Adicionar serviço', ' data-adicionar="mao"');
  const addC = so ? '' : botao('lst__adicionar', plus, 'Adicionar custo', ' data-adicionar="custo"');
  const esqueleto = (n: number) => `<div class="lst__carga" role="status">${rolamentoSvg('lst-carga-' + n, 'carregar', 'lst__rs-carga')}<span>${n === 1 ? 'A abrir a lista «Revisão BMW Série 3»…' : ''}</span></div>${Array.from({ length: n === 1 ? 2 : 1 }, () => '<div class="lst__esq" aria-hidden="true"><span></span><span></span><span></span></div>').join('')}`;
  return `<div class="lst__corpo">
      <div class="lst__seccoes">
        <section class="lst__seccao" data-seccao="pecas" data-flip aria-labelledby="lst-t-pecas">
          ${cabecaSeccao('lst-t-pecas', pkg, 'Peças', 'Referências do catálogo Peça A Peça. O PVP e o desconto do cliente editam-se na linha.', l.pecas.length, carregar ? '' : addP)}
          ${carregar ? esqueleto(1) : l.pecas.length ? `${colunas('peca')}<ul class="lst__linhas" role="list" data-enter="seguinte">${linhasP}</ul>`
            : vazioSeccao(so ? 'Esta lista não tem peças.' : 'Ainda não há peças. Procura pela referência, marca ou descrição — ou, no Catálogo, usa «Adicionar à minha lista».', addP.replace('lst__adicionar', 'lst__adicionar lst__adicionar--cheio'))}
        </section>
        <section class="lst__seccao" data-seccao="mao" data-flip aria-labelledby="lst-t-mao">
          ${cabecaSeccao('lst-t-mao', wrench, 'Mão-de-obra', 'Adiciona os serviços necessários à reparação — à hora ou a preço fixo.', l.mao.length, carregar || !l.mao.length ? '' : addM)}
          ${carregar ? esqueleto(2) : l.mao.length ? `${colunas('mao')}<ul class="lst__linhas" role="list" data-enter="seguinte">${linhasM}</ul>` : vazioSeccao(so ? 'Sem serviços.' : 'Sem serviços nesta lista.', e === 'servico' ? '' : addM)}
          ${so || carregar ? '' : editorServico(e === 'servico')}
        </section>
        <section class="lst__seccao lst__seccao--leve" data-seccao="custos" data-flip aria-labelledby="lst-t-custos">
          ${cabecaSeccao('lst-t-custos', receipt, 'Outros custos', 'Deslocação, consumíveis, tratamento de resíduos… o que entra além das peças e dos serviços.', l.custos.length, carregar || !l.custos.length ? '' : addC)}
          ${carregar ? '' : l.custos.length ? `${colunas('custo')}<ul class="lst__linhas" role="list" data-enter="seguinte">${linhasC}</ul>` : vazioSeccao(so ? 'Sem outros custos.' : 'Sem outros custos.', addC)}
        </section>
        <section class="lst__seccao lst__seccao--leve" data-seccao="notas" data-flip aria-labelledby="lst-t-notas">
          <header class="lst__seccao-cabeca"><div><h2 id="lst-t-notas">${L(note)}Notas</h2><p class="lst__seccao-sub">Aparecem no fim do orçamento.</p></div></header>
          <label class="lst__notas"><span class="sr-only">Notas para o orçamento</span><textarea data-notas rows="2" placeholder="Ex.: Peças com 2 anos de garantia. Orçamento válido por 15 dias."${so || carregar ? ' readonly' : ''}>${l.notas}</textarea></label>
        </section>
      </div>
      ${resumoHtml(l, { so, e })}
    </div>
    <div class="lst__barra" data-barra><span class="lst__barra-t"><small>Total <span>com IVA</span></small><b data-soma="total">${carregar ? '—' : totalTexto(c)}</b></span>${botao('lst__sec', eye, 'Ver resumo', ' data-ver-resumo aria-controls="lst-resumo" aria-expanded="false"')}</div>`;
}

/* ---------- Minhas listas ---------- */
export function listasHtml(): string {
  const linha = (l: Lista) => {
    const c = contas(l), artigos = c.nPecas + c.nMao + c.nCustos;
    return `<li class="lst__l" data-flip data-estado-lista="${l.estado}"><button type="button" class="lst__l-abrir" data-abrir-lista="${l.id}">
        <span class="lst__l-nome">${l.carro ? `<span class="lst__l-carro" aria-hidden="true">${silhueta(l.carro)}</span>` : `<span class="lst__l-carro" aria-hidden="true">${L(pkg)}</span>`}<span><b>${l.nome}</b><small>${l.id}</small></span></span>
        <span class="lst__l-c"><span class="lst__rot">Estado</span><span class="lst__estado lst__estado--${l.estado}">${ESTADO_NOME[l.estado]}</span></span>
        <span class="lst__l-c"><span class="lst__rot">Criada</span>${l.criada}</span>
        <span class="lst__l-c"><span class="lst__rot">Atualizada</span>${l.atualizada}</span>
        <span class="lst__l-c lst__l-n"><span class="lst__rot">Artigos</span>${artigos}</span>
        <span class="lst__l-c lst__l-n"><span class="lst__rot">Total <small>com IVA</small></span><b>${artigos ? euros(c.total) : '—'}</b>${c.semPreco.length ? '<small class="lst__l-parcial">parcial</small>' : ''}</span>
        ${L(chevronRight, 'lst__l-seta')}
      </button><button type="button" class="lst__icone" data-duplicar-lista="${l.id}" aria-label="Duplicar «${l.nome}»" data-dica="Duplicar">${L(copy)}</button></li>`;
  };
  const n = (k: EstadoDaLista) => LISTAS.filter((l) => l.estado === k).length;
  return `<section class="lst__vista-listas" aria-labelledby="lst-t-listas">
      <header class="lst__topo lst__topo--listas">
        <div class="lst__cab"><div class="lst__id"><p class="lst__sobre">Minha lista</p><h1 class="lst__h1" id="lst-t-listas">Minhas listas</h1><p class="lst__frase">Organiza peças, serviços e prepara os teus orçamentos.</p></div>
        <div class="lst__accoes">${botao('btn--acao lst__guardar', filePlus, 'Nova lista', ' data-nova-lista')}</div></div>
      </header>
      <div class="lst__l-filtros">
        <label class="lst__procura-campo lst__procura-campo--listas"><span class="sr-only">Procurar listas</span>${L(search)}<input data-procura-listas type="search" placeholder="Procurar pelo nome, n.º ou referência" autocomplete="off"></label>
        <div class="lst__pilulas" role="group" aria-label="Estado">${[['', 'Todas', LISTAS.length], ['rascunho', 'Rascunhos', n('rascunho')], ['guardada', 'Guardadas', n('guardada')], ['enviada', 'Enviadas', n('enviada')]].map(([k, t, q]) => `<button type="button" class="lst__pilula" data-filtro-estado="${k}" aria-pressed="${k === ''}">${t} <span>${q}</span></button>`).join('')}</div>
      </div>
      <div class="lst__l-cabeca" aria-hidden="true"><span>Lista</span><span>Estado</span><span>Criada</span><span>Atualizada</span><span>Artigos</span><span>Total</span><span></span></div>
      <ul class="lst__l-lista" role="list">${LISTAS.map(linha).join('')}</ul>
      <p class="lst__l-vazio" data-listas-vazio hidden>Nenhuma lista com esse nome, n.º ou referência.</p>
    </section>`;
}

/* ---------- a gaveta «Adicionar peças» ---------- */
/** As mais usadas nas tuas listas (contadas nas listas guardadas, não inventadas). */
export function maisUsadas(): Referencia[] {
  const conta = new Map<string, number>();
  LISTAS.forEach((l) => l.pecas.forEach((p) => conta.set(p.ref, (conta.get(p.ref) ?? 0) + 1)));
  return REFERENCIAS.filter((r) => conta.has(r[2])).sort((a, b) => conta.get(b[2])! - conta.get(a[2])!).slice(0, 4);
}
export function resultadoHtml(r: Referencia, i: number, naLista: number, escolhido = false): string {
  const p = doCatalogo(r);
  return `<li role="option" id="lst-op-${i}" class="lst__res" data-ref="${r[2]}" aria-selected="${escolhido}">
      ${azulejoPeca(r[3], 'lst__img', r[2])}
      <span class="lst__res-id"><span class="lst__ref-l"><span class="lst__marca">${r[1]}</span><b class="lst__ref">${r[2]}</b>${naLista ? `<span class="lst__ja">Na lista · ${naLista}</span>` : ''}</span><span class="lst__desc">${r[3]}</span>${disponibilidade(p)}</span>
      <span class="lst__res-preco"><b>${euros(r[4])}</b><small>PVP · líquido ${euros(p.liquido!)}</small></span>
    </li>`;
}
export function gavetaHtml(o: { aberta?: boolean; q?: string; escolhida?: string; noLista?: string[] } = {}): string {
  const q = (o.q ?? '').toLowerCase();
  const lista = q ? REFERENCIAS.filter((r) => `${r[1]} ${r[2]} ${r[3]} ${r[0]}`.toLowerCase().includes(q)) : REFERENCIAS;
  const esc = lista.find((r) => r[2] === o.escolhida) ?? lista[0];
  const conta = (ref: string) => (o.noLista ?? []).filter((x) => x === ref).length;
  const usadas = maisUsadas();
  return `<div class="lst__gaveta" data-gaveta role="dialog" aria-modal="true" aria-labelledby="lst-g-t"${o.aberta ? '' : ' hidden'}>
    <div class="lst__veu" data-fechar-gaveta></div>
    <section class="lst__gaveta-caixa">
      <header class="lst__gaveta-cabeca"><h2 id="lst-g-t">${L(pkg)}Adicionar peças</h2>${botao('btn--ghost btn--sm', x, 'Fechar', ' data-fechar-gaveta aria-keyshortcuts="Escape"')}</header>
      <label class="lst__procura-campo"><span class="sr-only">Procurar no catálogo</span>${L(search)}<input data-procura role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="lst-resultados" aria-activedescendant="${esc ? `lst-op-${lista.indexOf(esc)}` : ''}" placeholder="Referência, marca ou descrição" value="${o.q ?? ''}" autocomplete="off" spellcheck="false"></label>
      <div class="lst__usadas"${q ? ' hidden' : ''}><span>Mais usadas nas tuas listas</span>${usadas.map((r) => `<button type="button" class="lst__chip" data-escolher="${r[2]}">${r[1]} ${r[2]}</button>`).join('')}</div>
      <p class="lst__g-conta" role="status">${lista.length ? `${plural(lista.length, 'referência', 'referências')} do catálogo${q ? ` com «${o.q}»` : ''}` : ''}</p>
      <ul class="lst__resultados" id="lst-resultados" role="listbox" aria-label="Referências">${lista.map((r, i) => resultadoHtml(r, i, conta(r[2]), r === esc)).join('')}</ul>
      ${lista.length ? '' : `<div class="lst__g-vazio" role="status">${rolamentoSvg('lst-g-404', '404', 'lst__rs-faixa')}<p><b>Nada no catálogo com «${o.q}».</b> Confirma a referência (sem espaços também serve) ou procura pelo veículo no Catálogo.</p><div>${botao('btn--ghost btn--sm', eraser, 'Limpar a procura', ' data-limpar-procura')}${botao('btn--ghost btn--sm', search, 'Ir ao Catálogo', ' data-ir="catalogo"')}</div></div>`}
      <footer class="lst__g-pe" data-g-pe${esc ? '' : ' hidden'}>
        ${esc ? `<span class="lst__g-escolha">${azulejoPeca(esc[3], 'lst__img', esc[2])}<span><b>${esc[1]} ${esc[2]}</b><small>${esc[3]} · Porto ${esc[6]} · Sacavém ${esc[7]}</small></span></span>
        ${passos('lst__q lst__g-q', 1, `Quantidade de ${esc[1]} ${esc[2]}`)}
        ${botao('btn--acao lst__g-add', plus, 'Adicionar à lista', ' data-adicionar-escolhida aria-keyshortcuts="Enter"')}` : ''}
        <p class="lst__teclas" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> escolher · <kbd>Enter</kbd> adicionar · <kbd>Esc</kbd> fechar</p>
      </footer>
    </section>
  </div>`;
}

/* ---------- a pré-visualização do orçamento ---------- */
export function previaHtml(l: Lista, aberta = false): string {
  const c = contas(l);
  const tab = (cab: string[], linhas: string[][]) => `<table class="lst__doc-t"><thead><tr>${cab.map((h, i) => `<th${i >= cab.length - 3 ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${linhas.map((r) => `<tr>${r.map((v, i) => `<td${i >= r.length - 3 ? ' class="n"' : ''}>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const pecas = l.pecas.length ? `<h3>Peças</h3>${tab(['Referência', 'Descrição', 'Qtd.', 'PVP un.', 'Desc.', 'Total'], l.pecas.map((p) => [`${p.marca} ${p.ref}`, p.desc, num(p.qtd), p.pvp === null ? 'Preço indisponível' : euros(p.pvp), p.pvp === null ? '—' : `${num(p.d)} %`, p.pvp === null ? '—' : euros(totalPeca(p)!)]))}` : '';
  const mao = l.mao.length ? `<h3>Mão-de-obra</h3>${tab(['Serviço', '', 'Horas', 'Preço', 'Desc.', 'Total'], l.mao.map((m) => [m.desc || '—', m.modo === 'fixo' ? 'Preço fixo' : 'Por hora', m.modo === 'fixo' ? '—' : num(m.horas), m.modo === 'fixo' ? euros(m.preco) : `${euros(m.preco)}/h`, `${num(m.d)} %`, euros(totalMao(m))]))}` : '';
  const outros = l.custos.length ? `<h3>Outros custos</h3>${tab(['Descrição', 'Valor', '', 'Total'], l.custos.map((x) => [x.desc, euros(x.valor), '', euros(x.valor)]))}` : '';
  return `<div class="lst__previa" data-previa-janela role="dialog" aria-modal="true" aria-labelledby="lst-p-t"${aberta ? '' : ' hidden'}>
    <div class="lst__veu" data-fechar-previa></div>
    <div class="lst__previa-caixa">
      <header class="lst__previa-barra"><h2 id="lst-p-t">${L(fileText)}Pré-visualização <small>rascunho — não é um orçamento emitido</small></h2><span>${botao('btn--ghost btn--sm', printer, 'Imprimir', ' data-imprimir')}${botao('btn--ghost btn--sm', arrowLeft, 'Voltar à edição', ' data-fechar-previa')}</span></header>
      <article class="lst__doc">
        <header class="lst__doc-topo"><span><span class="romafe">ROMAFE</span><small>Peça A Peça · Orçamento</small></span><span><b>${l.nome}</b>${l.id ? `Lista ${l.id}` : 'Lista por guardar'}<br>${l.atualizada.startsWith('hoje') || l.atualizada.startsWith('ainda') ? '16/10/2026' : l.atualizada}</span></header>
        <p class="lst__doc-marca">RASCUNHO · sem validade comercial até ser emitido pelo Peça A Peça</p>
        ${pecas}${mao}${outros}
        <table class="lst__doc-totais"><tbody>
          <tr><td>Peças (PVP)</td><td>${euros(c.pecas)}</td></tr><tr><td>Mão-de-obra</td><td>${euros(c.mao)}</td></tr>${c.outros ? `<tr><td>Outros custos</td><td>${euros(c.outros)}</td></tr>` : ''}<tr><td>Descontos</td><td>${euros(-c.descontos)}</td></tr>
          <tr class="b"><td>Base tributável (sem IVA)</td><td>${euros(c.base)}</td></tr><tr><td>IVA 23 % sobre ${euros(c.base)}</td><td>${euros(c.iva)}</td></tr>
          <tr class="t"><td>Total com IVA${c.semPreco.length ? ' (parcial)' : ''}</td><td>${euros(c.total)}</td></tr>
        </tbody></table>
        ${c.semPreco.length ? `<p class="lst__doc-nota">Sem o preço de ${c.semPreco.map((p) => p.ref).join(', ')}, que o Peça A Peça ainda não devolveu.</p>` : ''}
        ${l.notas ? `<h3>Notas</h3><p class="lst__doc-notas">${l.notas}</p>` : ''}
      </article>
    </div>
  </div>`;
}

/* ---------- o ecrã ---------- */
const dialogo = (tipo: string, aberto: boolean, html: string) => `<div class="lst__dialogo" data-dialogo="${tipo}" role="${tipo === 'eliminar' || tipo === 'limpar' || tipo === 'sair' ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-labelledby="lst-d-${tipo}"${aberto ? '' : ' hidden'}><div class="lst__dialogo-caixa">${html.replace('<h2>', `<h2 id="lst-d-${tipo}">`)}</div></div>`;
export function dialogosHtml(l: Lista, e: EstadoLista = ''): string {
  const c = contas(l);
  return `${dialogo('eliminar', e === 'eliminar', `<span class="lst__dialogo-ic lst__dialogo-ic--erro">${L(trash)}</span><h2>Eliminar a lista «${l.nome}»?</h2><p>Saem ${plural(c.nPecas, 'peça', 'peças')}, ${plural(c.nMao, 'serviço', 'serviços')} e ${plural(c.nCustos, 'outro custo', 'outros custos')}, e a lista deixa de aparecer em «Minhas listas». As encomendas já feitas a partir dela não mudam. <b>Não se pode desfazer.</b></p><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Cancelar', ' data-fechar')}${botao('lst__perigo', trash, 'Eliminar a lista', ' data-confirmar-eliminar')}</div>`)}
  ${dialogo('limpar', false, `<span class="lst__dialogo-ic lst__dialogo-ic--erro">${L(eraser)}</span><h2>Limpar a lista?</h2><p>Tira todas as peças, serviços e outros custos de «${l.nome}». O nome e as notas ficam. Até guardares, podes desfazer.</p><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Cancelar', ' data-fechar')}${botao('lst__perigo', eraser, 'Limpar a lista', ' data-confirmar-limpar')}</div>`)}
  ${dialogo('enviar', false, `<span class="lst__dialogo-ic">${L(send)}</span><h2>Enviar a lista</h2><p>Segue por correio eletrónico, com os preços do cliente (PVP) e o IVA, como na pré-visualização.</p><label class="lst__campo-d"><span>Para</span><span class="lst__caixa-d">${L(mail)}<input type="email" data-destino value="oficina@exemplo.pt" autocomplete="email"></span></label><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Cancelar', ' data-fechar')}${botao('btn--acao', send, 'Enviar', ' data-confirmar-enviar')}</div>`)}
  ${dialogo('sair', false, `<span class="lst__dialogo-ic">${L(alert)}</span><h2>Tens alterações por guardar</h2><p>Se saíres agora, as alterações a «${l.nome}» perdem-se.</p><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Ficar', ' data-fechar')}${botao('btn--ghost', rotate, 'Sair sem guardar', ' data-sair')}${botao('btn--acao', save, 'Guardar e sair', ' data-guardar-sair')}</div>`)}
  ${dialogo('sessao', e === 'sessao', `<span class="lst__dialogo-ic">${L(lock)}</span><h2>A sessão terminou</h2><p>Por segurança, a sessão fechou-se ao fim de 30 minutos sem atividade. A lista continua neste ecrã, com as alterações por guardar; entra outra vez e depois guarda.</p><div class="lst__dialogo-accoes">${botao('btn--acao', logIn, 'Iniciar sessão', ' data-ir="entrada"')}</div>`)}`;
}

/** O ecrã num estado (15.x), ou — com `propria` — uma lista qualquer, para o comportamento a mostrar ao vivo. */
export function listaHtml(e: EstadoLista = '', propria?: Lista): string {
  if (e === 'listas') return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--lista"><main class="lst" data-vista="listas">${listasHtml()}<div class="lst__avisos" data-avisos data-por-cima aria-live="polite"></div></main></div>`;
  const l = propria ?? (e === 'a-carregar' ? { ...structuredClone(LISTAS[1]), pecas: [], mao: [] } : listaDoEstado(e));
  const so = e === 'leitura' || e === 'sem-permissao' || l.estado === 'enviada';
  const sujo = ['nova', 'sujo', 'qtd-invalida', 'desc-invalido', 'remover', 'remover-ultima', 'adicionar', 'falhou-guardar', 'offline', 'duplicar', 'servico', 'sessao'].includes(e) || (!e && (propria ? propria.estado === 'nova' : l.estado === 'rascunho'));
  const grav = e === 'a-guardar' ? gravacao('a-guardar') : e === 'guardada' ? gravacao('guardada') : e === 'falhou-guardar' ? gravacao('erro') : sujo && !so ? gravacao('sujo') : gravacao('');
  const estado: EstadoDaLista = e === 'guardada' ? 'guardada' : l.estado;
  const aGuardar = e === 'a-guardar';
  const invalido = e === 'qtd-invalida' || e === 'desc-invalido';
  const guardar = aGuardar ? `<button type="button" class="btn btn--acao lst__guardar" aria-busy="true" disabled>${rolamentoSvg('lst-g', 'pesquisar', 'lst__rs')}<span class="btn__rotulo">A guardar…</span></button>`
    : botao(`btn--acao lst__guardar${sujo ? ' is-sujo' : ''}`, e === 'guardada' ? check : save, e === 'guardada' ? 'Guardada' : 'Guardar lista', ` data-guardar${so || invalido || e === 'offline' || e === 'a-carregar' ? ' disabled' : ''}${invalido ? ' aria-describedby="lst-porque"' : ''}`);
  const mais = so && e !== 'leitura' && e !== 'sem-permissao' ? '' : `<div class="lst__mais">
      ${botao('btn--ghost lst__mais-b', ellipsis, 'Mais ações', ' data-mais aria-haspopup="menu" aria-expanded="false" aria-controls="lst-menu"')}
      <ul class="lst__menu" id="lst-menu" role="menu" hidden>
        <li role="none"><button type="button" role="menuitem" data-nova-lista>${L(filePlus)}Nova lista</button></li>
        <li role="none"><button type="button" role="menuitem" data-duplicar-lista="${l.id}">${L(copy)}Duplicar lista</button></li>
        ${so ? '' : `<li role="none"><button type="button" role="menuitem" data-carrinho>${L(cart)}Pôr as peças no carrinho</button></li>
        <li role="separator"></li>
        <li role="none"><button type="button" role="menuitem" data-limpar>${L(eraser)}Limpar lista…</button></li>
        <li role="none"><button type="button" role="menuitem" class="lst__menu-perigo" data-eliminar${l.id ? '' : ' disabled'}>${L(trash)}Eliminar lista…</button></li>`}
      </ul></div>`;
  const faixa = (tipo: string, icone: string, titulo: string, texto: string, acao = '') => `<div class="lst__faixa lst__faixa--${tipo}" role="${tipo === 'erro' ? 'alert' : 'status'}">${icone}<div><b>${titulo}</b><span>${texto}</span></div>${acao}</div>`;
  const tentar = botao('btn--claro btn--sm', rotate, 'Tentar novamente', ' data-guardar');
  const faixas = ({
    'falhou-guardar': faixa('erro', rolamentoSvg('lst-fg', 'erro', 'lst__rs-faixa'), 'A lista não foi guardada.', 'O servidor não respondeu (LST-503-1016). As alterações continuam aqui; nada se perdeu.', tentar),
    'falhou-enviar': faixa('erro', rolamentoSvg('lst-fe', 'erro', 'lst__rs-faixa'), 'A lista não foi enviada.', 'O endereço oficina@exemplo.pt não foi aceite pelo servidor de correio. Confirma-o e tenta outra vez; a lista ficou guardada.', botao('btn--claro btn--sm', send, 'Enviar outra vez', ' data-enviar')),
    enviada: faixa('ok', `<span class="lst__faixa-ic">${L(check)}</span>`, 'Lista enviada para oficina@exemplo.pt.', 'O servidor confirmou o envio. Uma lista enviada já não se altera; para mudar alguma coisa, duplica-a.', botao('btn--claro btn--sm', copy, 'Duplicar lista', ` data-duplicar-lista="${l.id}"`)),
    offline: faixa('aviso', rolamentoSvg('lst-off', 'offline', 'lst__rs-faixa'), 'Estás sem ligação à Internet.', 'Podes continuar a editar; «Guardar lista» e «Enviar» voltam quando a ligação voltar. Os preços são os de há pouco.', botao('btn--claro btn--sm', rotate, 'Tentar novamente', ' data-religar')),
    leitura: faixa('info', `<span class="lst__faixa-ic">${L(lock)}</span>`, 'Esta lista foi enviada e é só de leitura.', 'Foi enviada a 10/10/2026. Para fazer outra a partir dela, duplica-a.', botao('btn--claro btn--sm', copy, 'Duplicar lista', ` data-duplicar-lista="${l.id}"`)),
    'sem-permissao': faixa('erro', `<span class="lst__faixa-ic">${L(lock)}</span>`, 'Não tens permissão para alterar esta lista.', 'Foi criada por outro utilizador da empresa. Podes vê-la e duplicá-la.', botao('btn--claro btn--sm', copy, 'Duplicar lista', ` data-duplicar-lista="${l.id}"`)),
    duplicar: faixa('ok', `<span class="lst__faixa-ic">${L(copy)}</span>`, 'Criaste uma cópia de «Reparação Peugeot 308».', 'Estás a editar a cópia: as peças, os serviços e as notas são os mesmos, e a original não muda. Guarda-a para ficar em «Minhas listas».', botao('btn--claro btn--sm', arrowLeft, 'Voltar à original', ` data-abrir-lista="${LISTAS[0].id}"`)),
    'sem-preco': faixa('aviso', `<span class="lst__faixa-ic">${L(alert)}</span>`, 'O Peça A Peça não devolveu os preços.', 'As peças e as quantidades estão certas; os preços e o total aparecem quando o serviço de preços responder. Nada aparece a 0,00 €.', botao('btn--claro btn--sm', rotate, 'Pedir os preços outra vez', ' data-religar')),
    'remover-ultima': faixa('info', `<span class="lst__faixa-ic">${L(packageX)}</span>`, 'Retiraste a última peça.', 'A lista fica com zero peças; os serviços e as notas ficam. Podes desfazer até guardar.', botao('btn--claro btn--sm', undo, 'Desfazer', ' data-desfazer')),
  } as Record<string, string>)[e] ?? '';
  const porque = invalido ? `<p class="lst__porque" id="lst-porque">${L(alert)}Há 1 campo por corrigir; a lista guarda-se depois de o corrigires.</p>` : '';
  const listaVista: Lista = e === 'remover-ultima' ? { ...l, pecas: [] } : l;
  /* 15.x «a remover»: a linha já a sair; o aviso «Desfazer» em baixo */
  const aviso = e === 'remover' ? `<div class="lst__aviso" role="status">${L(trash)}<span>Retiraste <b>SKF VKMV 6PK1873</b> da lista.</span><button type="button" class="lst__aviso-b" data-desfazer>${L(undo)}Desfazer</button></div>`
    : e === 'adicionar' ? `<div class="lst__aviso lst__aviso--ok" role="status">${L(check)}<span><b>SKF VKBA 6556</b> adicionada · 2 unidades.</span><button type="button" class="lst__aviso-b" data-desfazer>${L(undo)}Desfazer</button></div>`
    : e === 'guardada' ? `<div class="lst__aviso lst__aviso--ok" role="status">${L(check)}<span>O servidor confirmou: «${l.nome}» guardada.</span></div>` : '';
  let corpo = editorHtml(listaVista, e);
  if (e === 'remover') corpo = corpo.replace('data-ref="VKMV 6PK1873"', 'data-ref="VKMV 6PK1873" data-a-sair');
  if (e === 'adicionar') corpo = corpo.replace(/(<li class="lst__linha lst__linha--peca[^"]*") data-tipo="peca" data-flip data-ref="VKBA 6556"/, '$1 data-tipo="peca" data-flip data-ref="VKBA 6556" data-acabada');
  const naLista = l.pecas.map((p) => p.ref);
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--lista">
  <main class="lst${so ? ' is-leitura' : ''}" data-vista="editar" data-estado="${e}" data-lista="${l.id}"${sujo && !so ? ' data-sujo="1"' : ''}>
    <header class="lst__topo">
      <nav class="lst__migalhas" aria-label="Onde estás"><button type="button" data-ver-listas>${L(arrowLeft)}Minhas listas</button><span aria-hidden="true">/</span><span aria-current="page" tabindex="-1">${l.id ? 'Editar lista' : 'Nova lista'}</span></nav>
      <div class="lst__cab">
        ${l.carro ? `<span class="lst__carro" aria-hidden="true">${silhueta(l.carro)}</span>` : ''}
        <div class="lst__id">
          <p class="lst__sobre">Minha lista <span>· Organiza peças, serviços e prepara os teus orçamentos.</span></p>
          <label class="lst__nome"><span class="sr-only">Nome da lista</span><input data-nome value="${l.nome}"${so ? ' readonly' : ''} placeholder="Ex.: Revisão BMW Série 3" ${e === 'nova' ? 'autofocus ' : ''}spellcheck="false">${so ? '' : L(pencil, 'lst__lapis')}</label>
          <p class="lst__meta"><span class="lst__estado lst__estado--${estado}" data-estado-lista>${ESTADO_NOME[estado]}</span>${grav}<span class="lst__quando">${L(clock)}${l.id ? `Atualizada ${l.atualizada}` : 'Ainda não guardada'}</span>${l.id ? `<span class="lst__numero">${l.id}</span>` : ''}</p>
        </div>
        <div class="lst__accoes">${guardar}${mais}</div>
      </div>
      ${porque}
    </header>
    ${faixas}
    ${corpo}
    <div class="lst__avisos" data-avisos data-por-cima aria-live="polite">${aviso}</div>
  </main>
  ${so ? '' : gavetaHtml({ aberta: e === 'adicionar' || e === 'sem-resultados', q: e === 'sem-resultados' ? 'XQ-99812' : e === 'adicionar' ? 'vkba' : '', escolhida: e === 'adicionar' ? 'VKBA 6556' : undefined, noLista: naLista })}
  ${previaHtml(l, e === 'previsualizar')}
  ${dialogosHtml(l, e)}
</div>`;
}
