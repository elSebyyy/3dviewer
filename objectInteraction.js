const colFZJ = "#023d6b"
const colHighlight = BABYLON.Color3.Green();
const colModes = {default: "#023D6B", single: "#023D6B", plates: "#5F9F10", helium_system: "#002F86", electronic_circuit: "#FF3838", hull: "#E7D200"};
const overlayPrimary = 0.5
const overlaySecondary = 0.15

var viewerLanguage = 'de_DE';
var de_DE;
var en_US;
var currentMode = 'none';
var currentSelection = 'default';
var showUI = true;

// get the scene of the Babylon Viewer
BabylonViewer.viewerManager
	.getViewerPromiseById("qcModel")
	.then(function (viewer) {
		viewer.onSceneInitObservable.addOnce(function (scene) {
			scene.executeWhenReady(function (scene) {
				// when the scene is ready add GUI
				createObjInteractions(scene);
			})
        });
	});

// get the text by ID in the current viewer language
const getTransText = function(id){
    if(viewerLanguage == 'de_DE'){
        return de_DE.getElementById(id).innerHTML;
    }
    return en_US.getElementById(id).innerHTML;
} 

// get XML file as Map
const requestFile = function(file){
    let request = new XMLHttpRequest();
    request.open("GET", file, false);
    request.send(null);
    return request
}

// merge text information into HTML
const getHTMLText = function(inst){
    let htmlText = getTransText(inst.text);
    if (inst.hasOwnProperty('textDetails')){
        htmlText += "<br><input type='checkbox' id='showmoreCB' /> <label for='showmoreCB' class='showmore'></label> <span id='moretext'>";
        htmlText += getTransText(inst.textDetails) + "</span>";
    }
    document.documentElement.style.setProperty('--showmore', "'" + getTransText('show_more') + "'");
    document.documentElement.style.setProperty('--showless', "'" + getTransText('show_less') + "'");
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
    // load config files
    let textfields = JSON.parse(requestFile('assets/configs/textfields.json').responseText);
    let nametagPositions = JSON.parse(requestFile('assets/configs/nametagsPositions.json').responseText);
    de_DE = requestFile('assets/lang/de_DE.xml').responseXML;
    en_US = requestFile('assets/lang/en_US.xml').responseXML;

    // get camera
    let camera = scene.activeCamera;
    //set camera to default position
    if (nametagPositions.hasOwnProperty('camera_default') && nametagPositions.hasOwnProperty('cameraTarget_default')) {
        camera.position = strToVec(nametagPositions['camera_default']);
        camera.target = strToVec(nametagPositions['cameraTarget_default']);
    }

    // create highlight layer/ outlines
    let hl = new BABYLON.HighlightLayer("hl1", scene);
    hl.innerGlow = false;
    // blinking of highlight layer
    let alpha = 0;
    scene.registerBeforeRender(() => {
        alpha += 0.06;
        hl.blurHorizontalSize = 1.0 + Math.cos(alpha) * 0.6 + 0.6;
        hl.blurVerticalSize = 1.0 + Math.sin(alpha /3) * 0.6 + 0.6;
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
    
    // info box
    let infoBox = document.createElement('div');
    infoBox.id = "infoBox";
    infoBox.innerHTML = getHTMLText(textfields.default);
    infoBox.currentTextInfo = textfields.default;
    infoBox.reload = function(){
        this.innerHTML = getHTMLText(this.currentTextInfo);
    };

    // mode selection buttons
    let modesContainer = document.createElement('div');
    modesContainer.id = "modesContainer";
    let button_default = document.createElement('button');
    let button_hull = document.createElement('button');
    let button_plates = document.createElement('button');
    let button_electronic_circuit = document.createElement('button');
    let button_helium_system = document.createElement('button');
    let modeButtons = {default: button_default, hull: button_hull, plates: button_plates, electronic_circuit: button_electronic_circuit, helium_system: button_helium_system};
    Object.keys(modeButtons).forEach((mode) => {
        let button = modeButtons[mode];
        modesContainer.appendChild(button);
        button.id = "modeButton";
        button.style.backgroundColor = colModes[mode];
        button.onclick = (()=> selectMode(mode, textfields[mode]));
        button.innerHTML = getTransText(textfields[mode].name);
        button.reload = function(){
            this.innerHTML = getTransText(textfields[mode].name);
        };
    })
    button_default.innerHTML = getTransText('button_default');
    button_default.reload = function(){
        this.innerHTML = getTransText('button_default');
    };
    button_helium_system.style.backgroundColor ='#729FCF'
    canvasElement.appendChild(infoBox);
    canvasElement.appendChild(modesContainer);

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
            nametagTextBox.text = getTransText(objInfo.name);
            nametagTextBox.color = "white";
            buttonNametag.addControl(nametagTextBox);
            buttonNametag.reload = function() {
                this.children[0].text = getTransText(objInfo.name);
            }

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
            objMesh.overlayColor = new BABYLON.Color3.FromHexString(colModes[modeName]);
            objMesh.overlayAlpha = overlayPrimary;
            
            if(modeName == 'plates'){
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                    if(! showUI || currentSelection == 'hull'){
                        scene.hoverCursor = "auto";
                        return;
                    }
                    scene.hoverCursor = "pointer";
                    scene.getMeshesByTags(modeName, (mesh) => mesh.renderOverlay = true);
                }));
            }
            else{
                objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                    if(! showUI || currentSelection == 'hull'){
                        scene.hoverCursor = "auto";
                        return;
                    }
                    scene.hoverCursor = "pointer";
                    scene.getMeshesByTags(modeName, (mesh) => mesh.renderOverlay = true);
                    scene.getMeshesByTags(modeName, (mesh) => mesh.overlayAlpha = overlaySecondary);
                    buttonNametag.isVisible = true; //show nametag
                    objMesh.overlayAlpha = overlayPrimary;
                }));
            }

            objMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
                scene.getMeshesByTags(modeName, (mesh) => mesh.renderOverlay = false);
                if(currentSelection != objMesh && currentSelection != modeName){
                    buttonNametag.isVisible = false; //hide nametag
                }
            }));
            
            // click on object
            objMesh.inspectableCustomProperties = {
                select: function(){
                    clearSelection(false);
                    infoBox.innerHTML = getHTMLText(objInfo); // Obj Text
                    infoBox.currentTextInfo = objInfo;
                    buttonNametag.isVisible = true; //show nametag
                    hl.addMesh(objMesh, new BABYLON.Color3.FromHexString(colModes[modeName])); // highlight
                    cameraShot(objName);
                    currentSelection = objMesh;
                    currentMode = modeName;
                }
            };


            const clickObjectAction = function(){
                if(! showUI || currentSelection == 'hull'){
                    return;
                }
                if(modeName == 'plates'){
                    if(currentSelection == modeName){
                        clearSelection(true);
                    }
                    else{
                        selectMode(modeName, modeInfo);
                    }
                }

                else if(currentSelection == objMesh){
                    clearSelection(true);
                    }
                    else{
                        objMesh.inspectableCustomProperties.select();
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
                if(! ['default', 'hull'].includes(currentSelection)){
                    nametags[currentSelection].forEach(i => i.isVisible = false); // hide all nametags
                }
                else if (currentSelection == "hull"){
                    scene.getMeshByName('hull').setEnabled(false);
                }
                scene.getMeshesByTags(currentSelection, (mesh) => hl.removeMesh(mesh)); // hide all highlights
            }
            else{
                advancedTexture.getDescendants(true).filter(i => i.name == "buttonNametag" + "_" + currentSelection.name).forEach(i => i.isVisible = false); 
                hl.removeMesh(currentSelection);
            }
            if(toDefault){
                infoBox.innerHTML = getHTMLText(textfields.default); // default text
                infoBox.currentTextInfo = textfields.default;
                currentMode = 'none';
                currentSelection = 'default';
                cameraShot('default');
            }        
        }
    }

    const selectMode = function(modeName, modeInfo){
        clearSelection(false);
        infoBox.innerHTML = getHTMLText(modeInfo); // Mode Text
        infoBox.currentTextInfo = modeInfo;
        if(! ['default', 'hull'].includes(modeName)){
            nametags[modeName].forEach(i => i.isVisible = true); // show all nametags
        }
        if(modeName == 'hull'){
            scene.getMeshByName('hull').setEnabled(true);
        }

        scene.getMeshesByTags(modeName, (mesh) => hl.addMesh(mesh, new BABYLON.Color3.FromHexString(colModes[modeName]))); // highlight all
        cameraShot(modeName);
        currentSelection = modeName;
        currentMode = modeName;
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
            // TODO: remove hard coded value
            if(seqTag < 0 || seqTag > 21){
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
    
    const imgByLang = {'de_DE': 'assets/buttons/language_de_DE.png', 'en_US': 'assets/buttons/language_en_US.png'};
    let buttonChangeLang = BABYLON.GUI.Button.CreateImageOnlyButton(
        "buttonChangeLang",
        imgByLang[viewerLanguage]
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
    let buttonsDisable = [buttonForward, buttonBackward, buttonFullscreen, buttonChangeLang];
    buttonHideUI.onPointerClickObservable.add(function(){
        if(showUI){
            nametagsVis = advancedTexture.getDescendants().filter(con => con.name.startsWith("buttonNametag_") && con.isVisible == true);
            nametagsVis.forEach(con => con.isVisible = false);
            hl.isEnabled = false;
            buttonsDisable.forEach(function(button){
                button.isEnabled = false;
                button.isVisible = false;
            });
            Object.values(modeButtons).forEach(function(button){
                button.style.display = 'none';
                button.disabled = true;
            });

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
            });
            Object.values(modeButtons).forEach(function(button){
                button.style.display = 'initial';
                button.disabled = false;
            });
            infoBox.style.display = 'initial';
            showUI = true;
        }
    });

    buttonChangeLang.onPointerClickObservable.add(function(){
        if(viewerLanguage == 'en_US'){
            buttonChangeLang.children[0].source = imgByLang['de_DE'];
            viewerLanguage = 'de_DE';
        }
        else{
            buttonChangeLang.children[0].source = imgByLang['en_US'];
            viewerLanguage = 'en_US';
        }
        Object.values(nametags).forEach(nametagModes => nametagModes.forEach(nametag => nametag.reload()));
        infoBox.reload();
        Object.values(modeButtons).forEach(element => element.reload());
    });
        
    // make buttons bigger when hovered
    const buttons = [buttonForward, buttonBackward, buttonFullscreen, buttonHideUI, buttonChangeLang];
    buttons.forEach(button => button.onPointerMoveObservable.add(() => {button.scaleX = 1.1, button.scaleY = 1.1}));
    buttons.forEach(button => button.onPointerOutObservable.add(() => {button.scaleX = 1, button.scaleY = 1}));
    window.addEventListener("resize", function () {
        engine.resize();
    });
}