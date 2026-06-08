#!/bin/bash
set -euo pipefail

# ------------------------------------------------------------------
# check-env.sh - Validate .env files against env-manifest.json
#
# Checks that all expected variables exist in their target .env files.
# Returns exit code 1 if any are missing (useful for CI).
# ------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MANIFEST="$ROOT_DIR/env-manifest.json"

if ! command -v jq &>/dev/null; then
  echo "Error: jq is required. Install: sudo apt install jq"
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "Error: env-manifest.json not found at $MANIFEST"
  exit 1
fi

echo "Checking environment files against manifest..."
echo ""

ERRORS=0
WARNINGS=0

mapfile -t TARGET_FILES < <(
  jq -r '.variables[].targets[]' "$MANIFEST" | sort -u
)

for target in "${TARGET_FILES[@]}"; do
  target_path="$ROOT_DIR/$target"

  if [ ! -f "$target_path" ]; then
    echo "MISSING: $target (file does not exist)"
    echo "  Run ./setup.sh to create it."
    ((ERRORS++))
    continue
  fi

  var_count=$(jq -r --arg t "$target" \
    '[.variables[] | select(.targets[] == $t)] | length' "$MANIFEST")

  missing_vars=()
  for i in $(seq 0 $((var_count - 1))); do
    key=$(jq -r --arg t "$target" --argjson i "$i" \
      '[.variables[] | select(.targets[] == $t)][$i].key' "$MANIFEST")
    required=$(jq -r --arg t "$target" --argjson i "$i" \
      '[.variables[] | select(.targets[] == $t)][$i].required // false' "$MANIFEST")

    if ! grep -qE "^${key}=" "$target_path" 2>/dev/null; then
      missing_vars+=("$key")
      if [ "$required" = "true" ]; then
        ((ERRORS++))
      else
        ((WARNINGS++))
      fi
    fi
  done

  if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "  OK: $target"
  else
    echo "  DRIFT: $target"
    for var in "${missing_vars[@]}"; do
      default_val=$(jq -r --arg k "$var" \
        '.variables[] | select(.key == $k) | .default // ""' "$MANIFEST" | head -1)
      required=$(jq -r --arg k "$var" \
        '.variables[] | select(.key == $k) | .required // false' "$MANIFEST" | head -1)
      if [ "$required" = "true" ]; then
        echo "    MISSING (required): $var"
      else
        echo "    MISSING: $var (default: ${default_val:-<empty>})"
      fi
    done
  fi
done

echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo "Found $ERRORS error(s) and $WARNINGS warning(s)."
  echo "Run ./setup.sh to fix missing variables."
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo "Found $WARNINGS warning(s). Run ./setup.sh to add missing variables."
  exit 0
else
  echo "All environment files are in sync with manifest."
  exit 0
fi
