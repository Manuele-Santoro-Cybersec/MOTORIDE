# MOTORIDE — Project Brief & Roadmap

**Aggiornato al:** 12 agosto 2026
**Versione attuale:** v0.8.5 Alpha (web app, HTML/JS/localStorage, su Netlify)
**Prossimo obiettivo:** v0.9 nativa (React Native + Expo), testabile dal gruppo di amici entro fine settembre 2026, pronta per la stagione 2027 (marzo)

---

## Decisioni prese finora (per chi continua da qui, incluso Gemini)

- **Piattaforma**: React Native + Expo. Sviluppo su Parrot OS (Linux), test live su iPhone/Android tramite Expo Go.
- **Storage dati personali**: locale, offline-first (AsyncStorage, non localStorage). Niente server di terze parti per i dati privati dei giri.
- **Community/eventi**: Supabase, usato SOLO per eventi condivisi e RSVP — non per i dati personali dei giri, foto o documenti.
- **Database moto**: dataset curato a mano per il mercato UK. Il database NHTSA usato dai concorrenti (es. MotoVault) è americano e non copre marchi come Lexmoto — inutile per il nostro pubblico.
- **Navigazione — due livelli separati**:
  - *Livello 1 (dentro questa finestra, da settimana 4)*: mappa in-app con `react-native-maps`, routing tramite Google Directions API o motore open source (OSRM/GraphHopper), istruzioni vocali base con `expo-speech`. Funziona solo con connessione dati, niente offline — ma è vera navigazione dentro l'app, non un semplice deep-link.
  - *Livello 2 (fuori scope, dopo settembre)*: motore offline vero con ricalcolo senza segnale e tile caching automatico (Mapbox o simili) — resta rimandato, è il pezzo costoso e rischioso già discusso.
  - Il deep-link verso Waze/Google/Apple Maps resta comunque disponibile come opzione più affidabile finché il Livello 1 non è testato bene.
- **Comunicazione senza rete**: la strada tecnica individuata è Bridgefy SDK (Bluetooth mesh, testo/allerte peer-to-peer, non voce) — non è nello scope di questa finestra, ma è la direzione scelta per il futuro, utile anche per le segnalazioni pericoli.
- **SOS**: NON si costruisce un collegamento diretto ai soccorsi (112/999) — troppo rischio legale per un progetto hobby. Se implementato, sarà "rilevamento urto → notifica ai contatti di emergenza salvati", non un dispatch automatico.
- **Voice chat di gruppo**: NON si integra con i protocolli mesh proprietari di Cardo/Sena (non esiste un'API pubblica). Se costruito, sarà una chiamata VoIP di gruppo standard, che passa attraverso l'intercom del rider come farebbe una normale chiamata telefonica.
- **Distribuzione test**: solo gruppo di amici, via TestFlight (iOS) / APK diretto (Android) / Expo Go. Niente store pubblici per ora.
- **Versionamento**: git obbligatorio da subito. Ogni modifica è un commit, non più un file intero incollato da una chat.

---

## Setup — da fare subito, prima di scrivere una riga di app

Sul terminale di Parrot OS:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git curl build-essential -y

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

node -v && npm -v
```

Poi, account da creare (tutti gratuiti, ~10 minuti totali):

1. **GitHub** — dove vivrà la cronologia del progetto da oggi in poi
2. **Expo** (expo.dev) — per build e test su Expo Go
3. **Supabase** — non lo usi ancora (arriva in settimana 6), ma crealo ora, costa due minuti

**Collegare Gemini al tuo git già esistente**: la finestra di chat di Gemini che hai usato finora non può leggere né scrivere sul tuo filesystem — per questo finora incollavi file interi a mano, con tutte le regressioni che sai. Per collegarlo davvero al repository, lo strumento giusto oggi (agosto 2026) è **Antigravity CLI**: Google ha ritirato il vecchio Gemini CLI per gli account free/Pro/Ultra a giugno 2026, spostando tutto su Antigravity, che gira sullo stesso motore Gemini. Su Linux si installa così:

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

Lo lanci dentro la cartella del tuo repository git esistente, si autentica con lo stesso account Google del tuo abbonamento, e da lì legge il codice, propone modifiche coi permessi che imposti tu, ed esegue i commit da solo — niente più copia-incolla. Vista la tua esperienza in sicurezza, ti consiglio di lasciarlo in modalità "chiede conferma prima di ogni comando" finché non ti fidi, non in modalità automatica. Dettagli e comandi aggiornati: antigravity.google/docs/cli/overview

Poi installa **Expo Go** sul tuo iPhone (e su un Android di un amico del gruppo, per i test da subito su entrambe le piattaforme).

**Prima di tutto il resto — metti sotto git l'attuale index.html v0.8.5**, anche se sta per essere sostituito. Da questo momento ogni versione è recuperabile con un comando, non rileggendo la chat:

```bash
mkdir motoride-legacy && cd motoride-legacy
git init
# copia dentro l'attuale index.html v0.8.5
git add . && git commit -m "v0.8.5 alpha - baseline prima del porting nativo"
```

---

## Audit del codice attuale — cosa si tiene, cosa si butta, cosa si migliora

### Si tiene (la logica è corretta, va solo tradotta in componenti React Native)

- Schema dati dei giri: date, luoghi, odometro start/end, distanza, top speed, note, foto, preferito
- Logica del serbatoio virtuale: scala benzina in base a MPG, fill-up, aggiungi litri parziali, range residuo, colore barra (verde/giallo/rosso)
- Logica di manutenzione: tipo intervento, data, odometro, sync automatico col profilo
- Logica dello Smart Hub: ordina i locali in base al giorno della settimana, badge "tonight"
- Calcolatore giorni rimanenti documenti (MOT / assicurazione / bollo), con soglie colore
- Formula di distanza GPS (haversine) — corretta, riusabile as-is
- Endpoint di reverse geocoding (Nominatim/OpenStreetMap) per la posizione attuale — gratuito, riusabile

### Si butta (specifico del browser, non serve più in un'app nativa)

- Tutte le chiamate a `localStorage` → sostituite da `AsyncStorage`
- Tutta la manipolazione DOM (`document.getElementById`, `innerHTML`, `classList`) → sostituita da componenti React con stato
- Il tab-switching manuale (`switchTab()`) → sostituito da React Navigation (bottom tabs)
- Il trucco `compressImage()` su canvas per stringere le foto in base64 dentro localStorage → non serve più, lo storage nativo dei file non ha quel limite di 5MB
- Il wrapper "file-input-wrapper" per aggirare i bug di upload su iOS → non serve, `expo-image-picker` gestisce foto/camera in modo nativo e pulito, senza trucchi CSS

### Si migliora

- **Foto**: da "1 foto compressa per giro" (limite imposto da localStorage) a galleria vera multi-foto — salva solo il percorso del file nel JSON, non il base64 intero. È il momento giusto per togliere quel vincolo, non prima.
- **GPS tracking**: da `watchPosition` del browser (si interrompe se blocchi lo schermo) a `expo-location` con background task — è quello che dà davvero il tracciamento a schermo spento.

---

## Roadmap: 12 agosto → 30 settembre 2026

**Settimana 1 (12–18 ago) — Fondamenta**
Setup completo (sezione sopra). Primo progetto Expo vuoto che gira su Expo Go sul tuo iPhone. Nessuna feature ancora — l'obiettivo è solo vedere "Hello MOTORIDE" apparire sul telefono da codice scritto su Parrot OS. Se questo funziona, la pipeline intera funziona.

**Settimana 2 (19–25 ago) — Scheletro delle 6 tab**
Navigazione a 6 schede (Stats, Hub, Diary, Log, Maint, Rider) con React Navigation, bottoni giganti "glove-friendly". Solo interfaccia vuota, nessuna logica dati ancora.

**Settimana 3 (26 ago–1 set) — Dati locali**
Porta lo schema di giri, manutenzione e profilo su AsyncStorage. Diario, salvataggio giro manuale, serbatoio virtuale e tab manutenzione tornano funzionanti nella versione nativa.

**Settimana 4 (2–8 set) — GPS, foto native e prima mappa in-app**
`expo-location` per il tracking del giro (anche a schermo spento), `expo-image-picker` per multi-foto vera. Qui la versione nativa supera davvero quella web. Se il tempo lo permette: prima bozza della mappa in-app con `react-native-maps` (Livello 1 di navigazione) — anche solo vedersi in movimento sulla mappa, prima ancora del routing vero.

**Settimana 5 (9–15 set) — Database moto e Hub**
Dataset UK curato a mano (parti dai modelli del tuo gruppo, Lexmoto compresa). Smart Hub bike-night portato via. Prima bozza della lista Bike & Brew (nel frattempo, scrivi a M.A.R.K. per proporti come compagno digitale ufficiale).

**Settimana 6 (16–22 set) — Community**
Supabase per eventi/RSVP. Pulsante di export giro/evento verso WhatsApp con lo Share nativo del telefono.

**Settimana 7 (23–30 set) — Test col gruppo**
Build via TestFlight (iOS) / APK diretto (Android). Primo giro di feedback vero dai tuoi amici, fix, e tag git `v0.9`.

---

## Fuori scope per questa finestra (rimandato a dopo il 30 settembre)

- Motore di navigazione **offline** vero — ricalcolo senza segnale, tile caching automatico (Mapbox e relativi costi). La navigazione online di base (Livello 1) è invece dentro questa finestra, da settimana 4.
- Voice chat di gruppo / integrazione con Cardo-Sena
- SOS collegato davvero ai soccorsi
- Bluetooth mesh (Bridgefy) per messaggi/allerte senza rete
- Sponsor e monetizzazione

---

## Nota per chi continua questa conversazione (Gemini o altro)

Questo documento riassume le decisioni tecniche e di prodotto prese durante una sessione di analisi di mercato e pianificazione con Claude, a partire dalla v0.8.5 Alpha di MOTORIDE (app web HTML/JS/localStorage per iOS via Netlify). L'utente non è un programmatore, impara facendo, lavora su Parrot OS, e sta portando l'app da web a nativa (React Native + Expo) per un gruppo ristretto di amici motociclisti in UK, con obiettivo di avere una beta stabile pronta per la stagione di guida di marzo 2027.
