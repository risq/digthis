/*
                  _____              _____              _____             _______
                 /\    \            /\    \            /\    \           /::\    \
                /::\    \          /::\    \          /::\    \         /::::\    \
               /::::\    \         \:::\    \        /::::\    \       /::::::\    \
              /::::::\    \         \:::\    \      /::::::\    \     /::::::::\    \
             /:::/\:::\    \         \:::\    \    /:::/\:::\    \   /:::/~~\:::\    \
            /:::/__\:::\    \         \:::\    \  /:::/__\:::\    \ /:::/    \:::\    \
           /::::\   \:::\    \        /::::\    \ \:::\   \:::\    \:::/    / \:::\    \
          /::::::\   \:::\    \__    /::::::\    \_\:::\   \:::\    \:/____/   \:::\____\
         /:::/\:::\   \:::\____\ \  /:::/\:::\    \ \:::\   \:::\    \    |     |:::|    |
        /:::/  \:::\   \:::|    | \/:::/  \:::\____\ \:::\   \:::\____\___|     |:::|____|
        \::/   |::::\  /:::|____| /:::/    \::/    /  \:::\   \::/    /   _\___/:::/    /
         \/____|:::::\/:::/    /\/:::/    / \/____/\   \:::\   \/____/:\ |::| /:::/    /
               |:::::::::/    /:::::/    /      \:::\   \:::\    \  \:::\|::|/:::/    /
               |::|\::::/    /\::::/____/        \:::\   \:::\____\  \::::::::::/    /
               |::| \::/____/  \:::\    \         \:::\  /:::/    /   \::::::::/    /
               |::|  ~|         \:::\    \         \:::\/:::/    /     \::::::/    /
               |::|   |          \:::\    \         \::::::/    /       \::::/____/
               \::|   |           \:::\____\         \::::/    /         |::|    |
                \:|   |            \::/    /          \::/    /          |::|____|
                 \|___|             \/____/            \/____/            ~~

                          __             .___.__                                   __
       ________________ _/  |_  ____   __| _/|__| ____   ____   ___________       |__| ______
     _/ ___\_  __ \__  \\   __\/ __ \ / __ | |  |/ ___\ / ___\_/ __ \_  __ \      |  |/  ___/
     \  \___|  | \// __ \|  | \  ___// /_/ | |  / /_/  > /_/  >  ___/|  | \/      |  |\___ \
      \___  >__|  (____  /__|  \___  >____ | |__\___  /\___  / \___  >__|  /\ /\__|  /____  >
          \/           \/          \/     \/   /_____//_____/      \/      \/ \______|    \/

*/

/**
 *
 * cratedigger.js v0.0.1
 * By risq.
 *
 */


(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.cratedigger = factory(root);
    }
})(this, function(root) {

    'use strict';

    /*
     *  Variables
     */

    // Plugin
    var options = {},
        exports = {}, // Object for public APIs

        // DOM container elements
        rootContainerElement,
        canvasContainerElement,
        loadingContainerElement,
        infosContainerElement,
        titleInfosElement,
        artistInfosElement,
        coverInfosElement,

        // Three.js objects
        stats,
        scene,
        camera,
        target,
        renderer,
        projector,
        light,
        leftLight,
        rightLight,

        // Feature test
        supports = !!document.querySelector && !!root.addEventListener,

        // Objects arrays
        crates = [],
        records = [],

        // Three.js objects containers
        rootContainer,
        cratesContainer,
        recordsContainer,

        // States, util vars
        canvasWidth,
        canvasHeight,
        scrollRecordsTimeout,
        isLoading = false,
        infosPanelState = "closed",
        isScrolling = false,
        doRender = true,
        mouse = {
            x: 0,
            y: 0
        },
        mouseDownPos = {
            x: 0,
            y: 0
        },
        targetCameraPos = {
            x: 0,
            y: 0
        },
        selectedRecord = -1,
        shownRecord = -1,
        loadedRecords = 0,

        // Materials
        wood_material, 

        // Default settings
        defaults = {
            debug: true,
            canvasWidth: null,
            canvasHeight: null,
            nbCrates: 2,
            recordsPerCrate: 24,
            lightIntensity: 1,
            cameraMouseMove: true,
            backgroundColor: 0x111111,
            sleeveColor: 0x0d0702,
            closeInfoPanelOnClick: true,
            closeInfoPanelOnScroll: true,
            infoPanelOpacity: 0.9,
            updateCanvasSizeOnWindowResize: false,
            callbackBefore: function() {},
            callbackAfter: function() {},
            elements: {
                rootContainerId: 'cratedigger',
                canvasContainerId: 'cratedigger-canvas',
                loadingContainerId: 'cratedigger-loading',
                infosContainerId: 'cratedigger-infos',
                titleContainerId: 'cratedigger-record-title',
                artistContainerId: 'cratedigger-record-artist',
                coverContainerId: 'cratedigger-record-cover'
            },
            constants: {
                recordMoveTime: 1000,
                cameraMoveTime: 800,
                infosOpenTime: 800,
                recordShownY: 25,
                recordFlippedY: 110,
                cameraBasePosition: {
                    x: 270,
                    y: 180,
                    z: 110
                },
                cameraFocusPosition: {
                    x: 140,
                    y: 180,
                    z: 80
                },
                cameraMouseMoveSpeedY: 0.07,
                cameraMouseMoveSpeedZ: 0.03,
                grabSensitivity: 6
            }
        };

    /*
     *  Classes
     */
    var Record = function(id, crateId, pos) {
        this.id = id;
        this.crateId = crateId;
        this.pos = pos;
        this.state = 'out';
        this.recordXPos = -62 + (135 / options.recordsPerCrate) * pos;
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(100, 1.5, 100, 1, 1, 1), new THREE.MeshFaceMaterial(getRecordMaterial(null, false)));
        this.mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(50, 0, 0));
        this.mesh.position.set(this.recordXPos, 0, 0);
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.recordId = id;
        this.mesh.visible = false;
        this.absolutePosition = new THREE.Vector3();
        this.pushRecord();
    };

    Record.prototype.log = function() {
        console.log("Record n°", this.id,
            "crateId =", this.crateId,
            "pos =", this.pos);
    };

    Record.prototype.showRecord = function() {
        if (this.state !== 'shown') {
            this.state = 'shown';
            this.absolutePosition.setFromMatrixPosition(this.mesh.matrixWorld);
            new TWEEN.Tween(this.mesh.position)
                .to({
                    y: options.constants.recordShownY
                }, options.constants.recordMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

            new TWEEN.Tween(this.mesh.rotation)
                .to({
                    z: Math.PI / 2
                }, options.constants.recordMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

            new TWEEN.Tween(target.position)
                .to({
                    x: this.recordXPos,
                    y: 50 + options.constants.recordShownY,
                    z: this.absolutePosition.z
                }, options.constants.cameraMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

            new TWEEN.Tween(camera.position)
                .to({
                    x: this.recordXPos + options.constants.cameraFocusPosition.x,
                    y: options.constants.cameraFocusPosition.y,
                    z: this.absolutePosition.z + options.constants.cameraFocusPosition.z
                }, options.constants.cameraMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

        }
    };

    Record.prototype.pushRecord = function() {
        if (this.state != 'pushed') {
            this.state = 'pushed';
            new TWEEN.Tween(this.mesh.position)
                .to({
                    y: 0
                }, options.constants.recordMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

            new TWEEN.Tween(this.mesh.rotation)
                .to({
                    z: Math.PI / 2 + Math.PI / 7
                }, options.constants.recordMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

        }
    };

    Record.prototype.pullRecord = function() {
        if (this.state !== 'pulled') {
            this.state = 'pulled';
            new TWEEN.Tween(this.mesh.position)
                .to({
                    y: 0
                }, options.constants.recordMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

            new TWEEN.Tween(this.mesh.rotation)
                .to({
                    z: Math.PI / 2 - Math.PI / 7
                }, options.constants.recordMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

        }
    };

    Record.prototype.flipRecord = function(done) {
        this.state = 'flipped';
        new TWEEN.Tween(this.mesh.position)
            .to({
                y: options.constants.recordFlippedY
            }, options.constants.infosOpenTime)
            .easing(TWEEN.Easing.Quartic.Out).start();

        new TWEEN.Tween(this.mesh.rotation)
            .delay(options.constants.infosOpenTime / 4)
            .to({
                y: Math.PI
            }, options.constants.infosOpenTime)
            .easing(TWEEN.Easing.Quartic.Out).start();

        new TWEEN.Tween(target.position)
            .to({
                x: this.recordXPos,
                y: options.constants.recordFlippedY + 50,
                z: this.absolutePosition.z
            }, options.constants.infosOpenTime)
            .easing(TWEEN.Easing.Quartic.Out).start()
            .onComplete(done);
    };

    Record.prototype.flipBackRecord = function(done) {
        if (this.state === 'flipped') {
            new TWEEN.Tween(this.mesh.position)
                .delay(options.constants.infosOpenTime / 2)
                .to({
                    y: 0
                }, options.constants.infosOpenTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

            new TWEEN.Tween(this.mesh.rotation)
                .to({
                    y: 0
                }, options.constants.infosOpenTime / 2)
                .easing(TWEEN.Easing.Quartic.Out).start()
                .onComplete(done);

            new TWEEN.Tween(target.position)
                .delay(options.constants.infosOpenTime / 2)
                .to({
                    x: this.recordXPos,
                    y: 75,
                    z: this.absolutePosition.z
                }, options.constants.infosOpenTime)
                .easing(TWEEN.Easing.Quartic.Out).start();
        }
    };

    /*
     *  Base Methods
     */
    var extend = function(defaults, options) {
        for (var key in options) {
            if (Object.prototype.hasOwnProperty.call(options, key)) {
                defaults[key] = options[key];
            }
        }
        return defaults;
    };

    var animate = function() {
        if (doRender) {
            requestAnimationFrame(animate);
            render();
            if (options.debug) {
                stats.update();
            }
        }
    };

    var render = function() {
        //        rootContainer.rotation.y += 0.01;

        TWEEN.update();
        updateShownRecord();
        if (options.cameraMouseMove) {
            targetCameraPos.x = (mouse.x / canvasWidth - 0.5) * 0.25; // inverse axis?
            targetCameraPos.y = (mouse.y / canvasWidth - 0.5) * 0.25;
            rootContainer.rotation.y += options.constants.cameraMouseMoveSpeedY * (targetCameraPos.x - rootContainer.rotation.y);
            rootContainer.rotation.z += options.constants.cameraMouseMoveSpeedZ * (targetCameraPos.y - rootContainer.rotation.z);
        }
        camera.lookAt(target.position);

        renderer.render(scene, camera);
    };

    /*
     * Loading methods
     */
    var unloadRecords = function() {
        for (var i = 0; i < records.length; i++) {
            records[i].data = null;
            records[i].mesh.visible = false;
        }
        loadedRecords = 0;
    };


    var loadRecords = function(recordsData) {
        if (loadedRecords > 0) {
            unloadRecords();
        }
        for (var i = 0; i < records.length && i < recordsData.length; i++) {
            records[i].data = recordsData[i];
            records[i].mesh.visible = true;
            records[i].mesh.material.materials = getRecordMaterial(recordsData[i].cover, recordsData[i].hasSleeve);
        }
        loadedRecords = recordsData.length < records.length ? recordsData.length : records.length;
        console.log('loadedRecords', loadedRecords);
    };


    /*
     * Records select methods
     */
    var selectRecord = function(id) {
        if (infosPanelState === 'opened') {
            flipBackSelectedRecord();
        } else if (infosPanelState !== 'opening' && infosPanelState !== 'closing') {
            selectedRecord = id;
        }
    };

    var flipSelectedRecord = function() {
        fillInfosPanel(records[selectedRecord]);
        infosPanelState = 'opening';
        records[selectedRecord].flipRecord(function() {
            infosPanelState = 'opened';
        });
        setTimeout(function() {
            fadeIn(infosContainerElement);
        }, 300);
    };

    var flipBackSelectedRecord = function() {
        if (infosPanelState === 'opened') {
            fadeOut(infosContainerElement);
            infosPanelState = 'closing';
            records[selectedRecord].flipBackRecord(function() {
                infosPanelState = 'closed';
            });
        }
    };

    var updateShownRecord = function() {
        if (infosPanelState === 'closed' && shownRecord != selectedRecord) {
            //console.log('updateShownRecord..');
            shownRecord = selectedRecord;
            for (var recordId = 0; recordId < loadedRecords; recordId++) {
                if (selectedRecord == -1) {
                    records[recordId].pushRecord();
                } else if (recordId > selectedRecord &&
                    recordId > records[selectedRecord].crateId * options.recordsPerCrate &&
                    recordId < (records[selectedRecord].crateId * options.recordsPerCrate) + options.recordsPerCrate) {
                    records[recordId].pullRecord();
                } else if (recordId == selectedRecord) {
                    records[recordId].showRecord();
                } else {
                    records[recordId].pushRecord();
                }
            }
        }
    };

    var resetShownRecord = function() {
        if (infosPanelState === 'opened') {
            flipBackSelectedRecord();
        } else if (infosPanelState !== 'opening' && infosPanelState !== 'closing') {
            selectedRecord = -1;
            new TWEEN.Tween(target.position)
                .to({
                    x: 0,
                    y: 0,
                    z: 0
                }, options.constants.cameraMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();

            new TWEEN.Tween(camera.position)
                .to({
                    x: options.constants.cameraBasePosition.x,
                    y: options.constants.cameraBasePosition.y,
                    z: options.constants.cameraBasePosition.z
                }, options.constants.cameraMoveTime)
                .easing(TWEEN.Easing.Quartic.Out).start();
        }
    };

    var selectPrevRecord = function() {
        if (selectedRecord == -1) {
            selectRecord(loadedRecords - 1);
        } else if (selectedRecord < loadedRecords - 1) {
            selectRecord(selectedRecord + 1);
        } else {
            selectRecord(0);
        }
    };

    var selectNextRecord = function() {
        if (selectedRecord == -1) {
            selectRecord(0);
        } else if (selectedRecord > 0) {
            selectRecord(selectedRecord - 1);
        } else {
            selectRecord(loadedRecords - 1);
        }
    };

    var fillInfosPanel = function(record) {
        if (record.data.title) {
            titleInfosElement.innerHTML = record.data.title;
        }
        if (record.data.artist) {
            artistInfosElement.innerHTML = record.data.artist;
        }
        if (record.data.cover) {
            coverInfosElement.style.backgroundImage = 'url(' + record.data.cover + ')';
        }
    };

    /*
     * Events handling
     */
    var onMouseMoveEvent = function(e) {
        var m_posx = 0,
            m_posy = 0,
            e_posx = 0,
            e_posy = 0,
            obj = this;

        //get mouse position on document crossbrowser
        if (!e) {
            e = window.event;
        }
        if (e.pageX || e.pageY) {
            m_posx = e.pageX;
            m_posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            m_posx = e.clientX + document.body.scrollLeft +
                document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop +
                document.documentElement.scrollTop;
        }
        //get parent element position in document
        if (obj.offsetParent) {
            do {
                e_posx += obj.offsetLeft;
                e_posy += obj.offsetTop;
            } while (obj = obj.offsetParent); // jshint ignore:line
        }
        // mouse position minus elm position is mouseposition relative to element:
        mouse.x = m_posx - e_posx;
        mouse.y = m_posy - e_posy;
    };

    var onScrollEvent = function(e) {
        if (infosPanelState === 'closed') {
            if (wheelDirection(e) < 0) {
                selectPrevRecord();
            } else {
                selectNextRecord();
            }
        } else if (infosPanelState === 'opened' && options.closeInfoPanelOnScroll) {
            flipBackSelectedRecord();
        }
        return false;
    };

    var onClickEvent = function(mouseDownPos) {
        if (infosPanelState === 'closed') {
            var vector = new THREE.Vector3(
                ((mouseDownPos.x - renderer.domElement.offsetLeft) / renderer.domElement.width) * 2 - 1, -((mouseDownPos.y - renderer.domElement.offsetTop) / renderer.domElement.height) * 2 + 1,
                0.5
            );
            projector.unprojectVector(vector, camera);
            var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
            var intersects = raycaster.intersectObjects(cratesContainer.children, true);

            if (intersects.length > 0 && intersects[0].object.recordId >= 0) {
                var clickedRecord = records[intersects[0].object.recordId];
                if (selectedRecord === clickedRecord.id) {
                    flipSelectedRecord();
                } else {
                    selectRecord(clickedRecord.id);
                }
            } else {
                resetShownRecord();
            }
        }
    };

    var onMouseDownEvent = function(e) {
        clearInterval(scrollRecordsTimeout);
        if (infosPanelState === 'closed') {
            scrollRecords(mouse.y);
            mouseDownPos = {
                x: mouse.x,
                y: mouse.y
            };
        } else if (infosPanelState === 'opened' && options.closeInfoPanelOnClick) {
            flipBackSelectedRecord();
        }
    };

    var onMouseUpEvent = function(e) {
        clearInterval(scrollRecordsTimeout);
        classie.remove(renderer.domElement, 'grab');
        if (coordsEqualsApprox(mouseDownPos, mouse, options.constants.grabSensitivity)) {
            onClickEvent(mouseDownPos);
        }
    };

    var scrollRecords = function(baseY) {
        scrollRecordsTimeout = setTimeout(function() {
            classie.add(renderer.domElement, 'grab');
            var delta = (baseY - mouse.y) / canvasHeight;
            if (delta > 0) {
                selectNextRecord();
                //console.log("NEXT RECORD " + delta);
            } else if (delta < 0) {
                selectPrevRecord();
                //console.log("PREV RECORD " + delta);
            }
            scrollRecords(baseY);
        }, 75);
    };

    var onWindowResizeEvent = function(e) {
        calculateCanvasSize();
        setCanvasDimensions();

        renderer.setSize(canvasWidth, canvasHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };

    /*
     *  INITIALISATION
     */
    var initScene = function() {
        // scene, renderer, camera,...
        scene = new THREE.Scene();

        renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setSize(canvasWidth, canvasHeight);

        canvasContainerElement.appendChild(renderer.domElement);
        renderer.domElement.id = "context";
        renderer.setClearColor(options.backgroundColor, 1);

        camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 20000);

        target = new THREE.Object3D();
        //        target = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10, 1, 1, 1));
        //        scene.add(target);
        camera.lookAt(target.position);

        projector = new THREE.Projector();

        var wood_texture = THREE.ImageUtils.loadTexture('img/wood.jpg');
        wood_texture.anisotropy = renderer.getMaxAnisotropy();
        wood_material = new THREE.MeshLambertMaterial({
            map: wood_texture
        });

        rootContainer = new THREE.Object3D();
        cratesContainer = new THREE.Object3D();
        scene.add(rootContainer);
        rootContainer.add(cratesContainer);

        initCrates();
        initRecords();

        light = new THREE.PointLight(0xFFFFFF, options.lightIntensity * 1.1);
        light.position.set(300, 80, 0);
        scene.add(light);

        leftLight = new THREE.PointLight(0xFFFFFF, options.lightIntensity * 0.6);
        leftLight.position.set(-100, 300, 1000);
        scene.add(leftLight);

        rightLight = new THREE.PointLight(0xFFFFFF, options.lightIntensity * 0.6);
        rightLight.position.set(-100, 300, -1000);
        scene.add(rightLight);

        rootContainerElement.addEventListener('DOMMouseScroll', onScrollEvent, false);
        rootContainerElement.addEventListener('mousewheel', onScrollEvent, false);
        rootContainerElement.addEventListener('mousemove', onMouseMoveEvent, false);
        rootContainerElement.addEventListener('mousedown', onMouseDownEvent, false);
        rootContainerElement.addEventListener('mouseup', onMouseUpEvent, false);

        if (options.updateCanvasSizeOnWindowResize) {
            window.addEventListener('resize', onWindowResizeEvent, false);
        }

        //        renderer.domElement.addEventListener('click', onClickEvent, false);

        // DOM setup
        rootContainerElement.style.position = 'relative';
        canvasContainerElement.style.position = 'absolute';
        infosContainerElement.style.position = 'absolute';
        loadingContainerElement.style.position = 'absolute';

        console.log(canvasHeight);

        setCanvasDimensions();

        infosContainerElement.style.display = 'none';
        fadeOut(loadingContainerElement);

        if (options.debug) {
            initDebug();
        }
        resetShownRecord();
        animate();
    };

    var initDebug = function() {
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = "0";
        stats.domElement.style.top = "0";
        rootContainerElement.appendChild(stats.domElement);

        var debug = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20, 1, 1, 1));
        debug.position.set(
            light.position.x,
            light.position.y,
            light.position.z
        );
        scene.add(debug);

    };

    var initCrates = function() {
        for (var crateId = 0; crateId < options.nbCrates; crateId++) {
            var crate = createCrate(crateId);
            cratesContainer.add(crate);
        }
        cratesContainer.position.z = -(110 - (110 * options.nbCrates)) / 2;
    };

    var createCrate = function(id) {
        crates[id] = new THREE.Object3D();

        var box_bottom = new THREE.Mesh(new THREE.BoxGeometry(200, 10, 100), wood_material);
        crates[id].add(box_bottom);

        var box_left = new THREE.Mesh(new THREE.BoxGeometry(200, 10, 80), wood_material);
        box_left.position.set(0, 35, -55);
        box_left.rotation.x = Math.PI / 2;
        crates[id].add(box_left);

        if (id === 0) {
            var box_right = new THREE.Mesh(new THREE.BoxGeometry(200, 10, 80), wood_material);
            box_right.position.set(0, 35, 55);
            box_right.rotation.x = Math.PI / 2;
            crates[id].add(box_right);
        }

        var box_back = new THREE.Mesh(new THREE.BoxGeometry(80, 10, 120), wood_material);
        box_back.position.set(-105, 35, 0);
        box_back.rotation.z = Math.PI / 2;
        crates[id].add(box_back);

        var box_front = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 100), wood_material);
        box_front.position.set(95, 25, 0);
        box_front.rotation.z = Math.PI / 2;
        crates[id].add(box_front);

        crates[id].position.z = -110 * id;
        return crates[id];
    };

    var initRecords = function() {
        var currentRecordId = 0;
        for (var crateId = 0; crateId < crates.length; crateId++) {
            for (var pos = 0; pos < options.recordsPerCrate; pos++) {
                createRecord(currentRecordId, crateId, pos);
                currentRecordId++;
            }
        }
    };

    var createRecord = function(id, crateId, pos) {
        var record = new Record(id, crateId, pos);
        crates[crateId].add(record.mesh);
        records.push(record);
    };

    var getRecordMaterial = function(src, hasSleeve) {
        var img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src ? src : '';

        var imgWidth = 400,
            imgHeight = 400,
            mapCanvas = document.createElement('canvas');

        mapCanvas.width = mapCanvas.height = 400;

        var texture = new THREE.Texture(mapCanvas);

        img.onload = function() {
            if (hasSleeve) {
                var sleeve = new Image();
                sleeve.src = 'img/sleeve.png';

                sleeve.onload = function() {
                    var ctx = mapCanvas.getContext('2d');
                    ctx.translate(imgWidth / 2, imgHeight / 2);
                    ctx.rotate(Math.PI / 2);
                    ctx.translate(-imgWidth / 2, -imgHeight / 2);
                    ctx.drawImage(img, 130, 130, 135, 135);
                    ctx.drawImage(sleeve, 0, 0, 400, 400);
                    texture.needsUpdate = true;
                };
            } else {
                var ctx = mapCanvas.getContext('2d');
                ctx.translate(imgWidth / 2, imgHeight / 2);
                ctx.rotate(Math.PI / 2);
                ctx.translate(-imgWidth / 2, -imgHeight / 2);
                ctx.drawImage(img, 0, 0, 400, 400);
                texture.needsUpdate = true;
            }
        };

        var sleeveMaterial = new THREE.MeshLambertMaterial({
            color: options.sleeveColor
        });

        var materials = [
            sleeveMaterial,
            sleeveMaterial,
            sleeveMaterial,
            // texture
            new THREE.MeshLambertMaterial({
                color: 0xffffff,
                map: texture
            }),
            sleeveMaterial,
            sleeveMaterial
        ];
        return materials;
    };

    /*
     *  Utils
     */
    var wheelDistance = function(e) {
        if (!e) e = event;
        var w = e.wheelDelta,
            d = e.detail;
        if (d) {
            if (w) return w / d / 40 * d > 0 ? 1 : -1; // Opera
            else return -d / 3; // Firefox;
        } else return w / 120; // IE/Safari/Chrome
    };

    var wheelDirection = function(e) {
        if (!e) e = event;
        return (e.detail < 0) ? 1 : (e.wheelDelta > 0) ? 1 : -1;
    };

    var coordsEqualsApprox = function(coord1, coord2, range) {
        return (Math.abs(coord1.x - coord2.x) <= range) && (Math.abs(coord1.y - coord2.y) <= range);
    };

    var fadeOut = function(element) {
        if (element.style.opacity <= 0) {
            element.style.display = 'none';
            element.style.opacity = 0;
        } else {
            element.style.opacity -= 0.1;
            setTimeout(function() {
                fadeOut(element);
            }, 10);
        }
    };

    var fadeIn = function(element, op) {
        if (element.style.opacity < options.infoPanelOpacity) {
            if (element.style.display == 'none') {
                element.style.display = 'block';
                op = 0;
            }
            op += 0.03;
            element.style.opacity = op;
            setTimeout(function() {
                fadeIn(element, op);
            }, 10);
        } else {
            element.style.opacity = options.infoPanelOpacity;
        }
    };

    var calculateCanvasSize = function() {
        canvasWidth = options.canvasWidth ? options.canvasWidth : rootContainerElement.clientWidth;
        canvasHeight = options.canvasHeight ? options.canvasHeight : rootContainerElement.clientHeight;
    };

    var setCanvasDimensions = function() {
        //rootContainerElement.style.height     = canvasHeight + 'px';
        canvasContainerElement.style.height = canvasHeight + 'px';
        infosContainerElement.style.height = canvasHeight + 'px';
        loadingContainerElement.style.height = canvasHeight + 'px';

        //rootContainerElement.style.width     = canvasWidth + 'px';
        canvasContainerElement.style.width = canvasWidth + 'px';
        infosContainerElement.style.width = canvasWidth + 'px';
        loadingContainerElement.style.width = canvasWidth + 'px';
    };

    /*
     *  Exports
     */
    exports.init = function(params) {
        options = extend(defaults, params);
        // feature test
        if (!supports || !Modernizr.webgl) return;
        console.log('initializing...');
        console.log('options:', options);

        rootContainerElement = document.getElementById(options.elements.rootContainerId);
        if (!rootContainerElement) {
            console.error('cratedigger.js - Init failed : can not find root container element.');
            return;
        }
        canvasContainerElement = document.getElementById(options.elements.canvasContainerId);
        if (!canvasContainerElement) {
            console.error('cratedigger.js - Init failed : can not find canvas container element.');
            return;
        }
        loadingContainerElement = document.getElementById(options.elements.loadingContainerId);
        if (!loadingContainerElement) {
            console.error('cratedigger.js - Init failed : can not find loading container element.');
            return;
        }
        infosContainerElement = document.getElementById(options.elements.infosContainerId);
        if (!infosContainerElement) {
            console.error('cratedigger.js - Init failed : can not find infos container element.');
            return;
        }
        titleInfosElement = document.getElementById(options.elements.titleContainerId);
        if (!titleInfosElement) {
            console.error('cratedigger.js - Init failed : can not find record title container element.');
            return;
        }
        artistInfosElement = document.getElementById(options.elements.artistContainerId);
        if (!artistInfosElement) {
            console.error('cratedigger.js - Init failed : can not find record artist container element.');
            return;
        }
        coverInfosElement = document.getElementById(options.elements.coverContainerId);
        if (!coverInfosElement) {
            console.error('cratedigger.js - Init failed : can not find cover image container element.');
            return;
        }

        calculateCanvasSize();

        initScene();
    };
    exports.selectRecord = function(id) {
        if (id < 0) {
            resetShownRecord();
        } else if (id > loadedRecords) {
            selectedRecord = loadedRecords - 1;
        } else {
            selectedRecord = id;
        }
    };
    exports.startRender = function() {
        doRender = true;
        animate();
    };
    exports.stopRender = function() {
        doRender = false;
    };
    exports.loadRecords = loadRecords;
    exports.unloadRecords = unloadRecords;
    exports.resetShownRecord = resetShownRecord;
    exports.canvas = function() {
        return renderer.domElement;
    };

    //
    // Public API
    //

    return exports;
});