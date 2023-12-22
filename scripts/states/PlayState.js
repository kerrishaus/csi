import { State } from "./State.js";

import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import * as MathUtility     from "../MathUtility.js";
import * as PageUtility     from "../PageUtility.js";
import * as GeometryUtility from "../GeometryUtility.js"

import { Player } from "../Player.js";
import { PoliceCar } from "../PoliceCar.js";

import { Entity } from "../entity/Entity.js";

export class PlayState extends State
{
    init()
    {
        PageUtility.addStyle("game");
        PageUtility.addStyle("interface");
        PageUtility.addStyle("banner");
        PageUtility.addStyle("buyMenu");
        PageUtility.addStyle("pauseMenu");

        $(document.body).append(`
            <div id='interface' class="gameInterfaceContainer">
                <div id="pauseMenu" class="game-menu" data-visibility="hidden">
                    <button id="resetSave">reset save file</button>
                </div>
                <div id="businessStats">
                    <div id="moneyContainer">
                        <i class='fa fa-money'></i> Money: $<span id='money'>0</span>
                    </div>
                    <div id="reputationContainer">
                        <i class='fa fa-shield'></i> Reputation: <span id='reputation'>0</span>
                    </div>
                    <div>
                        <i class='fa fa-users'></i> Customers in store: <span id="customerCount">0</span>
                    </div>
                    <div>
                        <i class='fa fa-users'></i> Customers waiting to checkout: <span id="waitingCustomers">0</span>
                    </div>
                </div>
                <div id="buyMenu" class="game-menu" data-visibility="hidden">
                    <div class="titlebar display-flex space-between">
                        <h1>Buy Menu</h1>
                        <div id="buyMenuClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <hr />
                    <div class="buy-menu-container">
                        <h1>Shop Upgrades</h1>
                        <div id="shopUpgrades">
                        </div>
                    </div>
                    <div class="buy-menu-container">
                        <h1>Tiles</h1>
                        <div id="tiles" class="display-flex flex-wrap">
                        </div>
                    </div>
                    <div class="buy-menu-container">
                        <h1>Employees</h1>
                        <button id="hireEmployee">Hire Employee</button>
                        <div id="employees">
                        </div>
                    </div>
                </div>
                <div id="saveIcon">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
            </div>
        `);

        window.oncontextmenu = (event) =>
        {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };

        this.clock = new THREE.Clock();

        const shopFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0xE0E0E0, side: THREE.FrontSide })
        );
        shopFloor.receiveShadow = true;
        shopFloor.position.set(0, 0, 0);
        shopFloor.rotateX(- Math.PI / 2);
        scene.add(shopFloor);

        // shop north wall
        //const northWall = GeometryUtility.createCube(new THREE.Vector3(shopLength, 4, wallThickness), new THREE.Vector3(0, 1.5, shopWidth / 2 - wallThickness / 2 + 1), 0xbfbfbf);
        //scene.add(northWall);

        // west wall
        //scene.add(GeometryUtil.createCube(new Vector3(wallThickness, shopWidth, 4), new Vector3(shopWidth / 2 - wallThickness / 2 + 1, 0, 1.5), 0xbfbfbf));
        // east wall
        //scene.add(GeometryUtil.createCube(new Vector3(wallThickness, shopWidth, 4), new Vector3(-shopWidth / 2 - wallThickness / 2, 0, 1.5), 0xbfbfbf));
        
        //const backroomFloor = new RigidBodyCube(new Vector3(shopWidth, shopLength / 2, wallThickness), 0x878787, new Vector3(0, -15, -1), new Quaternion(), 0);
        //scene.add(backroomFloor);

        /*
        const light2 = new THREE.AmbientLight(0xaaaaaa);
        scene.add(light2);
        */
        
        this.policeCar = new PoliceCar();
        scene.add(this.policeCar);

        window.player = new Player();
        scene.add(player);

        player.registerEventListeners();

        window.addEventListener("keydown", (event) =>
        {
            if (event.code == "KeyO")
            {
                this.freeCam = !this.freeCam;
                freeControls.enabled = this.freeCam;

                camera.position.y = 8;
                camera.lookAt(new THREE.Vector3(0, 0, 0));

                console.log("freecam toggled");
            }
            else if (event.code == "Escape")
            {
                if ($("#pauseMenu").attr("data-visibility") == "shown")
                    this.closePauseMenu();
                else
                    this.openPauseMenu();
            }
        });

        $(renderer.domElement).show();
        $(htmlRenderer.domElement).show();
        
        this.animate();
    }

    cleanup()
    {
        PageUtility.removeStyle("game");
        PageUtility.removeStyle("banner");
        PageUtility.removeStyle("interface");
        PageUtility.removeStyle("buyMenu");
        PageUtility.removeStyle("pauseMenu");

        player.removeEventListeners();

        window.onbeforeunload = null;
    }

    openBuyMenu()
    {
        $(".game-menu").attr("data-visibility", "hidden");
        $("#buyMenu").attr("data-visibility", "shown");
        player.disableMovement();
    }

    closeBuyMenu()
    {
        $("#buyMenu").attr("data-visibility", "hidden");
        player.enableMovement();
    }

    openPauseMenu()
    {
        $(".game-menu").attr("data-visibility", "hidden");

        $("#pauseMenu").attr("data-visibility", "shown");
        player.disableMovement();
    }

    closePauseMenu()
    {
        $("#pauseMenu").attr("data-visibility", "hidden");
        player.enableMovement();
    }

    physicsStep(deltaTime)
    {
        physicsWorld.stepSimulation(deltaTime, 10);

        for (const object of physicsBodies)
        {
            object.motionState.getWorldTransform(tmpTransform);

            const pos = tmpTransform.getOrigin();
            const quat = tmpTransform.getRotation();
            const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
            const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());
            
            object.position.copy(pos3);
            object.quaternion.copy(quat3);
        }

        detectCollision();
    }

    detectCollision()
    {
        let dispatcher = physicsWorld.getDispatcher();
        let numManifolds = dispatcher.getNumManifolds();

        for ( let i = 0; i < numManifolds; i ++ )
        {
            let contactManifold = dispatcher.getManifoldByIndexInternal( i );
            let numContacts = contactManifold.getNumContacts();

            for ( let j = 0; j < numContacts; j++ )
            {
                let contactPoint = contactManifold.getContactPoint( j );
                let distance = contactPoint.getDistance();

                if (distance > 0.0)
                    continue;

                //console.log({manifoldIndex: i, contactIndex: j, distance: distance});
            }
        }
    }
    
    animate()
    {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        if (!this.freeCam && player.move !== null)
        {
            let position = new THREE.Vector2(), target = new THREE.Vector2();
            let velocity = 0;

            if (player.move == player.MoveType.Touch)
            {
                position = player.pointerMoveOrigin;
                target = player.mouse;

                velocity = player.pointerMoveOrigin.distanceTo(new THREE.Vector3(player.mouse.x, player.mouse.y)) / 2;
            }
            else
            {
                if (player.move == player.MoveType.Keyboard)
                {
                    const moveAmount = player.maxSpeed;

                    if (player.keys["KeyW"] || player.keys["ArrowUp"])
                        player.moveTarget.translateY(moveAmount);
                    if (player.keys["KeyA"] || player.keys["ArrowLeft"])
                        player.moveTarget.translateX(-moveAmount);
                    if (player.keys["KeyS"] || player.keys["ArrowDown"])
                        player.moveTarget.translateY(-moveAmount);
                    if (player.keys["KeyD"] || player.keys["ArrowRight"])
                        player.moveTarget.translateX(moveAmount);

                    player.moveTarget.quaternion.copy(player.quaternion);
                }
                else if (player.move == player.MoveType.Mouse)
                {
                    player.raycaster.setFromCamera(player.mouse, camera);
                    player.raycaster.ray.intersectPlane(player.plane, player.intersects);
                    player.moveTarget.position.copy(player.intersects);
                }

                position.x = player.position.x;
                position.y = player.position.z;

                target.x = player.moveTarget.position.x;
                target.y = player.moveTarget.position.z;

                velocity = player.position.distanceTo(player.moveTarget.position) / 20;
            }

            // set the player's direction
            player.rotation.y = - MathUtility.angleToPoint(position, target);

            // clamp the player's velocity
            velocity = MathUtility.clamp(velocity, 0, player.maxSpeed);

            // move the player their direction
            player.translateZ(velocity);
        }

        if (!this.freeCam)
        {
            // TODO: put the camera in Player
            camera.position.x = player.position.x;
            camera.position.z = player.position.z - 6;
            camera.lookAt(player.position);
        }

        scene.traverse((object) =>
        {
            // if the object is a trigger, check if any geometry boxes are within it
            if (object instanceof Entity && object.hasComponent("TriggerComponent"))
            {
                const triggerComponent = object.getComponent("TriggerComponent");

                scene.children.forEach((object2) =>
                {
                    if (object2 == object ||
                        object2.parentEntity == object ||
                        object.parentEntity == object2 ||
                        object2.dontTrigger)
                        return;

                    if (object2 instanceof Entity && object2.hasComponent("GeometryComponent"))
                    {
                        const geometryComponent = object2.getComponent("GeometryComponent");

                        if (triggerComponent.box.intersectsBox(geometryComponent.box))
                            triggerComponent.triggeringEntities.push(object2);
                    }
                });
            }

            if ('update' in object)
                object.update(deltaTime);
        });

        //physicsStep(deltaTime);

        if (this.freeCam)
            freeControls.update();

            /*
        if (mixer)
            mixer.update(deltaTime);
            */
        
        composer.render();
        htmlRenderer.render(scene, camera);
    };
}