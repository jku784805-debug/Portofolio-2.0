# Setup — Système de gestion des séances

## Vue d'ensemble

| Technologie | Rôle |
|---|---|
| **Supabase** | Base de données PostgreSQL + API auto-générée |
| **Supabase Edge Functions** | Serveur pour Google Calendar (clés sécurisées) |
| **TanStack React Query** | Cache + états de chargement côté frontend |
| **Google Calendar API** | Création/modification/suppression d'événements |

---

## 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Choisir une région proche (ex: Frankfurt pour la France)
3. Aller dans **Settings → API** et noter :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

## 2. Créer la table `seances`

Dans **Supabase → SQL Editor**, exécuter :

```sql
create table public.seances (
  id               uuid default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  client_prenom    text not null,
  client_nom       text not null,
  client_email     text default '',
  date_seance      date not null,
  jour             text not null,
  mois             text not null,
  annee            integer not null,
  heure_debut      text not null,
  heure_fin        text,
  type_seance      text default '',
  statut_paiement  text default 'non_payé'
                   check (statut_paiement in ('payé', 'non_payé', 'en_attente')),
  prix             numeric(10,2) default 0,
  google_event_id  text,
  statut_seance    text default 'à_venir'
                   check (statut_seance in ('à_venir', 'terminée', 'annulée')),
  notes_interne    text default ''
);

-- Désactiver RLS pour simplifier (à sécuriser avec auth en production)
alter table public.seances disable row level security;
```

> **En production** : activer RLS et créer une politique basée sur l'email de l'administrateur.

---

## 3. Google Calendar — Service Account

### 3a. Créer un projet Google Cloud

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un nouveau projet (ex: "KhunMacJ Calendar")
3. Aller dans **APIs & Services → Enable APIs**
4. Activer **Google Calendar API**

### 3b. Créer un Service Account

1. **APIs & Services → Credentials → Create Credentials → Service Account**
2. Nom : `calendar-bot` → Créer
3. Dans le service account créé : **Keys → Add Key → Create new key → JSON**
4. Télécharger le fichier JSON — il contient :
   - `client_email` → votre `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → votre `GOOGLE_PRIVATE_KEY`

### 3c. Partager votre calendrier avec le Service Account

1. Ouvrir **Google Calendar** ([calendar.google.com](https://calendar.google.com))
2. Sur votre calendrier → **... → Settings and sharing**
3. **Share with specific people** → ajouter l'email du service account
4. Permissions : **Make changes to events**
5. Copier l'**Calendar ID** (Settings → Integrate calendar) → `GOOGLE_CALENDAR_ID`

---

## 4. Déployer la Supabase Edge Function

### 4a. Installer Supabase CLI

```bash
npm install -g supabase
```

### 4b. Se connecter et lier le projet

```bash
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
# Project ref = dans l'URL : https://VOTRE_PROJECT_REF.supabase.co
```

### 4c. Définir les secrets (clés Google)

```bash
supabase secrets set GOOGLE_CALENDAR_ID="votre_calendar_id@group.calendar.google.com"
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="calendar-bot@votre-projet.iam.gserviceaccount.com"
supabase secrets set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> Pour `GOOGLE_PRIVATE_KEY` : ouvrir le fichier JSON téléchargé, copier la valeur `private_key` **avec les `\n`** dans la commande.

### 4d. Déployer la fonction

```bash
supabase functions deploy google-calendar --no-verify-jwt
```

---

## 5. Variables d'environnement locales

Copier `.env.example` en `.env.local` :

```bash
cp .env.example .env.local
```

Remplir les valeurs :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_ADMIN_PASSWORD=monmotdepasse
```

---

## 6. Lancer en local

```bash
npm run dev
```

Ouvrir [http://localhost:5173/admin/seances](http://localhost:5173/admin/seances)

---

## 7. Déployer en production (Vercel)

1. Pousser le code sur GitHub
2. Aller sur [vercel.com](https://vercel.com) → importer le repo
3. Dans **Environment Variables**, ajouter les 3 variables du `.env.local`
4. Deploy

> **Netlify** : même principe, ajouter les variables dans *Site settings → Environment variables*.

---

## 8. Accès admin

URL : `https://votre-domaine.com/admin/seances`

La page est protégée par le mot de passe `VITE_ADMIN_PASSWORD`.  
Si cette variable est vide, la page est accessible sans authentification.

---

## 9. Structure des fichiers créés

```
src/
  lib/
    supabase.js              — Client Supabase
    queryClient.js           — Config TanStack Query
  services/
    seancesService.js        — Toutes les opérations CRUD + Calendar
  pages/
    admin/
      SeancesAdmin.jsx       — Page d'administration
supabase/
  functions/
    google-calendar/
      index.ts               — Edge Function Google Calendar
.env.example                 — Variables d'environnement (modèle)
```
