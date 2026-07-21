# Assets da Loja / skins

- `placeholders/silhouette.svg` — preview temporário (não usar sprite de outra skin).
- `skins/<slug>/` — coloque aqui os PNGs reais:

  - `master.png`
  - `typing.png`
  - `thinking.png`
  - `sucess.png`
  - `error.png`
  - `special01.png`
  - `special02.png`
  - `preview.png`
  - `thumb.png`

Depois de subir os arquivos, atualize `placeholder: false` e os paths em
`src/lib/assistant/skinConfig.ts` para a skin correspondente.
