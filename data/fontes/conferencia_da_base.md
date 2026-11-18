# Conferência da base contra as fontes

Feita em 17 nov. 2026. Cada valor da base do site foi comparado com o valor publicado pela fonte citada.

## Como foi feito

- **Banco Mundial (24 indicadores com código do WDI):** API oficial (https://api.worldbank.org/v2), países BRA e VNM, 1990–2023. A API informa última atualização em 11 nov. 2026.
- **PNUD (IDH):** arquivo "All composite indices and components time series (1990-2023)", do Relatório de Desenvolvimento Humano 2025.
- **Banco Central do Brasil (taxa Selic, SGS 4189):** API de séries temporais; média anual dos valores mensais.
- "Igual" quer dizer igual depois de arredondar a fonte para as casas decimais da base, com tolerância de uma unidade na última casa.

## Resultado antes da correção

| Indicador | Código | Comparados | Iguais | Diferença de até 2% | Diferença acima de 2% |
|---|---|---|---|---|---|
| juros_emprestimo | FR.INR.LEND | 56 | 56 | 0 | 0 |
| juros_real | FR.INR.RINR | 56 | 56 | 0 | 0 |
| cambio_real_efetivo | PX.REX.REER | 34 | 34 | 0 | 0 |
| fbcf_pct_pib | NE.GDI.FTOT.ZS | 63 | 63 | 0 | 0 |
| pd_pct_pib | GB.XPD.RSDV.GD.ZS | 32 | 32 | 0 | 0 |
| ied_pct_pib | BX.KLT.DINV.WD.GD.ZS | 68 | 68 | 0 | 0 |
| ied_usd | BX.KLT.DINV.CD.WD | 68 | 68 | 0 | 0 |
| comercio_pct_pib | NE.TRD.GNFS.ZS | 68 | 68 | 0 | 0 |
| termos_de_troca | TT.PRI.MRCH.XD.WD | 38 | 38 | 0 | 0 |
| pib_pc_nominal | NY.GDP.PCAP.CD | 68 | 34 | 29 | 5 |
| pib_pc_ppp | NY.GDP.PCAP.PP.CD | 68 | 33 | 30 | 5 |
| pib_total_nominal | NY.GDP.MKTP.CD | 68 | 66 | 2 | 0 |
| pib_crescimento | NY.GDP.MKTP.KD.ZG | 68 | 68 | 0 | 0 |
| exportacoes | NE.EXP.GNFS.CD | 68 | 14 | 15 | 39 |
| manuf_pct_expo | TX.VAL.MANF.ZS.UN | 61 | 21 | 1 | 39 |
| alta_tec_pct_manuf | TX.VAL.TECH.MF.ZS | 33 | 33 | 0 | 0 |
| industria_pct_pib | NV.IND.TOTL.ZS | 68 | 68 | 0 | 0 |
| manufatura_pct_pib | NV.IND.MANF.ZS | 53 | 53 | 0 | 0 |
| emprego_industria | SL.IND.EMPL.ZS | 66 | 66 | 0 | 0 |
| inflacao_ipc | FP.CPI.TOTL.ZG | 62 | 62 | 0 | 0 |
| inflacao_deflator | NY.GDP.DEFL.KD.ZG | 68 | 68 | 0 | 0 |
| reservas_usd | FI.RES.TOTL.CD | 63 | 63 | 0 | 0 |
| divida_externa_pct_rnb | DT.DOD.DECT.GN.ZS | 68 | 68 | 0 | 0 |
| gini | SI.POV.GINI | 41 | 41 | 0 | 0 |
| idh | HDI (HDR 2025) | 68 | 4 | 14 | 50 |
| taxa_basica (Brasil) | SGS 4189 | 34 | 34 | 0 | 0 |

Dos 1.474 valores comparados no Banco Mundial e no PNUD, 1.245 eram iguais, 91 diferiam em até 2% e 138 diferiam em mais de 2%.

## O que não batia

1. **Exportações de bens e serviços (NE.EXP.GNFS.CD):** 14 de 68 valores iguais; 39 diferiam em mais de 2%, alguns em mais de 20%.
2. **Manufaturados nas exportações (TX.VAL.MANF.ZS.UN):** 21 de 61 iguais. Os valores da base eram números inteiros que subiam ou desciam cerca de um ponto por ano, padrão de interpolação entre anos de referência.
3. **IDH:** 4 de 68 iguais. A série do Brasil subia cerca de 0,007 por ano, outro padrão de interpolação. O valor de 1990 do Brasil era 0,590; no Relatório de 2025 é 0,641.
4. **PIB per capita nominal e PPP do Brasil:** toda a série cerca de 1% a 3% abaixo da fonte atual, o tamanho de uma revisão de população. Os valores da base parecem vir de uma edição anterior do WDI.
5. **PIB total de 2023:** revisão pequena nos dois países.
6. **Gini do Brasil:** sete valores com diferença de 0,1 e dois anos (2021 e 2023) que a fonte tem e a base não tinha.
7. **Complexidade econômica (ECI), score e ranking:** nenhum dos 116 valores conferia com as fontes citadas; a conferência foi feita à parte e está abaixo.

Os outros 18 indicadores do Banco Mundial e a taxa Selic batiam em todos os valores.

## O que foi corrigido na base

As séries dos itens 1 a 7 foram substituídas pelos valores da fonte (383 valores; lista completa em `conferencia_da_base_valores_trocados.csv`). As reservas/PIB foram recalculadas com o PIB novo (um valor mudou: Brasil 2023, de 16,3 para 16,2). A base passou de 1.908 para 1.910 observações (os dois anos novos do Gini).

Efeito nos números de destaque:

| Número | Brasil | Vietnã |
|---|---|---|
| PIB per capita PPP, 1990 (Int$) | 6.619 → 6.688 | 1.210 (sem mudança) |
| PIB per capita PPP, 2023 (Int$) | 20.584 → 21.193 | 15.034 (sem mudança) |
| PIB per capita nominal, 2023 (US$) | 10.044 → 10.378 | 4.323 (sem mudança) |
| Exportações, 1990 (US$ bilhões) | 31,4 → 31,6 | 2,4 → 2,3 |
| Exportações, 2023 (US$ bilhões) | 391,0 → 393,7 | 375,0 → 376,3 |
| Manufaturados nas exportações, primeiro ano (%) | 52,0 → 51,8 (1990) | 38,0 → 44,0 (1997) |
| Manufaturados nas exportações, 2023 (%) | 26,0 → 24,1 | 85,0 (sem mudança) |
| IDH, 1990 | 0,590 → 0,641 | 0,499 (sem mudança) |
| IDH, 2023 | 0,786 (sem mudança) | 0,766 (sem mudança) |
| ECI, score, 1995 | 0,700 → 0,816 | -0,850 → -0,968 |
| ECI, score, 2023 | -0,180 → 0,379 | 0,080 → 0,579 |
| ECI, posição no ranking, 1995 | 28º → 29º | 102º → 119º |
| ECI, posição no ranking, 2023 | 49º → 57º | 46º → 48º |

**Exportações: ano em que o Vietnã passa o Brasil.** Com os valores da fonte, o Vietnã fica à frente de 2019 a 2022, e o Brasil volta à frente em 2023. A base anterior indicava também 2016 e 2017, o que não se confirma. O site foi corrigido para 2019, que é o ano citado no projeto do TCC.

## Complexidade econômica (ECI)

Os valores anteriores da base (ranking de 2023: Brasil 49º, Vietnã 46º; de 1995: 28º e 102º) não foram encontrados em nenhuma das duas fontes citadas no projeto.

| Fonte | 1995, Brasil / Vietnã | 2023, Brasil / Vietnã |
|---|---|---|
| Base anterior do site | 28 / 102 | 49 / 46 |
| OEC, HS96, 6 dígitos (https://oec.world/en/rankings/eci/hs6/hs96) | sem dado (em 1998: 22 / 83) | 47 / 63 |
| OEC, HS96, 4 dígitos | sem dado (em 1998: 24 / 79) | 60 / 50 |
| OEC, HS92, 6 dígitos | 25 / 82 | 47 / 62 |
| OEC, HS92, 4 dígitos | 24 / 80 | 60 / 51 |
| Growth Lab de Harvard, HS92 (https://doi.org/10.7910/DVN/XTAQMC) | 29 / 119 | 57 / 48 |
| Growth Lab de Harvard, HS12 | sem dado | 56 / 48 |
| Growth Lab de Harvard, SITC | 29 / 110 | 75 / 43 |

- A série HS96 do OEC começa em 1998, não em 1995. O Growth Lab não publica série HS96.
- O score da base cai de forma regular, 0,03 a 0,04 por ano, sem oscilação, o que não é o comportamento de uma série publicada.
- A escolha da fonte muda a conclusão: no OEC (HS96 ou HS92, 6 dígitos) o Brasil aparece à frente do Vietnã em 2023; no Growth Lab, o Vietnã aparece à frente.

**Fonte adotada.** A série foi substituída pela do Growth Lab de Harvard, classificação HS92, de 1995 a 2023: conjunto de dados "Growth Projections and Complexity Rankings", versão 12.0 (8 fev. 2026), arquivo `growth_proj_eci_rankings.csv`, colunas `eci_hs92` (score) e `eci_rank_hs92` (ranking), lido do Harvard Dataverse em 17 nov. 2026 (https://doi.org/10.7910/DVN/XTAQMC). Razões: é uma fonte única com DOI e cobre todo o período desde 1995. O score passa a ter três casas decimais, como na fonte.

- O ranking do Growth Lab cobre 140 economias de 1995 a 1999, 144 de 2000 a 2005 e 145 de 2006 em diante.
- Na série adotada, o Vietnã passa o Brasil em 2020, no score e no ranking, e segue à frente até 2023.
- O Brasil cai do 29º lugar (1995) para o 57º (2023); o Vietnã sobe do 119º para o 48º.

## O que esta conferência não cobre

- Séries fiscais do FMI (resultado nominal, primário e dívida): baixadas em 17 nov. 2026 da edição de abril de 2025 do World Economic Outlook, pelo espelho DBnomics; não foram comparadas de novo com o site do FMI.
- Taxa básica do Vietnã: calculada a partir da lista de decisões do State Bank of Vietnam (ver `verificacao_decisoes_sbv.md`).
- As tabelas do documento do TCC que usam os valores antigos precisam ser atualizadas à parte.
