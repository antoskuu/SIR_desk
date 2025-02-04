# Génération de bundle sur Desk

## 📌 Description
Ce projet permet une gestion transparente des dépendances pour un utilisateur de Desk. Les dépendances sont d'abord spécifiées dans un fichier dédié, puis un bundle est généré automatiquement. L'utilisateur peut ainsi intégrer et utiliser facilement les dépendances nécessaires sans se soucier de leur gestion.

## 📁 Présentation des répertoires

- **bundleGenerator/** : Dossier contenant le générateur de bundles fonctionnel. Ce générateur ne prend pas en charge les imports depuis GitHub.

- **bundleGenerator_github/** : Dossier en développement pour un générateur de bundles prenant en charge les imports depuis GitHub. Un message d'erreur apparaît actuellement lors de l'utilisation de Webpack.

- **dependanceGenerator/** : Dossier permettant de générer un fichier contenant les imports à partir d'un fichier JSON. Ce générateur prend en charge les imports depuis GitHub.


## 💻 Utilisation

### Cloner le dépot

``` bash
git clone https://github.com/antoskuu/SIR_desk.git
```

### Génération de bundle

Cette partie s'applique aux répertoires : 
- **bundleGenerator_github/** : Ne fonctionne pas lors de l'import de dépendances depuis GitHub, à corriger.
- **bundleGenerator/** : Fonctionne pour l'import et l'exposition de dépendances.

1. Créer un dossier _bundlegenerator_ dans le dossier Code de Desk et y glisser tous les fichiers du dossier cloné _SIR_Desk/installation_dependances_ :

![image](https://github.com/user-attachments/assets/e875a553-1309-4a72-8cfb-05ebd353be4b)

2. Importer les dépendances que vous souhaitez utiliser et exportez-les en variables globales.

Modifiez le fichier index.js, vous pouvez suivre cet exemple afin de réaliser vos imports : 

``` js
import lodash from 'lodash';
window.lodash = lodash;

import dayjs from 'github.com/iamkun/dayjs'; // Cas de l'export avec GitHub avec le dossier : bundleGenerator_github/
window.dayjs = dayjs;

import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
window.NRRDLoader = NRRDLoader;

import * as fflate from 'three/addons/libs/fflate.module.js';
window.fflate = fflate;

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
window.OrbitControls = OrbitControls;

import { VolumeRenderShader1 } from 'three/addons/shaders/VolumeShader.js';
window.VolumeRenderShader1 = VolumeRenderShader1;


```

3. Lancer le terminal depuis la roue dentée.

![image](https://github.com/user-attachments/assets/67d43cca-aa32-4118-b902-eb4fc89ddcf0)

4. Aller dans le dossier BundleGenerator :
``` bash
cd desk/code/bundlegenerator
```
5. Lancer la création du bundle :
``` bash
node bundleCLI.js index.js
```
![image](https://github.com/user-attachments/assets/ac846a5e-d47e-42b8-a7dd-920a55ee31bb)

6. Un fichier bundle.js a été créé dans _bundlegenerator/temp/bundle1/dist_ :

![image](https://github.com/user-attachments/assets/f1e717ee-636d-4ad9-8082-2b714c9f5888)


### Générer les imports depuis un JSON

1. Modifier _dep.json_ afin de générer un fichier JS contenant les imports et l'exposition des dépendances en variables globales.

Exemple de json : 
``` json
{
    "imports": [
      {
        "type": "default",
        "name": "lodash",
        "path": "lodash"
      },
      {
        "type": "namespace",
        "name": "dayjs",
        "path": "github.com/iamkun/dayjs"
      },
      {
        "type": "named",
        "names": ["map", "filter"],
        "path": "lodash"
      }
    ]
  }
  
```

Qui permet de créer : 
``` js
import lodash from 'lodash';
window.lodash = lodash;
import * as dayjs from 'github.com/iamkun/dayjs';
window.dayjs = dayjs;
import { map, filter } from 'lodash';
window.map = map;
window.filter = filter;

```

2. Générer le fichier _out.js_ qui contient les imports : 

``` bash
node ./conv.js
``` 
