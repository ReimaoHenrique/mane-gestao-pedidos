import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-acompanhar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>🔍 Acompanhar Pedido</h2>
      <p>Digite o PIN do seu pedido para acompanhar o status</p>
    </div>

    <div class="search-section">
      <div class="search-box">
        <input
          type="text"
          [(ngModel)]="pinBusca"
          placeholder="Digite o PIN (4 dígitos)"
          maxlength="4"
          class="pin-input"
          (keyup.enter)="buscar()" />
        <button class="btn btn-primary" (click)="buscar()" [disabled]="!pinBusca || buscando()">
          {{ buscando() ? '⏳' : '🔍' }} Buscar
        </button>
      </div>
    </div>

    <div class="erro-msg" *ngIf="erro()">
      <span>❌</span> {{ erro() }}
    </div>

    <div class="resultado card" *ngIf="pedido()">
      <div class="resultado-header">
        <div>
          <span class="resultado-pin-label">PIN</span>
          <span class="resultado-pin">{{ pedido()!.pin }}</span>
        </div>
        <span class="badge" [ngClass]="'badge-' + pedido()!.status">
          {{ statusLabel(pedido()!.status) }}
        </span>
      </div>

      <!-- Status Timeline -->
      <div class="timeline">
        <div
          class="timeline-step"
          *ngFor="let step of statusSteps"
          [class.active]="isStepActive(step.value)"
          [class.current]="pedido()!.status === step.value">
          <div class="step-dot">
            <span class="step-icon" *ngIf="isStepActive(step.value)">✓</span>
          </div>
          <div class="step-line" *ngIf="step.value !== 'finalizado'"></div>
          <div class="step-label">{{ step.label }}</div>
          <div class="step-emoji">{{ step.emoji }}</div>
        </div>
      </div>

      <div class="resultado-detalhes">
        <div class="detalhe-row">
          <span class="detalhe-label">Cliente</span>
          <span class="detalhe-value">{{ pedido()!.cliente }}</span>
        </div>

        <div class="detalhe-itens">
          <h4>Itens</h4>
          <div class="item-row" *ngFor="let item of pedido()!.itens">
            <span>{{ item.nome }}</span>
            <span class="item-meta">x{{ item.quantidade }} — R$ {{ item.preco.toFixed(2) }}</span>
          </div>
        </div>

        <div class="detalhe-row total-row">
          <span class="detalhe-label">Total</span>
          <span class="detalhe-value total-value">R$ {{ pedido()!.total.toFixed(2) }}</span>
        </div>

        <div class="detalhe-row">
          <span class="detalhe-label">Criado em</span>
          <span class="detalhe-value">{{ formatDate(pedido()!.criado_em) }}</span>
        </div>

        <div class="detalhe-row">
          <span class="detalhe-label">Última atualização</span>
          <span class="detalhe-value">{{ formatDate(pedido()!.atualizado_em) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-section {
      margin-bottom: 2rem;
    }

    .search-box {
      display: flex;
      gap: 1rem;
      max-width: 500px;
    }

    .pin-input {
      flex: 1;
      padding: 1rem 1.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      background: #16213e;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #e94560;
      outline: none;
      transition: border-color 0.2s;

      &:focus {
        border-color: #e94560;
      }

      &::placeholder {
        font-size: 0.9rem;
        letter-spacing: 0;
        color: rgba(255, 255, 255, 0.2);
        font-family: inherit;
        font-weight: 400;
      }
    }

    .search-box .btn {
      padding: 1rem 1.5rem;
      font-size: 1rem;
      white-space: nowrap;
    }

    .erro-msg {
      padding: 1rem 1.5rem;
      background: rgba(192, 57, 43, 0.15);
      border: 1px solid rgba(192, 57, 43, 0.3);
      border-radius: 8px;
      color: #e74c3c;
      margin-bottom: 2rem;
      max-width: 500px;
    }

    .resultado {
      max-width: 600px;
    }

    .resultado-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 1.5rem;
    }

    .resultado-pin-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4);
      display: block;
    }

    .resultado-pin {
      font-size: 2rem;
      font-weight: 900;
      color: #e94560;
      font-family: 'Courier New', monospace;
      letter-spacing: 4px;
    }

    /* Timeline */
    .timeline {
      display: flex;
      justify-content: space-between;
      padding: 2rem 1rem;
      position: relative;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;

      .step-dot {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 3px solid rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        transition: all 0.3s ease;
        font-size: 0.8rem;

        .step-icon {
          color: #fff;
          font-weight: 700;
        }
      }

      .step-line {
        position: absolute;
        top: 20px;
        left: calc(50% + 20px);
        right: calc(-50% + 20px);
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        z-index: 1;
      }

      .step-label {
        margin-top: 0.75rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        text-align: center;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .step-emoji {
        margin-top: 0.35rem;
        font-size: 1.3rem;
      }

      &.active {
        .step-dot {
          background: #e94560;
          border-color: #e94560;
          box-shadow: 0 0 15px rgba(233, 69, 96, 0.4);
        }

        .step-line {
          background: #e94560;
        }

        .step-label {
          color: #e94560;
        }
      }

      &.current {
        .step-dot {
          animation: pulse 2s infinite;
          box-shadow: 0 0 20px rgba(233, 69, 96, 0.6);
        }
      }
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 15px rgba(233, 69, 96, 0.4); }
      50% { box-shadow: 0 0 25px rgba(233, 69, 96, 0.7); }
    }

    /* Detalhes */
    .resultado-detalhes {
      margin-top: 1.5rem;
    }

    .detalhe-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .detalhe-label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detalhe-value {
      color: #eee;
      font-weight: 500;
    }

    .total-row {
      border-top: 2px solid rgba(233, 69, 96, 0.3);
      border-bottom: none;
      padding: 1rem 0;
      margin-top: 0.5rem;
    }

    .total-value {
      font-size: 1.3rem;
      font-weight: 800;
      color: #e94560;
    }

    .detalhe-itens {
      padding: 0.75rem 0;

      h4 {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.5rem;
      }

      .item-row {
        display: flex;
        justify-content: space-between;
        padding: 0.4rem 0.75rem;
        font-size: 0.9rem;
        background: rgba(0, 0, 0, 0.15);
        border-radius: 6px;
        margin-bottom: 0.25rem;
      }

      .item-meta {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
      }
    }
  `]
})
export class AcompanharComponent {
  private readonly pedidoService = inject(PedidoService);

  pinBusca = '';
  pedido = signal<Pedido | null>(null);
  erro = signal<string | null>(null);
  buscando = signal(false);

  statusSteps = [
    { value: 'recebido', label: 'Recebido', emoji: '📥' },
    { value: 'preparando', label: 'Preparando', emoji: '👨🍳' },
    { value: 'a_caminho', label: 'A Caminho', emoji: '🛵' },
    { value: 'finalizado', label: 'Finalizado', emoji: '✅' },
  ];

  private statusOrder = ['recebido', 'preparando', 'a_caminho', 'finalizado'];

  buscar(): void {
    if (!this.pinBusca) return;
    this.buscando.set(true);
    this.erro.set(null);
    this.pedido.set(null);

    this.pedidoService.buscarPorPin(this.pinBusca).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.buscando.set(false);
      },
      error: () => {
        this.erro.set(`Nenhum pedido encontrado com o PIN "${this.pinBusca}"`);
        this.buscando.set(false);
      },
    });
  }

  isStepActive(stepValue: string): boolean {
    const pedido = this.pedido();
    if (!pedido) return false;
    const currentIndex = this.statusOrder.indexOf(pedido.status);
    const stepIndex = this.statusOrder.indexOf(stepValue);
    return stepIndex <= currentIndex;
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

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR');
  }
}
