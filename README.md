# Mané - Gestão de Pedidos

Sistema de gerenciamento de pedidos com geração de PIN e rastreamento de status em tempo real.

## 🏗️ Arquitetura

- **Frontend**: Angular 22+ com Tauri 2 (desktop app)
- **Backend**: Rust com Actix-web (API RESTful)

## 📋 Funcionalidades

- ✅ Criar pedidos com múltiplos itens (nome, quantidade, preço)
- ✅ Geração automática de PIN exclusivo de 4 dígitos
- ✅ Rastreamento de status com timeline visual:
  - 🔵 **Recebido** — Pedido foi recebido
  - 🟠 **Preparando** — Pedido está sendo preparado
  - 🟣 **A Caminho** — Pedido está a caminho
  - 🟢 **Finalizado** — Pedido foi entregue
- ✅ Consulta de pedido por PIN
- ✅ Listagem de todos os pedidos
- ✅ Atualização de status com um clique
- ✅ Exclusão de pedidos

## 🚀 Como Executar

### Pré-requisitos

- [Rust](https://rustup.rs/)
- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Backend (API REST)

```bash
cd backend
cargo run
# API disponível em http://localhost:3000
```

### Frontend (Angular + Tauri desktop)

```bash
cd frontend
pnpm install

# Apenas Angular no navegador:
pnpm start

# App desktop completo (Angular + Tauri):
pnpm tauri dev
```

> ⚠️ Inicie o backend antes de rodar o frontend.

## 📡 Endpoints da API

| Método   | Rota                          | Descrição                   |
|----------|-------------------------------|-----------------------------|
| `POST`   | `/api/pedidos`                | Criar pedido (gera PIN)     |
| `GET`    | `/api/pedidos`                | Listar todos os pedidos     |
| `GET`    | `/api/pedidos/{id}`           | Buscar pedido por ID        |
| `GET`    | `/api/pedidos/pin/{pin}`      | Buscar pedido por PIN       |
| `PATCH`  | `/api/pedidos/{id}/status`    | Atualizar status do pedido  |
| `DELETE` | `/api/pedidos/{id}`           | Deletar pedido              |

### Exemplo — Criar pedido

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "João Silva",
    "itens": [
      { "nome": "Pizza Margherita", "quantidade": 1, "preco": 45.90 },
      { "nome": "Refrigerante", "quantidade": 2, "preco": 8.50 }
    ]
  }'
```

**Resposta:**
```json
{
  "id": "c401592c-47eb-4572-818e-412e43fc5ab0",
  "pin": "8652",
  "cliente": "João Silva",
  "itens": [...],
  "status": "recebido",
  "total": 62.90,
  "criado_em": "2026-10-03T14:30:00Z",
  "atualizado_em": "2026-10-03T14:30:00Z"
}
```

## 🛠️ Stack Tecnológica

| Camada   | Tecnologia                     |
|----------|-------------------------------|
| Frontend | Angular 22+, TypeScript, SCSS |
| Desktop  | Tauri 2 (Rust)                |
| Backend  | Rust, Actix-web 4             |
| HTTP     | REST + JSON                   |
| Estado   | Angular Signals               |
