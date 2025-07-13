<img src="/frontend/public/logo.png" alt="Azira Logo" width="200">

# Azira

**Azira** é o seu personal stylist na palma da mão. Nosso webapp entende profundamente o seu estilo e conhece cada peça do seu guarda-roupa. Com uma inteligência artificial especializada em moda, o Azira cria combinações incríveis e personalizadas para todas as ocasiões do seu dia a dia. Assim, você economiza tempo e dinheiro, aproveitando ao máximo o que já possui, enquanto potencializa sua autoestima e se sente sempre confiante com o que veste.

# Arquitetura

![alt text](/frontend//public/image.png)

## 🔗 Links
* **PITCH DeCK:** [PITCHDECK](documents/PitchDeck_Azira.pdf)
* **Demo:** [VIDEO](https://youtu.be/DyEy7p-U1fc)
* **Frontend (deploy):** [azira.netlify.app](https://azira.netlify.app)
* **Design (Canvas):** [Protótipo no Canva](https://www.canva.com/design/DAGs1Vpkl9Q/yFXtwMpQKwkv_GMpmr5Kcg/edit?utm_content=DA%E2%80%A6m_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## ✨ Funcionalidades

- 📸 **Catalogação do guarda-roupa via IA:** basta tirar foto das peças para adicioná-las ao seu acervo.
- 👗 **Montagem de outfits personalizados:** receba sugestões de looks para qualquer ocasião.
- 💸 **Venda de peças:** coloque aquelas roupas que você não usa à venda com poucos cliques.
- 🛍️ **Combinação de itens à venda:** visualize e combine peças novas com seu guarda-roupa antes da compra.

## 🛠️ Tecnologias

- **Frontend:** Vite, React, TypeScript, Firebase
- **Backend:** FastAPI, Uvicorn, Python
- **Banco de dados & Autenticação:** Supabase
- **Visão computacional & IA:** Gemini (Google)

## 💻 Como rodar o projeto

### Pré-requisitos

- Node.js (v14+)
- npm ou yarn
- Python 3.8+
- Git

### 🚀 Frontend

1. No diretório raiz do projeto:

   ```bash
   cd frontend
   ```

2. Crie um arquivo `.env` com as seguintes variáveis:

   ```dotenv
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_API_URL=
   ```

3. Instale as dependências e inicie o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

### 🏗️ Backend

1. Acesse a pasta do backend:

   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual:

   ```bash
   python -m venv venv
   # Linux/macOS
   source venv/bin/activate
   # Windows
   venv\Scripts\activate
   ```

3. Crie um arquivo `.env` com as variáveis abaixo:

   ```dotenv
   SUPABASE_URL=
   SUPABASE_KEY=
   SUPABASE_DB_URL=
   GEMINI_API_KEY=
   SUPABASE_STORAGE_BUCKET=
   SECRET_KEY=
   ```

4. Instale as dependências e execute o servidor:

   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## 🤝 Contribuição

Contribuições são bem-vindas! Siga estes passos:

1. Fork este repositório
2. Crie uma branch com sua feature: `git checkout -b feature/nome-da-feature`
3. Commit suas alterações: `git commit -m 'feat: descrição da feature'`
4. Push para a branch: `git push origin feature/nome-da-feature`
5. Abra um Pull Request

## 📜 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
