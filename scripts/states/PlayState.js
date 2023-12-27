import { State } from "./State.js";

import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import * as MathUtility     from "../MathUtility.js";
import * as PageUtility     from "../PageUtility.js";
import * as GeometryUtility from "../GeometryUtility.js"

import { Player } from "../Player.js";
import { Killer } from "../Killer.js";
import { PoliceCar } from "../PoliceCar.js";

import { Entity } from "../entity/Entity.js";

export class PlayState extends State
{
    init()
    {
        window.oncontextmenu = (event) =>
        {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };

        this.clock = new THREE.Clock();

        const shopFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshStandardMaterial({ color: 0xE0E0E0, side: THREE.FrontSide })
        );
        shopFloor.receiveShadow = true;
        shopFloor.position.set(0, 0, 0);
        shopFloor.rotateX(- Math.PI / 2);
        scene.add(shopFloor);

        this.worldLight = new THREE.AmbientLight(0x404040, 1); // soft white light
        scene.add(this.worldLight);

        //this.policeCar = new PoliceCar();
        //scene.add(this.policeCar);

        window.player = new Player();
        scene.add(player);

        // TODO: find a better hack for this
        window.killer = new Killer(20);
        killer.position.set(20, 0, 0);
        killer.getComponent("TriggerComponent").triggerEnabled = false;
        killer.update(0);
        killer.getComponent("TriggerComponent").triggerEnabled = true;
        scene.add(killer);
        
        player.registerEventListeners();

        window.addEventListener("keydown", (event) =>
        {
            if (event.code == "KeyO")
            {
                this.freeCam = !this.freeCam;
                freeControls.enabled = this.freeCam;
                freeControls.target.copy(player.position);
                freeControls.update();

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
        player.removeEventListeners();

        window.onbeforeunload = null;
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
                        object2.dontTrigger ||
                        object2.parentEntity == object ||
                        object.parentEntity == object2)
                        return;

                    if (object2 instanceof Entity && object2.hasComponent("GeometryComponent"))
                    {
                        const geometryComponent = object2.getComponent("GeometryComponent");

                        if (triggerComponent.triggerGeometry.userData.obb.intersectsOBB(geometryComponent.mesh.userData.obb))
                            triggerComponent.triggeringEntities.push(object2);
                    }
                });
            }

            if ('update' in object)
                object.update(deltaTime);
        });

        //scene.physicsStep(deltaTime);

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