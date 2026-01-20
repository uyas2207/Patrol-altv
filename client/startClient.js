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
        this.currentPed = new Map();
        this.debug = null;
        this.singleDebug = new Map();

        this.patrolName = "miss_";

        this.viewDistance = 4;     // длина конуса
        this.viewAngle = 80;         // угол обзора (градусы)
        this.viewSectors = 7;

    //    this.isPlayerInSight = false;
        this.whichPedhasPlayerinVisionCone = null;

        this.defaultConfig = defaultClientConfig;

        this.routePointsMap = new Map();
        this.mainMap = new Map();
        
    //    this.visionConeColour = [0, 255, 0, 200];
        
    //    this.greenColour = [0, 255, 0, 200];

        this.init();
    }
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
    init(){
        

        alt.onServer('patrol:pedinfo', (arg) => {
            const data = this.currentPed.get(arg);
            alt.log(`data ${data.entity}`);
                    alt.log("=== ВСЁ О PED ===");
        for (let key in data.entity) {
            try {
                alt.log(`${key} = ${data.entity[key]}`);
            } catch (error) {
                // нужно что бы код продолжил выполняться после ошибки если она будет
            }
        }
        });

        alt.onServer('patrol:route', () => {
            alt.log('Весь mainMap');
            this.mainMap.forEach((value, key) => {
                alt.log(`Ключ: ${(key)}`);
                alt.log('value:', (value));
            });
        });

        alt.onServer('patrol:pedMap', () => {
            alt.log('Весь currentPed');
            this.currentPed.forEach((value, key) => {
                alt.log(`Ключ: ${(key)}`);
                alt.log('value:', (value));
            });
        });



        alt.on('gameEntityCreate', async (entity) => {
            alt.log('gameEntityCreate, entity:', entity);
            if(!(entity instanceof alt.Ped)) return;
            alt.log('entity.scriptID', entity.scriptID);

            // при повторном появлении ped на клиенте, меняется scriptID и другие значения 
            if (this.currentPed.has(entity.id)) {
                const data = this.currentPed.get(entity.id);
                data.entity = entity; //изменение значений для ped с id
                if(data.asignedRoute){
                    const route = this.mainMap.get(data.asignedRoute);
                    await new Promise(resolve => alt.setTimeout(resolve, 1000));
                    this.asignCurrentRouteToPed(data.entity, route.attributes, route.nodes);
                    alt.log(`Ped ${data.entity.id}, заново asigned прошлый route ${data.asignedRoute}`);
                }
                return;
            }
            //при первом появлении ped на клиенте 
            this.currentPed.set(entity.id, {
                entity,
                asignedRoute: null,
                isdebuged: false
            });
            const data = this.currentPed.get(entity.id);
            alt.log(`entity id: ${data.entity.id}, entity scriptID: ${data.entity.scriptID}, asignedRoute: ${data.asignedRoute}`);
        });

        alt.onServer('patrol:initRoutes', async (route) => {
            if (this.mainMap.has(route.id)) {
                drawNotification(`route ${route.name} уже существует`);
                return;
            }
            this.initializeMap(route);
        });

        //'patrol:pedStop'
        alt.onServer('patrol:pedStop', (arg) => {
            alt.log(`ped ${arg} Stop`);
            const ped = this.currentPed.get(arg);

            if (ped.asignedRoute !== null ){    
                const data = this.mainMap.get(ped.asignedRoute);
                native.deletePatrolRoute(`miss_${data.attributes.name}`);
                ped.asignedRoute = null;
                alt.log(`Удален маршрут ${data.attributes.name} для ped ${arg}`);
                if (data.attributes.isdebuged === true){
                    data.attributes.isdebuged = false;
                
                    alt.log('route.isdebuged = false, будет повторяться в общем debug');
                }
            }
            else{
                drawNotification(`Ped ${arg} не назначен никакой маршрут`);
            }
        });

        alt.onServer('patrol:pedDebug', (arg) => {
            alt.log(`ped ${arg} Debug`);

           // this.mainMap.get(this.currentPed.get(arg).asignedRoute).attributes.isdebuged = true;
            //this.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt.Player.local.pos);
            const ped = this.currentPed.get(arg);
            if (ped.isdebuged === false){
               this.pedDebugTurnOn(ped);
            }
            else{
                this.pedDebugTurnOff(ped);
            }
            

         //   this.mainMap.get(this.currentPed.get(arg).asignedRoute).attributes.isdebuged = true;
        });

        //отображать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOn', () => {
            //if (!this.currentPed || !this.currentPed.valid) return;
            this.debug = alt.everyTick(() => {
                
              //  this.drawPedVisionCone();
                this.drawAllMarkers();
                this.connectAllRoutesLine();
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

        alt.onServer('patrol:asignCurrentRouteToPed', (arg, routeID) => {
            alt.log('arg', arg);
            const ped = this.currentPed.get(arg);
            alt.log('ped.entity.scriptID',JSON.stringify(ped.entity.scriptID));
            const data = this.mainMap.get(routeID);
            alt.log('data.attributes:', JSON.stringify(data.attributes));
            alt.log('data.nodes:', JSON.stringify(data.nodes));

            this.asignCurrentRouteToPed(ped.entity, data.attributes, data.nodes);
            data.attributes.asigned = ped.entity.id;
            ped.asignedRoute = routeID;
            //this.currentPed.set(arg, {asignedRoute: routeID});

            if (ped.isdebuged === true){
                data.attributes.isdebuged = true;
                
                alt.log('route.isdebuged = true, не будет повторяться в общем debug');
            }
/*
            this.currentPed.forEach(({ entity, asignedRoute }, id) => {
                alt.log(`Ped ID: ${id}, asignedRoute: ${asignedRoute}, entity:`);
                alt.log(entity);
            });
            */
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

    pedDebugTurnOn(ped){
        if( ped.asignedRoute !== null ){
            this.mainMap.get(ped.asignedRoute).attributes.isdebuged = true;
            alt.log('route.isdebuged = true, не будет повторяться в общем debug');
        }
        ped.isdebuged = true;
        //            const ped = this.currentPed.get(arg);
        //this.singleDebug
        const timerID = alt.everyTick(() => {

            this.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt.Player.local.pos);

            if(ped.asignedRoute !== null){
                const data = this.mainMap.get(ped.asignedRoute);
                this.connectNodesLine(data.nodes, data.attributes);
                this.drawRouteMarkers(data.nodes);
            }
        });
        this.singleDebug.set(ped.entity.id, timerID);
        alt.log('this.singleDebug', this.singleDebug);

    }

    pedDebugTurnOff(ped){
            const timerId = this.singleDebug.get(ped.entity.id);
            alt.clearEveryTick(timerId);
            this.singleDebug.delete(ped.entity.id)
            alt.log('this.singleDebug', this.singleDebug);
//            this.singleDebug = null;
            ped.isdebuged = false;
            if( ped.asignedRoute !== null ){
                this.mainMap.get(ped.asignedRoute).attributes.isdebuged = false;
                alt.log('route.isdebuged = false, не будет повторяться в общем debug');
            }
            //this.mainMap.get(ped.asignedRoute).attributes.isdebuged = false;
            //alt.log('route.isdebuged = true, не будет повторяться в общем debug');
            alt.log(`pedDebugTurnOff`);
    }

    initializeMap(route){

        this.currentRouteAttributes = { //запоминает доп параметры маршрута
            id: route.id,
            name: route.name,
            looped: route.looped,
            asigned: null,
            isdebuged: false
        };
    
        alt.log('currentRouteAttributes', JSON.stringify(this.currentRouteAttributes));

        this.routePointsMap = new Map();
        //this.routePointsMap.clear();    //делает map пустым (на случай если уже существует актинвый map с которым воыполняется работа до этого initializeMap)

        route.nodes.forEach(node => {
            this.routePointsMap.set(node.index, node);
        });

//        this.mainMap.set(this.currentRouteAttributes, this.routePointsMap);
        
this.mainMap.set(route.id, {
    attributes: this.currentRouteAttributes,
    nodes: this.routePointsMap
});

        alt.log('mainMap:');
this.mainMap.forEach(({ attributes, nodes }, id) => {
    alt.log(`Route ID: ${id}, looped: ${attributes.looped}`);
    alt.log(nodes);
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
this.mainMap.forEach(({ attributes, nodes }, id) => {
    alt.log(`Route ID: ${id}, looped: ${attributes.looped}`);
    alt.log(nodes);
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
        this.routePointsMap.clear();
        this.routePointsMap = new Map(tempArray);

        this.mainMap.set(this.currentRouteAttributes.id, {
    attributes: this.currentRouteAttributes,
    nodes: this.routePointsMap
        });

        alt.log('routePointsMap после добавления новой ноды');
        this.routePointsMap.forEach((value, key) => {
            alt.log(`Ключ: ${(key)}`);
            alt.log('value:', (value));
        });
    }

drawAllMarkers() {
    this.mainMap.forEach(({ nodes, attributes }) => {
        if( attributes.isdebuged === false ){
        this.drawRouteMarkers(nodes);
        }
    });
}

drawPedMarkers(){

}

drawRouteMarkers(routeMap) {
    routeMap.forEach((point) => {
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
connectAllRoutesLine() {
    this.mainMap.forEach(({ nodes, attributes }) => {
        if( attributes.isdebuged === false ){
        this.connectNodesLine(nodes, attributes);
        }
    });
}

connectNodesLine(routeMap, attributes){
    if (routeMap.size < 2) return;
 
    const first = routeMap.values().next().value;
    let prev = null;

    routeMap.forEach((current) => {
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

    if (attributes.looped) {
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

    //const coneColor = cansee ? { r: 255, g: 0, b: 0, a: 200 } : { r: 0, g: 255, b: 0, a: 200 };
//отображение области видимости ped
drawPedVisionCone(pedPos, pedScriptID, playerpos) {
    const heading = native.getEntityHeading(pedScriptID);

    const headingRad = heading * Math.PI / 180;
    const halfAngleRad = (this.viewAngle / 2) * Math.PI / 180;
    const stepAngleRad = (this.viewAngle * Math.PI / 180) / this.viewSectors;

    const cansee = this.isPlayerInVisionCone(playerpos, headingRad, halfAngleRad, pedPos);
    let prevPoint = null;
    let coneColor = { r: 0, g: 255, b: 0, a: 200 };

    if (cansee){
        coneColor = { r: 255, g: 0, b: 0, a: 200 };
        native.drawMarker(
            0,
            playerpos.x, playerpos.y, playerpos.z + 1.0,
            0, 0, 0,
            0, 0, 0,
            0.15, 0.15, 0.15,
            255, 0, 0, 200,
            true, true, 2, 0, 0, 0, false
        );
        native.drawLine(
            pedPos.x, pedPos.y, pedPos.z + 0.1,
            playerpos.x, playerpos.y, playerpos.z + 0.5,
            255, 0, 0, 200
        );
    }
    for (let i = -halfAngleRad; i <= halfAngleRad; i += stepAngleRad) {
        const currentAngle = headingRad + i;

        const forwardX = Math.sin(-currentAngle);
        const forwardY = Math.cos(-currentAngle);

        const x = pedPos.x + forwardX * this.viewDistance;
        const y = pedPos.y + forwardY * this.viewDistance;
        const z = pedPos.z;

        native.drawLine(
            pedPos.x, pedPos.y, pedPos.z + 0.1,
            x, y, z + 0.1,
            coneColor.r, coneColor.g, coneColor.b, coneColor.a
        );

        if (prevPoint) {
            native.drawLine(
                prevPoint.x, prevPoint.y, prevPoint.z + 0.1,
                x, y, z + 0.1,
                coneColor.r, coneColor.g, coneColor.b, coneColor.a
            );
        }

        prevPoint = { x, y, z };
    }
}

//            if (!this.isPlayerInSight && this.whichPedhasPlayerinVisionCone === pedScriptID) {

isPlayerInVisionCone(playerPos, headingRad, halfAngleRad, pedPos) {

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
            const heading = native.getEntityHeading(ped);
            const headingRad = heading * Math.PI / 180;
            alt.log(`heading: ${heading}`);
            
            alt.log(`headingRad: ${headingRad}`);
        }

//назначение маршрута ped
async asignCurrentRouteToPed(ped, attributes, nodes) {
    if ( nodes.size === 0 ){
        drawNotification(`Нельзя назначить пустой маршрут для патрулирования`);
        return;
    }
    native.deletePatrolRoute(`miss_${attributes.name}`);

        //cоздаем маршрут
    native.openPatrolRoute(`miss_${attributes.name}`);

        nodes.forEach((current) => {
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


    const first = nodes.values().next().value;
    let prev = null;

    nodes.forEach((current) => {
        if (current !== first) {
            native.addPatrolRouteLink(prev.index, current.index);
        }
        prev = current;
    });

    if (attributes.looped) {
        native.addPatrolRouteLink(prev.index, first.index);
    }

        native.closePatrolRoute();
        native.createPatrolRoute();

        native.taskPatrol(ped, `miss_${attributes.name}`, 0, false, true);
        alt.log(`Назначен патруль ${attributes.name} для ped.id ${ped.id}, ped.scriptID ${ped.scriptID}`);
}

}

new PatrolClient();
