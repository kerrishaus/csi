import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import * as MathUtility from "./MathUtility.js";

import { Entity } from "./entity/Entity.js";
import { GeometryComponent } from "./entity/components/GeometryComponent.js";

export class Lightbar extends Entity
{
    constructor()
    {
        super();

        this.geometry = this.addComponent(new GeometryComponent(
            new THREE.BoxGeometry(10, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0xEEEEEE })
        ));

        this.lights = [];

        for (let i = 0; i < 10; i++)
        {
            const light = new THREE.PointLight(i % 2 ? 0xff0000 : 0x0000ff, 0.5, 15);
            light.position.set(0, i + 1, 2);
            light.castShadow = true
            scene.add(light);
            this.lights.push(light);
        }
    }

    update(deltaTime)
    {
        const light = MathUtility.getRandomInt(0, this.lights.length - 1);

        if (this.lights[light].intensity)
            this.lights[light].intensity = 0;
        else
            this.lights[light].intensity = 1;
    }
}