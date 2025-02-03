/*
La classe principale qui gère toute la logique de traitement :
    - Détection des dépendances
    - Installation des packages NPM
    - Génération de la configuration webpack
    - Création du bundle
*/

const fs = require('fs'); 
const path = require('path');
const util = require('util'); 
const { exec } = require('child_process');
const execPromise = util.promisify(exec);

class BundleGenerator {
    constructor(tempDir) { // tempDir > chemin du répertoire temporaire
        this.TEMP_DIR = tempDir; // Sauvegarde du répertoire temporaire
        this.initTempDirectory(); // Initialise le répertoire temporaire
    }

    // Crée un répertoire temporaire, en supprimant s'il existe déjà
    initTempDirectory() {
        if (fs.existsSync(this.TEMP_DIR)) {
            fs.rmSync(this.TEMP_DIR, { recursive: true, force: true }); // Supprime le répertoire existant
        }
        fs.mkdirSync(this.TEMP_DIR, { recursive: true }); // Crée un nouveau répertoire
    }

    // Trouve toutes les dépendances dans le code source (via des expressions régulières)
    findDependencies(sourceCode) {
        const patterns = [
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // Regex pour require()
            /import\s+(?:[\w*\s{},]*)\s+from\s+['"]([^'"]+)['"]/g, // Regex pour import ... from
            /import\s+['"]([^'"]+)['"]/g // Regex pour import ...
        ];
        
        const dependencies = new Set(); // Utilisation d'un Set pour éviter les doublons

        // Applique chaque pattern pour extraire les dépendances
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(sourceCode)) !== null) {
                const dependency = match[1];
                if (!dependency.startsWith('.') && !dependency.startsWith('/')) { // Ignore les chemins relatifs
                    const mainPackage = dependency.split('/')[0]; // Extrait le nom du package
                    dependencies.add(mainPackage);
                }
            }
        });
        
        return Array.from(dependencies); // Retourne un tableau des dépendances uniques
    }

    // Génère le fichier de configuration Webpack pour le bundle
    generateWebpackConfig(folderPath) {
        const webpackConfig = `

            const path = require('path');

            module.exports = {
                mode: 'development',            // ATTENTION : Mode développement pour éviter le threeshaking
                entry: './src/index.js',        // Votre fichier source
                output: {
                    path: path.resolve(__dirname, 'dist'),
                    filename: 'bundle.js',
                },
                optimization: {
                    minimize: false,            // Facilite le debugage car fichier non minifié
                    concatenateModules: false,  // Désactive la fusion des modules
                    sideEffects: false          // évite que Webpack supprime du code supposé inutile
                },
                module: {
                    rules: [
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader' // Utilise Babel pour la compatibilité avec les anciens navigateurs
                        }
                    }
                    ]
                }
            };
        `;
        // Écrit la configuration dans un fichier
        fs.writeFileSync(path.join(folderPath, 'webpack.config.js'), webpackConfig);
    }

    // Génère le bundle en installant les dépendances et en exécutant Webpack
    async generateBundle(sourceCode) {
        try {
            const folder = 'bundle'; // Crée un nom unique pour le dossier
            const folderPath = path.join(this.TEMP_DIR, folder); // Chemin du dossier temporaire
            const srcPath = path.join(folderPath, 'src');
            const distPath = path.join(folderPath, 'dist');

            // Crée les répertoires nécessaires
            fs.mkdirSync(srcPath, { recursive: true });
            fs.mkdirSync(distPath, { recursive: true });
            // Écrit le code source dans le dossier 'src'
            fs.writeFileSync(path.join(srcPath, 'index.js'), sourceCode);

            // Trouve et installe les dépendances nécessaires
            const dependencies = this.findDependencies(sourceCode);
            if (dependencies.length > 0) {
                console.log('Dépendances trouvées:', dependencies);
                const installCommand = `npm install ${dependencies.join(' ')}`;
                console.log(`Exécution de : ${installCommand}`);
                await execPromise(installCommand, { cwd: folderPath }); // Exécute l'installation des dépendances
            }

            // Génère la configuration Webpack
            this.generateWebpackConfig(folderPath);
            // Exécute Webpack pour générer le bundle
            await execPromise('npx webpack', { cwd: folderPath });

            // Retourne le chemin du bundle généré
            return {
                bundlePath: path.join(distPath, 'bundle.js'),
                folderPath
            };
        } catch (error) {
            throw new Error(`Erreur lors de la génération du bundle: ${error.message}`);
        }
    }
}

module.exports = BundleGenerator; // Exporte la classe pour l'utiliser dans d'autres fichiers
