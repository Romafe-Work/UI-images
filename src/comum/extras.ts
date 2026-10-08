/* =========================================================
   ROMAFE — versões e ecrãs criados no próprio editor
   Ela, 8 out. 2026: «permite neste figma adicionar versões, copiar ecrãs».
   O site é estático (GitHub Pages), por isso o que se cria fica neste
   navegador (localStorage); «Exportar» dá um ficheiro .json com tudo, e
   «Importar» volta a pô-lo — noutro navegador ou no código, por mim.
   ========================================================= */
import type { App, Versao } from './tipos';

export interface EcraExtra { id: string; nome: string; fluxo: string; objetivo: string; depois: string; versoes: Versao[] }
export interface Extras { versoes: Record<string, Versao[]>; ecras: EcraExtra[] }

const chave = (app: string) => 'romafe:' + app + ':extras:v1';

export function lerExtras(app: string): Extras {
  try {
    const g = JSON.parse(localStorage.getItem(chave(app)) || '{}') as Partial<Extras>;
    return { versoes: g.versoes || {}, ecras: g.ecras || [] };
  } catch (e) { return { versoes: {}, ecras: [] }; }
}

export function gravarExtras(app: string, x: Extras): void {
  try { localStorage.setItem(chave(app), JSON.stringify(x)); } catch (e) { /* sem armazenamento */ }
}

/** Junta à app, antes de se desenhar, o que se criou no editor. */
export function juntarExtras(app: App): Set<string> {
  const x = lerExtras(app.id);
  const locais = new Set<string>();
  x.ecras.forEach((e) => {
    const i = app.ecras.findIndex((b) => b.id === e.depois);
    const novo = { id: e.id, nome: e.nome, fluxo: e.fluxo, objetivo: e.objetivo, versoes: e.versoes.map((v) => ({ ...v })) as [Versao, ...Versao[]] };
    app.ecras.splice(i < 0 ? app.ecras.length : i + 1, 0, novo as App['ecras'][number]);
    e.versoes.forEach((v) => locais.add(e.id + '|' + v.id));
    locais.add(e.id);
  });
  Object.keys(x.versoes).forEach((id) => {
    const ecra = app.ecras.find((e) => e.id === id);
    if (!ecra) return;
    x.versoes[id].forEach((v) => { ecra.versoes.push({ ...v }); locais.add(id + '|' + v.id); });
  });
  return locais;
}
