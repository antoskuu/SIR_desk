#!/usr/bin/env node
/*
L'interface en ligne de commande (gère excutable) : 
    - Parse les arguments
    - Gère les entrées/sorties
    - Utilise BundleGenerator pour le traitement
*/

const fs = require('fs');
const path = require('path');
const BundleGenerator = require('./bundleGenerator');

async function main() {
    try {
        if (process.argv.length < 2) {
            console.error('Usage: bundle-cli <chemin-fichier-source-du-client>');
            process.exit(1);
        }

        const sourcePath = path.resolve(process.argv[2]);

        if (!fs.existsSync(sourcePath)) { // si fichier src n'existe pas
            console.error(`Le fichier source ${sourcePath} n'existe pas`);
            process.exit(1);
        }

        const sourceCode = fs.readFileSync(sourcePath, 'utf-8'); // met le code src dans une variable en txt brut

        const tempDir = path.resolve(__dirname, 'temp');
        const generator = new BundleGenerator(tempDir);

        console.log('Génération du bundle en cours...');
        const { bundlePath } = await generator.generateBundle(sourceCode);


        console.log(`Bundle généré avec succès dans ${bundlePath}`);
    } catch (error) {
        console.error('Erreur:', error.message);
        process.exit(1);
    }
}

main();