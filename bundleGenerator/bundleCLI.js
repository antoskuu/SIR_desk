#!/usr/bin/env node
/*
L'interface en ligne de commande (gère exécutable) :
    - Parse les arguments
    - Gère les entrées/sorties
    - Utilise BundleGenerator pour le traitement
*/

const fs = require('fs'); // Module pour manipuler les systèmes de fichiers
const path = require('path'); // Module pour travailler avec les chemins de fichiers
const BundleGenerator = require('./bundleGenerator'); // Importe la classe BundleGenerator

// Fonction principale exécutée lors de l'appel du script
async function main() {
    try {
        // Vérifie si un argument a été passé au script (chemin vers le fichier source)
        if (process.argv.length < 2) {
            console.error('Usage: bundle-cli <chemin-fichier-source-du-client>');
            process.exit(1); // Quitte le programme en cas d'argument manquant
        }

        // Résout le chemin absolu du fichier source
        const sourcePath = path.resolve(process.argv[2]);

        // Vérifie si le fichier source existe
        if (!fs.existsSync(sourcePath)) {
            console.error(`Le fichier source ${sourcePath} n'existe pas`);
            process.exit(1); // Quitte le programme si le fichier n'existe pas
        }

        // Lit le contenu du fichier source en tant que texte brut
        const sourceCode = fs.readFileSync(sourcePath, 'utf-8'); 

        // Crée un répertoire temporaire pour la génération du bundle
        const tempDir = path.resolve(__dirname, 'temp');
        const generator = new BundleGenerator(tempDir); // Crée une instance de BundleGenerator

        console.log('Génération du bundle en cours...');
        // Appelle la méthode pour générer le bundle
        const { bundlePath } = await generator.generateBundle(sourceCode);

        console.log(`Bundle généré avec succès dans ${bundlePath}`); // Affiche le chemin du bundle généré
    } catch (error) {
        console.error('Erreur:', error.message); // Affiche les erreurs en cas d'échec
        process.exit(1); // Quitte le programme en cas d'erreur
    }
}

// Exécute la fonction principale
main();
