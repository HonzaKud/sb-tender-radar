# S&B Tender Radar

Veřejný český dashboard obchodních příležitostí pro:

- malorážové střelivo,
- speciální a cvičné střelivo,
- komponenty střeliva.

Web je statický, běží bez databázového serveru a načítá data z data/tenders.json. Je určen pouze ke čtení; každý záznam obsahuje odkaz na veřejný zdroj.

## Ochrana kvality dat

Datový formát je definován v data/tenders.schema.json a kontrolován skriptem scripts/validate-data.mjs. GitHub Pages se publikuje pouze tehdy, když validace projde. Chybná aktualizace proto nenahradí poslední funkční web.

Každý automatický běh se musí řídit souborem AUTOMATION_PROMPT.md a smí upravovat pouze data/tenders.json.

## Provoz

- Web: https://honzakud.github.io/sb-tender-radar/
- Data: https://honzakud.github.io/sb-tender-radar/data/tenders.json
- Kontrola: každý den v 8:00 v časové zóně Europe/Prague
- Historický záběr: tři roky
- Geografie: celý svět

## Důležité

Radar pracuje s veřejnými informačními zdroji. Zobrazené shrnutí nenahrazuje zadávací dokumentaci. Před obchodním rozhodnutím je vždy nutné otevřít původní oznámení a ověřit aktuální podmínky, exportní pravidla a způsobilost dodavatele.
