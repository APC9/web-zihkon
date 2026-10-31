// Pruebas del seguimiento de visitas (Metricool y Google Tag Manager). Ejecutar: node --test pruebas/
// Metricool solo «detecta» la web si su código está escrito en el HTML (no inyectado desde js/main.js).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import vm from "node:vm";

const HASH = "350df9e5fe8ae50973d8fddcf9b16c76";
const TRACKER = "https://tracker.metricool.com/resources/be.js";
const paginas = execFileSync("git", ["ls-files", "*.html"], { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !f.startsWith("generador/") && !f.startsWith("_docx"));

const scriptMetricool = (html) => {
  const cabeza = html.slice(0, html.indexOf("</head>"));
  return [...cabeza.matchAll(/<script>([^<]*tracker\.metricool\.com[^<]*)<\/script>/g)].map((m) => m[1]);
};

describe("contador de Metricool", () => {
  it("hay páginas que revisar", () => assert.ok(paginas.length >= 10, paginas.join(", ")));

  for (const pagina of paginas) {
    it(`${pagina} lleva el código una sola vez en el <head>`, () => {
      const scripts = scriptMetricool(readFileSync(pagina, "utf8"));
      assert.equal(scripts.length, 1);
      assert.ok(scripts[0].includes(HASH));
    });
  }

  it("el generador de páginas lo incluye", () => {
    assert.ok(readFileSync("generador/generar.py", "utf8").includes(HASH));
  });

  it("js/main.js ya no lo inyecta (si no, se contarían visitas dobles)", () => {
    assert.ok(!readFileSync("js/main.js", "utf8").includes("tracker.metricool.com"));
  });

  it("el código carga be.js y envía la visita con el hash de Zihkon", () => {
    const anadidos = [];
    const enviados = [];
    const head = { appendChild: (s) => anadidos.push(s) };
    const contexto = {
      document: { getElementsByTagName: (t) => (t === "head" ? [head] : []), createElement: () => ({}) },
    };
    vm.runInNewContext(scriptMetricool(readFileSync("index.html", "utf8"))[0], contexto);
    assert.equal(anadidos.length, 1);
    assert.equal(anadidos[0].src, TRACKER);
    contexto.beTracker = { t: (datos) => enviados.push(datos) };
    anadidos[0].onload();
    assert.equal(enviados.length, 1);
    assert.equal(enviados[0].hash, HASH);
  });
});

describe("Google Tag Manager", () => {
  const GTM = "GTM-P68VJQNK";
  for (const pagina of paginas) {
    it(`${pagina} lleva GTM arriba del <head>, el consentimiento antes y el noscript tras <body>`, () => {
      const html = readFileSync(pagina, "utf8");
      const cabeza = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));
      const consentimiento = cabeza.indexOf("gtag('consent','default'");
      const gtm = cabeza.indexOf(`'dataLayer','${GTM}'`);
      assert.ok(consentimiento > 0 && gtm > consentimiento, "consentimiento antes de GTM");
      assert.ok(gtm < cabeza.indexOf("<meta charset"), "GTM lo más arriba posible");
      const cuerpo = html.slice(html.indexOf("<body>"));
      assert.match(cuerpo, new RegExp(String.raw`^<body>\s*<!-- Google Tag Manager \(noscript\) -->\s*<noscript><iframe src="https://www\.googletagmanager\.com/ns\.html\?id=${GTM}"`));
      assert.equal(html.split(GTM).length - 1, 2);
    });
  }

  it("el generador de páginas lo incluye", () => {
    assert.equal(readFileSync("generador/generar.py", "utf8").split(GTM).length - 1, 2);
  });

  const consentimientoInicial = (guardado) => {
    const llamadas = [];
    const cabeza = readFileSync("index.html", "utf8");
    const script = cabeza.match(/<script>(window\.dataLayer[^<]*)<\/script>/)[1];
    const ventana = { localStorage: { getItem: () => guardado } };
    ventana.window = ventana;
    vm.runInNewContext(script, ventana);
    for (const args of ventana.dataLayer) llamadas.push([...args]);
    return llamadas;
  };

  it("sin elección, Google arranca con todo denegado", () => {
    const [[tipo, modo, valores]] = consentimientoInicial(null);
    assert.equal(`${tipo}/${modo}`, "consent/default");
    for (const k of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) assert.equal(valores[k], "denied");
  });

  it("si rechazó, sigue denegado; si aceptó, concedido", () => {
    assert.equal(consentimientoInicial("rejected")[0][2].analytics_storage, "denied");
    assert.equal(consentimientoInicial("accepted")[0][2].ad_storage, "granted");
  });

  it("los avisos de cookies tienen Aceptar y Rechazar", () => {
    for (const pagina of paginas) {
      const html = readFileSync(pagina, "utf8");
      if (!html.includes('id="cookie-banner"')) continue;
      assert.ok(html.includes('id="accept-cookies"') && html.includes('id="reject-cookies"'), pagina);
      assert.ok(!html.includes("no usa cookies de publicidad ni de seguimiento"), pagina);
    }
  });
});
