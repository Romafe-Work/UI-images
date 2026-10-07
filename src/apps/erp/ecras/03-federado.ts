import { ir, type EcraErp } from '../ids';
import { entrada } from '../bases/entrada';

export const federado: EcraErp = {
  id: 'federado',
  nome: '03 · O início de sessão da empresa',
  fluxo: 'Entrar',
  objetivo: 'Passo 2, cliente federado: o domínio pertence a uma organização com fornecedor próprio (por exemplo o Entra ID da empresa). A palavra-passe e o segundo fator são do cliente; a página não é nossa. Volta à aplicação já com o token.',
  html: entrada({
    discurso: `
<section class="discurso">
      <h1 class="discurso__titulo">A conta<br>é da sua empresa</h1>
      <p class="discurso__assinatura">O Rolgest não vê a sua palavra-passe. Quem a confirma é a sua empresa, e devolve-o aqui já com a sessão aberta.</p>
    </section>`,
    cartao: `
<section class="cartao cartao--fora" aria-labelledby="titulo-fora">
      <p class="fora__marca">Fora do Rolgest</p>
      <h2 class="cartao__titulo" id="titulo-fora">Página do fornecedor da empresa</h2>
      <p class="cartao__sub">Por exemplo, o Entra ID da Exemplo, Lda. O desenho é o dela.</p>
      <div class="formulario">
        <p class="identidade"><span class="identidade__correio">ana.ribeiro@exemplo.pt</span></p>
        <div class="campo">
          <label class="campo__label" for="passe-empresa">Palavra-passe da empresa</label>
          <input class="input" id="passe-empresa" type="password" value="••••••••••" disabled>
        </div>
        <div class="campo">
          <label class="campo__label" for="fator-empresa">Segundo fator do cliente</label>
          <input class="input" id="fator-empresa" type="text" value="código da aplicação" disabled>
        </div>
        <div class="formulario__accoes">
          <button type="button" class="btn btn--acao btn--bloco">
            <span class="btn__rotulo">Entrar na Exemplo</span>
          </button>
        </div>
      </div>
      <div class="cartao__pe">
        <span>Não é a sua empresa?</span>
        <a class="ligacao-recuperar" href="#" ${ir('entrada')}>Usar outro endereço</a>
      </div>
    </section>`,
  }),
};
