export interface ItemPedido {
  nome: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: string;
  pin: string;
  cliente: string;
  itens: ItemPedido[];
  status: 'recebido' | 'preparando' | 'a_caminho' | 'finalizado';
  total: number;
  criado_em: string;
  atualizado_em: string;
}

export interface CriarPedido {
  cliente: string;
  itens: ItemPedido[];
}
