import * as alt from 'alt-client';

import * as native from 'natives';

import { fullConfig } from './config/config.js';
import { defaultClientConfig } from './config/secondConfig.js';

class PatrolClient {
    constructor() {
        this.currentPed = null;
        this.debug = null;
        this.patrolName = "miss_route_1";

        this.viewDistance = 4;     // длина конуса
        this.viewAngle = 80;         // угол обзора (градусы)
        this.viewSectors = 7;

        this.isPlayerInSight = false;
 
        this.fullRouteConfig = fullConfig;

        this.defaultConfig = defaultClientConfig;

        this.serverRoutes = null;
        this.routePointsMap = new Map();

        //alt.clearEveryTick(this.keyCheckHandler);
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

        alt.onServer('patrol:initRoutes', (routeData) => {
            this.serverRoutes = routeData;
        });

        alt.onServer('patrol:startPedPatrol', () => {
            this.initializeMap();
        });

        //отображать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOn', () => {
            this.debug = alt.everyTick(() => {
                if (!this.currentPed || !this.currentPed.valid) return;
                this.drawPedVisionCone();
                this.drawNodeMarkers();
                this.connectNodesLine();
            });
            alt.log(`debugTurnOn`);
        });
        
        //выключать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOff', () => {
            alt.clearEveryTick(this.debug);
            this.debug = null;
            //native.deletePatrolRoute(this.patrolName);
            alt.log(`debugTurnOff`);
        });

        alt.onServer('patrol:asignCurrentRouteToPed', () => {
            this.asignCurrentRouteToPed(this.currentPed);
            alt.log(`asignCurrentRouteToPed`);
        });
    }

    initializeMap(){
        this.serverRoutes.routes.forEach((route, index) => {
            this.routePointsMap.set(index,{
                id: index,
                ...route

            });
        });
        //alt.log(`this.routePointsMap: ${JSON.stringify(this.routePointsMap)}`);
        this.routePointsMap.forEach((value, key) => {
           // alt.log(`Значение: ${JSON.stringify(value, null, 2)}`);
            alt.log(`Ключ: ${key}`);
            alt.log(value);
        });
        //alt.log(`this.defaultConfig: ${JSON.stringify(this.defaultConfig)}`);
    }
    

        //const points = this.fullRouteConfig.routePoints;
    drawNodeMarkers(){

        this.fullRouteConfig.routePoints.forEach((point) => {                                                       //создание маркеров
            native.drawMarker(
                this.defaultConfig.markerType,
                point.coordinates.x, point.coordinates.y, point.coordinates.z,
                0, 0, 0,
                0, 0, 0,
                this.defaultConfig.markerScale.x, this.defaultConfig.markerScale.y, this.defaultConfig.markerScale.z,
                this.defaultConfig.markerColour.r, this.defaultConfig.markerColour.g, this.defaultConfig.markerColour.b, this.defaultConfig.markerColour.a,
                false, true, 2, 0, 0, 0, false
            );
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
            this.defaultConfig.markerColour.r,
            this.defaultConfig.markerColour.g,
            this.defaultConfig.markerColour.b,
            this.defaultConfig.markerColour.a
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
        this.defaultConfig.markerColour.r,
        this.defaultConfig.markerColour.g,
        this.defaultConfig.markerColour.b,
        this.defaultConfig.markerColour.a
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
                true, true, 2, 0, 0, 0, false
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
            const heading = native.getEntityHeading(this.currentPed.scriptID);
            const headingRad = heading * Math.PI / 180;
            alt.log(`heading: ${heading}`);
            
            alt.log(`headingRad: ${headingRad}`);
        }

async asignCurrentRouteToPed(ped) {
        
        // 1. Создаем маршрут
        native.openPatrolRoute(this.patrolName);

this.fullRouteConfig.routePoints.forEach((point, index) => {        
    native.addPatrolRouteNode(
        index,
        this.defaultConfig.animation,
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

        native.taskPatrol(ped, this.patrolName, 0, false, true);

}



}
new PatrolClient();
