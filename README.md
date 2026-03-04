# Detector de Plágio UMN

Projeto: Detector de Plágio UMN — uma aplicação web para análise de similaridade e detecção de plágio em documentos acadêmicos.

## Sobre
Detector de Plágio UMN é uma interface front-end construída com React + TypeScript (Vite), estilizada com TailwindCSS e integrada ao Supabase para autenticação e backend leve. Fornece upload de documentos, análises de similaridade, relatórios detalhados e histórico de análises.

## Stack
- Frontend: React, TypeScript, Vite
- Estilos: Tailwind CSS
- Autenticação / Backend: Supabase (funções & migrations incluidas)
- Testes: Vitest

## Principais recursos
- Upload de documentos e processamento de similaridade
- Relatórios com fontes encontradas e métricas de risco
- Painel de controle (dashboard) com estatísticas e histórico
- Controle de usuários e papéis via Supabase

## Requisitos
- Node.js (v18+ recomendado)
- npm ou pnpm
- Conta e projeto no Supabase (para chaves/env)

## Configuração rápida
1. Instale dependências:

```bash
npm install
# ou
pnpm install
```

2. Crie um arquivo `.env` na raiz com as variáveis necessárias (exemplo):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Rodar em desenvolvimento:

```bash
npm run dev
```

4. Build para produção:

```bash
npm run build
npm run preview
```

## Banco de dados e funções
O diretório `supabase/` contém migrations SQL e funções server-side usadas pelo projeto. Ao configurar o Supabase, aplique as migrations e implemente as funções conforme necessário.

## Estrutura do projeto (resumo)
- `src/` — código fonte React (páginas, componentes, integrações)
- `supabase/` — migrations, funções e configurações do Supabase
- `public/` — ativos públicos

## Testes
Execute os testes com:

```bash
npm run test
```

## Contribuição
- Abra issues para bugs ou novos recursos
- Envie PRs com descrições claras e testes quando aplicável

## Licença
Este projeto está licenciado sob a MIT License — consulte o arquivo `LICENSE` na raiz do repositório.

## Contato
Para dúvidas ou ajuda, abra uma issue ou entre em contato com os mantenedores do projeto. paciencia163@gmail.com
