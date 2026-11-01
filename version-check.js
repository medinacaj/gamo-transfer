/* Actualización silenciosa de una versión obsoleta. No altera datos locales. */
(function (root, doc) {
  "use strict";
  const own = doc.querySelector('meta[name="gamo-build"]')?.content || "";
  // En desarrollo local no hay metadatos de un despliegue: no hacer nada.
  if (!/^[a-f0-9]{40}$/.test(own) || typeof root.fetch !== "function") return;

  const info = new URL("build-info.txt", doc.baseURI);
  info.searchParams.set("check", String(Date.now()));
  root.fetch(info.toString(), { cache: "no-store", credentials: "same-origin" })
    .then(response => response.ok ? response.text() : "")
    .then(body => {
      const remote = /^commit=([a-f0-9]{40})\s*$/m.exec(body)?.[1];
      if (!remote || remote === own) return;
      // Nunca descartar cambios que el usuario esté editando en un modal.
      if (doc.querySelector('#modal-root [role="dialog"]')) return;
      const url = new URL(root.location.href);
      const revision = remote.slice(0, 12);
      if (url.searchParams.get("gamo-build") === revision) return;
      // Un intento por versión y pestaña evita bucles con un CDN desactualizado.
      try {
        if (root.sessionStorage?.getItem("gamo.build-refresh.v1") === remote) return;
        root.sessionStorage?.setItem("gamo.build-refresh.v1", remote);
      } catch {}
      url.searchParams.set("gamo-build", revision);
      root.location.replace(url.toString()); // Conserva el hash y la ruta actual.
    })
    .catch(() => {}); // Un fallo de red nunca debe interrumpir el sitio.
})(window, document);
