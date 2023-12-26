import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import * as GeometryUtil from "./GeometryUtility.js";

import { Entity } from "./entity/Entity.js";
import { GeometryComponent } from "./entity/components/GeometryComponent.js";
import { ContainerComponent } from "./entity/components/ContainerComponent.js";

export class Player extends Entity
{
    constructor()
    {
        super();

        this.addComponent(new ContainerComponent);

        const geometry = this.addComponent(new GeometryComponent(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshStandardMaterial({ color: 0x0000ff })
        ));

        const nose = GeometryUtil.createScaledCube(0.4, 0.2, 0.6, 0x0000aa);
        nose.position.z = 0.5;
        nose.position.y = 0.6;
        geometry.mesh.add(nose);

        geometry.mesh.position.y += 1;

        this.maxSpeed = 0.3;

        this.controlsEnabled = true;

        this.MoveType = {
            Mouse: 'Mouse',
            Touch: 'Touch',
            Keyboard: 'Keyboard'
        };

        this.move = null;
        this.keys = new Array();
        this.pointerMoveOrigin = new THREE.Vector2();
        this.moving = false;
        this.pointerMove = false;
        
        this.moveTarget = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 24, 8), 
            new THREE.MeshPhongMaterial({ 
                color: 0x00ffff, 
                flatShading: true,
                transparent: true,
                opacity: 0.7,
            })
        );
        
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0.5, 0), 0);

        this.mouse      = new THREE.Vector2();
        this.raycaster  = new THREE.Raycaster();
        this.intersects = new THREE.Vector3();

        const intensity = 1, distance = 5, angle = 0.5, sharpness = 0.5, decay = 0;

        this.spotLight = new THREE.SpotLight(0xffffff, intensity, distance, angle, sharpness, decay);
        this.spotLight.position.set(0, 1, 0.5);
        //this.spotLight.map = new THREE.TextureLoader().load( url );

        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;
        this.spotLight.shadow.camera.near = 0.1;
        this.spotLight.shadow.camera.far = 1000;

        const helper = new THREE.CameraHelper(this.spotLight.shadow.camera);
        scene.add(helper);

        const directionalHelper = new THREE.DirectionalLightHelper(this.spotLight, 5);
        scene.add(directionalHelper);

        this.attach(this.spotLight);
        this.attach(this.spotLight.target);

        this.spotLight.target.position.y = 0;
        this.spotLight.target.position.z = 10;

        this.upperHitbox = new THREE.Object3D();
        this.add(this.upperHitbox);
        this.upperHitbox.position.y += 1.5;
    }
    
    update(deltaTime)
    {
        super.update(deltaTime);
    }

    disableMovement()
    {
        this.controlsEnabled = false;

        this.move = null;
    }

    enableMovement()
    {
        this.controlsEnabled = true;
    }

    registerEventListeners()
    {
        console.log("registered player controls event listener");

        window.addEventListener("mousemove" , this.mousemove);
        window.addEventListener("touchmove" , this.touchmove);
        window.addEventListener("touchstart", this.touchstart);
        window.addEventListener("mousedown" , this.mousedown);
        window.addEventListener("keyup"     , this.keyup);
        window.addEventListener("keydown"   , this.keydown);
        $(window).on('mouseup touchend'     , this.moveEnd);

        this.controlsEnabled = true;
    }

    removeEventListeners()
    {
        console.log("unregistered player controls event listener");
        
        window.removeEventListener("mousemove" , this.mousemove);
        window.removeEventListener("touchmove" , this.touchmove);
        window.removeEventListener("touchstart", this.touchstart);
        window.removeEventListener("mousedown" , this.mousedown);
        window.removeEventListener("keyup"     , this.keyup);
        window.removeEventListener("keydown"   , this.keydown);
        $(window).off('mouseup touchend'       , this.moveEnd);

        this.controlsEnabled = false;
    }

    mousemove(event)
    {
        if (!player.controlsEnabled)
            return;

        player.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        player.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    };
    
    touchmove(event)
    {
        if (!player.controlsEnabled)
            return;

        player.mouse.x = ( event.touches[0].clientX / window.innerWidth ) * 2 - 1;
        player.mouse.y = - ( event.touches[0].clientY / window.innerHeight ) * 2 + 1;
    }

    touchstart(event)
    {
        if (!player.controlsEnabled)
            return;
        
        player.pointerMoveOrigin.x = ( event.touches[0].clientX / window.innerWidth ) * 2 - 1;
        player.pointerMoveOrigin.y = - ( event.touches[0].clientY / window.innerHeight ) * 2 + 1;

        player.move = player.MoveType.Touch;

        scene.add(player.moveTarget);
    }
    
    mousedown(event)
    {
        if (!player.controlsEnabled)
            return;

        player.pointerMoveOrigin.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        player.pointerMoveOrigin.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        player.move = player.MoveType.Mouse;

        scene.add(player.moveTarget);
    }

    keydown(event)
    {
        if (!player.controlsEnabled)
            return;

        player.keys[event.code] = true;

        switch (event.code)
        {
            case "KeyW":
            case "ArrowUp":
            case "KeyA":
            case "ArrowLeft":
            case "KeyS":
            case "ArrowDown":
            case "KeyD":
            case "ArrowRight":
                break; // remove this when keyboard movement is allowed
                player.move = MoveType.Keyboard;
                player.moveTarget.quaternion.copy(player.quaternion);
                scene.add(player.moveTarget);
                break;
        };
    }
    
    keyup(event)
    {
        if (!player.controlsEnabled)
            return;
        
        player.keys[event.code] = false;

        return; // remove this when keyboard movement is allowed

        if (!(player.keys["KeyW"] || player.keys["ArrowUp"] ||
              player.keys["KeyA"] || player.keys["ArrowLeft"] ||
              player.keys["KeyS"] || player.keys["ArrowDown"] ||
              player.keys["KeyD"] || player.keys["ArrowRight"]))
              this.moveEnd();
    }

    moveEnd(event)
    {
        if (!player.controlsEnabled)
            return;

        player.move = null;

        scene.remove(player.moveTarget);
    }
};