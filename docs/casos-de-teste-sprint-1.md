# Casos de teste — Sprint 1 (Cadastro, Acesso e Permissões)

Testes de **caixa preta**: cada caso descreve a entrada, o passo a passo e o resultado esperado, sem depender do código interno. Os casos foram derivados das regras de negócio (RN), requisitos funcionais (RF) e não funcionais (RNF) do relatório, já com as alterações da versão 2.

**Ambiente:** produção (`https://condosyncunc.vercel.app`) ou preview do PR.
**Usuários de demonstração** (senha `Condo@2026`):

| Perfil   | E-mail                   | CPF              |
| -------- | ------------------------ | ---------------- |
| Morador  | `morador@condosync.dev`  | `111.444.777-35` |
| Portaria | `portaria@condosync.dev` | `222.555.888-46` |
| Síndico  | `sindico@condosync.dev`  | `333.666.999-57` |

**Status:** ✅ passou · ❌ falhou (abrir issue com label `bug`) · ⏳ não executado

A coluna **Pré-validação** indica o resultado obtido nos testes automatizados e de API feitos durante o desenvolvimento. A coluna **Execução (QA)** deve ser preenchida ao executar manualmente na tela, anexando o print em `docs/evidencias/`.

---

## 1. Cadastro de usuários (RF.01, RF.02, RF.04, RN.01, RN.03)

| ID    | Cenário                           | Passos                                                                        | Resultado esperado                                                                   | Pré-validação | Execução (QA) |
| ----- | --------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------- | ------------- |
| CT-01 | Cadastro válido de morador        | Preencher todos os campos, escolher bloco/unidade, aceitar os termos e enviar | Mensagem "Cadastro concluído! Seu acesso será liberado após a aprovação do síndico." | ✅            | ⏳            |
| CT-02 | Campos obrigatórios vazios        | Enviar o formulário sem preencher                                             | Mensagens indicando cada campo obrigatório (RNF.10, RNF.11)                          | ✅            | ⏳            |
| CT-03 | CPF com dígito verificador errado | Informar `529.982.247-26`                                                     | "CPF inválido."                                                                      | ✅            | ⏳            |
| CT-04 | CPF já cadastrado                 | Usar o CPF `111.444.777-35`                                                   | "Já existe um cadastro com este e-mail ou CPF."                                      | ✅            | ⏳            |
| CT-05 | E-mail já cadastrado              | Usar `morador@condosync.dev`                                                  | "Já existe um cadastro com este e-mail ou CPF."                                      | ✅            | ⏳            |
| CT-06 | Senha fraca                       | Senha `condo123` (sem maiúscula e sem caractere especial)                     | Mensagem explicando o critério que falta (RN.03)                                     | ✅            | ⏳            |
| CT-07 | Sem aceite dos termos             | Desmarcar Termos de Uso ou Política de Privacidade                            | Cadastro não é concluído (RF.04)                                                     | ✅            | ⏳            |
| CT-08 | Morador sem unidade               | Perfil Morador sem selecionar unidade                                         | "Morador deve informar a unidade."                                                   | ✅            | ⏳            |
| CT-09 | RG não é solicitado (v2)          | Abrir a tela de cadastro                                                      | Não existe campo de RG (minimização de dados — LGPD)                                 | ✅            | ⏳            |

## 2. Aprovação de cadastro (RF.03, RN.04 — versão 2)

| ID    | Cenário                          | Passos                                   | Resultado esperado                                                                 | Pré-validação | Execução (QA) |
| ----- | -------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- | ------------- | ------------- |
| CT-10 | Usuário pendente não entra       | Logar com um usuário recém-cadastrado    | "Seu cadastro ainda está aguardando a aprovação do síndico."                       | ✅            | ⏳            |
| CT-11 | Síndico vê pendentes             | Entrar como síndico → menu Administração | Lista com nome, perfil, e-mail e unidade do cadastro pendente                      | ✅            | ⏳            |
| CT-12 | Síndico aprova                   | Clicar em Aprovar                        | Cadastro some da lista; usuário passa a conseguir entrar                           | ✅            | ⏳            |
| CT-13 | Síndico recusa                   | Clicar em Recusar e confirmar            | Cadastro some da lista; login do usuário responde "Seu cadastro não foi aprovado." | ✅            | ⏳            |
| CT-14 | Morador não acessa Administração | Entrar como morador e abrir `/admin`     | Redirecionado ao painel (acesso negado); item não aparece no menu                  | ✅            | ⏳            |

## 3. Login (RF.05, RF.06, RN.04, RN.05 — versão 2)

| ID    | Cenário                       | Passos                                               | Resultado esperado                                                             | Pré-validação | Execução (QA) |
| ----- | ----------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | ------------- | ------------- |
| CT-15 | Login por CPF com máscara     | `111.444.777-35` + senha correta                     | Entra no painel do morador                                                     | ✅            | ⏳            |
| CT-16 | Login por CPF sem máscara     | `11144477735` + senha correta                        | Entra no painel                                                                | ✅            | ⏳            |
| CT-17 | Login por e-mail              | `Sindico@CondoSync.dev` (maiúsculas) + senha correta | Entra no painel do síndico                                                     | ✅            | ⏳            |
| CT-18 | Senha errada                  | E-mail correto + senha errada                        | "Credenciais inválidas."                                                       | ✅            | ⏳            |
| CT-19 | Usuário inexistente           | `naoexiste@x.com` + qualquer senha                   | "Credenciais inválidas." (mesma mensagem do CT-18)                             | ✅            | ⏳            |
| CT-20 | Identificador inválido        | `fulano` + qualquer senha                            | "Informe um e-mail ou CPF válido."                                             | ✅            | ⏳            |
| CT-21 | Bloqueio por tentativas       | Errar a senha 6 vezes seguidas com o mesmo e-mail    | Da 6ª em diante: "Muitas tentativas de acesso. Tente novamente em 15 minutos." | ✅            | ⏳            |
| CT-22 | Bloqueio vale com senha certa | Logo após o CT-21, usar a senha correta              | Continua bloqueado até a janela expirar                                        | ✅            | ⏳            |
| CT-23 | Lembrar de mim / sessão       | Entrar, fechar e reabrir o navegador                 | Sessão mantida (RF.06)                                                         | ⏳            | ⏳            |

## 4. Recuperação de senha (RF.07)

| ID    | Cenário                       | Passos                                       | Resultado esperado                                                      | Pré-validação | Execução (QA) |
| ----- | ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | ------------- | ------------- |
| CT-24 | Pedido com e-mail cadastrado  | Esqueceu a senha? → `portaria@condosync.dev` | Mensagem genérica de envio; e-mail com o link é gerado                  | ✅            | ⏳            |
| CT-25 | Pedido com e-mail inexistente | Informar `ninguem@x.com`                     | Mesma mensagem do CT-24; nenhum e-mail gerado                           | ✅            | ⏳            |
| CT-26 | Redefinição com senha fraca   | Abrir o link e informar `fraca`              | Mensagem do critério de senha forte                                     | ✅            | ⏳            |
| CT-27 | Redefinição válida            | Abrir o link e informar `Nova@2026`          | "Senha redefinida!"; login com a senha nova funciona e com a antiga não | ✅            | ⏳            |
| CT-28 | Link usado duas vezes         | Abrir o mesmo link de novo                   | "Este link de redefinição é inválido ou expirou."                       | ✅            | ⏳            |

## 5. Controle de acesso e segurança (RF.08, RN.06, RN.08, RN.09, RN.27, RNF.01–RNF.04)

| ID    | Cenário                                         | Passos                                                          | Resultado esperado                                                                                     | Pré-validação | Execução (QA) |
| ----- | ----------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- | ------------- |
| CT-29 | Rota protegida sem login                        | Abrir `/painel` em janela anônima                               | Redirecionado para `/login`                                                                            | ✅            | ⏳            |
| CT-30 | API protegida sem login                         | Abrir `/api/admin/cadastros` em janela anônima                  | `{"error":"Não autenticado."}`                                                                         | ✅            | ⏳            |
| CT-31 | Menu por perfil                                 | Entrar com cada perfil                                          | Morador: sem Portaria e Administração · Portaria: com Portaria · Síndico: com Portaria e Administração | ✅            | ⏳            |
| CT-32 | Sem troca de perfil manual (v2)                 | Procurar seletor de perfil no cabeçalho                         | Não existe; o perfil vem do login                                                                      | ✅            | ⏳            |
| CT-33 | Senha armazenada com hash                       | Consultar `senha_hash` na tabela `usuarios` no Supabase         | Valor começa com `$2b$` (bcrypt), nunca a senha em texto                                               | ✅            | ⏳            |
| CT-34 | Dados inacessíveis pela API pública do Supabase | Consultar a tabela `usuarios` pela Data API com a chave pública | Nenhum dado retornado (RLS ligado e privilégios revogados)                                             | ✅            | ⏳            |

## 6. Interface (RNF.05–RNF.15)

| ID    | Cenário                           | Passos                                                                  | Resultado esperado                                           | Pré-validação | Execução (QA) |
| ----- | --------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ | ------------- | ------------- |
| CT-35 | Responsividade                    | Abrir login, cadastro e painel em largura de celular (DevTools, 375 px) | Sem rolagem horizontal; campos e botões utilizáveis (RNF.15) | ⏳            | ⏳            |
| CT-36 | Campos obrigatórios identificados | Observar os formulários                                                 | Campos obrigatórios sinalizados (RNF.10)                     | ⏳            | ⏳            |

---

## Testes automatizados

Executados em todo Pull Request pelo GitHub Actions (`npm test`):

- `tests/validators.test.js` — CPF (máscara, dígitos verificadores, sequências repetidas), senha forte, login por e-mail ou CPF, cadastro sem RG e regras de unidade/termos, redefinição de senha
- `tests/cadastrosService.test.js` — aprovação e recusa restritas ao condomínio do síndico

## Como registrar as evidências

1. Executar o caso na tela e tirar o print do resultado.
2. Salvar em `docs/evidencias/CT-XX.png`.
3. Atualizar a coluna **Execução (QA)** com ✅ ou ❌.
4. Para cada ❌, abrir uma issue com label `bug` citando o ID do caso.
