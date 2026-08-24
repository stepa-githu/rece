# Aggiornamento: centro clienti separato dal pannello hotel

Questa versione introduce due ruoli distinti:

- `platform_admin`: amministratore Rece, senza `hotel_id`; può soltanto vedere e aggiungere strutture;
- `hotel_user`: referente associato a un solo `hotel_id`; può usare soltanto il pannello del proprio hotel.

## Procedura per il progetto già esistente

1. Conserva una copia del tuo attuale `.env.local`.
2. Sostituisci il codice con questa versione oppure applica la patch fornita.
3. In Supabase apri **SQL Editor**.
4. Copia tutto `supabase/migrations/0002_role_separation.sql`, incollalo e premi **Run** una sola volta.
5. In **Authentication → URL Configuration** autorizza:

   ```text
   http://localhost:3000/set-password
   https://rece.marketingterritoriale.it/set-password
   ```

6. Riavvia l’app locale:

   ```powershell
   npm install
   npm run dev:vercel
   ```

7. Accedi con il vecchio account amministratore: ora entrerà nel **Centro clienti Rece**.
8. Crea una nuova struttura indicando anche nome ed email del referente.
9. Il referente apre l’email ricevuta, sceglie la password e accede esclusivamente al proprio hotel.

## Cosa accade ai dati esistenti

La migrazione non cancella nulla. Il precedente account `admin` diventa `platform_admin` e il suo vecchio collegamento all’hotel viene rimosso. Per questo, un eventuale hotel di prova già presente può comparire come **Nessun referente associato**. Puoi lasciarlo così durante i test e creare una nuova struttura completa.

## Verifica rapida

- entrando come amministratore Rece compare soltanto **Strutture clienti**;
- entrando come referente compaiono dashboard, recensioni, conoscenza AI, tono e collegamenti;
- un referente non può aprire `/admin`;
- l’amministratore Rece non può aprire `/dashboard`, `/reviews` o le API operative.

## Pubblicazione su GitHub

Dopo la verifica locale:

```powershell
git add .
git commit -m "Separa centro clienti e accessi hotel"
git push
```

Vercel ridistribuirà il progetto dal repository GitHub. Ricorda che `.env.local` non deve essere caricato su GitHub.
