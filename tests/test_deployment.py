"""Offline tests for the GitHub Pages post-deployment verification."""
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "verify_deployment.py"
SPEC = importlib.util.spec_from_file_location("gamo_verify_deployment", SCRIPT)
VERIFY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VERIFY)
SHA = "a" * 40
REV = SHA[:12]
BASE = "https://example.test/gamo-transfer/"


def valid_html():
    return "\n".join(
        f'<script src="{name}?v={REV}"></script>' for name in VERIFY.ASSETS
    )


def response(build=f"commit={SHA}\n", html=None, size=250):
    def fake_fetch(base, path, revision, attempt):
        if path == "build-info.txt":
            return build, 200
        if path == "index.html":
            return valid_html() if html is None else html, 200
        return "x" * size, 200
    return fake_fetch


class DeploymentVerificationTests(unittest.TestCase):
    def test_exact_commit_and_versioned_assets_pass(self):
        with patch.object(VERIFY, "fetch", side_effect=response()):
            self.assertEqual(VERIFY.verify(BASE, SHA, 1), REV)

    def test_old_commit_is_rejected_even_if_assets_exist(self):
        with patch.object(VERIFY, "fetch", side_effect=response(build="commit=" + "b" * 40)):
            with self.assertRaisesRegex(ValueError, "no coincide"):
                VERIFY.verify(BASE, SHA, 1)

    def test_stale_js_reference_is_rejected(self):
        html = valid_html().replace(f"app.js?v={REV}", "app.js?v=stale")
        with patch.object(VERIFY, "fetch", side_effect=response(html=html)):
            with self.assertRaisesRegex(ValueError, "app.js"):
                VERIFY.verify(BASE, SHA, 1)

    def test_missing_asset_is_rejected(self):
        with patch.object(VERIFY, "fetch", side_effect=response(size=5)):
            with self.assertRaisesRegex(ValueError, "incompleto"):
                VERIFY.verify(BASE, SHA, 1)


if __name__ == "__main__":
    unittest.main()
