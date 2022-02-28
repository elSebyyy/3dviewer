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
	})

function main(scene){
    // set HDR texture
    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/environment.env", scene);
    scene.environmentTexture = hdrTexture;

    // create skybox (abkürzen mit DefaultSkybox ?, 4. Parameter)
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:150}, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/environmentSpecular.env", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.microSurface = 0.99;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;


    scene.debugLayer.show();
    let tNodes = scene.transformNodes;
    tNodes.filter(i => i.getChildMeshes().size > 1)
    tNodes.forEach(function (tNode) {
        let children = tNode.getChildMeshes();
        BABYLON.Mesh.MergeMeshes(
            arrayOfMeshes = children, 
            disposeSource = true, 
            allow32BitsIndices = true, 
            meshSubclass = undefined, 
            subdivideWithSubMeshes = false, 
            multiMultiMaterials = true
            );
    });
    let camera = scene.activeCamera;
	camera.useBouncingBehavior = false;
}