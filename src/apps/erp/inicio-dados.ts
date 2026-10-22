/* =========================================================
   ERP — 05 · Início: os dados de exemplo (19 out. 2026)
   O protótipo não tem servidor: tudo o que o Início mostra sai daqui, e o comportamento
   (comportamento/inicio.ts) trata isto como se fosse a resposta da API — procura, permissões e
   alterações de estado passam por funções que, no produto, serão pedidos ao servidor.
   O que vem do que já existe no protótipo:
     - os módulos e os submenus de Compras são os da moldura (moldura.ts), com os mesmos nomes
       provisórios; só Compras · Encomendas a fornecedor tem ecrã (10 · Compras);
     - as encomendas a fornecedor (EF 2026/04xx) são as do 10 · Compras;
     - o utilizador do login é o Rui Matos, de Compras (entrar-rede.ts);
     - no armazém: as funções são arrumação, separação e expedição, com um gestor; a chegada não é
       prevista (o sistema não sabe o que vem); as posições são 60 · zona · coluna · prateleira.
   O que é de exemplo e tem de vir da especificação do Rolgest: os perfis e as permissões (aqui, a lista
   de módulos de cada perfil), os outros documentos, clientes e números. No produto as permissões são
   verificadas na API (o Rolgest defende-as três vezes); aqui só se filtra o que se mostra.
   Hoje é segunda-feira, 19 de outubro de 2026.
   ========================================================= */

export type Modulo = 'inicio' | 'compras' | 'vendas' | 'stocks' | 'armazem' | 'clientes' | 'faturacao' | 'definicoes';
export type IdPerfil = 'compras' | 'armazem' | 'vendas' | 'financeiro' | 'admin';
export type Nivel = 'atrasada' | 'urgente' | 'normal' | 'info';

export const HOJE = { dia: 'segunda-feira, 19 de outubro de 2026', curto: '19/10/2026' };

export interface Perfil {
  id: IdPerfil; nome: string; pessoa: string; primeiro: string; iniciais: string; cargo: string; correio: string;
  modulos: Modulo[];
}
export const PERFIS: Record<IdPerfil, Perfil> = {
  compras: { id: 'compras', nome: 'Compras', pessoa: 'Rui Matos', primeiro: 'Rui', iniciais: 'RM', cargo: 'Comprador', correio: 'rui.matos@romafe.pt', modulos: ['inicio', 'compras', 'stocks', 'armazem'] },
  armazem: { id: 'armazem', nome: 'Armazém', pessoa: 'Ana Ferreira', primeiro: 'Ana', iniciais: 'AF', cargo: 'Gestora do armazém 60', correio: 'ana.ferreira@romafe.pt', modulos: ['inicio', 'armazem', 'stocks', 'compras'] },
  vendas: { id: 'vendas', nome: 'Vendas', pessoa: 'Pedro Sousa', primeiro: 'Pedro', iniciais: 'PS', cargo: 'Comercial', correio: 'pedro.sousa@romafe.pt', modulos: ['inicio', 'vendas', 'clientes', 'stocks'] },
  financeiro: { id: 'financeiro', nome: 'Financeiro', pessoa: 'Marta Lopes', primeiro: 'Marta', iniciais: 'ML', cargo: 'Contabilidade', correio: 'marta.lopes@romafe.pt', modulos: ['inicio', 'faturacao', 'compras', 'clientes'] },
  admin: { id: 'admin', nome: 'Administração', pessoa: 'Carla Nunes', primeiro: 'Carla', iniciais: 'CN', cargo: 'Administração', correio: 'carla.nunes@romafe.pt', modulos: ['inicio', 'compras', 'vendas', 'stocks', 'armazem', 'clientes', 'faturacao', 'definicoes'] },
};
export const EMPRESA = { nome: 'Romafe, SA', local: 'Armazém 60 · Coimbra' };

/* ---------- os módulos (os da moldura) e os destinos dentro deles ---------- */
export interface Destino { id: string; nome: string; modulo: Modulo; ecra?: string }
export const MODULOS: { id: Modulo; nome: string; icone: string; grupo: 'Trabalho' | 'Consulta' | 'Sistema'; subs: Destino[] }[] = [
  { id: 'inicio', nome: 'Início', icone: 'house', grupo: 'Trabalho', subs: [] },
  { id: 'compras', nome: 'Compras', icone: 'shopping-cart', grupo: 'Trabalho', subs: [
    /* 19 out.: as fases 1 (Encomendas, Receções, Fornecedores) e 2 (Requisições, Cotações) de Compras;
       o resto não se mostra até existir */
    { id: 'compras-requisicoes', nome: 'Requisições', modulo: 'compras', ecra: 'compras-requisicoes' },
    { id: 'compras-cotacoes', nome: 'Cotações', modulo: 'compras', ecra: 'compras-cotacoes' },
    { id: 'compras-encomendas', nome: 'Encomendas a fornecedor', modulo: 'compras', ecra: 'compras' },
    { id: 'compras-faltas', nome: 'Lista de faltas', modulo: 'compras', ecra: 'compras-faltas' },
    { id: 'compras-rececoes', nome: 'Receções', modulo: 'compras', ecra: 'compras-rececoes' },
    { id: 'compras-fornecedores', nome: 'Fornecedores', modulo: 'compras', ecra: 'compras-fornecedores' },
  ] },
  { id: 'vendas', nome: 'Vendas', icone: 'trending-up', grupo: 'Trabalho', subs: [
    { id: 'vendas-encomendas', nome: 'Encomendas de cliente', modulo: 'vendas' },
    { id: 'vendas-orcamentos', nome: 'Orçamentos', modulo: 'vendas' },
  ] },
  { id: 'armazem', nome: 'Armazém', icone: 'warehouse', grupo: 'Trabalho', subs: [
    { id: 'armazem-chegadas', nome: 'Chegadas', modulo: 'armazem' },
    { id: 'armazem-arrumacao', nome: 'Arrumação', modulo: 'armazem' },
    { id: 'armazem-separacao', nome: 'Separação', modulo: 'armazem' },
    { id: 'armazem-expedicao', nome: 'Expedição', modulo: 'armazem' },
  ] },
  { id: 'faturacao', nome: 'Faturação', icone: 'receipt-text', grupo: 'Trabalho', subs: [
    { id: 'faturacao-faturas', nome: 'Faturas a cliente', modulo: 'faturacao' },
    { id: 'faturacao-notas', nome: 'Notas de crédito', modulo: 'faturacao' },
  ] },
  { id: 'stocks', nome: 'Stocks', icone: 'boxes', grupo: 'Consulta', subs: [
    { id: 'stocks-consultar', nome: 'Consultar stock', modulo: 'stocks' },
    { id: 'stocks-artigos', nome: 'Artigos', modulo: 'stocks' },
  ] },
  { id: 'clientes', nome: 'Clientes', icone: 'users', grupo: 'Consulta', subs: [] },
  { id: 'definicoes', nome: 'Definições', icone: 'settings', grupo: 'Sistema', subs: [] },
];
/** Quem trata os documentos de cada módulo (ver não é tratar: o Armazém vê as encomendas, não as aprova). */
export const AGEM: Record<Modulo, IdPerfil[]> = {
  inicio: [], compras: ['compras', 'admin'], vendas: ['vendas', 'admin'], stocks: ['compras', 'armazem', 'admin'], armazem: ['armazem', 'admin'],
  clientes: ['vendas', 'financeiro', 'admin'], faturacao: ['financeiro', 'admin'], definicoes: ['admin'],
};
export const nomeModulo = (m: Modulo) => MODULOS.find((x) => x.id === m)!.nome;

/* ---------- os documentos e registos (o que abre no painel) ---------- */
export interface Linha { ref: string; desc: string; qtd: string; valor: string }
export interface Doc {
  /** quem pode tratar o documento (por omissão, os perfis do módulo: AGEM) */ agem?: IdPerfil[];
  ref: string; tipo: string; modulo: Modulo; entidade: string; estado: string; nivel?: Nivel;
  datas: [string, string][]; total?: string; linhas?: Linha[]; nota?: string; ecra?: string;
  /** a ação que o documento pede, quando pede uma (aprovar, confirmar…) */
  acao?: { id: 'aprovar' | 'lembrar' | 'enviar' | 'conferir' | 'confirmar' | 'arrumar' | 'separar' | 'expedir' | 'renovar' | 'resolver'; rotulo: string; icone: string; feito: string };
}
export const DOCS: Record<string, Doc> = {
  'EF 2026/0412': { ref: 'EF 2026/0412', tipo: 'Encomenda a fornecedor', modulo: 'compras', entidade: 'SKF Portugal', estado: 'A aprovar', nivel: 'urgente', ecra: 'compras',
    datas: [['Criada', '09/10/2026'], ['Enviada para aprovação', '09/10/2026'], ['Entrega pedida', '23/10/2026']], total: '18 420,00 €',
    linhas: [{ ref: '6206-2RSH', desc: 'Rolamento rígido de esferas', qtd: '1 200 un.', valor: '4 944,00 €' }, { ref: '6205-2Z', desc: 'Rolamento rígido de esferas', qtd: '900 un.', valor: '3 096,00 €' }, { ref: 'VKBA 6556', desc: 'Kit de rolamento de roda', qtd: '180 un.', valor: '7 380,00 €' }, { ref: 'LGMT 2/1', desc: 'Massa lubrificante, 1 kg', qtd: '120 un.', valor: '3 000,00 €' }],
    nota: 'Acima de 10 000 €: precisa da aprovação da direção.', acao: { id: 'aprovar', rotulo: 'Aprovar', icone: 'check', feito: 'aprovada' } },
  'EF 2026/0402': { ref: 'EF 2026/0402', tipo: 'Encomenda a fornecedor', modulo: 'compras', entidade: 'Brembo', estado: 'A aprovar', nivel: 'atrasada', ecra: 'compras',
    datas: [['Criada', '29/09/2026'], ['Enviada para aprovação', '29/09/2026']], total: '12 060,00 €',
    linhas: [{ ref: 'P 85 020', desc: 'Pastilhas de travão', qtd: '300 un.', valor: '6 900,00 €' }, { ref: '09.A727.11', desc: 'Disco de travão', qtd: '120 un.', valor: '5 160,00 €' }],
    nota: 'À espera de aprovação há 20 dias.', acao: { id: 'aprovar', rotulo: 'Aprovar', icone: 'check', feito: 'aprovada' } },
  'EF 2026/0408': { ref: 'EF 2026/0408', tipo: 'Encomenda a fornecedor', modulo: 'compras', entidade: 'TRW', estado: 'Atrasada', nivel: 'atrasada', ecra: 'compras',
    datas: [['Enviada', '03/10/2026'], ['Entrega prevista', '10/10/2026']], total: '9 870,00 €',
    linhas: [{ ref: 'GDB1330', desc: 'Pastilhas de travão', qtd: '400 un.', valor: '6 120,00 €' }, { ref: 'JTE1001', desc: 'Terminal de direção', qtd: '150 un.', valor: '3 750,00 €' }],
    nota: 'Nada chegou ao armazém 60 desde o envio.', acao: { id: 'lembrar', rotulo: 'Lembrar fornecedor', icone: 'send', feito: 'lembrete enviado ao fornecedor' } },
  'EF 2026/0407': { ref: 'EF 2026/0407', tipo: 'Encomenda a fornecedor', modulo: 'compras', entidade: 'Valeo', estado: 'Atrasada', nivel: 'atrasada', ecra: 'compras',
    datas: [['Enviada', '02/10/2026'], ['Entrega prevista', '09/10/2026']], total: '3 215,60 €',
    linhas: [{ ref: '826210', desc: 'Kit de embraiagem', qtd: '20 un.', valor: '3 215,60 €' }], acao: { id: 'lembrar', rotulo: 'Lembrar fornecedor', icone: 'send', feito: 'lembrete enviado ao fornecedor' } },
  'EF 2026/0413': { ref: 'EF 2026/0413', tipo: 'Encomenda a fornecedor', modulo: 'compras', entidade: 'Bosch', estado: 'Rascunho', nivel: 'normal', ecra: 'compras',
    datas: [['Começada', '12/10/2026'], ['Última alteração', 'hoje, 08:42']], total: '1 840,20 €',
    linhas: [{ ref: '0 986 494 524', desc: 'Pastilhas de travão', qtd: '40 un.', valor: '1 104,00 €' }, { ref: '0 242 236 565', desc: 'Vela de ignição', qtd: '120 un.', valor: '736,20 €' }],
    nota: '6 linhas; faltam 4 por preço.', acao: { id: 'enviar', rotulo: 'Enviar ao fornecedor', icone: 'send', feito: 'enviada ao fornecedor' } },
  'EF 2026/0411': { ref: 'EF 2026/0411', tipo: 'Encomenda a fornecedor', modulo: 'compras', entidade: 'Brembo', estado: 'Parcialmente recebida', nivel: 'info', ecra: 'compras',
    datas: [['Enviada', '08/10/2026'], ['Entrega prevista', '20/10/2026']], total: '6 312,40 €', nota: 'Chegaram 6 das 9 linhas; faltam 3.' },
  'FF SKF/8841': { agem: ['compras', 'financeiro', 'admin'], ref: 'FF SKF/8841', tipo: 'Fatura de fornecedor', modulo: 'compras', entidade: 'SKF Portugal', estado: 'Por conferir', nivel: 'urgente',
    datas: [['Recebida', '15/10/2026'], ['Vencimento', '14/11/2026']], total: '7 412,30 €', nota: 'Duas linhas com preço diferente da encomenda EF 2026/0398.',
    acao: { id: 'conferir', rotulo: 'Conferir', icone: 'list-checks', feito: 'conferida' } },
  'CH 2026/0931': { ref: 'CH 2026/0931', tipo: 'Chegada ao armazém', modulo: 'armazem', entidade: 'SKF Portugal', estado: 'Por arrumar', nivel: 'urgente',
    datas: [['Chegou', 'hoje, 07:55'], ['Paletes', '3']], nota: 'Picada à chegada (SKF). 46 artigos por arrumar.',
    acao: { id: 'arrumar', rotulo: 'Entregar à arrumação', icone: 'package-check', feito: 'entregue à arrumação' } },
  'SP 2026/2210': { ref: 'SP 2026/2210', tipo: 'Separação', modulo: 'armazem', entidade: 'Expedição das 16:00', estado: 'Por separar', nivel: 'urgente',
    datas: [['Guias', '12'], ['Saída', 'hoje, 16:00']], nota: '12 guias por separar; 4 já na prateleira de preparados.',
    acao: { id: 'separar', rotulo: 'Dar prioridade', icone: 'arrow-up-narrow-wide', feito: 'passada à frente na separação' } },
  'EX 2026/1032': { ref: 'EX 2026/1032', tipo: 'Expedição', modulo: 'armazem', entidade: 'Transportadora · recolha das 17:00', estado: 'Por expedir', nivel: 'normal',
    datas: [['Volumes', '4'], ['Recolha', 'hoje, 17:00']], acao: { id: 'expedir', rotulo: 'Marcar como pronta', icone: 'truck', feito: 'pronta para a recolha' } },
  'CP 60·B·12·3': { ref: 'CP 60·B·12·3', tipo: 'Correção de posição', modulo: 'armazem', entidade: 'Posição 60 · B · 12 · 3', estado: 'Pedida', nivel: 'normal',
    datas: [['Pedida', 'hoje, 09:10'], ['Por', 'separação']], nota: 'Falta quantidade de 6206-2RSH na posição.', acao: { id: 'resolver', rotulo: 'Resolver', icone: 'map-pin-check', feito: 'resolvida' } },
  'EC 2026/1180': { ref: 'EC 2026/1180', tipo: 'Encomenda de cliente', modulo: 'vendas', entidade: 'Auto Peças Lima', estado: 'Com falta de stock', nivel: 'urgente',
    datas: [['Recebida', 'hoje, 08:15'], ['Entrega pedida', '21/10/2026']], total: '2 318,90 €',
    linhas: [{ ref: 'VKBA 6556', desc: 'Kit de rolamento de roda', qtd: '12 un.', valor: '612,00 €' }, { ref: '30205', desc: 'Rolamento de rolos cónicos', qtd: '30 un. (faltam 10)', valor: '465,00 €' }],
    nota: 'Faltam 10 un. de 30205; há 40 a caminho na EF 2026/0412.', acao: { id: 'confirmar', rotulo: 'Confirmar com entrega parcial', icone: 'check', feito: 'confirmada com entrega parcial' } },
  'OR 2026/0219': { ref: 'OR 2026/0219', tipo: 'Orçamento', modulo: 'vendas', entidade: 'Oficina Central de Coimbra', estado: 'Expira amanhã', nivel: 'urgente',
    datas: [['Enviado', '06/10/2026'], ['Válido até', '20/10/2026']], total: '4 905,00 €', acao: { id: 'renovar', rotulo: 'Prolongar 15 dias', icone: 'calendar-plus', feito: 'prolongado até 04/11/2026' } },
  'EC 2026/1176': { ref: 'EC 2026/1176', tipo: 'Encomenda de cliente', modulo: 'vendas', entidade: 'Recauchutagem Mondego', estado: 'Crédito excedido', nivel: 'atrasada',
    datas: [['Recebida', '16/10/2026']], total: '1 204,50 €', nota: 'O cliente tem 3 210,00 € vencidos.', acao: { id: 'resolver', rotulo: 'Pedir autorização', icone: 'shield-check', feito: 'autorização pedida' } },
  'FT 2026/05530': { ref: 'FT 2026/05530', tipo: 'Fatura a cliente', modulo: 'faturacao', entidade: 'Recauchutagem Mondego', estado: 'Vencida há 12 dias', nivel: 'atrasada',
    datas: [['Emitida', '07/09/2026'], ['Vencimento', '07/10/2026']], total: '3 210,00 €', acao: { id: 'lembrar', rotulo: 'Enviar lembrete', icone: 'send', feito: 'lembrete enviado ao cliente' } },
  'NC 2026/0088': { ref: 'NC 2026/0088', tipo: 'Nota de crédito', modulo: 'faturacao', entidade: 'Auto Peças Lima', estado: 'A aprovar', nivel: 'urgente',
    datas: [['Pedida', '16/10/2026']], total: '−186,40 €', nota: 'Devolução de 4 kits VKBA 6556.', acao: { id: 'aprovar', rotulo: 'Aprovar', icone: 'check', feito: 'aprovada' } },
  'INT transportadora': { ref: 'INT transportadora', tipo: 'Processo com erro', modulo: 'definicoes', entidade: 'Ligação à transportadora', estado: 'Falhou 2 vezes', nivel: 'atrasada',
    datas: [['Última tentativa', 'hoje, 06:00']], nota: 'As etiquetas da recolha das 17:00 ainda não foram pedidas.', acao: { id: 'resolver', rotulo: 'Tentar outra vez', icone: 'rotate-ccw', feito: 'pedida outra vez' } },
};

/* ---------- as prioridades de cada perfil (referências a DOCS) ---------- */
export const PRIORIDADES: Record<IdPerfil, { doc: string; titulo: string; prazo: string; quando: string }[]> = {
  compras: [
    { doc: 'EF 2026/0402', titulo: 'Aprovação parada há 20 dias', prazo: '29/09', quando: 'há 20 dias' },
    { doc: 'EF 2026/0408', titulo: 'Entrega atrasada', prazo: '10/10', quando: '9 dias de atraso' },
    { doc: 'EF 2026/0407', titulo: 'Entrega atrasada', prazo: '09/10', quando: '10 dias de atraso' },
    { doc: 'EF 2026/0412', titulo: 'Encomenda por aprovar', prazo: 'hoje', quando: 'acima de 10 000 €' },
    { doc: 'FF SKF/8841', titulo: 'Fatura com preços diferentes', prazo: '14/11', quando: 'vence em 26 dias' },
    { doc: 'EF 2026/0413', titulo: 'Rascunho por enviar', prazo: '—', quando: 'começado a 12/10' },
    { doc: 'EF 2026/0411', titulo: 'Faltam 3 linhas por chegar', prazo: '20/10', quando: 'amanhã' },
  ],
  armazem: [
    { doc: 'CH 2026/0931', titulo: 'Chegada por arrumar', prazo: 'hoje', quando: 'chegou às 07:55' },
    { doc: 'SP 2026/2210', titulo: 'Separação para a saída das 16:00', prazo: 'hoje, 16:00', quando: 'faltam 8 guias' },
    { doc: 'EX 2026/1032', titulo: 'Volumes para a recolha', prazo: 'hoje, 17:00', quando: '4 volumes' },
    { doc: 'CP 60·B·12·3', titulo: 'Correção de posição pedida', prazo: 'hoje', quando: 'há 40 min' },
    { doc: 'EF 2026/0411', titulo: 'Faltam 3 linhas por chegar', prazo: '20/10', quando: 'amanhã' },
  ],
  vendas: [
    { doc: 'EC 2026/1176', titulo: 'Crédito do cliente excedido', prazo: '16/10', quando: 'parada há 3 dias' },
    { doc: 'EC 2026/1180', titulo: 'Encomenda com falta de stock', prazo: '21/10', quando: 'entrega em 2 dias' },
    { doc: 'OR 2026/0219', titulo: 'Orçamento a expirar', prazo: '20/10', quando: 'amanhã' },
  ],
  financeiro: [
    { doc: 'FT 2026/05530', titulo: 'Fatura vencida', prazo: '07/10', quando: 'há 12 dias' },
    { doc: 'NC 2026/0088', titulo: 'Nota de crédito por aprovar', prazo: 'hoje', quando: 'pedida a 16/10' },
    { doc: 'FF SKF/8841', titulo: 'Fatura com preços diferentes', prazo: '14/11', quando: 'vence em 26 dias' },
  ],
  admin: [
    { doc: 'INT transportadora', titulo: 'Ligação com erro', prazo: 'hoje, 17:00', quando: 'falhou às 06:00' },
    { doc: 'EF 2026/0402', titulo: 'Aprovação parada há 20 dias', prazo: '29/09', quando: 'há 20 dias' },
    { doc: 'EF 2026/0412', titulo: 'Encomenda por aprovar', prazo: 'hoje', quando: 'acima de 10 000 €' },
    { doc: 'NC 2026/0088', titulo: 'Nota de crédito por aprovar', prazo: 'hoje', quando: 'pedida a 16/10' },
    { doc: 'EC 2026/1176', titulo: 'Crédito do cliente excedido', prazo: '16/10', quando: 'parada há 3 dias' },
  ],
};

/* ---------- continuar onde fiquei (por pessoa: nunca se veem os de outra) ---------- */
export interface Recente { id: string; tipo: 'rascunho' | 'documento' | 'registo' | 'pesquisa' | 'espaco'; titulo: string; sub: string; quando: string; doc?: string; procura?: string; fixado?: boolean; ecra?: string }
export const RECENTES: Record<IdPerfil, Recente[]> = {
  compras: [
    { id: 'r1', tipo: 'rascunho', titulo: 'EF 2026/0413 · Bosch', sub: 'Rascunho · 6 linhas, faltam 4 preços', quando: 'hoje, 08:42', doc: 'EF 2026/0413' },
    { id: 'r2', tipo: 'documento', titulo: 'EF 2026/0412 · SKF Portugal', sub: 'A aprovar · 18 420,00 €', quando: 'sexta, 17:20', doc: 'EF 2026/0412' },
    { id: 'r3', tipo: 'registo', titulo: 'Fornecedor · TRW', sub: 'Ficha · condições de entrega', quando: 'sexta, 11:05', procura: 'TRW' },
    { id: 'r4', tipo: 'pesquisa', titulo: '«rolamentos 62» com stock baixo', sub: 'Pesquisa · 14 artigos', quando: 'quinta, 16:30', procura: '62' },
    { id: 'r5', tipo: 'espaco', titulo: 'Encomendas a fornecedor · Atrasadas', sub: 'Lista fixada', quando: 'fixada', fixado: true, ecra: 'compras' },
  ],
  armazem: [
    { id: 'r1', tipo: 'documento', titulo: 'CH 2026/0931 · SKF Portugal', sub: 'Chegada · 3 paletes por arrumar', quando: 'hoje, 08:01', doc: 'CH 2026/0931' },
    { id: 'r2', tipo: 'documento', titulo: 'SP 2026/2210 · saída das 16:00', sub: 'Separação · 4 de 12 guias', quando: 'hoje, 07:40', doc: 'SP 2026/2210' },
    { id: 'r3', tipo: 'pesquisa', titulo: '«6206» no armazém 60', sub: 'Pesquisa · 3 posições', quando: 'sexta, 15:12', procura: '6206' },
    { id: 'r4', tipo: 'espaco', titulo: 'Armazém · Expedição de hoje', sub: 'Lista fixada', quando: 'fixada', fixado: true, doc: 'EX 2026/1032' },
  ],
  vendas: [
    { id: 'r1', tipo: 'rascunho', titulo: 'Orçamento novo · Auto Peças Lima', sub: 'Rascunho · 3 linhas', quando: 'hoje, 09:02', doc: 'EC 2026/1180' },
    { id: 'r2', tipo: 'registo', titulo: 'Cliente · Recauchutagem Mondego', sub: 'Ficha · crédito e vencidos', quando: 'sexta, 10:40', procura: 'Mondego' },
    { id: 'r3', tipo: 'documento', titulo: 'OR 2026/0219 · Oficina Central', sub: 'Orçamento · 4 905,00 €', quando: 'quinta, 14:55', doc: 'OR 2026/0219' },
  ],
  financeiro: [
    { id: 'r1', tipo: 'documento', titulo: 'FF SKF/8841 · SKF Portugal', sub: 'Por conferir · 7 412,30 €', quando: 'hoje, 08:30', doc: 'FF SKF/8841' },
    { id: 'r2', tipo: 'registo', titulo: 'Cliente · Recauchutagem Mondego', sub: 'Ficha · 3 210,00 € vencidos', quando: 'sexta, 12:10', procura: 'Mondego' },
    { id: 'r3', tipo: 'pesquisa', titulo: 'Faturas vencidas há mais de 30 dias', sub: 'Pesquisa · 7 faturas', quando: 'quinta, 09:20', procura: 'FT' },
  ],
  admin: [
    { id: 'r1', tipo: 'documento', titulo: 'Ligação à transportadora', sub: 'Processo com erro · 2 falhas', quando: 'hoje, 07:15', doc: 'INT transportadora' },
    { id: 'r2', tipo: 'documento', titulo: 'EF 2026/0412 · SKF Portugal', sub: 'A aprovar · 18 420,00 €', quando: 'sexta, 18:02', doc: 'EF 2026/0412' },
    { id: 'r3', tipo: 'espaco', titulo: 'Compras · À espera de aprovação', sub: 'Lista fixada', quando: 'fixada', fixado: true, ecra: 'compras' },
  ],
};

/* ---------- acesso rápido: as operações, com o módulo que cada uma pede ---------- */
export interface Operacao { id: string; nome: string; icone: string; modulo: Modulo; /** quem pode (por ação, não só por módulo) */ perfis: IdPerfil[]; tecla?: string; tipo: 'criar' | 'procurar' | 'abrir'; procura?: string; ecra?: string; doc?: string }
export const OPERACOES: Operacao[] = [
  { id: 'nova-rq', nome: 'Nova requisição de compra', icone: 'clipboard-list', modulo: 'inicio', perfis: ['compras', 'armazem', 'vendas', 'financeiro', 'admin'], tipo: 'criar' },
  { id: 'nova-ef', nome: 'Nova encomenda a fornecedor', icone: 'file-plus-2', modulo: 'compras', perfis: ['compras', 'admin'], tipo: 'criar', tecla: 'N' },
  { id: 'ver-ef', nome: 'Encomendas a fornecedor', icone: 'shopping-cart', modulo: 'compras', perfis: ['compras', 'armazem', 'financeiro', 'admin'], tipo: 'abrir', ecra: 'compras' },
  { id: 'stock', nome: 'Consultar stock', icone: 'boxes', modulo: 'stocks', perfis: ['compras', 'armazem', 'vendas', 'admin'], tipo: 'procurar', procura: '' },
  { id: 'artigo', nome: 'Procurar artigo', icone: 'search', modulo: 'stocks', perfis: ['compras', 'armazem', 'vendas', 'admin'], tipo: 'procurar', procura: '' },
  { id: 'fornecedor', nome: 'Consultar fornecedor', icone: 'factory', modulo: 'compras', perfis: ['compras', 'financeiro', 'admin'], tipo: 'procurar', procura: '' },
  { id: 'chegadas', nome: 'Chegadas de hoje', icone: 'package-open', modulo: 'armazem', perfis: ['armazem', 'compras', 'admin'], tipo: 'abrir', doc: 'CH 2026/0931' },
  { id: 'separacao', nome: 'Separação em curso', icone: 'list-checks', modulo: 'armazem', perfis: ['armazem', 'admin'], tipo: 'abrir', doc: 'SP 2026/2210' },
  { id: 'nova-ec', nome: 'Nova encomenda de cliente', icone: 'file-plus-2', modulo: 'vendas', perfis: ['vendas', 'admin'], tipo: 'criar' },
  { id: 'cliente', nome: 'Consultar cliente', icone: 'user-search', modulo: 'clientes', perfis: ['vendas', 'financeiro', 'admin'], tipo: 'procurar', procura: '' },
  { id: 'vencidas', nome: 'Faturas vencidas', icone: 'receipt-text', modulo: 'faturacao', perfis: ['financeiro', 'admin'], tipo: 'abrir', doc: 'FT 2026/05530' },
];

/* ---------- o fluxo das operações: só as etapas que existem nos módulos ---------- */
export interface Etapa { id: string; nome: string; modulo: Modulo; icone: string; conta: number; diz: string; docs: string[] }
export const ETAPAS: Etapa[] = [
  { id: 'compra', nome: 'Compra', modulo: 'compras', icone: 'shopping-cart', conta: 5, diz: '2 por aprovar · 2 atrasadas · 1 rascunho', docs: ['EF 2026/0402', 'EF 2026/0412', 'EF 2026/0408'] },
  { id: 'chegada', nome: 'Chegada', modulo: 'armazem', icone: 'package-open', conta: 1, diz: '1 chegada por arrumar; a chegada não é prevista', docs: ['CH 2026/0931', 'EF 2026/0411'] },
  { id: 'arrumacao', nome: 'Arrumação', modulo: 'armazem', icone: 'layers-3', conta: 46, diz: '46 artigos por arrumar · 1 correção de posição', docs: ['CH 2026/0931', 'CP 60·B·12·3'] },
  { id: 'venda', nome: 'Venda', modulo: 'vendas', icone: 'trending-up', conta: 3, diz: '1 com falta de stock · 1 orçamento a expirar', docs: ['EC 2026/1180', 'OR 2026/0219', 'EC 2026/1176'] },
  { id: 'separacao', nome: 'Separação', modulo: 'armazem', icone: 'list-checks', conta: 8, diz: '8 guias por separar até às 16:00', docs: ['SP 2026/2210'] },
  { id: 'expedicao', nome: 'Expedição', modulo: 'armazem', icone: 'truck', conta: 4, diz: '4 volumes para a recolha das 17:00', docs: ['EX 2026/1032'] },
  { id: 'faturacao', nome: 'Faturação', modulo: 'faturacao', icone: 'receipt-text', conta: 2, diz: '1 fatura vencida · 1 nota de crédito por aprovar', docs: ['FT 2026/05530', 'NC 2026/0088'] },
];

/* ---------- o painel de contexto e os avisos ---------- */
export interface Aviso { id: string; titulo: string; texto: string; quando: string; doc?: string; modulo: Modulo }
export const AVISOS: Record<IdPerfil, Aviso[]> = {
  compras: [
    { id: 'a1', titulo: 'A SKF respondeu', texto: 'Confirmou a EF 2026/0398 com entrega a 23/10.', quando: 'há 25 min', modulo: 'compras', doc: 'EF 2026/0412' },
    { id: 'a2', titulo: 'Chegada da Brembo', texto: 'Chegaram 6 linhas da EF 2026/0411.', quando: 'há 2 h', modulo: 'armazem', doc: 'EF 2026/0411' },
    { id: 'a3', titulo: 'Stock abaixo do mínimo', texto: '6206-2RSH: 140 un., mínimo 400.', quando: 'ontem', modulo: 'stocks' },
  ],
  armazem: [
    { id: 'a1', titulo: 'Chegou a SKF', texto: '3 paletes picadas à chegada.', quando: 'há 1 h', modulo: 'armazem', doc: 'CH 2026/0931' },
    { id: 'a2', titulo: 'Correção de posição', texto: 'Falta 6206-2RSH em 60 · B · 12 · 3.', quando: 'há 40 min', modulo: 'armazem', doc: 'CP 60·B·12·3' },
  ],
  vendas: [
    { id: 'a1', titulo: 'Encomenda nova', texto: 'Auto Peças Lima: EC 2026/1180.', quando: 'há 1 h', modulo: 'vendas', doc: 'EC 2026/1180' },
    { id: 'a2', titulo: 'Crédito excedido', texto: 'Recauchutagem Mondego.', quando: 'sexta', modulo: 'clientes', doc: 'EC 2026/1176' },
  ],
  financeiro: [
    { id: 'a1', titulo: 'Fatura recebida', texto: 'SKF: FF SKF/8841, por conferir.', quando: 'quinta', modulo: 'compras', doc: 'FF SKF/8841' },
    { id: 'a2', titulo: 'Nota de crédito pedida', texto: 'NC 2026/0088, Auto Peças Lima.', quando: 'sexta', modulo: 'faturacao', doc: 'NC 2026/0088' },
  ],
  admin: [
    { id: 'a1', titulo: 'Ligação com erro', texto: 'Transportadora: 2 falhas desde as 06:00.', quando: 'há 3 h', modulo: 'definicoes', doc: 'INT transportadora' },
    { id: 'a2', titulo: 'Aprovação parada', texto: 'EF 2026/0402 há 20 dias.', quando: 'hoje', modulo: 'compras', doc: 'EF 2026/0402' },
  ],
};
export const PRAZOS: Record<IdPerfil, { dia: string; texto: string; doc?: string }[]> = {
  compras: [{ dia: 'Ter 20', texto: 'Brembo · faltam 3 linhas', doc: 'EF 2026/0411' }, { dia: 'Sex 23', texto: 'SKF · entrega pedida', doc: 'EF 2026/0412' }, { dia: 'Sáb 14/11', texto: 'Vence FF SKF/8841', doc: 'FF SKF/8841' }],
  armazem: [{ dia: 'Hoje 16:00', texto: 'Saída da separação', doc: 'SP 2026/2210' }, { dia: 'Hoje 17:00', texto: 'Recolha da transportadora', doc: 'EX 2026/1032' }, { dia: 'Ter 20', texto: 'Brembo · 3 linhas por chegar', doc: 'EF 2026/0411' }],
  vendas: [{ dia: 'Ter 20', texto: 'Expira OR 2026/0219', doc: 'OR 2026/0219' }, { dia: 'Qua 21', texto: 'Entrega da EC 2026/1180', doc: 'EC 2026/1180' }],
  financeiro: [{ dia: 'Hoje', texto: 'Aprovar NC 2026/0088', doc: 'NC 2026/0088' }, { dia: 'Sáb 14/11', texto: 'Vence FF SKF/8841', doc: 'FF SKF/8841' }],
  admin: [{ dia: 'Hoje 17:00', texto: 'Recolha da transportadora', doc: 'EX 2026/1032' }, { dia: 'Sex 23', texto: 'Entrega da SKF', doc: 'EF 2026/0412' }],
};
export const ATIVIDADE: Record<IdPerfil, { quem: string; texto: string; quando: string }[]> = {
  compras: [{ quem: 'Carla Nunes', texto: 'pediu o preço novo da TRW', quando: '09:12' }, { quem: 'Ana Ferreira', texto: 'arrumou a chegada da UFI Filters', quando: 'sexta' }],
  armazem: [{ quem: 'Separação', texto: 'pôs 4 guias nos preparados', quando: '09:20' }, { quem: 'Rui Matos', texto: 'lembrou a TRW da EF 2026/0408', quando: 'sexta' }],
  vendas: [{ quem: 'Marta Lopes', texto: 'travou o crédito da Recauchutagem Mondego', quando: 'sexta' }],
  financeiro: [{ quem: 'Pedro Sousa', texto: 'pediu a NC 2026/0088', quando: 'sexta' }],
  admin: [{ quem: 'Sistema', texto: 'a cópia de segurança da noite correu bem', quando: '03:00' }],
};

/* ---------- o índice da procura (Ctrl+K) ---------- */
export type TipoProcura = 'Destinos' | 'Artigos' | 'Fornecedores' | 'Clientes' | 'Compras' | 'Vendas' | 'Armazém' | 'Faturação';
export interface Achado { tipo: TipoProcura; titulo: string; sub: string; modulo: Modulo; icone: string; doc?: string; ecra?: string; ref?: string; destino?: string }
export const INDICE: Achado[] = [
  ...MODULOS.flatMap((m) => [
    ...(m.id === 'inicio' ? [] : [{ tipo: 'Destinos' as const, titulo: m.nome, sub: 'Módulo', modulo: m.id, icone: m.icone, destino: m.id, ecra: m.id === 'compras' ? 'compras' as const : undefined }]),
    ...m.subs.map((s) => ({ tipo: 'Destinos' as const, titulo: s.nome, sub: m.nome, modulo: m.id, icone: m.icone, destino: s.id, ecra: s.ecra })),
  ]),
  { tipo: 'Artigos', titulo: '6206-2RSH · Rolamento rígido de esferas', sub: 'SKF · 140 un. no armazém 60 · mínimo 400', modulo: 'stocks', icone: 'circle-dot' },
  { tipo: 'Artigos', titulo: '6205-2Z · Rolamento rígido de esferas', sub: 'SKF · 1 320 un. no armazém 60', modulo: 'stocks', icone: 'circle-dot' },
  { tipo: 'Artigos', titulo: '30205 · Rolamento de rolos cónicos', sub: 'SKF · 20 un. · 40 a caminho', modulo: 'stocks', icone: 'circle-dot' },
  { tipo: 'Artigos', titulo: 'VKBA 6556 · Kit de rolamento de roda', sub: 'SKF · 64 un. no armazém 60', modulo: 'stocks', icone: 'circle-dot' },
  { tipo: 'Artigos', titulo: 'LGMT 2/1 · Massa lubrificante, 1 kg', sub: 'SKF · 85 un. no armazém 60', modulo: 'stocks', icone: 'droplet' },
  { tipo: 'Artigos', titulo: 'GDB1330 · Pastilhas de travão', sub: 'TRW · 12 un. · 400 a caminho', modulo: 'stocks', icone: 'disc' },
  { tipo: 'Fornecedores', titulo: 'SKF Portugal', sub: 'Fornecedor · 3 encomendas abertas', modulo: 'compras', icone: 'factory' },
  { tipo: 'Fornecedores', titulo: 'TRW', sub: 'Fornecedor · 1 encomenda atrasada', modulo: 'compras', icone: 'factory', doc: 'EF 2026/0408' },
  { tipo: 'Fornecedores', titulo: 'Brembo', sub: 'Fornecedor · 2 encomendas abertas', modulo: 'compras', icone: 'factory', doc: 'EF 2026/0411' },
  { tipo: 'Fornecedores', titulo: 'Bosch', sub: 'Fornecedor · 1 rascunho', modulo: 'compras', icone: 'factory', doc: 'EF 2026/0413' },
  { tipo: 'Fornecedores', titulo: 'Valeo', sub: 'Fornecedor · 1 encomenda atrasada', modulo: 'compras', icone: 'factory', doc: 'EF 2026/0407' },
  { tipo: 'Clientes', titulo: 'Auto Peças Lima', sub: 'Cliente · 1 encomenda aberta', modulo: 'clientes', icone: 'building-2', doc: 'EC 2026/1180' },
  { tipo: 'Clientes', titulo: 'Oficina Central de Coimbra', sub: 'Cliente · 1 orçamento', modulo: 'clientes', icone: 'building-2', doc: 'OR 2026/0219' },
  { tipo: 'Clientes', titulo: 'Recauchutagem Mondego', sub: 'Cliente · crédito excedido', modulo: 'clientes', icone: 'building-2', doc: 'EC 2026/1176' },
  ...Object.values(DOCS).map((d): Achado => ({
    tipo: d.modulo === 'compras' ? 'Compras' : d.modulo === 'vendas' ? 'Vendas' : d.modulo === 'armazem' ? 'Armazém' : d.modulo === 'faturacao' ? 'Faturação' : 'Destinos',
    titulo: `${d.ref} · ${d.entidade}`, sub: `${d.tipo} · ${d.estado}`, modulo: d.modulo, icone: 'file-text', doc: d.ref, ecra: d.ecra,
  })),
];
