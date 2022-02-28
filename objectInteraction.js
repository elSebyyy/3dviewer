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
    // get camera
    let camera = scene.activeCamera;
    const defCameraLower = 0;
    const defCameraUpper = 1;
    camera.lowerRadiusLimit = defCameraLower;
    camera.upperRadiusLimit = defCameraUpper;

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

    // create select material
    let selMat = new BABYLON.StandardMaterial("selMat", scene);
    selMat.emissiveColor = new BABYLON.Color3(1, 1, 0);

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
    sv.background = "#023d6b" // fzj, "#212121" dark grey
    sv.color = "white";
    sv.alpha = 0.8;
    sv.thickness = 1;

    sv.onPointerEnterObservable.add(function (){
        camera.lowerRadiusLimit = camera.upperRadiusLimit = camera.radius;
    });
    sv.onPointerOutObservable.add(function (){
        camera.lowerRadiusLimit = defCameraLower;
        camera.upperRadiusLimit = defCameraUpper;
    });
    advancedTexture.addControl(sv);

    // info box text
    let infoTextBox = new BABYLON.GUI.TextBlock("infoTextBox");
    const paddingInfo = "20px";
    infoTextBox.textWrapping = true;
    infoTextBox.resizeToFit = true;
    infoTextBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    infoTextBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    infoTextBox.textHorizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    infoTextBox.textVerticalAlignment =
    BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    infoTextBox.paddingRight = paddingInfo;
    infoTextBox.paddingLeft = paddingInfo;
    infoTextBox.paddingTop = paddingInfo;
    infoTextBox.paddingBottom = paddingInfo;
    infoTextBox.fontFamily = "Helvetica";
    infoTextBox.text = textfields.default.parentText;
    infoTextBox.color = "white";
    infoTextBox.fontSize = "19px";
    sv.addControl(infoTextBox);
    
    // add object interactions
    var currentMode = 'none'
    var currentSelection = 'default'
    let nametags = {};
    Object.keys(textfields).forEach(function(modeName){
        let modeInfo = textfields[modeName];
        if (modeInfo.objects == null){return;}
        Object.keys(modeInfo.objects).forEach(function(objName){
            let objInfo = modeInfo.objects[objName];
            let objMesh = scene.getMeshByName(objName);
            if(objMesh == null){
                return;
            }
            
            // add Tags
            BABYLON.Tags.AddTagsTo(objMesh, objInfo['seq'] + " " + modeName);
            
            // nametag 3D
            // nametag frame (rounded rectangle)
            let nametagBox = new BABYLON.GUI.Rectangle("nametagBox" + "_" + objName);
            nametagBox.adaptHeightToChildren = true;
            nametagBox.adaptWidthToChildren = true;
            nametagBox.cornerRadius = 10;
            nametagBox.background = "#023d6b" // fzj, "#212121" dark grey
            nametagBox.color = "white";
            nametagBox.alpha = 0.8;
            nametagBox.paddingLeft = "130px";
            nametagBox.isVisible = false;
            advancedTexture.addControl(nametagBox);

            // nametag Text
            let nametagTextBox = new BABYLON.GUI.TextBlock("nametagTextBox"+ "_" + objName);
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
            nametagTextBox.text = objInfo.name;
            nametagTextBox.color = "white";
            nametagTextBox.fontSize = "19px";
            nametagBox.addControl(nametagTextBox);
            nametagBox.linkWithMesh(objMesh);

            // add nametags to map for better search
            if (nametags.hasOwnProperty(modeName)) {
                nametags[modeName].push(nametagBox);       
            } else {
                nametags[modeName] = [nametagBox];
            }
            
            objMesh.actionManager = new BABYLON.ActionManager(scene);
            
            // mouse over object
            if(['helium_system', 'electronic_circuit', 'plates'].includes(modeName)){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                    if(currentMode == "none"){
                        scene.getMeshesByTags(modeName, (mesh) => mesh.material = selMat);
                    }
                    else if(currentMode == modeName){
                        objMesh.material = selMat;
                    }
                }));
            
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
                    scene.getMeshesByTags(modeName, (mesh) => mesh.material = scene.getMaterialByName('DefaultMaterial')); 
                }));
            }
            else if (modeName == 'single'){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                    if(currentMode == "none"){
                        objMesh.material = selMat;
                    }
                }));
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
                    objMesh.material = scene.getMaterialByName('DefaultMaterial');
                }));
            }

            objMesh.inspectableCustomProperties = {
                select: function(){
                    clearSelection(false);
                    infoTextBox.text = objInfo.text; // Obj Text
                    nametagBox.isVisible = true; //show nametag
                    hl.addMesh(objMesh, BABYLON.Color3.Green()); // highlight
                    currentSelection = objMesh;
                    currentMode = modeName == 'single' ? 'none' : modeName;
                }
            };

            if(['helium_system', 'electronic_circuit', 'plates', 'single'].includes(modeName)){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() { 
                    if(currentMode == "none" && modeName != 'single'){
                        selectMode(modeName, modeInfo);
                    }
                    else if(currentMode == modeName || (currentMode == "none" && modeName == 'single')){
                        objMesh.inspectableCustomProperties.select();
                    }
                }));
            }            
        });
    });

    let selectMode = function(modeName, modeInfo){
        clearSelection(false);
        infoTextBox.text = modeInfo.parentText; // Mode Text
        nametags[modeName].forEach(i => i.isVisible = true); // show all nametags
        scene.getMeshesByTags(modeName, (mesh) => hl.addMesh(mesh, BABYLON.Color3.Green())); // highlight all
        currentSelection = modeName;
        currentMode = (modeName == 'plates')? "none" : modeName;
    }

    let clearSelection = function(toDefault) {
        if(currentSelection != 'default'){

            if((typeof currentSelection) == "string"){
                nametags[currentSelection].forEach(i => i.isVisible = false); // hide all nametags
                scene.getMeshesByTags(currentSelection, (mesh) => hl.removeMesh(mesh)); // hide all highlights
            }
            else{
                advancedTexture.getDescendants(true).filter(i => i.linkedMesh == currentSelection).forEach(i => i.isVisible = false); 
                hl.removeMesh(currentSelection);
            }
            if(toDefault){
                infoTextBox.text = textfields.default.parentText; // default text
                currentMode = 'none';
                currentSelection = 'default';
            }
            
        }
    }

    
    scene.onPointerObservable.add(function (pointerInfo) {
        if(pointerInfo.pickInfo.pickedMesh.name == 'skyBox'){
            clearSelection(true);
        }
    },BABYLON.PointerEventTypes.POINTERTAP);
 
    let buttonForward = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonForward",
        "assets/forward2.png"
    );
    buttonForward.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    buttonForward.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    buttonForward.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonForward.width = "5%";
    buttonForward.fixedRatio = 1;
    buttonForward.left = "10%";
    buttonForward.top = "-2%";
    buttonForward.color = "transparent";
    buttonForward.hoverCursor = "pointer";
    advancedTexture.addControl(buttonForward);

    let buttonBackward = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonBackward",
        "assets/forward2.png"
    );
    buttonBackward.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    buttonBackward.image.rotation = Math.PI;
    buttonBackward.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    buttonBackward.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonBackward.width = "5%";
    buttonBackward.fixedRatio = 1;
    buttonBackward.left = "-10%";
    buttonBackward.top = "-2%";
    buttonBackward.color = "transparent";
    buttonBackward.hoverCursor = "pointer";
    advancedTexture.addControl(buttonBackward);

    let forwardSelection = function (direction) {
        // find current sequence number
        let seqTag = 0;
        if((typeof currentSelection) == "string"){
            seqTag = textfields[currentSelection].seq;
        }
        else{
            seqTag = parseInt(BABYLON.Tags.GetTags(currentSelection).split(" ")[0]);
        }
        // get next object or mode
        do{
            seqTag += direction;
            if(seqTag < 0 || seqTag > 20){
                return;
            }
            let objNext = scene.getMeshesByTags((seqTag).toString())
            if(objNext.length == 1){
                objNext[0].inspectableCustomProperties.select();
                return;
            }
            else if(objNext.length == 0){
                let modeName = Object.keys(textfields).find(modeName => textfields[modeName].seq == seqTag);
                let modeInfo = textfields[modeName];
                if(modeName == 'default'){
                    clearSelection(true);
                    return;
                }
                if(modeInfo != null){
                    selectMode(modeName, modeInfo);
                    return;
                }
                else{
                    //console.warn("Obj doesn't exist");
                    continue;
                }
            }
            else{
                console.warn("multiple assignments of same sequence number");
                return;
            }
        }while(true);
    }

    buttonForward.onPointerClickObservable.add(() => forwardSelection(1));
    buttonBackward.onPointerClickObservable.add(() => forwardSelection(-1));

}