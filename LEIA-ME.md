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
- Os botões de WhatsApp usam `https://wa.me/5513997401621?...` e os de telefone usam `tel:+551333522500`. Os acionadores do GTM já reconhecem esses formatos e registram as conversões no GA4 e no Ads.
- O site novo não tem formulário: todo pedido vai pelo WhatsApp ou pelo telefone.

## Ao publicar em produção

1. Suba a pasta `dist/` inteira para a raiz do domínio, mantendo as pastas.
2. Crie redirecionamentos 301 das URLs antigas, por exemplo no `.htaccess`:
   ```
   Redirect 301 /conteudo/quem-somos /
   Redirect 301 /conteudo/servicos /#servicos
   Redirect 301 /conteudo/clientes /#clientes
   Redirect 301 /conteudo/areas-de-atuacao /baixada-santista/
   Redirect 301 /contato /#contato
   Redirect 301 /servicos/recarga-vistoria-de-extintor /#servicos
   Redirect 301 /servicos/placas-de-sinalizacao /#servicos
   Redirect 301 /servicos/teste-hidrostatico /#servicos
   Redirect 301 /servicos/porta-corta-fogo /#servicos
   ```
3. Envie `https://www.baluarteextintores.com.br/sitemap.xml` no Google Search Console.

## Como publicar um artigo novo no blog

**Jeito recomendado** (precisa de Python com `jinja2`):
1. Crie `data/posts/<slug-do-artigo>.html` só com o corpo do texto. Use `<h2>`, `<p>`, `<ul>` e, se quiser, os blocos `post-answer`, `post-tip` e `post-table`. Os artigos que já existem servem de exemplo.
2. Adicione o artigo no **início** de `data/posts.json`, com título, descrição, data, categoria, tempo de leitura e resumo.
3. Rode `python build.py producao` e suba a pasta `dist/`. A listagem, o rodapé, o sitemap e o `llms.txt` se atualizam sozinhos.

**Jeito manual** (sem Python):
1. Copie uma pasta de artigo dentro de `conteudos/`, troque o nome da pasta e edite o título, a descrição e o texto no `index.html`.
2. Em `conteudos/index.html`, duplique um item da lista (`<li>`) e aponte para a pasta nova.
3. Adicione a URL nova no `sitemap.xml`.

## Animações

Entrada da primeira dobra, itens que aparecem ao rolar, números que contam, foto que acompanha a rolagem, rolagem suave no computador e troca suave de página.

Se o aparelho pede menos movimento (no Windows, com "Efeitos de animação" desligado), ficam só os fades. Para ver tudo mesmo assim, abra o site com `?motion=full` no fim do endereço. A escolha fica salva no navegador, e `?motion=auto` volta ao normal.

## Estrutura do código

- `build.py`: gera as páginas a partir dos templates e dos dados.
- `templates/`: HTML com Jinja2.
- `data/content.json`: textos das cidades, da região e da página inicial.
- `data/posts.json` e `data/posts/`: blog.
- `assets/css/site.css` e `assets/js/site.js`: visual, menu do celular e animações.
- `assets/js/lenis.min.js`: rolagem suave no computador (Lenis 1.1.13, licença MIT).
