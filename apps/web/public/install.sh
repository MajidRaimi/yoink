#!/usr/bin/env bash
set -euo pipefail

REPO="MajidRaimi/yoink"
BIN_NAME="yoink"

info() { printf '\033[0;33m==>\033[0m %s\n' "$1"; }
err() { printf '\033[0;31merror:\033[0m %s\n' "$1" >&2; exit 1; }

[ "$(uname -s)" = "Darwin" ] || err "yoink runs on macOS only."

case "$(uname -m)" in
  arm64) ARCH="darwin-arm64" ;;
  x86_64) ARCH="darwin-x64" ;;
  *) err "unsupported architecture: $(uname -m)" ;;
esac

VERSION="${YOINK_VERSION:-}"
if [ -z "$VERSION" ]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | head -1 | cut -d'"' -f4)"
fi
[ -n "$VERSION" ] || err "could not resolve the latest yoink version."

ASSET="yoink-${ARCH}"
BASE="https://github.com/${REPO}/releases/download/${VERSION}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

info "downloading yoink ${VERSION} (${ARCH})"
curl -fsSL "${BASE}/${ASSET}" -o "${TMP}/${BIN_NAME}" || err "download failed: ${BASE}/${ASSET}"

if curl -fsSL "${BASE}/checksums.txt" -o "${TMP}/checksums.txt" 2>/dev/null; then
  EXPECTED="$(grep " ${ASSET}\$" "${TMP}/checksums.txt" | awk '{print $1}')"
  if [ -n "$EXPECTED" ]; then
    ACTUAL="$(shasum -a 256 "${TMP}/${BIN_NAME}" | awk '{print $1}')"
    [ "$EXPECTED" = "$ACTUAL" ] || err "checksum mismatch for ${ASSET}"
    info "checksum verified"
  fi
fi

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
  *) info "add ${DEST} to your PATH:  echo 'export PATH=\"${DEST}:\$PATH\"' >> ~/.zshrc && source ~/.zshrc" ;;
esac

info "run 'yoink add' to register your first account"
"${DEST}/${BIN_NAME}" version || true
