"""Gera o site estatico da Baluarte Extintores.

Uso:
  python build.py preview   -> docs/  (GitHub Pages: noindex, sem noscript do GTM)
  python build.py producao  -> dist/  (para subir em www.baluarteextintores.com.br)
"""
import json
import os
import shutil
import sys
from datetime import date
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = os.path.dirname(os.path.abspath(__file__))
MODE = sys.argv[1] if len(sys.argv) > 1 else "preview"
OUT = os.path.join(ROOT, "docs" if MODE == "preview" else "dist")
SITE_URL = "https://www.baluarteextintores.com.br"
GTM_ID = "GTM-58MG5F9P"

WA_NUMBER = "5513997401621"
PHONE_TEL = "+551333522500"
PHONE_LABEL = "(13) 3352-2500"
WA_LABEL = "(13) 99740-1621"
EMAIL = "baluarte@baluarteextintores.com.br"
HOURS = "Segunda a sexta, das 8h às 12h e das 13h15 às 18h"
REVIEWS_URL = "https://www.google.com/maps/search/?api=1&query=Baluarte+Extintores+Guaruj%C3%A1"


def wa(msg="Olá! Vim pelo site e quero vistoria e orçamento grátis."):
    return f"https://wa.me/{WA_NUMBER}?text={quote(msg)}"


content = json.load(open(os.path.join(ROOT, "data", "content.json"), encoding="utf-8"))
clientes = json.load(open(os.path.join(ROOT, "data", "clientes.json"), encoding="utf-8"))
posts = json.load(open(os.path.join(ROOT, "data", "posts.json"), encoding="utf-8"))
for p in posts:
    p["body"] = open(os.path.join(ROOT, "data", "posts", p["slug"] + ".html"), encoding="utf-8").read()

CITY_NAMES = {
    "recarga-de-extintores-guaruja": ("Guarujá", "Sede própria na cidade, atendimento em todos os bairros."),
    "recarga-de-extintores-santos": ("Santos", "Escritório comercial na cidade e foco em condomínios verticais."),
    "recarga-de-extintores-sao-vicente": ("São Vicente", "Condomínios e comércio, com retirada e entrega grátis."),
    "recarga-de-extintores-praia-grande": ("Praia Grande", "Prédios de temporada e administradoras, com lembrete de vencimento."),
    "recarga-de-extintores-bertioga": ("Bertioga", "Comércio, condomínios e casas, com venda de extintores novos."),
    "recarga-de-extintores-riviera-de-sao-lourenco": ("Riviera de São Lourenço", "Condomínios de alto padrão e casas de veraneio, em todos os módulos."),
}
cities = content["cities"]
for c in cities:
    c["name"], c["short"] = CITY_NAMES[c["slug"]]
    c["wa"] = wa(c["wa_msg"] or f"Olá! Vim pelo site e quero vistoria e orçamento grátis em {c['name']}.")

OTHER_CITIES = ["Cubatão", "Mongaguá", "Itanhaém", "Peruíbe"]

SERVICES = [
    {"icon": "extintor", "title": "Recarga e manutenção de extintores", "text": "Recarga, manutenção e vistoria de extintores de todos os tipos, com selo de conformidade do INMETRO.", "tag": "Obrigatória a cada 12 meses", "msg": "Olá! Quero orçamento de recarga de extintores."},
    {"icon": "mangueira", "title": "Teste hidrostático de mangueiras", "text": "Feito no seu condomínio com equipamento automático, nas pressões exigidas pelas normas. O treinamento básico de uso é gratuito.", "tag": "Obrigatório todo ano", "msg": "Olá! Quero orçamento de teste hidrostático de mangueiras."},
    {"icon": "placa", "title": "Sinalização de emergência", "text": "Placas de rota de fuga, saída e equipamentos, instaladas conforme Instrução Técnica do Corpo de Bombeiros.", "tag": "Exigida na vistoria dos Bombeiros", "msg": "Olá! Quero orçamento de sinalização de emergência."},
    {"icon": "porta", "title": "Porta corta-fogo", "text": "Manutenção e regulagem de portas corta-fogo para que fechem e vedem como a norma exige.", "tag": "Item de rota de fuga", "msg": "Olá! Quero orçamento de manutenção de porta corta-fogo."},
    {"icon": "vistoria", "title": "Vistoria de segurança", "text": "Levantamento completo dos equipamentos de combate a incêndio do imóvel, sem custo e sem compromisso.", "tag": "Grátis", "msg": "Olá! Quero agendar uma vistoria de segurança grátis."},
    {"icon": "carrinho", "title": "Venda de extintores e equipamentos", "text": "Extintores novos e equipamentos de combate a incêndio, com orientação sobre o tipo e a quantidade certos para o seu imóvel.", "tag": "Obra nova ou reposição", "msg": "Olá! Quero orçamento de extintores novos."},
]
for s in SERVICES:
    s["wa"] = wa(s["msg"])

INCLUDED = [
    ("Vistoria técnica e orçamento", "Um técnico confere extintores, mangueiras e sinalização e diz exatamente o que precisa ser feito.", "Grátis"),
    ("Retirada e entrega", "Buscamos os extintores no seu endereço e devolvemos prontos. Ninguém do prédio precisa carregar nada.", "Grátis"),
    ("Extintores reservas", "Deixamos extintores no lugar dos seus durante a recarga. O imóvel continua protegido.", "Incluso"),
    ("Teste de mangueiras no local", "O teste hidrostático é feito no seu prédio. As mangueiras não saem de lá.", "Incluso"),
    ("Lembrete de vencimento", "Avisamos no WhatsApp quando a próxima manutenção estiver chegando. Você não precisa controlar datas.", "Grátis"),
    ("Treinamento básico de mangueiras", "Ensinamos síndico, zelador e funcionários a usar as mangueiras de incêndio do prédio.", "Grátis"),
]

STEPS = [
    ("Hoje", "Chame no WhatsApp", "Diga onde fica o imóvel e, se puder, mande a foto da etiqueta de um extintor."),
    ("Na data que você escolher", "Vistoria e orçamento grátis", "Nosso técnico avalia tudo no local e você recebe o orçamento sem compromisso."),
    ("No dia combinado", "Retirada com reserva", "Levamos seus extintores, deixamos os reservas e testamos as mangueiras no próprio prédio."),
    ("Em até 7 dias úteis", "Devolução e lembrete", "Extintores voltam recarregados, com selo do INMETRO. Daqui a 12 meses, avisamos você."),
]

RISKS = [
    ("AVCB ou CLCB travado", "Extintores e mangueiras vencidos estão entre os itens conferidos na vistoria do Corpo de Bombeiros."),
    ("Autuação e multa", "Equipamentos fora das exigências dos Bombeiros podem gerar autuação e multa, conforme a legislação estadual."),
    ("Problema com o seguro", "Em caso de sinistro, a seguradora pode questionar a indenização se os equipamentos estiverem irregulares."),
    ("Responsabilidade sua", "O síndico ou o responsável pelo imóvel responde pela manutenção dos equipamentos de segurança."),
]

AUDIENCE = ["Síndicos", "Administradoras", "Comércios", "Construção civil", "Empresas e indústrias", "Clínicas e escolas", "Restaurantes", "Galpões"]

reviews = content["home"]["reviews"]
home_faq = content["home"]["faq"]

ORG_SCHEMA = {
    "@type": "LocalBusiness",
    "@id": SITE_URL + "/#empresa",
    "name": "Baluarte Extintores de Incêndio",
    "alternateName": "Baluarte Extintores",
    "description": "Recarga e manutenção de extintores, teste hidrostático de mangueiras, sinalização de emergência, porta corta-fogo e venda de extintores na Baixada Santista. Mais de 30 anos de mercado, mais de 14.000 clientes e mais de 1 milhão de extintores recarregados. Registro INMETRO de Conformidade de Fornecedor nº 3495/22.",
    "url": SITE_URL + "/",
    "telephone": "+55 13 3352-2500",
    "email": EMAIL,
    "logo": SITE_URL + "/assets/img/logo.png",
    "image": SITE_URL + "/assets/img/og-baluarte.jpg",
    "priceRange": "$$",
    "address": {"@type": "PostalAddress", "streetAddress": "Av. Piassaguera, 1189", "addressLocality": "Guarujá", "addressRegion": "SP", "postalCode": "11454-630", "addressCountry": "BR"},
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "08:00", "closes": "12:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "13:15", "closes": "18:00"},
    ],
    "department": [{
        "@type": "LocalBusiness", "name": "Baluarte Extintores – Escritório comercial Santos",
        "address": {"@type": "PostalAddress", "streetAddress": "R. Dr. Luis Suplicy, 31", "addressLocality": "Santos", "addressRegion": "SP", "postalCode": "11055-330", "addressCountry": "BR"},
        "telephone": "+55 13 3352-2500",
    }],
    "areaServed": [{"@type": "City", "name": n} for n in ["Guarujá", "Santos", "São Vicente", "Praia Grande", "Bertioga", "Cubatão", "Mongaguá", "Itanhaém", "Peruíbe"]],
    "sameAs": ["https://www.instagram.com/baluarte.extintores", "https://www.facebook.com/baluarteextintores", "https://www.youtube.com/channel/UC6zuQS2TfPEjO3gAp07oJUg"],
}


def faq_schema(items):
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": i["q"], "acceptedAnswer": {"@type": "Answer", "text": i["a"]}} for i in items]}


def crumbs_schema(items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": n + 1, "name": name, "item": SITE_URL + url} for n, (name, url) in enumerate(items)]}


def ld(*nodes):
    return json.dumps({"@context": "https://schema.org", "@graph": list(nodes)}, ensure_ascii=False)


env = Environment(loader=FileSystemLoader(os.path.join(ROOT, "templates")), autoescape=select_autoescape(["html"]), trim_blocks=True, lstrip_blocks=True)
env.globals.update(
    wa=wa, PHONE_TEL=PHONE_TEL, PHONE_LABEL=PHONE_LABEL, WA_LABEL=WA_LABEL, EMAIL=EMAIL, HOURS=HOURS,
    REVIEWS_URL=REVIEWS_URL, GTM_ID=GTM_ID, PREVIEW=(MODE == "preview"), SITE_URL=SITE_URL,
    cities=cities, OTHER_CITIES=OTHER_CITIES, SERVICES=SERVICES, INCLUDED=INCLUDED, STEPS=STEPS,
    RISKS=RISKS, AUDIENCE=AUDIENCE, reviews=reviews, clientes=clientes, posts=posts, year=date.today().year,
)


def render(tpl, path, **ctx):
    depth = path.count("/")
    root = "../" * depth
    html = env.get_template(tpl).render(root=root, path=path, canonical=SITE_URL + "/" + path, **ctx)
    dest = os.path.join(OUT, path, "index.html") if path else os.path.join(OUT, "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(html)
    return path


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(OUT, "assets"))
    pages = []

    pages.append(render(
        "home.html", "",
        title="Recarga de Extintores na Baixada Santista | Baluarte Extintores",
        description=content["home"]["description"],
        faq=home_faq,
        schema=ld(ORG_SCHEMA, faq_schema(home_faq)),
    ))

    reg = content["regional"]
    pages.append(render(
        "regional.html", "baixada-santista/",
        title=reg["title"], description=reg["description"], reg=reg, faq=reg["faq"],
        schema=ld(ORG_SCHEMA, faq_schema(reg["faq"]), crumbs_schema([("Início", "/"), ("Baixada Santista", "/baixada-santista/")])),
    ))

    for c in cities:
        others = [o for o in cities if o["slug"] != c["slug"]]
        pages.append(render(
            "city.html", c["slug"] + "/",
            title=c["title"], description=c["description"], city=c, others=others, faq=c["faq"],
            schema=ld(
                ORG_SCHEMA,
                {"@type": "Service", "name": "Recarga de extintores em " + c["name"], "serviceType": "Recarga e manutenção de extintores", "provider": {"@id": SITE_URL + "/#empresa"}, "areaServed": {"@type": "City", "name": c["name"]}},
                faq_schema(c["faq"]),
                crumbs_schema([("Início", "/"), ("Baixada Santista", "/baixada-santista/"), (c["name"], "/" + c["slug"] + "/")]),
            ),
        ))

    pages.append(render(
        "blog_index.html", "conteudos/",
        title="Conteúdos sobre extintores e prevenção contra incêndio | Baluarte Extintores",
        description="Artigos técnicos sobre recarga de extintores, teste hidrostático de mangueiras, normas e vistoria do Corpo de Bombeiros, escritos pela equipe da Baluarte Extintores.",
        schema=ld(ORG_SCHEMA, crumbs_schema([("Início", "/"), ("Conteúdos", "/conteudos/")])),
    ))
    for p in posts:
        related = [o for o in posts if o["slug"] != p["slug"]][:2]
        pages.append(render(
            "post.html", "conteudos/" + p["slug"] + "/",
            title=p["title"] + " | Baluarte Extintores", description=p["description"], post=p, related=related,
            schema=ld(
                ORG_SCHEMA,
                {"@type": "Article", "headline": p["title"], "description": p["description"], "datePublished": p["date"], "dateModified": p["date"],
                 "author": {"@type": "Organization", "name": "Equipe técnica Baluarte Extintores", "url": SITE_URL + "/"},
                 "publisher": {"@id": SITE_URL + "/#empresa"}, "image": SITE_URL + "/assets/img/og-baluarte.jpg",
                 "mainEntityOfPage": SITE_URL + "/conteudos/" + p["slug"] + "/"},
                crumbs_schema([("Início", "/"), ("Conteúdos", "/conteudos/"), (p["title"], "/conteudos/" + p["slug"] + "/")]),
            ),
        ))

    # 404 (GitHub Pages e Apache usam /404.html)
    html404 = env.get_template("404.html").render(root="/" if MODE != "preview" else "/baluarte-site/", path="404", canonical=SITE_URL + "/", title="Página não encontrada | Baluarte Extintores", description="Página não encontrada.", schema=ld(ORG_SCHEMA))
    open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(html404)

    # robots, sitemap, llms
    if MODE == "preview":
        robots = "User-agent: *\nDisallow: /\n"
    else:
        robots = f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n"
    open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8").write(robots)
    today = date.today().isoformat()
    urls = "".join(f"  <url><loc>{SITE_URL}/{p}</loc><lastmod>{today}</lastmod></url>\n" for p in pages)
    open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8").write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    llms = open(os.path.join(ROOT, "data", "llms.txt"), encoding="utf-8").read()
    llms += "\n## Conteúdos técnicos\n" + "".join(f"- [{p['title']}]({SITE_URL}/conteudos/{p['slug']}/): {p['description']}\n" for p in posts)
    open(os.path.join(OUT, "llms.txt"), "w", encoding="utf-8").write(llms)
    if MODE == "preview":
        open(os.path.join(OUT, ".nojekyll"), "w").write("")
    print(f"{MODE}: {len(pages)} páginas em {OUT}")


if __name__ == "__main__":
    main()
