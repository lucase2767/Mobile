# Cuidados Costura

Um aplicativo mobile para gerenciar a manutenção e lubrificação de máquinas de costura. Descubra informações detalhadas sobre sua máquina, acompanhe prazos de manutenção e receba orientações sobre técnicas de lubrificação corretas.

## Visão Geral

**Cuidados Costura** é um app que combina armazenamento em cache e um banco de dados com pesquisa por IA que expande as capicidades do banco de dados, para oferecer informações precisas sobre manutenção.

### Principais Características

-  **Busca Inteligente**: Procure sua máquina de costura pelo modelo
-  **Informações Detalhadas**: Obtenha dados sobre:
  - Tipo de óleo recomendado
  - Intervalo de lubrificação
  - Pontos de lubrificação específicos
  - Guia passo a passo de manutenção
-  **Calendário de Manutenção**: Acompanhe as próximas datas de lubrificação
-  **Histórico Local**: Acompanhe suas máquinas favoritas
-  **Gerado por IA**: Quando não há dados no banco, a IA gera informações precisas
-  **Modo Offline**: Acesso às máquinas previamente consultadas mesmo sem internet


## 📖 Como Usar

### 1. Tela Inicial (Home)
- Procure pelo **modelo da sua máquina** na barra de pesquisa
- Veja suas **máquinas rastreadas** na seção "Minhas Máquinas"
- Clique no (X) para remover uma máquina da lista de rastreamento

### 2. Tela de Resultados
- Visualize informações detalhadas sobre a máquina encontrada
- O app mostra a **origem dos dados**:
  -  **Cache local**: Consultada anteriormente
  -  **Banco de dados**: Dados verificados
  -  **Gerado por IA**: Criado por inteligência artificial
- Clique em **"Ver datas de lubrificação"** para acompanhar a manutenção

### 3. Calendário de Manutenção
- Defina a **data da última lubrificação**
- Veja as **próximas 4 datas** recomendadas
- Acompanhe os **pontos de lubrificação** específicos da sua máquina

## Estrutura do Projeto

```
cuidados-costura/
├── app/                          # Telas e rotas da aplicação
│   ├── _layout.tsx              # Layout base com navegação
│   ├── index.tsx                # Tela inicial (Home)
│   ├── resultado.tsx            # Tela de resultados da busca
│   └── calendario.tsx           # Tela de calendário de manutenção
│
├── src/
│   ├── components/              # Componentes reutilizáveis
│   │   ├── MachineCard.tsx      # Card com informações da máquina
│   │   ├── OilDateCard.tsx      # Card com datas de lubrificação
│   │   ├── SearchBar.tsx        # Barra de pesquisa
│   │   └── ...
│   │
│   ├── services/                # Lógica de negócio
│   │   ├── geminiService.ts     # Integração com API Gemini (IA)
│   │   ├── apiService.ts        # Integração com banco de dados
│   │   ├── storageService.ts    # Armazenamento local (AsyncStorage)
│   │   └── calendarService.ts   # Gerenciamento de datas
│   │
│   ├── hooks/                   # React hooks customizados
│   ├── constants/               # Constantes da aplicação
│   └── utils/                   # Funções utilitárias
│
├── assets/                      # Ícones e imagens
├── __tests__/                   # Testes unitários
├── package.json                 # Dependências do projeto
├── app.json                     # Configuração do Expo
└── tsconfig.json               # Configuração do TypeScript

```

## Arquitetura

### Fluxo de Dados

```
Usuário busca máquina
         ↓
    [Busca Rápida]
         ↓
   ┌─────┴─────┐
   ↓           ↓
Cache local?  Sim → Retorna dados em cache
   Não        
   ↓
API/BD disponível?
   ├─ Sim → Busca na API, salva em cache
   │
   ├─ Não → Usa Gemini (IA) para gerar dados
   │        Salva em cache e sincroniza com API
   │
   └─ Erro → Mostra mensagem de erro
```

### Serviços Principais

#### `geminiService.ts`
- Integra a API Google Gemini para gerar informações sobre máquinas
- Estrutura respostas no formato `MachineOilInfo`
- Gera dados quando não há informações no banco de dados

#### `apiService.ts`
- Comunica com backend para buscar e salvar dados de máquinas
- Sincroniza informações geradas por IA com o banco central
- Implementa cache em duas camadas

#### `storageService.ts`
- Gerencia AsyncStorage para armazenamento local
- Permite acesso offline aos dados
- Mantém lista de máquinas rastreadas pelo usuário

#### `calendarService.ts`
- Gerencia cálculos de datas de manutenção
- Baseado no intervalo recomendado (em meses)


## Segurança

- Dados sensíveis criptografados com **crypto-js**
- Armazenamento local seguro com **AsyncStorage**
- Requisições seguras com HTTPS
- Sem armazenamento de senhas no dispositivo


### TypeScript
O projeto usa **TypeScript** para melhor experiência de desenvolvimento.

### Offline-First
O app funciona offline com dados previamente sincronizados:
1. Cache local primeiro
2. Sincronização automática quando online
3. Suporta modo avião