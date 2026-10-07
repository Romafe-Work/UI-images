/* =========================================================
   ROMAFE — o que é uma app e o que é um ecrã
   ========================================================= */

/** O tamanho da tela de uma app, em píxeis. */
export interface Tela { l: number; a: number }

/** Um ecrã. `Id` é a lista fechada dos ecrãs da app: uma ligação para um
    ecrã que não existe não compila. */
export interface Ecra<Id extends string = string> {
  id: Id;
  /** «01 · Entrar» — o número e o nome, como aparece no seletor e no mapa */
  nome: string;
  fluxo: string;
  /** para que serve, numa ou duas frases; aparece no mapa e na procura */
  objetivo: string;
  /** o HTML do ecrã, já montado a partir da base */
  html: string;
}

export type IdApp = 'erp' | 'web' | 'mobile';

export interface App<Id extends string = string> {
  id: IdApp;
  nome: string;
  sub: string;
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
