# .claude/skills/

Skills do Claude Code configuradas para este projeto, versionadas aqui para
qualquer pessoa que abrir o repositório no Claude Code ter o mesmo setup.

Instaladas com:

```bash
npx claude-code-templates@latest --skill \
  development/senior-frontend,\
  creative-design/frontend-design,\
  creative-design/ui-ux-pro-max,\
  development/senior-fullstack
```

| Skill | Para quê |
|---|---|
| `senior-frontend` | ReactJS/Next/TS/Tailwind — scaffolding de componente, otimização, boas práticas |
| `frontend-design` | interfaces com acabamento, fugindo do visual genérico de "AI slop" |
| `ui-ux-pro-max` | base de estilos, paletas, tipografia, diretrizes de UX e tipos de gráfico |
| `senior-fullstack` | arquitetura, análise de qualidade, workflows para app completa |

**Nota de honestidade:** estas skills estavam **disponíveis** durante a
construção, mas nenhuma foi **invocada explicitamente** — o trabalho foi feito
direto, seguindo a ADR-0001. Ficam registradas como parte do ambiente montado
para o projeto, não como ferramentas efetivamente acionadas.

Conteúdo de terceiro; licenças nos respectivos diretórios (ex.:
`frontend-design/LICENSE.txt`).
