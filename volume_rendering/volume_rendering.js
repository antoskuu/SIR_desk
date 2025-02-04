const viewer = new desk.THREE.Viewer ({ orthographic : true });
let scene = viewer.getScene();
let volconfig = { clim1: 0, clim2: 1, renderstyle: 'iso', isothreshold: 0.15, colormap: 'viridis' };

const loader = new window.NRRDLoader(); 
// Chargement du fichier NRRD
loader.load(desk.FileSystem.getFileURL('data/stent.nrrd'), function (volume) {
    console.log("Fichier NRRD chargé avec succès !");
    const texture = new THREE.Data3DTexture(volume.data, volume.xLength, volume.yLength, volume.zLength);
        texture.format = THREE.RedFormat;
        texture.type = THREE.FloatType;
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;
        
        // Chargement des colormaps
    cmtextures = {
            viridis: new THREE.TextureLoader().load(desk.FileSystem.getFileURL('data/cm_viridis.png'), viewer.render()),
            gray: new THREE.TextureLoader().load(desk.FileSystem.getFileURL('data/cm_gray.png'), viewer.render())
        };
    const shader = VolumeRenderShader1;
    const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
// Création du matériau
        uniforms['u_data'].value = texture;
        uniforms['u_size'].value.set(volume.xLength, volume.yLength, volume.zLength);
        uniforms['u_clim'].value.set(volconfig.clim1, volconfig.clim2);
        uniforms['u_renderstyle'].value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
        uniforms['u_renderthreshold'].value = volconfig.isothreshold; // For ISO renderstyle
        uniforms['u_cmdata'].value = cmtextures[volconfig.colormap];
    
    material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            side: THREE.BackSide
        });
        
    
    const geometry = new THREE.BoxGeometry(volume.xLength, volume.yLength, volume.zLength);
    geometry.translate(volume.xLength / 2 - 0.5, volume.yLength / 2 - 0.5, volume.zLength / 2 - 0.5);

    const mesh = new THREE.Mesh(geometry, material);
    // Ajout du mesh à la scène
    scene.add(mesh);

    viewer.viewAll();
// Rendu de la scène
    viewer.render();
    
}, undefined, function (error) {
    console.error('Erreur lors du chargement du fichier NRRD :', error);
});
// Fonction pour mettre à jour les paramètres du matériau, et rerender la scène
function updateUniforms() {
    material.uniforms['u_clim'].value.set(volconfig.clim1, volconfig.clim2);
    material.uniforms['u_renderstyle'].value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
    material.uniforms['u_renderthreshold'].value = volconfig.isothreshold; // For ISO renderstyle
    material.uniforms['u_cmdata'].value = cmtextures[volconfig.colormap];
    viewer.render();
}


/// Partie GUI Qooxdoo

var win = new qx.ui.window.Window("Paramètres");
      win.setLayout(new qx.ui.layout.VBox());
      win.setWidth(300);
      win.setHeight(200);
      
// Etiquette
var label1 = new qx.ui.basic.Label("Clim 1");
      win.add(label1);
// Slider
var slider1 = new qx.ui.form.Slider().set({
        minimum: 0,
        maximum: 100,
        value: 0
      });
      win.add(slider1);
// Affichage de la valeur du slider et lien avec Three.js
      var label1Value = new qx.ui.basic.Label("0");
      win.add(label1Value);
      slider1.addListener("changeValue", function(e) {
        volconfig.clim1 = e.getData()/100;
        updateUniforms();
        label1Value.setValue("" + e.getData());
      });

// Etiquette
      var label2 = new qx.ui.basic.Label("Clim 2");
      win.add(label2);

// Slider
      var slider2 = new qx.ui.form.Slider().set({
        minimum: 0,
        maximum: 100,
        value: 100
      });
      win.add(slider2);

// Affichage de la valeur du slider et lien avec Three.js

      var label2Value = new qx.ui.basic.Label("100");
      win.add(label2Value);
      slider2.addListener("changeValue", function(e) {
         volconfig.clim2 = e.getData()/100;
        updateUniforms();
        label2Value.setValue("" + e.getData());
      });

// Etiquette
      var selectLabel = new qx.ui.basic.Label("Colormap");
      win.add(selectLabel);
// Liste déroulante
      var selectBox = new qx.ui.form.SelectBox();
      var item1 = new qx.ui.form.ListItem("Viridis");
      var item2 = new qx.ui.form.ListItem("Gray");

      selectBox.add(item1);
      selectBox.add(item2);

      win.add(selectBox);
// Lien entre la liste déroulante et Three.js
      selectBox.addListener("changeSelection", function(e) {
        var selectedItem1 = e.getData()[0];
        
        volconfig.colormap = selectedItem1.getLabel().toLowerCase(); // "viridis" ou "gray"
        updateUniforms();
        console.log("Selected: " + selectedItem1.getLabel());
      });

// Etiquette
      var selectLabel1 = new qx.ui.basic.Label("Renderstyle");
      win.add(selectLabel1);
// Liste déroulante
      var selectBox1 = new qx.ui.form.SelectBox();
      var item1 = new qx.ui.form.ListItem("ISO");
      var item2 = new qx.ui.form.ListItem("MIP");

      selectBox1.add(item1);
      selectBox1.add(item2);
      
      win.add(selectBox1);
// Lien entre la liste déroulante et Three.js
 selectBox1.addListener("changeSelection", function(e) {
    var selectedItem = e.getData()[0];
    volconfig.renderstyle = selectedItem.getLabel().toLowerCase(); // stocke "mip" ou "iso"
    updateUniforms();
    console.log("Selected renderstyle: " + selectedItem.getLabel());
});
// Etiquette
      var label3 = new qx.ui.basic.Label("ISOthreshold");
      win.add(label3);
// Slider
      var slider3 = new qx.ui.form.Slider().set({
        minimum: 0,
        maximum: 100,
        value: 10
      });
      win.add(slider3);

// Affichage de la valeur du slider et lien avec Three.js


      var label3Value = new qx.ui.basic.Label("10");
      win.add(label3Value);
      slider3.addListener("changeValue", function(e) {
        
        volconfig.isothreshold = e.getData()/100;
        updateUniforms();
        label3Value.setValue("" + e.getData());
      });

      win.open();
      
      const doc = this.getRoot();
      doc.add(win, { left: 100, top: 50 });






