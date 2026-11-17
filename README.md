# Brasil × Vietnã, 1990–2023

Site estático com a base de dados interativa do TCC **"Desenvolvimento e Inserção Internacional de Brasil e Vietnã após o Fim da Guerra Fria: uma análise histórico-comparada (1990–2023)"** — Renan Sevilha Marangoni, FECAP, Relações Internacionais.

Página única em seções: abertura, resumo em números, a pesquisa, recorte temporal (por que 1990–2023), metodologia, trajetórias dos dois países e a base de dados — 28 indicadores anuais, com gráficos interativos (d3), tabela comparativa e download.

## Estrutura

```
index.html            página única; os textos das seções (pesquisa, recorte, metodologia, trajetórias) ficam aqui
styles.css            tokens de tema (claro/escuro) e layout
app.js                lógica dos gráficos, blocos numéricos e menu
img/                  fotos do Wikimedia Commons (créditos e licenças em img/creditos.json e no rodapé)
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

## Atualizar os textos

Os textos das seções 01–04 vêm do projeto de TCC e estão marcados na página como rascunho (`<p class="draft">`). Para atualizar, edite o trecho correspondente no `index.html`; quando uma seção estiver na versão final, apague a linha `<p class="draft">…</p>` dela. Os marcos da linha do tempo são os itens `<li>` dentro de `<ol class="tl">` (classe `br`, `vn` ou `both`).

## Fontes

Banco Mundial – World Development Indicators (CC BY 4.0) · Observatory of Economic Complexity / Harvard Growth Lab (ECI) · PNUD – Relatório de Desenvolvimento Humano · Banco Central do Brasil – SGS 4189 (Selic) · State Bank of Vietnam – decisões QĐ-NHNN (taxa de refinanciamento).

## Licença

Código: MIT. Dados: conforme a licença de cada fonte. Fotos: licenças Creative Commons indicadas em `img/creditos.json`.
