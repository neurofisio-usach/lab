# Laboratorio de Neurofisiología — Website

Static site for the Laboratorio de Neurofisiología (Dr. Patricio Rojas), Universidad de Santiago de Chile. Plain HTML/CSS/JS — no build step required. Custom domain: neurofisio-usach.cl (see CNAME file).

## Structure (Spanish is now the default/root language)

```
index.html              Home (Spanish)
about.html               About / PI (Spanish — linked only from Team page, not in nav)
epilepsy.html             Research line: Epilepsy (Spanish)
autism.html               Research line: Autism (Spanish)
publications.html         Publications (Spanish)
team.html                  Team (Spanish)
recursos.html              Resources for general public (Spanish)
contact.html                Contact / Join us (Spanish)
styles.css                  Shared stylesheet
script.js                   Mobile nav toggle
CNAME                       Custom domain config (neurofisio-usach.cl)

en/                        English version (same page set)
  index.html, about.html, epilepsy.html, autism.html,
  publications.html, team.html, resources.html, contact.html,
  schizophrenia.html        (orphaned — not linked from nav)

resources/                 Shared interactive resource pages (self-contained,
                            no dependency on styles.css/script.js), linked from
                            recursos.html (ES) and resources.html (EN):
  simulador_eeg_crisis.html            Main interactive seizure simulator w/ game
  simulador_eeg_crisis_sin_juego.html  Same simulator, no game mode
  red_neuronal_espontanea.html         Spontaneous seizure network sim
  red_neuronal_200.html                Spontaneous seizure sim (hippocampal onset)
  balance_ei_sensorial.html            Sensory noise / E-I balance sim
  conectividad_local_global.html       Local vs global connectivity sim
  paisaje_susceptibilidad.html         Seizure-susceptibility landscape sim
  fiabilidad_ensayo_a_ensayo.html      Trial-to-trial reliability sim
  simulador-crisis-focal_first.html    Original simulator version (orphaned, kept as backup)
  circuito_unificado_PV_SST.html       (orphaned — not currently linked from either resources page)
```

## Publish with GitHub Pages

Upload everything (including `en/` and `resources/`) to the repo root, keeping the structure exactly as it is here. GitHub Pages settings should already be configured (Settings → Pages → Deploy from branch → main → / root). Since a custom domain (CNAME) is set up, the site should be reachable at **https://neurofisio-usach.cl/** once DNS is configured, alongside the default `https://neurofisio-usach.github.io/lab/` URL.

- Spanish (default): `https://neurofisio-usach.cl/`
- English: `https://neurofisio-usach.cl/en/`

## Editing content later

Each page is a self-contained HTML file — there's no templating system, so the navigation menu and footer are repeated at the top/bottom of every page, in **both** languages. If you add, rename, or reorder a nav item, update it in all 15 live files (7 shared pages × 2 languages, plus recursos.html/resources.html which are asymmetrically named).

**Path depth matters:** root-level Spanish pages reference `styles.css`, `script.js`, and `resources/...` directly. English pages inside `en/` need `../` prefixes for all of those (`../styles.css`, `../resources/...`).

**The EN/ES toggle** in the nav links each page to its exact translated counterpart. Note the one naming exception: the Spanish resources page is named `recursos.html` (not `resources.html`) to match its language, while the English version keeps `resources.html`. If you rename any other file, remember to update its pair's toggle link too.

**Adding a new resource simulator:** drop the new self-contained HTML file into `resources/`, then add a card (or edit the existing template comment) in `recursos.html` and/or `resources.html` linking to it — remember the relative path differs (`resources/...` from root, `../resources/...` from `en/`).

## Known placeholders / follow-ups

- Team member details for alumni without a listed institution (Paulina Hardy, Patricia González, Enrique Lorca) are left as name-only.
- No lab photos are included yet.
- `circuito_unificado_PV_SST.html` and `simulador-crisis-focal_first.html` exist in `resources/` but aren't currently linked from either language's Recursos/Resources page — link them if you want them live, or leave them as-is.
- The English Resources page (`en/resources.html`) only has 1 of the 8 resource cards that the Spanish page has — the other 7 interactive simulators are Spanish-only content, so they weren't duplicated into English. Translate and add them there if you want full parity.
- Publications list keeps original English paper titles/journal names in both language versions (only headers/labels are translated).
