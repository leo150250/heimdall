# ꔖ Heimdall - Monitor de Disponibilidade de Rede

> **Heimdall**: Sistema inteligente de visualização e monitoramento de disponibilidade de ativos em infraestrutura de rede. Desenvolvido pela equipe de TI do **IFRO campus Cacoal**.

## 📋 Sobre o Projeto

Heimdall é uma plataforma moderna de monitoramento de disponibilidade que permite visualizar a infraestrutura de rede de forma intuitiva e em tempo real. Com suporte a múltiplos mapas de dispositivos, testes de conectividade automáticos e uma interface web responsiva, Heimdall facilita a gestão e monitoramento de ativos em ambiente corporativo.

### 🎯 Características Principais

- **🗺️ Múltiplos Mapas de Infraestrutura**: Organize seus dispositivos em diferentes mapas/grupos (ex: Administrativo, Laboratorios, Servidores)
- **⚡ Monitoramento em Tempo Real**: Verificação de disponibilidade via ICMP (ping) de forma assíncrona e não-bloqueante
- **🖥️ Interface Web Intuitiva**: Dashboard responsivo com visualização interativa de dispositivos
- **📡 WebSocket Bidirecional**: Comunicação em tempo real entre cliente e servidor
- **🎨 Mapeamento Visual**: Posicione dispositivos em coordenadas personalizadas para representar a topologia física
- **⚙️ Gerenciamento de Configurações**: Frequência de ping, limites de tolerância e persistência de dados
- **🔍 Fácil Adição de Dispositivos**: Crie novos ativos com endereço IP, nome e localização personalizada

## 🚀 Começando

### 📦 Requisitos

- **PHP 8.0+** (desenvolvido em PHP 8)
- **Apache** com suporte a módulo PHP
- **Extensão PHP WebSockets** (`ext-sockets`)
- **Sistema Operacional**: Windows, Linux ou macOS
- *(Opcional)* **Docker** para containerização

### 💻 Instalação

#### Opção 1: XAMPP (Windows)

1. **Clone ou extraia o projeto**:
   ```bash
   cd C:\xampp\htdocs
   # Coloque os arquivos do Heimdall aqui
   ```

2. **Inicie o Apache via XAMPP**

3. **Acesse a interface web**:
   ```
   http://localhost/heimdall/
   ```

4. **Inicie o servidor de monitoramento** (abra PowerShell/CMD na pasta `cli/`):
   ```bash
   C:\xampp\php\php.exe heimdall.php
   ```

#### Opção 2: Linux/macOS com Apache

1. **Coloque o projeto no diretório web**:
   ```bash
   sudo cp -r heimdall /var/www/html/
   ```

2. **Garanta as permissões**:
   ```bash
   sudo chown -R www-data:www-data /var/www/html/heimdall
   ```

3. **Inicie o Apache**:
   ```bash
   sudo systemctl start apache2
   ```

4. **Inicie o servidor** (a porta padrão é 8080):
   ```bash
   php ./heimdall.php
   ```

#### Opção 3: Docker *(em breve)*

Containerização planejada para facilitar deploy em ambientes de produção.

## 🎮 Como Usar

### 1️⃣ Acessar a Interface Web

Abra seu navegador e acesse:
```
http://localhost/heimdall/
```

### 2️⃣ Iniciar o Servidor de Monitoramento

**Via CLI** (atualmente):
```bash
php cli/heimdall.php
```

A aplicação:
- Carrega recursos (mapas e dispositivos) dos arquivos json em `interno/sys/`
- Inicia um servidor WebSocket na porta **8080**
- Conecta automaticamente à interface web
- Simultaneamente, faz ping dos dispositivos de forma assíncrona

### 3️⃣ Gerenciar Dispositivos

**Criar novo dispositivo**:
- Com um mapa aberto, clique com o botão direito e selecione "Adicionar dispositivo..."
- Informação necessária:
  - **Endereço IP**: IP ou hostname do dispositivo
O novo dispositivo será gerado no local onde foi clicado inicialmente, e o Heimdall já iniciará o ping no mesmo.

**Visualizar Status**:
- Dispositivos online aparecem com indicador verde
- Dispositivos offline aparecem com indicador vermelho
- O status é atualizado em tempo real

## 📂 Estrutura do Projeto

```
heimdall/
├── index.html              # Interface web principal
├── README.md              # Este arquivo
│
├── cli/
│   └── heimdall.php       # Servidor WebSocket (executar via CLI)
│
└── interno/
    ├── estrutura.php      # Classes principais (Recursos, Mapa, Dispositivo)
    ├── funcoes.php        # Funções auxiliares e configurações
    ├── heimdall.css       # Estilos da interface
    ├── heimdall.js        # Lógica frontend (interface web)
    │
    └── sys/               # Pasta de configurações, deve ter permissão de criação/leitura/escrita pelo apache. Os arquivos aqui dentro são gerados pelo Heimdall.
        ├── config.json    # Configurações (PID do servidor, porta, etc)
        └── recursos.json  # Dados de mapas e dispositivos
```

### 📝 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `heimdall.php` | O coração do Heimdall. Deve permanecer em execução diretamente no servidor. Sem ele, não há monitoramento, nem comunicação com os clientes |
| `estrutura.php` | Define classes: `Recursos`, `Mapa`, `Dispositivo`. Gerencia carregamento/salvamento de dados |
| `funcoes.php` | Funções utilitárias, manipulação WebSocket, configurações globais |
| `index.html` | A página do cliente, que conecta ao servidor e recebe as informações dele |
| `heimdall.js` | Sistema de interface (windows, eventos, comunicação com servidor) |
| `heimdall.css` | Estilo. Deixa tudo bonitinho |

## ⚙️ Configurações

Todas as configurações ficam em `interno/sys/config.json`, que é gerado automaticamente pelo Heimdall ao realizar a primeira execução.

## 🔄 Fluxo de Funcionamento

```
Cliente Web (Browser)
        ↓
   [WebSocket]
        ↓
Servidor (heimdall.php)
        ↓
    Ping (ICMP)
        ↓
   Dispositivos na Rede
```

## 📋 Roadmap / Funcionalidades Planejadas

- [ ] **Painel de Controle Web**: Iniciar/parar servidor via interface (sem CLI)
- [ ] **Leitura SNMP**: Métricas de CPU, memória, interfaces
- [ ] **Alertas**: Notificações por email/Slack em caso de indisponibilidade
- [ ] **Histórico**: Gráficos de disponibilidade ao longo do tempo
- [ ] **Autenticação**: Sistema de login de usuários
- [ ] **API REST**: Integração com sistemas externos
- [ ] **Docker Compose**: Deploy simplificado
- [ ] **Backup Automático**: Exportar/importar configurações
- [ ] **Modo Escuro**: Interface com tema escuro

## 🐛 Troubleshooting

### Erro: "Servidor já em execução"
```
Servidor já em execução com PID XXXXX. Encerrando processo antigo...
```
**Solução**: Processo anterior não foi finalizado corretamente. O Heimdall encerrará automaticamente.

### Ping não funciona
- Verifique se o endereço IP/hostname está correto
- Teste manualmente: `ping <endereco>`
- Verifique firewall bloqueando ICMP
- Em alguns ambientes, ICMP pode estar desabilitado

### Interface web não conecta
- Confirme que `heimdall.php` está executando (verifique porta 8080)
- Firewall pode estar bloqueando a porta 8080
- Verifique no console do navegador (F12) para erros WebSocket

## 👥 Contribuidores

- **Leandro Gabriel** - Desenvolvedor Principal
- **Maurício Jesus Marques Júnior** - Instigação e requisitos de monitoramento eficiente

**Desenvolvido em**: IFRO campus Cacoal (Instituto Federal de Educação, Ciência e Tecnologia de Rondônia)

## 📄 Licença

Distributed under the MIT License. See `LICENSE` for more information.

---

**Status do Projeto**: 🔄 Em desenvolvimento ativo

**Última Atualização**: Abril de 2026

**Dúvidas ou Sugestões?** Abra uma issue ou contate a equipe de TI do IFRO campus Cacoal.

