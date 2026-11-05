# Registro de bugs e melhorias — Sprint 2

Problemas encontrados nos testes de caixa preta da Sprint 2 (30/10 – 09/11/2026), executados pelo QA em produção (`condosyncunc.vercel.app`). Cada item tem uma issue no GitHub (milestone **Sprint 2**), o que permite rastrear do teste ao bug e à correção.

**Gravidade:** 🔴 Alta (quebra regra de negócio ou segurança) · 🟡 Média (funcionalidade não funciona) · 🟢 Baixa (usabilidade)

## 1. Resumo

| Issue | Tipo     | Gravidade | Descrição                                                              | Situação                 |
| ----- | -------- | --------- | ---------------------------------------------------------------------- | ------------------------ |
| #17   | Bug      | 🔴 Alta   | Dados das telas compartilhados entre todos os usuários                 | Planejado — Sprint 3     |
| #18   | Bug      | 🔴 Alta   | Morador consegue mudar o status dos chamados                           | Planejado — Sprint 3     |
| #24   | Bug      | 🔴 Alta   | Morador não consegue liberar visitantes (botão leva para a Portaria)   | Planejado — Sprint 3     |
| #19   | Bug      | 🟡 Média  | Download de anexo no Mural de Avisos não baixa o arquivo               | Planejado — Sprint 3     |
| #26   | Bug      | 🟡 Média  | Link de redefinição já usado mostrava o formulário normalmente (CT-28) | ✅ Corrigido — PR #25    |
| #20   | Bug      | 🟢 Baixa  | Redefinição de senha aceitava a mesma senha atual                      | ✅ Corrigido — PR #22    |
| #21   | Melhoria | 🟢 Baixa  | Atalho para Enquetes na Visão Geral                                    | ✅ Implementado — PR #22 |
| #27   | Melhoria | 🟢 Baixa  | Orientações de preenchimento abaixo dos campos do cadastro             | Pendente                 |

**Totais:** 6 bugs (2 corrigidos, 4 planejados para a Sprint 3) e 2 melhorias (1 implementada, 1 pendente).

## 2. Detalhamento

### #17 — Dados compartilhados entre todos os usuários 🔴

- **Como foi encontrado:** ao entrar com usuários diferentes, as mesmas informações apareciam para todos (ex.: "visitantes esperados hoje").
- **Causa:** as telas de Visão Geral, Reservas, Portaria, Avisos, Chamados e Enquetes ainda usavam os dados de demonstração do protótipo, guardados no navegador (`localStorage`), e não o banco de dados.
- **Correção planejada:** ligar cada módulo à API e ao banco, com dados filtrados por perfil, unidade e condomínio (Sprint 3).
- **Regras:** RN.08, RN.09, RNF.03

### #18 — Morador consegue mudar o status dos chamados 🔴

- **Como foi encontrado:** logado como morador, foi possível mover chamados entre as colunas Aberto, Em análise e Resolvido.
- **Causa:** a tela não verificava o perfil e não havia validação no servidor.
- **Decisão do grupo:** a portaria pode mover para _Em análise_ e registrar acompanhamento; só o síndico marca como _Resolvido_ ou reabre; o morador apenas abre e acompanha.
- **Correção planejada:** aplicar a regra na tela e **validar na API** (Sprint 3).
- **Regras:** RN.22, RF.14, RN.08

### #24 — Morador não consegue liberar visitantes 🔴

- **Como foi encontrado:** o botão "Liberar Visitante" da Visão Geral levava o morador para a tela da Portaria, à qual ele não tem acesso.
- **Análise:** a liberação de visitas é principalmente uma ação do morador, que sabe quem vai receber.
- **Decisão do grupo:** o morador pré-autoriza a visita planejada; a portaria cadastra a visita não planejada na chegada e o morador confirma (ou a portaria confirma por interfone, com registro de quem autorizou).
- **Correção planejada:** tela "Meus visitantes" para o morador e tela da Portaria com esperados, aguardando e presentes (Sprint 3).
- **Regras:** RF.11, RF.12, RN.14 a RN.17

### #19 — Download de anexo não baixa o arquivo 🟡

- **Como foi encontrado:** ao clicar no anexo de um aviso, aparecia "Download iniciado", mas nenhum arquivo era baixado.
- **Causa:** o botão apenas exibia a mensagem; os anexos ainda eram dados de demonstração.
- **Correção planejada:** armazenar os anexos no Supabase Storage e gerar link temporário de download (Sprint 3).
- **Regras:** RN.19

### #26 — Link de redefinição já usado mostrava o formulário (CT-28) 🟡

- **Como foi encontrado:** ao reabrir um link de redefinição já utilizado, o formulário de nova senha aparecia normalmente.
- **Causa:** o link era invalidado corretamente no banco, mas a tela só verificava isso depois do envio do formulário.
- **Correção (PR #25):** a tela verifica o link ao abrir e, se inválido, mostra o aviso e o botão "Solicitar um novo link".
- **Reteste:** CT-28 executado novamente após a correção.

### #20 — Redefinição aceitava a mesma senha atual 🟢

- **Como foi encontrado:** na redefinição de senha, foi possível informar exatamente a senha atual.
- **Correção (PR #22):** a nova senha é comparada com a atual e, se for igual, aparece "A nova senha deve ser diferente da senha atual."
- **Regras:** RF.07, RN.03

### #21 — Atalho para Enquetes na Visão Geral 🟢 (melhoria)

- **Sugestão:** havia atalhos para reservas, visitantes e ocorrências, mas não para enquetes.
- **Implementação (PR #22):** botão "Votar em Enquetes" (morador e portaria) ou "Nova Enquete" (síndico).

### #27 — Orientações de preenchimento no cadastro 🟢 (melhoria)

- **Sugestão:** mostrar as regras de preenchimento abaixo dos campos antes do envio (critérios de senha que ficam verdes conforme a digitação, exemplo e máscara de telefone e CPF).
- **Decisão de segurança:** a verificação de CPF ou e-mail **já cadastrado** continua só no envio, de propósito. Avisar antes exigiria uma rota que revela se um CPF existe, permitindo descobrir quem é cadastrado (enumeração de usuários).
- **Regras:** RNF.10, RNF.11, RN.03

## 3. Ocorrências durante os testes que não eram bugs da aplicação

| Ocorrência                                                        | Causa                                                                                                                                             | Resolução                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| E-mail de recuperação de senha não chegava                        | Chave da Resend cadastrada incompleta na Vercel (erro de configuração do ambiente, identificado pelo log "HTTP 401")                              | Chave corrigida e novo deploy; envio validado em produção                                  |
| "Credenciais inválidas" após a aprovação do cadastro              | A senha digitada no login era diferente da salva no cadastro (provável preenchimento automático do navegador); a aprovação funcionou corretamente | Senha redefinida pelo fluxo de recuperação, que foi validado com isso                      |
| CPF já cadastrado não era sinalizado enquanto se digitava (CT-04) | Comportamento esperado: a verificação de duplicidade só ocorre no envio, por segurança (ver #27)                                                  | Caso executado até o envio, com a mensagem "Já existe um cadastro com este e-mail ou CPF." |

## 4. Lições para as próximas sprints

- Os testes encontraram **3 bugs de alta gravidade ligados a permissões por perfil** (#17, #18, #24). Na Sprint 3, cada módulo deve ter casos de teste específicos de permissão, executados com os três perfis.
- Regras de acesso precisam ser validadas **no servidor**, não apenas escondendo botões na tela.
- Mudanças em variáveis de ambiente exigem novo deploy e um teste rápido logo em seguida.
