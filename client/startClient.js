import * as alt from 'alt-client';

import * as native from 'natives';

import { defaultClientConfig } from './config/secondConfig.js';

function drawNotification(message, autoHide = false) {
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(`~r~${message}`);
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

        this.defaultConfig = defaultClientConfig;

        this.routePointsMap = new Map();

        this.visionConeColour = [0, 255, 0, 200];

        this.init();
    }

    init(){
        
        alt.on('gameEntityCreate', async (entity) => {
            alt.log('gameEntityCreate');
            if(!(entity instanceof alt.Ped)) return;

            this.currentPed = entity;
            alt.log(`this.currentPed.scriptID: ${this.currentPed.scriptID}`);


            this.setPedClient(this.currentPed.scriptID);
        });

        alt.onServer('patrol:initRoutes', (route) => {
            this.initializeMap(route);
        });


        //отображать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOn', () => {
            if (!this.currentPed || !this.currentPed.valid) return;
            this.debug = alt.everyTick(() => {
                
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

        alt.onServer('patrol:askForRouteMap', () => {
            if ( this.routePointsMap.size === 0 ) {
                alt.log('Попытка созранить пустой route');
                drawNotification(`Нельзя сохранять ПУСТОЙ route`);
                return;
            }
            alt.log('askForRouteMap + sendRouteMap');
            const savingArray = {
                id: this.currentRouteAttributes.id,
                name: this.currentRouteAttributes.name,
                looped: this.currentRouteAttributes.looped,
                nodes: Array.from(this.routePointsMap.values())
            }
            alt.log('savingArray:', JSON.stringify(savingArray));
            alt.emitServer('patrol:sendRouteMap', savingArray);
        });

        alt.onServer('patrol:clearCurrentRoute', () => {
            this.currentRouteAttributes = null;
            //this.routePointsMap = new Map();
            this.routePointsMap.clear();
        });
    }

    initializeMap(route){

        this.currentRouteAttributes = { //запоминает доп параметры маршрута
            id: route.id,
            name: route.name,
            looped: route.looped
        };
    
        alt.log('currentRouteAttributes', JSON.stringify(this.currentRouteAttributes));

        
        this.routePointsMap.clear();    //делает map пустым (на случай если уже существует актинвый map с которым воыполняется работа до этого initializeMap)

        route.nodes.forEach(node => {
            this.routePointsMap.set(node.index, node);
        });

    this.routePointsMap.forEach((value, key) => {
        alt.log(`Ключ: ${key}`);
        alt.log(value);
    });
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
        this.routePointsMap.clear();
        this.routePointsMap = new Map(tempArray);
       
        alt.log('Весь Map после добавления новой ноды');
        this.routePointsMap.forEach((value, key) => {
            alt.log(`Ключ: ${key}`);
            alt.log(value);
        });
    }

    //создание маркеров
    drawNodeMarkers(){
        this.routePointsMap.forEach((point) => {
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
//отображение линий между маркерами (показывает от какого маркера к какому будет ходить ped)
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

//отображение области видимости ped
drawPedVisionCone() {
    const pos = this.currentPed.pos;
    const heading = native.getEntityHeading(this.currentPed.scriptID);
    const player = alt.Player.local;

    const headingRad = heading * Math.PI / 180;
    const halfAngleRad = (this.viewAngle / 2) * Math.PI / 180;
    const stepAngleRad = (this.viewAngle * Math.PI / 180) / this.viewSectors;

    let prevPoint = null;

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
            this.visionConeColour[0], this.visionConeColour[1], this.visionConeColour[2], this.visionConeColour[3]
        );

        if (prevPoint) {
            native.drawLine(
                prevPoint.x, prevPoint.y, prevPoint.z + 0.1,
                x, y, z + 0.1,
                this.visionConeColour[0], this.visionConeColour[1], this.visionConeColour[2], this.visionConeColour[3]
            );
        }

        prevPoint = { x, y, z };
    }

        if (this.isPlayerInVisionCone(player, headingRad, halfAngleRad)) {
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
                this.visionConeColour = [255, 0, 0, 200];
                alt.log('this.isPlayerInSight = true;');
            }
        }
        else {
            if (this.isPlayerInSight) {
                this.isPlayerInSight = false;
                this.visionConeColour = [0, 255, 0, 200];
                alt.log('this.isPlayerInSight = false;');
            }
        }

    if (this.isPlayerInSight) {
    native.drawLine(
        pos.x, pos.y, pos.z + 0.1,
        player.pos.x, player.pos.y, player.pos.z + 0.5,
        this.visionConeColour[0], this.visionConeColour[1], this.visionConeColour[2], this.visionConeColour[3]
    );
    }
}

isPlayerInVisionCone(player, headingRad, halfAngleRad) {
    const pedPos = this.currentPed.pos;
    const playerPos = player.pos;

    const toPlayerX = playerPos.x - pedPos.x;
    const toPlayerY = playerPos.y - pedPos.y;

    const distance = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    if (distance > this.viewDistance) return false;

    const forwardX = Math.sin(-headingRad);
    const forwardY = Math.cos(-headingRad);

    const len = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    const dirToPlayerX = toPlayerX / len;
    const dirToPlayerY = toPlayerY / len;

    const dot = forwardX * dirToPlayerX + forwardY * dirToPlayerY;

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

//назначение маршрута ped
async asignCurrentRouteToPed(ped) {
    if ( this.routePointsMap.size === 0 ){
        drawNotification(`Нельзя назначить пустой маршрут для патрулирования`);
        return;
    }
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

        native.closePatrolRoute();
        native.createPatrolRoute();

        native.taskPatrol(ped, `miss_${this.currentRouteAttributes.name}`, 0, false, true);

}

}

new PatrolClient();
