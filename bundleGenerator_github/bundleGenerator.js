/*
La classe principale qui gère toute la logique de traitement :
    - Détection des dépendances
    - Installation des packages NPM
    - Génération de la configuration webpack
    - Création du bundle
*/

const fs = require('fs'); // Module pour interagir avec le système de fichiers
const path = require('path'); // Module pour manipuler les chemins de fichiers
const util = require('util'); // Module utilitaire pour la conversion de fonctions callback en Promesses
const { exec } = require('child_process'); // Module pour exécuter des commandes shell
const execPromise = util.promisify(exec); // Convertit exec en une version basée sur des Promesses

class BundleGenerator {
    constructor(tempDir) { 
        this.TEMP_DIR = tempDir; // Le chemin du répertoire temporaire pour stocker les fichiers générés
        this.initTempDirectory(); // Initialise le répertoire temporaire (création ou nettoyage)
    }

    // Crée le répertoire temporaire s'il n'existe pas ou le nettoie s'il existe déjà
    initTempDirectory() {
        if (fs.existsSync(this.TEMP_DIR)) {
            fs.rmSync(this.TEMP_DIR, { recursive: true, force: true }); // Supprime le répertoire s'il existe
        }
        fs.mkdirSync(this.TEMP_DIR, { recursive: true }); // Crée le répertoire temporaire
    }

    // Détecte les dépendances dans le code source
    findDependencies(sourceCode) {
        // Expressions régulières pour rechercher les importations et require
        const patterns = [
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // pour require('...') 
            /import\s+(?:[\w*\s{},]*)\s+from\s+['"]([^'"]+)['"]/g, // pour import ... from '...'
            /import\s+['"]([^'"]+)['"]/g // pour import '...'
        ];
        
        const dependencies = new Set(); // Utilisation d'un Set pour éviter les doublons
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(sourceCode)) !== null) {
                const dependency = match[1]; // Récupère le chemin de la dépendance

                // Si la dépendance est une URL GitHub, formate l'URL pour Git
                if (dependency.includes('github.com/')) {
                    const gitURL = `git+https://${dependency}.git`;
                    dependencies.add(gitURL);
                }
                // Si la dépendance n'est pas locale, ajoute le nom principal du package
                else if (!dependency.startsWith('.') && !dependency.startsWith('/')) {
                    const mainPackage = dependency.split('/')[0]; // Utilise le premier segment du chemin
                    dependencies.add(mainPackage);
                }
            }
        });
        
        return Array.from(dependencies); // Retourne un tableau des dépendances uniques
    }

    // Génère un fichier de configuration Webpack pour le projet
    generateWebpackConfig(folderPath) {
        const webpackConfig = `
            const path = require('path');
            module.exports = {
                mode: 'development',  // Mode développement pour faciliter le debug (sans tree shaking)
                entry: './src/index.js', // Le fichier d'entrée de l'application
                output: {
                    path: path.resolve(__dirname, 'dist'), // Dossier de sortie des fichiers générés
                    filename: 'bundle.js', // Nom du fichier de bundle
                    library: {
                        type: 'module', // Définit le type du module (ES Module)
                    },
                },
                experiments: {
                    outputModule: true, // Active le support des exports ES6
                },
                optimization: {
                    usedExports: false, // Ne supprime pas les exports non utilisés
                    minimize: false, // Pas de minimisation pour faciliter le debug
                    concatenateModules: false, // Pas de fusion des modules
                    sideEffects: false // Evite la suppression de code jugé inutile
                },
                module: {
                    rules: [
                    {
                        test: /\.js$/, // Applique Babel sur tous les fichiers JavaScript
                        exclude: /node_modules/, // Exclut les modules node_modules
                        use: {
                            loader: 'babel-loader' // Utilisation de Babel pour assurer la compatibilité avec les anciens navigateurs
                        }
                    }
                    ]
                }
            };
        `;
        // Écrit la configuration Webpack dans le répertoire temporaire
        fs.writeFileSync(path.join(folderPath, 'webpack.config.js'), webpackConfig);
    }

    // Fonction principale pour générer le bundle à partir du code source
    async generateBundle(sourceCode) {
        try {
            const folder = `bundle`; // Nom du dossier de bundle
            const folderPath = path.join(this.TEMP_DIR, folder); // Chemin complet du dossier de bundle
            const srcPath = path.join(folderPath, 'src'); // Dossier source du bundle
            const distPath = path.join(folderPath, 'dist'); // Dossier de sortie pour le bundle généré

            // Crée les dossiers nécessaires
            fs.mkdirSync(srcPath, { recursive: true });
            fs.mkdirSync(distPath, { recursive: true });
            // Écrit le code source dans le fichier index.js
            fs.writeFileSync(path.join(srcPath, 'index.js'), sourceCode);

            // Recherche et installe les dépendances nécessaires
            const dependencies = this.findDependencies(sourceCode);
            if (dependencies.length > 0) {
                console.log('Dépendances trouvées:', dependencies);
                const installCommand = `npm install ${dependencies.join(' ')}`; // Génère la commande d'installation
                console.log(`Exécution de : ${installCommand}`);
                await execPromise(installCommand, { cwd: folderPath }); // Exécute la commande pour installer les dépendances
            }

            // Génère la configuration Webpack et crée le bundle
            this.generateWebpackConfig(folderPath);
            await execPromise('npx webpack', { cwd: folderPath }); // Exécute Webpack pour générer le bundle

            return {
                bundlePath: path.join(distPath, 'bundle.js'), // Chemin du fichier bundle généré
                folderPath // Retourne également le chemin du dossier temporaire
            };
        } catch (error) {
            throw new Error(`Erreur lors de la génération du bundle: ${error.message}`); // Gestion des erreurs
        }
    }
}

module.exports = BundleGenerator; // Export de la classe pour l'utiliser ailleurs
