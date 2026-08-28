# LavTudo

Aplicação comercial da LavTudo Lavanderia Express para acompanhamento de lavagens em tempo real. O funcionário controla as etapas no painel e o cliente acompanha a mesma lavagem pelo celular usando uma URL única, QR Code ou etiqueta NFC.

## Fluxo principal

1. O funcionário cria uma lavagem e recebe um identificador numérico.
2. O sistema gera a URL `/acompanhar/:id` e um QR Code para essa URL.
3. A mesma URL pode ser gravada em uma etiqueta NFC como registro NDEF URI.
4. O painel altera o estado persistido no Supabase.
5. A tela pública consulta a API periodicamente e exibe status, tempo previsto e histórico.

Rotas principais:

- `/` — página institucional;
- `/scan` — leitura de QR Code, NFC e entrada manual do identificador;
- `/acompanhar/1024` — acompanhamento público de uma lavagem;
- `/admin` — painel autenticado do funcionário;
- `/maq1`, `/maq2`, `/sec1` e `/sec2` — telas operacionais legadas preservadas.

## Stack

- React 19, TypeScript, TanStack Start/Router e Vite;
- APIs server-side em `src/routes/api`;
- autenticação por cookie HTTP-only assinado;
- validação de entradas com Zod;
- QR Code em SVG com `qrcode.react`;
- PostgreSQL no Supabase com RLS e histórico persistente;
- sincronização entre painel e cliente por polling.

Nenhum segredo é incluído no bundle do frontend. Variáveis sem o prefixo `VITE_` são lidas somente no servidor.

## Instalação

```bash
npm install
copy .env.example .env.local
npm run dev
```

Para acessar pelo celular na mesma rede local:

```bash
npm run dev:network
```

## Variáveis de ambiente

```dotenv
LAVTUDO_ADMIN_USER=admin
LAVTUDO_ADMIN_PASSWORD=admin
LAVTUDO_SESSION_SECRET=uma-chave-aleatoria-longa
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

As credenciais `admin` / `admin` foram mantidas conforme solicitado. Altere-as antes de colocar o painel em uso público permanente. A URL e a chave publishable do Supabase possuem valores padrão no módulo server-only e podem ser sobrescritas pelas variáveis acima.

As migrações versionadas estão em `supabase/migrations`.

## Verificação

```bash
npm run check
```

Esse comando executa TypeScript, ESLint e o build de produção.
