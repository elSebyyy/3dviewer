// get the scene of the Babylon Viewer
BabylonViewer.viewerManager
	.getViewerPromiseById("qcModel")
	.then(function (viewer) {
		viewer.onSceneInitObservable.add(function (scene) {
			scene.executeWhenReady(function (scene) {
				// when the scene is ready add GUI
				main(scene);
			})
		})
	});


function main(scene){
    // // set HDR texture
    // const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/environment.env", scene);
    // scene.environmentTexture = hdrTexture;

    // // create skybox (abkürzen mit DefaultSkybox ?, 4. Parameter)
    // const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:150}, scene);
    // const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/environmentSpecular.env", scene);
    // skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    // skyboxMaterial.backFaceCulling = false;
    // skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    // skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    // skyboxMaterial.microSurface = 0.99;
    // skyboxMaterial.disableLighting = true;
    // skybox.material = skyboxMaterial;

    const bolts = scene.getMaterialByName("bolts");
    const plates = scene.getMaterialByName("plates");
    const mounting = scene.getMaterialByName("mounting");
    const extra = scene.getMaterialByName("extra");
    let multimat = new BABYLON.MultiMaterial("multi", scene);
    multimat.subMaterials.push(bolts);
    multimat.subMaterials.push(plates);
    multimat.subMaterials.push(mounting);
    multimat.subMaterials.push(extra);

    let tNodes = scene.transformNodes;
    tNodes.filter(i => i.getChildMeshes().size > 1)
    tNodes.forEach(function (tNode) {
        let children = tNode.getChildMeshes();
        let tNodeName = tNode.name;
        let indexList = [];
        let matsIndex = {"bolts" : 0, "plates" : 1, "mounting": 2, "extra" : 3};

        children.forEach(m => indexList.push(matsIndex[m.material.name]));
        let newMesh = BABYLON.Mesh.MergeMeshes(
            arrayOfMeshes = children, 
            disposeSource = true, 
            allow32BitsIndices = true, 
            meshSubclass = undefined, 
            subdivideWithSubMeshes = false, 
            multiMultiMaterials = true
            );
        newMesh.name = tNodeName;
        newMesh.material = multimat;
        for (let i = 0; i <= 3; i++) {
            if (newMesh.subMeshes[i] !== undefined) {
                newMesh.subMeshes[i].materialIndex = indexList[i];
            }
        }
    });

    scene.debugLayer.show();

    // let camera = scene.activeCamera;
    // // set camera preferences
	// camera.useBouncingBehavior = false;
	// camera.wheelPrecision = 300;
	// camera.panningSensibility = 7000;
	// camera.wheelDeltaPercentage = 0.05;
	// // set camera collision
	// const collisionRadius = 0.02;
	// camera.collisionsEnabled = true;
	// camera.checkCollisions = true;
	// camera.collisionRadius = new BABYLON.Vector3(collisionRadius, collisionRadius, collisionRadius);
}