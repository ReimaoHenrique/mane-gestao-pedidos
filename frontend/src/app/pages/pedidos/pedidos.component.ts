import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>📋 Pedidos</h2>
      <p>Gerencie todos os pedidos do sistema</p>
    </div>

    <div class="pedidos-grid" *ngIf="pedidos().length > 0; else vazio">
      <div class="card pedido-card" *ngFor="let pedido of pedidos()">
        <div class="pedido-header">
          <div class="pin-display">
            <span class="pin-label">PIN</span>
            <span class="pin-value">{{ pedido.pin }}</span>
          </div>
          <span class="badge" [ngClass]="'badge-' + pedido.status">
            {{ statusLabel(pedido.status) }}
          </span>
        </div>

        <div class="pedido-body">
          <h3 class="cliente-nome">{{ pedido.cliente }}</h3>

          <div class="itens-lista">
            <div class="item-row" *ngFor="let item of pedido.itens">
              <span class="item-nome">{{ item.nome }}</span>
              <span class="item-qtd">x{{ item.quantidade }}</span>
              <span class="item-preco">R$ {{ item.preco.toFixed(2) }}</span>
            </div>
          </div>

          <div class="pedido-total">
            <span>Total</span>
            <strong>R$ {{ pedido.total.toFixed(2) }}</strong>
          </div>

          <div class="pedido-data">
            Criado em {{ formatDate(pedido.criado_em) }}
          </div>
        </div>

        <div class="pedido-actions">
          <button
            class="btn btn-secondary btn-sm"
            *ngIf="pedido.status !== 'finalizado'"
            (click)="avancarStatus(pedido)">
            ⏭️ {{ proximoStatusLabel(pedido.status) }}
          </button>
          <button
            class="btn btn-danger btn-sm"
            (click)="deletar(pedido.id)">
            🗑️ Excluir
          </button>
        </div>
      </div>
    </div>

    <ng-template #vazio>
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Nenhum pedido encontrado</h3>
        <p>Crie um novo pedido para começar</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .pedidos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .pedido-card {
      display: flex;
      flex-direction: column;
    }

    .pedido-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .pin-display {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .pin-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4);
    }

    .pin-value {
      font-size: 1.8rem;
      font-weight: 900;
      color: #e94560;
      font-family: 'Courier New', monospace;
      letter-spacing: 4px;
    }

    .pedido-body {
      flex: 1;
    }

    .cliente-nome {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #fff;
    }

    .itens-lista {
      margin-bottom: 1rem;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);

      .item-nome { flex: 1; }
      .item-qtd {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
      }
      .item-preco {
        font-weight: 600;
        color: #eee;
      }
    }

    .pedido-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-top: 2px solid rgba(233, 69, 96, 0.3);
      margin-top: 0.5rem;
      font-size: 1.05rem;

      strong {
        color: #e94560;
        font-size: 1.2rem;
      }
    }

    .pedido-data {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.35);
      margin-top: 0.5rem;
    }

    .pedido-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1.3rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.5rem;
      }

      p {
        color: rgba(255, 255, 255, 0.3);
      }
    }
  `]
})
export class PedidosComponent implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  pedidos = signal<Pedido[]>([]);

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.pedidoService.listarPedidos().subscribe({
      next: (pedidos) => this.pedidos.set(pedidos),
      error: (err) => console.error('Erro ao carregar pedidos:', err),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      recebido: 'Recebido',
      preparando: 'Preparando',
      a_caminho: 'A Caminho',
      finalizado: 'Finalizado',
    };
    return labels[status] ?? status;
  }

  proximoStatusLabel(status: string): string {
    const proximo: Record<string, string> = {
      recebido: 'Preparar',
      preparando: 'Enviar',
      a_caminho: 'Finalizar',
    };
    return proximo[status] ?? '';
  }

  proximoStatus(status: string): string {
    const proximo: Record<string, string> = {
      recebido: 'preparando',
      preparando: 'a_caminho',
      a_caminho: 'finalizado',
    };
    return proximo[status] ?? status;
  }

  avancarStatus(pedido: Pedido): void {
    const novoStatus = this.proximoStatus(pedido.status);
    this.pedidoService.atualizarStatus(pedido.id, novoStatus).subscribe({
      next: () => this.carregarPedidos(),
      error: (err) => console.error('Erro ao atualizar status:', err),
    });
  }

  deletar(id: string): void {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      this.pedidoService.deletarPedido(id).subscribe({
        next: () => this.carregarPedidos(),
        error: (err) => console.error('Erro ao deletar pedido:', err),
      });
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR');
  }
}
