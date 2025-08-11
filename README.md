# 🎬 Projeto Mosten – Simulador de Votação de Filmes/Séries

Este projeto foi desenvolvido como parte do **Teste Prático – Processo de Formação** da empresa **Mosten**.  
O objetivo é criar um sistema de votação para filmes e séries, permitindo votos positivos e negativos, além de cadastro de novos itens com armazenamento persistente.

---

## 📌 Objetivo
Desenvolver um sistema que permita:
- Exibir uma lista inicial de filmes/séries.
- Votar positivamente ("Gostei") ou negativamente ("Não Gostei") em cada item.
- Cadastrar novos filmes ou séries.
- Armazenar dados de forma persistente (mesmo após recarregar ou reiniciar).

---

## 🚀 Funcionalidades
1. **Exibição de Itens**
   - Pelo menos 5 filmes/séries cadastrados inicialmente.
   - Cada item exibe:
     - Título
     - Gênero
     - Descrição
     - Imagem (URL ou placeholder)
     - Botões "Gostei" e "Não Gostei"

2. **Votação**
   - Contadores de votos atualizados em tempo real.
   - Exibição de:
     - Total de votos positivos e negativos por item.
     - Total geral de votos positivos e negativos na página.

3. **Cadastro de Filmes/Séries**
   - Campos obrigatórios:
     - Título
     - Gênero
     - Imagem (URL)
   - Campos opcionais:
     - Descrição
   - Novos itens aparecem com votos zerados e já disponíveis para votação.

4. **Persistência de Dados**
   - Uso de banco de dados para armazenar filmes/séries e votos.
   - Dados mantidos mesmo após reiniciar a aplicação.

---

## 🛠️ Tecnologias Utilizadas
- **Front-end:** HTML, CSS, JavaScript
- **Back-end:** Node.js, Express
- **Banco de Dados:** SQLite
- **Controle de Versão:** Git/GitHub

---

## 📂 Estrutura de Dados
Cada filme/série possui:
```json
{
  "id": 1,
  "titulo": "Exemplo de Filme",
  "genero": "Ação",
  "descricao": "Breve descrição do filme.",
  "imagem": "https://link-da-imagem.com",
  "gostei": 0,
  "naoGostei": 0
}
