import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import './css/portal.css';
import './css/catalogo.css';
import './css/pedidos.css';
import './css/guias.css';
import './css/melhorias.css';
import '../../comum/carregar/carregar.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { iniciar as entrar } from '../../comum/entrar/comportamento';
import { goparts } from './app';

montar(goparts, [entrar]);
