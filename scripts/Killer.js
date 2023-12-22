import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import { CSS2DObject } from "https://kerrishaus.com/assets/threejs/examples/jsm/renderers/CSS2DRenderer.js";

import * as MathUtility from "./MathUtility.js";

import { Player } from "./Player.js";

import { Entity } from "./entity/Entity.js";
import { ContainerComponent } from "./entity/components/ContainerComponent.js";
import { GeometryComponent } from "./entity/components/GeometryComponent.js";
import { TriggerComponent } from "./entity/components/TriggerComponent.js";

export class Killer extends Entity
{
    constructor(detectionRange)
    {
        super();

        this.addComponent(new ContainerComponent);

        // TODO: replace this with a circle trigger
        this.addComponent(new TriggerComponent(detectionRange, 1, detectionRange));

        this.mesh = this.addComponent(new GeometryComponent(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshStandardMaterial({color: 0x42b6f5})
        )).mesh;

        this.mesh.position.y += 1;

        this.speedModifier = 8;

        this.actions = new Array();

        // time since last action was started
        this.elapsedTime = 0;
        // actionTime is the amount of time it will take to get
        // from the current position to the position of the action
        this.actionTime = 0;
        this.startPosition = new THREE.Vector3(0, 0, 0);
        this.targetPosition = new THREE.Vector3(0, 0, 0);

        this.labelDiv = document.createElement("div");
        this.labelDiv.textContent = "i am in pain";

        const label = new CSS2DObject(this.labelDiv);
        label.color = "white";
        this.add(label);

        this.upperHitbox = new THREE.Object3D();
        this.add(this.upperHitbox);
        this.upperHitbox.position.y += 1.5;

        this.arrowHelper = null;
    }

    destructor()
    {
        super.destructor();

        this.labelDiv.remove();
    }

    pushAction(action)
    {
        // if there are no actions,
        // focus this action immediately
        if (this.actions.length < 1)
        {
            console.debug("focused action because there are no other actions", action);
            this.focusAction(action);
        }
        
        this.actions.push(action);

        console.debug("added action: " + action.type, action);
    }
    
    focusAction(action)
    {
        if (action.type == "chasePlayer")
        {
            console.debug("moving to", action.position);
            this.actionTime = this.position.distanceTo(action.position) / this.speedModifier;
            this.setTarget(action.position, this.actionTime);
        }

        this.labelDiv.textContent = action.type;
        
        console.debug("focused action");
    }

    nextAction()
    {
        console.debug("action complete");

        this.actions.shift();
                
        if (this.actions.length > 0)
            this.focusAction(this.actions[0]);
        else
            this.labelDiv.textContent = "idle";
    }
    
    setTarget(endPosition, actionTime)
    {
        if (!(endPosition instanceof THREE.Vector3))
        {
            console.error("endPosition must be a Vector3");
            return;
        }
        
        this.elapsedTime = 0;
        this.startPosition.copy(this.position);
        this.targetPosition.copy(endPosition);
        this.actionTime = actionTime;
    }

    onTrigger(object)
    {
        if (object instanceof Player)
        {
            if (this.arrowHelper)
                scene.remove(this.arrowHelper);

            const direction = new THREE.Vector3().subVectors(object.position, this.position).normalize();
            const raycaster = new THREE.Raycaster(this.upperHitbox.position, direction);

            const collisions = raycaster.intersectObjects(scene.children, true);

            if (collisions.length > 0)
            {
                if (collisions[0].object?.parent instanceof Player)
                {
                    const player = collisions[0].object?.parent;

                    if (this.actions.length < 1)
                    {
                        this.actions.push({ type: "chasePlayer", position: player.position });
                    }
                    else
                    {
                        if (this.actions[0]?.type == "chasePlayer")
                        {
                            this.actions[0].position.copy(player.position);
                            this.focusAction(this.actions[0]);
                        }
                    }
                }
            }

            this.arrowHelper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 50, 0xffff00)
            scene.add(this.arrowHelper);
        }
    }

    update(deltaTime)
    {
        if (this.actions.length > 0)
        {
            if (this.elapsedTime > this.actionTime)
            {
                // finish the current action, and move on to the next
                if (this.actions.length > 0)
                {
                    const action = this.actions[0];

                    if (action.type == "move")
                        this.nextAction();   
                }
                // there are no remaining actions, teleport to target position to ensure we're at the right place
                else
                    this.position.copy(this.targetPosition);
            }
            else // the action time has not elapsed, meaning we should still be moving
            {
                this.position.lerpVectors(this.startPosition, this.targetPosition, this.elapsedTime / this.actionTime);

                this.rotation.y = MathUtility.angleToPoint(this.position, this.targetPosition);
            }
        }
        else // no more actions, find a new one
        {
        }

        this.elapsedTime += deltaTime;

        // TODO: figure out why this is necessary
        this.upperHitbox.position.copy(this.position);
        this.upperHitbox.position.y += 1.5;

        super.update(deltaTime);
    }
};

