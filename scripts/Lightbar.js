import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import * as MathUtility from "./MathUtility.js";

import { Entity } from "./entity/Entity.js";
import { GeometryComponent } from "./entity/components/GeometryComponent.js";

export class Lightbar extends Entity
{
    constructor()
    {
        super();

        this.mesh = this.addComponent(new GeometryComponent(
            new THREE.BoxGeometry(4, 0.2, 1),
            new THREE.MeshStandardMaterial({ color: 0xEEEEEE })
        )).mesh;

        this.mesh.position.y = 2.1;

        this.lights = [];

        for (let i = 0; i < 5; i++)
        {
            const light = new THREE.PointLight(i % 2 ? 0xff0000 : 0x0000ff, 0.05, 25);
            light.position.set(this.mesh.position.x - this.mesh.scale.x + i, this.mesh.position.y, this.mesh.position.z - (this.mesh.scale.z / 2));
            light.castShadow = true
            this.mesh.add(light);
            this.lights.push(light);
        }

        for (let i = 0; i < 5; i++)
        {
            const light = new THREE.PointLight(i % 2 ? 0xff0000 : 0x0000ff, 0.05, 25);
            light.position.set(this.mesh.position.x - this.mesh.scale.x + i, this.mesh.position.y, this.mesh.position.z + (this.mesh.scale.z / 2));
            light.castShadow = true
            this.mesh.add(light);
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