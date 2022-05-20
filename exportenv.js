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
scene.getEngine().premultipliedAlpha = false;
console.log('Test');
testTexture = new BABYLON.HDRCubeTexture("assets/environment/raum2_v4.hdr", scene, 1024, false, true, false, true);

	BABYLON.EnvironmentTextureTools.CreateEnvTextureAsync(
		testTexture)
		.then((buffer) => {
			var blob = new Blob([buffer], { type: "octet/stream" });
			BABYLON.Tools.Download(blob, "raum2_v5.env");
		})
		.catch((error) => {
			console.error(error);
			alert(error);
		});
}