import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import { Lightbar } from "./Lightbar.js";

import { Entity } from "./entity/Entity.js";
import { GeometryComponent } from "./entity/components/GeometryComponent.js";

export class PoliceCar extends Entity
{
    constructor()
    {
        super();

        this.mesh = this.addComponent(new GeometryComponent(
            new THREE.BoxGeometry(4, 2, 4),
            new THREE.MeshStandardMaterial({ color: 0xEEEEEE })
        )).mesh;

        this.mesh.position.y += 1;

        const front = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1, 3),
            new THREE.MeshStandardMaterial({ color: 0xEEEEEE })
        );

        this.mesh.add(front);
        front.position.z += this.mesh.scale.z * 2;
        front.position.y -= this.mesh.scale.y / 2;

        const back = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1, 3),
            new THREE.MeshStandardMaterial({ color: 0xEEEEEE })
        );

        this.mesh.add(back);
        back.position.z -= this.mesh.scale.z * 2;
        back.position.y -= this.mesh.scale.y / 2;

        this.add(new Lightbar);
    }

    update(deltaTime)
    {
    }
}