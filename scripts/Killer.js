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

        this.detectionRange = detectionRange;
        this.killRange   = 0.5;
        this.maxSpeed    = 0.2;
        this.sprintSpeed = 0.2;
        this.walkSpeed   = 0.1;
        // how close the distance to the target position has to be
        // to consider it reached
        this.targetPositionDistanceThreshold = 0.1;

        this.addComponent(new ContainerComponent);

        // TODO: replace this with a circle trigger
        this.addComponent(new TriggerComponent(detectionRange, 1, detectionRange));

        this.mesh = this.addComponent(new GeometryComponent(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshStandardMaterial({color: 0x42b6f5})
        )).mesh;
        this.mesh.position.y += 1;
        
        this.forwardDirectionHelper = new THREE.ArrowHelper(this.forward, this.position, 1, 0xffff00);
        this.forwardDirectionHelper.position.y += 1.5;
        this.add(this.forwardDirectionHelper);
        
        this.moveTarget = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 24, 8), 
            new THREE.MeshPhongMaterial({ 
                color: 0xff0000, 
                flatShading: true,
                transparent: true,
                opacity: 0.7,
            })
        );
        scene.add(this.moveTarget);

        this.actions = new Array();
        this.actionTime = -1;
        this.actionElapsedTime = 0;

        this.startPosition = new THREE.Vector3(0, 0, 0);
        this.targetPosition = new THREE.Vector3(0, 0, 0);
        
        this.arrowHelper = null;

        // TODO: track player's last direction and speed
        this.lastSeenPlayer = null;

        this.labelDiv = document.createElement("div");
        this.labelDiv.textContent = "i am in pain";

        const label = new CSS2DObject(this.labelDiv);
        label.color = "white";
        this.attach(label);

        this.upperHitbox = new THREE.Object3D();
        this.attach(this.upperHitbox);
        this.upperHitbox.position.y += 1.5;
    }

    destructor()
    {
        super.destructor();

        scene.remove(this.moveTarget);

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
            this.moveTarget.position.copy(action.position);
            this.actionTime = -1;
        }
        else if (action.type == "roam")
        {
            this.moveTarget.position.copy(action.position);
            this.actionTime = -1;
        }

        this.labelDiv.textContent = action.type;
        
        console.debug("focused action", action);
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
        
        this.actionElapsedTime = 0;
        this.startPosition.copy(this.position);
        this.targetPosition.copy(endPosition);
        this.actionTime = actionTime;
    }

    onTrigger(object)
    {
        if (object instanceof Player)
        {
            if (object.dead)
                return;

            if (this.arrowHelper)
                scene.remove(this.arrowHelper);

            let distance = 50;
            let foundPlayer = false;

            const direction = new THREE.Vector3().subVectors(object.position, this.position).normalize();
            const raycaster = new THREE.Raycaster(this.upperHitbox.position, direction);

            const collisions = raycaster.intersectObjects(scene.children, true);

            if (collisions.length > 0)
            {
                console.log("raycast hit " + collisions.length + " objects", collisions);

                let hit = true;

                for (const object of collisions)
                {
                    // TODO: if the object is something the killer can't see through
                    // if it does hit something opaque, then set hit = false and break
                }

                if (!hit)
                    return;

                distance = this.position.distanceTo(object.position);

                this.lastSeenPlayer = object;

                if (distance > this.killRange)
                {
                    if (this.actions.length > 0)
                    {
                        if (this.actions[0].type != "chasePlayer")
                        {
                            console.log("dropping tasks and chasing a player");

                            this.actions.length = 0;
                            this.actions.push({ type: "chasePlayer", position: object.position.clone() });
                            this.focusAction(this.actions[0]);    
                        }
                        else
                        {
                            this.actions[0].position = object.position.clone();
                            this.moveTarget.position.copy(this.actions[0].position);
                        }
                    }
                    else
                    {
                        console.log("chasing a player")

                        this.actions.length = 0;
                        this.actions.push({ type: "chasePlayer", position: object.position.clone() });
                        this.focusAction(this.actions[0]);
                    }
                }
                else
                {
                    console.log(object + " is dead!");
                    object.die();
                }

                this.arrowHelper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, distance, foundPlayer ? 0x00ff00 : 0xff0000);
                scene.add(this.arrowHelper);
            }
        }
    }

    update(deltaTime)
    {
        if (this.actions.length > 0)
        {
            const action = this.actions[0];

            // finish up the action
            if (this.actionTime > 0 && this.actionElapsedTime > this.actionTime)
            {
                console.debug("action timed exceeded");

                if (action.type == "chasePlayer" ||
                    action.type == "roam")
                    this.position.copy(action.position);

                this.nextAction();
            }
            else // the action time has not elapsed, meaning we should still be moving
            {
                if (action.type == "chasePlayer" ||
                    action.type == "roam")
                {
                    const rotation = - MathUtility.angleToPoint(new THREE.Vector2(this.position.x, this.position.z), new THREE.Vector2(action.position.x, action.position.z));
                    this.rotation.y = rotation;

                    const velocity = action.type == "chasePlayer" ? this.sprintSpeed : this.walkSpeed;

                    this.translateZ(velocity);

                    const distanceToTarget = this.position.distanceTo(action.position);

                    if (distanceToTarget < this.targetPositionDistanceThreshold)
                    {
                        console.log("Got within threshold of targetPosition, next action.");
                        this.position.copy(action.position);
                        this.nextAction();
                    }
                }
            }
        }
        else // no more actions, find a new one
        {
            console.log("finding new action");

            this.actions.push({ 
                type: "roam",
                position: new THREE.Vector3(
                    MathUtility.getRandomInt(-50, 50),
                    0,
                    MathUtility.getRandomInt(-50, 50)
                )
            });
        }

        this.actionElapsedTime += deltaTime;

        // TODO: figure out why this is necessary, upperHitbox should be fixed to this Entity
        this.upperHitbox.position.copy(this.position);
        this.upperHitbox.position.y += 1.5;

        super.update(deltaTime);
    }
};

