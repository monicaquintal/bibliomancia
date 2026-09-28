# 📚 Bibliomancia

Olá, leitor(a)! Bem-vindo(a) à Bibliomancia — sua biblioteca pessoal de estimação, aquela que não julga quantos livros abandonados você tem na prateleira "abandonado" (a gente sabe que *Guerra e Paz* não tava tão bom assim).

Pesquise livros e edições direto do Google Books, jogue tudo na sua estante com um statuszinho ("quero", "tenho", "lendo", "lido", "abandonado"...) — e se nenhum desses te representa, crie o seu próprio status personalizado (todo mundo merece uma categoria tipo "comecei mas tô com medo de continuar"). Anote quando começou e terminou de ler, deixe comentários enquanto a leitura rola, dê aquela nota com estrelinhas fracionadas (sim, dá pra dar 3,5 estrelas, a gente entende sua indecisão) e escreva resenhas para o seu eu do futuro. E releu o livro? Sem problema: cada ciclo de leitura fica registrado separado, então seu histórico nunca é sobrescrito — a Bibliomancia lembra de tudo, mesmo quando você já esqueceu.

Feita com [Next.js](https://nextjs.org) (App Router) + [Supabase](https://supabase.com) (Postgres + Auth), rodando de graça na [Vercel](https://vercel.com). Sim, tudo isso sem gastar um centavo. 💸

## 🛠️ Configuração

### 1. Crie seu projeto no Supabase (é de graça, prometo)

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (plano Free — sem letrinhas miúdas).
2. Em **Project Settings → API**, copie a **Project URL** e a **anon/publishable key**. Guarde bem, vamos usar já já.
3. Em **Project Settings → Authentication → URL Configuration**, adicione `http://localhost:3000` como Site URL/Redirect URL (depois do deploy, volte aqui e adicione a URL de produção também).

### 2. Aplique as migrations do banco

As migrations moram em `supabase/migrations/`. Aplique-as na ordem — colando o conteúdo de cada arquivo no **SQL Editor** do Supabase Studio é o jeito mais tranquilo pra começar, mas se preferir linha de comando, o [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) também resolve:

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

### 3. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

E preencha:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: aqueles valores que você guardou lá no passo 1.
- `GOOGLE_BOOKS_API_KEY`: opcional. Sem ela a busca já funciona, só com um limite de requisições mais apertado. Quer a sua própria? Crie no [Google Cloud Console](https://console.cloud.google.com/) ativando a "Books API".

### 4. Rode localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e pronto, sua estante tá viva. 🎉

## 🚀 Deploy (Vercel, também de graça)

1. Suba o repositório para o GitHub.
2. Importe o projeto em [vercel.com/new](https://vercel.com/new) (ele reconhece Next.js sozinho, sem drama).
3. Configure as mesmas variáveis de ambiente do `.env.local` em Project Settings → Environment Variables.
4. Depois do deploy, volte no Supabase → Authentication → URL Configuration e adicione a URL de produção.

## 🗺️ Estrutura (pra quem gosta de bisbilhotar o código)

- `app/` — rotas (App Router): `(auth)` para login/cadastro, `(app)` para biblioteca/busca (protegidas via `proxy.ts`).
- `actions/` — Server Actions, onde toda a mágica de escrita acontece (autenticação, adicionar livro, status, sessões de leitura, comentários, avaliação, resenha).
- `lib/google-books.ts` — a ponte com a Google Books API.
- `lib/supabase/` — clientes Supabase (browser, server, proxy de sessão).
- `supabase/migrations/` — o schema SQL do banco (tabelas, seed de status, Row Level Security).

Boas leituras! 📖✨
