# Brasil × Vietnã, 1990–2023

Site estático com a base de dados interativa do TCC **"Desenvolvimento e Inserção Internacional de Brasil e Vietnã após o Fim da Guerra Fria: uma análise histórico-comparada (1990–2023)"** — Renan Sevilha Marangoni, FECAP, Relações Internacionais.

Página única em seções: abertura, resumo em números, a pesquisa, recorte temporal (por que 1990–2023), metodologia, trajetórias dos dois países, política monetária e fiscal (decisões de juros do Copom e do State Bank of Vietnam; resultado nominal e primário) e a base de dados — 32 indicadores anuais, separados em ala causal e ala de resultados, com gráficos interativos (d3), tabela comparativa e download.

## Estrutura

```
index.html            página única; os textos das seções (pesquisa, recorte, metodologia, trajetórias) ficam aqui
styles.css            tokens de tema (claro/escuro) e layout
app.js                lógica dos gráficos, blocos numéricos e menu
img/                  fotos do Wikimedia Commons (créditos e licenças em img/creditos.json e no rodapé)
vendor/d3.v7.9.0.min.js  d3 v7 (ISC), servido localmente
data/
  tcc_dados_long.csv  1.845 observações (pais, ano, indicador, valor)
  tcc_dados_wide.csv  uma linha por país-ano
  tcc_metadados.csv   ala (Causal ou Resultado), grupo, rótulo, unidade, fonte, código e nota por indicador
  tcc_decisoes_juros.csv  decisões de juros: meta Selic (Copom, 1999–2023) e taxa de refinanciamento do SBV (1999–2023)
_headers              cabeçalhos HTTP para Cloudflare Pages
```

Sem etapa de build: qualquer servidor de arquivos estáticos serve o site.

## Publicar no Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Escolha este repositório.
3. Em *Build settings*: **Framework preset** = None · **Build command** = (vazio) · **Build output directory** = `/` (raiz).
4. **Save and Deploy**. Cada `push` na branch principal publica uma nova versão.

## Atualizar os dados

Substitua os CSVs em `data/` mantendo as colunas. O site lê `data/tcc_dados_long.csv` e `data/tcc_metadados.csv` ao abrir. Para acrescentar um indicador: adicione as linhas no CSV longo e uma linha no de metadados (o seletor e as listas das alas são montados a partir dos metadados). A coluna `ala` define o lado do indicador: `Causal` (instrumentos e condições de política) ou `Resultado`. Para mover um indicador de ala, troque esse valor.

As séries fiscais vêm do FMI (World Economic Outlook, abril de 2025): `GGXCNL_NGDP` (resultado nominal), `GGXONLB_NGDP` (resultado primário) e `GGXWDG_NGDP` (dívida bruta); os juros líquidos são a diferença entre o primário e o nominal. As decisões do Copom vêm do histórico de taxas de juros do Banco Central (`https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros`).

## Atualizar os textos

Os textos das seções 01–04 vêm do projeto de TCC; a seção 05 (política monetária e fiscal) é nova e estão marcados na página como rascunho (`<p class="draft">`). Para atualizar, edite o trecho correspondente no `index.html`; quando uma seção estiver na versão final, apague a linha `<p class="draft">…</p>` dela. Os marcos da linha do tempo são os itens `<li>` dentro de `<ol class="tl">` (classe `br`, `vn` ou `both`).

## Fontes

Banco Mundial – World Development Indicators (CC BY 4.0) · Observatory of Economic Complexity / Harvard Growth Lab (ECI) · PNUD – Relatório de Desenvolvimento Humano · FMI – World Economic Outlook (resultado fiscal e dívida) · Banco Central do Brasil – SGS 4189 (Selic) e histórico das decisões do Copom · State Bank of Vietnam – decisões QĐ-NHNN (taxa de refinanciamento).

## Licença

Código: MIT. Dados: conforme a licença de cada fonte. Fotos: licenças Creative Commons indicadas em `img/creditos.json`.
