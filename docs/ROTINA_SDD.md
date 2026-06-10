# Rotina SDD Para Counter.dev

Este documento define como aplicar Spec-Driven Development (SDD) ao projeto counter.dev.

## 1. Problema Identificado

Na implementação da feature de parâmetro URL (?project=x), NÃO segui a rotina SDD correta:
- ❌ Não criei issue primeiro no repositório original
- ❌ Não criei SDD antes da implementação
- ❌ Fui direto para implementação → PR
- ✅ Code review foi feito (MOA — 3 providers)

## 2. Rotina SDD — Passos Corretos

### Passo 1: Criar Issue (NO repositório original)

**Repositório:** `ihucos/counter.dev` (NÃO no fork)

**Formato de issue (padrão do projeto):**
```
Título: [Tipo] Descrição breve

Body:
## Problema
[Descrição detalhada do problema]

## Proposta
[Solução proposta]

## Benefícios
[Lista de benefícios]

## Aceitação
[Critérios de aceitação]
```

**Tipos de issue:**
- `[Feature]` — Nova funcionalidade
- `[Bug]` — Correção de bug
- `[Improvement]` — Melhoria existente

**Comando:**
```bash
gh issue create --repo ihucos/counter.dev \
  --title "[Feature] URL parameter for deep linking" \
  --body "$(cat issue-template.md)"
```

**Exemplo:** Issue #141 — https://github.com/ihucos/counter.dev/issues/141

---

### Passo 2: Criar SDD (NO fork)

**Repositório:** `ricardo-camilo-programador-frontend-web/counter.dev-true-immortal`

**Caminho:** `docs/SDD_<nome_da_feature>.md`

**Template de SDD:**
```markdown
# SDD: <Nome da Feature>

**Created:** DD/MM/YYYY
**Status:** <Status>
**PR:** <Numero da PR>
**Issue:** <Numero da Issue no repositório original>

---

## 1. Problem Statement

[Descrição do problema com exemplos]

### Current Behavior

[Comportamento atual detalhado]

### Example User Journey

[Jornada do usuário]

---

## 2. Proposed Solution

[Descrição técnica da solução]

### Backend Changes

[Arquivos alterados no backend]

### Frontend Changes

[Arquivos alterados no frontend]

---

## 3. Benefits

[Lista de benefícios]

---

## 4. Implementation Plan

### Phase 1: Backend
- [ ] Tarefa 1
- [ ] Tarefa 2

### Phase 2: Frontend
- [ ] Tarefa 1
- [ ] Tarefa 2

### Phase 3: Testing
- [ ] Teste 1
- [ ] Teste 2

---

## 5. Acceptance Criteria

[Checklist de critérios de aceitação]

---

## 6. Code Review Status

[Link para review, status, issues encontradas]

---

## 7. Related

[Links para issue, PR, fork, branch, commits]

---

## 8. Lessons Learned

[Lição aprendida durante o processo]

---

## 9. Next Steps

[Próximos passos]

---

**Author:** Ricardo Camilo
**Last Updated:** DD/MM/YYYY
```

**Comando:**
```bash
# Criar SDD
vim docs/SDD_url-project-parameter.md

# Commit
git add docs/SDD_url-project-parameter.md
git commit -m ":memo: docs(SDD): add Spec-Driven Development document for ..."

# Push
git push
```

**Exemplo:** `docs/SDD_url-project-parameter.md`

---

### Passo 3: Implementação

**Branch naming:**
```bash
git checkout -b feature/<nome-da-feature>
```

**Commit format (padrão do projeto):**
```bash
git commit -m ":emoji: tipo(scope): descrição"
```

**Emojis disponíveis:**
- `:sparkles:` — Nova feature
- `:bug:` — Bug fix
- `:memo:` — Documentação
- `:refactor:` — Refatoração
- `:test:` — Testes

**Tipos:**
- `feat` — Feature
- `fix` — Fix
- `docs` — Documentação
- `refactor` — Refatoração
- `test` — Testes

**Scope:**
- `url` — URL routing
- `backend` — Backend
- `frontend` — Frontend
- `auth` — Autenticação
- `dashboard` — Dashboard

**Exemplo:**
```bash
git commit -m ":sparkles: feat(url): add ?project=x parameter for deep linking"
```

---

### Passo 4: Criar PR

**Comando:**
```bash
gh pr create --base master \
  --title "feat(url): add project parameter for deep linking to specific sites" \
  --body "Closes #141"
```

**Importante:** Adicionar `Closes #<issue-numero>` no body da PR para vincular automaticamente.

---

### Passo 5: Code Review (MOA)

**Para code reviews:**
- Usar 3 providers diferentes
- Criar reviews em paralelo
- Consolidar findings
- Postar como comentário da PR

**Ver skill:** `software-development/requesting-code-review`

---

### Passo 6: Vincular Issue e PR

**Via comentário na issue:**
```bash
gh issue comment <issue-numero> --repo ihucos/counter.dev \
  --body "## Implementation

Implemented in PR #<pr-numero>

**Changes:**
- Backend: \`project\` parameter handling
- Frontend: URL sync and history management

**Status:** Code review in progress

See PR: https://github.com/ihucos/counter.dev/pull/<pr-numero>"
```

**Via body da PR:**
```markdown
## Related

Closes #<issue-numero>
```

---

### Passo 7: Fix Issues do Code Review

**Regras:**
- Um commit por fix
- Commits descritivos
- Testar após cada fix
- Re-request review

**Exemplo:**
```bash
# Fix syntax error
patch --path static/components/dashboard/selector.js --old-string "var" --new-string "const"
git add static/components/dashboard/selector.js
git commit -m ":bug: fix(selector): correct syntax errors"
git push

# Fix validation
patch --path backend/endpoints/dump.go --old-string "..." --new-string "..."
git add backend/endpoints/dump.go
git commit -m ":bug: fix(dump): add input validation for project parameter"
git push
```

---

### Passo 8: Re-review

- Rerun code review após fixes
- Postar status atualizado
- Fechar review antigo se todos os issues foram resolvidos

---

### Passo 9: Merge

**Regras:**
- Code review aprovado (zero CRITICAL/MAJOR)
- Todos os testes passam
- Issue marcada como "in progress" ou "closed"

**Comando:**
```bash
# Merge via CLI
gh pr merge <pr-numero> --squash

# Ou via GitHub web interface
```

---

### Passo 10: Atualizar Issue

```bash
gh issue close <issue-numero> --repo ihucos/counter.dev \
  --comment "Closed via PR #<pr-numero> ✅

All acceptance criteria met:
- [x] URL parameter working
- [x] Deep linking working
- [x] Browser back/forward working
- [x] No regressions"
```

---

## 3. Repositórios Envolvidos

| Repositório | Uso | Issues | PRs |
|------------|-----|--------|-----|
| `ihucos/counter.dev` | Original/upstream | ✅ Criar issues aqui | ❌ Não criar PRs aqui (fork de trabalho) |
| `ricardo-camilo-programador-frontend-web/counter.dev-true-immortal` | Fork de trabalho | ❌ Issues desabilitados | ✅ Criar PRs aqui |

---

## 4. Exemplo Completo

**Workflow para feature de parâmetro URL:**

```bash
# 1. Criar issue no repo original
gh issue create --repo ihucos/counter.dev \
  --title "[Feature] URL parameter for deep linking to specific sites" \
  --body "..." # Issue #141

# 2. Criar SDD no fork
vim docs/SDD_url-project-parameter.md
git add docs/SDD_url-project-parameter.md
git commit -m ":memo: docs(SDD): add Spec-Driven Development document"
git push

# 3. Implementar feature
git checkout -b feature/url-project-parameter
# Fazer mudanças...
git add .
git commit -m ":sparkles: feat(url): add ?project=x parameter for deep linking"
git push

# 4. Criar PR
gh pr create --base master \
  --title "feat(url): add project parameter for deep linking to specific sites" \
  --body "Closes #141"

# 5. Code review (MOA)
# Ver skill: software-development/requesting-code-review

# 6. Vincular issue e PR
gh issue comment 141 --repo ihucos/counter.dev \
  --body "Implemented in PR #140"

# 7. Fix issues do code review
# Um commit por fix...

# 8. Re-review

# 9. Merge
gh pr merge 140 --squash

# 10. Atualizar issue
gh issue close 141 --repo ihucos/counter.dev \
  --comment "Closed via PR #140 ✅"
```

---

## 5. Lições Aprendidas

**Erro cometido:**
- ❌ Implementar sem criar issue primeiro
- ❌ Não criar SDD antes da implementação
- ❌ Criar PR sem issue vinculada

**Correção aplicada:**
- ✅ Criar issue #141 no repo original
- ✅ Criar SDD no fork
- ✅ Vincular issue e PR via comentários
- ✅ Documentar rotina SDD

---

## 6. Regras Importantes

1. **SEMpre criar issue primeiro** — no repositório original
2. **SEMpre criar SDD antes de implementar** — no fork
3. **SEMpre vincular issue e PR** — via body da PR ou comentário
4. **UM commit por fix** — não bundlar fixes
5. **Code review obrigatório** — MOA com 3 providers
6. **Commit format** — seguir padrão do projeto com emojis
7. **Branch naming** — usar `feature/` prefixo

---

**Author:** Ricardo Camilo
**Created:** June 10, 2026
**Last Updated:** June 10, 2026