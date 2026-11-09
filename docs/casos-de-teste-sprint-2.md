# Casos de teste — Sprint 2 (Reservas e Portaria)

Testes de **caixa preta** derivados das regras da versão 2 (RN.12 e RN.14) e dos requisitos de reservas (RF.09) e portaria (RF.10). A numeração continua a da Sprint 1 ([casos-de-teste-sprint-1.md](casos-de-teste-sprint-1.md)).

**Ambiente:** produção (`https://condosyncunc.vercel.app`) ou preview do PR.
**Usuários de demonstração:** os mesmos da Sprint 1 (senha `Condo@2026`). O morador de demonstração mora no **Apto 101 - Bloco A**.
**Dica:** use uma janela anônima para o segundo perfil (ex.: morador numa janela, portaria na outra).

**Status:** ✅ passou · ❌ falhou (abrir issue com label `bug`) · ⏳ não executado

A coluna **Pré-validação** traz o resultado dos testes automatizados e de API feitos durante o desenvolvimento (PRs #35 e #36). A coluna **Execução (QA)** é preenchida ao executar na tela, com o print em `docs/evidencias/`.

---

## 7. Reservas de áreas comuns (RF.09, RN.12 — versão 2)

| ID    | Cenário                                  | Passos                                                                                     | Resultado esperado                                                                      | Pré-validação | Execução (QA) |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------- | ------------- |
| CT-37 | Reserva válida                           | Morador → Reservas → Salão de Festas → data futura, turno Noite, 30 convidados → Confirmar | "Reserva confirmada" e a reserva aparece em **Minhas Reservas Ativas**                  | ✅            | ⏳            |
| CT-38 | Espaço já reservado no horário           | Abrir o mesmo espaço e a mesma data do CT-37                                               | Turnos **Noite** e **Dia inteiro** aparecem como **Indisponível**                       | ✅            | ⏳            |
| CT-39 | Conflito do espaço pela API              | Tentar reservar o mesmo espaço/horário com outro morador (ou repetir o envio)              | "Este espaço já está reservado nesse horário."                                          | ✅            | ⏳            |
| CT-40 | Morador com duas reservas ao mesmo tempo | Com a reserva do CT-37, reservar a **Churrasqueira** na mesma data e turno                 | "Você já tem outra reserva nesse horário."                                              | ✅            | ⏳            |
| CT-41 | Turnos que não se sobrepõem              | Reservar o mesmo espaço do CT-37 na mesma data, turno **Manhã**                            | Reserva confirmada (Manhã não conflita com Noite)                                       | ✅            | ⏳            |
| CT-42 | Convidados acima da capacidade           | Churrasqueira (30 pessoas) com 31 convidados                                               | "A capacidade do espaço é de 30 pessoas."                                               | ✅            | ⏳            |
| CT-43 | Data no passado                          | Escolher hoje num turno que já passou                                                      | Turno aparece como **Indisponível** e não é possível confirmar                          | ✅            | ⏳            |
| CT-44 | Cancelamento com antecedência            | Cancelar uma reserva que começa daqui a mais de 24 h                                       | "Reserva cancelada com sucesso" e o turno volta a ficar disponível                      | ✅            | ⏳            |
| CT-45 | Cancelamento em cima da hora             | Cancelar uma reserva que começa em menos de 24 h                                           | "O cancelamento só é permitido com pelo menos 24 h de antecedência. Procure o síndico." | ✅            | ⏳            |
| CT-46 | Síndico vê e cancela qualquer reserva    | Síndico → Reservas → aba **Reservas do condomínio** → Cancelar                             | Lista mostra responsável e unidade; cancelamento é aceito mesmo em cima da hora         | ✅            | ⏳            |
| CT-47 | Só morador reserva                       | Entrar como síndico ou portaria → Reservas                                                 | Não aparece o botão "Reservar espaço"                                                   | ✅            | ⏳            |
| CT-48 | Morador vê só as próprias reservas       | Com reservas de dois moradores, entrar como um deles                                       | Aba **Minhas Reservas Ativas** mostra só as dele                                        | ✅            | ⏳            |
| CT-49 | Próxima reserva na Visão Geral           | Após o CT-37, abrir a Visão Geral                                                          | Card **Próxima Reserva Agendada** mostra a data, o espaço e o turno                     | ✅            | ⏳            |

## 8. Portaria e controle de visitantes (RF.10, RN.14 — versão 2)

| ID    | Cenário                                  | Passos                                                                             | Resultado esperado                                                                                   | Pré-validação | Execução (QA) |
| ----- | ---------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------- | ------------- |
| CT-50 | Pré-autorização pelo morador             | Morador → **Meus Visitantes** → nome, CPF válido, data/hora futura → Pré-autorizar | Janela com o **código do convite**; visita aparece como **Autorizado — pré-autorizado pelo morador** | ✅            | ⏳            |
| CT-51 | Pré-autorização com CPF inválido         | Informar CPF `111.111.111-11`                                                      | "CPF inválido."                                                                                      | ✅            | ⏳            |
| CT-52 | Pré-autorização com horário passado      | Informar uma data de ontem                                                         | "Informe uma data e horário a partir de agora."                                                      | ✅            | ⏳            |
| CT-53 | Portaria vê o pré-autorizado             | Portaria → Portaria → buscar pelo nome ou pelo código do CT-50                     | Visita aparece como **Autorizado** com o código do convite e o botão **Entrada**                     | ✅            | ⏳            |
| CT-54 | Entrada e saída                          | No visitante do CT-53: Entrada → Saída                                             | Situação muda para **No condomínio** e depois **Saiu**, com os horários registrados                  | ✅            | ⏳            |
| CT-55 | Visitante não previsto                   | Portaria → **Visitante não previsto** → dados + Apto 101 - Bloco A → Registrar     | Visita aparece como **Aguardando morador**, sem botão de Entrada                                     | ✅            | ⏳            |
| CT-56 | Morador confirma pelo app                | Morador → Meus Visitantes → aviso no topo → **Autorizar entrada**                  | Na portaria (em até 15 s) a visita fica **Autorizado — confirmado pelo morador no app**              | ✅            | ⏳            |
| CT-57 | Confirmação por interfone                | Registrar outro não previsto → Portaria clica **Confirmado por interfone**         | Visita fica **Autorizado — confirmado por interfone**                                                | ✅            | ⏳            |
| CT-58 | Morador recusa a visita                  | Registrar outro não previsto → Morador clica **Recusar**                           | Visita fica **Recusado / cancelado** e não pode mais entrar                                          | ✅            | ⏳            |
| CT-59 | Documento mascarado (LGPD)               | Conferir a coluna Visitante na portaria                                            | CPF no formato `529.***.***-25`; RG mostra só os 3 últimos caracteres                                | ✅            | ⏳            |
| CT-60 | Morador não acessa a portaria            | Entrar como morador e abrir `/portaria`                                            | Volta para a Visão Geral com "acesso negado"; o menu mostra **Meus Visitantes** no lugar de Portaria | ✅            | ⏳            |
| CT-61 | "Liberar Visitante" do morador (bug #24) | Morador → Visão Geral → **Liberar Visitante**                                      | Abre **Meus Visitantes** (antes levava para a Portaria)                                              | ✅            | ⏳            |
| CT-62 | Morador cancela pré-autorização          | No CT-50, antes da entrada, clicar **Cancelar**                                    | Visita fica **Recusado / cancelado** e some o botão de Entrada na portaria                           | ✅            | ⏳            |

---

## Testes automatizados

Executados em todo Pull Request pelo GitHub Actions (`npm test`, 72 testes no total):

- `tests/reservasService.test.js` — turnos no fuso de Brasília, conflito por espaço e por morador, data passada, capacidade, cancelamento com 24 h de antecedência, permissões por perfil
- `tests/visitasService.test.js` — pré-autorização, visitante não previsto aguardando o morador, confirmação pelo app e pelo interfone, bloqueio de entrada sem autorização, isolamento por unidade, documento mascarado, validação de CPF e placa

## Resumo da execução

Preencher após a execução na tela:

| Status           | Quantidade | Casos |
| ---------------- | ---------- | ----- |
| ✅ Passou        |            |       |
| ❌ Falhou        |            |       |
| ⏳ Não executado | 26         | Todos |
