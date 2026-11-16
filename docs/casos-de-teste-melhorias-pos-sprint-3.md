# Casos de teste — Melhorias pós-Sprint 3 (QA)

Testes de **caixa preta** das melhorias feitas depois do fechamento da Sprint 3, a partir das observações do QA (issues #59, #62 e ajustes de visual e celular). A numeração continua a da Sprint 3 ([casos-de-teste-sprint-3.md](casos-de-teste-sprint-3.md)).

**Ambiente:** produção (`https://condosyncunc.vercel.app`).
**Usuários:** Administração (conta raiz); Maria (`morador@condosync.dev`, Apto 101 - Bloco A, designada síndica pela Administração quando o caso pede síndico); Paulo (`portaria@condosync.dev`). Senha `Condo@2026`.

**Status:** ✅ passou · ❌ falhou (abrir issue com label `bug`)

A coluna **Pré-validação** traz o resultado dos testes automatizados e de tela feitos durante o desenvolvimento (PRs #60 a #70). A coluna **Execução** indica a validação feita pelo QA em produção.

---

## 1. Formulários: campos obrigatórios e menos digitação (#59, PRs #60 e #61)

| ID     | Cenário                             | Passos                                                                    | Resultado esperado                                                               | Pré-validação | Execução         |
| ------ | ----------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------- | ---------------- |
| CT-99  | Campos obrigatórios identificados   | Abrir os formulários de Cadastro, Visitantes, Reservas, Chamados e Avisos | Campos obrigatórios com `*` e a legenda "Campos com * são obrigatórios"          | ✅            | ✅ produção (QA) |
| CT-100 | Erro some ao corrigir               | Enviar um formulário vazio e depois preencher o campo com erro            | O campo fica vermelho com a mensagem; ao digitar, a mensagem some                | ✅            | ✅ produção (QA) |
| CT-101 | Sugestão de visitante já cadastrado | Meus Visitantes → digitar 2 letras do nome de um visitante anterior       | Aparece a sugestão; ao escolher, nome e documento são preenchidos (botão Trocar) | ✅            | ✅ produção (QA) |
| CT-102 | Atalhos de data                     | Meus Visitantes e Reservas → clicar em "Agora", "Hoje 19h", "Amanhã 10h"  | O campo de data/hora é preenchido com o valor do atalho                          | ✅            | ✅ produção (QA) |
| CT-103 | Modelos de texto                    | Novo chamado, novo aviso e nova enquete → escolher um título/modelo       | O campo é preenchido e pode ser editado                                          | ✅            | ✅ produção (QA) |
| CT-104 | Taxa no estilo Pix                  | Administração → Espaços → digitar `3550` na taxa                          | O campo mostra R$ 35,50 enquanto digita e o espaço é salvo com esse valor        | ✅            | ✅ produção (QA) |

## 2. Portaria, chamados, reservas e espaços (#62, PR #63)

| ID     | Cenário                                    | Passos                                                       | Resultado esperado                                                                                                  | Pré-validação | Execução         |
| ------ | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------- |
| CT-105 | Portaria resolve chamado (substitui CT-83) | Portaria abre um chamado Aberto ou Em análise → Resolver     | O chamado vai para Resolvido e o histórico registra a portaria                                                      | ✅            | ✅ produção (QA) |
| CT-106 | Só o síndico reabre                        | Portaria abre um chamado Resolvido; depois a síndica         | Para a portaria não aparece Reabrir; para a síndica aparece e o chamado volta                                       | ✅            | ✅ produção (QA) |
| CT-107 | Portaria sem Enquetes (substitui CT-91)    | Entrar como portaria; tentar o menu e o endereço `/enquetes` | Enquetes não aparece no menu nem na Visão Geral; pelo endereço, volta para a Visão Geral com aviso de acesso negado | ✅            | ✅ produção (QA) |
| CT-108 | Portaria vê todas as reservas              | Portaria → Reservas → Reservas do condomínio                 | Lista todas as reservas com filtro por espaço, busca e telefone do responsável para contato                         | ✅            | ✅ produção (QA) |
| CT-109 | Excluir espaço sem reservas                | Administração → Espaços → Excluir um espaço sem reservas     | O espaço some da lista e das opções de reserva                                                                      | ✅            | ✅ produção (QA) |
| CT-110 | Espaço com histórico não é excluído        | Tentar excluir um espaço que já teve reserva                 | Mensagem orientando a desativar o espaço em vez de excluir; o espaço continua                                       | ✅            | ✅ produção (QA) |

## 3. Meu perfil (PR #63)

| ID     | Cenário               | Passos                                                         | Resultado esperado                                                                       | Pré-validação | Execução         |
| ------ | --------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------- | ---------------- |
| CT-111 | Ver os próprios dados | Menu do avatar → Meu perfil                                    | Nome, e-mail, CPF mascarado, telefone, perfil e unidade do usuário logado                | ✅            | ✅ produção (QA) |
| CT-112 | Editar telefone       | Trocar o telefone e salvar                                     | Mensagem de sucesso; o telefone novo aparece ao recarregar                               | ✅            | ✅ produção (QA) |
| CT-113 | Trocar senha          | Informar senha atual errada; depois a correta e uma senha nova | Senha atual errada: erro no campo. Correta: senha trocada e as outras sessões encerradas | ✅            | ✅ produção (QA) |

## 4. Telas de acesso (PRs #65, #66 e #70)

| ID     | Cenário                      | Passos                                                                              | Resultado esperado                                                | Pré-validação | Execução         |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------- | ---------------- |
| CT-114 | Novo visual                  | Abrir login, cadastro, esqueci a senha e redefinir senha no computador e no celular | Mesmo visual do painel; no celular, uma coluna com o logo em cima | ✅            | ✅ produção (QA) |
| CT-115 | Mostrar/ocultar senha        | Login → clicar no ícone do olho                                                     | A senha digitada aparece e volta a ser escondida                  | ✅            | ✅ produção (QA) |
| CT-116 | Sem "Lembrar de mim"         | Entrar sem marcar a caixinha → fechar e abrir o navegador                           | O sistema pede login de novo                                      | ✅            | ✅ produção (QA) |
| CT-117 | Com "Lembrar de mim" (RF.06) | Entrar marcando a caixinha → fechar e abrir o navegador                             | Continua logado (sessão de 30 dias)                               | ✅            | ✅ produção (QA) |

## 5. Celular (PRs #67, #68 e #69)

| ID     | Cenário                    | Passos                                           | Resultado esperado                                                                          | Pré-validação | Execução         |
| ------ | -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------- | ---------------- |
| CT-118 | Administração no celular   | Entrar como Administração no celular             | Sem rolagem para o lado; cabeçalho em uma linha; abas quebram linha; textos de ajuda curtos | ✅            | ✅ produção (QA) |
| CT-119 | Portaria no celular        | Portaria → Movimentação em tempo real no celular | Cada visita aparece em um cartão com os botões de ação                                      | ✅            | ✅ produção (QA) |
| CT-120 | Meus Visitantes no celular | Morador → Meus Visitantes no celular (iPhone)    | Campo "Data e horário previstos" dentro do card; lista de visitas legível                   | ✅            | ✅ produção (QA) |

## 6. Base de produção para a entrega

| ID     | Cenário                | Passos                                                 | Resultado esperado                                                     | Pré-validação | Execução         |
| ------ | ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- | ------------- | ---------------- |
| CT-121 | Contas iniciais entram | Entrar com Administração, Maria e Paulo (`Condo@2026`) | Cada conta entra com o próprio perfil; não há dados de teste nas telas | ✅            | ✅ produção (QA) |

---

## Testes automatizados

Executados em todo Pull Request pelo GitHub Actions (`npm test`, **174 testes** no total). Novos nesta etapa:

- `tests/perfilService.test.js` — dados do perfil, troca de telefone e troca de senha com encerramento das outras sessões
- `tests/lembrarDeMim.test.js` — duração do token e do cookie com e sem "Lembrar de mim"
- Casos adicionados em `tests/espacosService.test.js` (exclusão com e sem histórico), `tests/reservasService.test.js` (telefone só para quem vê todas) e `tests/chamadosService.test.js` (portaria resolve, só o síndico reabre)

## Resumo da execução (16/11/2026)

Executado pelo QA em produção.

| Execução         | Quantidade | Casos          |
| ---------------- | ---------- | -------------- |
| ✅ Produção (QA) | 23         | CT-99 a CT-121 |
| ❌ Falhou        | 0          | —              |

Os casos CT-105 e CT-107 substituem CT-83 e CT-91 da Sprint 3, por causa da revisão da RN.22 (portaria pode resolver chamados) e da retirada de Enquetes do perfil Portaria.
