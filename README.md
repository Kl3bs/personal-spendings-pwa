# 💰 Personal Spendings PWA

Um aplicativo web progressivo (**PWA**) moderno, veloz e responsivo para controle de finanças pessoais, gestão de orçamentos e gamificação de economia. Desenvolvido com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** e **Firebase**.

---

## 🚀 Recursos Principais

- **📊 Dashboard Financeiro**: Visão geral dos gastos, resumo de saldo e histórico detalhado de transações.
- **🎯 Gestão de Orçamento**: Definição e acompanhamento de limites de gastos por categorias personalizadas.
- **🏆 Desafios de Economia**: Funcionalidade de gamificação para incentivar metas de economia.
- **🔑 Autenticação Segura**: Login social (Google Provider) e autenticação persistente via Firebase Auth.
- **☁️ Banco de Dados em Tempo Real**: Persistência de transações e dados do usuário via Google Cloud Firestore.
- **📱 PWA & Suporte Offline**: Instalável em dispositivos móveis e desktop com suporte a Service Worker (`@ducanh2912/next-pwa`).
- **🔔 Notificações Web Push**: Suporte a alertas e lembretes via `web-push`.
- **⚙️ Configurações**: Gerenciamento de perfil, preferências de notificação e tema.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) (Ícones)
- **Backend / BaaS:** [Firebase](https://firebase.google.com/) (Auth & Firestore)
- **Server Admin:** [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- **PWA:** `@ducanh2912/next-pwa`
- **Notificações:** `web-push`

---

## 📁 Estrutura do Projeto

```text
personal-spendings-pwa/
├── app/
│   ├── (auth)/
│   │   └── login/         # Tela de login e autenticação
│   ├── budget/            # Página de gestão de orçamento
│   ├── challenge/         # Página de desafios de economia
│   ├── dashboard/         # Painel principal de controle financeiro
│   ├── settings/          # Configurações do usuário e PWA
│   ├── globals.css        # Estilos globais e Tailwind
│   ├── layout.tsx         # Layout raiz da aplicação
│   └── page.tsx           # Página inicial / Redirecionamento
├── components/
│   ├── expenses/          # Formulários e cards de despesas
│   └── ui/                # AppShell, Sidebar, FloatingDock, etc.
├── lib/
│   ├── firebase/          # Configurações do Firebase (Client & Admin)
│   ├── budget-engine.ts   # Motor de cálculo e projeção de orçamento
│   └── push/              # Utilitários de WebPush Notifications
├── public/                # Manifest PWA, ícones e Service Workers
├── firestore.rules        # Regras de segurança do Cloud Firestore
└── .env.example           # Modelo de variáveis de ambiente
```

---

## 🔐 Configuração do Ambiente (`.env.local`)

Crie um arquivo `.env.local` na raiz do projeto baseado no `.env.example`:

```bash
cp .env.example .env.local
```

Preencha as variáveis com as credenciais do seu projeto Firebase:

```env
# Client SDK (Firebase Web)
NEXT_PUBLIC_FIREBASE_API_KEY=seu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Admin SDK (Server-Side)
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu_projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

> ⚠️ **Segurança:** O arquivo `.env.local` está no `.gitignore` e jamais deve ser enviado para o repositório.

---

## 💻 Como Executar o Projeto

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acesse no navegador:**
   Abra [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Scripts Disponíveis

- `npm run dev`: Inicia o servidor local de desenvolvimento.
- `npm run build`: Cria a build otimizada de produção com PWA.
- `npm run start`: Executa o aplicativo compilado em modo de produção.
- `npm run lint`: Roda o linter ESLint para verificar a qualidade do código.

---

## 🔒 Regras de Segurança (Firestore)

As regras de segurança do Firestore estão definidas no arquivo `firestore.rules` e garantem que cada usuário acesse exclusivamente seus próprios dados.

```text
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📄 Licença

Este projeto é de uso privado para controle de gastos pessoais.
