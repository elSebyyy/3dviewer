BabylonViewer.viewerManager
	.getViewerPromiseById("qcModel")
	.then(function (viewer) {
		viewer.onSceneInitObservable.add(function (scene) {
			scene.executeWhenReady(function (scene) {
				// when the scene is ready prepare environment
				addEnvTex(scene);
			})
		})
	})

function addEnvTex(scene){
	// delete default light
	scene.lights[0].dispose();
	
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
	
	// set IBL intensity
	scene.environmentIntensity = 0.6;

	// set camera preferences
	let camera = scene.activeCamera;
	camera.useBouncingBehavior = false;
	camera.wheelPrecision = 300;
	camera.panningSensibility = 7000;
	camera.wheelDeltaPercentage = 0.05;
	// set camera collision
	const collisionRadius = 0.02;
	camera.collisionsEnabled = true;
	camera.checkCollisions = true;
	camera.collisionRadius = new BABYLON.Vector3(collisionRadius, collisionRadius, collisionRadius);
	
	// set collisions of every object in the scene (todo: create collision boxes, debug bounding boxes)
	let sceneMeshes = scene.meshes;
	sceneMeshes.forEach(function(item) {
		//item.showBoundingBox = true;
		item.checkCollisions = true;		
	  });

	// apply lightmap to material(s) (todo: lightmap intensity)
	// const lightmapMounting = new BABYLON.Texture("assets/lightmap.png", scene);
	// const materials = scene.materials;
	// let matMounting = materials.find(obj => {return obj.name === 'mounting'});
	// lightmapMounting.coordinatesIndex = 1;
	// matMounting.lightmapTexture = lightmapMounting;

	// shadows
	// scene.shadowsEnabled = true;
	// let sceneLight = scene.getLightByID(0);
	// let shadowGenerator = new BABYLON.ShadowGenerator(1024, sceneLight);
}
