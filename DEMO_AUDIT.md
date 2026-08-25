# HypeGraph Machine — audit de démonstration

Date de contrôle : 25 août 2026  
Périmètre : frontend local, API locale, flux Helius Pump.fun, mémoire de démonstration et 20 fonctions analytiques.

## Verdict exécutif

HypeGraph est prêt pour une démonstration locale de 3 à 5 minutes. Le frontend et l’API répondent, le flux Pump.fun est réellement connecté à Helius et plus de 1 000 launches ont été retenus pendant la session de validation. Le produit n’envoie aucun ordre et n’expose pas la clé Helius au navigateur.

La démonstration mélange volontairement quatre niveaux de données, toujours identifiables :

- **Observé** : événements de création Pump.fun décodés depuis les logs Solana via Helius.
- **Public / enrichi** : prix, volumes et liquidité issus de données publiques de marché, avec snapshot de secours.
- **Calculé localement** : scores heuristiques, regroupements, filtres, replay et simulations.
- **Simulé** : historique 24 h à 90 j, labels et classements wallet/KOL de la section de backtest.

## Parcours guidé — environ 4 min 10

Le bouton `DÉMO GUIDÉE` lance six étapes et déplace automatiquement l’écran vers le panneau concerné.

1. **Nouveaux tokens en direct — 35 s**  
   Montrer un vrai CreateEvent Pump.fun, le mint, le créateur, le slot et la transaction.
2. **Token sélectionné — 45 s**  
   Montrer le prix, le volume, la liquidité et la trajectoire de l’entité.
3. **Scores d’analyse — 45 s**  
   Expliquer potentiel de propagation, vitesse du thème, persistance, risque et fiabilité.
4. **Thèmes du moment — 40 s**  
   Montrer le regroupement des tokens par narrative et leur accélération relative.
5. **Historique de démonstration — 55 s**  
   Comparer 5 min, 30 min, 2 h et 24 h, puis migration, ATH, drawdown, rug et survie.
6. **Vingt outils d’analyse — 50 s**  
   Présenter les fonctions utilisables, partielles et celles qui nécessitent encore une source.

Chaque étape contient trois réponses : ce que l’écran montre, comment il le produit et pourquoi cela est utile.

## Fonctions opérationnelles

### Infrastructure et acquisition

| Fonction | État | Fonctionnement réel |
|---|---|---|
| API HypeGraph | Opérationnelle | Fastify local sur le port 8787 |
| Frontend | Opérationnel | Vite local sur le port 5175 |
| Flux Pump.fun | Live | `logsSubscribe` Helius sur le programme Pump.fun |
| Décodage des launches | Live | Décodage Create/CreateV2 avec l’IDL public Pump.fun |
| Reconnexion | Active | Reconnexion exponentielle du WebSocket |
| Préchargement | Actif | Les 24 launches sauvegardés les plus récents sont chargés avant les nouveaux événements |
| Persistance | Locale | Fichier JSON, maximum 2 000 launches |
| Backfill | Limité | Requêtes ralenties pour respecter le quota Helius ; pas adapté à un historique massif |

### Cockpit live

| Panneau | État | Description |
|---|---|---|
| Nouveaux tokens Pump.fun | Observé | Six lignes visibles, douze sur demande, zone de hauteur fixe et scrollable |
| Tokens à surveiller | Public + snapshot | Recherche, filtres et tris par volume, potentiel, récence ou risque |
| Token sélectionné | Public + snapshot | Prix, variations, volumes, liquidité, FDV et activité acheteur/vendeur |
| Scores d’analyse | Calcul local | Heuristiques déterministes ; ce n’est pas encore un modèle ML entraîné |
| Thèmes du moment | Calcul local | Règles sémantiques simples et agrégation du volume par thème |
| Évolution comparée | Calcul local | Heatmap 5 min, 1 h, 6 h, 24 h et risque |
| Changements récents | Calcul local | Différences de prix observées entre deux actualisations |
| Wallets et entités liés | Aperçu | UI fonctionnelle, mais résolution wallet réelle non connectée |
| État des sources | Opérationnel | Affiche univers, sources, flux Helius et absence d’exécution |

### Historique de démonstration

La section est interactive et fonctionnelle, mais ses valeurs sont simulées :

- fenêtres 24 h, 7 j, 30 j et 90 j ;
- horizons 5 min, 30 min, 2 h et 24 h ;
- funnel launch → signal → x2 → migration ;
- migration, ATH supérieur à 5x, survie, drawdown et rug ;
- narratives émergentes ;
- cohortes wallet/KOL pseudonymes ;
- résultats journaliers.

Le marquage `DONNÉES SIMULÉES / PAS DU LIVE` empêche de confondre cette démonstration avec un backtest réellement collecté.

## Audit des 20 outils

### Utilisables localement

1. **Force d’un thème** : calcule une accélération à partir du marché disponible.
2. **Alertes** : création et sauvegarde locale/API des règles.
3. **Test de liquidité** : simule l’impact d’un montant sur la profondeur déclarée.
4. **Phase du marché** : classe découverte, expansion, euphorie, range ou déclin.
5. **Explication des scores** : expose les contributions utilisées par les heuristiques.
6. **Replay historique** : rejoue les 24 points du snapshot sans données futures.
7. **Listes de suivi** : sauvegarde les tokens dans le navigateur.
8. **Dossiers d’enquête** : sauvegarde notes, token, fonction et horodatage.

### Partiellement utilisables

9. **Regroupement par thème** : proxy local opérationnel ; embeddings texte/image non connectés.
10. **Cycle de vie Pump.fun** : launch et étape bonding observables ; migration et survie complètes non suivies.
11. **Probabilité de survie** : proxy heuristique ; modèle calibré absent.
12. **Détection du faux volume** : incohérences simples ; graphes de contreparties absents.
13. **Assistant de recherche** : synthèse locale ; modèle externe non connecté.

### Interface prête, source manquante

14. **Analyse d’un wallet** : nécessite l’historique transactionnel enrichi.
15. **Historique du créateur** : nécessite les liens de financement et anciens launches.
16. **Achats coordonnés / snipers** : nécessite les balances et transactions des premiers slots.
17. **Wallets historiquement performants** : nécessite un historique de performance.
18. **Graphe temporel** : nécessite une base de relations persistante.
19. **Impact des KOLs** : nécessite des événements sociaux horodatés.
20. **Webhooks** : le test appelle réellement l’API, qui s’abstient tant qu’aucune URL publique et aucun secret de signature ne sont configurés.

## Sécurité et honnêteté de la démonstration

- La clé Helius reste dans `.env.server`, fichier ignoré par Git.
- Aucun secret Helius n’est placé dans une variable `VITE_*`.
- L’API n’accepte actuellement que les origines locales configurées.
- Aucune transaction, signature wallet ou exécution d’ordre n’est implémentée.
- Les endpoints sans données répondent avec l’état `abstain` au lieu d’inventer un résultat.
- L’historique simulé et les identités wallet/KOL synthétiques sont explicitement signalés.

## Limites acceptables pour une démo de 30 minutes

- Conservation limitée à 2 000 launches locaux.
- Pas de PostgreSQL ni Redis.
- Pas d’authentification utilisateur.
- Pas de domaine ou d’hébergement public.
- Pas de modèle ML entraîné ni d’inférence GPU réelle.
- Pas de tracking KOL réel.
- Les données de marché peuvent basculer sur le snapshot si l’API publique est indisponible.

Ces limites sont acceptables pour une démonstration courte, mais doivent être présentées avec les formulations intégrées au parcours guidé.

## Validation technique

- Frontend HTTP : `200`
- API : opérationnelle
- Pump stream : `live`
- Cycle de vie du dernier mint : `bonding`
- Registre : 20 fonctions
- Tests : 14 réussis
- Lint : réussi
- Typecheck : réussi
- Build de production : réussi

