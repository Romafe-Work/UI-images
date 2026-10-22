import type { App } from '../../comum/tipos';
import type { IdMobile } from './ids';
import { ecrasCarregarPick, ecrasErroPick, DESCRICAO_CARREGAR_PICK, DESCRICAO_ERROS_PICK } from './estados';
import { ecrasInventario, DESCRICAO_INVENTARIO } from './inventario';
import { entrarIndustrial, ajudaPick, ESTADOS_ENTRAR_PK, ESTADOS_ABERTURA_PK } from './entrar-industrial';
import { aberturaPick } from './abertura-pick';
import type { Ecra } from '../../comum/tipos';

const DESCRICAO_ENTRAR_PK = 'Abrir a Pick e entrar: a abertura (o leitor, a rede e o servidor), o utilizador e a palavra-passe no mesmo ecrã, e a ajuda.';

export const mobile: App<IdMobile> = {
  id: 'mobile',
  nome: 'Pick',
  sub: 'A app do armazém, no PDA',
  grupo: 'Pick',
  marca: 'PICK',
  /* o ecrã do Honeywell EDA61K: 4", 480 × 800 píxeis físicos a densidade
     1,5 (hdpi), o que dá 320 × 533 píxeis CSS (dp) */
  tela: { l: 320, a: 533 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR_PK, 'Inventário': DESCRICAO_INVENTARIO, 'Carregamento': DESCRICAO_CARREGAR_PICK, 'Erros': DESCRICAO_ERROS_PICK },
  /* 21 out. 2026: ela, «só quero uma versão: a v5, mas mais bonita e mais profissional» e «falta uma abertura» —
     a abertura, a entrada industrial e a ajuda, uma versão cada; saíram as v1–v4, a palavra-passe à parte e o
     cliente federado (o código fica em entrar.ts e no comum) */
  ecras: [...ecrasEntrarPick(), ...ecrasInventario(), ...ecrasCarregarPick(), ...ecrasErroPick()],
};

function ecrasEntrarPick(): Ecra<IdMobile>[] {
  const FLUXO = 'Entrar';
  const um = (html: string, nota: string): Ecra['versoes'] => [{ id: 'v1', nota, html }];
  return [
    { id: 'abertura', nome: '00 · Abertura', fluxo: FLUXO, objetivo: 'Ao ligar a Pick (≈1,5 s): o porta-paletes entra com a caixa e o código é lido; o leitor, a rede e o servidor confirmam-se; sobe a entrada do Inventário — o armazém e o PDA, quem entrou da última vez, os atalhos das três tarefas e «Entrar».', versoes: um(aberturaPick(), 'A abertura (22 out., briefing do PDA Honeywell: o porta-paletes e a entrada do Inventário; substitui a de 21 out.)') },
    ...ESTADOS_ABERTURA_PK.map(([est, id, nome, objetivo]) => ({ id: id as IdMobile, nome, fluxo: FLUXO, objetivo, estadoDe: 'abertura' as IdMobile, versoes: um(aberturaPick(est), 'A abertura (22 out.)') })),
    { id: 'entrada', nome: '01 · Entrar', fluxo: FLUXO, objetivo: 'Entrar com o utilizador e a palavra-passe, no mesmo ecrã; a rede e o servidor à vista; depois, o Inventário.', versoes: um(entrarIndustrial(), 'A entrada industrial (21 out.): a marca da família, a linha de estado, a estante com as posições, a folha do formulário') },
    ...ESTADOS_ENTRAR_PK.map(([est, id, nome, objetivo]) => ({ id: id as IdMobile, nome, fluxo: FLUXO, objetivo, estadoDe: 'entrada' as IdMobile, versoes: um(entrarIndustrial(est), 'A entrada industrial (21 out.)') })),
    { id: 'ajuda', nome: '02 · Ajuda', fluxo: FLUXO, objetivo: 'Recuperar o acesso e o que fazer quando o leitor ou a rede falham; o apoio da Romafe.', versoes: um(ajudaPick(), 'A ajuda (21 out.)') },
  ];
}
