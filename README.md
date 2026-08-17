# Residência Inteligência Artificial

## Hub de Inovação Industrial · UniSENAI SC

<p align="center">
  <img src="assets/hero/abertura.png" alt="Residência Inteligência Artificial — Hub de Inovação Industrial" width="100%">
</p>

<p align="center"><strong>Uma experiência digital para conectar indústria, formação aplicada e inteligência artificial.</strong></p>

<p align="center"><a href="#funcionalidades">Funcionalidades</a> · <a href="#arquitetura">Arquitetura</a> · <a href="#instalação">Instalação</a> · <a href="#painel-da-coordenação">Painel</a></p>

---

## Sobre o projeto

O Hub de Inovação Industrial é a presença digital da **Residência Inteligência Artificial**, programa do UniSENAI SC que desenvolve projetos de IA aplicada a desafios reais da indústria.

O site foi concebido como uma experiência institucional e operacional ao mesmo tempo: apresenta a proposta do Hub, explica o modelo de colaboração, mostra projetos e cenários ilustrativos, recebe novos desafios e organiza os dados para a coordenação.

> O produto não é apenas uma landing page. É uma porta de entrada para projetos, uma ferramenta de diagnóstico e a base de um sistema de relacionamento com empresas, startups, residentes e parceiros.

## Funcionalidades

### Experiência institucional

- Hero visual com identidade da Residência Inteligência Artificial.
- Seção **Quem somos**, com propósito, modelo de colaboração e pilares de atuação.
- Navegação responsiva, menu mobile e suporte a movimento reduzido.
- Seção **Quem faz**, preparada para coordenação, mentores, especialistas e residentes.
- Empresas participantes organizadas por ciclos.
- Apresentação de projetos de IA aplicada à indústria.
- Área editorial para estudos, artigos, mídia e depoimentos reais futuros.
- Seção **Startups**, com formulário de apresentação de soluções industriais.

### Diagnóstico de prontidão para IA

O diagnóstico avalia cinco dimensões, em uma escala de 0 a 3: definição do problema, disponibilidade de dados, indicador de retorno, apoio organizacional e tempo técnico disponível.

O resultado apresenta score de 0 a 15, estágio de prontidão e próximo passo recomendado. Com GEMINI_API_KEY, o servidor usa o Gemini para gerar uma devolutiva contextualizada, com case semelhante e recomendação de ação. Sem a chave, usa fallback local baseado em regras.

### Captação e relacionamento

Todos os pontos de entrada são enviados ao servidor e podem ser persistidos no Supabase: diagnósticos, empresas, startups, newsletter sensor.IA e interessados em novas turmas. Os formulários possuem consentimento explícito e mensagens de retorno.

### Painel da coordenação

O painel está disponível em /admin.html e oferece login protegido, contagem de diagnósticos, empresas, startups, inscritos e interessados, além de tabelas com os registros mais recentes. A sessão usa cookie HttpOnly; para implantação institucional, recomenda-se SSO ou Supabase Auth.

## Arquitetura

    Navegador
       ├── index.html · experiência e formulários
       └── admin.html · painel restrito
              ↓
    Express / Node.js
       ├── APIs de diagnóstico, leads e inscrições
       ├── Google Gemini · devolutivas personalizadas
       └── Supabase REST · PostgreSQL

### Persistência

O arquivo supabase/schema.sql cria as tabelas diagnostics, company_leads, startup_inquiries, newsletter_subscribers e resident_interests. As tabelas usam PostgreSQL e Row Level Security. A chave SUPABASE_SERVICE_ROLE_KEY fica somente no backend.

## Stack

- HTML5, CSS3 e JavaScript sem framework no frontend;
- Node.js 20+ e Express 5;
- Google Gemini via @google/genai;
- Supabase / PostgreSQL;
- vídeo, imagens e assets locais;
- design responsivo com prefers-reduced-motion.

## Instalação

### Requisitos

- Node.js 20 ou superior;
- uma conta Supabase para persistência;
- chave do Gemini opcional.

### Configuração local

    git clone https://github.com/eumoas/site_residenciaunisenai.git
    cd site_residenciaunisenai
    npm install
    cp .env.example .env

Preencha o .env:

    PORT=3000
    GEMINI_API_KEY=your_gemini_key
    SUPABASE_URL=https://seu-projeto.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ADMIN_PASSWORD=uma_senha_forte

No Supabase, abra o SQL Editor, execute supabase/schema.sql e inicie:

    npm start

- site: http://localhost:3000
- painel: http://localhost:3000/admin.html

## API

| Método | Rota | Uso |
|---|---|---|
| POST | /api/diagnostico | calcula e gera o diagnóstico |
| POST | /api/lead | salva uma empresa interessada |
| POST | /api/startup-inquiry | salva uma apresentação de startup |
| POST | /api/newsletter | registra e-mail da newsletter |
| POST | /api/resident-interest | registra interesse em novas turmas |
| POST | /api/admin/login | inicia sessão da coordenação |
| POST | /api/admin/logout | encerra sessão |
| GET | /api/admin/overview | retorna registros para o painel |

O endpoint de diagnóstico valida as respostas, limita o texto livre e nunca expõe a chave do provedor de IA.

## Conteúdo e governança

Os cenários de personas e cases presentes no site são **fictícios e ilustrativos**. Eles demonstram como a IA pode atuar em problemas industriais e não devem ser apresentados como depoimentos reais.

Depoimentos e resultados reais devem entrar em área separada, com identificação, contexto, evidências e autorização de publicação. Antes da produção, a organização deve revisar LGPD, prazo de retenção, perfis de acesso, backups e consentimentos.

## Roadmap

- [x] Landing institucional responsiva;
- [x] Áreas Quem somos e Quem faz;
- [x] Diagnóstico com fallback local e integração Gemini;
- [x] Persistência preparada para Supabase;
- [x] Painel inicial da coordenação;
- [ ] autenticação institucional com Supabase Auth ou SSO;
- [ ] filtros, exportação CSV e alteração de status;
- [ ] Radar de valor industrial com cálculo real;
- [ ] Blueprint de arquitetura baseado em case selecionado;
- [ ] dashboard de indicadores para a coordenação;
- [ ] depoimentos reais autorizados.

## Estrutura

    .
    ├── index.html
    ├── admin.html
    ├── server.js
    ├── hub-config.js
    ├── personas-ficticias-cases.md
    ├── supabase/schema.sql
    ├── assets/
    ├── apresentacao.html
    ├── hub-v1.html
    └── portfolio-miriam.html

## Licença e uso

Projeto institucional desenvolvido para a Residência Inteligência Artificial · Hub de Inovação Industrial · UniSENAI SC. O uso de marcas, fotografias, dados empresariais e depoimentos deve respeitar as autorizações correspondentes.

## Desenvolvimento

Desenvolvido por **Miriam Aguiar Sobral**.

- GitHub: [@eumoas](https://github.com/eumoas)
- LinkedIn: [miriamaguiarsobral](https://www.linkedin.com/in/miriamaguiarsobral)
