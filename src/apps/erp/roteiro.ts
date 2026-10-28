/* =========================================================
   ERP — as demonstrações com o rato (28 out. 2026)
   Ela: «faz a mesma demonstração de casos no erp com rato mas sem texto». Os casos das Compras, um por roteiro, só
   com o rato e os cliques verdadeiros (semTexto): a partir do Início, abre-se o ecrã pelo menu lateral e o rato
   trabalha dentro do separador (separador: true). Escolhe-se em «Com o rato», na barra da demonstração.
   Link para mandar: …/erp/#so=ecra&demo=1&anim=dissolver&ecra=inicio&rato=<id>
   ========================================================= */
import { registarRoteiro, type Passo } from '../../comum/demo-rato';

const SEM = { semTexto: true };
/** Abre um item do menu lateral (no Início) e espera que o separador carregue. */
const menu = (rota: string): Passo => ({ legenda: '', clicar: `.dk7-i[data-dk-atalho="${rota}"]`, pausa: 1800 });
/** Um clique dentro do separador ativo. */
const sep = (clicar: string, pausa = 0): Passo => ({ legenda: '', clicar, separador: true, pausa });

registarRoteiro('erp-faltas', 'Lista de Faltas: da falta à encomenda', [
  { ecra: 'inicio', ...menu('compras.faltas') },
  sep('tr[data-lf2-ref="30205"]'),
  sep('[data-lf2-comp="contem"]'),
  sep('tr[data-lf2-ref="GDB1330"]'),
  sep('[data-lf2-acao="para-encomenda"]', 800),
  sep('[data-lf2-acao="encomenda"]', 1500),
  { legenda: '' },
], SEM);

registarRoteiro('erp-encomendas', 'Encomendas: as quatro vistas e uma encomenda', [
  { ecra: 'inicio', ...menu('compras.encomendas') },
  sep('tr[data-dv2-id="EF 2026/0411"]', 600),
  sep('[data-dv2-vista="agenda"]'),
  sep('[data-dv2-acao="ag-modo"][data-m="cal"]'),
  sep('[data-dv2-vista="clientes"]'),
  sep('[data-dv2-vista="rececoes"]'),
  sep('[data-dv2-vista="docs"]'),
  sep('[data-dv2-acao="novo"]', 600),
  { legenda: '' },
], SEM);

registarRoteiro('erp-orcamentos', 'Orçamentos: comparar e transferir', [
  { ecra: 'inicio', ...menu('compras.cotacoes') },
  sep('tr[data-dv2-id="PC 2026/0017|skf"]', 600),
  sep('[data-dv2-modo="data"]'),
  sep('tr[data-dv2-id="PC 2026/0016|gates"]', 600),
  sep('[data-dv2-acao="transferir"]', 800),
  { legenda: '' },
], SEM);

registarRoteiro('erp-guias-faturas', 'Guias e faturas', [
  { ecra: 'inicio', ...menu('compras.compras-guias-entrada') },
  sep('tr[data-rc2-abrir="gui:GR 88213"]', 600),
  sep('[data-gv3-vista="transporte"]'),
  sep('[data-gv3-vista="devolucao"]'),
  menu('compras.compras-faturas'),
  sep('tr[data-dv2-id="FC 2026/00122"]', 600),
  sep('[data-dv2-vista="notas"]'),
  sep('[data-dv2-vista="pendentes"]'),
  sep('[data-dv2-vista="verificar"]'),
  { legenda: '' },
], SEM);

registarRoteiro('erp-mapas', 'Mapas: documentos e análise', [
  { ecra: 'inicio', legenda: '', clicar: '[data-dk7-grupo="compras-mapas"]' },
  menu('compras.mapas-tot-enc'),
  sep('[data-fx-par-vista="det"]'),
  menu('compras.analise-artigo'),
  sep('[data-cf-modo="familia"]'),
  sep('[data-cf-acao="gerar"]', 1200),
  { legenda: '' },
], SEM);
