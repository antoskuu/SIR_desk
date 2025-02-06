const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);

class BundleGenerator {
    constructor(tempDir) {
        // S'assure que le chemin est relatif au répertoire courant
        this.TEMP_DIR = path.join(process.cwd(), tempDir);
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
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    optimization: {
        minimize: false,
        concatenateModules: false,
        sideEffects: false
    },
    module: {
        rules: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }
        ]
    }
};`;
        fs.writeFileSync(path.join(folderPath, 'webpack.config.js'), webpackConfig.trim());
    }

    async generateBundle(sourceCode) {
        try {
            // Crée un sous-dossier 'bundle' dans le dossier temporaire
            const folderPath = path.join(this.TEMP_DIR, 'bundle');
            const srcPath = path.join(folderPath, 'src');
            const distPath = path.join(folderPath, 'dist');

            // Crée la structure de dossiers
            fs.mkdirSync(folderPath, { recursive: true });
            fs.mkdirSync(srcPath, { recursive: true });
            fs.mkdirSync(distPath, { recursive: true });

            // Initialise un package.json vide
            const packageJson = {
                name: "temp-bundle",
                version: "1.0.0",
                private: true
            };
            fs.writeFileSync(
                path.join(folderPath, 'package.json'),
                JSON.stringify(packageJson, null, 2)
            );

            // Écrit le code source
            fs.writeFileSync(path.join(srcPath, 'index.js'), sourceCode);

            // Installe les dépendances
            const dependencies = this.findDependencies(sourceCode);
            if (dependencies.length > 0) {
                console.log('Dépendances trouvées:', dependencies);
                // Ajoute webpack et babel en tant que devDependencies
                const devDependencies = [
                    'webpack',
                    'webpack-cli',
                    '@babel/core',
                    '@babel/preset-env',
                    'babel-loader'
                ];
                
                const installCommand = `npm install ${dependencies.join(' ')} && npm install -D ${devDependencies.join(' ')}`;
                console.log(`Exécution de : ${installCommand}`);
                await execPromise(installCommand, { cwd: folderPath });
            }

            // Crée le fichier de configuration Babel
            const babelConfig = {
                "presets": ["@babel/preset-env"]
            };
            fs.writeFileSync(
                path.join(folderPath, '.babelrc'),
                JSON.stringify(babelConfig, null, 2)
            );
            
            // Génère la configuration Webpack
            this.generateWebpackConfig(folderPath);
            
            // Exécute Webpack
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

module.exports = BundleGenerator;
