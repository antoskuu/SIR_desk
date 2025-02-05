const viewer = new desk.THREE.Viewer();

viewer.getWindow().setCaption("my disk!");

const offset = 30;
const size = 100;

for (var i = 0; i < size; i++) {
    for (var j = 0; j < size; j++){
    const geometry = new THREE.CircleGeometry(20, 64); // Disque avec 64 segments pour plus de détails
    const mesh = viewer.addGeometry(geometry, { label: "my disk" });

    // Appliquer une couleur à chaque disque
    mesh.material.color.setRGB(0, 0, 1); // Par exemple, couleur bleue (changez selon vos besoins)
    
    const normalDirection = new THREE.Vector3(1, 1, 1);
    mesh.lookAt(normalDirection);
    
    // Positionner les disques autour du centre (0, 0, 0)
    mesh.position.set(i * offset - (size * offset) / 2, j * offset - (size * offset) / 2, 0);
    }
}

// Ajouter un bouton pour réinitialiser la vue de la caméra
const resetButton = new qx.ui.form.Button("Reset Camera");
viewer.add(resetButton, { left: 10, bottom: 10 });

// Ajouter un écouteur d'événements pour réinitialiser la caméra
resetButton.addListener("execute", function () {
    viewer.resetView(); // Réinitialiser la vue de la caméra
});

/*
// Ajouter un label pour afficher un message (facultatif)
const label = new qx.ui.basic.Label("");
viewer.add(label, { left: 10, bottom: 10 });
*/

viewer.resetView();
