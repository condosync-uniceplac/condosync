# CondoSync — Alterações da versão 2

Melhorias definidas após a primeira apresentação. Cada item mostra a regra ou requisito como estava no relatório parcial, o problema identificado e como ficou. Serve de base para atualizar o relatório (issue #11) e montar o slide **"Evolução do projeto"**.

## 1. Já implementadas (Sprint 1)

| Item                                    | Versão 1 (relatório parcial)                                                   | Problema                                                               | Versão 2                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **RF.05 — Login**                       | Login por "e-mail ou identificador"                                            | Identificador vago; mensagens de erro podiam revelar se a conta existe | Login por **e-mail ou CPF** (com ou sem máscara), mensagem genérica "Credenciais inválidas." e **bloqueio de 15 min após 5 tentativas** |
| **RF.03 / RN.04 — Perfil e aprovação**  | O usuário escolhia o próprio perfil no cadastro                                | Qualquer pessoa poderia se cadastrar como síndico                      | Todo cadastro nasce **pendente**; o **síndico aprova ou recusa** na tela Administração                                                  |
| **RF.01 — Dados do cadastro**           | Pedia nome, e-mail, telefone, CPF, **RG**, unidade, data de nascimento e senha | Coleta de dados além do necessário (princípio da minimização da LGPD)  | **RG removido** do formulário e do banco                                                                                                |
| **RF.02 — Validação**                   | Validação genérica dos dados                                                   | CPF inválido podia ser aceito                                          | CPF validado pelos **dígitos verificadores**                                                                                            |
| **RN.02 — Endereço**                    | Endereço obrigatório para moradores (opcional na tela)                         | Regra e tela inconsistentes; o endereço é do condomínio                | Morador seleciona **bloco e unidade**                                                                                                   |
| **RF.07 — Recuperação de senha**        | Apenas "iniciar o processo"                                                    | Sem definição de segurança                                             | Link por e-mail **de uso único, válido por 1 hora**; resposta igual exista ou não o e-mail                                              |
| **RF.08 — Controle de acesso**          | Protótipo com seletor de perfil no cabeçalho e botões "Entrar como..."         | Permitia trocar de perfil e entrar sem senha                           | **Perfil vem do login**; menu e rotas filtrados por perfil no servidor                                                                  |
| **RN.09 / RNF.02 — Proteção dos dados** | "Dados protegidos" (genérico)                                                  | O Supabase expõe o banco por uma API pública                           | **RLS ligado em todas as tabelas** e acesso da chave pública revogado; o banco só é acessado pelo servidor                              |
| **RN.06 — Perfis**                      | Morador, síndico ou "administrador"                                            | Inconsistente com RF.03 e o protótipo (Portaria)                       | Perfis padronizados: **Morador, Portaria e Síndico**                                                                                    |

## 2. Previstas para a Sprint 3

| Item                               | Versão 1                                               | Problema                                           | Versão 2                                                                                                           |
| ---------------------------------- | ------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **RN.12 — Conflito de reservas**   | "Não poderá realizar duas reservas no mesmo horário"   | Ambígua (o espaço ou o morador?)                   | Duas regras: o **espaço** não pode ter horários sobrepostos e o **morador** não pode ter duas reservas simultâneas |
| **Cancelamento de reserva**        | Não existia                                            | Lacuna                                             | Morador cancela com antecedência mínima                                                                            |
| **Cadastro de espaços**            | Não existia requisito                                  | Não havia como gerenciar os espaços                | Síndico cadastra e edita espaços                                                                                   |
| **RN.14 — Visitantes**             | Morador autoriza, mas a tela de cadastro é da portaria | Fluxo indefinido                                   | Morador **pré-autoriza**; visitante não previsto é cadastrado pela portaria e aguarda confirmação                  |
| **Dados de visitantes**            | CPF completo na listagem da portaria                   | Exposição de dado pessoal                          | CPF **mascarado** (`384.***.***-12`)                                                                               |
| **RN.20 — Avisos**                 | "Usuários cadastrados" publicam avisos                 | Qualquer morador publicaria comunicados oficiais   | Apenas o **síndico** publica                                                                                       |
| **Categoria x urgência de avisos** | Misturadas no protótipo                                | Filtros confusos                                   | Categoria e urgência separadas                                                                                     |
| **Chamados**                       | Morador via botões de mudar status                     | Morador alteraria o próprio chamado                | Só o **síndico** altera o status                                                                                   |
| **RN.24 — Votação**                | Um voto **por usuário**                                | Uma família com várias contas votaria várias vezes | Um voto **por unidade**, alterável até o encerramento                                                              |

## 3. Correções no relatório

- [ ] Capa: curso **Engenharia de Software** (está "Análise e Desenvolvimento de Sistemas")
- [ ] Nome da disciplina padronizado: **Projeto Integrado de Engenharia de Produto**
- [ ] Data de 2025 na página do orientador → 2026
- [ ] RN.20: "castrar" → "cadastrar"
- [ ] Atualizar RN e RF da seção 1 acima
- [ ] Registrar as decisões técnicas da implementação: JavaScript com validação Zod, autenticação própria (bcrypt + sessão JWT em cookie), PostgreSQL no Supabase acessado só pelo servidor, deploy na Vercel e CI no GitHub Actions
- [ ] Preencher **Evidências de Teste** com os casos de `docs/casos-de-teste-sprint-1.md`

## 4. Sugestão de slide "Evolução do projeto"

> **Da proposta ao produto: o que mudou após a primeira apresentação**
>
> - 🔐 **Acesso seguro:** cadastro aprovado pelo síndico · login por e-mail ou CPF · bloqueio após tentativas
> - 🛡️ **LGPD:** menos dados coletados (sem RG) · banco inacessível pela API pública
> - 🗳️ **Regras mais justas:** voto por unidade · conflito de reservas por espaço e por morador
> - 👥 **Papéis claros:** só o síndico publica avisos e altera chamados
