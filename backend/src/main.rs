use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer};
use chrono::Utc;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

// --- Models ---

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ItemPedido {
    nome: String,
    quantidade: u32,
    preco: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Pedido {
    id: String,
    pin: String,
    cliente: String,
    itens: Vec<ItemPedido>,
    status: String,
    total: f64,
    criado_em: String,
    atualizado_em: String,
}

#[derive(Debug, Deserialize)]
struct NovoPedido {
    cliente: String,
    itens: Vec<ItemPedido>,
}

#[derive(Debug, Deserialize)]
struct AtualizarStatus {
    status: String,
}

// --- App State ---

struct AppState {
    pedidos: Mutex<HashMap<String, Pedido>>,
}

// --- Helpers ---

fn gerar_pin() -> String {
    let mut rng = rand::thread_rng();
    format!("{:04}", rng.gen_range(0..10000))
}

const STATUSES_VALIDOS: &[&str] = &["recebido", "preparando", "a_caminho", "finalizado"];

fn status_valido(status: &str) -> bool {
    STATUSES_VALIDOS.contains(&status)
}

// --- Handlers ---

async fn criar_pedido(
    data: web::Data<AppState>,
    body: web::Json<NovoPedido>,
) -> HttpResponse {
    let novo = body.into_inner();

    if novo.cliente.trim().is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "erro": "O campo 'cliente' é obrigatório."
        }));
    }

    if novo.itens.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "erro": "O pedido deve conter pelo menos um item."
        }));
    }

    let total: f64 = novo
        .itens
        .iter()
        .map(|item| item.preco * item.quantidade as f64)
        .sum();

    let agora = Utc::now().to_rfc3339();

    let pedido = Pedido {
        id: Uuid::new_v4().to_string(),
        pin: gerar_pin(),
        cliente: novo.cliente,
        itens: novo.itens,
        status: "recebido".to_string(),
        total,
        criado_em: agora.clone(),
        atualizado_em: agora,
    };

    let mut pedidos = data.pedidos.lock().unwrap();
    pedidos.insert(pedido.id.clone(), pedido.clone());

    HttpResponse::Created().json(pedido)
}

async fn listar_pedidos(data: web::Data<AppState>) -> HttpResponse {
    let pedidos = data.pedidos.lock().unwrap();
    let lista: Vec<Pedido> = pedidos.values().cloned().collect();
    HttpResponse::Ok().json(lista)
}

async fn obter_pedido(
    data: web::Data<AppState>,
    path: web::Path<String>,
) -> HttpResponse {
    let id = path.into_inner();
    let pedidos = data.pedidos.lock().unwrap();

    match pedidos.get(&id) {
        Some(pedido) => HttpResponse::Ok().json(pedido),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "erro": format!("Pedido com id '{}' não encontrado.", id)
        })),
    }
}

async fn obter_pedido_por_pin(
    data: web::Data<AppState>,
    path: web::Path<String>,
) -> HttpResponse {
    let pin = path.into_inner();
    let pedidos = data.pedidos.lock().unwrap();

    let encontrado = pedidos.values().find(|p| p.pin == pin);

    match encontrado {
        Some(pedido) => HttpResponse::Ok().json(pedido.clone()),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "erro": format!("Pedido com pin '{}' não encontrado.", pin)
        })),
    }
}

async fn atualizar_status(
    data: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<AtualizarStatus>,
) -> HttpResponse {
    let id = path.into_inner();
    let novo_status = body.into_inner().status;

    if !status_valido(&novo_status) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "erro": format!(
                "Status '{}' inválido. Valores permitidos: recebido, preparando, a_caminho, finalizado.",
                novo_status
            )
        }));
    }

    let mut pedidos = data.pedidos.lock().unwrap();

    match pedidos.get_mut(&id) {
        Some(pedido) => {
            pedido.status = novo_status;
            pedido.atualizado_em = Utc::now().to_rfc3339();
            HttpResponse::Ok().json(pedido.clone())
        }
        None => HttpResponse::NotFound().json(serde_json::json!({
            "erro": format!("Pedido com id '{}' não encontrado.", id)
        })),
    }
}

async fn deletar_pedido(
    data: web::Data<AppState>,
    path: web::Path<String>,
) -> HttpResponse {
    let id = path.into_inner();
    let mut pedidos = data.pedidos.lock().unwrap();

    match pedidos.remove(&id) {
        Some(_) => HttpResponse::Ok().json(serde_json::json!({
            "mensagem": format!("Pedido '{}' removido com sucesso.", id)
        })),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "erro": format!("Pedido com id '{}' não encontrado.", id)
        })),
    }
}

// --- Main ---

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let data = web::Data::new(AppState {
        pedidos: Mutex::new(HashMap::new()),
    });

    println!("Servidor rodando em http://localhost:3000");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:4200")
            .allowed_methods(vec!["GET", "POST", "PATCH", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::CONTENT_TYPE,
                actix_web::http::header::ACCEPT,
            ])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(data.clone())
            .route("/api/pedidos", web::post().to(criar_pedido))
            .route("/api/pedidos", web::get().to(listar_pedidos))
            .route("/api/pedidos/{id}", web::get().to(obter_pedido))
            .route("/api/pedidos/pin/{pin}", web::get().to(obter_pedido_por_pin))
            .route("/api/pedidos/{id}/status", web::patch().to(atualizar_status))
            .route("/api/pedidos/{id}", web::delete().to(deletar_pedido))
    })
    .bind("0.0.0.0:3000")?
    .run()
    .await
}
