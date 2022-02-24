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
    // read JSON file    
    let request = new XMLHttpRequest();
    request.open("GET", "textfields.json", false);
    request.send(null);
    let textfields = JSON.parse(request.responseText);

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
    
    // info box side 2D
    // Info Box Frame (rounded rectangle)    
    let sv = new BABYLON.GUI.ScrollViewer("scrollViewer");
    sv.horizontalAlignment = 'right'
    sv.verticalAlignment = 'top'
    sv.width = "40%";
    sv.height = "85%";
    sv.left = "60%";
    sv.paddingTop = "20px";
    sv.paddingRight = "20px";
    sv.adaptHeightToChildren = false;
    sv.cornerRadius = 10;
    sv.background = "#212121"; //dark grey
    sv.color = "white";
    sv.alpha = 0.8;
    sv.thickness = 3;
    advancedTexture.addControl(sv);

    // info box text
    let infoTextBox = new BABYLON.GUI.TextBlock("infoTextBox");
    const paddingInfo = "20px";
    infoTextBox.textWrapping = true;
    infoTextBox.resizeToFit = true;
    infoTextBox.paddingRight = paddingInfo;
    infoTextBox.paddingLeft = paddingInfo;
    infoTextBox.paddingTop = paddingInfo;
    infoTextBox.paddingBottom = paddingInfo;
    infoTextBox.textHorizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    infoTextBox.textVerticalAlignment =
    BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    infoTextBox.fontFamily = "Helvetica";
    infoTextBox.text = textfields.default.parentText;
    infoTextBox.color = "white";
    infoTextBox.fontSize = "19px";
    sv.addControl(infoTextBox);
    
    // add object interactions
    var currentMode = 'none'
    let nametags = {};
    Object.keys(textfields).forEach(function(modeName){
        let mode = textfields[modeName];
        if (mode.objects == null){return;}
        Object.keys(mode.objects).forEach(function(objectName){
            let object = mode.objects[objectName];
            let item = scene.getMeshByName(objectName);
            if(item == null){
                return;
            }

            // nametag 3D
            // nametag frame (rounded rectangle)
            let nametagBox = new BABYLON.GUI.Rectangle("nametagBox" + "_" + objectName);
            nametagBox.adaptHeightToChildren = true;
            nametagBox.adaptWidthToChildren = true;
            nametagBox.cornerRadius = 10;
            nametagBox.background = "#212121"; //dark grey
            nametagBox.color = "white";
            nametagBox.alpha = 0.8;
            nametagBox.paddingLeft = "130px";
            nametagBox.isVisible = false;
            advancedTexture.addControl(nametagBox);

            // nametag Text
            let nametagTextBox = new BABYLON.GUI.TextBlock("nametagTextBox"+ "_" + objectName);
            const padding = 10;
            nametagTextBox.textWrapping = false;
            nametagTextBox.resizeToFit = true;
            nametagTextBox.paddingRight = padding;
            nametagTextBox.paddingLeft = padding;
            nametagTextBox.paddingTop = padding;
            nametagTextBox.paddingBottom = padding;
            nametagTextBox.textHorizontalAlignment =
            BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            nametagTextBox.fontFamily = "Helvetica";
            nametagTextBox.text = object.name;
            nametagTextBox.color = "white";
            nametagTextBox.fontSize = "19px";
            nametagBox.addControl(nametagTextBox);
            nametagBox.linkWithMesh(item);

            // add nametags to map for better search
            if (nametags.hasOwnProperty(modeName)) {
                nametags[modeName].push(nametagBox);
                
            } else {
                nametags[modeName] = [nametagBox];
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
            if(modeName == 'single'){            
                item.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() {                   
                    infoTextBox.text = object.text;
                    currentMode = 'none';
                    let ui_elements = advancedTexture.getDescendants(true);
                    ui_elements = ui_elements.filter(i => i.name.startsWith('nametagBox'));
                    ui_elements.forEach(i => i.isVisible = false)
                    nametagBox.isVisible = true;
                }));
            }
            else if(['helium_system', 'electronic_circuit'].includes(modeName)){
                item.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() { 
                    advancedTexture.getDescendants(true).filter(i => i.name.startsWith('nametagBox')).forEach(i => i.isVisible = false); 
                    if(currentMode != modeName){
                        infoTextBox.text = mode.parentText;
                        nametags[modeName].forEach(i => i.isVisible = true);
                        currentMode = modeName;
                    }
                    else{
                        infoTextBox.text = object.text;
                        nametagBox.isVisible = true;
                        currentMode = 'none';
                    }         
                }));
            }
            else if(modeName == 'plates'){
                item.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() {
                    infoTextBox.text = mode.parentText;
                    advancedTexture.getDescendants(true).filter(i => i.name.startsWith('nametagBox')).forEach(i => i.isVisible = false);
                    nametags[modeName].forEach(i => i.isVisible = true);
                    currentMode = 'none';
                }));
            }
            
        });
    });   
}