# Ritorno alla prima versione

Questa variante ripristina il funzionamento iniziale di Rece:

- l'account `stepangrazi@gmail.com` torna a essere `admin`;
- l'account viene ricollegato all'hotel **Trevi**;
- l'amministratore può usare sia il pannello hotel sia il backoffice;
- il backoffice torna a creare separatamente strutture e inviti utente;
- nessun hotel, utente o dato operativo viene cancellato.

## Ordine corretto

1. Applica al progetto la patch di ritorno alla prima versione.
2. Apri `supabase/migrations/0002_restore_first_version.sql`.
3. Copia tutto nel SQL Editor di Supabase e premi **Run** una volta.
4. Riavvia l'app con `npm run dev:vercel`.
5. Esci e accedi nuovamente con `stepangrazi@gmail.com`.

La configurazione dei Redirect URL aggiunta in Supabase può rimanere: non crea problemi.
