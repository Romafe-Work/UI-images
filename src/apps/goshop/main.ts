import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import '../goparts/css/portal.css';
import '../goparts/css/melhorias.css';
import '../../comum/carregar/carregar.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { iniciar as entrar } from '../../comum/entrar/comportamento';
import { goshop } from './app';

montar(goshop, [entrar]);
