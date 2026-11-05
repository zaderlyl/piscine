#!/usr/bin/env bash
# Génère le débrief hebdomadaire : un message Discord (embed) en JSON, sur la sortie standard.
# Utilise la CLI gh (identifiée en local, ou via GH_TOKEN dans GitHub Actions).
# Aperçu en local, sans rien envoyer : bash scripts/debrief.sh | jq
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-zaderlyl/piscine}"
JOURS_PR=7       # PR sans relecture depuis plus de 7 jours (voir CONTRIBUTING.md)
JOURS_ISSUE=14   # issue assignée sans nouvelle depuis plus de 14 jours
MAX_FUSION=8     # nombre de PR fusionnées détaillées

prs=$(gh pr list --repo "$REPO" --state open --limit 100 \
  --json number,title,url,author,createdAt,isDraft,reviewDecision)
issues=$(gh issue list --repo "$REPO" --state open --limit 100 \
  --json number,title,url,assignees,updatedAt,labels)
fusionnees=$(gh pr list --repo "$REPO" --state merged --limit 50 \
  --json number,title,url,mergedAt)

jq -n \
  --argjson prs "$prs" --argjson issues "$issues" --argjson fusionnees "$fusionnees" \
  --arg repo "$REPO" \
  --argjson jpr "$JOURS_PR" --argjson jis "$JOURS_ISSUE" --argjson max "$MAX_FUSION" '
  def jours: ((now - (. | fromdateiso8601)) / 86400 | floor);
  def lien: "[#\(.number) \(.title)](<\(.url)>)";
  # un champ Discord ne dépasse pas 1024 caractères : on coupe à la fin d une ligne
  def borne: if length > 1000 then .[:1000] | sub("\n[^\n]*$"; "") + "\n…" else . end;
  def champ($nom; $lignes):
    if ($lignes | length) == 0 then empty
    else {name: $nom, value: ($lignes | join("\n") | borne), inline: false} end;
  def etat:
    if .isDraft then "brouillon"
    elif .reviewDecision == "APPROVED" then "approuvée"
    elif .reviewDecision == "CHANGES_REQUESTED" then "modifications demandées"
    elif (.createdAt | jours) > $jpr then "relecture à relancer"
    else "en attente de relecture" end;

  ($fusionnees | map(select((.mergedAt | jours) <= 7))) as $recentes
  | ($issues | map(select(.assignees | length == 0)) | length) as $sansAssigne
  | ($issues | map(.assignees[].login) | group_by(.) | map("\(.[0]) : \(length)")) as $parPersonne
  | {
      username: "Piscine",
      allowed_mentions: {parse: []},
      embeds: [{
        title: "Débrief hebdomadaire",
        url: "https://github.com/\($repo)",
        color: 616922,
        description: "Situation au \(now | strftime("%d/%m/%Y")) : \($prs | length) pull requests ouvertes, \($issues | length) issues ouvertes, \($recentes | length) pull requests fusionnées sur 7 jours.",
        fields: [
          champ("Pull requests ouvertes";
            $prs | map("\(lien) · \(.author.login) · \(.createdAt | jours) j · \(etat)")),
          champ("Issues sans activité depuis plus de \($jis) jours";
            $issues
            | map(select((.assignees | length > 0) and ((.updatedAt | jours) > $jis))
                  | "\(lien) · \(.assignees | map(.login) | join(", ")) · \(.updatedAt | jours) j")),
          champ("Issues bloquées";
            $issues | map(select([.labels[].name] | index("statut: bloquée")) | lien)),
          champ("Fusionnées ces 7 derniers jours";
            ($recentes[:$max] | map(lien))
            + (if ($recentes | length) > $max then ["et \(($recentes | length) - $max) autres"] else [] end)),
          {name: "Répartition des issues ouvertes",
           value: (($parPersonne + (if $sansAssigne > 0 then ["non assignées : \($sansAssigne)"] else [] end)) | join("  ·  ")),
           inline: false}
        ],
        footer: {text: "\($repo) · débrief automatique"},
        timestamp: (now | todate)
      }]
    }'
