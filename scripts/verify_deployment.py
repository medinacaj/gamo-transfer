"""Verify that the public GitHub Pages build is the expected commit.

Usage: python3 scripts/verify_deployment.py URL SHA
Requires only Python standard library; exits non-zero on stale deployment.
"""
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

ASSETS = ("styles.css", "domain.js", "ui-preferences.js",
          "agency-reports.js", "app.js")
ATTEMPTS = 12


def fetch(base, path, revision, attempt):
    # Unique verification query avoids stale intermediate HTML cache responses.
    suffix = f"verify={quote(revision)}-{attempt}"
    sep = "&" if "?" in path else "?"
    url = urljoin(base, path) + sep + suffix
    req = Request(url, headers={
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "User-Agent": "GamoTransfer-DeployCheck/1.0",
    })
    with urlopen(req, timeout=15) as response:
        body = response.read().decode("utf-8", errors="replace")
        return body, response.status


def verify(base, sha, attempt):
    revision = sha[:12]
    build, _ = fetch(base, "build-info.txt", revision, attempt)
    if build.strip() != f"commit={sha}":
        raise ValueError(
            "El commit publicado no coincide: "
            f"esperado {sha}, encontrado {build.strip()[:100]}"
        )
    html, _ = fetch(base, "index.html", revision, attempt)
    for asset in ASSETS:
        expected = f'{asset}?v={revision}'
        if not re.search(rf'(?<=["\x27]){re.escape(expected)}(?=["\x27])', html):
            raise ValueError(f"El HTML publicado no referencia {expected}")
    # Fetching the assets verifies they can be retrieved by the actual URLs.
    for asset in ("styles.css", "app.js"):
        body, _ = fetch(base, f"{asset}?v={revision}", revision, attempt)
        if len(body) < 200:
            raise ValueError(f"El archivo {asset} parece incompleto")
    return revision


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Uso: verify_deployment.py URL SHA")
    base, sha = sys.argv[1].rstrip("/") + "/", sys.argv[2].strip()
    if not base.startswith("https://") or not re.fullmatch(r"[a-fA-F0-9]{40}", sha):
        raise SystemExit("Se requiere URL https y SHA completo de 40 caracteres")
    for attempt in range(1, ATTEMPTS + 1):
        try:
            revision = verify(base, sha, attempt)
            print(f"Verificado: Pages publica commit {sha} con recursos v={revision}")
            return
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            print(f"Verificación {attempt}/{ATTEMPTS}: {exc}", flush=True)
            if attempt < ATTEMPTS:
                time.sleep(8)
    raise SystemExit("El sitio público no refleja este despliegue de Pages")


if __name__ == "__main__":
    main()
