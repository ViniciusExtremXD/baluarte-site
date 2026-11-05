# Site Baluarte Extintores

Site estático (HTML, CSS e um JS pequeno). Não precisa de PHP nem de banco de dados.

- **Prévia (GitHub Pages):** pasta `docs/`, com `noindex`. O Google não indexa a prévia.
- **Produção:** rode `python build.py producao`. O resultado sai na pasta `dist/`, que vai inteira para a raiz de `www.baluarteextintores.com.br`.

## Páginas

| URL | Conteúdo |
|---|---|
| `/` | Início |
| `/baixada-santista/` | Atendimento regional e unidades |
| `/recarga-de-extintores-guaruja/` e mais 5 cidades | Uma página por cidade, com texto, bairros e dúvidas próprios |
| `/conteudos/` | Blog técnico |
| `/conteudos/<artigo>/` | Artigos |

Também ficam na raiz: `robots.txt`, `sitemap.xml`, `llms.txt` (resumo da empresa para buscadores com IA) e `404.html`.

## Rastreamento (já pronto)

- O Google Tag Manager `GTM-58MG5F9P` já está no `<head>` de todas as páginas. Ele **só carrega no domínio oficial**, para a prévia não sujar os dados do GA4 e do Google Ads.
- Os botões de WhatsApp usam `https://wa.me/5513997401624?...` e os de telefone usam `tel:+551333522500`. Os acionadores do GTM já reconhecem esses formatos e registram as conversões no GA4 e no Ads.
- O formulário de orçamento não grava dados: ele envia o evento `orcamento_enviado` ao `dataLayer` e abre o WhatsApp com a mensagem pronta. O GTM usa esse evento para `generate_lead` e para a conversão de formulário no Google Ads. O telefone vai criptografado para as conversões otimizadas, pelo campo `#f-tel`: se mudar o id, ajuste a variável no GTM.
- A conversão conta quando o WhatsApp abre. Não dá para saber pelo site se a pessoa enviou a mensagem.

## Ao publicar em produção

1. Suba a pasta `dist/` inteira para a raiz do domínio, mantendo as pastas. Arquivos ocultos também: o `.htaccess` faz parte dela.
2. Os redirecionamentos 301 das URLs antigas estão em `data/htaccess`, que o build copia para `dist/.htaccess`. Não use `Redirect` para destino com `#`: o `gclid` dos anúncios cairia depois do `#` e a conversão perderia a origem.
3. Envie `https://www.baluarteextintores.com.br/sitemap.xml` no Google Search Console.

## Como publicar um artigo novo no blog

**Jeito recomendado** (precisa de Python com `jinja2`):
1. Crie `data/posts/<slug-do-artigo>.html` só com o corpo do texto. Use `<h2>`, `<p>`, `<ul>` e, se quiser, os blocos `post-answer`, `post-tip` e `post-table`. Os artigos que já existem servem de exemplo.
2. Adicione o artigo no **início** de `data/posts.json`, com título, descrição, data, categoria, tempo de leitura e resumo. Para escolher a foto do cartão, informe `"image"` com o nome de um arquivo de `assets/img/`.
3. Rode `python build.py producao` e suba a pasta `dist/`. A listagem, o rodapé, o sitemap e o `llms.txt` se atualizam sozinhos.

**Jeito manual** (sem Python):
1. Copie uma pasta de artigo dentro de `conteudos/`, troque o nome da pasta e edite o título, a descrição e o texto no `index.html`.
2. Em `conteudos/index.html`, duplique um item da lista (`<li>`) e aponte para a pasta nova.
3. Adicione a URL nova no `sitemap.xml`.

## Animações

Todo componente aparece ao rolar. O `site.js` marca os itens por seletor (lista `kinds`): componente novo entra nessa lista. Também há carrossel na primeira dobra, títulos palavra por palavra, linhas que se desenham, números que contam, faixa de clientes, foto que acompanha a rolagem, rolagem suave no computador e troca suave de página.

Se o aparelho pede menos movimento (no Windows, com "Efeitos de animação" desligado), os itens aparecem com deslocamento curto e saem a rolagem suave, os zooms e a foto que acompanha a rolagem. Para ver tudo mesmo assim, abra o site com `?motion=full` no fim do endereço. A escolha fica salva no navegador, e `?motion=auto` volta ao normal.

Para a animação continuar fluida ao mexer no site:

- Em `@keyframes`, anime só `translate`, `scale`, `rotate`, `transform` e `opacity`. `width`, `height`, `top` e `clip-path` fazem o navegador refazer a página a cada quadro.
- Animação que repete deve parar fora da tela: coloque a peça em `pauseAway()`, no `site.js`, e a classe `.is-away` pausa tudo dentro dela.
- No JavaScript, primeiro meça e depois escreva. Só escreva no HTML quando o valor mudar.
- O banner só conta o tempo enquanto está na tela. Ao voltar, ele continua de onde parou.
- O botão de WhatsApp dos bairros só muda quando a pessoa aponta ou escolhe um bairro. A troca automática nunca entra na mensagem.
- As fontes (Inter e Plus Jakarta Sans) ficam em `assets/fonts/`, com o aviso de licença, e não dependem do Google. O `site.css` as declara e o `base.html` as pré-carrega: para trocar um arquivo, use um nome novo e atualize os dois lugares. Elas têm só os caracteres latinos, que cobrem o português; o `₂` de "CO₂" vem da fonte do sistema.

## Prazo e desconto

O `build.py` coloca sozinho um asterisco em "dias úteis" e "20% de desconto" no texto visível, e mostra a observação no rodapé só das páginas que têm a marca (`NOTA_PRAZO`). Não digite o asterisco nos textos. Se escrever a promessa de outro jeito, ajuste `PROMESSA` no `build.py` ou coloque o `*` à mão. Título e descrição das páginas, que aparecem no Google, ficam sem asterisco.

## Fotos

As fotos vêm do site antigo da Baluarte, ampliadas por IA. As exceções são as dos cartões de sinalização (`svc-sinalizacao.webp`) e de porta corta-fogo (`svc-porta.webp`), enviadas pelo Diego em novembro de 2026. Elas não são da Baluarte e a origem ainda precisa ser confirmada. Troque por fotos reais assim que houver.

A placa de sinalização aparece inteira sobre um fundo do mesmo verde (classe `.svc-plate`), para não cortar em nenhuma largura de tela. Se trocar a imagem, ajuste essa cor no `site.css`.

## Avaliações

O carrossel usa `data/reviews.json`: avaliações reais e públicas da ficha da Baluarte no Google, copiadas sem alterar o texto. O nome mostra os dois primeiros nomes da pessoa, e a foto vem direto do Google (se a pessoa trocar ou apagar, aparece a inicial do nome). Não invente nem edite avaliações. Antes de publicar no domínio, veja com o cliente a autorização para usar nome e foto.

## Endereços

Cada página de cidade mostra o endereço da unidade que a atende (`UNITS` e `CITY_MAP`, no `build.py`). Hoje só existem duas unidades reais, Guarujá e Santos: as outras cidades mostram "Unidade mais próxima". Para dar endereço próprio a uma cidade, adicione a unidade em `UNITS`, aponte a cidade para ela em `CITY_MAP` e preencha a etiqueta. Não publique endereço onde a empresa não está: isso pode derrubar a ficha no Google.

## Mapa das unidades

Na página inicial, em `/baixada-santista/` e nas páginas de cidade, o primeiro clique em um ponto (ou na linha da lista) mostra a unidade e o segundo abre a página dela. Na página de uma cidade, ela já abre em destaque, e o botão "Como chegar" abre o Google Maps da unidade. O mapa usa Leaflet (carregado de unpkg.com só quando chega perto da tela) com o mapa do OpenStreetMap. As coordenadas ficam em `CITY_MAP`, no `build.py`.

## Estrutura do código

- `build.py`: gera as páginas a partir dos templates e dos dados.
- `templates/`: HTML com Jinja2.
- `data/content.json`: textos das cidades, da região e da página inicial.
- `data/posts.json` e `data/posts/`: blog.
- `assets/css/site.css` e `assets/js/site.js`: visual, menu do celular e animações.
- `assets/js/lenis.min.js`: rolagem suave no computador (Lenis 1.1.13, licença MIT).
