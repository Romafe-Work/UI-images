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
  /* ERP, 00 · Abertura v2 (19 out. 2026) */
  ['.ab2__palco, .ab2__plano, .ab2__moldura', { peca: 'A estrutura da abertura', web: '— (SVG e CSS nossos)', wpf: '— (Viewport3D ou um vídeo da sequência)', nota: 'Decorativa; sem ela, a composição final parada.' }],
  ['.ab2__lista, .ab2__mod', { peca: 'Lançador de módulos', web: 'DxTileView', wpf: 'TileLayoutControl', nota: 'Só os módulos que existem se clicam.' }],
  ['.ab2__tema', { peca: 'Escolha do tema', web: 'DxButtonGroup', wpf: 'ToggleSwitch / SegmentedControl' }],
  /* ERP · Compras, fase 1 (19 out. 2026) */
  ['.cp-tabela--linhas, .cp-tabela--linhas .cp-celula', { peca: 'Linhas da encomenda', web: 'DxDataGrid (editing: cell, keyboardNavigation)', wpf: 'GridControl (TableView, EditorShowMode)', nota: 'Enter passa à célula de baixo; o total refaz-se a cada valor.' }],
  ['.cp-tabela--rec, .cp-tabela--rec .cp-celula', { peca: 'Linhas da receção', web: 'DxDataGrid (editing: cell)', wpf: 'GridControl (TableView)' }],
  ['.cp-tabela, .cp-ordenar', { peca: 'Lista de documentos', web: 'DxDataGrid (sorting, filterRow off)', wpf: 'GridControl', nota: 'Abaixo de 720 px, cartões (columnHidingEnabled ou um DxList à parte).' }],
  ['.cp-filtros, .cp-filtro', { peca: 'Filtro por estado', web: 'DxButtonGroup', wpf: 'ListBoxEdit (botões)' }],
  ['.cp-percurso, .cp-passo', { peca: 'Percurso do documento', web: '— (CSS nosso; DxButton nos passos com documento)', wpf: '— (ItemsControl com template nosso)', nota: 'Só se pinta o que aconteceu.' }],
  ['.cp-resumo-fin, .cp-contas', { peca: 'Resumo financeiro', web: 'DxForm (só leitura) ou CSS nosso', wpf: 'DataLayoutControl (só leitura)' }],
  ['.cp-gaveta, .cp-art', { peca: 'Juntar artigo', web: 'DxDrawer com DxList (searchEnabled)', wpf: 'FlyoutControl com ListBoxEdit e SearchControl' }],
  ['.cp-mais, .cp-mais__menu', { peca: 'Mais ações', web: 'DxDropDownButton', wpf: 'DropDownButton' }],
  ['.cp-faixa', { peca: 'Faixa de aviso', web: '— (CSS nosso)', wpf: '— (InfoBar nosso)' }],
  ['.cp-ler, .cp-ler input', { peca: 'Leitura de código', web: 'DxTextBox (o leitor é um teclado)', wpf: 'TextEdit' }],
  ['.cp-percurso + .cp-editor .cp-input, .cp-campos .cp-input, .cp-campos .cp-select', { peca: 'Campos do cabeçalho', web: 'DxForm (DxTextBox, DxDateBox, DxSelectBox)', wpf: 'DataLayoutControl (TextEdit, DateEdit, ComboBoxEdit)' }],
  /* ERP, 05 · Início (19 out. 2026): primeiro, para ganharem às regras gerais */
  ['.ws-paleta, .ws-paleta__input, .ws-procura', { peca: 'Procura global (Ctrl+K)', web: 'DxPopup com DxTextBox e DxList (grouped)', wpf: 'SearchControl num ThemedWindow (ou HamburgerMenu search)', nota: 'Resultados por tipo, pedidos à API; setas, Enter e Esc.' }],
  ['.ws-lado, .ws-lado__item, .ws-lado__sub', { peca: 'Barra lateral', web: 'DxDrawer com DxTreeView', wpf: 'AccordionControl (ou HamburgerMenu)', nota: 'Recolhe-se; procura de módulos, fixados e recentes.' }],
  ['.ws-lado__campo', { peca: 'Procurar módulo', web: 'DxTextBox (mode: search) a filtrar o DxTreeView', wpf: 'AccordionControl (ShowSearchControl)' }],
  ['.ws-pris, .ws-pri', { peca: 'As minhas prioridades', web: 'DxList (itemTemplate) com DxButton na linha', wpf: 'GridControl (TableView sem cabeçalho) ou ListBoxEdit com template', nota: 'A ação na linha; ao tratar, a linha sai com animação nossa.' }],
  ['.ws-filtros, .ws-filtro', { peca: 'Filtro das prioridades', web: 'DxButtonGroup', wpf: 'ListBoxEdit (botões)' }],
  ['.ws-conts, .ws-cont', { peca: 'Continuar onde fiquei', web: 'DxList', wpf: 'ListBoxEdit com template', nota: 'Os recentes vêm da API, por utilizador.' }],
  ['.ws-ops, .ws-op', { peca: 'Acesso rápido', web: 'DxTileView (ou DxButton)', wpf: 'TileLayoutControl' }],
  ['.ws-fluxo, .ws-fluxo__no', { peca: 'O fluxo das operações', web: '— (SVG e CSS nossos; DxButton nos nós)', wpf: '— (ItemsControl com template nosso)', nota: 'Nenhuma das duas tem um diagrama de processo destes.' }],
  ['.ws-contexto, .ws-ctx', { peca: 'Painel de contexto', web: 'DxDrawer (position: right) ou DxScrollView', wpf: 'DockLayoutManager (LayoutPanel recolhível)' }],
  ['.ws-menu--avisos, .ws-topo__avisos', { peca: 'Avisos', web: 'DxPopover com DxList', wpf: 'FlyoutControl com ListBoxEdit' }],
  ['.ws-menu--conta, .ws-conta', { peca: 'Menu da conta', web: 'DxDropDownButton (ou DxPopover)', wpf: 'DropDownButton com PopupControlContainer' }],
  ['.ws-menu--criar, .ws-topo__criar', { peca: 'Criar', web: 'DxDropDownButton', wpf: 'DropDownButton (SplitButton)' }],
  ['.ws-painel', { peca: 'Documento no painel', web: 'DxDrawer (position: right, openedStateMode: overlap)', wpf: 'FlyoutControl (ou DockLayoutManager)' }],
  ['.ws-dialogo', { peca: 'Personalizar o meu espaço', web: 'DxPopup com DxForm', wpf: 'ThemedWindow (DXDialogWindow) com DataLayoutControl' }],
  ['.ws-ordem, .ws-ordem__item', { peca: 'Ordenar o acesso rápido', web: 'DxList (itemDragging) ou DxSortable', wpf: 'ListBoxEdit (AllowDrop) / GridControl com DragDropManager' }],
  ['.ws-interruptor', { peca: 'Interruptor', web: 'DxSwitch', wpf: 'ToggleSwitchEdit' }],
  ['.ws-tema', { peca: 'Escolha do tema', web: 'DxButtonGroup', wpf: 'ToggleSwitch / SegmentedControl' }],
  ['.ws-toast', { peca: 'Aviso pequeno', web: 'DxToast (notify)', wpf: 'NotificationService' }],
  /* listas e tabelas */
  ['table, .cg-tabela, .erp-tabela, .er-tabela, .tabela-dados', { peca: 'Tabela', web: 'DxDataGrid', wpf: 'GridControl', nota: 'Ordenar, filtrar, paginar e «carregar mais» vêm do próprio componente.' }],
  ['.cg-mais', { peca: 'Carregar mais', web: 'DxDataGrid (scrolling: infinite)', wpf: 'GridControl (InfiniteSource)' }],
  ['.paginacao', { peca: 'Paginação', web: 'DxDataGrid (pager)', wpf: 'DataPager' }],

  /* campos */
  ['input[type="password"]', { peca: 'Palavra-passe', web: 'DxTextBox (mode: password)', wpf: 'PasswordBoxEdit' }],
  ['.procura, .procura__campo, .heroi2__procura, .heroi2__campo, input[type="search"]', { peca: 'Procura', web: 'DxAutocomplete', wpf: 'SearchControl', nota: 'Com sugestões enquanto se escreve.' }],
  ['input[type="checkbox"]', { peca: 'Caixa de escolha', web: 'DxCheckBox', wpf: 'CheckEdit' }],
  ['.opcoes:has(input[type="radio"]), input[type="radio"]', { peca: 'Escolha única', web: 'DxRadioGroup', wpf: 'ListBoxEdit (RadioListBoxEditStyleSettings)' }],
  ['select, .cg-select, .sel__botao, .sel__lista', { peca: 'Lista de escolha', web: 'DxSelectBox', wpf: 'ComboBoxEdit' }],
  ['input[inputmode="numeric"], .erp-celula', { peca: 'Número', web: 'DxNumberBox', wpf: 'SpinEdit' }],
  ['#erp-data, input[type="date"]', { peca: 'Data', web: 'DxDateBox', wpf: 'DateEdit' }],
  ['input, textarea', { peca: 'Campo de texto', web: 'DxTextBox', wpf: 'TextEdit' }],
  ['.campo__erro', { peca: 'Mensagem do campo', web: 'DxValidator', wpf: 'Validação do editor (ValidationErrorTemplate)' }],
  ['.er-resumo:has(ul)', { peca: 'Resumo dos erros', web: 'DxValidationSummary', wpf: '— (lista nossa ligada aos erros dos editores)' }],
  ['.erp-form, .erp-filtros, .cg-filtros, .c22__form', { peca: 'Formulário', web: 'DxForm', wpf: 'DataLayoutControl' }],

  /* botões */
  ['.conta, .erp__empresa', { peca: 'Menu da conta', web: 'DxDropDownButton', wpf: 'DropDownButton' }],
  ['.btn, .carrossel__seta, .c22__seta, .populares__chip, .cat4__item, .cat5__item', { peca: 'Botão', web: 'DxButton', wpf: 'SimpleButton', nota: 'Sempre com ícone e texto.' }],
  ['.portal__icone', { peca: 'Botão de ícone', web: 'DxButton (só ícone, com hint)', wpf: 'SimpleButton (só ícone, com ToolTip)' }],

  /* navegação */
  ['.portal__abas, .linha__abas, .aba, .linha__aba, .carrossel__escolha, .carrossel__opcao, .cp-abas, .cp-aba', { peca: 'Abas', web: 'DxTabs', wpf: 'DXTabControl' }],
  ['.cat2__passos, .cat2__passo', { peca: 'Passos', web: 'DxTabs (ou DxMultiView com passos)', wpf: 'WizardControl' }],
  ['.ped2__estados, .ped2__estado-aba', { peca: 'Filtro por estado', web: 'DxButtonGroup', wpf: 'ListBoxEdit (botões)' }],
  ['.cat2__grelha, .cat2__lista-modelos', { peca: 'Grelha de escolha', web: 'DxTileView', wpf: 'TileLayoutControl' }],
  ['.lado, .lado5, .erp__lado, .lado__item, .lado5__item, .erp__modulo, .erp__subitem', { peca: 'Menu lateral', web: 'DxDrawer com DxTreeView', wpf: 'AccordionControl' }],
  ['.carrossel, .c22__carrossel, .prisma', { peca: 'Carrossel', web: 'DxGallery', wpf: 'FlipView (a confirmar)', nota: 'O 3D é CSS nosso, por cima do componente.' }],

  ['.acordeao, .acord', { peca: 'Acordeão', web: 'DxAccordion', wpf: 'AccordionControl' }],
  ['.cartao4__lista, .cp-itens', { peca: 'Lista', web: 'DxList', wpf: 'ListBoxEdit' }],

  /* espera e avisos */
  ['.progresso', { peca: 'Barra de progresso', web: 'DxProgressBar', wpf: 'ProgressBarEdit' }],
  ['.girador', { peca: 'Girador', web: 'DxLoadIndicator', wpf: 'WaitIndicator' }],
  ['.esq', { peca: 'Esqueleto', web: '— (CSS nosso)', wpf: '— (CSS nosso)', nota: 'Nenhuma das duas tem esqueletos.' }],
  ['.cg-dialogo, .er-dialogo', { peca: 'Diálogo', web: 'DxPopup', wpf: 'ThemedWindow (DXDialogWindow)' }],
  ['.cg-toast', { peca: 'Aviso pequeno', web: 'DxToast (notify)', wpf: 'NotificationService' }],
  /* ERP, v10 do início de sessão (19 out. 2026) */
  ['.rede__tema', { peca: 'Escolha do tema', web: 'DxButtonGroup', wpf: 'ToggleSwitch / SegmentedControl', nota: 'Claro, escuro ou o do sistema; fica guardado.' }],
  ['.rede__aviso', { peca: 'Aviso no formulário', web: '— (CSS nosso)', wpf: '— (CSS nosso)' }],
  /* ERP, 00 · Abertura (19 out. 2026) */
  ['.erp-ab__cena, .erp-ab__rede', { peca: 'A abertura em 3D', web: '— (Three.js)', wpf: '— (Viewport3D, ou um vídeo da sequência)', nota: 'Decorativa e de uma só vez por sessão; sem WebGL, só o logótipo.' }],
  ['.erp-ab__rotulo, .erp-ab__cotas', { peca: 'Dados do artigo na vista explodida', web: '— (CSS nosso, por cima da cena)', wpf: '— (Adorner por cima do Viewport3D)' }],
  ['.rede__palco, .rede__canvas', { peca: 'A rede ao fundo', web: '— (Three.js)', wpf: '— (Viewport3D ou imagem parada)', nota: 'Decorativa: sem ela, o desenho parado em SVG.' }],
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
