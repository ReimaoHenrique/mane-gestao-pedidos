import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-novo-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>➕ Novo Pedido</h2>
      <p>Preencha os dados do pedido e adicione os itens</p>
    </div>

    <!-- Modal de sucesso -->
    <div class="modal-overlay" *ngIf="pedidoCriado()" (click)="fecharModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-icon">✅</div>
        <h3>Pedido Criado com Sucesso!</h3>
        <div class="pin-destaque">
          <span class="pin-label">Seu PIN</span>
          <span class="pin-numero">{{ pedidoCriado()!.pin }}</span>
        </div>
        <p class="pin-hint">Use este PIN para acompanhar seu pedido</p>
        <div class="modal-info">
          <p><strong>Cliente:</strong> {{ pedidoCriado()!.cliente }}</p>
          <p><strong>Total:</strong> R$ {{ pedidoCriado()!.total.toFixed(2) }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" (click)="fecharModal()">Fechar</button>
          <button class="btn btn-secondary" (click)="irParaAcompanhar()">Acompanhar Pedido</button>
        </div>
      </div>
    </div>

    <div class="card form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="cliente">Nome do Cliente</label>
          <input
            id="cliente"
            type="text"
            formControlName="cliente"
            placeholder="Digite o nome do cliente" />
        </div>

        <div class="itens-section">
          <div class="itens-header">
            <h3>Itens do Pedido</h3>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              (click)="adicionarItem()">
              ➕ Adicionar Item
            </button>
          </div>

          <div formArrayName="itens">
            <div
              class="item-form-row"
              *ngFor="let item of itensControls.controls; let i = index"
              [formGroupName]="i">
              <div class="form-group item-nome">
                <label>Item</label>
                <input
                  type="text"
                  formControlName="nome"
                  placeholder="Nome do item" />
              </div>
              <div class="form-group item-qtd">
                <label>Qtd</label>
                <input
                  type="number"
                  formControlName="quantidade"
                  min="1"
                  placeholder="1" />
              </div>
              <div class="form-group item-preco">
                <label>Preço (R$)</label>
                <input
                  type="number"
                  formControlName="preco"
                  step="0.01"
                  min="0"
                  placeholder="0.00" />
              </div>
              <button
                type="button"
                class="btn btn-danger btn-sm btn-remover"
                (click)="removerItem(i)"
                *ngIf="itensControls.length > 1">
                ✕
              </button>
            </div>
          </div>
        </div>

        <div class="form-total">
          <span>Total estimado:</span>
          <strong>R$ {{ calcularTotal() }}</strong>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || enviando()">
            {{ enviando() ? '⏳ Enviando...' : '🚀 Criar Pedido' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      max-width: 800px;
    }

    .itens-section {
      margin: 1.5rem 0;
    }

    .itens-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        font-size: 1.1rem;
        color: #fff;
      }
    }

    .item-form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 0.5rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 8px;

      .item-nome { flex: 2; }
      .item-qtd { flex: 0.5; min-width: 80px; }
      .item-preco { flex: 1; }

      .form-group {
        margin-bottom: 0;
      }
    }

    .btn-remover {
      margin-bottom: 0;
      height: 40px;
      min-width: 40px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .form-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(233, 69, 96, 0.1);
      border-radius: 8px;
      font-size: 1.1rem;
      margin-top: 1rem;

      strong {
        color: #e94560;
        font-size: 1.4rem;
      }
    }

    .form-actions {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: #16213e;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: modalIn 0.3s ease;
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .modal-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .modal-content h3 {
      font-size: 1.3rem;
      color: #fff;
      margin-bottom: 1.5rem;
    }

    .pin-destaque {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      background: rgba(233, 69, 96, 0.15);
      border-radius: 12px;
      border: 2px dashed #e94560;
      margin-bottom: 0.75rem;
    }

    .pin-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.5);
    }

    .pin-numero {
      font-size: 3rem;
      font-weight: 900;
      color: #e94560;
      font-family: 'Courier New', monospace;
      letter-spacing: 8px;
    }

    .pin-hint {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 1rem;
    }

    .modal-info {
      text-align: left;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;

      p {
        margin: 0.25rem 0;
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
  `]
})
export class NovoPedidoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pedidoService = inject(PedidoService);
  private readonly router = inject(Router);

  pedidoCriado = signal<Pedido | null>(null);
  enviando = signal(false);

  form = this.fb.group({
    cliente: ['', Validators.required],
    itens: this.fb.array([this.criarItemGroup()]),
  });

  get itensControls(): FormArray {
    return this.form.get('itens') as FormArray;
  }

  criarItemGroup() {
    return this.fb.group({
      nome: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      preco: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  adicionarItem(): void {
    this.itensControls.push(this.criarItemGroup());
  }

  removerItem(index: number): void {
    this.itensControls.removeAt(index);
  }

  calcularTotal(): string {
    let total = 0;
    for (const item of this.itensControls.controls) {
      const qtd = item.get('quantidade')?.value ?? 0;
      const preco = item.get('preco')?.value ?? 0;
      total += qtd * preco;
    }
    return total.toFixed(2);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.enviando.set(true);

    const dados = this.form.getRawValue();
    this.pedidoService.criarPedido({
      cliente: dados.cliente!,
      itens: dados.itens.map((item: any) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        preco: item.preco,
      })),
    }).subscribe({
      next: (pedido) => {
        this.pedidoCriado.set(pedido);
        this.enviando.set(false);
        this.form.reset();
        this.itensControls.clear();
        this.itensControls.push(this.criarItemGroup());
      },
      error: (err) => {
        console.error('Erro ao criar pedido:', err);
        this.enviando.set(false);
      },
    });
  }

  fecharModal(): void {
    this.pedidoCriado.set(null);
  }

  irParaAcompanhar(): void {
    this.router.navigate(['/acompanhar']);
    this.pedidoCriado.set(null);
  }
}
