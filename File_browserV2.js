qx.Class.define("myapp.FileExplorer", {
  extend: qx.core.Object,

  construct: function() {
    this.base(arguments);
    this.rootPath = "data";
    this.roots = ["home", "data", "demos", "code"];
    this.currentPath = this.rootPath;
    this.PAGE_SIZE = 100;
    this.currentPage = 0;
    this.totalFiles = [];
    this.pathHistory = [];
    this.grid = new qx.ui.container.Composite(new qx.ui.layout.Flow(10, 10));
    this.breadcrumbBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(5)).set({
    padding: [0, 10],
    allowGrowX: true,
  });
    this.showHiddenFiles = false; // Par défaut, on ne montre pas les fichiers cachés
  },

  members: {
    // Méthodes de la classe
    createWindow: function() {
      const win = new qx.ui.window.Window("File Explorer");
      win.setWidth(800);
      win.setHeight(600);
      win.setLayout(new qx.ui.layout.VBox(10));
      win.setShowMinimize(false);
      win.setShowMaximize(true);
      win.setAllowClose(true);

      return win;
    },

    createTopBar: function(win) {
      const topBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      this.breadcrumbBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(5)).set({
        padding: [0, 10],
        allowGrowX: true,
      });
      topBar.add(this.breadcrumbBar, { flex: 1 });
      win.add(topBar);
    },

    async loadFiles(path) {
  // Normaliser le chemin pour éviter les doublons (comme /home/sow/desk/data/data)
  const normalizedPath = path.replace(/\/+/g, "/").replace(/\/$/, "");
  console.log(`Chargement des fichiers pour : ${normalizedPath}`);

  try {
    const result = await desk.FileSystem.readDirAsync(normalizedPath);
    this.totalFiles = result.map((file) => ({
      name: file.name,
      path: `${normalizedPath}/${file.name}`,
      size: file.size,
      isDirectory: file.isDirectory,
    }));
    this.currentPath = normalizedPath; // Mettez à jour avec le chemin normalisé
    this.currentPage = 0;

    this.updateBreadcrumb(normalizedPath); // Met à jour le breadcrumb
    this.refreshFiles(); // Recharge avec filtre des fichiers
  } catch (error) {
    console.error(`Erreur lors du chargement des fichiers pour : ${normalizedPath}`, error);
  }
},

    refreshFiles: function() {
  const filteredFiles = this.totalFiles.filter((file) => {
    if (!this.showHiddenFiles) {
      return !file.name.startsWith("."); // Exclut les fichiers cachés
    }
    return true;
  });

  this.updateGrid(filteredFiles); // Mets à jour la grille
  this.updateStatusBar(filteredFiles); // Mets à jour la barre d'état
  this.updatePaginationBar(); // Mets à jour la pagination
},

    loadCurrentPage: function() {
      const startIndex = this.currentPage * this.PAGE_SIZE;
      const endIndex = startIndex + this.PAGE_SIZE;
      const paginatedFiles = this.totalFiles.slice(startIndex, endIndex);

      this.updateGrid(paginatedFiles);
    },

    updateGrid: function(items) {
      this.grid.removeAll();
      items.forEach((item) => {
        const gridItem = this.createGridItem(item);
        this.grid.add(gridItem);
      });
    },

    createGridItem: function(item) {
      const itemContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox(5)).set({
        width: 80,
        height: 100,
        padding: 0,
        decorator: null,
        backgroundColor: null,
      });

      const icon = new qx.ui.basic.Image(item.isDirectory ? "data/Ressources_ui/icons8.png" : "data/Ressources_ui/icons8-file.png").set({
        width: 48,
        height: 48,
        scale: true,
      });

      const label = new qx.ui.basic.Label(item.name).set({
        rich: true,
        wrap: true,
        textAlign: "center",
      });

      itemContainer.add(icon);
      itemContainer.add(label);
      
      itemContainer.addListener("contextmenu", (e) => {
      e.preventDefault(); // Empêche l'affichage du menu contextuel par défaut du navigateur
      const menu = this.createContextMenu(item);
      menu.openAtPointer(e); // Ouvre le menu au pointeur de la souris
    });

      itemContainer.addListener("dblclick", async () => {
        if (item.isDirectory) {
          this.pathHistory.push(this.currentPath);
          this.currentPath = item.path;
          await this.loadFiles(item.path);
        } else {
          this.handleFile(item.path);
        }
      });

      return itemContainer;
    },

    handleFile: function(file) {
  const extension = desk.FileSystem.getFileExtension(file);

  switch (extension) {
    case "js":
      if (desk.Actions.getInstance().getSettings().permissions) {
        desk.FileSystem.executeScript(file);
      } else {
        desk.Ace.TabbedEditor.open(file);
      }
      break;

    case "log":
    case "txt":
    case "cpp":
    case "cxx":
    case "h":
    case "py":
      desk.Ace.TabbedEditor.open(file);
      break;

    case "vtk":
    case "ply":
    case "obj":
    case "stl":
    case "ctm":
    case "off":
      new desk.THREE.Viewer(file);
      break;

    case "xml":
      desk.FileSystem.readFile(file, (error, xmlDoc) => {
        xmlDoc = new DOMParser().parseFromString(xmlDoc, "text/xml");
        if (xmlDoc.getElementsByTagName("mesh").length !== 0) {
          new desk.THREE.Viewer(file);
        } else {
          console.log("xml file of unknown type!");
        }
      });
      break;

    case "gz":
      if (file.split(".").slice(-2).join(".") !== "nii.gz") break;

    case "png":
    case "jpg":
    case "bmp":
    case "mhd":
    case "nii":
    case "hdr":
    case "tif":
      new desk.MPR.Viewer(file);
      break;

    case "vol":
      if (desk.Actions.getInstance().getAction("vol_slice") != null) {
        new desk.MPR.Viewer(file);
      } else {
        console.log("vol_slice action does not exist. Skipping this filetype handler.");
      }
      break;

    case "json":
      desk.Action.CREATEFROMFILE(file);
      break;

    default:
      console.log("No file handler exists for extension " + extension);
      break;
  }
},

    updateStatusBar: function(items) {
      const numFiles = items.filter((item) => !item.isDirectory).length;
      const numFolders = items.filter((item) => item.isDirectory).length;
      const totalSize = items.reduce((acc, item) => acc + (item.size || 0), 0);
    
      // Utilisation de this.statusBar
      this.statusBar.setValue(`
        <b>${numFiles}</b> fichiers | 
        <b>${numFolders}</b> dossiers | 
        Taille totale : <b>${(totalSize / 1024).toFixed(2)} KB</b>
      `);
},

    updateBreadcrumb: function(path) {
  // Réinitialise le breadcrumb
  this.breadcrumbBar.removeAll();

  // Divise le chemin en segments
  const parts = path.split("/");
  let cumulativePathArray = [];

  parts.forEach((part, index) => {
    if (!part) return; // Ignore les parties vides dans le chemin

    // Ajoute le segment au tableau cumulatif
    cumulativePathArray.push(part);
    const cumulativePath = cumulativePathArray.join("/");
   
    
    

    // Crée un bouton cliquable pour chaque segment
    const button = new qx.ui.form.Button(part).set({
      padding: [2, 5],
      allowGrowX: false,
      toolTipText: `Aller à : ${cumulativePath}`, // Info-bulle
    });

    // Navigue au clic avec gestion des erreurs
    button.addListener("execute", async () => {
      try {
        this.currentPath = cumulativePath; // Met à jour le chemin actuel
        console.log(`Navigating to: ${this.currentPath}`);
        await this.loadFiles(this.currentPath); // Recharge les fichiers
      } catch (error) {
        console.error(`Erreur lors du chargement du répertoire : ${this.currentPath}`, error);
        qx.log.Logger.error(`Erreur lors de la navigation vers : ${this.currentPath}`);
      }
    });
    
    

    // Ajoute le bouton au breadcrumb
    this.breadcrumbBar.add(button);

    // Ajoute un séparateur ">" entre les segments, sauf pour le dernier
    if (index < parts.length - 1) {
      const separator = new qx.ui.basic.Label(">").set({
        padding: [0, 5],
        rich: true,
      });
      this.breadcrumbBar.add(separator);
    }
  });
},

    loadCurrentPage: function() {
  // Calcul des indices pour la pagination
  const startIndex = this.currentPage * this.PAGE_SIZE;
  const endIndex = startIndex + this.PAGE_SIZE;

  // Découpe les fichiers pour la page actuelle
  const paginatedFiles = this.totalFiles.slice(startIndex, endIndex);

  // Met à jour l'interface
  this.updateGrid(paginatedFiles); // Met à jour la grille
  this.updateStatusBar(paginatedFiles); // Met à jour la barre d'état
  this.updatePaginationBar(); // Met à jour la barre de pagination
},

    updatePaginationBar: function() {
  try {
    const totalPages = Math.ceil(this.totalFiles.length / this.PAGE_SIZE);

    // Vérifie que `paginationLabel` existe avant de l'utiliser
    if (this.paginationLabel) {
      this.paginationLabel.setValue(`Page ${this.currentPage + 1} / ${totalPages}`);
    } else {
      console.error("paginationLabel is not defined");
    }

    // Active/désactive les boutons en fonction de la page actuelle
    this.prevPageButton.setEnabled(this.currentPage > 0);
    this.nextPageButton.setEnabled(this.currentPage < totalPages - 1);

    // Masque ou affiche la barre de pagination selon le nombre total de pages
    if (this.paginationBar) {
      if (totalPages <= 1) {
        this.paginationBar.exclude(); // Cache la barre
      } else {
        this.paginationBar.show(); // Affiche la barre
      }
    }
  } catch (error) {
    console.error("Erreur dans updatePaginationBar:", error);
  }
},

    createRootBar: function() {
  const rootBar = new qx.ui.container.Composite(new qx.ui.layout.VBox(10));

  // Récupère les racines dynamiques depuis `desk.Actions`
  const dataDirs = desk.Actions.getInstance().getSettings().dataDirs;

  // Sépare les racines principales et les autres
  const primaryRoots = [];
  const otherRoots = [];

  Object.keys(dataDirs).forEach((key) => {
    const dirInfo = dataDirs[key];
    const dirPath = typeof dirInfo === "string" ? dirInfo : dirInfo.path;
    const isHidden = dirInfo.hidden;

    if (!isHidden) {
      primaryRoots.push({ name: key, path: dirPath });
    } else {
      otherRoots.push({ name: key, path: dirPath });
    }
  });

  // Création des boutons pour les racines principales
  primaryRoots.forEach((root) => {
    const button = new qx.ui.form.Button(root.name).set({
      allowGrowX: true,
      padding: [5, 10],
    });

    button.addListener("execute", async () => {
      const normalizedPath = root.path.replace(/\/+/g, "/").replace(/\/$/, "");

      console.log(`✅ Changement de racine : ${root.name}`);
      console.log(`📂 Normalized Path: ${normalizedPath}`);

      // ✅ Fix : Réinitialise correctement `currentPath` et le `breadcrumbBar`
      this.pathHistory = []; // Efface l'historique pour repartir proprement
      this.currentPath = normalizedPath;
      this.breadcrumbBar.removeAll(); // Nettoie le breadcrumb avant d’en créer un nouveau

      await this.loadFiles(root.name);//ICI l'eereur
    });

    rootBar.add(button);
  });

  // Ajoute un bouton pour afficher le menu contextuel des autres racines
  if (otherRoots.length > 0) {
    const moreButton = new qx.ui.form.Button("More...").set({
      allowGrowX: true,
      padding: [5, 10],
    });

    const contextMenu = new qx.ui.menu.Menu();
    otherRoots.forEach((root) => {
      const menuButton = new qx.ui.menu.Button(root.name);
      menuButton.addListener("execute", async () => {
        const normalizedPath = root.path.replace(/\/+/g, "/").replace(/\/$/, "");

        console.log(`✅ Changement de racine : ${root.name}`);
        console.log(`📂 Normalized Path: ${normalizedPath}`);

        // ✅ Fix : Réinitialise `currentPath` et le `breadcrumbBar` avant de charger
        this.pathHistory = [];
        this.currentPath = normalizedPath;
        this.breadcrumbBar.removeAll();

        await this.loadFiles(normalizedPath);
      });

      contextMenu.add(menuButton);
    });

    moreButton.addListener("pointerdown", (e) => {
      contextMenu.openAtPointer(e);
    });

    rootBar.add(moreButton);
  }

  return rootBar;
},

    createContextMenu: function(item) {
  const menu = new qx.ui.menu.Menu();

  // CheckBox pour afficher/masquer les fichiers cachés
  const hideButton = new qx.ui.menu.CheckBox("Show hidden files");
  hideButton.setValue(this.showHiddenFiles); // Synchronisation avec l'état actuel
  hideButton.setToolTipText("Enable this to see hidden files");
  hideButton.addListener("changeValue", (event) => {
    this.showHiddenFiles = event.getData();
    this.refreshFiles(); // Recharge les fichiers avec le nouvel état
  });
  menu.add(hideButton);

  // Option "Ouvrir"
  const openButton = new qx.ui.menu.Button("Ouvrir");
  openButton.addListener("execute", () => {
    console.log(`Ouverture de l'élément : ${item.name}`);
    this.handleFile(item.path);
  });
  menu.add(openButton);

  // Option "Open in a New Window"
  const openInNewWindowButton = new qx.ui.menu.Button("Open in a New Window");
  openInNewWindowButton.addListener("execute", () => {
    this.openInNewWindow(item);
  });
  menu.add(openInNewWindowButton);

  // Actions dynamiques (bouton "Utils")
  const actionButton = new qx.ui.menu.Button("Utils");
  const actionMenu = new qx.ui.menu.Menu();

  const actions = [
    { label: "OOC Volume viewer", callback: () => this.OOCViewAction(item) },
    { label: "Download", callback: () => this.downloadAction(item) },
    { label: "Upload", callback: () => this.uploadAction(item) },
    { label: "View/Edit Text", callback: () => this.viewEditAction(item) },
    { label: "New Directory", callback: () => this.createNewDirectory(item) },
    { label: "Delete", callback: () => this.deleteAction(item) },
    { label: "Rename", callback: () => this.renameFileOrDirectory(item) },
    { label: "New File", callback: () => this.newFileAction(item) },
    { label: "Properties", callback: () => this.propertiesAction(item) }
  ];

  actions.forEach((action) => {
    const actionItem = new qx.ui.menu.Button(action.label);
    actionItem.addListener("execute", action.callback);
    actionMenu.add(actionItem);
  });

  actionButton.setMenu(actionMenu);
  menu.addSeparator();
  menu.add(actionButton);

  // Menu "Actions" (basé sur les librairies et actions de desk)
  const actionsByLibButton = new qx.ui.menu.Button("Actions");
  const actionsByLibMenu = new qx.ui.menu.Menu();

  // Récupère toutes les actions de Desk
  const deskActions = desk.Actions.getInstance().__P_6_12.actions;

  // Grouper les actions par "lib"
  const groupedByLib = {};
  for (const actionKey in deskActions) {
    const action = deskActions[actionKey];
    if (!action.lib) continue; // Ignore les actions sans lib
    if (!groupedByLib[action.lib]) {
      groupedByLib[action.lib] = [];
    }
    groupedByLib[action.lib].push({ key: actionKey, action: action });
  }

  // Crée un bouton pour chaque "lib"
  for (const lib in groupedByLib) {
    const libMenu = new qx.ui.menu.Menu();

    // Crée un bouton pour chaque action de la "lib"
    groupedByLib[lib].forEach(({ key: actionKey, action }) => {
      const actionLabel = actionKey; // Utilise le nom de l'objet (clé) comme label
      const actionButton = new qx.ui.menu.Button(actionLabel);
      actionButton.addListener("execute", () => {
        console.log(`Exécution de l'action : ${actionLabel}`);
        this.launchAction(actionKey, item.path); // Appelle `launchAction` avec la clé de l'action et le chemin du fichier
      });
      libMenu.add(actionButton);
    });

    // Bouton pour la "lib"
    const libButton = new qx.ui.menu.Button(lib);
    libButton.setMenu(libMenu);
    actionsByLibMenu.add(libButton);
  }

  actionsByLibButton.setMenu(actionsByLibMenu);
  menu.addSeparator();
  menu.add(actionsByLibButton);

  return menu;
},

/**
 * Lancer une action avec un fichier sélectionné
 * @param {String} actionName - Le nom (clé) de l'action à exécuter
 * @param {String} filePath - Le chemin du fichier sélectionné
 */
    launchAction: function(actionName, filePath) {
  try {
    const action = new desk.Action(actionName, { standalone: true });
    const settings = desk.Actions.getInstance().getSettings().actions[actionName];

    // Vérifie et applique les paramètres nécessaires
    const hasFileParam = _.some(settings.parameters, function(param) {
      if (param.type === "file" || param.type === "directory") {
        const parameters = {};
        parameters[param.name] = filePath;
        action.setParameters(parameters);
        return true;
      }
      return false;
    });

    if (hasFileParam) {
      action.setOutputDirectory("actions/");
      console.log(`Action "${actionName}" launched with file: ${filePath}`);
    } else {
      console.warn(`Action "${actionName}" does not support files.`);
    }
  } catch (error) {
    console.error(`Failed to launch action "${actionName}":`, error);
  }
},

    renameFileOrDirectory: function(node) {
  if (!node) {
    alert("Aucun fichier ou répertoire sélectionné !");
    return;
  }

  const file = node.path; // Utilisation du chemin complet
  const newFile = prompt("Entrez le nouveau nom :", desk.FileSystem.getFileName(file));

  if (newFile === null || newFile.trim() === "") {
    console.log("Action annulée ou nom invalide.");
    return;
  }

  const dir = desk.FileSystem.getFileDirectory(file);

  desk.Actions.execute(
    {
      action: "move",
      source: file,
      destination: `${dir}/${newFile}`,
    },
    () => {
      console.log(`Fichier renommé en : ${dir}/${newFile}`);
      this.loadFiles(dir); // Recharge le répertoire pour refléter les changements
    }
  );
},

    OOCViewAction: function(node) {
  if (!node.isDirectory) {
    new desk.MPR.Viewer(node.path, {
      ooc: true,
      format: 0,
      nbOrientations: 1,
    });
  } else {
    alert("Cannot view a directory!");
  }
},

    downloadAction: function(node) {
  if (!node.isDirectory) {
    desk.FileSystem.downloadFile(node.path);
  } else {
    alert("Cannot download a directory!");
  }
},

    uploadAction: function(node) {
  const dir = node.isDirectory ? node.path : desk.FileSystem.getFileDirectory(node.path);

  const uploader = new desk.Uploader(dir);
  uploader.addListener(
    "upload",
    _.throttle(() => {
      console.log(`Upload terminé dans : ${dir}`);
      this.loadFiles(this.currentPath); // Recharge le répertoire après l'upload
    }, 2000)
  );
},

    createNewDirectory: function(node) {
  const dir = node.isDirectory ? node.path : desk.FileSystem.getFileDirectory(node.path);
  const newDir = prompt("Entrez le nom du nouveau répertoire :", "new_dir");
  
  if (!newDir || newDir.trim() === "") {
    console.log("Action annulée ou nom invalide.");
    return;
  }

  desk.Actions.execute(
    {
      action: "create_directory",
      directory: `${dir}/${newDir.trim()}`,
    },
    () => {
      console.log(`Nouveau répertoire créé : ${dir}/${newDir}`);
      this.loadFiles(dir); // Recharge les fichiers pour inclure le nouveau répertoire
    }
  );
},

    deleteAction: function(node) {
  const nodes = [node]; // Simule une sélection avec un seul fichier/dossier
  let message = "Are you sure you want to delete the following file/directory? \n";

  const dirs = nodes.map((node) => {
    const file = node.path; // Utiliser `path` comme le chemin complet
    message += file + "\n";
    return desk.FileSystem.getFileDirectory(file);
  });

  if (!confirm(message)) return;

  async.each(
    nodes,
    (node, callback) => {
      desk.Actions.execute(
        {
          action: node.isDirectory ? "delete_directory" : "delete_file",
          file_name: node.path,
          directory: node.path,
        },
        callback
      );
    },
    (err) => {
      if (err) {
        console.error("Erreur lors de la suppression :", err);
      } else {
        console.log("Fichiers/dossiers supprimés.");
        dirs.forEach((dir) => this.loadFiles(dir)); // Recharge les répertoires concernés
      }
    }
  );
},

    newFileAction: function(node) {
  const dir = node.isDirectory ? node.path : desk.FileSystem.getFileDirectory(node.path);
  const baseName = prompt("Enter new file name:", "newFile");

  if (baseName !== null) {
    desk.FileSystem.writeFile(`${dir}/${baseName}`, "", () => {
      console.log(`Nouveau fichier créé : ${dir}/${baseName}`);
      this.loadFiles(dir); // Recharge le répertoire pour refléter les changements
    });
  }
},

    viewEditAction: function(node) {
  if (!node.isDirectory) {
    desk.Ace.TabbedEditor.open(node.path);
    console.log(`Éditeur ouvert pour le fichier : ${node.path}`);
  } else {
    console.log("Impossible d'éditer un répertoire !");
  }
},

    sortFiles: function(criteria) {
  const sortedItems = [...this.grid.getChildren()].map((itemContainer) => {
    const label = itemContainer.getChildren()[1]; // Le label contenant le nom
    const icon = itemContainer.getChildren()[0]; // L'icône pour identifier type
    return {
      name: label.getValue(),
      isDirectory: icon.getSource().includes("folder"),
      size: itemContainer.size || 0, // Ajouter la taille si disponible
      container: itemContainer,
    };
  });

  // Appliquer le tri selon le critère sélectionné
  sortedItems.sort((a, b) => {
    switch (criteria) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "type-folders-first":
        return b.isDirectory - a.isDirectory || a.name.localeCompare(b.name);
      case "type-files-first":
        return a.isDirectory - b.isDirectory || a.name.localeCompare(b.name);
      case "size-asc":
        return a.size - b.size;
      case "size-desc":
        return b.size - a.size;
      default:
        return 0;
    }
  });

  // Mettre à jour la grille avec l'ordre trié
  this.grid.removeAll();
  sortedItems.forEach((item) => this.grid.add(item.container));
},

    openInNewWindow: function(item) {
  const newExplorer = new myapp.FileExplorer();

  // ✅ Détermine le chemin initial (dossier ou chemin actuel)
  const initialPath = item.isDirectory ? item.path : this.currentPath;

  // ✅ Crée une nouvelle fenêtre
  const win = new qx.ui.window.Window(`Explorer: ${item.name}`);
  win.setWidth(800);
  win.setHeight(600);
  win.setLayout(new qx.ui.layout.VBox());

  // ✅ Crée le SplitPane
  const splitPane = new qx.ui.splitpane.Pane("horizontal");

  // ✅ Barre latérale (Root Bar)
 const rootBarContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox(10).set({ alignX: "left" })).set({
        padding: 15 // Ajout d'un margin pour séparer la rootBar du splitPane
      });
  const rootBar = newExplorer.createRootBar();
  rootBarContainer.add(rootBar, { flex: 1 });
  splitPane.add(rootBarContainer, 0);

  // ✅ Conteneur principal pour le contenu
  const mainContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox(10).set({ alignY: "top" })).set({
        padding: 10 // Ajout de padding pour espacer la grille à droite
      });

  // ✅ Barre supérieure avec le breadcrumb
  const topBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
  newExplorer.breadcrumbBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(5)).set({
    padding: [0, 10],
    allowGrowX: true,
  });
  topBar.add(newExplorer.breadcrumbBar, { flex: 1 });
  mainContainer.add(topBar);

  // ✅ Conteneur scrollable pour afficher les fichiers
  const scroll = new qx.ui.container.Scroll();
  scroll.add(newExplorer.grid);
  mainContainer.add(scroll, { flex: 1 });

  // ✅ Barre d'état
  newExplorer.statusBar = new qx.ui.basic.Label("Chargement...").set({
    rich: true,
    padding: 5,
  });
  mainContainer.add(newExplorer.statusBar);

  // ✅ Barre de pagination
  const paginationBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(10).set({ alignX: "center" }));
  newExplorer.prevPageButton = new qx.ui.form.Button("Page Précédente").set({ enabled: false });
  newExplorer.nextPageButton = new qx.ui.form.Button("Page Suivante").set({ enabled: false });
  newExplorer.paginationLabel = new qx.ui.basic.Label("Page 1 / 1");

  newExplorer.prevPageButton.addListener("execute", () => {
    if (newExplorer.currentPage > 0) {
      newExplorer.currentPage--;
      newExplorer.loadCurrentPage();
    }
  });

  newExplorer.nextPageButton.addListener("execute", () => {
    const totalPages = Math.ceil(newExplorer.totalFiles.length / newExplorer.PAGE_SIZE);
    if (newExplorer.currentPage < totalPages - 1) {
      newExplorer.currentPage++;
      newExplorer.loadCurrentPage();
    }
  });

  paginationBar.add(newExplorer.prevPageButton);
  paginationBar.add(newExplorer.paginationLabel);
  paginationBar.add(newExplorer.nextPageButton);
  mainContainer.add(paginationBar, { flex: 0 });

  // ✅ Associer la paginationBar pour `updatePaginationBar`
  newExplorer.paginationBar = paginationBar;

  // ✅ Ajoute le conteneur principal au SplitPane
  splitPane.add(mainContainer, 1);

  // ✅ Ajoute le SplitPane à la fenêtre
  win.add(splitPane, { flex: 1 });

  // ✅ Charge les fichiers initiaux (normalisation du chemin)
  const normalizedPath = initialPath.replace(/\/+/g, "/").replace(/\/$/, "");
  console.log(`📂 Ouverture dans nouvelle fenêtre : ${normalizedPath}`);

  newExplorer.loadFiles(normalizedPath);

  // ✅ Ajoute la fenêtre et l'ouvre
  const app = qx.core.Init.getApplication();
  app.getRoot().add(win, { left: 150, top: 100 });
  win.open();
},
    
    launchAction: function(actionName, filePath) {
  try {
    const action = new desk.Action(actionName, { standalone: true });
    const settings = desk.Actions.getInstance().getSettings().actions[actionName];

    // Vérifie et applique les paramètres nécessaires
    const hasFileParam = _.some(settings.parameters, function(param) {
      if (param.type === "file" || param.type === "directory") {
        const parameters = {};
        parameters[param.name] = filePath;
        action.setParameters(parameters);
        return true;
      }
      return false;
    });

    if (hasFileParam) {
      action.setOutputDirectory("actions/");
      console.log(`Action "${actionName}" launched with file: ${filePath}`);
    } else {
      console.warn(`Action "${actionName}" does not support files.`);
    }
  } catch (error) {
    console.error(`Failed to launch action "${actionName}":`, error);
  }
},
  }
});

(async function main() {
  const app = qx.core.Init.getApplication();

  const fileExplorer = new myapp.FileExplorer();

  // Crée le SplitPane
  const splitPane = new qx.ui.splitpane.Pane("horizontal");

  // Root Bar dans le panneau gauche
  const rootBarContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox(10).set({ alignX: "left" })).set({
        padding: 15 // Ajout d'un margin pour séparer la rootBar du splitPane
      });
  const rootBar = fileExplorer.createRootBar(); // Appel dynamique de la RootBar
  rootBarContainer.add(rootBar, { flex: 1 });
  splitPane.add(rootBarContainer, 0);

  // Conteneur principal pour le contenu
  const mainContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox(10).set({ alignY: "top" })).set({
        padding: 10 // Ajout de padding pour espacer la grille à droite
      });

  // Barre supérieure avec le breadcrumb
  const topBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
  fileExplorer.breadcrumbBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(5)).set({
    padding: [0, 10],
    allowGrowX: true,
  });
  topBar.add(fileExplorer.breadcrumbBar, { flex: 1 });
  mainContainer.add(topBar);

  // Conteneur scrollable pour les fichiers
  const scroll = new qx.ui.container.Scroll();
  scroll.add(fileExplorer.grid);
  mainContainer.add(scroll, { flex: 1 });

  // Barre d'état
  fileExplorer.statusBar = new qx.ui.basic.Label("Chargement...").set({
    rich: true,
    padding: 5,
  });
  mainContainer.add(fileExplorer.statusBar);

  // Ajoute la barre de pagination
  const paginationBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(10).set({ alignX: "center" }));
  fileExplorer.prevPageButton = new qx.ui.form.Button("Page Précédente").set({ enabled: false });
  fileExplorer.nextPageButton = new qx.ui.form.Button("Page Suivante").set({ enabled: false });
  fileExplorer.paginationLabel = new qx.ui.basic.Label("Page 1 / 1");

  paginationBar.add(fileExplorer.prevPageButton);
  paginationBar.add(fileExplorer.paginationLabel);
  paginationBar.add(fileExplorer.nextPageButton);

  // Associer la barre de pagination à l'instance FileExplorer
  fileExplorer.paginationBar = paginationBar;
  mainContainer.add(paginationBar);

  splitPane.add(mainContainer, 1); // Zone droite du SplitPane

  // Ajoute le SplitPane à la fenêtre principale
  const win = new qx.ui.window.Window("File Explorer");
  win.setWidth(800);
  win.setHeight(600);
  win.setLayout(new qx.ui.layout.VBox());
  win.add(splitPane, { flex: 1 });

  win.open();
  app.getRoot().add(win, { left: 100, top: 50 });

  // Charge les fichiers initiaux
  await fileExplorer.loadFiles(fileExplorer.rootPath);
})();