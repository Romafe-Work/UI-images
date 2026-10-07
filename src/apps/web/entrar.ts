/* =========================================================
   WEB — o que o início de sessão tem de próprio na Web
   Completa, como o ERP. A marca e os textos são provisórios.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

const discurso = (titulo: string, frase: string): string => `
    <section class="discurso">
      <h1 class="discurso__titulo">${titulo}</h1>
      <p class="discurso__assinatura">${frase}</p>
    </section>`;

export const entrarWeb: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'ROMAFE', sub: 'Web' },
  produto: 'site da Romafe',
  discurso: {
    entrada: discurso('Uma conta<br>para tudo', 'A mesma conta entra no ERP, na Web e no Mobile.'),
    palavraPasse: discurso('Uma conta<br>da Romafe', 'O endereço é de uma conta criada pela Romafe. A palavra-passe confirma-se aqui.'),
    federado: discurso('A conta<br>é da sua empresa', 'A Romafe não vê a sua palavra-passe. Quem a confirma é a sua empresa, e devolve-o aqui já com a sessão aberta.'),
  },
};
