import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Para conseguir __dirname no ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// 👉 Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// 👉 Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/votos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'votos.html'));
});
app.get('/cadastrar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'cadastrar.html'));
});
app.get('/ranking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'ranking.html'));
});

async function conectarDB() {
  return open({
    filename: './banco.db',
    driver: sqlite3.Database,
  });
}

// LISTAR (inclui id, likes e dislikes)
app.get('/filmes_series', async (req, res) => {
  const db = await conectarDB();
  try {
    const filmesSeries = await db.all(`
      SELECT id, titulo, genero, tipo, descricao, imagem,
             COALESCE(likes, 0) AS likes,
             COALESCE(dislikes, 0) AS dislikes
      FROM filmes_series
    `);
    res.json(filmesSeries);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar filmes/séries' });
  } finally {
    await db.close();
  }
});


app.get('/ranking_data', async (req, res) => {
  const db = await conectarDB();
  try {
    const rows = await db.all(`
      SELECT
        id,
        titulo,
        genero,
        tipo,
        descricao,
        imagem,
        COALESCE(likes, 0)     AS likes,
        COALESCE(dislikes, 0)  AS dislikes
      FROM filmes_series
      ORDER BY likes DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar ranking' });
  } finally {
    await db.close();
  }
});

// CRIAR
app.post('/filmes_series', async (req, res) => {
  let { titulo, genero, descricao, imagem, tipo } = req.body;

  if (!titulo || !genero || !descricao) {
    return res.status(400).json({ error: 'Título, gênero e descrição são obrigatórios' });
  }

  // normaliza tipo
  if (!tipo) tipo = 'filme';
  const t = String(tipo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // remove acentos
  if (!['filme', 'serie'].includes(t)) {
    return res.status(400).json({ error: "Tipo deve ser 'filme' ou 'serie'" });
  }

  const db = await conectarDB();
  try {
    const result = await db.run(
      'INSERT INTO filmes_series (titulo, genero, tipo, descricao, imagem, likes, dislikes) VALUES (?, ?, ?, ?, ?, 0, 0)',
      [titulo, genero, t, descricao, imagem || null]
    );

    const novo = await db.get(
      `SELECT id, titulo, genero, tipo, descricao, imagem, likes, dislikes
       FROM filmes_series WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json({ message: 'Filme ou série cadastrada com sucesso!', item: novo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao inserir registro' });
  } finally {
    await db.close();
  }
});


// VOTAR (like/dislike) — incrementa/decrementa e devolve contadores atualizados
// body: { voto: 'like' | 'dislike', operacao: 'inc' | 'dec' }
app.patch('/filmes_series/:id/voto', async (req, res) => {
  const { id } = req.params;
  const { voto, operacao } = req.body;

  if (!['like', 'dislike'].includes(voto) || !['inc', 'dec'].includes(operacao)) {
    return res.status(400).json({ error: "Informe voto ('like'|'dislike') e operacao ('inc'|'dec')" });
  }

  const coluna = voto === 'like' ? 'likes' : 'dislikes';
  const sinal = operacao === 'inc' ? '+ 1' : '- 1';

  const db = await conectarDB();
  try {
    await db.run(`UPDATE filmes_series SET ${coluna} = MAX(${coluna} ${sinal}, 0) WHERE rowid = ?`, [id]);
    const row = await db.get(`
      SELECT rowid AS id, COALESCE(likes,0) AS likes, COALESCE(dislikes,0) AS dislikes 
      FROM filmes_series WHERE rowid = ?
    `, [id]);
    if (!row) return res.status(404).json({ error: 'Item não encontrado' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao processar voto' });
  } finally {
    await db.close();
  }
});

async function inicializarDB() {
  const db = await conectarDB();
  try {
    // Apaga a tabela se existir
    await db.exec('DROP TABLE IF EXISTS filmes_series');

    // Cria a tabela novamente
    await db.exec(`
      CREATE TABLE filmes_series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        genero TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('filme', 'serie')),
        descricao TEXT NOT NULL,
        imagem TEXT,
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0
      )
    `);

    // Insere 5 filmes/séries iniciais
    const inicial = [
      {
        titulo: "Stranger Things",
        genero: "Ficção Científica",
        tipo: "serie",
        descricao: "Um grupo de crianças enfrenta fenômenos sobrenaturais em sua cidade.",
        imagem: "https://m.media-amazon.com/images/I/81ScwNzmh0L._UF1000,1000_QL80_.jpg",
      },
      {
        titulo: "The Witcher",
        genero: "Fantasia",
        tipo: "serie",
        descricao: "Caçador de monstros luta para encontrar seu destino em um mundo turbulento.",
        imagem: "https://br.web.img3.acsta.net/pictures/19/11/29/17/57/5161763.jpg",
      },
      {
        titulo: "Inception",
        genero: "Ação",
        tipo: "filme",
        descricao: "Um ladrão invade sonhos para roubar segredos e implantar ideias.",
        imagem: "https://imagens.publicocdn.com/imagens.aspx/740372?tp=KM",
      },
      {
        titulo: "Matrix",
        genero: "Ficção Científica",
        tipo: "filme",
        descricao: "Um hacker descobre que o mundo é uma simulação controlada por máquinas.",
        imagem: "https://br.web.img2.acsta.net/medias/nmedia/18/91/08/82/20128877.JPG",
      },
      {
        titulo: "Breaking Bad",
        genero: "Drama",
        tipo: "serie",
        descricao: "Professor de química vira fabricante de metanfetamina após diagnóstico terminal.",
        imagem: "https://upload.wikimedia.org/wikipedia/pt/e/e1/Breaking_bad_5_temporada_%28parte_1%29_poster.jpg",
      }
    ];

    // Inserir cada registro
    for (const item of inicial) {
      await db.run(
        `INSERT INTO filmes_series (titulo, genero, tipo, descricao, imagem, likes, dislikes)
         VALUES (?, ?, ?, ?, ?, 0, 0)`,
        [item.titulo, item.genero, item.tipo, item.descricao, item.imagem]
      );
    }

    console.log('Banco inicializado: tabela criada e 5 registros inseridos.');
  } catch (e) {
    console.error('Erro ao inicializar banco:', e);
  } finally {
    await db.close();
  }
}

// Chamar a função antes de iniciar o servidor
inicializarDB().then(() => {
  app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
  });
});
