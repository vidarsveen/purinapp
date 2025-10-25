# Purin Database App

En mobiloptimalisert web-app for å søke og bla gjennom purininnhold i matvarer.

## Funksjoner

- 🔍 **Søk** etter matvarer
- 📂 **Bla gjennom kategorier** (kjøtt, fisk, grønnsaker, osv.)
- 📊 **Visuell presentasjon** med bar charts og fargekoding
- ⚖️ **Vektet risikoscore** basert på uricogen effekt
- 📱 **Mobiloptimalisert** design

## Bruk

Åpne `index.html` i nettleseren. Appen er en single-page application som ikke krever server.

## Data

- `purine_data.json` - Purininnhold i 342 matvarer
- `translations.json` - Oversettelser (norsk/engelsk)
- `uricogenic_weighting.md` - Dokumentasjon av beregningsmetode

## Beregning av risikoscore

Vektet uricogen score = 1.0 × Hypoxantin + 0.6 × Adenin + 0.1 × Guanin + 0.1 × Xantin

Risikoscore = Vektet score / 300

## GitHub Pages

Besøk appen på: https://vidarsveen.github.io/purinapp/
