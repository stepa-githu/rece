import assert from "node:assert/strict";
import test from "node:test";

const receDescriptionMeta =
  /<meta(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["']Raccogli le recensioni della tua struttura e prepara risposte coerenti con la tua identità\.["'])[^>]*>/i;

test("renders Rece metadata after the role-aware redirect", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const env = {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
  const context = {
    waitUntil() {},
    passThroughOnException() {},
  };

  let request = new Request("http://localhost/", {
    headers: { accept: "text/html" },
  });
  let response = await worker.fetch(request, env, context);

  for (let redirects = 0; redirects < 3 && response.status >= 300 && response.status < 400; redirects += 1) {
    const location = response.headers.get("location");
    assert.ok(location, "Redirect without a Location header");
    request = new Request(new URL(location, request.url), {
      headers: { accept: "text/html" },
    });
    response = await worker.fetch(request, env, context);
  }

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>Panoramica · Rece<\/title>/i);
  assert.match(html, receDescriptionMeta);
});
