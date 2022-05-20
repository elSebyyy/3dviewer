const colFZJ = "#023d6b"
const colHighlight = BABYLON.Color3.Green();

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

// multiply x and z value of Vec3 by -1
const invertXZ = function(loc) {
	return new BABYLON.Vector3(loc.x * -1, loc.y, loc.z * -1);
}

const coordsSwitchYZ = function(loc) {
	return new BABYLON.Vector3(loc.x, loc.z, loc.y);
}

const strToVec = function(strVec){
    const arrVec = strVec.split(",");
    const vec = new BABYLON.Vector3(parseFloat(arrVec[0]), parseFloat(arrVec[1]), parseFloat(arrVec[2]));
    return coordsSwitchYZ(vec);
}

const createObjInteractions = function(scene){
    // get camera
    let camera = scene.activeCamera;

    // read JSON file    
    let request = new XMLHttpRequest();
    request.open("GET", "textfields.json", false);
    request.send(null);
    let textfields = JSON.parse(request.responseText);
    request = new XMLHttpRequest();
    request.open("GET", "assets/nametagsPositions.json", false);
    request.send(null);
    let nametagPositions = JSON.parse(request.responseText);

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
    let engine = scene.getEngine();
    engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
    
    let canvasElement = document.querySelector('viewer');
    let infoBox = document.createElement('div');
    infoBox.id = "infoBox";
    
    infoBox.innerHTML = getHTMLText(textfields.default);
    canvasElement.appendChild(infoBox);

    // fullscreen toggles
    const enterFullscreen = function(){	  
        if(canvasElement.requestFullscreen){
            canvasElement.requestFullscreen();
        }
        else if(canvasElement.mozRequestFullScreen){
            canvasElement.mozRequestFullScreen();
        }
        else if(canvasElement.webkitRequestFullscreen){	
            canvasElement.webkitRequestFullscreen();
        }
        else if(canvasElement.msRequestFullscreen){
            canvasElement.msRequestFullscreen();
        }
    }
    const quitFullscreen = function(){
        if (document.exitFullscreen){
          document.exitFullscreen();
        }
        else if (document.webkitExitFullscreen){
          document.webkitExitFullscreen();
        }
        else if (document.msExitFullscreen){
          document.msExitFullscreen();
        }
    }

    // camera Animation
    const cameraShot = function(id){
        
        // get camera destination position
        let cameraDestPos;
        let cameraTarPos;
        const cameraDestPosLabel = ["camera", id].join("_");
        const cameraTarPosLabel = ["cameraTarget", id].join("_");
        if (nametagPositions.hasOwnProperty(cameraDestPosLabel) && nametagPositions.hasOwnProperty(cameraDestPosLabel)) {
            cameraDestPos = strToVec(nametagPositions[cameraDestPosLabel]);
            cameraTarPos = strToVec(nametagPositions[cameraTarPosLabel]);
        } else {
            return;
        }

        // add Animation to camera with lerp from current location to sight location
        const animationFramerate = 30;
        const animationLength = 20;

        let cameraFly = new BABYLON.Animation(
            "cameraFly",
            "position",
            animationFramerate,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        let keys = [
            {
                frame: 0,
                value: camera.position.clone(),
            },
            {
                frame: animationLength,
                value: cameraDestPos,
            },
        ];
        cameraFly.setKeys(keys);

        let cameraTargetPan = new BABYLON.Animation(
            "cameraTargetPan",
            "target",
            animationFramerate,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        keys = [
            {
                frame: 0,
                value: camera.target,
            },
            {
                frame: animationLength,
                value: cameraTarPos,
            },
        ];
        cameraTargetPan.setKeys(keys);

        // play animation
        camera.animations = [cameraFly, cameraTargetPan];
        scene.beginAnimation(camera, 0, animationLength);
    }
    
    // add object interactions
    var currentMode = 'none'
    var currentSelection = 'default'
    var showUI = true;
    var viewerLanguage = 'eng';
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

            // get nametag position
            let nametagPos;
            const nametagPosLabel = ["name", objName].join("_");
            if (nametagPositions.hasOwnProperty(nametagPosLabel)) {
                const strPos = nametagPositions[nametagPosLabel];
                nametagPos = strToVec(nametagPositions[nametagPosLabel]);
            } 
            else {
                nametagPos = objMesh.position;
            }
            
            // nametag 3D
            // nametag frame (rounded rectangle)
            let buttonNametag = new BABYLON.GUI.Button(["buttonNametag", objName].join("_"));
            buttonNametag.height = "4%";
            buttonNametag.adaptWidthToChildren = true;
            buttonNametag.fontFamily = "Helvetica";
            buttonNametag.cornerRadius = 10;
            buttonNametag.background = colFZJ;
            buttonNametag.color = "white";
            buttonNametag.alpha = 0.8;
            buttonNametag.isVisible = false;
            advancedTexture.addControl(buttonNametag);

            //nametag text
            let nametagTextBox = new BABYLON.GUI.TextBlock(["nametagTextBox", objName].join("_"));
            const padding = "5%";
            nametagTextBox.textWrapping = false;
            nametagTextBox.resizeToFit = true;
            nametagTextBox.paddingRight = padding;
            nametagTextBox.paddingLeft = padding;
            nametagTextBox.fontSize = "50%";
            nametagTextBox.text = objInfo.name;
            nametagTextBox.color = "white";
            buttonNametag.addControl(nametagTextBox);

            // update position
            scene.registerBeforeRender(function () {
                buttonNametag.moveToVector3(nametagPos, scene);
            });

            // add nametags to map for better search
            if (nametags.hasOwnProperty(modeName)) {
                nametags[modeName].push(buttonNametag);       
            } else {
                nametags[modeName] = [buttonNametag];
            }
            
            objMesh.actionManager = new BABYLON.ActionManager(scene);
            // mouse over object
            objMesh.overlayColor = new BABYLON.Color3.FromHexString(colFZJ)
            objMesh.overlayAlpha = 0.5;
            if(['helium_system', 'electronic_circuit', 'plates'].includes(modeName)){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                    if(! showUI){
                        return;
                    }
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
                    if(! showUI){
                        return;
                    }
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
                    buttonNametag.isVisible = true; //show nametag
                    hl.addMesh(objMesh, colHighlight); // highlight
                    cameraShot(objName);
                    currentSelection = objMesh;
                    currentMode = modeName == 'single' ? 'none' : modeName;
                }
            };

            const clickObjectAction = function(){
                if(! showUI){
                    return;
                }
                if(currentMode == 'none' && modeName != 'single'){
                    selectMode(modeName, modeInfo);
                }
                else if(currentMode == modeName || (currentMode == 'none' && modeName == 'single')){
                    if(currentSelection == objMesh){
                        clearSelection(true);
                    }
                    else{
                        objMesh.inspectableCustomProperties.select();
                    }
                }
            }

            if(['helium_system', 'electronic_circuit', 'plates', 'single'].includes(modeName)){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() { 
                    clickObjectAction();
                }));
            }

            buttonNametag.onPointerClickObservable.add(function(){
                clickObjectAction();
            });
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
                advancedTexture.getDescendants(true).filter(i => i.name == "buttonNametag" + "_" + currentSelection.name).forEach(i => i.isVisible = false); 
                hl.removeMesh(currentSelection);
            }
            if(toDefault){
                infoBox.innerHTML = getHTMLText(textfields.default); // default text
                currentMode = 'none';
                currentSelection = 'default';
                cameraShot('default');
            }        
        }
    }

    const selectMode = function(modeName, modeInfo){
        clearSelection(false);
        infoBox.innerHTML = getHTMLText(modeInfo); // Mode Text
        nametags[modeName].forEach(i => i.isVisible = true); // show all nametags
        scene.getMeshesByTags(modeName, (mesh) => hl.addMesh(mesh, colHighlight)); // highlight all
        cameraShot(modeName);
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
        if(! showUI){
            return;
        }
        if(pointerInfo.event.button == 0 && pointerInfo.pickInfo.pickedMesh.name == 'skyBox'){
            clearSelection(true);
        }
    },BABYLON.PointerEventTypes.POINTERDOUBLETAP);
    
    // add buttons
    let buttonForward = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonForward",
        "assets/buttons/forward.png"
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
        "assets/buttons/forward.png"
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

    let buttonFullscreen = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonFullscreen",
        "assets/buttons/fullscreen.png"
    );
    buttonFullscreen.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    buttonFullscreen.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    buttonFullscreen.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonFullscreen.width = "5%";
    buttonFullscreen.fixedRatio = 1;
    buttonFullscreen.left = "-2%";
    buttonFullscreen.top = "-2%";
    buttonFullscreen.color = "transparent";
    buttonFullscreen.hoverCursor = "pointer";
    advancedTexture.addControl(buttonFullscreen);

    let buttonHideUI = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonHideUI",
        "assets/buttons/hideUI.png"
    );
    buttonHideUI.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    buttonHideUI.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    buttonHideUI.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonHideUI.width = "5%";
    buttonHideUI.fixedRatio = 1;
    buttonHideUI.left = "2%";
    buttonHideUI.top = "-2%";
    buttonHideUI.color = "transparent";
    buttonHideUI.hoverCursor = "pointer";
    advancedTexture.addControl(buttonHideUI);

    let buttonChangeLang = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonChangeLang",
        "assets/buttons/language_eng.png"
    );
    buttonChangeLang.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    buttonChangeLang.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    buttonChangeLang.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    buttonChangeLang.width = "5%";
    buttonChangeLang.fixedRatio = 1;
    buttonChangeLang.left = "2%";
    buttonChangeLang.top = "2%";
    buttonChangeLang.color = "transparent";
    buttonChangeLang.hoverCursor = "pointer";
    advancedTexture.addControl(buttonChangeLang);
    
    // add functions to buttons
    buttonForward.onPointerClickObservable.add(() => forwardSelection(1));
    buttonBackward.onPointerClickObservable.add(() => forwardSelection(-1));
    buttonFullscreen.onPointerClickObservable.add(function(){
        if(document.fullscreenElement != null){
            quitFullscreen();
        }
        else{
            enterFullscreen();
        }
    });

    let nametagsVis = [];
    const buttonsDisable = [buttonForward, buttonBackward, buttonFullscreen, buttonChangeLang];
    buttonHideUI.onPointerClickObservable.add(function(){
        if(showUI){
            nametagsVis = advancedTexture.getDescendants().filter(con => con.name.startsWith("buttonNametag_") && con.isVisible == true);
            nametagsVis.forEach(con => con.isVisible = false);
            hl.isEnabled = false;
            buttonsDisable.forEach(function(button){
                button.isEnabled = false;
                button.isVisible = false;
            })
            infoBox.style.display = 'none';
            showUI = false;
        }
        else{
            nametagsVis.forEach(con => con.isVisible = true);
            advancedTexture.getChildren().forEach(con => con.isVisible = true);
            hl.isEnabled = true;
            buttonsDisable.forEach(function(button){
                button.isEnabled = true;
                button.isVisible = true;
            })
            infoBox.style.display = 'initial';
            showUI = true;
        }
    });

    buttonChangeLang.onPointerClickObservable.add(function(){
        if(viewerLanguage == 'eng'){
            buttonChangeLang.children[0].source = "assets/buttons/language_ger.png";
            viewerLanguage = 'ger';
        }
        else{
            buttonChangeLang.children[0].source = "assets/buttons/language_eng.png";
            viewerLanguage = 'eng';
        }
    });
        
    // make buttons bigger when hovered
    const buttons = [buttonForward, buttonBackward, buttonFullscreen, buttonHideUI, buttonChangeLang];
    buttons.forEach(button => button.onPointerMoveObservable.add(() => {button.scaleX = 1.1, button.scaleY = 1.1}));
    buttons.forEach(button => button.onPointerOutObservable.add(() => {button.scaleX = 1, button.scaleY = 1}));
    window.addEventListener("resize", function () {
        engine.resize();
    });

    // set camera to default position
    if (nametagPositions.hasOwnProperty('camera_default') && nametagPositions.hasOwnProperty('cameraTarget_default')) {
        cameraShot('default');
    }
    // scene.debugLayer.show();
}