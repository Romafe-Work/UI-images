/* =========================================================
   GOPARTS — 17 · Informações técnicas: os dados (15 out. 2026)
   Os veículos são os do Catálogo (catalogo-dados.ts: marca, modelo, motor, código do motor, kW, cv, cc,
   combustível, fabricado desde / até); não há nenhum dado de veículo a mais.
   As secções são as 15 abas do ecrã antigo, com o mesmo sentido, agrupadas em Veículo, Manutenção, Reparação,
   Diagnóstico e Recursos. Os documentos de cada secção são de EXEMPLO e só têm o que o fornecedor (WorkshopData)
   diz de cada um: título, sistema, tipo e número de figuras. Nenhum valor técnico, binário, intervalo,
   procedimento, código de avaria ou esquema é escrito aqui: o conteúdo é do fornecedor e o protótipo não o
   reproduz. Os boletins e as notas ficam vazios (um título de boletim já afirmaria uma avaria).
   ========================================================= */
import { MODELOS, veiculosDe, type Veiculo } from './catalogo-dados';

export type IdSeccao = 'veiculo' | 'manutencoes' | 'lubrificantes' | 'ajuste' | 'tempos' | 'manuais' | 'boletins' | 'notas' | 'direcao'
  | 'diagnosticos' | 'eletricos' | 'fusiveis' | 'conforto' | 'posicao' | 'workshopdata';
export type IdGrupo = 'veiculo' | 'manutencao' | 'reparacao' | 'diagnostico' | 'recursos';
export type IdSistema = 'motor' | 'transmissao' | 'travoes' | 'suspensao' | 'direcao' | 'eletrico' | 'arrefecimento' | 'climatizacao';
export type TipoDoc = 'Plano' | 'Procedimento' | 'Tabela' | 'Esquema' | 'Figura';

/** As 15 abas do ecrã antigo, com o nome de lá (só «Conforto diagramas» passa a «Diagramas de conforto»). */
export const SECCOES: { id: IdSeccao; nome: string; grupo: IdGrupo; icone: string }[] = [
  { id: 'veiculo', nome: 'Veículo', grupo: 'veiculo', icone: 'car-front' },
  { id: 'manutencoes', nome: 'Manutenções', grupo: 'manutencao', icone: 'clipboard-list' },
  { id: 'lubrificantes', nome: 'Lubrificantes', grupo: 'manutencao', icone: 'droplet' },
  { id: 'ajuste', nome: 'Dados de ajuste', grupo: 'manutencao', icone: 'ruler' },
  { id: 'tempos', nome: 'Tempos de reparação', grupo: 'manutencao', icone: 'timer' },
  { id: 'manuais', nome: 'Manuais de reparação', grupo: 'reparacao', icone: 'book-open' },
  { id: 'boletins', nome: 'Boletins', grupo: 'reparacao', icone: 'megaphone' },
  { id: 'notas', nome: 'Notas', grupo: 'reparacao', icone: 'sticky-note' },
  { id: 'direcao', nome: 'Direção e pneus', grupo: 'reparacao', icone: 'circle-dot' },
  { id: 'diagnosticos', nome: 'Diagnósticos', grupo: 'diagnostico', icone: 'activity' },
  { id: 'eletricos', nome: 'Esquemas elétricos', grupo: 'diagnostico', icone: 'cable' },
  { id: 'fusiveis', nome: 'Fusíveis e relés', grupo: 'diagnostico', icone: 'plug-zap' },
  { id: 'conforto', nome: 'Diagramas de conforto', grupo: 'diagnostico', icone: 'armchair' },
  { id: 'posicao', nome: 'Posição de peças', grupo: 'diagnostico', icone: 'locate-fixed' },
  { id: 'workshopdata', nome: 'WorkshopData', grupo: 'recursos', icone: 'external-link' },
];
export const GRUPOS: { id: IdGrupo; nome: string }[] = [
  { id: 'veiculo', nome: 'Veículo' }, { id: 'manutencao', nome: 'Manutenção' }, { id: 'reparacao', nome: 'Reparação' },
  { id: 'diagnostico', nome: 'Diagnóstico' }, { id: 'recursos', nome: 'Recursos' },
];
export const seccaoDe = (id: IdSeccao) => SECCOES.find((s) => s.id === id)!;
export const grupoDe = (id: IdGrupo) => GRUPOS.find((g) => g.id === id)!;

export const SISTEMAS: { id: IdSistema; nome: string; icone: string }[] = [
  { id: 'motor', nome: 'Motor', icone: 'engine' },
  { id: 'arrefecimento', nome: 'Arrefecimento', icone: 'fan' },
  { id: 'transmissao', nome: 'Transmissão', icone: 'cog' },
  { id: 'travoes', nome: 'Travões', icone: 'disc' },
  { id: 'suspensao', nome: 'Suspensão', icone: 'move-vertical' },
  { id: 'direcao', nome: 'Direção', icone: 'circle-dot' },
  { id: 'eletrico', nome: 'Sistema elétrico', icone: 'zap' },
  { id: 'climatizacao', nome: 'Aquecimento e ar condicionado', icone: 'snowflake' },
];
export const sistemaDe = (id: IdSistema) => SISTEMAS.find((s) => s.id === id)!;

export interface Doc { id: string; titulo: string; seccao: IdSeccao; sistema?: IdSistema; tipo: TipoDoc; figuras: number }

/* [secção, título, sistema, tipo, figuras] — só o que o fornecedor diz de cada documento */
type D = [IdSeccao, string, IdSistema | '', TipoDoc, number];
const COMUNS: D[] = [
  ['manutencoes', 'Plano de manutenção do fabricante', '', 'Plano', 0],
  ['manutencoes', 'Serviço de óleo e filtros', 'motor', 'Procedimento', 2],
  ['manutencoes', 'Repor o indicador de manutenção', 'eletrico', 'Procedimento', 1],
  ['lubrificantes', 'Capacidades e especificações dos fluidos', '', 'Tabela', 0],
  ['lubrificantes', 'Óleo do motor', 'motor', 'Tabela', 0],
  ['lubrificantes', 'Líquido de arrefecimento', 'arrefecimento', 'Tabela', 0],
  ['lubrificantes', 'Líquido dos travões', 'travoes', 'Tabela', 0],
  ['lubrificantes', 'Gás e óleo do ar condicionado', 'climatizacao', 'Tabela', 0],
  ['ajuste', 'Dados de ajuste do motor', 'motor', 'Tabela', 0],
  ['ajuste', 'Binários de aperto dos travões', 'travoes', 'Tabela', 1],
  ['ajuste', 'Binários de aperto da suspensão', 'suspensao', 'Tabela', 1],
  ['ajuste', 'Geometria das rodas', 'direcao', 'Tabela', 1],
  ['tempos', 'Tempos de reparação · motor', 'motor', 'Tabela', 0],
  ['tempos', 'Tempos de reparação · transmissão', 'transmissao', 'Tabela', 0],
  ['tempos', 'Tempos de reparação · travões', 'travoes', 'Tabela', 0],
  ['tempos', 'Tempos de reparação · suspensão e direção', 'suspensao', 'Tabela', 0],
  ['tempos', 'Tempos de reparação · climatização', 'climatizacao', 'Tabela', 0],
  ['manuais', 'Distribuição: desmontar e montar', 'motor', 'Procedimento', 6],
  ['manuais', 'Substituir as pastilhas e os discos dianteiros', 'travoes', 'Procedimento', 4],
  ['manuais', 'Substituir as pastilhas e os discos traseiros', 'travoes', 'Procedimento', 4],
  ['manuais', 'Substituir os amortecedores dianteiros', 'suspensao', 'Procedimento', 3],
  ['manuais', 'Substituir a bomba de água', 'arrefecimento', 'Procedimento', 3],
  ['manuais', 'Embraiagem: desmontar e montar', 'transmissao', 'Procedimento', 5],
  ['manuais', 'Substituir o filtro do habitáculo', 'climatizacao', 'Procedimento', 2],
  ['direcao', 'Medidas e pressões dos pneus', 'direcao', 'Tabela', 0],
  ['direcao', 'Alinhamento da direção', 'direcao', 'Procedimento', 2],
  ['diagnosticos', 'Códigos de avaria do motor', 'motor', 'Tabela', 0],
  ['diagnosticos', 'Localização da tomada de diagnóstico', 'eletrico', 'Figura', 1],
  ['diagnosticos', 'Testes de componentes · travões (ABS)', 'travoes', 'Procedimento', 2],
  ['eletricos', 'Esquema · gestão do motor', 'motor', 'Esquema', 3],
  ['eletricos', 'Esquema · arranque e carga', 'eletrico', 'Esquema', 2],
  ['eletricos', 'Esquema · iluminação exterior', 'eletrico', 'Esquema', 2],
  ['eletricos', 'Esquema · ar condicionado', 'climatizacao', 'Esquema', 2],
  ['eletricos', 'Esquema · ABS e controlo de estabilidade', 'travoes', 'Esquema', 2],
  ['fusiveis', 'Caixa de fusíveis do habitáculo', 'eletrico', 'Figura', 1],
  ['fusiveis', 'Caixa de fusíveis do compartimento do motor', 'eletrico', 'Figura', 1],
  ['fusiveis', 'Relés', 'eletrico', 'Tabela', 1],
  ['conforto', 'Fecho centralizado', 'eletrico', 'Esquema', 1],
  ['conforto', 'Vidros elétricos', 'eletrico', 'Esquema', 1],
  ['conforto', 'Espelhos exteriores', 'eletrico', 'Esquema', 1],
  ['posicao', 'Posição dos componentes · compartimento do motor', 'motor', 'Figura', 2],
  ['posicao', 'Posição dos componentes · habitáculo', 'eletrico', 'Figura', 2],
  ['posicao', 'Posição dos sensores', 'eletrico', 'Figura', 2],
];
/* o que muda com o combustível (o resto é igual para todos) */
const POR_COMBUSTIVEL: Record<string, D[]> = {
  Diesel: [['manuais', 'Filtro de partículas: regeneração e substituição', 'motor', 'Procedimento', 3], ['manuais', 'Velas de incandescência: substituir', 'motor', 'Procedimento', 2]],
  Gasolina: [['manuais', 'Velas de ignição: substituir', 'motor', 'Procedimento', 2]],
  'Híbrido': [['manuais', 'Desligar o sistema de alta tensão', 'eletrico', 'Procedimento', 3]],
};
/* a partir de 2024 o fornecedor ainda não tem dados (17.14 · sem dados) */
export const ANO_SEM_DADOS = 2024;

/* ---------- os veículos ---------- */
export interface VeiculoTec extends Veiculo { chave: string; marca: string; modelo: string }
export const MARCAS = Object.keys(MODELOS);
const chave = (marca: string, modelo: string, versao: string) => `${marca}|${modelo}|${versao}`;
export function veiculosDaMarca(marca: string): VeiculoTec[] {
  return (MODELOS[marca] || []).flatMap(([modelo]) => veiculosDe(marca, modelo).map((v) => ({ ...v, marca, modelo, chave: chave(marca, modelo, v.versao) })));
}
export const TODOS: VeiculoTec[] = MARCAS.flatMap(veiculosDaMarca);
export const veiculoDe = (k: string) => TODOS.find((v) => v.chave === k);
/** O veículo dos exemplos (o do briefing): BMW → 1 (E81) → 118d → N47. */
export const EXEMPLO = chave('BMW', '1 (E81)', '118d');
/** O que se pesquisa num veículo: marca, modelo, motor, código do motor e combustível. */
export const textoVeiculo = (v: VeiculoTec) => `${v.marca} ${v.modelo} ${v.versao} ${v.motor} ${v.combustivel}`;
const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function procurarVeiculos(q: string, marca = ''): VeiculoTec[] {
  const termos = normal(q).split(/\s+/).filter(Boolean);
  const base = termos.length || !marca ? TODOS : veiculosDaMarca(marca);
  return base.filter((v) => { const t = normal(textoVeiculo(v)); return termos.every((p) => t.includes(p)); });
}

/* ---------- os documentos de um veículo ---------- */
export function docsDe(v: VeiculoTec): Doc[] {
  if (v.desde >= ANO_SEM_DADOS) return [];
  return [...COMUNS, ...(POR_COMBUSTIVEL[v.combustivel] || [])].map(([seccao, titulo, sistema, tipo, figuras], i) =>
    ({ id: `d${i + 1}`, seccao, titulo, sistema: sistema || undefined, tipo, figuras }));
}
export const docsDaSeccao = (docs: Doc[], s: IdSeccao) => docs.filter((d) => d.seccao === s);
export const docsDoSistema = (docs: Doc[], s: IdSistema) => docs.filter((d) => d.sistema === s);
/** A pesquisa técnica: secções, sistemas e títulos dos documentos (o índice que o fornecedor deixa usar). */
export function procurarTec(docs: Doc[], q: string) {
  const termos = normal(q).split(/\s+/).filter(Boolean);
  const bate = (t: string) => termos.length > 0 && termos.every((p) => normal(t).includes(p));
  return {
    seccoes: SECCOES.filter((s) => bate(s.nome)),
    sistemas: SISTEMAS.filter((s) => bate(s.nome) && docsDoSistema(docs, s.id).length),
    docs: docs.filter((d) => bate(`${d.titulo} ${d.sistema ? sistemaDe(d.sistema).nome : ''} ${d.tipo}`)).slice(0, 8),
  };
}
