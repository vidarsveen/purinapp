# Beregning av uricogen farescore basert på purinbaser

## Formål
Dette dokumentet forklarer hvordan man kan beregne en enkel, kvantitativ *farescore* for matvarer basert på de fire primære purinbasene: **adenin (A)**, **guanin (G)**, **hypoksantin (H)** og **xantin (X)**. Skalaen er ment som et praktisk verktøy for å rangere matvarers urinsyrefremmende potensial hos personer med urinsyregikt.

---

## Biokjemisk grunnlag
Alle purinbaser brytes ned til **urinsyre**, men med ulik hastighet og effektivitet:

- **Adenin** → hypoksantin → xantin → urinsyre  
- **Guanin** → xantin → urinsyre  
- **Hypoksantin** → xantin → urinsyre  
- **Xantin** → urinsyre

Forskjellene i uricogen effekt skyldes enzymaktivitet i disse trinnene:
- Hypoksantin er nærmest urinsyre og omdannes raskt av **xantinoksidase**.
- Adenin krever et ekstra deamineringssteg via **adenindeaminase**, som er tregere.
- Guanin og xantin er mindre effektive substrater for urinsyredannelse.

---

## Empirisk grunnlag for vekting
Flere metabolisme- og ernæringsstudier viser at **hypoksantin** gir den største økningen i serumurinsyre, etterfulgt av **adenin**, mens **guanin** og **xantin** har liten eller ingen effekt.

Kildene inkluderer:
- Sarwar, G. & Brulé, D. (1991). *Assessment of uricogenic potential of purine bases and nucleosides in humans.* **Advances in Experimental Medicine and Biology**, 309, 325–334.
- Clifford, A. J. et al. (1976). *Urinary excretion of purine derivatives in men fed purine bases, nucleosides, and nucleotides.* **The Journal of Nutrition**, 106(3), 435–442.
- ODS-NIH/USDA Purine Database, Release 2.0 (2024): *Tables 1–2, Notes on uricogenic potency of purine bases.*

Disse studiene viser at relativ økning i serumurinsyre (ΔSU) per mg inntatt base er omtrent:

| Base | Relativ uricogen effekt | Kildekommentar |
|------|--------------------------|----------------|
| Hypoksantin | 1.0 (referanse) | Rask omsetning til urinsyre |
| Adenin | 0.5–0.7 | Via hypoksantin; tregere enzymtrinn |
| Guanin | 0.0–0.2 | Svak respons i forsøk |
| Xantin | 0.0–0.2 | Nær sluttprodukt, lav netto effekt |

---

## Foreslåtte vekter
Basert på ovenstående settes vektene slik:

\[
H = 1.0, \quad A = 0.6, \quad G = 0.1, \quad X = 0.1
\]

Dette gir en **uricogen ekvivalent** per 100 g matvare:

\[
U_{eq} = 1.0H + 0.6A + 0.1G + 0.1X
\]

---

## Normalisering til farescore
For å uttrykke dette som en lettforståelig fareskala (0–1):

\[
\text{Farescore} = \frac{U_{eq}}{300}
\]

Der 300 mg/100 g representerer et omtrentlig nivå for *svært høy* total purinbelastning (f.eks. ansjos, lever). Verdier kan deretter fargekodes:

| Score | Farge | Tolkning |
|--------|--------|-----------|
| < 0.2 | 🟢 Lav | Trygt ved normalt inntak |
| 0.2–0.4 | 🟡 Moderat | Begrens hyppighet |
| 0.4–0.6 | 🟠 Høy | Reduser porsjoner |
| > 0.6 | 🔴 Svært høy | Unngå ved urinsyregikt |

---

## Antakelser og begrensninger
- Verdiene er beregnet for **rå vare (mg/100 g)**, da dette er standard i USDA-databasen.
- ND ("Not Detected") tolkes som 0.
- Vektene representerer **relative forskjeller** i urinsyredannende potens, ikke eksakte fysiologiske konstanter.
- Reelle nivåer avhenger også av porsjonsstørrelse, alkohol, fruktose og medikamentbruk.

---

**Kort sagt:** Hypoksantin driver mest urinsyredannelse; adenin har rundt 60 % av effekten, og guanin/xantin bidrar minimalt. Denne vektingen gir en praktisk fareskala for vurdering av purinrike matvarer i kosthold ved urinsyregikt.

