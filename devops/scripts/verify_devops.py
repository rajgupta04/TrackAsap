#!/usr/bin/env python3
"""Verify TrackAsap DevOps configs: YAML, JSON, Nagios CFGs, Puppet manifests, and Docker Compose."""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
ERRORS = []


def ok(msg):
    print(f"[PASS] {msg}")


def fail(msg):
    print(f"[FAIL] {msg}")
    ERRORS.append(msg)


def validate_yaml_files():
    yaml_dirs = [
        ROOT / "devops",
        ROOT / ".github" / "workflows",
    ]
    files = [
        ROOT / "docker-compose.yml",
        ROOT / "docker-compose.monitoring.yml",
        ROOT / "docker" / "docker-compose.yml",
        ROOT / "jenkins" / "docker-compose.yml",
    ]
    for d in yaml_dirs:
        if d.exists():
            files.extend(d.rglob("*.yml"))
            files.extend(d.rglob("*.yaml"))

    for f in sorted(set(files)):
        try:
            with open(f, "r", encoding="utf-8") as fh:
                list(yaml.safe_load_all(fh))
            ok(f"YAML valid: {f.relative_to(ROOT)}")
        except Exception as exc:
            fail(f"YAML error in {f.relative_to(ROOT)}: {exc}")


def validate_json_files():
    files = list((ROOT / "devops").rglob("*.json"))
    for f in sorted(files):
        try:
            with open(f, "r", encoding="utf-8") as fh:
                json.load(fh)
            ok(f"JSON valid: {f.relative_to(ROOT)}")
        except Exception as exc:
            fail(f"JSON error in {f.relative_to(ROOT)}: {exc}")


def validate_nagios_cfgs():
    cfg_files = list((ROOT / "devops" / "nagios").rglob("*.cfg"))
    for f in sorted(cfg_files):
        text = f.read_text(encoding="utf-8")
        opens = text.count("{")
        closes = text.count("}")
        if opens == 0 or opens != closes:
            fail(f"Nagios brace mismatch in {f.relative_to(ROOT)} ({{={opens}, }}={closes})")
        elif not re.search(r"define\s+(host|service|command|contact)\s*\{", text):
            fail(f"Nagios missing define block in {f.relative_to(ROOT)}")
        else:
            ok(f"Nagios config valid: {f.relative_to(ROOT)} ({opens} blocks)")


def validate_puppet_files():
    pp_files = list((ROOT / "devops" / "puppet").rglob("*.pp"))
    for f in sorted(pp_files):
        text = f.read_text(encoding="utf-8")
        # Strip heredoc block before simple brace count if needed; check balanced braces
        opens = text.count("{")
        closes = text.count("}")
        if opens == 0 or opens != closes:
            fail(f"Puppet brace mismatch in {f.relative_to(ROOT)} ({{={opens}, }}={closes})")
        else:
            ok(f"Puppet manifest valid: {f.relative_to(ROOT)} ({opens} blocks)")


def validate_docker_compose():
    compose_files = [
        ROOT / "docker-compose.yml",
        ROOT / "docker-compose.monitoring.yml",
        ROOT / "docker" / "docker-compose.yml",
        ROOT / "jenkins" / "docker-compose.yml",
    ]
    for f in compose_files:
        proc = subprocess.run(
            ["docker", "compose", "-f", str(f), "config", "--quiet"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
        )
        if proc.returncode == 0:
            ok(f"docker compose config valid: {f.relative_to(ROOT)}")
        else:
            fail(f"docker compose config failed for {f.relative_to(ROOT)}: {proc.stderr.strip()}")


def validate_dockerignore():
    fe_ignore = (ROOT / "frontend" / ".dockerignore").read_text(encoding="utf-8").splitlines()
    if any(line.strip() == "nginx.conf" for line in fe_ignore):
        fail("frontend/.dockerignore excludes nginx.conf required by frontend/Dockerfile")
    else:
        ok("frontend/.dockerignore includes nginx.conf cleanly")


if __name__ == "__main__":
    validate_yaml_files()
    validate_json_files()
    validate_nagios_cfgs()
    validate_puppet_files()
    validate_docker_compose()
    validate_dockerignore()

    if ERRORS:
        print(f"\nVerification finished with {len(ERRORS)} error(s).")
        sys.exit(1)
    print("\nAll DevOps validations passed.")
