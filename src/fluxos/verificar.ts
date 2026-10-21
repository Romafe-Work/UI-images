/* =========================================================
   ROMAFE — as regras dos fluxos (o briefing, §12)
   Cada ecrã referido existe na app; cada aresta liga nós que existem; cada nó tem entrada (menos os de início);
   cada ação, decisão, aviso e erro leva a algum lado (nada de becos); cada decisão tem pelo menos duas saídas;
   não há nós soltos. Aparece no visualizador e corre nos testes.
   ========================================================= */
import type { App, IdApp } from '../comum/tipos';
import type { Diagrama } from './dados';

export type Problema = { no?: string; texto: string };
export function verificar(d: Diagrama, apps: Record<IdApp, App>): Problema[] {
  const p: Problema[] = [];
  const ids = new Set(d.nos.map((x) => x.id));
  if (ids.size !== d.nos.length) p.push({ texto: 'Há nós com o mesmo id.' });
  d.arestas.forEach((a) => { if (!ids.has(a.de) || !ids.has(a.para)) p.push({ texto: `A seta ${a.de} → ${a.para} liga a um nó que não existe.` }); });
  const entra = (id: string) => d.arestas.some((a) => a.para === id), sai = (id: string) => d.arestas.filter((a) => a.de === id).length;
  d.nos.forEach((x) => {
    if (x.ecra) {
      const app = apps[x.ecra[0]];
      if (!app?.ecras.some((e) => e.id === x.ecra![1])) p.push({ no: x.id, texto: `«${x.texto}» aponta para um ecrã que não existe (${x.ecra.join(' · ')}).` });
    }
    if (x.tipo !== 'inicio' && !entra(x.id) && !(d.nos[0] === x && !d.nos.some((y) => y.tipo === 'inicio'))) p.push({ no: x.id, texto: `«${x.texto}» não tem entrada.` });
    if (['acao', 'decisao', 'aviso', 'erro', 'inicio'].includes(x.tipo) && !sai(x.id)) p.push({ no: x.id, texto: `«${x.texto}» não leva a lado nenhum.` });
    if (x.tipo === 'decisao' && sai(x.id) < 2) p.push({ no: x.id, texto: `A decisão «${x.texto}» só tem uma saída.` });
  });
  return p;
}
