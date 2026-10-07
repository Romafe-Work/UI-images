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
}

export type IdApp = 'erp' | 'goshop' | 'goparts' | 'mobile';

export interface App<Id extends string = string> {
  id: IdApp;
  nome: string;
  sub: string;
  /** a família a que a app pertence na porta de entrada: o GoShop e o GoParts são «Web» */
  grupo: 'ERP' | 'Web' | 'Mobile';
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
