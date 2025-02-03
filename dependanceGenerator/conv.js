const fs = require('fs');

function generateImportsFromConfig(configPath, outputPath) {
  try {
    // Lire le fichier de configuration
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    let importCode = '';

    // Traiter chaque importation
    config.imports.forEach(imp => {
      switch (imp.type) {
        case 'default':
          // import defaultExport from 'module';
          importCode += `import ${imp.name} from '${imp.path}';\n`;
          importCode += `window.${imp.name} = ${imp.name};\n`;
          break;

        case 'namespace':
          // import * as name from 'module';
          importCode += `import * as ${imp.name} from '${imp.path}';\n`;
          importCode += `window.${imp.name} = ${imp.name};\n`;
          break;

        case 'named':
          // import { export1, export2 } from 'module';
          if (Array.isArray(imp.names)) {
            const namedImports = imp.names.map(name => {
              if (typeof name === 'object') {
                // Gestion des alias: { export1 as alias1 }
                return `${name.original} as ${name.as}`;
              } else {
                return name;
              }
            }).join(', ');

            importCode += `import { ${namedImports} } from '${imp.path}';\n`;
            imp.names.forEach(name => {
              if (typeof name === 'object') {
                importCode += `window.${name.as} = ${name.as};\n`;
              } else {
                importCode += `window.${name} = ${name};\n`;
              }
            });
          } else {
            importCode += `import { ${imp.names} } from '${imp.path}';\n`;
            importCode += `window.${imp.names} = ${imp.names};\n`;
          }
          break;

        case 'direct':
          // import 'module';
          importCode += `import '${imp.path}';\n`;
          break;

        case 'mixed':
          // import defaultExport, { export1, export2 } from 'module';
          const namedPart = imp.named.map(name => {
            if (typeof name === 'object') {
              return `${name.original} as ${name.as}`;
            } else {
              return name;
            }
          }).join(', ');

          importCode += `import ${imp.default}, { ${namedPart} } from '${imp.path}';\n`;
          importCode += `window.${imp.default} = ${imp.default};\n`;
          imp.named.forEach(name => {
            if (typeof name === 'object') {
              importCode += `window.${name.as} = ${name.as};\n`;
            } else {
              importCode += `window.${name} = ${name};\n`;
            }
          });
          break;

        default:
          throw new Error(`Type d'importation non supporté: ${imp.type}`);
      }
    });

    fs.writeFileSync(outputPath, importCode);
    console.log(`Fichier généré avec succès: ${outputPath}`);
  } catch (error) {
    console.error('Erreur lors de la génération:', error.message);
    throw error;
  }
}

// Exemple d'appel
generateImportsFromConfig('./dep.json', './out.js');
