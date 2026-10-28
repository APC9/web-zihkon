// Pruebas del contador de visitas de Metricool. Ejecutar: node --test pruebas/
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
