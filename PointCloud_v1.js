const viewer = new desk.THREE.Viewer();

viewer.getWindow().setCaption("my disk!");

const offset = 30;
const size = 100;

for (var i = 0; i < size; i++) {
    for (var j = 0; j < size; j++){
    const geometry = new THREE.CircleGeometry(20, 64); // Disque avec 64 segments pour plus de détails
    const mesh = viewer.addGeometry(geometry, { label: "my disk" });
        
    mesh.material.color.setRGB(0, 0, 1); 
    
    const normalDirection = new THREE.Vector3(1, 1, 1);
    mesh.lookAt(normalDirection);
    
    // Position des disques 
    mesh.position.set(i * offset - (size * offset) / 2, j * offset - (size * offset) / 2, 0);
    }
}

// bouton pour réinitialiser la vue de la caméra
const resetButton = new qx.ui.form.Button("Reset Camera");
viewer.add(resetButton, { left: 10, bottom: 10 });

// event listener
resetButton.addListener("execute", function () {
    viewer.resetView(); 
});


viewer.resetView();
