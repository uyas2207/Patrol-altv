import * as alt from 'alt-client';

import * as native from 'natives';

import { fullConfig } from './config/config.js';

class PatrolClient {
    constructor() {
        this.currentPed = null;

        this.viewDistance = 4;     // длина конуса
        this.viewAngle = 80;         // угол обзора (градусы)
        this.viewSectors = 6;

        this.isPlayerInSight = false;
 
        this.fullRouteConfig = fullConfig;
        this.routePointsMap = new Map();


        this.markerColour =  this.fullRouteConfig.routePoints[0].markerColour;

        this.init();
    }

    init(){
        
    alt.on('gameEntityCreate', async (entity) => {
        alt.log('gameEntityCreate');
        if(!(entity instanceof alt.Ped)) return;

        this.currentPed = entity;
        alt.log(`this.currentPed.scriptID: ${this.currentPed.scriptID}`);

        alt.log(`this.markerColour: ${JSON.stringify(this.markerColour)}`);

        this.setPedClient(this.currentPed.scriptID);
        /*
        alt.log("=== ВСЁ О PED ===");
        for (let key in entity) {
            try {
                alt.log(`${key} = ${entity[key]}`);
            } catch (error) {
                // нужно что бы код продолжил выполняться после ошибки если она будет
            }
        }
        */
    });
    
        /*
        alt.everyTick(() => {
            if (!this.currentPed || !this.currentPed.valid) return;
            this.drawPedVisionCone();
            this.connectNodesLine();
        });
        */

        alt.onServer('patrol:startPedPatrol', () => {
            this.initializeMap();
                //alt.log(`Пришло с сервера patrol:startPedPatrol`);
                //this.createPatrolRouteFixed(this.currentPed);
            this.fullRouteConfig.routePoints.forEach((point) => {                                                       //создание маркеров
            const marker = new alt.Marker(
                point.markerType, 
                new alt.Vector3(point.coordinates.x, point.coordinates.y, point.coordinates.z,), 
                //point.markerColour
                new alt.RGBA(point.markerColour.r, point.markerColour.g, point.markerColour.b)
            );
            marker.scale = point.markerScale;
        });
        });
    }

    initializeMap(){
        this.fullRouteConfig.routePoints.forEach((point, index) => {
            this.routePointsMap.set(index,{
                id: index,
                ...point

            });
        });
        //alt.log(`this.routePointsMap: ${JSON.stringify(this.routePointsMap)}`);
            this.routePointsMap.forEach((value, key) => {
        alt.log(`Ключ: ${key}, Значение: ${JSON.stringify(value)}`);
    });
    }

connectNodesLine(){
    const points = this.fullRouteConfig.routePoints;
    
    if (points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        native.drawLine(
            current.coordinates.x,
            current.coordinates.y,
            current.coordinates.z,
            next.coordinates.x,
            next.coordinates.y,
            next.coordinates.z,
            this.markerColour.r,
            this.markerColour.g,
            this.markerColour.b,
            this.markerColour.a
        );
    }
    const last = points[points.length - 1];
    native.drawLine(
        last.coordinates.x,
        last.coordinates.y,
        last.coordinates.z,
        points[0].coordinates.x,
        points[0].coordinates.y,
        points[0].coordinates.z,
        this.markerColour.r,
        this.markerColour.g,
        this.markerColour.b,
        this.markerColour.a
    );
}


drawPedVisionCone() {
    const pos = this.currentPed.pos;
    const heading = native.getEntityHeading(this.currentPed.scriptID);
    const player = alt.Player.local; 
    let currentColor;
    
    if (this.isPlayerInSight) {
        currentColor = [255, 0, 0, 200];
    } 
    else {
        currentColor = [0, 255, 0, 200];
    }

    const headingRad = heading * Math.PI / 180;
    const halfAngleRad = (this.viewAngle / 2) * Math.PI / 180;
    const stepAngleRad = (this.viewAngle * Math.PI / 180) / this.viewSectors;

    let lastPoint = null;

    // Отрисовка конуса видимости
    for (let i = -halfAngleRad; i <= halfAngleRad; i += stepAngleRad) {
        const currentAngle = headingRad + i;

        const forwardX = Math.sin(-currentAngle);
        const forwardY = Math.cos(-currentAngle);

        const x = pos.x + forwardX * this.viewDistance;
        const y = pos.y + forwardY * this.viewDistance;
        const z = pos.z;

        native.drawLine(
            pos.x, pos.y, pos.z + 0.1,
            x, y, z + 0.1,
            currentColor[0], currentColor[1], currentColor[2], currentColor[3]
        );

        if (lastPoint) {
            native.drawLine(
                lastPoint.x, lastPoint.y, lastPoint.z + 0.1,
                x, y, z + 0.1,
                currentColor[0], currentColor[1], currentColor[2], currentColor[3]
            );
        }

        lastPoint = { x, y, z };
    }

    // проверяет только игрока
    if (player && player.valid) {
        if (this.isPlayerInVisionCone(this.currentPed, player, headingRad, halfAngleRad)) {
            // Отображаем маркер над игроком
            native.drawMarker(
                0,
                player.pos.x, player.pos.y, player.pos.z + 1.0,
                0, 0, 0,
                0, 0, 0,
                0.15, 0.15, 0.15,
                255, 0, 0, 200,
                false, true, 2, 0, 0, 0, false
            );

            if (!this.isPlayerInSight) {
                this.isPlayerInSight = true;
                alt.log('this.isPlayerInSight = true;');
            }
        }
        else {
            if (this.isPlayerInSight) {
                this.isPlayerInSight = false;
                alt.log('this.isPlayerInSight = false;');
            }
        }
    }

    // центральная линия направления взгляда (точка столкновения)
    if (this.isPlayerInSight) {
    native.drawLine(
        pos.x, pos.y, pos.z + 0.2,
        player.pos.x, player.pos.y, player.pos.z + 0.5,
        //pos.x + Math.sin(-headingRad) * this.viewDistance,
        //pos.y + Math.cos(-headingRad) * this.viewDistance,
        //pos.z + 0.2,
        currentColor[0], currentColor[1], currentColor[2], currentColor[3]
    );
    }
}

isPlayerInVisionCone(ped, player, headingRad, halfAngleRad) {
    const pedPos = ped.pos;
    const playerPos = player.pos;

    // Вектор от ped к игроку
    const toPlayerX = playerPos.x - pedPos.x;
    const toPlayerY = playerPos.y - pedPos.y;

    // Дистанция
    const distance = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    if (distance > this.viewDistance) return false;

    // Нормализованный вектор "вперёд" (ТОЧНО как в drawPedVisionCone)
    const forwardX = Math.sin(-headingRad);
    const forwardY = Math.cos(-headingRad);

    // Нормализованный вектор на игрока
    const len = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    const dirToPlayerX = toPlayerX / len;
    const dirToPlayerY = toPlayerY / len;

    // Скалярное произведение
    const dot = forwardX * dirToPlayerX + forwardY * dirToPlayerY;

    // Угол между forward и игроком
    const angleToPlayer = Math.acos(dot);

    return angleToPlayer <= halfAngleRad;
}


        async setPedClient(ped){
            alt.log(`setPedClient ${ped}`);
            await new Promise(resolve => alt.setTimeout(resolve, 500));
            //const ped = alt.Ped.getByID(npcID);
            //alt.log(`PatrolClient: ${ped}`);
            alt.log(`После таймера ${ped}`);
            //native.setEntityInvincible(ped, true);
            //native.setBlockingOfNonTemporaryEvents(ped, true);
            //this.testDrawPedVisionCone(this.currentPed);
            //this.createAndVerifyPatrol(this.currentPed);
            //this.connectNodesLine();
            this.verifyRouteCreation(this.currentPed);
        }

async verifyRouteCreation(ped) {
    try {
        const routeName = "MISS_PATROL_8";
        
        // 1. Создаем маршрут
        native.openPatrolRoute(routeName);

this.fullRouteConfig.routePoints.forEach((point, index) => {        
    native.addPatrolRouteNode(
        index,
        point.animation,
        point.coordinates.x,
        point.coordinates.y,
        point.coordinates.z,
        point.rotation.x,
        point.rotation.y,
        point.rotation.z,
        point.waitTime
    );
});
    const points = this.fullRouteConfig.routePoints;
    
   // if (points.length < 2) return;
    
    //native.addPatrolRouteLink(0, 1);
    //native.addPatrolRouteLink(1, 2);
    //native.addPatrolRouteLink(2, 0);

this.fullRouteConfig.routePoints.forEach((point, index) => {
        //const current = points[index];
        //alt.log(`current: ${JSON.stringify(current)}`);
        const next = points[index + 1];
       //alt.log(`next: ${JSON.stringify(next)}`);
        if (points[index + 1]) {
            native.addPatrolRouteLink(index, index+1);
        }else{
            native.addPatrolRouteLink(index, 0);
        }
//        native.addPatrolRouteLink(1, 0);
});

        native.closePatrolRoute();
        native.createPatrolRoute();

        native.taskPatrol(ped, routeName, 0, false, false);


    } catch (error) {
        alt.log(`Verify error: ${error}`);
    }
}



}
new PatrolClient();
