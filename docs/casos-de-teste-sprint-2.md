# Casos de teste — Sprint 2 (Reservas e Portaria)

Testes de **caixa preta** derivados das regras da versão 2 (RN.12 e RN.14) e dos requisitos de reservas (RF.09) e portaria (RF.10). A numeração continua a da Sprint 1 ([casos-de-teste-sprint-1.md](casos-de-teste-sprint-1.md)).

**Ambiente:** produção (`https://condosyncunc.vercel.app`) ou preview do PR.
**Usuários de demonstração:** os mesmos da Sprint 1 (senha `Condo@2026`). O morador de demonstração mora no **Apto 101 - Bloco A**.
**Dica:** use uma janela anônima para o segundo perfil (ex.: morador numa janela, portaria na outra).

**Status:** ✅ passou · ❌ falhou (abrir issue com label `bug`) · ⏳ não executado

A coluna **Pré-validação** traz o resultado dos testes automatizados e de API feitos durante o desenvolvimento (PRs #35 e #36). A coluna **Execução (QA)** é preenchida ao executar na tela, com o print em `docs/evidencias/`.

---

## 7. Reservas de áreas comuns (RF.09, RN.12 — versão 2)

| ID    | Cenário                                  | Passos                                                                                     | Resultado esperado                                                                      | Pré-validação | Execução (QA)                    |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------- | -------------------------------- |
| CT-37 | Reserva válida                           | Morador → Reservas → Salão de Festas → data futura, turno Noite, 30 convidados → Confirmar | "Reserva confirmada" e a reserva aparece em **Minhas Reservas Ativas**                  | ✅            | ✅ [print](evidencias/CT-37.png) |
| CT-38 | Espaço já reservado no horário           | Abrir o mesmo espaço e a mesma data do CT-37                                               | Turnos **Noite** e **Dia inteiro** aparecem como **Indisponível**                       | ✅            | ✅ [print](evidencias/CT-38.png) |
| CT-39 | Conflito do espaço pela API              | Tentar reservar o mesmo espaço/horário com outro morador (ou repetir o envio)              | "Este espaço já está reservado nesse horário."                                          | ✅            | ⚠️ não executado¹                |
| CT-40 | Morador com duas reservas ao mesmo tempo | Com a reserva do CT-37, reservar a **Churrasqueira** na mesma data e turno                 | "Você já tem outra reserva nesse horário."                                              | ✅            | ✅ [print](evidencias/CT-40.png) |
| CT-41 | Turnos que não se sobrepõem              | Reservar o mesmo espaço do CT-37 na mesma data, turno **Manhã**                            | Reserva confirmada (Manhã não conflita com Noite)                                       | ✅            | ✅ [print](evidencias/CT-41.png) |
| CT-42 | Convidados acima da capacidade           | Churrasqueira (30 pessoas) com 31 convidados                                               | "A capacidade do espaço é de 30 pessoas."                                               | ✅            | ✅ [print](evidencias/CT-42.png) |
| CT-43 | Data no passado                          | Escolher hoje num turno que já passou                                                      | Turno aparece como **Indisponível** e não é possível confirmar                          | ✅            | ✅ [print](evidencias/CT-43.png) |
| CT-44 | Cancelamento com antecedência            | Cancelar uma reserva que começa daqui a mais de 24 h                                       | "Reserva cancelada com sucesso" e o turno volta a ficar disponível                      | ✅            | ✅ [print](evidencias/CT-44.png) |
| CT-45 | Cancelamento em cima da hora             | Cancelar uma reserva que começa em menos de 24 h                                           | "O cancelamento só é permitido com pelo menos 24 h de antecedência. Procure o síndico." | ✅            | ✅ [print](evidencias/CT-45.png) |
| CT-46 | Síndico vê e cancela qualquer reserva    | Síndico → Reservas → aba **Reservas do condomínio** → Cancelar                             | Lista mostra responsável e unidade; cancelamento é aceito mesmo em cima da hora         | ✅            | ⚠️ não executado¹                |
| CT-47 | Só morador reserva                       | Entrar como síndico ou portaria → Reservas                                                 | Não aparece o botão "Reservar espaço"                                                   | ✅            | ✅ [print](evidencias/CT-47.png) |
| CT-48 | Morador vê só as próprias reservas       | Com reservas de dois moradores, entrar como um deles                                       | Aba **Minhas Reservas Ativas** mostra só as dele                                        | ✅            | ⚠️ não executado¹                |
| CT-49 | Próxima reserva na Visão Geral           | Após o CT-37, abrir a Visão Geral                                                          | Card **Próxima Reserva Agendada** mostra a data, o espaço e o turno                     | ✅            | ✅ [print](evidencias/CT-49.png) |

## 8. Portaria e controle de visitantes (RF.10, RN.14 — versão 2)

| ID    | Cenário                                  | Passos                                                                             | Resultado esperado                                                                                   | Pré-validação | Execução (QA)                    |
| ----- | ---------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------- | -------------------------------- |
| CT-50 | Pré-autorização pelo morador             | Morador → **Meus Visitantes** → nome, CPF válido, data/hora futura → Pré-autorizar | Janela com o **código do convite**; visita aparece como **Autorizado — pré-autorizado pelo morador** | ✅            | ✅ [print](evidencias/CT-50.png) |
| CT-51 | Pré-autorização com CPF inválido         | Informar CPF `111.111.111-11`                                                      | "CPF inválido."                                                                                      | ✅            | ✅ [print](evidencias/CT-51.png) |
| CT-52 | Pré-autorização com horário passado      | Informar uma data de ontem                                                         | "Informe uma data e horário a partir de agora."                                                      | ✅            | ✅ [print](evidencias/CT-52.png) |
| CT-53 | Portaria vê o pré-autorizado             | Portaria → Portaria → buscar pelo nome ou pelo código do CT-50                     | Visita aparece como **Autorizado** com o código do convite e o botão **Entrada**                     | ✅            | ⚠️ não executado¹                |
| CT-54 | Entrada e saída                          | No visitante do CT-53: Entrada → Saída                                             | Situação muda para **No condomínio** e depois **Saiu**, com os horários registrados                  | ✅            | ⚠️ não executado¹                |
| CT-55 | Visitante não previsto                   | Portaria → **Visitante não previsto** → dados + Apto 101 - Bloco A → Registrar     | Visita aparece como **Aguardando morador**, sem botão de Entrada                                     | ✅            | ⚠️ não executado¹                |
| CT-56 | Morador confirma pelo app                | Morador → Meus Visitantes → aviso no topo → **Autorizar entrada**                  | Na portaria (em até 15 s) a visita fica **Autorizado — confirmado pelo morador no app**              | ✅            | ⚠️ não executado¹                |
| CT-57 | Confirmação por interfone                | Registrar outro não previsto → Portaria clica **Confirmado por interfone**         | Visita fica **Autorizado — confirmado por interfone**                                                | ✅            | ⚠️ não executado¹                |
| CT-58 | Morador recusa a visita                  | Registrar outro não previsto → Morador clica **Recusar**                           | Visita fica **Recusado / cancelado** e não pode mais entrar                                          | ✅            | ⚠️ não executado¹                |
| CT-59 | Documento mascarado (LGPD)               | Conferir a coluna Visitante na portaria                                            | CPF no formato `529.***.***-25`; RG mostra só os 3 últimos caracteres                                | ✅            | ⚠️ não executado¹                |
| CT-60 | Morador não acessa a portaria            | Entrar como morador e abrir `/portaria`                                            | Volta para a Visão Geral com "acesso negado"; o menu mostra **Meus Visitantes** no lugar de Portaria | ✅            | ⚠️ não executado¹                |
| CT-61 | "Liberar Visitante" do morador (bug #24) | Morador → Visão Geral → **Liberar Visitante**                                      | Abre **Meus Visitantes** (antes levava para a Portaria)                                              | ✅            | ⚠️ não executado¹                |
| CT-62 | Morador cancela pré-autorização          | No CT-50, antes da entrada, clicar **Cancelar**                                    | Visita fica **Recusado / cancelado** e some o botão de Entrada na portaria                           | ✅            | ✅ [print](evidencias/CT-62.png) |

---

## Testes automatizados

Executados em todo Pull Request pelo GitHub Actions (`npm test`, 72 testes no total):

- `tests/reservasService.test.js` — turnos no fuso de Brasília, conflito por espaço e por morador, data passada, capacidade, cancelamento com 24 h de antecedência, permissões por perfil
- `tests/visitasService.test.js` — pré-autorização, visitante não previsto aguardando o morador, confirmação pelo app e pelo interfone, bloqueio de entrada sem autorização, isolamento por unidade, documento mascarado, validação de CPF e placa

## Resumo da execução (09/11/2026)

Executado pelo QA em produção, com Chrome no Windows 11.

| Status                        | Quantidade | Casos                                                    |
| ----------------------------- | ---------- | -------------------------------------------------------- |
| ✅ Passou                     | 14         | CT-37, CT-38, CT-40 a CT-45, CT-47, CT-49 a CT-52, CT-62 |
| ❌ Falhou                     | 0          | —                                                        |
| ⚠️ Não executado em produção¹ | 12         | CT-39, CT-46, CT-48, CT-53 a CT-61                       |

¹ Um impedimento no ambiente de teste não permitiu executar e registrar esses casos em produção durante a sprint. Eles passaram sem falhas na pré-validação (testes automatizados e de API, PRs #35 e #36) e serão reexecutados na Sprint 3 (ver [casos-de-teste-sprint-3.md](casos-de-teste-sprint-3.md#7-reexecução-dos-casos-pendentes-da-sprint-2)).

Observações:

- **CT-40** foi executado com a Churrasqueira no turno Manhã de 20/11, que conflitava com a reserva da Manhã do Salão feita no CT-41.
- **CT-51** foi executado na tela da portaria (visitante não previsto); a validação de CPF é a mesma da pré-autorização.
- **CT-52** foi executado com a data de ontem sem horário; o sistema recusou com "Informe a data e o horário previstos."
- Os prints tiveram abas, favoritos e barra de tarefas removidos, e o CPF digitado no CT-52 foi borrado.
