# Génération de bundle sur Desk

## 📌 Description
Ce projet permet une gestion transparente des dépendances pour un utilisateur de Desk. Les dépendances sont d'abord spécifiées dans un fichier dédié, puis un bundle est généré automatiquement. L'utilisateur peut ainsi intégrer et utiliser facilement les dépendances nécessaires sans se soucier de leur gestion.

## 📁 Présentation des répertoires

- **/bundleGenerator/** : Dossier contenant le générateur de bundles fonctionnel. Ce générateur ne prend pas en charge les imports depuis GitHub.

- **/bundleGenerator_github/** : Dossier en développement pour un générateur de bundles prenant en charge les imports depuis GitHub. Un message d'erreur apparaît actuellement lors de l'utilisation de Webpack.

- **/dependanceGenerator/** : Dossier permettant de générer un fichier contenant les imports à partir d'un fichier JSON. Ce générateur prend en charge les imports depuis GitHub.


## 💻 Utilisation

### Cloner le dépot

```
git clone https://github.com/antoskuu/SIR_desk.git
```

### Génération de bundle

2. Créer un dossier *bundlegenerator* dans le dossier *Code* de Desk et y glisser tous les fichiers du dossier cloné SIR_Desk/installation_dependances :

![image](https://github.com/user-attachments/assets/e875a553-1309-4a72-8cfb-05ebd353be4b)

3. Lancer le terminal depuis la roue dentée

![image](https://github.com/user-attachments/assets/67d43cca-aa32-4118-b902-eb4fc89ddcf0)

4. Aller dans le dossier BundleGenerator
```
cd desk/code/bundlegenerator
```
Lancer la création du bundle
```
node bundleCLI.js index.js
```
![image](https://github.com/user-attachments/assets/ac846a5e-d47e-42b8-a7dd-920a55ee31bb)

5. Un fichier bundle.js a été créé dans bundlegenerator/temp/bundle1/dist :

![image](https://github.com/user-attachments/assets/f1e717ee-636d-4ad9-8082-2b714c9f5888)


### Générer les imports depuis un JSON

