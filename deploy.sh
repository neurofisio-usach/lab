#!/bin/bash
# deploy.sh — sube todos los cambios del sitio del laboratorio a GitHub
# Uso:  ./deploy.sh                  (pide mensaje interactivo)
#       ./deploy.sh "tu mensaje"     (mensaje directo)
# Puede ejecutarse desde cualquier carpeta.

set -euo pipefail

REPO_DIR="/home/pato/PATO/USACH/lab_webpage"
REMOTE="origin"
BRANCH="main"
SITE_URL="https://neurofisio-usach.cl/"

# ── Ir al repo ────────────────────────────────────────────
if ! cd "$REPO_DIR" 2>/dev/null; then
  echo "❌  No se encontró la carpeta $REPO_DIR"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "❌  $REPO_DIR no es un repositorio git."
  exit 1
fi

# ── Verificar estado del repo ─────────────────────────────
if [ -d "$(git rev-parse --git-path rebase-merge)" ] \
   || [ -d "$(git rev-parse --git-path rebase-apply)" ]; then
  echo "❌  Hay un rebase sin terminar. Resuélvelo primero:"
  echo "    git status            (ver archivos en conflicto)"
  echo "    git rebase --continue (tras resolver)  o  git rebase --abort"
  exit 1
fi

CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" != "$BRANCH" ]; then
  echo "❌  Estás en la rama '$CURRENT', no en '$BRANCH'."
  echo "    Cambia con: git switch $BRANCH"
  exit 1
fi

# ── Detectar cambios locales y commits sin subir ──────────
HAS_CHANGES=0
if ! git diff --quiet || ! git diff --cached --quiet \
   || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  HAS_CHANGES=1
fi

echo "Consultando repositorio remoto..."
git fetch "$REMOTE" "$BRANCH" --quiet
AHEAD=$(git rev-list --count "$REMOTE/$BRANCH"..HEAD)

if [ "$HAS_CHANGES" -eq 0 ] && [ "$AHEAD" -eq 0 ]; then
  echo "✓  Sin cambios — el repositorio está al día."
  exit 0
fi

# ── Commit de cambios locales ─────────────────────────────
if [ "$HAS_CHANGES" -eq 1 ]; then
  echo ""
  echo "Cambios detectados:"
  echo "───────────────────────────────────────────────"
  git status --short
  echo "───────────────────────────────────────────────"
  echo ""

  if [ -n "${1:-}" ]; then
    MSG="$1"
  else
    read -rp "Mensaje de commit [Enter = fecha/hora automática]: " MSG
    [ -z "$MSG" ] && MSG="Actualización $(date '+%Y-%m-%d %H:%M')"
  fi

  git add -A
  git commit -m "$MSG"
else
  echo "→ Sin cambios nuevos, pero hay $AHEAD commit(s) local(es) sin subir."
fi

# ── Sincronizar con remoto ────────────────────────────────
echo ""
echo "Sincronizando con $REMOTE/$BRANCH..."
if ! git pull --rebase "$REMOTE" "$BRANCH"; then
  git rebase --abort 2>/dev/null || true
  echo ""
  echo "❌  Conflicto con cambios del remoto (alguien editó los mismos archivos)."
  echo "    Tu commit quedó guardado localmente; nada se perdió."
  echo "    Para resolver a mano:"
  echo "      git pull --rebase $REMOTE $BRANCH"
  echo "      (edita los archivos en conflicto, luego)"
  echo "      git add <archivos> && git rebase --continue"
  echo "      ./deploy.sh"
  exit 1
fi

# ── Push ──────────────────────────────────────────────────
echo "Subiendo cambios..."
git push "$REMOTE" "$BRANCH"

echo ""
echo "───────────────────────────────────────────────"
echo "✓  Publicado en: $SITE_URL"
echo "   (el sitio puede tardar 1–2 min en actualizarse)"
echo "───────────────────────────────────────────────"
