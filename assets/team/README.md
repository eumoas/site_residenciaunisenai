# Fotos da equipe

Coloque as fotos dos integrantes nesta pasta e cadastre cada pessoa no array
`teamMembers` de `hub-config.js`.

Exemplo:

```js
teamMembers: [
  {
    name: 'Nome completo',
    role: 'Função',
    area: 'Área de atuação',
    photo: 'assets/team/nome-do-arquivo.webp'
  }
]
```

Os formatos PNG, JPEG e WebP funcionam normalmente. Para manter o site leve,
prefira fotos verticais em WebP. Se `photo` ficar vazio ou a imagem não carregar,
o site exibe automaticamente as iniciais da pessoa.
