# 🌿 Seiva Socioambiental V2

Aplicativo Web Progressivo (PWA) offline-first para coleta inteligente de dados socioambientais, focado em metodologias TDR (Terras de Direitos) e análise assistida por IA.

![Dashboard Preview](assets/dashboard_preview.png)

## 🚀 Funcionalidades

- **Coleta Offline**: Funciona sem internet. Dados salvos localmente (IndexedDB).
- **Formulários Dinâmicos**: Metodologia TDR (Mapeamento de Conflitos, Uso do Território).
- **Exportação Inteligente**:
  - **PDF**: Relatórios individuais formatados com fotos e assinaturas.
  - **Excel**: Consolidação tabular de todas as entrevistas.
  - **JSON**: Backup completo do sistema.
- **Integração com IA**:
  - Conecte suas próprias chaves API (Google Gemini ou OpenAI).
  - **Importação Inteligente**: Arraste uma planilha ou relatório e receba insights automáticos sobre conflitos e dados.
  - **Multi-Modelo**: Suporte para Gemini Flash/Pro, GPT-4o, e modelos futuros.
- **Geo-Referenciamento**: Coleta automática de GPS e visualização em Mapa Interativo.

## 🛠️ Instalação e Uso

### Opção 1: Rodar Localmente (Desenvolvimento)
Este é um projeto estático (HTML/JS/CSS), não requer backend complexo.

1.  Clone este repositório.
2.  Abra a pasta no VS Code.
3.  Instale a extensão **Live Server**.
4.  Clique em "Go Live" no canto inferior direito.
5.  Acesse `http://127.0.0.1:5500`.

### Opção 2: Hospedar Online (Recomendado)
Para usar em campo com sua equipe, hospede gratuitamente:

#### GitHub Pages
1.  Suba este código para um repositório no GitHub.
2.  Vá em **Settings > Pages**.
3.  Em "Source", selecione o branch `main` e a pasta `/ (root)`.
4.  O site estará online em `https://seu-usuario.github.io/seiva-socioambiental`.

#### Netlify (Arrastar e Soltar)
1.  Acesse [Netlify Drop](https://app.netlify.com/drop).
2.  Arraste a pasta do projeto para a área indicada.
3.  O site estará online em segundos.

## 📚 Como Usar

1.  **Crie um Projeto**: Vá na aba "Projetos", clique em "+ Novo Projeto" e dê um nome (ex: "Tapajós 2025").
2.  **Selecione o Projeto**: Clique em "Abrir" no cartão do projeto. Isso ativará o modo de coleta para este projeto.
3.  **Colete Dados**: Vá na aba "Coleta". O nome do projeto já virá preenchido.
4.  **Configure a IA**: Vá em "Ajustes" para configurar sua chave API e testar a conexão.
5.  **Gerenciamento**: No "Painel", veja estatísticas por projeto. Na aba "Projetos", faça backups dos dados.

## 📦 Estrutura do Projeto

- `index.html`: Shell da aplicação.
- `js/`: Lógica modular (ES6 Modules).
  - `components/`: Elementos UI (Form Engine, Modal, Toast).
  - `forms/`: Schemas dos formulários (JSON-based).
  - `export/`: Geradores de PDF, Excel e DataManager.
  - `ai/`: Cliente de API e Parser Inteligente.
- `css/`: Estilos organizados.
- `assets/`: Ícones e mídias.

## 📄 Licença
Este projeto é de uso livre para fins socioambientais.
