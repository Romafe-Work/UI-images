/* =========================================================
   GOPARTS — o carrinho: um só estado para o portal todo (16 out. 2026)
   Da navbar (briefing dela): o número no ícone, o mini-carrinho, o Catálogo («Pedir») e a Minha lista («Pôr no
   carrinho») leem e escrevem aqui. Guardado no navegador (localStorage), por isso passa de ecrã em ecrã, sobrevive
   a recarregar a página e acompanha outras abas (evento «storage»).
   Cada mudança é otimista: o número muda logo, e o servidor confirma depois. Sem servidor neste protótipo, a
   confirmação é simulada; sem rede (navigator.onLine falso) falha, e a mudança desfaz-se com o aviso.
   O número do ícone conta UNIDADES (2 × VKBA 6556 + 1 × VKPC 88618 = 3), não linhas.
   Integração por fazer: GET/POST/PATCH/DELETE do carrinho do GoParts, e o preço/stock de cada referência.
   ========================================================= */
import { REFERENCIAS, saida, type Referencia } from '../portal/catalogo-dados';

export type LinhaCarrinho = { ref: string; qtd: number };
const CHAVE = 'goparts:carrinho:v1';
/* o carrinho de exemplo da primeira visita: o «3» que o ícone sempre mostrou */
const INICIAL: LinhaCarrinho[] = [{ ref: 'VKBA 6556', qtd: 2 }, { ref: 'VKPC 88618', qtd: 1 }];

let linhas: LinhaCarrinho[] = ler();
const ouvintes = new Set<(motivo: Motivo) => void>();
export type Motivo = { tipo: 'mudou' | 'falhou' | 'confirmado'; ref?: string; texto?: string };

function ler(): LinhaCarrinho[] {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v === null) return INICIAL.map((l) => ({ ...l }));
    const lido = JSON.parse(v) as LinhaCarrinho[];
    return Array.isArray(lido) ? lido.filter((l) => REFERENCIAS.some((r) => r[2] === l.ref) && Number.isInteger(l.qtd) && l.qtd > 0) : [];
  } catch { return INICIAL.map((l) => ({ ...l })); }
}
function gravar(): void { try { localStorage.setItem(CHAVE, JSON.stringify(linhas)); } catch { /* sem armazenamento: fica só nesta página */ } }
function avisar(m: Motivo): void { ouvintes.forEach((f) => f(m)); }

export const ouvir = (f: (m: Motivo) => void) => { ouvintes.add(f); return () => ouvintes.delete(f); };
export const todas = () => linhas.map((l) => ({ ...l }));
export const unidades = () => linhas.reduce((s, l) => s + l.qtd, 0);
export const referencia = (ref: string): Referencia | undefined => REFERENCIAS.find((r) => r[2] === ref);
/** O preço que a oficina paga (líquido, sem IVA): PVP × (1 − desconto). */
export const liquido = (r: Referencia) => Math.round(r[4] * (1 - r[5] / 100) * 100) / 100;
export const disponibilidade = (r: Referencia) => saida(r[6], r[7]);
export function contas() {
  const base = Math.round(linhas.reduce((s, l) => { const r = referencia(l.ref); return s + (r ? liquido(r) * l.qtd : 0); }, 0) * 100) / 100;
  const iva = Math.round(base * 0.23 * 100) / 100;
  return { base, iva, total: Math.round((base + iva) * 100) / 100, unidades: unidades(), linhas: linhas.length };
}

/** Muda já (otimista) e pede a confirmação; se falhar, repõe o que estava e diz porquê. */
function mudar(fazer: () => void, ref: string, texto: string): Promise<boolean> {
  const antes = linhas.map((l) => ({ ...l }));
  fazer(); gravar(); avisar({ tipo: 'mudou', ref, texto });
  return new Promise((ok) => {
    window.setTimeout(() => {
      if (!navigator.onLine) {
        linhas = antes; gravar();
        avisar({ tipo: 'falhou', ref, texto: 'Sem ligação: o carrinho não mudou. Tente quando a ligação voltar.' });
        ok(false); return;
      }
      avisar({ tipo: 'confirmado', ref, texto }); ok(true);
    }, 350);
  });
}
export function adicionar(ref: string, qtd = 1): Promise<boolean> {
  const r = referencia(ref); if (!r || qtd < 1) return Promise.resolve(false);
  return mudar(() => {
    const l = linhas.find((x) => x.ref === ref);
    if (l) l.qtd += qtd; else linhas.push({ ref, qtd });
  }, ref, `${r[1]} ${r[2]} · ${qtd} ${qtd === 1 ? 'unidade' : 'unidades'} no carrinho`);
}
export function quantidade(ref: string, qtd: number): Promise<boolean> {
  if (!Number.isInteger(qtd) || qtd < 1) return Promise.resolve(false);
  return mudar(() => { const l = linhas.find((x) => x.ref === ref); if (l) l.qtd = qtd; }, ref, '');
}
export function tirar(ref: string): Promise<boolean> {
  const r = referencia(ref);
  return mudar(() => { linhas = linhas.filter((x) => x.ref !== ref); }, ref, r ? `${r[1]} ${r[2]} saiu do carrinho` : '');
}
export function repor(l: LinhaCarrinho, indice: number): Promise<boolean> {
  return mudar(() => { if (!linhas.some((x) => x.ref === l.ref)) linhas.splice(Math.min(indice, linhas.length), 0, { ...l }); }, l.ref, '');
}
/** Ao terminar a sessão: o carrinho é da conta, não fica no navegador. */
export function esquecer(): void { linhas = []; try { localStorage.removeItem(CHAVE); } catch { /* nada */ } avisar({ tipo: 'mudou' }); }

/* outra aba mudou o carrinho */
window.addEventListener('storage', (ev) => { if (ev.key === CHAVE) { linhas = ler(); avisar({ tipo: 'mudou' }); } });
