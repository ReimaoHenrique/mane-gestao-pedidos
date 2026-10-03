import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, CriarPedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/pedidos';

  listarPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  buscarPorId(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  buscarPorPin(pin: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/pin/${pin}`);
  }

  criarPedido(pedido: CriarPedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido);
  }

  atualizarStatus(id: string, status: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.apiUrl}/${id}/status`, { status });
  }

  deletarPedido(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
