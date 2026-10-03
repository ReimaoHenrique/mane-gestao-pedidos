import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'pedidos', pathMatch: 'full' },
  { path: 'pedidos', loadComponent: () => import('./pages/pedidos/pedidos.component').then(m => m.PedidosComponent) },
  { path: 'novo-pedido', loadComponent: () => import('./pages/novo-pedido/novo-pedido.component').then(m => m.NovoPedidoComponent) },
  { path: 'acompanhar', loadComponent: () => import('./pages/acompanhar/acompanhar.component').then(m => m.AcompanharComponent) },
];
