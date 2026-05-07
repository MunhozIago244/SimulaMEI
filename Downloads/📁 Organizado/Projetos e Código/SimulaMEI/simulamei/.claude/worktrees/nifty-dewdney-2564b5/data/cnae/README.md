# Dados oficiais de CNAE

Esta pasta guarda snapshots gerados a partir de fontes oficiais.

Fonte primaria parseada:
- IBGE/CONCLA, CNAE 2.3 Subclasses - estrutura detalhada.

Fontes normativas monitoradas por hash:
- Anexo XI do Simples Nacional/Receita Federal, ocupacoes permitidas ao MEI.
- Indice oficial de legislacao do Simples Nacional/Receita Federal.

Como atualizar:

```bash
npm run cnae:sync
```

Como verificar em rotina automatizada:

```bash
npm run cnae:check
```

O modo `cnae:check` compara o arquivo `data/cnae/latest.json` com a versao oficial atual. Se encontrar CNAE adicionado, removido ou alterado, o processo termina com codigo `2` e deixa um relatorio em `data/cnae/reports`.

Observacao importante: o catalogo oficial do IBGE/CONCLA descreve os CNAEs. A classificacao tributaria do Simples Nacional, Fator R e permissao para MEI continuam sendo uma camada tributaria curada e devem ser reconciliadas com atos oficiais do CGSN/Receita Federal antes de entrar no motor de calculo.
