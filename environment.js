BabylonViewer.viewerManager
	.getViewerPromiseById("qcModel")
	.then(function (viewer) {
		viewer.onSceneInitObservable.add(function (scene) {
			scene.executeWhenReady(function (scene) {
				// when the scene is ready prepare environment
				addEnvTex(scene);
			})
		})
	});

function addEnvTex(scene){
	// delete default light
	scene.lights[0].dispose();
	
	const hdrTexture_sky = BABYLON.CubeTexture.CreateFromPrefilteredData('assets/environment/room2_skybox.dds', scene);
	const hdrTexture_spec = BABYLON.CubeTexture.CreateFromPrefilteredData('assets/environment/room2_specular.env', scene);
	scene.environmentTexture = hdrTexture_spec;
	//set IBL intensity
	scene.environmentIntensity = 1.2;

	const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:150}, scene);
        
	// create skybox (abkürzen mit DefaultSkybox ?, 4. Parameter)
	const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
	skyboxMaterial.reflectionTexture = hdrTexture_sky;
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.microSurface = 0.99;
	skyboxMaterial.disableLighting = true;
	skybox.material = skyboxMaterial;

	// set camera preferences
	let camera = scene.activeCamera;
	camera.useBouncingBehavior = false;
	camera.wheelPrecision = 300;
	camera.panningInertia = 0.9;
	camera.panningDistanceLimit = 5;
	camera.wheelDeltaPercentage = 0.05;
	camera.lowerRadiusLimit = 1;
	camera.upperRadiusLimit = 10;
	console.log(camera.upperRadiusLimit);
	//camera.fov = 0.9;

	// set camera collision
	const collisionRadius = 0.02;
	camera.collisionsEnabled = true;
	camera.checkCollisions = true;
	camera.collisionRadius = new BABYLON.Vector3(collisionRadius, collisionRadius, collisionRadius);

	// set collisions of every object in the scene (todo: create collision boxes, debug bounding boxes)
	const sceneMeshes = scene.meshes;
	sceneMeshes.forEach(function(mesh) {
		if (mesh.name.startsWith('coll_')) {
			mesh.checkCollisions = true;
			mesh.isPickable = false;
			mesh.isVisible = false;
		}
		else{
			mesh.checkCollisions = false;
		}
		//item.showBoundingBox = true;
	});
	setTimeout( function() { camera.upperRadiusLimit=10 }, 2000);
	// apply lightmap to material(s) (todo: lightmap intensity)
	// const lightmapMounting = new BABYLON.Texture("assets/textures/lightmap.png", scene);
	// const materials = scene.materials;
	// let matMounting = materials.find(obj => {return obj.name === 'mounting'});
	// lightmapMounting.coordinatesIndex = 1;
	// matMounting.lightmapTexture = lightmapMounting;

	// shadows
	// scene.shadowsEnabled = true;
	// let sceneLight = scene.getLightByID(0);
	// let shadowGenerator = new BABYLON.ShadowGenerator(1024, sceneLight);
}
