# Volume Rendering sur Desk
Partie réalisée par Antonin GUY.
## 📌 Description

Ce projet implémente un rendu volumique en utilisant THREE.js et Qooxdoo sur Desk. Il permet de charger un fichier NRRD, d'afficher le volume en 3D et d'ajuster ses paramètres via une interface utilisateur.

## 🚀 Mise en route
### 🧷Installation des dépendances webpack (NRRDLoader et VolumeRenderShader1)
1. Cloner le dépot
```
git clone https://github.com/antoskuu/SIR_desk.git
```
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

6. Le copier dans le dossier code/init:

![image](https://github.com/user-attachments/assets/93bd3527-8af5-442c-a21d-32347b911255)

### ✅Lancement du code Volume Rendering
Les dépendances ont été installées, il suffit maintenant de copier tous les fichiers du dossier cloné SIR_Desk/volume_rendering dans le dossier de votre choix, et de lancer le fichier volume_rendering.js

