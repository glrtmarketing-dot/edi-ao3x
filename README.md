# Edição 3x — Página de vendas

Página de vendas do curso **Edição 3x**, de Pedro Goulart.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | **Versão atual (V2).** Estrutura da referência Edição do Futuro, sem VSL, tema claro. É o que sobe no ar. |
| `edicao-3x.html` | Versão anterior (V1). Estrutura da referência FCC/Hanah, tema escuro, com VSL vertical. Guardada para A/B. |
| `assets/` | Fotos do Pedro (incluindo o recorte PNG) e dos experts. |

Ambas são HTML único, sem build e sem dependência — abrir no navegador funciona.
As fontes (Unbounded + Inter) vêm do Google Fonts.

## Pendências antes de publicar

### 1. Link do checkout
Substituir `[LINK-DO-CHECKOUT]` (2 ocorrências no `index.html`) pela URL real.

```
grep -n "LINK-DO-CHECKOUT" index.html
```

### 2. Captura de perguntas — não está funcionando de verdade
A caixa "Manda sua pergunta" abre o modal e grava o lead, mas **hoje grava no
`localStorage` do navegador de quem enviou** — ou seja, as perguntas dos
visitantes não chegam a ninguém. É modo de teste.

Para capturar de verdade, preencher o endpoint no script do `index.html`:

```js
const LEADS = {
  endpoint: '',   // <- URL do serviço aqui
  ...
}
```

Funciona com Formspree, webhook (Make / Zapier / n8n), Google Apps Script ou
Supabase REST. Todos têm painel próprio com login seguro — e é lá que a lista
real deve viver.

### 3. Painel admin (`#admin`) não é seguro
Acessa em `index.html#admin`, senha na constante `ADMIN_SENHA` (trocar).
**Senha escrita no front-end não protege nada** — quem abrir o código-fonte lê.
Serve só como visualizador local e exportador de CSV do modo de teste.

### 4. Números da bio
Placeholders `[X]+` vídeos, `[X]` players, `[X] anos` na seção de autoridade.
Usar só números verificáveis.

### 5. Direito de imagem dos experts
O carrossel de stories usa fotos de pessoas reais e identificáveis
(Hanah Franklin, Ícaro de Carvalho, Marcos Paulo, Walter Galvão Neto,
Bettina Rudolph, Hyeser), posicionadas de forma que sugere endosso ao produto.
No Brasil isso exige **autorização de uso de imagem de cada um, por escrito**.
Quem não autorizou deve sair do array `EXPERTS` — a composição funciona com menos.

### 6. Coerência entre headline e sub
A headline promete "5 a 15 mil reais por mês"; o topo da escada de mercado
(15 mil) pressupõe 6 clientes fixos. Já a sub promete "2 horas de trabalho por
dia", que realisticamente comporta 3 a 4 clientes (6 a 10 mil).
Ou sobe o ticket, ou ajusta uma das duas promessas.

### 7. Claim de edição por celular
A headline afirma "usando o celular". Confirmar que o curso realmente cobre
edição por celular antes de subir — é claim central, não detalhe.

### 8. Peso da imagem
`assets/DSC07718.JPG` tem 2,7 MB e é exibida em miniatura. Vale reduzir para
~600px de largura. Também vale confirmar se é mesmo o Walter Galvão Neto
(o nome no array foi suposição) e renomear o arquivo.

## Compliance

O rodapé traz o aviso legal obrigatório: os valores refletem preços praticados
no mercado de edição freelancer e resultados individuais, **não constituem
promessa nem garantia de ganho**. Manter esse aviso e nunca apresentar a faixa
de renda como resultado típico ou garantido.

Depoimentos e prints só com autorização por escrito, valores verificáveis e
sempre identificados como caso individual.
