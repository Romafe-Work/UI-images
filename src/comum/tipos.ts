/* =========================================================
   ROMAFE — o que é uma app e o que é um ecrã
   ========================================================= */

/** O tamanho da tela de uma app, em píxeis. */
export interface Tela { l: number; a: number }

/** Uma versão de um ecrã: v1, v2… A mais antiga fica, para se comparar. */
export interface Versao {
  /** «v1», «v2»… */
  id: string;
  /** o que esta versão muda, numa frase; aparece no separador */
  nota: string;
  html: string;
}

/** Um ecrã. `Id` é a lista fechada dos ecrãs da app: uma ligação para um
    ecrã que não existe não compila. */
export interface Ecra<Id extends string = string> {
  id: Id;
  /** «01 · Entrar» — o número e o nome, como aparece no seletor e no mapa */
  nome: string;
  fluxo: string;
  /** para que serve, numa ou duas frases; aparece no mapa e na procura */
  objetivo: string;
  /** as versões do ecrã, da mais antiga para a mais nova; há sempre uma */
  versoes: [Versao, ...Versao[]];
  /** Um estado (a carregar, erro, vazio…) de outro ecrã (12 out. 2026: ela pediu
      os estados escolhidos no próprio ecrã, por baixo das versões, e não como
      ecrãs soltos 10.1, 10.2…). Não aparece no seletor nem no mapa. */
  estadoDe?: Id;
  /** (15 out. 2026, ela: «no fluxo quero que mostres exemplos de diálogos abertos») um estado que, mesmo assim, aparece no
      mapa, logo a seguir ao seu ecrã, com esta etiqueta (ex.: «Diálogo aberto»). */
  noFluxo?: string;
  /** (28 out. 2026, ela: «no menu lateral só quero início e as compras») um ecrã que existe e abre (por uma ligação, um
      separador da área de trabalho) mas não aparece no seletor nem no mapa. */
  foraDaLista?: boolean;
}

export type IdApp = 'erp' | 'goshop' | 'goparts' | 'mobile' | 'identidade';

export interface App<Id extends string = string> {
  id: IdApp;
  /** a pasta da página, quando não é o id (21 out.: o Peça A Peça vive em peca-a-peca/, o id fica goparts) */
  pasta?: string;
  nome: string;
  sub: string;
  /** o tipo de aplicação na porta de entrada: o GoShop é a WebShop e o Peça A Peça o MarketPlace */
  grupo: 'ERP' | 'WebShop' | 'MarketPlace' | 'Pick' | 'Identidade';
  /** o nome no canto do editor e no título do mapa */
  marca: string;
  tela: Tela;
  /** a descrição de cada fluxo, pela ordem em que aparecem no mapa */
  fluxos: Record<string, string>;
  ecras: Ecra<Id>[];
}

/** O atributo que leva a outro ecrã, tipado pela app:
    `${ir('palavra-passe')}` dá `data-ir="palavra-passe"`. */
export function ligacoes<Id extends string>() {
  return (id: Id): string => `data-ir="${id}"`;
}
