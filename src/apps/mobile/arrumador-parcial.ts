/* =========================================================
   PICK — a arrumação parcial: 30 unidades em três posições (30 out. 2026)
   Ela: «sim faz isso» — o cenário das 30 unidades, dentro do 07 · O menu da app. Uma palete da GA-2026-0332 com 30 ×
   SKF 6205-2Z: couberam 12 na proposta 1 e 10 na proposta 2 (o 12 · «não cabe» → proposta seguinte); a proposta 3 está
   bloqueada e não há 4.ª, por isso a Inês chama o gestor (70 → 71) sem largar a tarefa; a Ana vê as duas partes já
   confirmadas e manda as 8 que faltam para outra posição; a Inês acaba-as. Cada parte fica registada uma vez, quando é
   confirmada; nada se repete.
   A única peça que não está nos documentos é a pergunta «Quantas ficaram aqui?» depois de ler a posição — fica por
   decidir no 07.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, aviso, posicao, prog, quantidade, L, leitor, type Opcoes } from './inventario-v2';
import { GUIAS, cenaArrumacao } from './arrumacao';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import phone from 'lucide-static/icons/bell-ring.svg?raw';
import msg from 'lucide-static/icons/message-square.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import mapPinX from 'lucide-static/icons/map-pin-x.svg?raw';

/* ---------- os dados: a GA-2026-0332, uma palete de 30 × SKF 6205-2Z, no cais 1 ---------- */
const INES = { nome: 'Inês Rocha', iniciais: 'IR' };
const G = GUIAS[5], A = G.linhas[0], TOTAL = A.q;
/* as três propostas do motor e a que a Ana indicou; quanto ficou em cada uma e a que horas */
const P: [string, string][] = [[G.destino, 'Os rolamentos 6205 estão na zona 10, e a coluna 03 fica a 4 m do cais 1.'], ['60100306', 'A seguinte na mesma coluna: o mesmo artigo fica junto.'], ['60100401', 'A primeira livre da coluna 04, ainda na zona 10.']];
const NOVA = '60100402';
const PARTES: [string, number, string][] = [[P[0][0], 12, '10h40'], [P[1][0], 10, '10h44'], [NOVA, 8, '10h53']];
const T = (titulo: string, extra: Opcoes = {}): Opcoes => ({ titulo, funcao: 'Arrumação', quem: INES, ...extra });
const GG = (titulo: string, voltar = 'arr-excecoes'): Opcoes => ({ titulo, voltar, gestor: true, funcao: 'Gestor' });

/* ---------- peças ---------- */
const feitas = (n: number) => PARTES.slice(0, n).reduce((s, p) => s + p[1], 0);
/** O que já ficou arrumado (n partes) e o que falta; `para` diz onde vai o que falta, se já se sabe */
const partes = (n: number, para = '') => `<ul class="gi-secoes" role="list" aria-label="Onde ficou">${PARTES.slice(0, n).map(([pos, q, h]) => `<li class="gi-secao is-feita"><span><b>${pos}</b><small>${q} un. · às ${h}</small></span><span class="gp-tag gp-tag--ok">${L(check)}Arrumadas</span></li>`).join('')}
    ${n < PARTES.length ? `<li class="gi-secao is-atual"><span><b>${TOTAL - feitas(n)} un.</b><small>${para ? `vão para a ${para}` : 'na palete'}</small></span><span class="gp-tag gp-tag--planeada">Por arrumar</span></li>` : ''}</ul>`;
const faixa = (n: number) => `<div class="ta-topo"><p><b>${G.ref}</b><small>${TOTAL} un. · ${feitas(n)} arrumadas</small></p><button type="button" class="ta-chamar" data-ir="ta-chamar">${L(phone)}<span>Chamar</span></button></div>`;
const PASSOS = ['Artigo', 'Proposta', 'Posição', 'Quantas'];
const passos = (n: number) => `<ol class="gi-passos" aria-label="Passos da palete">${PASSOS.map((t, i) => `<li class="${i < n - 1 ? 'is-feito' : i === n - 1 ? 'is-atual' : ''}"${i === n - 1 ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${t}</span></li>`).join('')}</ol>`;
const esperado = `<section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${A.ref}</p><p class="gi-artigo__desc">${A.desc}</p><p class="gi-artigo__meta">${TOTAL} un. · do ${G.origem.toLowerCase()}</p></div></section>`;
const proposta = (pos: string, cab: string, pq: string) => `<section class="ta-proposta"><p class="ta-proposta__n">${cab}</p>${posicao(pos)}<p class="ta-proposta__pq"><b>Porquê aqui</b>${pq}</p></section>`;

/* =========================================================
   102 · A palete, parte a parte (a Inês)
   ========================================================= */
type Passo = 'artigo' | 'p1' | 'ler-1' | 'qtd-1' | 'p2' | 'ler-2' | 'qtd-2' | 'p3' | 'ler-3' | 'bloqueada' | 'chamado' | 'resposta' | 'p4' | 'ler-4' | 'qtd-4' | 'fim';
function passo(p: Passo): string {
  const ler = (i: number, pos: string, ir: string): [number, number, string, string] => [i, 3, `<h1 class="ta-passo-t">Leia a posição</h1><p class="gp-nota">A etiqueta na prateleira onde pousou as caixas.</p><div class="ta-alvo"><small>Deve ser</small>${posicao(pos)}</div>${leitor({ titulo: 'Aponte e carregue no gatilho', texto: 'O sistema confirma de novo, ao ler, que a posição ainda serve', ir, tipo: 'arrumar' })}`, ''];
  const qtd = (i: number, pos: string, q: number, ir: string): [number, number, string, string] => [i, 4, `<div class="ta-alvo"><small>Lida</small>${posicao(pos, 'gi-pos--peq')}</div>${quantidade(String(q), { teclado: false, rotulo: `Quantas ficaram aqui? De ${TOTAL - feitas(i)}` })}`, acao(`Confirmar ${q}`, check, ` data-confirmar data-ir="${ir}"`)];
  const C: Record<Passo, () => [number, number, string, string]> = {
    artigo: () => [0, 1, `<h1 class="ta-passo-t">Leia o artigo</h1><p class="gp-nota">A etiqueta da palete que tem à frente.</p>${esperado}${leitor({ titulo: 'Aponte e carregue no gatilho', texto: 'Esperado: ' + A.ref, ir: 'arr-par-1', tipo: 'arrumar' })}`, ''],
    p1: () => [0, 2, proposta(P[0][0], 'Vai a · proposta 1 de 3', P[0][1]), acao('Ler a posição', scanBarcode, ' data-ir="arr-par-ler-1"')],
    'ler-1': () => ler(0, P[0][0], 'arr-par-qtd-1'),
    'qtd-1': () => qtd(0, P[0][0], 12, 'arr-par-2'),
    p2: () => [1, 2, `${partes(1)}${proposta(P[1][0], 'O resto vai a · proposta 2 de 3', P[1][1])}`, acao('Ler a posição', scanBarcode, ' data-ir="arr-par-ler-2"')],
    'ler-2': () => ler(1, P[1][0], 'arr-par-qtd-2'),
    'qtd-2': () => qtd(1, P[1][0], 10, 'arr-par-3'),
    p3: () => [2, 2, `${partes(2)}${proposta(P[2][0], 'O resto vai a · proposta 3 de 3', P[2][1])}`, acao('Ler a posição', scanBarcode, ' data-ir="arr-par-ler-3"')],
    'ler-3': () => ler(2, P[2][0], 'arr-par-bloqueada'),
    bloqueada: () => [2, 2, `${aviso('erro', ban, `A ${P[2][0]} está bloqueada`, 'Ao ler, o sistema diz que não serve. Era a 3.ª proposta: o PDA não tem outra para dar. Chame o gestor — a tarefa fica consigo.')}${partes(2)}`, acao('Chamar o gestor', phone, ' data-confirmar data-ir="arr-par-chamado"')],
    chamado: () => [2, 0, `<section class="ta-bloq ta-bloq--chamada" role="status">${L(phone, 'ta-bloq__ic')}<h1>O gestor foi chamado</h1><p>Ana Ferreira · avisada às 10h47</p></section>
      <dl class="ta-resumo"><div><dt>Motivo</dt><dd>${P[2][0]} bloqueada · sem 4.ª proposta</dd></div><div><dt>Já arrumadas</dt><dd>${feitas(2)} un. em 2 posições · ficam feitas</dd></div><div><dt>Consigo</dt><dd>${TOTAL - feitas(2)} un. na palete</dd></div></dl>`, acao('Ver o pedido', msg, ' data-ir="arr-par-resposta"')],
    resposta: () => [2, 0, `<section class="gi-aviso gi-aviso--info ta-resposta" role="status"><span class="gi-aviso__ic">${L(msg)}</span><h1>A Ana Ferreira respondeu</h1><p>Às 10h50, três minutos depois de a chamar.</p></section>
      <blockquote class="ta-diz"><small>O que ela diz</small><p>A ${P[2][0]} tem uma palete à espera de ser contada. Leve as ${TOTAL - feitas(2)} para a ${NOVA}.</p></blockquote>${partes(2, NOVA)}`, acao('Continuar a tarefa', play, ' data-ir="arr-par-4"')],
    p4: () => [2, 2, `${partes(2)}${proposta(NOVA, 'O resto vai a · indicada pela Ana Ferreira', 'A Ana mudou o destino às 10h50: a 60100401 está bloqueada.')}`, acao('Ler a posição', scanBarcode, ' data-ir="arr-par-ler-4"')],
    'ler-4': () => ler(2, NOVA, 'arr-par-qtd-4'),
    'qtd-4': () => qtd(2, NOVA, 8, 'arr-par-fim'),
    fim: () => [3, 0, `<section class="gi-movido" role="status">${cenaArrumacao()}<h1>Palete arrumada</h1><p>${TOTAL} × ${A.ref} em 3 posições · registado com o seu nome.</p></section>${partes(3)}
      <p class="gp-nota">Era a única palete: a guia fechou, e o motor dá-lhe a seguinte.</p>`, acao('Próxima tarefa', arrowRight, ' data-ir="ta-inicio"')],
  };
  const [n, k, corpo, pe] = C[p]();
  return ecra(`${k ? `${faixa(n)}${passos(k)}` : ''}${corpo}`, T(p === 'chamado' || p === 'resposta' ? 'Chamada' : 'Arrumar', { voltar: 'ta-inicio', ...(pe ? { pe } : {}) }));
}

/* =========================================================
   Gestor · a chamada com as partes já arrumadas (79.4, 79.5) e o acompanhamento (72.1 v2)
   ========================================================= */
function gestor(e: 'ver' | 'respondido'): string {
  if (e === 'respondido') return ecra(`<section class="gi-movido" role="status">${L(msg, 'ta-ok__ic')}<h1>Resposta enviada à Inês</h1><p>As ${TOTAL - feitas(2)} un. que faltam vão para a ${NOVA}. As ${feitas(2)} já arrumadas não mudam.</p></section>`,
    { ...GG('Chamada'), pe: `${acao('Ver no PDA da Inês', play, ' data-ir="arr-par-resposta"')}${sec('Voltar às exceções', arrowLeft, ' data-ir="arr-excecoes"')}` });
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">A Inês chamou</h1><span class="gp-tag gp-tag--validar">10h47</span></div>
    <dl class="ta-resumo"><div><dt>Motivo</dt><dd>${P[2][0]} bloqueada · era a 3.ª proposta</dd></div><div><dt>Tem em mãos</dt><dd>${G.ref} · ${A.ref}</dd></div></dl>
    ${prog(feitas(2), TOTAL, 'Unidades arrumadas')}${partes(2)}
    <label class="gp-campo"><span>Para onde vão as ${TOTAL - feitas(2)}</span><input inputmode="numeric" maxlength="8" value="${NOVA}" autocomplete="off"></label>
    <label class="gp-campo"><span>Responder daí</span><input value="A ${P[2][0]} tem uma palete à espera de ser contada. Leve as ${TOTAL - feitas(2)} para a ${NOVA}."></label>`,
  { ...GG('Chamada'), pe: `${acao('Enviar a resposta', msg, ' data-confirmar data-ir="arr-par-g-respondido"')}${sec('Vou aí', arrowRight, ' data-ir="arr-par-g-respondido"')}` });
}
function acompanhar(): string {
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${G.ref}</h1><span class="gp-tag gp-tag--curso">Em curso</span></div>
    <p class="gp-nota">Da ${G.ch} · ${G.origem} · Inês Rocha desde as 10h36</p>
    ${prog(feitas(2), TOTAL, `Unidades de ${A.ref}`)}${partes(2)}
    ${aviso('aviso', ban, `${P[2][0]} bloqueada`, 'Era a 3.ª proposta. A Inês chamou às 10h47 e ficou com a palete.')}`,
  { ...GG('Acompanhar', 'arr-inicio'), pe: `${acao('Responder à chamada', msg, ' data-ir="arr-par-g"')}${sec('Voltar à Arrumação', arrowLeft, ' data-ir="arr-inicio"')}` });
}
function excecoes(): string {
  const xs: [string, string, string, string, string][] = [
    [phone, 'Chamada · a Inês', `${G.ref} · ${P[2][0]} bloqueada · ${TOTAL - feitas(2)} un. por arrumar`, 'Responder', 'arr-par-g'],
    [phone, 'Chamada · a Inês', `GA-2026-0330 · zona 12 · às 10h26`, 'Responder', 'arr-problema-chamada'],
    [pkgX, 'Artigo danificado', 'GA-2026-0330 · palete 2 · CR 35x52x7', 'Decidir', 'arr-problema'],
    [mapPinX, 'Posição ocupada', '60120401 · registada pela Inês · o sistema julgava-a livre', 'Ver a posição', 'g-posicao'],
  ];
  return ecra(`<h1 class="gp-titulo">Exceções</h1>
    <ul class="gp-lista" role="list">${xs.map(([ic, t, x, b, ir], i) => `<li style="--i:${i}"><div class="gi-exc"><span class="gi-exc__ic">${L(ic)}</span><div><b>${t}</b><small>${x}</small></div><button type="button" class="gp-btn gp-btn--acao" data-ir="${ir}">${L(arrowRight)}<span>${b}</span></button></div></li>`).join('')}</ul>`,
  { titulo: 'Exceções', voltar: 'arr-inicio', gestor: true, funcao: 'Gestor' });
}

/* =========================================================
   Os ecrãs
   ========================================================= */
const NOTA = 'A arrumação parcial (30 out., ela: «sim faz isso»): 30 un. em três posições — 12 e 10 nas propostas 1 e 2, a 3 bloqueada, o gestor manda as 8 para outra, a Inês acaba. «Quantas ficaram aqui?» não está no 07: por decidir.';
export function ecrasArrumacaoParcial(): Ecra<string>[] {
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<string> => ({ id, nome, fluxo: 'Arrumação', objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  return [
    e('arr-par', '102 · Arrumação parcial · lê o artigo', 'Uma palete de 30 × SKF 6205-2Z que não cabe toda numa posição: lê-se o artigo.', passo('artigo')),
    e('arr-par-1', '102.1 · Proposta 1 de 3', 'Para onde levar a palete, e porquê.', passo('p1'), 'arr-par'),
    e('arr-par-ler-1', '102.2 · Lê a posição 1', 'Confirmar pela leitura a posição onde pousou as caixas.', passo('ler-1'), 'arr-par'),
    e('arr-par-qtd-1', '102.3 · Quantas ficaram (12 de 30)', 'Só cabem 12: confirma-se o que ficou; o resto continua na palete.', passo('qtd-1'), 'arr-par'),
    e('arr-par-2', '102.4 · Proposta 2 de 3', 'As 12 ficaram arrumadas; as 18 que faltam vão à proposta seguinte.', passo('p2'), 'arr-par'),
    e('arr-par-ler-2', '102.5 · Lê a posição 2', 'A mesma leitura, na proposta 2.', passo('ler-2'), 'arr-par'),
    e('arr-par-qtd-2', '102.6 · Quantas ficaram (10 de 18)', 'Cabem 10; faltam 8.', passo('qtd-2'), 'arr-par'),
    e('arr-par-3', '102.7 · Proposta 3 de 3', '22 arrumadas em duas posições; as 8 vão à última proposta.', passo('p3'), 'arr-par'),
    e('arr-par-ler-3', '102.7.1 · Lê a posição 3', 'Ao ler, o sistema confirma se a posição ainda serve.', passo('ler-3'), 'arr-par'),
    e('arr-par-bloqueada', '102.8 · A proposta 3 está bloqueada', 'Não há 4.ª proposta: chama-se o gestor, sem largar a tarefa.', passo('bloqueada'), 'arr-par'),
    e('arr-par-chamado', '102.9 · O gestor foi chamado (71)', 'O motivo, o que já ficou feito e o que tem consigo.', passo('chamado'), 'arr-par'),
    e('arr-par-resposta', '102.10 · O gestor respondeu', 'A Ana manda as 8 para a 60100402; as 22 arrumadas não mudam.', passo('resposta'), 'arr-par'),
    e('arr-par-4', '102.11 · O destino que o gestor indicou', 'Vai-se à posição que a Ana indicou.', passo('p4'), 'arr-par'),
    e('arr-par-ler-4', '102.12 · Lê a posição', 'A mesma leitura, no destino novo.', passo('ler-4'), 'arr-par'),
    e('arr-par-qtd-4', '102.13 · Quantas ficaram (8 de 8)', 'As últimas 8.', passo('qtd-4'), 'arr-par'),
    e('arr-par-fim', '102.14 · Palete arrumada em 3 posições', 'As três partes, cada uma registada uma vez, com a hora; a guia fecha.', passo('fim'), 'arr-par'),
    e('arr-par-g', '79.4 · A Inês chamou · parcial', 'No Gestor: o motivo, as 22 já arrumadas e onde, e para onde vão as 8 que faltam.', gestor('ver')),
    e('arr-par-g-respondido', '79.5 · Resposta enviada', 'Chega ao PDA da Inês; o que já foi arrumado não muda.', gestor('respondido'), 'arr-par-g'),
  ];
}
/** Versões novas do 72.1 (o acompanhamento parcial) e do 73 (as exceções, com a chamada da arrumação parcial) */
export function comArrumacaoParcial<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, [string, () => string, string]> = {
    'arr-acompanhar-parcial': ['72.1 · Parcial', acompanhar, 'A GA-2026-0332 a meio: 22 de 30 arrumadas em duas posições, a 3.ª proposta bloqueada e a chamada da Inês.'],
    'arr-excecoes': ['73 · Exceções da arrumação', excecoes, 'As chamadas e os problemas registados da arrumação; a chamada da arrumação parcial em primeiro.'],
  };
  return ecras.map((x) => { const v = V[x.id]; return v ? { ...x, nome: v[0], objetivo: v[2], versoes: [...x.versoes, { id: `v${x.versoes.length + 1}`, nota: NOTA, html: v[1]() }] as Ecra<T>['versoes'] } : x; });
}
