import * as THREE from "https://kerrishaus.com/assets/threejs/build/three.module.js";

import * as MathUtility from "./MathUtility.js";

import { Lightbar } from "./Lightbar.js";

import { Entity } from "./entity/Entity.js";

export class PoliceCar extends Entity
{
    constructor()
    {
        super();

        this.add(new Lightbar);
    }

    update(deltaTime)
    {
    }
}