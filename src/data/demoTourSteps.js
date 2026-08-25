export const demoSteps = [
  {
    view: 'market', target: '#launch-feed', duration: '00:35',
    eyebrow: '01 / LE LIVE', title: 'Les nouveaux tokens Pump.fun arrivent ici.',
    what: 'Chaque ligne correspond à un véritable lancement détecté sur Solana.',
    how: 'Helius écoute les logs du programme Pump.fun. HypeGraph décode les événements Create et affiche le mint, le créateur, le slot et la transaction.',
    why: 'On observe le token au moment de sa naissance, avant que les agrégateurs et les réseaux sociaux ne le rendent évident.',
  },
  {
    view: 'market', target: '#entity-analysis', duration: '00:45',
    eyebrow: '02 / LE TOKEN', title: 'Un token devient une entité à surveiller.',
    what: 'La fiche centrale regroupe prix, volume, liquidité, activité récente et trajectoire.',
    how: 'Les données de marché publiques sont rafraîchies périodiquement puis normalisées autour du même mint Pump.fun.',
    why: 'Cela évite de juger un token sur une seule bougie ou sur son volume brut.',
  },
  {
    view: 'market', target: '#analysis-scores', duration: '00:45',
    eyebrow: '03 / LES SCORES', title: 'Quatre scores rendent le signal lisible.',
    what: 'Propagation, vitesse du thème, persistance et risque sont affichés sur 100.',
    how: 'Le prototype combine variation, volume, liquidité, équilibre acheteurs/vendeurs et incohérences de flux avec des heuristiques locales.',
    why: 'Pendant une démo, on comprend immédiatement pourquoi un token mérite — ou non — l’attention. Ce ne sont pas encore des prédictions ML entraînées.',
  },
  {
    view: 'market', target: '#narrative-map', duration: '00:40',
    eyebrow: '04 / LES THÈMES', title: 'La Machine regroupe les tokens par narrative.',
    what: 'Les thèmes qui concentrent le plus de tokens, de volume et d’accélération remontent automatiquement.',
    how: 'Le mode actuel utilise les métadonnées des tokens, des règles sémantiques locales et l’agrégation des flux.',
    why: 'Un pump isolé est aléatoire ; plusieurs tokens et wallets convergeant sur le même thème constituent un signal plus intéressant.',
  },
  {
    view: 'history', target: '#history-lab', duration: '00:55',
    eyebrow: '05 / LA MÉMOIRE', title: 'Le backtest montre ce que la Machine apprendra.',
    what: 'On compare les launches à 5 min, 30 min, 2 h et 24 h : migration, ATH, drawdown, rug et survie.',
    how: 'Cette section utilise actuellement un dataset simulé et explicitement étiqueté. Le collecteur Helius réel commence à constituer le futur historique.',
    why: 'Ces labels permettront plus tard d’entraîner et de mesurer un véritable modèle de détection précoce.',
  },
  {
    view: 'modules', target: '#feature-suite', duration: '00:50',
    eyebrow: '06 / LES OUTILS', title: 'Vingt fonctions prolongent l’enquête.',
    what: 'Profils wallet, créateurs, snipers, alertes, replay, stress de liquidité, dossiers et assistant de recherche.',
    how: 'Certaines fonctions calculent déjà localement ; les autres montrent l’interface et s’abstiennent proprement tant que leur source n’est pas connectée.',
    why: 'La démo présente le produit final sans fabriquer de données ou de conclusions indisponibles.',
  },
]
