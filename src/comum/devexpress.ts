/* =========================================================
   ROMAFE — que componente DevExpress é cada peça (12 out. 2026)
   Ela: «sei que vamos usar componentes da DevExpress; queria começar já
   a fazer referência a eles». Da reunião de 6 out.: DevExpress, com o
   mínimo de componentes possível.

   Ainda não está decidido se o ERP é de secretária (WPF) ou web (Vue):
   por isso cada peça leva as duas referências — DevExtreme (a biblioteca
   web da DevExpress, com componentes para Vue) e DevExpress WPF. A Pick
   é Kotlin nativo, e a DevExpress não tem componentes para Android nativo.

   A ordem conta: a primeira regra que serve é a que vale. Uma peça sem
   regra procura a do contentor mais próximo («faz parte de»).
   «—» quer dizer que não há componente: fica em CSS nosso.
   ========================================================= */
export interface Componente { peca: string; web: string; wpf: string; nota?: string }

const REGRAS: [string, Componente][] = [
  /* listas e tabelas */
  ['table, .cg-tabela, .erp-tabela, .er-tabela, .tabela-dados', { peca: 'Tabela', web: 'DxDataGrid', wpf: 'GridControl', nota: 'Ordenar, filtrar, paginar e «carregar mais» vêm do próprio componente.' }],
  ['.cg-mais', { peca: 'Carregar mais', web: 'DxDataGrid (scrolling: infinite)', wpf: 'GridControl (InfiniteSource)' }],
  ['.paginacao', { peca: 'Paginação', web: 'DxDataGrid (pager)', wpf: 'DataPager' }],

  /* campos */
  ['input[type="password"]', { peca: 'Palavra-passe', web: 'DxTextBox (mode: password)', wpf: 'PasswordBoxEdit' }],
  ['.procura, .procura__campo, .heroi2__procura, .heroi2__campo, input[type="search"]', { peca: 'Procura', web: 'DxAutocomplete', wpf: 'SearchControl', nota: 'Com sugestões enquanto se escreve.' }],
  ['input[type="checkbox"]', { peca: 'Caixa de escolha', web: 'DxCheckBox', wpf: 'CheckEdit' }],
  ['.opcoes:has(input[type="radio"]), input[type="radio"]', { peca: 'Escolha única', web: 'DxRadioGroup', wpf: 'ListBoxEdit (RadioListBoxEditStyleSettings)' }],
  ['select, .cg-select', { peca: 'Lista de escolha', web: 'DxSelectBox', wpf: 'ComboBoxEdit' }],
  ['input[inputmode="numeric"], .erp-celula', { peca: 'Número', web: 'DxNumberBox', wpf: 'SpinEdit' }],
  ['#erp-data, input[type="date"]', { peca: 'Data', web: 'DxDateBox', wpf: 'DateEdit' }],
  ['input, textarea', { peca: 'Campo de texto', web: 'DxTextBox', wpf: 'TextEdit' }],
  ['.campo__erro', { peca: 'Mensagem do campo', web: 'DxValidator', wpf: 'Validação do editor (ValidationErrorTemplate)' }],
  ['.er-resumo:has(ul)', { peca: 'Resumo dos erros', web: 'DxValidationSummary', wpf: '— (lista nossa ligada aos erros dos editores)' }],
  ['.erp-form, .erp-filtros, .cg-filtros, .c22__form', { peca: 'Formulário', web: 'DxForm', wpf: 'DataLayoutControl' }],

  /* botões */
  ['.conta, .erp__empresa', { peca: 'Menu da conta', web: 'DxDropDownButton', wpf: 'DropDownButton' }],
  ['.btn, .carrossel__seta, .c22__seta, .populares__chip, .cat4__item, .cat5__item, .c22__atalho', { peca: 'Botão', web: 'DxButton', wpf: 'SimpleButton', nota: 'Sempre com ícone e texto.' }],
  ['.portal__icone', { peca: 'Botão de ícone', web: 'DxButton (só ícone, com hint)', wpf: 'SimpleButton (só ícone, com ToolTip)' }],

  /* navegação */
  ['.portal__abas, .linha__abas, .aba, .linha__aba, .carrossel__escolha, .carrossel__opcao', { peca: 'Abas', web: 'DxTabs', wpf: 'DXTabControl' }],
  ['.lado, .lado5, .erp__lado, .lado__item, .lado5__item, .erp__modulo, .erp__subitem', { peca: 'Menu lateral', web: 'DxDrawer com DxTreeView', wpf: 'AccordionControl' }],
  ['.carrossel, .c22__carrossel, .prisma', { peca: 'Carrossel', web: 'DxGallery', wpf: 'FlipView (a confirmar)', nota: 'O 3D é CSS nosso, por cima do componente.' }],

  /* espera e avisos */
  ['.progresso', { peca: 'Barra de progresso', web: 'DxProgressBar', wpf: 'ProgressBarEdit' }],
  ['.girador', { peca: 'Girador', web: 'DxLoadIndicator', wpf: 'WaitIndicator' }],
  ['.esq', { peca: 'Esqueleto', web: '— (CSS nosso)', wpf: '— (CSS nosso)', nota: 'Nenhuma das duas tem esqueletos.' }],
  ['.cg-dialogo, .er-dialogo', { peca: 'Diálogo', web: 'DxPopup', wpf: 'ThemedWindow (DXDialogWindow)' }],
  ['.cg-toast', { peca: 'Aviso pequeno', web: 'DxToast (notify)', wpf: 'NotificationService' }],
  ['.er-faixa', { peca: 'Faixa de aviso', web: '— (CSS nosso)', wpf: '— (CSS nosso)' }],
  ['.portal__selo', { peca: 'Contador', web: '— (badge do DxButton não existe: CSS nosso)', wpf: '— (CSS nosso)' }],
];

/** O componente desta peça, ou o do contentor mais próximo que tenha um. */
export function componenteDe(peca: Element): { c: Componente; propria: boolean; de: Element } | null {
  /* um campo (rótulo + controlo) é o componente do controlo que tem dentro */
  if (peca.matches('.campo, .campo__caixa, .opcao, .cg-input-girador')) {
    const controlo = peca.querySelector('select, input, textarea');
    if (controlo) {
      const r = componenteDe(controlo);
      if (r) return { ...r, propria: true };
    }
  }
  for (let e: Element | null = peca; e && e !== document.body; e = e.parentElement) {
    for (const [sel, c] of REGRAS) {
      try { if (e.matches(sel)) return { c, propria: e === peca, de: e }; } catch { /* :has() num motor antigo */ }
    }
  }
  return null;
}

/** A tabela inteira, para o LEIA-ME e para quem procura. */
export const TABELA_DEVEXPRESS = REGRAS.map(([, c]) => c);
