/* =========================================================
   PICK — o início de sessão no PDA (29 out. 2026)
   Ela: «para mobile não te esqueças da login page, mostra-a, só muda os tamanhos das coisas». A mesma página da
   ROMAFE Identity (identidade/ecras.ts, v2 escura), aqui no ecrã do PDA: as mesmas peças e os mesmos textos, só os
   tamanhos mudam (css/login-pick.css). O e-mail leva à palavra-passe, «Entrar» à abertura da Pick; «Entrar outra vez»
   e o voltar do Centro de operações voltam aqui.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { entrada, passe, recuperar, paraV2 } from '../identidade/ecras';

const ROTAS: [RegExp, string][] = [
  [/data-ir="entrada"/g, 'data-ir="pk-login"'], [/data-ir="recuperar"/g, 'data-ir="pk-recuperar"'],
  [/ data-id-continuar/g, ' data-ir="pk-login-passe"'], [/ data-id-entrar/g, ' data-ir="abertura"'],
  [/<form /g, '<div '], [/<\/form>/g, '</div>'], [/type="submit"/g, 'type="button"'],
  [/no <b>Peça A Peça<\/b>/g, 'na <b>Pick</b>'], [/A abrir o Peça A Peça…/g, 'A abrir a Pick…'],
];
/** A página da Identity, com as ligações para os ecrãs da Pick e sem formulários (no protótipo não se submete). */
export const paraPick = (html: string) => `<div class="gpk-login">${ROTAS.reduce((h, [r, s]) => h.replace(r, s), paraV2(html))}</div>`;
const enviar = (html: string) => html.replace(/(<button type="button" class="btn btn--acao id__btn id__btn--acao")(>[\s\S]*?Enviar a ligação)/, '$1 data-ir="pk-recuperar-enviado"$2');

export function ecrasLoginPick<T extends string>(): Ecra<T>[] {
  const FLUXO = 'Entrar', NOTA = 'A página da ROMAFE Identity no PDA (29 out.): a mesma, com os tamanhos do ecrã de 320 × 533';
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<T> => ({ id: id as T, nome, fluxo: FLUXO, objetivo, ...(de ? { estadoDe: de as T } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  return [
    e('pk-login', '01 · Entrar', 'A página da ROMAFE Identity, a mesma das outras aplicações, no ecrã do PDA: o e-mail e «Continuar», «Para continuar na Pick».', paraPick(entrada('de-app'))),
    e('pk-login-erro', '01.1 · E-mail incompleto', 'O e-mail sem domínio: diz-se como se escreve.', paraPick(entrada('erro-email')), 'pk-login'),
    e('pk-login-sem-rede', '01.2 · Sem ligação', 'Sem rede não se entra: o que se escreveu fica no campo.', paraPick(entrada('offline')), 'pk-login'),
    e('pk-login-sessao', '01.3 · Sessão terminada', 'Vem de «Entrar outra vez»: por segurança entra-se de novo e volta-se ao sítio onde se estava.', paraPick(entrada('sessao')), 'pk-login'),
    e('pk-login-passe', '02 · Palavra-passe', 'O e-mail à vista com «Mudar»; a palavra-passe; «Entrar» abre a Pick.', paraPick(passe())),
    e('pk-login-credenciais', '02.1 · Credenciais erradas', 'Não diz qual dos dois está mal; às 5 tentativas a conta bloqueia 15 minutos.', paraPick(passe('credenciais')), 'pk-login-passe'),
    e('pk-login-bloqueada', '02.2 · Conta bloqueada', 'Demasiadas tentativas: esperar ou mudar a palavra-passe.', paraPick(passe('bloqueada')), 'pk-login-passe'),
    e('pk-recuperar', '03 · Mudar a palavra-passe', 'O e-mail e «Enviar a ligação»; a resposta é a mesma quer o e-mail tenha conta, quer não.', enviar(paraPick(recuperar()))),
    e('pk-recuperar-enviado', '03.1 · Ligação enviada', '«Se este e-mail tiver conta…»: não revela se tem.', paraPick(recuperar(true)), 'pk-recuperar'),
  ];
}
