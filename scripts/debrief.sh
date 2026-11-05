#!/usr/bin/env bash
# Génère le message du débrief hebdomadaire (affiché sur la sortie standard).
# Utilise la CLI gh (identifiée en local, ou via GH_TOKEN dans GitHub Actions).
# Test en local, sans rien envoyer : bash scripts/debrief.sh
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-zaderlyl/piscine}"
JOURS_PR=7       # PR sans relecture depuis plus de 7 jours (voir CONTRIBUTING.md)
JOURS_ISSUE=14   # issue assignée sans nouvelle depuis plus de 14 jours

# Fonctions jq : âge en jours et ligne de liste avec lien sans aperçu
JQ_DEF='
  def jours: ((now - (. | fromdateiso8601)) / 86400 | floor);
  def ligne(date): "- [#\(.number) \(.title)](<\(.url)>) · \(date | jours) j";
'

prs=$(gh pr list --repo "$REPO" --state open --limit 100 \
  --json number,title,url,author,createdAt,isDraft,reviewDecision)
issues=$(gh issue list --repo "$REPO" --state open --limit 100 \
  --json number,title,url,assignees,updatedAt,labels)
fusionnees=$(gh pr list --repo "$REPO" --state merged --limit 50 \
  --json number,title,url,mergedAt)

attente=$(jq -r --argjson j "$JOURS_PR" "$JQ_DEF"'
  .[] | select(.isDraft | not)
      | select(.reviewDecision != "APPROVED")
      | select((.createdAt | jours) > $j)
      | ligne(.createdAt) + " (par \(.author.login))"' <<<"$prs")

silence=$(jq -r --argjson j "$JOURS_ISSUE" "$JQ_DEF"'
  .[] | select(.assignees | length > 0)
      | select((.updatedAt | jours) > $j)
      | ligne(.updatedAt) + " (" + ([.assignees[].login] | join(", ")) + ")"' <<<"$issues")

bloquees=$(jq -r "$JQ_DEF"'
  .[] | select([.labels[].name] | index("statut: bloquée"))
      | ligne(.updatedAt)' <<<"$issues")

MAX_FUSION=8
fusion=$(jq -r --argjson max "$MAX_FUSION" "$JQ_DEF"'
  [.[] | select((.mergedAt | jours) <= 7)] as $liste
  | ($liste[:$max][] | "- [#\(.number) \(.title)](<\(.url)>)"),
    (if ($liste | length) > $max then "- … et \(($liste | length) - $max) autres" else empty end)' <<<"$fusionnees")

section() { # section "titre" "contenu"
  if [ -n "$2" ]; then printf '\n**%s**\n%s\n' "$1" "$2"; fi
}

message=$(
  printf '📋 **Débrief Piscine**\n'
  section "⏳ PR en attente de relecture (+${JOURS_PR} j)" "$attente"
  section "💤 Issues sans nouvelle (+${JOURS_ISSUE} j) : à libérer ou à relancer" "$silence"
  section "🚧 Issues bloquées" "$bloquees"
  section "✅ Fusionné cette semaine" "$fusion"
  if [ -z "$attente$silence$bloquees$fusion" ]; then
    printf '\nRien à signaler cette semaine.\n'
  fi
  printf '\n🔗 Tableau : https://github.com/users/zaderlyl/projects/4\n'
)

# Discord refuse les messages de plus de 2000 caractères : on coupe à la fin d'une ligne
if [ "${#message}" -gt 1900 ]; then
  message="${message:0:1880}"
  message="${message%$'\n'*}"$'\n…(message tronqué)'
fi
printf '%s\n' "$message"
