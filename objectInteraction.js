// get the scene of the Babylon Viewer
BabylonViewer.viewerManager
	.getViewerPromiseById("qcModel")
	.then(function (viewer) {
		viewer.onSceneInitObservable.add(function (scene) {
			scene.executeWhenReady(function (scene) {
				// when the scene is ready add GUI
				createObjInteractions(scene);
			})
		})
	});

const getHTMLText = function(inst){
    let htmlText = inst.text;
    if (inst.hasOwnProperty('textDetails')){
        htmlText += "<br><input type='checkbox' id='showmoreCB' /> <label for='showmoreCB' class='showmore'></label> <span class='moretext'>";
        htmlText += inst.textDetails + "</span>";
    }
    return htmlText;
}

const createObjInteractions = function(scene){
    // get camera
    let camera = scene.activeCamera;

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
    let engine = scene.getEngine();
    engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
    
    let element = document.querySelector('viewer');
    let infoBox = document.createElement('div');
    infoBox.id = "infoBox";
    let st = infoBox.style;
    st.position = "absolute";
    st.width = "35%";
    st.top = "2%";
    st.right = "2%";
    st.background = "#023d6b"; // fzj
    st.border = "1px solid white"
    st.borderRadius = "10px";
    st.opacity = "0.8";
    st.maxWidth = "35%";
    st.maxHeight = "75%";
    st.display = "block";
    st.alignSelf = "right";
    st.padding = "2%";
    st.color = "white";
    st.overflowY = "auto";
    st.fontFamily = "Helvetica, Arial, sans-serif";
    st.fontSize = "1.5vw"; 
    st.wordBreak = "break-word";
    st.textAlign =  "break-all";
    
    infoBox.innerHTML = getHTMLText(textfields.default);
    element.appendChild(infoBox);
    
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
            nametagBox.linkOffsetX = "-100px";
            nametagBox.isVisible = false;
            
            advancedTexture.addControl(nametagBox);

            // nametag Text
            let nametagTextBox = new BABYLON.GUI.TextBlock("nametagTextBox"+ "_" + objName);
            const padding = "10px";
            nametagTextBox.textWrapping = false;
            nametagTextBox.resizeToFit = true;
            nametagTextBox.paddingRight = padding;
            nametagTextBox.paddingLeft = padding;
            nametagTextBox.paddingTop = padding;
            nametagTextBox.paddingBottom = padding;
            nametagTextBox.text = objInfo.name;
            nametagTextBox.color = "white";
            nametagTextBox.fontFamily = "Helvetica";
            nametagTextBox.fontSize = "15em";
            
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
            objMesh.overlayColor = new BABYLON.Color3.FromHexString("#023d6b") //new BABYLON.Color3(2, 61, 107);
            objMesh.overlayAlpha = 0.5;
            if(['helium_system', 'electronic_circuit', 'plates'].includes(modeName)){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                    if(currentMode == "none"){      
                        scene.getMeshesByTags(modeName, (mesh) => mesh.renderOverlay = true);
                    }
                    else if(currentMode == modeName){
                        objMesh.renderOverlay = true;
                    }
                }));
            
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
                    scene.getMeshesByTags(modeName, (mesh) => mesh.renderOverlay = false);
                }));
            }
            else if (modeName == 'single'){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                    if(currentMode == "none"){
                        objMesh.renderOverlay = true;
                    }
                }));
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
                    objMesh.renderOverlay = false;
                }));
            }

            objMesh.inspectableCustomProperties = {
                select: function(){
                    clearSelection(false);
                    infoBox.innerHTML = getHTMLText(objInfo); // Obj Text
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

    // functions for selecting, deselecting and forwarding
    const clearSelection = function(toDefault) {
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
                infoBox.innerHTML = getHTMLText(textfields.default); // default text
                currentMode = 'none';
                currentSelection = 'default';
            }        
        }
    }

    const selectMode = function(modeName, modeInfo){
        clearSelection(false);
        infoBox.innerHTML = getHTMLText(modeInfo); // Mode Text
        nametags[modeName].forEach(i => i.isVisible = true); // show all nametags
        scene.getMeshesByTags(modeName, (mesh) => hl.addMesh(mesh, BABYLON.Color3.Green())); // highlight all
        currentSelection = modeName;
        currentMode = (modeName == 'plates')? "none" : modeName;
    }

    const forwardSelection = function (direction) {
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
                    console.warn(seqTag);
                    continue;
                }
            }
            else{
                console.warn("multiple assignments of same sequence number");
                return;
            }
        }while(true);
    }
    
    // reset selection on click in void
    scene.onPointerObservable.add(function (pointerInfo) {
        if(pointerInfo.event.button == 0 && pointerInfo.pickInfo.pickedMesh.name == 'skyBox'){
            clearSelection(true);
        }
    },BABYLON.PointerEventTypes.POINTERTAP);
    
    // add buttons
    let buttonForward = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonForward",
        "assets/forward.png"
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
        "assets/forward.png"
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
    
    buttonForward.onPointerClickObservable.add(() => forwardSelection(1));
    buttonBackward.onPointerClickObservable.add(() => forwardSelection(-1));    

    //scene.debugLayer.show();
}