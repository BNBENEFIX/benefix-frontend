# Benefix — Frontend

Interface web da plataforma Benefix, um ecossistema de benefícios compartilhados
entre empresas, estabelecimentos parceiros e seus usuários.

O frontend oferece uma landing page institucional, autenticação por perfil,
catálogo de benefícios, solicitações de acesso e resgate por QR Code. A API é
fornecida separadamente pelo backend em Quarkus.

## Tecnologias

- Next.js 16 com App Router
- React 19 e TypeScript
- Tailwind CSS 4
- Axios
- TanStack Query
- QR Code com `qrcode.react`
- Leitura de QR Code com `@zxing/browser`
- Motion e Lucide React

## Funcionalidades

- Landing page institucional responsiva
- Login e cadastro de empresas
- Dashboards específicos para administrador, empresa e usuário
- Gestão de empresas, colaboradores e benefícios
- Alternância entre várias empresas usando o mesmo login
- Inclusão e desativação lógica de empresas pelo gestor proprietário, com confirmação segura
- Catálogo de benefícios próprios e compartilhados
- Solicitação e aprovação de acesso a benefícios de outras empresas
- Geração de QR Code temporário para resgate
- Validação e consumo do benefício pelo estabelecimento
- Tema claro e escuro

## Requisitos

- Node.js 20 ou superior
- npm
- Backend Benefix disponível

## Configuração local

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env.local` a partir do exemplo:

```bash
cp .env.example .env.local
```

Configure as variáveis:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Endereço do backend BNFix (chamado direto do browser) |
| `NEXT_PUBLIC_SITE_URL` | Endereço público do frontend |

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Scripts

```bash
npm run dev     # servidor de desenvolvimento
npm run lint    # validação TypeScript
npm run build   # build de produção
npm run start   # execução do build de produção
```

## Integração com o backend

O navegador chama a API diretamente:

```text
https://api.bnfix.com.br/*
```

A autenticação usa um cookie httpOnly `jwt` (SameSite=Strict, Domain=.bnfix.com.br)
definido pelo backend no login. O cookie trafega automaticamente entre
`bnfix.com.br` e `api.bnfix.com.br` (mesmo site) — nenhum token é armazenado
em `localStorage` ou exposto ao JavaScript. A sessão é validada no reload via
`GET /auth/me`.

Os perfis retornados pela API são apresentados no frontend da seguinte forma:

| Backend | Frontend |
| --- | --- |
| `ADMIN` | Administrador |
| `MANAGER` | Empresa |
| `USER` | Usuário |

## Estrutura principal

```text
src/
├── app/          # rotas e layout (App Router)
├── components/   # componentes compartilhados
├── contexts/     # autenticação e tema
├── screens/      # páginas e dashboards por perfil
├── services/     # integração com a API
└── types/        # contratos TypeScript
```

## Deploy na Vercel

Configure `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SITE_URL` nas variáveis de ambiente
do projeto na Vercel. Em seguida, publique a branch principal normalmente.

O build utilizado no deploy é:

```bash
npm run build
```

## Segurança

- Nunca adicione arquivos `.pem`, chaves privadas ou credenciais ao frontend.
- Variáveis iniciadas com `NEXT_PUBLIC_` ficam disponíveis no navegador.
- Segredos do backend e chaves da EC2 devem permanecer no servidor ou em um
  gerenciador de segredos.
- Os arquivos `.env*` e `*.pem` estão ignorados pelo Git.

## Backend

O backend é uma aplicação independente em Quarkus, responsável por autenticação,
autorização, persistência, regras de compartilhamento e validação dos resgates.
