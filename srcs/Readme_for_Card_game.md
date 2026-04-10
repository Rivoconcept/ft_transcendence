# Card Game - ft_transcendence

## 📚 Description

Le **Card Game** est un mini-jeu intégré au projet *ft_transcendence*. Il propose une expérience solo et multijoueur basée sur un système de tirage de cartes et de calcul de score.

Le joueur doit accumuler des points en un nombre limité de tours ou dans un temps imparti.

---

## 🎮 Objectif du jeu

### Mode SINGLE

* Atteindre un score cible de **27 points**
* En **maximum 5 tours**
* Avant la fin du timer

### Mode MULTI

* Jouer contre d'autres joueurs
* Le joueur avec le **meilleur score à la fin du temps** gagne

---

## 🧠 Logique du jeu

La logique principale est gérée dans :

```
CardGameDashboard.tsx
```

### 🔁 Cycle de jeu

Le jeu suit plusieurs phases :

1. **BEGIN** → état initial
2. **SHUFFLE** → animation de mélange
3. **PLAY** → tirage et affichage des cartes
4. **SHOW_RESULT** → affichage du résultat

---

## 🔢 Système de score

* Chaque tour tire **3 cartes aléatoires**
* Les valeurs des cartes sont additionnées
* Le score est transformé via la fonction `proofByNine`
* Le score est ajouté au score total

---

## ⏱️ Gestion du temps

* Timer global défini par `TIME_LIMIT`
* Décrémentation chaque seconde
* Le jeu s'arrête lorsque :

  * le temps est écoulé
  * les conditions de victoire/défaite sont atteintes

---

## 🏁 Conditions de fin

### SINGLE

* **Victoire** : score ≥ 27 avant 5 tours
* **Défaite** : score < 27 à la fin du temps
* **Fin automatique** : après 5 tours

### MULTI

* Fin lorsque le timer atteint 0
* Comparaison des scores entre joueurs

---

## 🔌 Synchronisation MULTI (Socket)

* Connexion via WebSocket
* Événements utilisés :

  * `match:player-joined`
  * `match:player-left`
  * `match:started`
  * `match:result`

Les scores sont envoyés avec :

```
publish_result
```

---

## 💾 Sauvegarde

Les résultats sont envoyés au backend via :

```
CardGameDb
```

* Sauvegarde automatique en fin de partie
* Gestion différente pour SINGLE et MULTI

---

## 🧩 Structure des composants

* `CardScene` → rendu des cartes (Three.js)
* `CardGameDashboard` → logique principale + UI
* `CardContext` → gestion des cartes
* `CardGameContext` → gestion du gameplay

---

## ⚙️ États principaux

| Variable   | Description           |
| ---------- | --------------------- |
| turn       | Nombre de tours joués |
| totalScore | Score cumulé          |
| isWin      | Condition de victoire |
| isLose     | Condition de défaite  |
| isFinished | Fin de la partie      |
| timeLeft   | Temps restant         |

---

## 🔄 Reset du jeu

Le reset :

* remet les scores à 0
* réinitialise le timer
* remet les cartes
* relance le jeu

---

## 📌 Notes

* Le jeu utilise **React + Jotai + Socket.io**
* Le rendu 3D est assuré par **react-three-fiber**
* La logique est séparée entre **UI / state / backend**

---

## ✅ Améliorations possibles

* Affichage des joueurs en temps réel
* Leaderboard live
* Animations supplémentaires
* Ajout de bonus/malus

---

## 👨‍💻 Auteur

Projet réalisé dans le cadre de l
