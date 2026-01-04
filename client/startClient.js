import * as alt from 'alt-client';

import * as native from 'natives';

import { fullConfig } from './config/config.js';
import { defaultClientConfig } from './config/secondConfig.js';

export function drawNotification(message, autoHide = false) {
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(message);
    const notificationId = native.endTextCommandThefeedPostTicker(false, false);
    // Таймер для скрытия уведомления через 3 секунды если кроме текста сообщения также передали true
    if (autoHide) {
        alt.setTimeout(() => {
            native.thefeedRemoveItem(notificationId);
        }, 3000);
    }
}

class PatrolClient {
    constructor() {
        this.currentPed = null;
        this.debug = null;
        this.patrolName = "miss_";

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

        alt.onServer('patrol:addNode', (coords, arg) => {
            this.addNodeToMap(coords, arg);
            alt.log(`addnode`);
        });

        alt.onServer('patrol:dellNode', (arg) => {
            this.dellNodeFromMap(arg);
            alt.log(`dellNode`);
        });
    }

    initializeMap(){
        
    //this.serverRoutes.routes.forEach((route, routeIndex) => {
        //this.currentRouteAttributes.set(route.id, route.name, route.looped);
    //});

    const route = this.serverRoutes.routes[0];

    this.currentRouteAttributes = {
        id: route.id,
        name: route.name,
        looped: route.looped
    };
    alt.log('currentRouteAttributes', JSON.stringify(this.currentRouteAttributes));

    route.nodes.forEach(node => {
        this.routePointsMap.set(node.index, node);
    });
/*
        this.serverRoutes.routes.forEach((route, index) => {
            this.routePointsMap.set(index,{
                id: index,
                ...route

            });
        });
        */
        //alt.log(`this.routePointsMap: ${JSON.stringify(this.routePointsMap)}`);
        this.routePointsMap.forEach((value, key) => {
            alt.log(`Ключ: ${key}`);
            alt.log(value);
        });
        //this.connectNodesLine();
        //alt.log(`this.defaultConfig: ${JSON.stringify(this.defaultConfig)}`);
    }

    dellNodeFromMap(arg){
        if ( this.routePointsMap.has(arg) === false){
            drawNotification(`Нода с номером ${arg} не существует`);
            drawNotification(`Нельзя удалить то чего нет`);
            return;
        }
        this.routePointsMap.delete(arg); // удалить из map все значения записанные под ключом arg
        alt.log('Весь Map после удаления ноды');
        this.routePointsMap.forEach((value, key) => {
            alt.log(`Ключ: ${key}`);
            alt.log(value);
        });
    }

    addNodeToMap(coords, arg){

        if ( this.routePointsMap.has(arg) === true){
            drawNotification(`Нода с номером ${arg} уже существует`);
            drawNotification(`Удалите ноду с номером ${arg} или используйте другой номер`);
            return;
        }

        const newnode = {
            index: arg,
            position: { x:coords.x, y:coords.y, z:coords.z },
            rotation: { x: -1277.7, y: -1447.6, z: 4.46 },
            waitTime: 1000
        }

    //создает массив из значений map
    const tempArray = Array.from(this.routePointsMap.entries());
    //добавляет в новую ноду с ее значениями
    tempArray.push([arg, newnode]);
    //сортирует массив по его key, что бы ноды шли в возрастающем порядке key (в случае с моим map key всегда равны index)
    tempArray.sort((a, b) => a[0] - b[0]);
    
    // пересоздает map заполняя его правильно отсортированными значениями
    this.routePointsMap = new Map(tempArray);

        //this.routePointsMap.set( arg, newnode);
       
        alt.log('Весь Map после добавления новой ноды');
        this.routePointsMap.forEach((value, key) => {
            alt.log(`Ключ: ${key}`);
            alt.log(value);
        });

    }

    //this.routePointsMap.set(node.index, node);

        //const points = this.fullRouteConfig.routePoints;
    drawNodeMarkers(){

        this.routePointsMap.forEach((point) => {                                                       //создание маркеров
            native.drawMarker(
                this.defaultConfig.markerType + point.index,
                point.position.x, point.position.y, point.position.z,
                0, 0, 0,
                0, 0, 0,
                this.defaultConfig.markerScale.x, this.defaultConfig.markerScale.y, this.defaultConfig.markerScale.z,
                this.defaultConfig.markerColour.r, this.defaultConfig.markerColour.g, this.defaultConfig.markerColour.b, this.defaultConfig.markerColour.a,
                false, true, 2, 0, 0, 0, false
            );
        });
    }

    //const points = this.routePointsMap[0].nodes;
    //const route = this.routePointsMap.values().next().value;
    //await new Promise(resolve => alt.setTimeout(resolve, 5000));
    
    //const points2 = this.serverRoutes.routes.nodes.position;
    
    //alt.log(JSON.stringify(points2));
    //const points = this.routePointsMap.routes.nodes[0].position;
    //    const currentPoint = this.routePointsMap.get(0);
    //alt.log(JSON.stringify(points));

connectNodesLine(){
    if (this.routePointsMap.size < 2) return;
 
    const first = this.routePointsMap.values().next().value;
    let prev = null;


    this.routePointsMap.forEach((current) => {
        if (current !== first) {
            native.drawLine(
                prev.position.x,
                prev.position.y,
                prev.position.z,
                current.position.x,
                current.position.y,
                current.position.z,
                this.defaultConfig.markerColour.r,
                this.defaultConfig.markerColour.g,
                this.defaultConfig.markerColour.b,
                this.defaultConfig.markerColour.a
            );
        }
        prev = current;
    });

    if (this.currentRouteAttributes.looped) {

        native.drawLine(
            prev.position.x,
            prev.position.y,
            prev.position.z,
            first.position.x,
            first.position.y,
            first.position.z,
            this.defaultConfig.markerColour.r,
            this.defaultConfig.markerColour.g,
            this.defaultConfig.markerColour.b,
            this.defaultConfig.markerColour.a
        );
    }
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

    let prevPoint = null;

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

        if (prevPoint) {
            native.drawLine(
                prevPoint.x, prevPoint.y, prevPoint.z + 0.1,
                x, y, z + 0.1,
                currentColor[0], currentColor[1], currentColor[2], currentColor[3]
            );
        }

        prevPoint = { x, y, z };
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
            const heading = native.getEntityHeading(this.currentPed.scriptID);
            const headingRad = heading * Math.PI / 180;
            alt.log(`heading: ${heading}`);
            
            alt.log(`headingRad: ${headingRad}`);
        }

async asignCurrentRouteToPed(ped) {
    
    native.deletePatrolRoute(`miss_${this.currentRouteAttributes.name}`);

        //cоздаем маршрут
    native.openPatrolRoute(`miss_${this.currentRouteAttributes.name}`);

        this.routePointsMap.forEach((current) => {
            native.addPatrolRouteNode(
                    current.index,
                    this.defaultConfig.animation,
                    current.position.x,
                    current.position.y,
                    current.position.z,
                    current.rotation.x,
                    current.rotation.y,
                    current.rotation.z,
                    current.waitTime
                );
        });

    /*
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
*/
    const points = this.fullRouteConfig.routePoints;
    
   // if (points.length < 2) return;
    
    //native.addPatrolRouteLink(0, 1);
    //native.addPatrolRouteLink(1, 2);
    //native.addPatrolRouteLink(2, 0);

    const first = this.routePointsMap.values().next().value;
    let prev = null;

    this.routePointsMap.forEach((current) => {
        if (current !== first) {
            native.addPatrolRouteLink(prev.index, current.index);
        }
        prev = current;
    });

    if (this.currentRouteAttributes.looped) {
        native.addPatrolRouteLink(prev.index, first.index);
    }
    //-1272.3033447265625, -1447.87255859375, 4.6622314453125
/*
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
*/
        native.closePatrolRoute();
        native.createPatrolRoute();

        native.taskPatrol(ped, `miss_${this.currentRouteAttributes.name}`, 0, false, true);

}



}
new PatrolClient();
