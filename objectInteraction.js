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
    // create highlight layer/ outlines
    let hl = new BABYLON.HighlightLayer("hl1", scene);
    hl.innerGlow = false;
    // blinking of highlight layer
    let alpha = 0;
    scene.registerBeforeRender(() => {
        alpha += 0.06;
        hl.blurHorizontalSize = 0.5 + Math.cos(alpha) * 0.6 + 0.6;
        hl.blurVerticalSize = 0.5 + Math.sin(alpha /3) * 0.6 + 0.6;
    });

    //create UI
    let advancedTexture =
		BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI({
			name: "UI",
			scene: scene,
		});
	advancedTexture.renderAtIdealSize = true;

    // Info Box Frame (rounded rectangle)
    let infoBox = new BABYLON.GUI.Rectangle("infoBox");
    infoBox.width = "350px";
    //infoBox.height = "200px";
    infoBox.adaptHeightToChildren = true;
    infoBox.cornerRadius = 10;
    infoBox.background = "#212121"; //dark grey
    infoBox.color = "white";
    infoBox.alpha = 0.8;
    infoBox.paddingLeft = "130px";
    infoBox.isVisible = false;
    advancedTexture.addControl(infoBox);

    //Info Box Text
    let infoTextBox = new BABYLON.GUI.TextBlock("infoTextBox");
    const padding = 10;
    infoTextBox.textWrapping = true;
    infoTextBox.resizeToFit = true;
    infoTextBox.paddingRight = padding;
    infoTextBox.paddingLeft = padding;
    infoTextBox.paddingTop = padding;
    infoTextBox.paddingBottom = padding;
    infoTextBox.textHorizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    infoTextBox.fontFamily = "Helvetica";
    infoTextBox.text = "Hallo Test 123 Test 123 Test 123";
    infoTextBox.color = "white";
    infoTextBox.fontSize = "19px";
    infoBox.addControl(infoTextBox);
    
    // text and object mappings
    const single_objects = ["qpu", "plaque"];
    const plates = {"plate_0" : "~50K (-223°C)", 
        "plate_1" : "~4K (-269°C)", 
        "plate_2" : "~800mK (-272,35°C)", 
        "plate_3" : "90mK (-273,06°C", 
        "plate_4" : "10mK (-273,14°C)"};
    const measuring_circuit = ["power_supply", "HEMTS", "cables_measuring", "TWPA", "directional_coupler", "isolator"];
    const control_circuit = ["cables_control", "filter_frequency"];
    const helium_system = ["gas_pipe", "still", "heat_exchanger_round", "heat_exchanger_steps", "mixing_chamber"];
    
    

    // create interactions for objects
    const sceneMeshes = scene.meshes
    sceneMeshes.forEach(function(item) {
        if(item.name == 'skyBox'){
            return;
        }

        // mouse over object
        item.actionManager = new BABYLON.ActionManager(scene);
        item.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
            if(! hl.hasMesh(item)){
                hl.addMesh(item, BABYLON.Color3.Green());
            }
	    }));

        item.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
            if (hl.hasMesh(item)) {         
                hl.removeMesh(item);
        }
	    }));

        // click on object
        item.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() {
            infoBox.moveToVector3(item.position, scene)
            infoTextBox.text = item.name;
            infoBox.isVisible = true;
        }));
    });
    
}