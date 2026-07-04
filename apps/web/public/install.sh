#!/usr/bin/env bash
set -euo pipefail

REPO="MajidRaimi/yoink"
BIN_NAME="yoink"

info() { printf '\033[0;33m==>\033[0m %s\n' "$1"; }
err() { printf '\033[0;31merror:\033[0m %s\n' "$1" >&2; exit 1; }

case "$(uname -s)" in
  Darwin) OS="darwin" ;;
  Linux) OS="linux" ;;
  *) err "unsupported platform: $(uname -s). on Windows, run: powershell -c \"irm https://yoink.codes/install.ps1 | iex\"" ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) ARCH="${OS}-arm64" ;;
  x86_64 | amd64) ARCH="${OS}-x64" ;;
  *) err "unsupported architecture: $(uname -m)" ;;
esac

VERSION="${YOINK_VERSION:-}"
if [ -z "$VERSION" ]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases" | grep '"tag_name"' | cut -d'"' -f4 | grep -v '^desktop-' | grep -E '^v[0-9]' | head -1 || true)"
fi
[ -n "$VERSION" ] || err "could not resolve the latest yoink version."

ASSET="yoink-${ARCH}.tar.gz"
BASE="https://github.com/${REPO}/releases/download/${VERSION}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

info "downloading yoink ${VERSION} (${ARCH})"
curl -fL --progress-bar --retry 3 --retry-delay 2 --connect-timeout 30 "${BASE}/${ASSET}" -o "${TMP}/${ASSET}" \
  || err "download failed: ${BASE}/${ASSET}"

if curl -fsSL "${BASE}/checksums.txt" -o "${TMP}/checksums.txt" 2>/dev/null; then
  EXPECTED="$(grep " ${ASSET}\$" "${TMP}/checksums.txt" | awk '{print $1}' || true)"
  if [ -n "$EXPECTED" ]; then
    if command -v sha256sum >/dev/null 2>&1; then
      ACTUAL="$(sha256sum "${TMP}/${ASSET}" | awk '{print $1}')"
    else
      ACTUAL="$(shasum -a 256 "${TMP}/${ASSET}" | awk '{print $1}')"
    fi
    [ "$EXPECTED" = "$ACTUAL" ] || err "checksum mismatch for ${ASSET}"
    info "checksum verified"
  fi
fi

tar -xzf "${TMP}/${ASSET}" -C "${TMP}"
[ -f "${TMP}/${BIN_NAME}" ] || err "archive did not contain ${BIN_NAME}"
chmod +x "${TMP}/${BIN_NAME}"

if [ -w "/usr/local/bin" ]; then
  DEST="/usr/local/bin"
else
  DEST="${HOME}/.local/bin"
  mkdir -p "$DEST"
fi

mv "${TMP}/${BIN_NAME}" "${DEST}/${BIN_NAME}"
info "installed to ${DEST}/${BIN_NAME}"

case ":${PATH}:" in
  *":${DEST}:"*) ;;
  *)
    case "${SHELL:-}" in
      */zsh) RC="~/.zshrc" ;;
      */bash) RC="~/.bashrc" ;;
      *) RC="your shell profile" ;;
    esac
    info "add ${DEST} to your PATH:  echo 'export PATH=\"${DEST}:\$PATH\"' >> ${RC}"
    ;;
esac

info "run 'yoink add' to register your first account"
"${DEST}/${BIN_NAME}" version || true
