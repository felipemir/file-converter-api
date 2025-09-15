<h1 align="center">File Converter API</h1>

API em NestJS para converter arquivos DOCX, Markdown, HTML e imagens em PDF. Inclui autenticação JWT, upload seguro, validação de arquivos, rate limiting e documentação via Swagger.

## Pré-requisitos

- Node.js 18+
- npm

> O projeto baixa uma instância do Chromium via Puppeteer durante a instalação. Certifique-se de ter espaço em disco e as dependências do navegador (libatk, libcups, etc.) disponíveis no sistema operacional.

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente no arquivo `.env` (um arquivo padrão já está incluído):
   ```bash
   PORT=3000
   JWT_SECRET=super-secret-key
   JWT_EXPIRES_IN=1h
   AUTH_USER_EMAIL=admin@example.com
   AUTH_USER_NAME=File Converter Admin
   AUTH_USER_PASSWORD=admin123
   RATE_LIMIT_MAX=20
   RATE_LIMIT_WINDOW_MS=60000
   ```

3. Suba a API em modo desenvolvimento:
   ```bash
   npm run start:dev
   ```

A documentação Swagger fica disponível em `http://localhost:3000/docs`.

## Autenticação

- `POST /auth/login`: recebe `{ "email": "...", "password": "..." }` e retorna `accessToken` (JWT) mais os dados do usuário.
- `GET /auth/me`: retorna o perfil do usuário autenticado. Requer header `Authorization: Bearer <token>`.

Credenciais padrão (definidas no `.env`):

- Email: `admin@example.com`
- Senha: `admin123`

Você pode substituir os valores por uma senha em texto puro ou um hash bcrypt.

## Conversão de arquivos

- `POST /files/convert/pdf`
  - Content-Type `multipart/form-data` com campo `file`.
  - Formatos aceitos: `.docx`, `.md`, `.html`, `.htm`, `.png`, `.jpg`, `.jpeg`.
  - Tamanho máximo: 10 MB (validado pelo Multer e pela aplicação).
  - Retorna o PDF como download (`application/pdf`).

## Segurança e Observabilidade

- Rate limiting configurado (padrão: 20 requisições por minuto por IP).
- JWT obrigatório para todas as rotas protegidas.
- Validação de dados com `class-validator`.
- Logs básicos de inicialização no console.

## Scripts úteis

```bash
npm run start        # Produção
npm run start:dev    # Desenvolvimento com watch
npm run build        # Compila para produção
```

## Estrutura principal

- `src/auth`: módulo de autenticação (JWT, estratégias, DTOs).
- `src/files`: upload e conversão de arquivos.
- `src/users`: serviço simples para gerenciar o usuário padrão (via variáveis de ambiente).
- `src/main.ts`: inicialização, rate limiting, Swagger e pipes globais.

## Licença

MIT © File Converter API
