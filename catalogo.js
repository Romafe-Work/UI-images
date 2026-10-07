/* Gerado por catalogo.py — não editar à mão. */
window.CATALOGO = [
 {
  "pasta": "erp",
  "nome": "ERP",
  "sub": "Rolgest, a plataforma de gestão",
  "ecras": [
   {
    "ecra": "entrada",
    "nome": "01 · Entrar",
    "fluxo": "Entrar",
    "objetivo": "Passo 1: só o endereço de correio, e o domínio decide o caminho. Conta nossa segue para a palavra-passe (02); empresa com fornecedor próprio segue para a página dele (03). É uma página do Keycloak com o tema Rolgest: a aplicação só redireciona, nunca recebe a palavra-passe."
   },
   {
    "ecra": "palavra-passe",
    "nome": "02 · A palavra-passe",
    "fluxo": "Entrar",
    "objetivo": "Passo 2, conta nossa: a palavra-passe valida no Keycloak, realm rolgest. O endereço fica à vista com «mudar». A recusa é sempre a mesma, esteja a conta errada, desativada ou inexistente."
   },
   {
    "ecra": "federado",
    "nome": "03 · O início de sessão da empresa",
    "fluxo": "Entrar",
    "objetivo": "Passo 2, cliente federado: o domínio pertence a uma organização com fornecedor próprio (por exemplo o Entra ID da empresa). A palavra-passe e o segundo fator são do cliente; a página não é nossa. Volta à aplicação já com o token."
   }
  ]
 },
 {
  "pasta": "web",
  "nome": "Web",
  "sub": "Para abrir no navegador",
  "ecras": []
 },
 {
  "pasta": "mobile",
  "nome": "Mobile",
  "sub": "Para o telemóvel e o PDA",
  "ecras": []
 }
];
