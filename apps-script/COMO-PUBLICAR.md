# Leads do grupo → Google Sheets

A landing `/grupo/` manda nome e WhatsApp pra uma planilha sua.
São 5 passos, uma vez só. Depois disso não precisa mexer mais.

---

## 1. Crie a planilha

Nova planilha no Google Sheets. Pode deixar vazia, porque o script cria a aba
**Leads Grupo** e o cabeçalho sozinho no primeiro lead que chegar.

Dê um nome que você reconheça depois, tipo `Edição 3x | Leads`.

## 2. Abra o editor de script

Na planilha: **Extensões → Apps Script**.

Apaga o `function myFunction() {}` que vem de exemplo e cola todo o
conteúdo de [`Codigo.gs`](Codigo.gs). Salva (⌘S).

> Fazendo por dentro da planilha, o script já fica vinculado a ela,
> por isso você **não** precisa configurar `PLANILHA_ID`.

## 3. Crie a senha do webhook

No editor: **⚙ Configurações do projeto → Propriedades do script →
Adicionar propriedade**.

| Propriedade | Valor |
|---|---|
| `CHAVE_WEBHOOK` | uma senha que você inventa (ex.: `edicao3x2026`) |

Sem ela o script recusa tudo que chegar. É o que impede alguém de
descobrir a URL e encher sua planilha de lixo.

## 4. Publique

**Implantar → Nova implantação → ⚙ → App da Web**, com:

- **Executar como:** Eu
- **Quem pode acessar:** **Qualquer pessoa**

> "Qualquer pessoa" assusta, mas é necessário: quem chama é o navegador
> do visitante, que não está logado na sua conta. A proteção é a
> `CHAVE_WEBHOOK` do passo anterior.

Na primeira vez o Google pede autorização e mostra um aviso de
"app não verificado". É o seu próprio script. Clique em
**Avançado → Acessar (não seguro)**.

Copie a **URL do app da Web**. Ela termina em `/exec`.

## 5. Cole na página

Abra `grupo/index.html`, procure `PLANILHA_URL` e cole a URL **com a
chave no fim**:

```js
const PLANILHA_URL = 'https://script.google.com/macros/s/AKfyc…/exec?k=edicao3x2026';
```

Commit e push. A Vercel publica sozinha.

---

## Conferindo se funcionou

**Teste rápido, sem sair do editor:** rode a função `testarGravacao`.
Deve aparecer uma linha "Teste Manual" na planilha.

**Raio-x da configuração:** abra no navegador

```
SUA_URL/exec?diag=1&k=SUA_CHAVE
```

Responde o nome da planilha, as abas e quantas linhas cada uma tem.
Se disser `NAO ABRIU`, o script não está vinculado à planilha. Refaça
o passo 2 por dentro dela, ou defina `PLANILHA_ID` nas propriedades.

**Teste de verdade:** preencha o formulário na página publicada.
A linha aparece na planilha em segundos.

---

## Como foi pensado

**Não duplica.** Mesma pessoa preenchendo de novo não vira linha nova,
porque a comparação é pelo telefone normalizado (só dígitos, sempre com 55).

**Aceita qualquer ordem de colunas.** O script lê o cabeçalho e encaixa
cada campo na coluna certa. Você pode renomear `WhatsApp` para `Celular`,
mover de lugar ou inserir colunas suas no meio que continua funcionando.

**Nunca trava a entrada no grupo.** A página espera no máximo 2,5s pela
planilha. Se a rede engasgar, a pessoa segue pro WhatsApp do mesmo jeito
e o lead fica salvo no navegador dela como backup.

**`text/plain` no envio.** Parece errado mandar JSON assim, mas é
proposital: evita o *preflight* de CORS, que o Apps Script não responde.
O script faz o `JSON.parse` do outro lado.

## Se precisar mudar o código depois

Toda vez que editar o `Codigo.gs`, tem que **Implantar → Gerenciar
implantações → ✏️ → Versão: Nova versão → Implantar**. Só salvar não
atualiza o que está no ar, e esse é o erro mais comum.

A URL continua a mesma, então não precisa mexer na página.
