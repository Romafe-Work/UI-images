import type { App } from '../../comum/tipos';
import type { IdErp } from './ids';
import { ecrasCompras, DESCRICAO_COMPRAS } from './compras';
import type { Ecra } from '../../comum/tipos';
import { ecraAbertura } from './abertura';
import { versaoAberturaV6, estadosAberturaV6 } from './abertura-v6';
import { ecrasInicio, DESCRICAO_INICIO } from './inicio';
import { estadosEspacoV6 } from './espaco-v6';
import { estadosLat } from './espaco-lateral';
import { ecrasFicheiros, DESCRICAO_FICHEIROS } from './ficheiros/ecras';
import { versaoInicioV7, versaoEstadoVivo, estadosVivo } from './espaco-vivo';
import { ecrasFaltasV2 } from './compras/faltas-v2';
import { comOrcamentosV2 } from './compras/orcamentos-v2';
import { comEncomendasV3 } from './compras/encomendas-v3';
import { comEncomendasV4 } from './compras/encomendas-v4';
import { comEncomendasV5 } from './compras/encomendas-v5';
import { comGuiasV2 } from './compras/rececoes-v2';
import { comGuiasV3 } from './compras/guias-v3';
import { comFaturasV2 } from './compras/faturas-v2';
import { comFaturasV3 } from './compras/faturas-v3';
import { comRecapV2 } from './compras/recap-v2';
import { comEstadosCp } from './compras/estados-cp';
import { ecrasMenuAntigo } from './compras/menu-antigo';
import { ecrasCompras2, VERSAO_COMPRAS_V2 } from './compras/ecras';
import { ecrasFase2 } from './compras/ecras2';
import { ecrasCarregarErp, ecrasErroErp, DESCRICAO_CARREGAR_ERP, DESCRICAO_ERROS_ERP } from './estados';

/* 19 out. 2026: a 00 · Abertura ganha a v2 (briefing «V2 Cinematic Opening»); a v1 fica como estava */
/* 22 out. 2026: e a v3 (briefing «Cinematic Opening Experience»: uma empresa, tudo ligado; sem login próprio — vem
   da ROMAFE Identity e passa ao Início); a v1 e a v2 ficam como estavam */
/* 22 out. 2026: ela, «só quero uma versão» — a 00 · Abertura fica só com a v3; saem a v1, a v2 e os estados da v2
   (o código delas fica em abertura.ts e abertura-v2.ts) */
/* 22 out. 2026 (fim da noite): a v6 «The Enterprise Engine» (briefing «ERP V3») substitui a v5 — uma só versão.
   22 out. 2026 (noite): a v5 (briefing «mais wow, premium e industrial»: a mensagem e o mapa da operação) substitui a
   v4 — uma só versão; o código da v4 fica em abertura-v4.ts.
   22 out. 2026 (tarde): a v4 (briefing «Minimal Cinematic Opening»: menos texto, um só gesto) substitui a v3 — uma
   só versão; o código da v3 fica em abertura-v3.ts */
const soAberturaV3 = (e: Ecra<IdErp>): Ecra<IdErp> => ({ ...e, objetivo: 'Depois do login comum (ROMAFE Identity), como no Peça A Peça: «The Enterprise Engine» — os anéis de precisão, o documento e o pacote juntam-se numa estrutura, aparece ROMAFE ERP e a marca desliza para o cabeçalho enquanto o menu e a área de trabalho surgem; segue sozinha para o Início.', versoes: [versaoAberturaV6()] as Ecra<IdErp>['versoes'] });

/* 19 out. 2026: a fase 1 de Compras (compras/ecras.ts) — o 10 · Compras ganha a v2, na casca do Início */
const comV2 = (ecras: Ecra<IdErp>[]) => ecras.map((e) => e.id === 'compras' ? { ...e, versoes: [...e.versoes, VERSAO_COMPRAS_V2()] as Ecra<IdErp>['versoes'] } : e);

/* 23 out. 2026 (ela: «só quero uma v2»): o 05 · Início fica com a v1 e uma só versão nova, a v2 = «The Living
   Workspace» (os seis cartões, o menu lateral, as transições ligadas). Saem as v2–v6 de 22–23 out. e os estados que
   só existiam nelas; o código fica (inicio-v2.ts, inicio-v3.ts, espaco.ts, espaco-v6.ts, espaco-lateral.ts), porque
   a v2 assenta nele. Dos estados da área de trabalho fica só a versão v2. */
const comInicioV2 = (ecras: Ecra<IdErp>[]) => ecras.map((e) => e.id === 'inicio' ? { ...e, versoes: [e.versoes[0], versaoInicioV7()] as Ecra<IdErp>['versoes'] } : e);
const soV2 = (ecras: Ecra<IdErp>[]) => ecras.flatMap((e) => { const v = versaoEstadoVivo(e.id); return v ? [{ ...e, versoes: [v] as Ecra<IdErp>['versoes'] }] : []; });

/* por baixo do ROMAFE, o nome por extenso e não «E R P» espaçado (ela, 8 out. 2026) */
/* 27 out. (ela: «coloca esses 4 no mesmo ecrã»): as Notas de crédito, os Pendentes de crédito e a Verificação de faturas passaram a vistas das Faturas (v3) */
const JUNTADOS = new Set(['compras-rececoes', 'cm-compras-guias-transporte', 'cm-compras-devolucoes', 'cm-compras-notas-credito', 'cm-compras-pendentes', 'cm-compras-verificacao']);
const semJuntados = <T extends { id: string; estadoDe?: string }>(xs: T[]) => xs.filter((e) => !JUNTADOS.has(e.id) && !JUNTADOS.has(e.estadoDe ?? ''));
export const erp: App<IdErp> = {
  id: 'erp',
  nome: 'ERP',
  sub: 'A plataforma de gestão',
  grupo: 'ERP',
  marca: 'ROMAFE',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': 'O login é o comum a todas as apps (ROMAFE Identity, em identidade/); ao escolher o ERP, passa a abertura e depois o Início. «Terminar sessão» e a sessão expirada voltam ao login comum.', 'Início': DESCRICAO_INICIO, 'Ficheiros': DESCRICAO_FICHEIROS, 'Compras': DESCRICAO_COMPRAS, 'Carregamento': DESCRICAO_CARREGAR_ERP, 'Erros': DESCRICAO_ERROS_ERP },
  /* 19 out. 2026: a 00 · Abertura («um ecrã wow como temos no goparts») antes do 01 · Entrar */
  /* 22 out. 2026: o login é o comum a todas as apps (ROMAFE Identity): saem os ecrãs de entrar do ERP (01–04, as
     versões até à v11, os estados da rede), a 06 · Escolher a empresa e a 07 · Escolher a aplicação — isso é da
     Identity. O código fica (entrar.ts, entrar-rede.ts, entrar-central.ts). */
  /* 27 out. (ela: «sim», tirar): a Receção de encomendas, as Guias de transporte e as Devoluções passaram a vistas das Encomendas e das Guias */
  ecras: soInicioECompras(semJuntados([soAberturaV3(ecraAbertura()), ...estadosAberturaV6(), ...comInicioV2(ecrasInicio()), ...soV2(estadosEspacoV6()), ...soV2(estadosLat()), ...estadosVivo(), ...comEncomendasV5(comEncomendasV4(comEncomendasV3(comV2(ecrasCompras())))), ...comEstadosCp(ecrasCompras2()), ...comEstadosCp(comOrcamentosV2(ecrasFase2())), ...ecrasFaltasV2(), ...comGuiasV3(comGuiasV2(comRecapV2(comFaturasV3(comFaturasV2(ecrasMenuAntigo()))))), ...ecrasFicheiros(), ...ecrasCarregarErp(), ...ecrasErroErp()])),
};

/* 28 out. 2026 (ela: «no erp tenho ecrãs diferentes, não fazem sentido; por agora no menu lateral só quero início e as
   compras com as suas opções de menu»): o seletor e o mapa mostram só o Início e os itens do menu Compras, pela ordem do
   menu e com os nomes dele. O resto (a abertura, os Ficheiros, as fichas que abrem dos ecrãs — encomenda, fornecedor,
   requisição, cotação —, os modos que já vivem noutro ecrã, o carregamento e os erros) continua a existir e a abrir,
   fora da lista. Os estados ficam por baixo do seu ecrã. */
/* uma função e não uma constante: o objeto erp, mais acima, usa-a ao ser criado */
function menuCompras(): [string, string | null][] {
  return [
  ['inicio', null],
  ['compras-faltas', '20 · Lista de Faltas'], ['compras-cotacoes', '18 · Orçamentos'], ['compras', '10 · Encomendas'],
  ['cm-compras-guias-entrada', '42 · Guias'], ['cm-compras-faturas', '45 · Faturas'],
  ['cm-mapas-tot-enc', '49 · Documentos de encomenda'], ['cm-mapas-tot-ge', '51 · Documentos de guia de entrada'], ['cm-mapas-recap', '53 · Mapa recapitulativo de fornecedores'],
  ['cm-analise-artigo', '54 · Análise de compras'], ['cm-comp-geral-var', '59 · Comparativo geral'], ['cm-comp-artigo-var', '61 · Comparativo por artigo'],
  ['cm-comp-familia-var', '63 · Comparativo por família/subfamília'], ['cm-comp-forn-var', '65 · Comparativo por fornecedor'],
  ['cm-mapas-analise-forn', '66 · Análise de fornecedores'], ['cm-mapas-automatico', '67 · Artigos / compras automático'],
  ['compras-fornecedores', '14 · Fornecedores'], ['compras-requisicoes', '16 · Requisições'],
  ];
}
function soInicioECompras<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const MENU = menuCompras(), fica = new Map(MENU);
  const raiz = (e: Ecra<T>) => !e.estadoDe;
  const listados = MENU.flatMap(([id, nome]) => {
    const e = ecras.find((x) => x.id === id && raiz(x)); if (!e) return [];
    return [{ ...e, nome: nome ?? e.nome, fluxo: id === 'inicio' ? 'Início' : 'Compras' }, ...ecras.filter((x) => x.estadoDe === id)];
  });
  const resto = ecras.filter((x) => !(raiz(x) ? fica.has(x.id) : fica.has(x.estadoDe!))).map((x) => raiz(x) ? { ...x, foraDaLista: true } : x);
  return [...listados, ...resto];
}
