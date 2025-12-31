# GEE Inventory SaaS

Sistema SaaS para Inventário de Gases de Efeito Estufa (GEE) para PMEs brasileiras.

## Sobre

Plataforma desenvolvida para automatizar o inventário de emissões de GEE em conformidade com:
- **Lei nº 15.042/2024** (Sistema Brasileiro de Comércio de Emissões - SBCE)
- **Programa Brasileiro GHG Protocol**
- **Diretrizes do IPCC** (AR4, AR5, AR6)
- **GRI Standards** (indicadores 305)

## Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Autenticação**: Clerk
- **Banco de Dados**: PostgreSQL + Prisma
- **Linguagem**: TypeScript
- **Cálculos**: decimal.js para precisão

## Funcionalidades

### Escopos Cobertos

**Escopo 1 - Emissões Diretas**
- Combustão estacionária (caldeiras, geradores)
- Combustão móvel (frota de veículos)
- Emissões fugitivas (gases refrigerantes)
- Processos agrícolas (fertilizantes)
- LULUCF (florestas plantadas, incêndios, vegetação nativa)
- Efluentes (tratamento interno)

**Escopo 2 - Energia Indireta**
- Eletricidade comprada (fatores do grid brasileiro MCTI)

**Escopo 3 - Outras Indiretas**
- Transporte upstream/downstream
- Viagens aéreas
- Transporte de colaboradores
- Resíduos (tratamento externo)
- Bens e serviços adquiridos

### Motor de Cálculo

- Fatores de emissão atualizados (IPCC, MCTI, BEN)
- GWP configurável (AR4, AR5, AR6)
- Separação de emissões biogênicas
- Cálculo de remoções florestais
- Propagação de incertezas

### Relatórios

- GHG Protocol (Programa Brasileiro)
- GRI Standards (305-1 a 305-7)
- Formato SBCE
- Resumo executivo

## Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/gee-inventory-saas.git
cd gee-inventory-saas

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Inicializar banco de dados
npx prisma db push
npx prisma generate

# Rodar em desenvolvimento
npm run dev
```

## Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Área logada
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui
│   ├── layout/           # Header, Sidebar
│   └── forms/            # Formulários de dados
├── lib/
│   ├── calculation-engine/ # Motor de cálculo GEE
│   ├── constants/         # Fatores de emissão, GWP
│   └── db/               # Cliente Prisma
└── types/                # TypeScript types
```

## Motor de Cálculo

O motor de cálculo implementa as metodologias do IPCC e GHG Protocol:

```typescript
import { createCalculationEngine } from '@/lib/calculation-engine';

const engine = createCalculationEngine({
  gwpReference: 'AR5',
  year: 2024,
  organizationId: '...',
  inventoryId: '...',
});

const result = engine.calculateActivity('STATIONARY_COMBUSTION', {
  fuelType: 'Gás Natural',
  quantity: new Decimal(1000),
  unit: 'm³',
  year: 2024,
});

console.log(result.co2Equivalent); // tCO2e
```

## Fórmulas Principais

### Combustão
```
E_gas = Consumo × Conteúdo Energético × Fator de Emissão
E_CO2e = Σ(E_gas × GWP_gas)
```

### Florestas
```
Estoque = Volume × Densidade × BEF × (1 + R) × CF × (44/12)
Remoções = Estoque_atual - Estoque_anterior
```

### Eletricidade
```
E_CO2 = Consumo_MWh × Fator_Grid_Mensal
```

## API

```
# Inventários
GET    /api/inventories
POST   /api/inventories
GET    /api/inventories/:id
PATCH  /api/inventories/:id
DELETE /api/inventories/:id

# Dados de Atividade
GET    /api/inventories/:id/activity-data
POST   /api/inventories/:id/activity-data

# Cálculos
POST   /api/inventories/:id/calculate
```

## Licença

MIT License

---

Desenvolvido para atender às exigências do Sistema Brasileiro de Comércio de Emissões (SBCE).
