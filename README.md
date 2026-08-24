# Rece — recensioni intelligenti per l’hospitality

MVP multi-hotel per raccogliere recensioni, organizzarle in un unico pannello e preparare risposte AI coerenti con sito ufficiale, materiali della struttura e tono di voce.

Dominio previsto: `https://rece.marketingterritoriale.it`

## Cosa contiene questa versione

- login email/password con Supabase Auth;
- isolamento dei dati per hotel con Row Level Security;
- backoffice amministratore per creare hotel e invitare utenti;
- dashboard responsive e archivio recensioni filtrabile;
- dettaglio recensione con generazione, modifica e copia della risposta;
- conoscenza AI alimentata dal sito ufficiale, note e file testuali;
- tono di voce configurabile;
- collegamento in sola lettura a Google Business Profile;
- connettori Booking.com Guest Review API e Tripadvisor Terra già predisposti;
- sincronizzazione manuale e automatica ogni 6 ore;
- modalità demo automatica quando Supabase non è configurato;
- prima configurazione guidata da `/setup`.

La risposta AI non viene mai pubblicata automaticamente. L’operatore la controlla e la copia sulla piattaforma originale.

## Stack

- Next.js App Router + TypeScript;
- Supabase: Postgres, Auth e Storage;
- OpenAI Responses API;
- Vercel per deploy e cron;
- GitHub per il repository.

## 1. Crea il progetto Supabase

1. Apri [Supabase](https://supabase.com/dashboard) e crea un progetto.
2. Entra in **SQL Editor**.
3. Copia tutto il contenuto di `supabase/migrations/0001_initial.sql`.
4. Incollalo nell’editor e premi **Run**.
5. In **Project Settings → API** recupera:
   - Project URL: https://wlywvwakuzrezfjmtste.supabase.co/rest/v1/
   - Publishable key: sb_publishable_O98RiW6jFc5X4tzgqbmNTA_ZLhXqdKy
   - Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseXd2d2FrdXpyZXpmam10c3RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU0ODU2NiwiZXhwIjoyMTAzMTI0NTY2fQ.qUgNP7D8Kw3AWNmEGAV6QaqLaYktmX_e2-XNWDE3CV4


Lo script crea tabelle, indici, trigger utente, policy RLS e bucket privato `knowledge-files`.

## 2. Prepara il progetto in locale

Requisiti: Node.js 22 o successivo e Git.

```bash
npm install
cp .env.example .env.local
npm run dev:vercel
```

Compila `.env.local` con i valori descritti nella sezione seguente. L’app parte anche senza chiavi, mostrando la demo.

## 3. Variabili ambiente

| Variabile | Obbligatoria | Dove trovarla / cosa inserire |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | sì | `https://rece.marketingterritoriale.it` |
| `NEXT_PUBLIC_SUPABASE_URL` | sì | URL del progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sì | Publishable key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | sì | Service role key; solo server |
| `TOKEN_ENCRYPTION_KEY` | sì | frase casuale lunga almeno 32 caratteri |
| `SETUP_TOKEN` | sì | codice segreto usato una volta su `/setup` |
| `CRON_SECRET` | sì | segreto casuale per il cron Vercel |
| `OPENAI_API_KEY` | sì per le bozze AI | chiave di progetto OpenAI |
| `OPENAI_MODEL` | no | default `gpt-5-mini` |
| `GOOGLE_CLIENT_ID` | sì per Google | credenziale OAuth Google Cloud |
| `GOOGLE_CLIENT_SECRET` | sì per Google | segreto OAuth Google Cloud |
| `BOOKING_ACCESS_TOKEN` | no | alternativa globale al token salvato per hotel |
| `TRIPADVISOR_TERRA_API_KEY` | no | alternativa globale alla key salvata per hotel |
| `NEXT_PUBLIC_DEMO_MODE` | no | `true` forza la demo |

Per generare segreti casuali:

```bash
openssl rand -base64 48
```

Non inserire mai `.env.local` in Git. Il file è già escluso da `.gitignore`.

## 4. Carica su GitHub e pubblica con Vercel

1. Crea un repository GitHub vuoto.
2. Dal progetto esegui:

```bash
git init
git add .
git commit -m "Prima versione Rece"
git branch -M main
git remote add origin https://github.com/TUO-ACCOUNT/rece.git
git push -u origin main
```

3. In Vercel scegli **Add New → Project** e importa il repository.
4. Framework: Next.js. Il file `vercel.json` usa già `npm run build:vercel`.
5. Inserisci tutte le variabili in **Settings → Environment Variables**.
6. Pubblica.

Il file `vercel.json` esegue la sincronizzazione ogni 6 ore. Vercel invia automaticamente `Authorization: Bearer $CRON_SECRET` ai cron protetti.

## 5. Collega il dominio

1. In Vercel apri **Settings → Domains**.
2. Aggiungi `rece.marketingterritoriale.it`.
3. Nel DNS di `marketingterritoriale.it` crea il record indicato da Vercel, normalmente un CNAME `rece` verso `cname.vercel-dns.com`.
4. Imposta anche `NEXT_PUBLIC_APP_URL=https://rece.marketingterritoriale.it` e ridistribuisci.

## 6. Crea il primo hotel e il primo admin

1. Apri `https://rece.marketingterritoriale.it/setup`.
2. Inserisci il valore configurato in `SETUP_TOKEN`.
3. Compila hotel, sito, nome, email e password.
4. Dopo la conferma accedi da `/login`.

La procedura viene bloccata appena esiste il primo profilo. Gli utenti successivi si invitano da **Backoffice → Hotel e utenti**.

## 7. Configura Google Business Profile

Nel progetto Google Cloud:

1. abilita Google Business Profile API, Account Management API e Business Information API;
2. richiedi/attendi l’accesso alle Business Profile API se il progetto non lo possiede;
3. configura OAuth Consent Screen;
4. crea una credenziale **OAuth client ID → Web application**;
5. aggiungi come redirect URI autorizzato:

```text
https://rece.marketingterritoriale.it/api/integrations/google/callback
```

6. copia Client ID e Client Secret in Vercel;
7. nell’app vai su **Collegamenti → Google Business Profile → Collega**;
8. se l’account gestisce più sedi, scegli quella dell’hotel.

Google restituisce recensioni soltanto per sedi accessibili all’utente e verificate. Il connettore usa lo scope `business.manage`, pagina i risultati e aggiorna il token sul server.

## 8. Booking.com: requisito reale

Il connettore usa la Guest Review API ufficiale:

```text
GET https://supply-xml.booking.com/review-api/properties/{PROPERTY_ID}/reviews
```

Servono:

- un machine account Booking.com Connectivity;
- il permesso `review-api`;
- autenticazione token-based e relativo JWT;
- eventuale configurazione IP prevista dal proprio accordo.

Le recensioni scaricate possono essere usate internamente dalla struttura e non devono essere ripubblicate su pagine pubbliche. L’interfaccia Rece è protetta dal login e non espone un feed pubblico.

## 9. Tripadvisor: usa Terra, non la vecchia API

La vecchia JSON Partner API è in dismissione nel 2026. Il codice usa Tripadvisor Terra:

```text
GET https://terra.tripadvisor.com/api/locations/{LOCATION_ID}/reviews
X-API-Key: ...
```

Servono contratto/API key Terra e accesso alla Location. Dal pannello inserisci Location ID e key; la credenziale viene cifrata prima di essere salvata.

## 10. Come viene usata la conoscenza

Questa MVP non effettua fine-tuning. Applica un approccio RAG leggero:

1. acquisisce testo verificato dal sito, da note o file;
2. seleziona le fonti dell’hotel;
3. le inserisce come contesto privato quando genera la risposta;
4. chiede al modello di non inventare informazioni mancanti.

Il crawler visita al massimo 8 pagine dello stesso dominio, blocca indirizzi locali, limita dimensioni e timeout. I file supportati nella MVP sono TXT, Markdown, CSV, JSON e HTML, massimo 5 MB. PDF e DOCX sono una naturale estensione successiva con estrazione asincrona.

## 11. Sicurezza e GDPR prima di vendere il servizio

- scegli, dove disponibili, regioni dati UE per Supabase e servizi collegati;
- firma DPA/accordi da responsabile del trattamento con i fornitori necessari;
- documenta finalità, base giuridica, tempi di conservazione e sub-responsabili;
- non usare scraping non autorizzato: usa soltanto API ufficiali e account della struttura;
- non esporre mai `SUPABASE_SERVICE_ROLE_KEY`, token provider o `OPENAI_API_KEY` nel browser;
- ruota `TOKEN_ENCRYPTION_KEY` e credenziali con una procedura controllata;
- valuta cancellazione o anonimizzazione delle recensioni più vecchie;
- inserisci log di audit, rate limiting e monitoraggio prima di una vendita su larga scala;
- informa l’operatore che la risposta AI va sempre verificata.

Il progetto protegge le righe per hotel tramite RLS. Le mutazioni privilegiate avvengono solo nelle route server dopo il controllo della sessione e del ruolo.

## Struttura cartelle

```text
app/
  (app)/                 pagine protette hotel e admin
  api/                   endpoint server
  auth/                  callback e logout
  login/ setup/          accesso e prima configurazione
components/              interfaccia riusabile
lib/
  providers/             adapter Google, Booking.com, Tripadvisor
  supabase/              client browser, server e service-role
  ai.ts                  prompt e chiamata Responses API
  crawler.ts             acquisizione sito ufficiale
  sync.ts                normalizzazione e upsert recensioni
supabase/migrations/     database, RLS e Storage
types/                   tipi applicativi
```

## Controlli prima del lancio

```bash
npm run lint
npx tsc --noEmit
npm run build:vercel
```

Verifica inoltre:

- login e logout;
- impossibilità per un utente hotel di aprire `/admin`;
- scelta corretta della sede Google;
- sincronizzazione delle tre fonti autorizzate;
- risposta nella lingua della recensione;
- assenza di dettagli inventati;
- leggibilità da smartphone;
- errori e timeout delle API nel pannello.

## Roadmap consigliata

1. log di audit per modifiche, copie e inviti;
2. parser PDF/DOCX asincrono e segmentazione semantica;
3. onboarding guidato per ogni nuova struttura;
4. analisi sentiment e temi ricorrenti;
5. notifiche email per recensioni critiche;
6. pubblicazione della risposta solo dopo approvazione esplicita e solo dove consentita;
7. billing, piani e limiti per hotel;
8. test automatici dei connettori con fixture ufficiali.

## Documentazione ufficiale utile

- [Supabase Auth con Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Google Business Profile reviews.list](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list)
- [Booking.com Guest Review API](https://developers.booking.com/connectivity/docs/review-api)
- [Tripadvisor Terra](https://docs.terra.tripadvisor.com/docs/overview)
- [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
#   r e c e  
 