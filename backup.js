var line = new BABYLON.GUI.Line()
line.lineWidth = 4
line.color = "Orange"
line.y2 = 20
line.linkOffsetY = -20
advancedTexture.addControl(line)
scene.registerBeforeRender(function () {
    line.moveToVector3(sightLoc, scene)
})
line.connectedControl = infoButton