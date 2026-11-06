"""Gera o site estatico da Baluarte Extintores.

Uso:
  python build.py preview   -> docs/  (GitHub Pages: noindex, sem noscript do GTM)
  python build.py producao  -> dist/  (para subir em www.baluarteextintores.com.br)
"""
import hashlib
import json
import os
import re
import shutil
import sys
from datetime import date
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup

ROOT = os.path.dirname(os.path.abspath(__file__))
MODE = sys.argv[1] if len(sys.argv) > 1 else "preview"
OUT = os.path.join(ROOT, "docs" if MODE == "preview" else "dist")
SITE_URL = "https://www.baluarteextintores.com.br"
GTM_ID = "GTM-58MG5F9P"

WA_NUMBER = "5513997401624"
PHONE_TEL = "+551333522500"
PHONE_LABEL = "(13) 3352-2500"
WA_LABEL = "(13) 99740-1624"
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

CITY_PHOTOS = [("sede-guaruja.webp", "Fachada da sede da Baluarte Extintores em Guarujá"), ("hero-tecnico.webp", "Técnico segurando um extintor de incêndio"), ("hero-valvula.webp", "Detalhe do manômetro e da válvula de um extintor")]
for n, c in enumerate(cities):
    c["img"], c["img_alt"] = CITY_PHOTOS[0] if n == 0 else CITY_PHOTOS[1 + n % 2]
    c["h1_html"] = Markup(c["h1"].replace(c["name"], "<em>" + c["name"] + "</em>"))
content["regional"]["h1_html"] = Markup(content["regional"]["h1"].replace("Baixada Santista", "<em>Baixada Santista</em>"))

POST_PHOTOS = {"recarga-de-extintor-prazo-obrigatorio": "hero-tecnico.webp", "tipos-de-extintor-de-incendio": "hero-valvula.webp", "teste-hidrostatico-mangueira-de-incendio": "svc-mangueira.webp"}
for p in posts:
    p.setdefault("image", POST_PHOTOS.get(p["slug"], "hero-tecnico.webp"))

OFFICE_Q = "R.%20Dr.%20Luis%20Suplicy%2C%2031%2C%20Santos%20-%20SP%2C%2011055-330"
# Endereços reais da Baluarte. Para dar endereço próprio a uma cidade, adicione a unidade aqui,
# aponte a cidade para ela em CITY_MAP e preencha a etiqueta (terceiro campo).
UNITS = {
    "sede": {"label": "Sede e oficina em Guarujá", "street": "Av. Piassaguera, 1189", "town": "Guarujá - SP", "cep": "CEP 11454-630", "href": REVIEWS_URL},
    "escritorio": {"label": "Escritório comercial em Santos", "street": "R. Dr. Luis Suplicy, 31", "town": "Santos - SP", "cep": "CEP 11055-330", "href": "https://www.google.com/maps/search/?api=1&query=" + OFFICE_Q},
}
# lat, lng, etiqueta no mapa, lado do nome no mapa, unidade mais próxima
CITY_MAP = {
    "recarga-de-extintores-guaruja": (-23.943314, -46.2801126, "Sede", "right", "sede"),
    "recarga-de-extintores-santos": (-23.9621043, -46.3297292, "Escritório", "top", "escritorio"),
    "recarga-de-extintores-sao-vicente": (-23.9631, -46.3919, "", "left", "escritorio"),
    "recarga-de-extintores-praia-grande": (-24.0084, -46.4128, "", "left", "escritorio"),
    "recarga-de-extintores-bertioga": (-23.8544, -46.1386, "", "top", "sede"),
    "recarga-de-extintores-riviera-de-sao-lourenco": (-23.7950, -46.0190, "", "left", "sede"),
}
for c in cities:
    c["lat"], c["lng"], c["tag"], c["side"], unit = CITY_MAP[c["slug"]]
    u = c["unit"] = UNITS[unit]
    c["unit_line"] = ("" if c["tag"] else "Unidade mais próxima: ") + u["street"] + " · " + u["town"]
    in_name = c["h1"].split("extintores ")[1]  # "em Santos", "na Riviera de São Lourenço"
    c["in_name"] = in_name[0].upper() + in_name[1:]

SERVICES = [
    {"title": "Recarga e manutenção de extintores", "text": "Todos os tipos, com selo do INMETRO. Retiramos no seu imóvel, deixamos reservas no lugar e devolvemos em até 7 dias úteis. Obrigatória a cada 12 meses.", "msg": "Olá! Quero orçamento de recarga de extintores.", "icon": "refresh", "img": "svc-recarga.webp", "w": 1040, "h": 960, "alt": "Técnico manuseando um extintor com selo do INMETRO", "featured": True},
    {"title": "Teste hidrostático de mangueiras", "text": "Feito no seu prédio, com equipamento automático. Obrigatório todo ano.", "msg": "Olá! Quero orçamento de teste hidrostático de mangueiras.", "icon": "droplets", "img": "svc-mangueira.webp", "w": 1280, "h": 382, "alt": "Mangueira de incêndio enrolada"},
    {"title": "Sinalização de emergência", "text": "Placas de rota de fuga, saída e equipamentos, conforme o Corpo de Bombeiros.", "msg": "Olá! Quero orçamento de sinalização de emergência.", "icon": "exit", "img": "svc-sinalizacao.webp", "w": 971, "h": 469, "alt": "Placa de saída de emergência com escada e seta", "plate": True},
    {"title": "Porta corta-fogo", "text": "Venda e manutenção para fechar e proteger como a norma exige.", "msg": "Olá! Quero orçamento de manutenção de porta corta-fogo.", "icon": "door", "img": "svc-porta.webp", "w": 890, "h": 520, "alt": "Porta corta-fogo dupla cinza com barra antipânico e placas de sinalização"},
    {"title": "Vistoria de segurança", "text": "Levantamento dos equipamentos do imóvel, sem custo e sem compromisso.", "msg": "Olá! Quero agendar uma vistoria de segurança grátis.", "icon": "clipboard", "img": "svc-vistoria.webp", "w": 1280, "h": 382, "alt": "Manômetro de um extintor sendo conferido"},
    {"title": "Venda de extintores e equipamentos", "text": "Novos, com orientação sobre o tipo e a quantidade certos para o seu imóvel.", "msg": "Olá! Quero orçamento de extintores novos.", "icon": "extinguisher", "img": "svc-venda.webp", "w": 1200, "h": 547, "alt": "Extintor de incêndio novo"},
]

ICONS = {
    "pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "shield": '<path d="M12 2 4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    "truck": '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    "refresh": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "droplets": '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    "exit": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    "door": '<path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/>',
    "clipboard": '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    "extinguisher": '<path d="M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5"/><path d="M9 18h8"/><path d="M18 3h-3"/><path d="M11 3a6 6 0 0 0-6 6v11"/><path d="M5 13h4"/><path d="M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z"/>',
    "instagram": '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
    "facebook": '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    "youtube": '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
}


def icon(name):
    return Markup('<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>")


INCLUDED = ["Vistoria técnica e orçamento", "Retirada e entrega", "Extintores reservas durante a recarga", "Teste de mangueiras no local", "Lembrete de vencimento no WhatsApp", "Treinamento básico de mangueiras"]

STEPS = [
    ("Chame no WhatsApp", "Diga onde fica o imóvel e, se puder, mande a foto da etiqueta de um extintor."),
    ("Vistoria e orçamento grátis", "Nosso técnico avalia tudo no local e você recebe o orçamento sem compromisso."),
    ("Retirada com reserva", "Levamos seus extintores, deixamos os reservas e testamos as mangueiras no prédio."),
    ("Devolução em até 7 dias úteis", "Os extintores voltam recarregados, com selo do INMETRO. Em 12 meses, avisamos você."),
]

reviews = json.load(open(os.path.join(ROOT, "data", "reviews.json"), encoding="utf-8"))
home_faq = [content["home"]["faq"][i] for i in (0, 1, 3, 4, 5, 7)]

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


# Toda menção ao prazo de devolução ou ao desconto leva asterisco, e a observação aparece no rodapé da página.
NOTA_PRAZO = "* Prazo por lote quando não realizado em única etapa, sujeito à região atendida, disponibilidade logística e períodos de alta demanda. Exceções informadas previamente."
PROMESSA = re.compile(r"dias úteis|20% de desconto(?: no próximo serviço)?")
AST_TITULO = '<span style="margin-right:-.14em">*</span>'


def faq_schema(items):
    def answer(text):
        marked, n = PROMESSA.subn(r"\g<0>*", text)
        return f"{marked} {NOTA_PRAZO}" if n else text
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": i["q"], "acceptedAnswer": {"@type": "Answer", "text": answer(i["a"])}} for i in items]}


def mark_promises(html):
    """Marca só o texto visível do corpo da página; título, descrição, atributos e scripts ficam como estão."""
    head, body = html.split("<body>", 1)
    parts = re.split(r"(<script.*?</script>|<svg.*?</svg>|<[^>]+>)", body, flags=re.S)
    has_mark = False
    for i in range(0, len(parts), 2):
        parts[i], n = PROMESSA.subn(r"\g<0>*", parts[i])
        has_mark = has_mark or n > 0
    note = f'<p class="ftr-nota">{NOTA_PRAZO}</p>' if has_mark else ""
    corpo = "".join(parts).replace("<!--nota-prazo-->", note)
    # No título grande do banner, a fonte deixa um vão depois do asterisco.
    return head + "<body>" + corpo.replace("dias úteis*</em>, ou", f"dias úteis{AST_TITULO}</em>, ou").replace("de desconto*.", f"de desconto{AST_TITULO}.")


def crumbs_schema(items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": n + 1, "name": name, "item": SITE_URL + url} for n, (name, url) in enumerate(items)]}


def ld(*nodes):
    return json.dumps({"@context": "https://schema.org", "@graph": list(nodes)}, ensure_ascii=False)


# Muda o endereço do CSS e do JS a cada alteração, para o navegador não ficar com a versão antiga
_h = hashlib.md5()
for _f in ("site.css", "site.js"):
    _h.update(open(os.path.join(ROOT, "assets", "css" if _f.endswith("css") else "js", _f), "rb").read())
ASSET_V = _h.hexdigest()[:8]

env = Environment(loader=FileSystemLoader(os.path.join(ROOT, "templates")), autoescape=select_autoescape(["html"]), trim_blocks=True, lstrip_blocks=True)
env.globals.update(
    wa=wa, icon=icon, ASSET_V=ASSET_V, OFFICE_Q=OFFICE_Q, WA_NUMBER=WA_NUMBER, PHONE_TEL=PHONE_TEL, PHONE_LABEL=PHONE_LABEL, WA_LABEL=WA_LABEL, EMAIL=EMAIL, HOURS=HOURS,
    REVIEWS_URL=REVIEWS_URL, GTM_ID=GTM_ID, PREVIEW=(MODE == "preview"), SITE_URL=SITE_URL,
    cities=cities, OTHER_CITIES=OTHER_CITIES, SERVICES=SERVICES, INCLUDED=INCLUDED, STEPS=STEPS,
    reviews=reviews, clientes=clientes, posts=posts, year=date.today().year,
)


def render(tpl, path, **ctx):
    depth = path.count("/")
    root = "../" * depth
    html = mark_promises(env.get_template(tpl).render(root=root, path=path, canonical=SITE_URL + "/" + path, **ctx))
    dest = os.path.join(OUT, path, "index.html") if path else os.path.join(OUT, "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(html)
    return path


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(OUT, "assets"))
    shutil.copy(os.path.join(ROOT, "assets", "img", "favicon.ico"), os.path.join(OUT, "favicon.ico"))
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
        pages.append(render(
            "city.html", c["slug"] + "/",
            title=c["title"], description=c["description"], city=c, faq=c["faq"],
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
    html404 = mark_promises(env.get_template("404.html").render(root="/" if MODE != "preview" else "/baluarte-site/", path="404", canonical=SITE_URL + "/", title="Página não encontrada | Baluarte Extintores", description="Página não encontrada.", schema=ld(ORG_SCHEMA)))
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
    else:
        shutil.copy(os.path.join(ROOT, "data", "htaccess"), os.path.join(OUT, ".htaccess"))
    print(f"{MODE}: {len(pages)} páginas em {OUT}")


if __name__ == "__main__":
    main()
