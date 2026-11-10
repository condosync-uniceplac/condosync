# Casos de teste — Sprint 3 (Administração, Espaços, Avisos, Chamados, Enquetes e Visão Geral)

Testes de **caixa preta** derivados das regras da versão 2 (RN.03, RN.05, RN.06, RN.12, RN.20, RN.22, RN.24) e dos bugs #17, #18 e #19. A numeração continua a da Sprint 2 ([casos-de-teste-sprint-2.md](casos-de-teste-sprint-2.md)).

**Ambiente:** produção (`https://condosyncunc.vercel.app`).
**Usuários:** admin do projeto; Maria (síndica, Apto 101 - Bloco A); Paulo (portaria); **Morador Teste A** (`moradora@condosync.dev`, Apto 102 - Bloco B) e **Morador Teste B** (`moradorb@condosync.dev`, Apto 101 - Bloco A, mesma unidade da Maria). Senha `Condo@2026`.

**Status:** ✅ passou · ❌ falhou (abrir issue com label `bug`)

A coluna **Pré-validação** traz o resultado dos testes automatizados e de API feitos durante o desenvolvimento (PRs #49 a #56). A coluna **Execução** indica onde o caso foi validado: em produção pelo QA ou nos testes automatizados e em ambiente local¹.

---

## 1. Administração e perfis (#39 — RN.03, RN.05, RN.06)

| ID    | Cenário                                | Passos                                                                        | Resultado esperado                                                                                                | Pré-validação | Execução               |
| ----- | -------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------- |
| CT-63 | Admin designa o síndico                | Admin → Administração → Sindicatura → escolher a Maria → Designar             | Maria passa a síndica; a sessão dela expira e, ao entrar de novo, aparece o menu **Administração**                | ✅            | ✅ produção (QA)       |
| CT-64 | Cadastro sem escolha de perfil         | Abrir `/cadastro`                                                             | Não existe campo de perfil; a conta é criada como morador **pendente**                                            | ✅            | ✅ produção (QA)       |
| CT-65 | Síndica aprova cadastros               | Síndica → Administração → Cadastros pendentes → Aprovar Morador A e Morador B | Os dois conseguem entrar                                                                                          | ✅            | ✅ produção (QA)       |
| CT-66 | Mover morador de unidade               | Aba Moradores → trocar a unidade do Morador A e depois voltar                 | Morador A é deslogado e, ao entrar, vê a unidade nova                                                             | ✅            | ✅ produção (QA)       |
| CT-67 | Criar conta de portaria                | Aba Portaria → nome, e-mail e CPF → Criar                                     | Aparece o link de convite (o e-mail não chega no remetente de teste); pelo link o porteiro define a senha e entra | ✅            | ✅ produção (QA)       |
| CT-68 | Desativar portaria                     | Desativar o porteiro do CT-67                                                 | O porteiro não consegue mais entrar                                                                               | ✅            | ✅ produção (QA)       |
| CT-69 | Admin só administra                    | Entrar como admin e abrir `/painel`                                           | Menu mostra só **Administração**; `/painel` leva para `/admin`                                                    | ✅            | ✅ produção (QA)       |
| CT-97 | Retirar e devolver a função de síndico | Admin → Sindicatura → Retirar função → Designar de novo                       | Maria volta a moradora e depois a síndica; a sessão expira nas duas vezes                                         | ✅            | ✅ automatizado/local¹ |
| CT-98 | Remover morador                        | Síndica → Moradores → Remover o Morador B                                     | Morador B não consegue mais entrar                                                                                | ✅            | ✅ automatizado/local¹ |

## 2. Espaços comuns (#40 — RN.12)

| ID    | Cenário             | Passos                                                            | Resultado esperado                          | Pré-validação | Execução               |
| ----- | ------------------- | ----------------------------------------------------------------- | ------------------------------------------- | ------------- | ---------------------- |
| CT-70 | Síndica cria espaço | Administração → Espaços → "Churrasqueira 2", capacidade 20, R$ 50 | O espaço aparece em Reservas para o morador | ✅            | ✅ produção (QA)       |
| CT-71 | Desativar espaço    | Editar o espaço e marcar como inativo                             | Some das opções de reserva do morador       | ✅            | ✅ automatizado/local¹ |
| CT-72 | Validação do espaço | Capacidade 0 ou valor negativo                                    | Mensagem de erro no campo                   | ✅            | ✅ produção (QA)       |

## 3. Mural de avisos (#41 — RN.20, bug #19)

| ID    | Cenário                         | Passos                                                 | Resultado esperado                                                | Pré-validação | Execução               |
| ----- | ------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- | ------------- | ---------------------- |
| CT-73 | Síndica publica aviso com anexo | Novo aviso → Manutenção + Urgente + PDF                | Aviso no topo do mural com selo Urgente e o anexo                 | ✅            | ✅ automatizado/local¹ |
| CT-74 | Leitura e download              | Morador abre o mural → baixa o PDF → Confirmar leitura | Download funciona; contador do sino diminui; "Lido por N" aumenta | ✅            | ✅ automatizado/local¹ |
| CT-75 | Só o síndico publica            | Abrir o mural como morador e como portaria             | Não aparece o botão **Novo aviso**                                | ✅            | ✅ produção (QA)       |
| CT-76 | Anexo falso recusado            | Anexar um .txt renomeado para .pdf                     | "O conteúdo do arquivo não corresponde à extensão"                | ✅            | ✅ produção (QA)       |
| CT-77 | Editar e remover aviso          | Síndica edita e depois remove o aviso                  | Aparece "editado"; depois de removido, some para todos            | ✅            | ✅ produção (QA)       |
| CT-78 | Filtro por categoria            | Clicar numa categoria do mural                         | Aparecem só os avisos daquela categoria                           | ✅            | ✅ produção (QA)       |

## 4. Chamados (#42 — RN.22, bug #18)

| ID    | Cenário                         | Passos                                        | Resultado esperado                                                    | Pré-validação | Execução               |
| ----- | ------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- | ------------- | ---------------------- |
| CT-79 | Morador abre chamado com foto   | Morador A → Registrar Ocorrência com foto JPG | Chamado em **Aberto** com o ícone "Foto"                              | ✅            | ✅ automatizado/local¹ |
| CT-80 | Morador vê só os próprios       | Morador B abre Chamados                       | Não vê o chamado do Morador A                                         | ✅            | ✅ produção (QA)       |
| CT-81 | Morador não muda status         | Morador A abre o próprio chamado              | Sem botões de status; aviso "Somente a administração altera o status" | ✅            | ✅ produção (QA)       |
| CT-82 | Portaria coloca em análise      | Portaria → comentário → Mover para Em análise | Chamado em Em análise; histórico mostra o comentário                  | ✅            | ✅ produção (QA)       |
| CT-83 | Portaria não resolve nem reabre | Portaria abre o chamado em análise            | Não aparece Resolver/Reabrir; só "Registrar comentário"               | ✅            | ✅ produção (QA)       |
| CT-84 | Síndica resolve                 | Síndica → comentário → Marcar como resolvido  | Chamado em Resolvido; morador vê o histórico completo                 | ✅            | ✅ produção (QA)       |
| CT-85 | Síndica reabre                  | Síndica → Reabrir                             | Volta para Aberto/Em análise e o histórico registra                   | ✅            | ✅ automatizado/local¹ |

## 5. Enquetes (#43 — RN.24)

| ID    | Cenário              | Passos                                                    | Resultado esperado                                                 | Pré-validação | Execução               |
| ----- | -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ | ------------- | ---------------------- |
| CT-86 | Síndica cria enquete | Nova enquete com 3 opções, encerrando em 7 dias           | Aparece em Votações abertas                                        | ✅            | ✅ produção (QA)       |
| CT-87 | Validação da enquete | Data passada; uma opção; opções repetidas                 | Mensagem de erro em cada caso                                      | ✅            | ✅ produção (QA)       |
| CT-88 | Morador vota         | Morador A escolhe uma opção                               | Resultado parcial e a opção dele marcada                           | ✅            | ✅ produção (QA)       |
| CT-89 | Alterar o voto       | Morador A escolhe outra opção                             | O voto muda e o total não aumenta                                  | ✅            | ✅ automatizado/local¹ |
| CT-90 | Um voto por unidade  | Maria vota; Morador B (mesma unidade) vota em outra opção | Total igual; Maria vê "registrado por Morador Teste B"             | ✅            | ✅ automatizado/local¹ |
| CT-91 | Portaria não vota    | Portaria abre Enquetes                                    | Vê o resultado, mas não consegue votar                             | ✅            | ✅ produção (QA)       |
| CT-92 | Síndica encerra      | Encerrar votação agora                                    | Vai para Encerradas com a vencedora em destaque; ninguém mais vota | ✅            | ✅ produção (QA)       |

## 6. Visão Geral (#44, bug #17)

| ID    | Cenário                  | Passos                                             | Resultado esperado                          | Pré-validação | Execução               |
| ----- | ------------------------ | -------------------------------------------------- | ------------------------------------------- | ------------- | ---------------------- |
| CT-93 | Cada morador vê só o seu | Comparar a Visão Geral do Morador A e do Morador B | Reserva, visitantes e chamados de cada um   | ✅            | ✅ automatizado/local¹ |
| CT-94 | Condomínio real no menu  | Olhar o cartão "Condomínio"                        | Nome, número de unidades e blocos reais     | ✅            | ✅ produção (QA)       |
| CT-95 | Votações na Visão Geral  | Morador com enquete aberta                         | "Falta votar" e, depois de votar, "Votou"   | ✅            | ✅ produção (QA)       |
| CT-96 | Visão Geral da portaria  | Entrar como portaria                               | "Reservas de Hoje" e sem botão Nova Reserva | ✅            | ✅ produção (QA)       |

## 7. Reexecução dos casos pendentes da Sprint 2

Os 12 casos marcados como "não executado" na Sprint 2 foram reexecutados com o Morador Teste A no lugar da Maria. Passos e resultados esperados estão em [casos-de-teste-sprint-2.md](casos-de-teste-sprint-2.md).

| ID    | Cenário                                  | Pré-validação | Execução               |
| ----- | ---------------------------------------- | ------------- | ---------------------- |
| CT-39 | Conflito do espaço pela API              | ✅            | ✅ automatizado/local¹ |
| CT-46 | Síndico vê e cancela qualquer reserva    | ✅            | ✅ automatizado/local¹ |
| CT-48 | Morador vê só as próprias reservas       | ✅            | ✅ automatizado/local¹ |
| CT-53 | Portaria vê o pré-autorizado             | ✅            | ✅ produção (QA)       |
| CT-54 | Entrada e saída                          | ✅            | ✅ automatizado/local¹ |
| CT-55 | Visitante não previsto                   | ✅            | ✅ automatizado/local¹ |
| CT-56 | Morador confirma pelo app                | ✅            | ✅ automatizado/local¹ |
| CT-57 | Confirmação por interfone                | ✅            | ✅ automatizado/local¹ |
| CT-58 | Morador recusa a visita                  | ✅            | ✅ automatizado/local¹ |
| CT-59 | Documento mascarado (LGPD)               | ✅            | ✅ produção (QA)       |
| CT-60 | Morador não acessa a portaria            | ✅            | ✅ produção (QA)       |
| CT-61 | "Liberar Visitante" do morador (bug #24) | ✅            | ✅ produção (QA)       |

---

## Testes automatizados

Executados em todo Pull Request pelo GitHub Actions (`npm test`, **148 testes** no total). Novos nesta sprint:

- `tests/sindicaturaService.test.js` e `tests/moradoresService.test.js` — designar e retirar o síndico, um síndico ativo por condomínio, mover e remover morador, contas de portaria, expiração da sessão
- `tests/espacosService.test.js` — criação, edição e validação de espaços
- `tests/avisosService.test.js` — só o síndico publica, leitura, anexos PDF/PNG/JPG até 2 MB conferidos pelo conteúdo
- `tests/chamadosService.test.js` — todas as combinações perfil × status da RN.22, comentários, visibilidade do morador, foto
- `tests/enquetesService.test.js` — criação e prazos, um voto por unidade (troca em vez de somar), quem vota, encerramento

## Resumo da execução (10/11/2026)

Executado pelo QA em produção, sem registro em print. Os registros gerados em produção (aprovações, conta de portaria, espaço, chamado e seu histórico, enquete encerrada, votos e visita) foram conferidos no banco no mesmo dia.

| Execução               | Quantidade | Casos                                                                                                                                                                                                            |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Produção (QA)       | 30         | CT-53, CT-59, CT-60, CT-61, CT-63, CT-64, CT-65, CT-66, CT-67, CT-68, CT-69, CT-70, CT-72, CT-75, CT-76, CT-77, CT-78, CT-80, CT-81, CT-82, CT-83, CT-84, CT-86, CT-87, CT-88, CT-91, CT-92, CT-94, CT-95, CT-96 |
| ✅ Automatizado/local¹ | 18         | CT-39, CT-46, CT-48, CT-54, CT-55, CT-56, CT-57, CT-58, CT-71, CT-73, CT-74, CT-79, CT-85, CT-89, CT-90, CT-93, CT-97, CT-98                                                                                     |
| ❌ Falhou              | 0          | —                                                                                                                                                                                                                |

¹ Casos validados pelos testes automatizados (GitHub Actions) e pelos testes de API e de tela em ambiente local feitos durante o desenvolvimento, sem registro correspondente em produção na data da execução do QA.
