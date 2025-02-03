# Génération de bundle sur Desk

## 📌 Description
Ce projet permet une gestion transparente des dépendances pour un utilisateur de Desk. Les dépendances sont d'abord spécifiées dans un fichier dédié, puis un bundle est généré automatiquement. L'utilisateur peut ainsi intégrer et utiliser facilement les dépendances nécessaires sans se soucier de leur gestion.

## 📁 Présentation des répertoires

- **/bundleGenerator/** : Dossier contenant le générateur de bundles fonctionnel. Ce générateur ne prend pas en charge les imports depuis GitHub.

- **/bundleGenerator_github/** : Dossier en développement pour un générateur de bundles prenant en charge les imports depuis GitHub. Un message d'erreur apparaît actuellement lors de l'utilisation de Webpack.

- **/dependanceGenerator/** : Dossier permettant de générer un fichier contenant les imports à partir d'un fichier JSON. Ce générateur prend en charge les imports depuis GitHub.


## 💻 Utilisation
