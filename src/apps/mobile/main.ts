import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import '../../comum/css/telemovel.css';
import '../../comum/carregar/carregar.css';
import './css/pick.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { iniciar as entrar } from '../../comum/entrar/comportamento';
import { mobile } from './app';

montar(mobile, [entrar]);
