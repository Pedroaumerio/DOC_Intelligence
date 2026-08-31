# DOC Intelligence — o que implementar agora

- **Status:** recorte de implementação, mais estreito que a fatia vertical completa descrita em `docs/especificacao.md`.
- **Cobre:** comportamentos 1 e 2 do produto-alvo — receber o documento e devolver o resultado da classificação e extração de campos.
- **Não cobre:** fila de conferência, `claim`, correção de campo, busca geral na lista de processados. Fica para a próxima fatia, já documentada na especificação maior.

---

## 1. O que existe nesta fatia

Duas telas, uma seguindo a outra:

1. **Adicionar documento** — o atendimento envia um ou mais arquivos.
2. **Seção de resultado** — depois que o processamento volta, aparece o que foi identificado: tipo do documento, campos extraídos e o nome padronizado proposto para o arquivo.

Não existe ainda "lista de todos os processados" nem busca por nome — a seção de resultado mostra o retorno do que acabou de ser enviado nesta sessão, não um histórico.

## 2. Tela 1 — Adicionar documento

| Elemento | Comportamento |
|---|---|
| Área de soltar/selecionar arquivo | Aceita imagem (JPG/PNG/WEBP/HEIC/TIFF), PDF e documento (DOC/DOCX/ODT/RTF/TXT); múltiplos arquivos de uma vez. Formatos numa fonte única — `src/lib/formatosAceitos.ts` |
| Cada arquivo, ao entrar na lista | Calcula hash SHA-256 no navegador antes de subir (fato c do ambiente — evita pagar de novo pelo que já foi enviado) |
| Estado por arquivo | `pronto para enviar` → `enviando` → `processando` → `concluído` / `falhou` |
| Enviar | Dispara `POST /documentos`; a resposta é só um identificador — o processamento é assíncrono, a tela não trava esperando os 5–40 s do fornecedor |

Ao concluir o envio de um arquivo, ele aparece automaticamente na seção de resultado, já em estado `processando`.

## 3. Tela 2 — Seção de resultado (retorno da busca)

Uma seção que mostra, por documento enviado nesta sessão, o que o processamento devolveu quando termina:

- **Tipo do documento** identificado (ex.: "Identidade (RG)").
- **Campos extraídos**, no exemplo do enunciado para identidade: nome, filiação, data de nascimento, número e órgão emissor.
- **Nome padronizado proposto** para o arquivo (ex.: `identidade_joao-da-silva_2026-08-30.pdf`), substituindo o nome original que veio do celular do atendimento.
- **Indicador de confiança** por campo — sem isso, a próxima fatia (conferência humana) não tem o que mostrar.
- **Ver arquivo enviado** — abre o próprio arquivo num modal (imagem com girar/tamanho real, PDF no leitor do navegador, `.txt` como texto). O `File` vem da sessão (memória + `sessionStorage`, fato d). Importante no caso de conferência: a pessoa precisa olhar o documento original para corrigir o que a máquina errou.

Enquanto o documento está em `processando`, a seção mostra um estado de espera claro (não um spinner genérico — a pessoa precisa saber que pode levar até 40 segundos e que a tela vai atualizar sozinha). Poll com TanStack Query, conforme já decidido na especificação.

## 4. O que o mock precisa devolver

Schema mínimo para esta fatia, usando identidade como o tipo de exemplo do enunciado:

```json
{
  "id": "doc_01hz...",
  "status": "concluido",
  "tipo_documento": "identidade",
  "nome_sugerido": "identidade_joao-da-silva_2026-08-30.pdf",
  "campos": {
    "nome": { "valor": "João da Silva", "confianca": 0.97 },
    "filiacao": { "valor": "Maria da Silva e José da Silva", "confianca": 0.93 },
    "data_nascimento": { "valor": "1990-04-12", "confianca": 0.99 },
    "numero": { "valor": "12.345.678-9", "confianca": 0.88 },
    "orgao_emissor": { "valor": "SSP/RN", "confianca": 0.71 }
  }
}
```

Não há integração com nenhum serviço externo nesta fatia. O "dublê" citado no enunciado é implementado como uma função no próprio mock (MSW), que varia a confiança e às vezes derruba um campo de propósito, para simular baixa confiança — mesmo que esta fatia ainda não implemente a fila que consome isso.

## 5. Identidade visual — Lamarck Advogados

Extraída direto do site (`lamarck.adv.br`), não de memória: computei os estilos reais da página para pegar os tons exatos.

| Token | Valor | Uso |
|---|---|---|
| `--bg-base` | `#242424` | Fundo padrão da aplicação |
| `--bg-elevado` | `#161616` | Cabeçalho, cards, superfícies elevadas |
| `--texto-claro` | `#ffffff` | Texto sobre fundo escuro |
| `--texto-escuro` | `#333333` | Texto sobre fundo claro (ex.: dentro de um card branco) |
| `--texto-secundario` | `#69727d` | Legendas, metadados, texto de apoio |
| `--acento` | `#ffc167` | Marca — botão primário, destaque, foco |
| `--preto` | `#000000` | Texto sobre o acento (o botão do site usa texto escuro sobre o dourado) |

**Tipografia:** `Sora` para títulos e corpo (peso 400 no corpo, mais pesado nos títulos); `Poppins` como secundária. Ambas via Google Fonts, ambas sans-serif — seguem a mesma lógica de fallback do sistema (`-apple-system, Segoe UI, Roboto...`) se uma delas não carregar.

**Logo:** wordmark "LAMARCK" em caixa alta, com a linha "SOCIEDADE DE ADVOGADOS" abaixo, menor, com espaçamento entre letras. Uso simples: logo no cabeçalho da aplicação, sem o hero de fotografia com colunas clássicas do site — isso é linguagem de marketing, não de ferramenta interna (fato 5: consumido por sistema interno, não por visitante).

**Tom:** o site se descreve como "gentil e prestativa, verdadeiramente humana" ao lado de "excelência técnica". Isso se traduz na interface como: mensagens de erro e de espera escritas em linguagem direta e humana ("Ainda estamos lendo este documento, pode levar até 40 segundos" em vez de "Processing..."), não como um app genérico de SaaS.

**Um cuidado deliberado:** `#ffc167` é a cor da marca, mas dourado/âmbar também é a cor convencional de "atenção" em interface. Reservar o acento da marca só para ação primária e destaque de marca (botão "Enviar", logo, foco de campo) e usar uma paleta semântica separada para os estados de confiança do documento — verde para confiança alta, vermelho para falha, um tom neutro para "em processamento". Misturar as duas coisas faria "confiança baixa" e "botão da marca" competirem pela mesma cor na tela, o que é exatamente o tipo de detalhe que passa despercebido até alguém confundir os dois em produção.

## 6. Critério de pronto para esta fatia

Um arquivo fictício de identidade é solto na tela de adicionar documento, sobe, aparece como "processando" sem travar a interface, e depois de alguns segundos a seção de resultado mostra o tipo identificado, os cinco campos do exemplo do enunciado com confiança individual, e o nome de arquivo padronizado sugerido — tudo com a identidade visual acima, não com estilo genérico de biblioteca de componentes.
