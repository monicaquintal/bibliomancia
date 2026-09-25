# Bibliomancia

Aplicação web para gerenciar sua biblioteca pessoal de leitura: pesquise livros e edições (via Google Books), cadastre-os com um status ("quero", "tenho", "lendo", "lido" ou status customizado), registre datas de início/término de leitura, comente durante a leitura, avalie com estrelas fracionadas (passos de 0,5) e escreva resenhas. Suporta releitura: cada ciclo de leitura de um livro é registrado separadamente, preservando o histórico.

Stack: [Next.js](https://nextjs.org) (App Router) + [Supabase](https://supabase.com) (Postgres + Auth), hospedado gratuitamente na [Vercel](https://vercel.com).

## Configuração

### 1. Criar o projeto no Supabase (gratuito)

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (plano Free).
2. Em **Project Settings → API**, copie a **Project URL** e a **anon/publishable key**.
3. Em **Project Settings → Authentication → URL Configuration**, adicione `http://localhost:3000` como Site URL/Redirect URL (adicione também a URL de produção depois do deploy).

### 2. Aplicar as migrations do banco

As migrations estão em `supabase/migrations/`. Aplique-as na ordem, colando o conteúdo de cada arquivo no **SQL Editor** do Supabase Studio (mais simples para começar), ou via [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started):

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

### 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: do passo 1.
- `GOOGLE_BOOKS_API_KEY`: opcional. Sem ela a busca já funciona, só com limite de requisições mais baixo. Para criar uma, use o [Google Cloud Console](https://console.cloud.google.com/) e ative a "Books API".

### 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel, gratuito)

1. Suba o repositório para o GitHub.
2. Importe o projeto em [vercel.com/new](https://vercel.com/new) (detecta Next.js automaticamente).
3. Configure as mesmas variáveis de ambiente do `.env.local` em Project Settings → Environment Variables.
4. Após o deploy, adicione a URL de produção em Supabase → Authentication → URL Configuration.

## Estrutura

- `app/` — rotas (App Router): `(auth)` para login/cadastro, `(app)` para biblioteca/busca (protegidas via `proxy.ts`).
- `actions/` — Server Actions (mutações: autenticação, adicionar livro, status, sessões de leitura, comentários, avaliação, resenha).
- `lib/google-books.ts` — integração com a Google Books API.
- `lib/supabase/` — clientes Supabase (browser, server, proxy de sessão).
- `supabase/migrations/` — schema SQL do banco (tabelas, seed de status, Row Level Security).
