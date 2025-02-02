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
        this.TEMP_DIR = tempDir; 
        this.num_req = 0; 
        this.initTempDirectory(); 
    }

    initTempDirectory() { // créer le tempdir en fonction de ce qui est appelé dans le bundleCLI.js
        if (fs.existsSync(this.TEMP_DIR)) {
            fs.rmSync(this.TEMP_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(this.TEMP_DIR, { recursive: true });
    }

    findDependencies(sourceCode) {
        const patterns = [
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /import\s+(?:[\w*\s{},]*)\s+from\s+['"]([^'"]+)['"]/g,
            /import\s+['"]([^'"]+)['"]/g
        ];
        
        const dependencies = new Set();
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(sourceCode)) !== null) {
                const dependency = match[1];
                if (!dependency.startsWith('.') && !dependency.startsWith('/')) {
                    const mainPackage = dependency.split('/')[0];
                    dependencies.add(mainPackage);
                }
            }
        });
        
        return Array.from(dependencies);
    }

    generateWebpackConfig(folderPath) {
        const webpackConfig = `

            const path = require('path');

            module.exports = {
                mode: 'development',            // ATTENTION : Mode développement pour éviter le threeshaking
                entry: './src/index.js',        // Votre fichier source
                output: {
                    path: path.resolve(__dirname, 'dist'),
                    filename: 'bundle.js',
                    library: {
                        type: 'module',         // Définit le type de module, utilise des exports 
                    },
                },
                experiments: {
                    outputModule: true,         // Active les exports ES6
                },
                optimization: {
                    usedExports: false,         // Tous les exports sont conservés, même ceux qui ne sont pas utilisés
                    minimize: false,            // Facilite le debugage car fichier non minifié
                    concatenateModules: false,  // Désactive la fusion des modules
                    sideEffects: false          //évite que Webpack supprime du code supposé inutile
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
        fs.writeFileSync(path.join(folderPath, 'webpack.config.js'), webpackConfig);
    }

    async generateBundle(sourceCode) {
        try {
            this.num_req++; // pas réellement besoin si 1 seul precessus
            const folder = `bundle${this.num_req}`;
            const folderPath = path.join(this.TEMP_DIR, folder);
            const srcPath = path.join(folderPath, 'src');
            const distPath = path.join(folderPath, 'dist');

            // repertoires
            fs.mkdirSync(srcPath, { recursive: true });
            fs.mkdirSync(distPath, { recursive: true });
            fs.writeFileSync(path.join(srcPath, 'index.js'), sourceCode);

            // inst dépendances
            const dependencies = this.findDependencies(sourceCode);
            if (dependencies.length > 0) {
                console.log('Dépendances trouvées:', dependencies);
                const installCommand = `npm install ${dependencies.join(' ')}`;
                console.log(`Exécution de : ${installCommand}`);
                await execPromise(installCommand, { cwd: folderPath });
            }

            // génère conf webpack et bundle
            this.generateWebpackConfig(folderPath);
            await execPromise('npx webpack', { cwd: folderPath });

            return {
                bundlePath: path.join(distPath, 'bundle.js'),
                folderPath
            };
        } catch (error) {
            throw new Error(`Erreur lors de la génération du bundle: ${error.message}`);
        }
    }
}

module.exports = BundleGenerator; // exporte la classe pour pouvoir l'utiliser dans bundleCLI.js