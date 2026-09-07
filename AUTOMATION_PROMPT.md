# Denní aktualizace dat – závazný postup AI

Tento dokument je provozní smlouva pro každý automatický běh. AI nesmí měnit strukturu dat podle vlastního uvážení.

## Rozsah

- Geografie: celý svět.
- Zadavatelé: armády, ministerstva obrany, policie, bezpečnostní složky, mezinárodní organizace a ostatní veřejní zadavatelé.
- Produkty: malorážové střelivo; speciální a cvičné střelivo; komponenty střeliva.
- Historie: aktivní a plánované příležitosti plus relevantní uzavřené zakázky za poslední tři roky.
- Veřejná data: nikdy nezapisovat interní poznámky, obchodní strategii, kapacity, osobní údaje nad rámec veřejného oznámení, přihlašovací údaje ani neveřejné know-how.

## Každý běh

1. Načti existující data/tenders.json a data/tenders.schema.json.
2. Prohledej přednostně primární veřejné zdroje: TED, národní zadávací portály, SAM.gov, UNGM, EDA, NSPA/NCIA, OCCAR a další oficiální portály.
3. U sekundárního zdroje se pokus najít primární oznámení. Pokud se to nepodaří, označ to v poli verification a nespekuluj.
4. Porovnej výsledky podle stabilního ID, čísla oznámení a zdrojové URL.
5. Přidej nové záznamy, aktualizuj změněné a zachovej relevantní historii. Nikdy bez důvodu nemaž staré záznamy.
6. Nastav isNew=true pouze při prvním nalezení. U existujícího záznamu jej po sedmi dnech změň na false.
7. Do changedFields zapisuj pouze skutečně ověřené změny proti předchozí verzi.
8. Aktualizuj lastChecked a generatedAt.
9. Před zápisem zkontroluj povinná pole, enum hodnoty, ISO data, měnu, rozsah relevance 0–100, unikátní ID a HTTPS odkazy.
10. Pokud data neprojdou validací, nic nezapisuj. Zachovej poslední funkční verzi a popiš chybu uživateli.

## Skóre relevance

- Produktová shoda: 0–30 bodů.
- Typ a význam zadavatele: 0–15 bodů.
- Stav a časová použitelnost: 0–15 bodů.
- Hodnota nebo objem: 0–10 bodů.
- Geografie a reálnost účasti: 0–10 bodů.
- Dostupnost dokumentace: 0–10 bodů.
- Kvalita a ověření zdroje: 0–10 bodů.

Nezaokrouhluj automaticky na desítky. V managementNote vysvětli, co má obchod udělat nebo sledovat; nezapisuj interní rozhodnutí firmy.

## Zápis

Měň pouze data/tenders.json. Neměň web, schéma, workflow ani tento dokument. Commit pojmenuj ve formátu:

Aktualizace tendrů YYYY-MM-DD: X nových, Y změn
