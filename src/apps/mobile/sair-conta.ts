/* =========================================================
   2 nov. (ela: «sim», à recomendação de pôr as três funções a sair da mesma maneira): a Arrumação e a Expedição como
   a Separação v2 — «Pausar» na faixa da tarefa e «Terminar sessão» na conta (as iniciais); o separador «Sair» sai da
   barra (navegacao.ts). O «Sair com a guia a meio» passa a ser «Pausar»; terminar a sessão com a guia a meio diz o que
   fica feito, como antes.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, L, type Opcoes } from './inventario-v2';
import pause from 'lucide-static/icons/pause.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import user from 'lucide-static/icons/user.svg?raw';

interface Funcao {
  papel: string; p: string; quem: { nome: string; iniciais: string }; ref: string;
  /** onde a tarefa se retoma */ retomar: string; verbo: string;
  feito: string; falta: string; fica: [string, string][]; turno: string; pausa: string; num: [string, string];
}
const F: Funcao[] = [
  { papel: 'Arrumação', p: 'ta', quem: { nome: 'Inês Rocha', iniciais: 'IR' }, ref: 'GA-2026-0330', retomar: 'arr-op', verbo: 'arrumar',
    feito: 'palete 1 de 2 arrumada', falta: 'palete 2 de 2', fica: [['A palete já arrumada', 'fica feita'], ['A que falta', 'fica no cais 2, à sua espera'], ['Ao voltar', '«Continuar a arrumar» abre a palete 2']],
    turno: '8h às 16h30', pausa: 'Cada palete fica registada assim que é arrumada: nada se lê outra vez.', num: ['85.6', '103'] },
  { papel: 'Expedição', p: 'tx', quem: { nome: 'Paulo Reis', iniciais: 'PR' }, ref: 'GS13454209', retomar: 'tx-conferir-2', verbo: 'carregar',
    feito: '2 de 3 volumes conferidos', falta: 'volume 3 de 3', fica: [['Os volumes conferidos', 'ficam registados'], ['O que falta', 'o volume 3, na prateleira de preparados'], ['Ao voltar', '«Continuar a carregar» abre o volume 3']],
    turno: '8h às 16h30', pausa: 'Nenhum volume desce do camião, e o que foi lido não se lê outra vez. O camião espera no cais até a saída fechar.', num: ['130.4', '140'] },
];
const NOTA = '2 nov.: «Pausar» na faixa da tarefa e «Terminar sessão» na conta, como na Separação v2; o separador «Sair» saiu da barra.';
const O = (f: Funcao, titulo: string, extra: Opcoes = {}): Opcoes => ({ titulo, funcao: f.papel, quem: f.quem, ...extra });
const dl = (linhas: [string, string][]) => `<dl class="ta-resumo">${linhas.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;

function pausar(f: Funcao): string {
  return ecra(`<h1 class="gp-titulo">Pausar</h1><p class="gp-nota">${f.ref} · ${f.feito}</p>${dl(f.fica)}<p class="gp-nota">${f.pausa}</p>`,
    O(f, 'Pausar', { voltar: f.retomar, conta: `${f.p}-conta`, pe: `${acao('Pausar', pause, ` data-ir="${f.p}-inicio-curso"`)}${sec(`Continuar a ${f.verbo}`, play, ` data-ir="${f.retomar}"`)}` }));
}
function conta(f: Funcao, e: 'conta' | 'guia' | 'terminada'): string {
  if (e === 'terminada') return ecra(`<section class="gi-movido" role="status">${L(logOut, 'ta-ok__ic')}<h1>Sessão terminada</h1><p>${f.quem.nome} · 11h20</p></section>
    ${dl([['A guia', `${f.ref} · ${f.feito}`], ['Quem a apanhar', `continua na ${f.falta}`]])}`, O(f, 'Sessão', { pe: acao('Entrar', user, ' data-login') }));
  if (e === 'guia') return ecra(`<h1 class="gp-titulo">Tem a guia ${f.ref} a meio</h1><p class="gp-nota">${f.feito}; falta a ${f.falta}.</p>
    ${dl([...f.fica.slice(0, 2), ['Quem a apanhar', `continua na ${f.falta}, sem repetir leituras`]])}<p class="gp-nota">O gestor vê quem saiu com uma guia aberta.</p>`,
  O(f, 'Terminar sessão', { voltar: `${f.p}-conta`, pe: `${acao('Terminar sessão', logOut, ` data-ir="${f.p}-sessao-terminada"`)}${sec(`Continuar a ${f.verbo}`, play, ` data-ir="${f.retomar}"`)}` }));
  return ecra(`<section class="ts2-conta"><span class="gp-conta">${f.quem.iniciais}</span><p><b>${f.quem.nome}</b><small>${f.papel} · Armazém 60</small></p></section>
    ${dl([['Turno', f.turno], ['Em mãos', `${f.ref} · ${f.feito}`]])}`,
  O(f, 'Conta', { voltar: `${f.p}-inicio-curso`, pe: sec('Terminar sessão', logOut, ` data-ir="${f.p}-conta-guia"`) }));
}

/* o Início com a guia a meio: o mesmo cartão, «Continuar a …», e o toque abre o passo onde ficou */
const emCurso = (html: string, f: Funcao) => html
  .replace(/<button type="button" class="ta-trabalho" data-ir="[^"]+">/, `<button type="button" class="ta-trabalho" data-ir="${f.retomar}">`)
  .replace(/<b>Começar a [^<]+<\/b><small>([^<]*)<\/small><small>[^<]*<\/small>/, `<b>Continuar a ${f.verbo}</b><small>$1</small><small>A meio: ${f.feito} · retoma na ${f.falta}</small>`);
/* a faixa da tarefa ganha «Pausar» ao lado de «Chamar»; as iniciais abrem a conta */
const comPausarEConta = (html: string, p: string) => html
  .replace(/<div class="ta-topo">([\s\S]*?)<button type="button" class="ta-chamar" data-ir="(ta|tx)-chamar">([\s\S]*?)<\/button><\/div>/g,
    (_m, a, q, b) => `<div class="ta-topo ts2-topo">${a}<span class="ts2-topo__bt"><button type="button" class="ta-chamar" data-ir="${q}-sair">${L(pause)}<span>Pausar</span></button><button type="button" class="ta-chamar" data-ir="${q}-chamar">${b}</button></span></div>`)
  .replace(/<button type="button" class="gp-conta" aria-label="([^"]*)">/g, `<button type="button" class="gp-conta" aria-label="$1" data-ir="${p}-conta">`);

export function comSairNaConta<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const out = ecras.map((e) => {
    const f = F.find((x) => x.papel === e.papel);
    if (!f) return e;
    const ult = e.versoes.length - 1;
    const versoes = e.versoes.map((v, i) => i === ult ? { ...v, html: comPausarEConta(e.id === `${f.p}-sair` ? pausar(f) : v.html, f.p) } : v);
    return { ...e, ...(e.id === `${f.p}-sair` ? { nome: e.nome.replace(/·.*$/, '· Pausar'), objetivo: 'Na faixa da tarefa: o que fica feito e onde se retoma; «Pausar» volta ao Início com a guia a meio.' } : {}), versoes } as Ecra<T>;
  });
  const S = (f: Funcao, id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<T> =>
    ({ id: id as T, nome, fluxo: f.papel, papel: f.papel, objetivo, ...(de ? { estadoDe: de as T } : {}), versoes: [{ id: 'v1', nota: NOTA, html: comPausarEConta(html, f.p) }] });
  for (const f of F) {
    const inicio = out.find((e) => e.id === `${f.p}-inicio`);
    const novos = [
      ...(inicio ? [S(f, `${f.p}-inicio-curso`, `${f.num[0]} · Guia a meio`, `Depois de «Pausar»: «Continuar a ${f.verbo}» abre o passo onde ficou.`, emCurso(inicio.versoes[inicio.versoes.length - 1].html, f), `${f.p}-inicio`)] : []),
      S(f, `${f.p}-conta`, `${f.num[1]} · A sua conta`, 'Nas iniciais: quem, o turno, o que tem em mãos; «Terminar sessão».', conta(f, 'conta')),
      S(f, `${f.p}-conta-guia`, `${f.num[1]}.1 · Terminar com a guia a meio`, 'O que fica feito e onde se retoma.', conta(f, 'guia'), `${f.p}-conta`),
      S(f, `${f.p}-sessao-terminada`, `${f.num[1]}.2 · Sessão terminada`, 'O fim: a guia a meio e «Entrar».', conta(f, 'terminada'), `${f.p}-conta`),
    ];
    const i = out.map((e) => e.papel).lastIndexOf(f.papel);
    out.splice(i + 1, 0, ...novos);
  }
  return out;
}
