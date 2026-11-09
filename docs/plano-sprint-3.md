# Plano da Sprint 3 — Avisos, chamados, enquetes e gestão pelo síndico

**Período:** 10/11 a 20/11/2026 · **Congelamento das funcionalidades (v1.0):** 20/11 · **Entrega:** 27/11

**Objetivo:** ligar ao banco os módulos que ainda usam dados fixos do protótipo, dar ao síndico a gestão de moradores e espaços, e entregar a documentação pedida pelo orientador.

## Backlog

| Ordem | Issue | Entrega                                                              | Resolve | Previsão                  |
| ----- | ----- | -------------------------------------------------------------------- | ------- | ------------------------- |
| 1     | #39   | Gestão de moradores por unidade pelo síndico (RN.04 revisada)        | —       | 10–11/11                  |
| 2     | #40   | Cadastro e edição de espaços pelo síndico                            | —       | 11/11                     |
| 3     | #41   | Mural de avisos no banco (só o síndico publica, leitura, anexos)     | #19     | 12–13/11                  |
| 4     | #42   | Chamados no banco com regra de status por perfil                     | #18     | 14–16/11                  |
| 5     | #43   | Enquetes no banco com voto por unidade (RN.24)                       | —       | 17/11                     |
| 6     | #44   | Visão Geral 100% com dados reais                                     | #17     | 18/11                     |
| 7     | #45   | Plano e execução dos testes, com reexecução dos 12 casos da Sprint 2 | —       | após cada entrega + 19/11 |
| —     | #46   | Casos de uso, modelo relacional e diagramas de sequência             | —       | em paralelo, até 19/11    |
| 8     | #47   | Relatório da Sprint 3                                                | —       | 20/11                     |

## Regras da versão 2 desta sprint

- **RN.04 (revisada):** a unidade informada no cadastro é só uma indicação; o síndico confirma ou corrige na aprovação e gerencia os moradores de cada unidade.
- **RN.20:** só o síndico publica avisos; categoria e urgência separadas.
- **Chamados:** morador abre e acompanha; portaria move para _Em análise_; só o síndico resolve ou reabre.
- **RN.24:** um voto por unidade, alterável até o encerramento.

## Como trabalhar

1. Cada issue em uma branch própria, com Pull Request e `Closes #N`.
2. Após cada merge, o QA executa os casos daquela entrega em produção, com os **três perfis** (morador, portaria e síndico).
3. Defeitos viram issues com label `bug` e são corrigidos dentro da própria sprint.
4. Em 20/11 o código é congelado; a Sprint 4 (21–26/11) fica só para correções, testes finais e preparação da apresentação.
