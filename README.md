# Brasil × Vietnã, 1990–2023

Site estático com a base de dados interativa do TCC **"Desenvolvimento e Inserção Internacional de Brasil e Vietnã após o Fim da Guerra Fria: uma análise histórico-comparada (1990–2023)"** — Renan Sevilha Marangoni, FECAP, Relações Internacionais.

28 indicadores anuais para os dois países, com gráficos interativos (d3), tabela comparativa e download dos dados.

## Estrutura

```
index.html            página única
styles.css            tokens de tema (claro/escuro) e layout
app.js                lógica dos gráficos
vendor/d3.v7.9.0.min.js  d3 v7 (ISC), servido localmente
data/
  tcc_dados_long.csv  1.650 observações (pais, ano, indicador, valor)
  tcc_dados_wide.csv  uma linha por país-ano
  tcc_metadados.csv   rótulo, grupo, unidade, fonte, código e nota por indicador
_headers              cabeçalhos HTTP para Cloudflare Pages
```

Sem etapa de build: qualquer servidor de arquivos estáticos serve o site.

## Publicar no Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Escolha este repositório.
3. Em *Build settings*: **Framework preset** = None · **Build command** = (vazio) · **Build output directory** = `/` (raiz).
4. **Save and Deploy**. Cada `push` na branch principal publica uma nova versão.

## Atualizar os dados

Substitua os CSVs em `data/` mantendo as colunas. O site lê `data/tcc_dados_long.csv` e `data/tcc_metadados.csv` ao abrir. Para acrescentar um indicador: adicione as linhas no CSV longo e uma linha no de metadados (o seletor é montado a partir dos metadados).

## Fontes

Banco Mundial – World Development Indicators (CC BY 4.0) · Observatory of Economic Complexity / Harvard Growth Lab (ECI) · PNUD – Relatório de Desenvolvimento Humano · Banco Central do Brasil – SGS 4189 (Selic) · State Bank of Vietnam – decisões QĐ-NHNN (taxa de refinanciamento).

## Licença

Código: MIT. Dados: conforme a licença de cada fonte.
