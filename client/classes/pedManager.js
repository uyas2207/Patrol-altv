import * as alt from 'alt-client';

import * as native from 'natives';

//import { defaultClientConfig } from '../config/clientConfig.js';

export class PedManager {
    constructor(routeManager, debugVisuals, defaultClientConfig) {
        this.mainPedMap = new Map();    // хранит данные о ped (ped, asignedRoute, isdebuged)
        this.routeManager = routeManager;
        this.debugVisuals = debugVisuals;
        this.singleDebug = new Map();   // хранит everytick для визульного отображения у конкретных ped
        this.defaultConfig = defaultClientConfig;
    }

    //изменяет данные о ped, так как при вылете из стрим зоны и повторном влете у ped меняется большая часть данных и нужно перезаписать старые неактуальные данные о ped
    async entityInitialize(entity){
        alt.log('entity.scriptID', entity.scriptID);

        // при повторном появлении ped на клиенте, меняется scriptID и другие значения, но остается тем же id
        if (this.mainPedMap.has(entity.id)) {
            const data = this.mainPedMap.get(entity.id);
            data.entity = entity; //изменение значений для ped с id
            //если у ped есть назначенный маршрут назначает его заново что бы ped продолжил его выполнять
            if(data.asignedRoute){
                const route = this.routeManager.getRoute(data.asignedRoute);
                //const route = this.routeManager.mainMap.get(data.asignedRoute);
                await new Promise(resolve => alt.setTimeout(resolve, 1000));    //setTimeout что бы ped успел инициализироваться полностью, получить netOwner и мог выполнять маршрут
                this.asignCurrentRouteToPed(data.entity, route.attributes, route.nodes);
                alt.log(`Ped ${data.entity.id}, заново asigned прошлый route ${data.asignedRoute}`);
            }
            return;
        }
        //при первом появлении ped на клиенте
        this.mainPedMap.set(entity.id, {
            entity,
            asignedRoute: null,
            isdebuged: false
        });
        const data = this.mainPedMap.get(entity.id);
        alt.log(`entity id: ${data.entity.id}, entity scriptID: ${data.entity.scriptID}, asignedRoute: ${data.asignedRoute}`);
    }

    asignRouteToPed(pedId, routeID) {
        // Проверка наличия маршрута
        if (this.routeManager.hasRoute(routeID) === false) {
            drawNotification(`Route не загружен на клиент`);
            drawNotification(`Что бы загрузить Route используйте команду /load`);
            return;
        }

        const route = this.routeManager.getRoute(routeID);
        const ped = this.getPed(pedId);
        
        if (!ped) {
            drawNotification(`Ped ${pedId} не найден`);
            return;
        }

        alt.log('route:', JSON.stringify(route));
        alt.log('ped:', JSON.stringify(ped));

        // Выполнение патрулирования (было в asignCurrentRouteToPed)
        this.asignCurrentRouteToPed(ped.entity, route.attributes, route.nodes);

        // Очистка предыдущих назначений того же маршрута
        this.updatePedAssignment(routeID, pedId);

        // Обновление данных ped
        ped.asignedRoute = routeID;
        
        // Обновление данных маршрута
        route.attributes.asigned = pedId;
    }

    updatePedAssignment(routeID, currentPedId) {
        this.mainPedMap.forEach((value) => {
            if(value.asignedRoute === routeID && value.entity.id !== currentPedId) {
                value.asignedRoute = null;
            }
        });
    }

    //назначение маршрута ped
    async asignCurrentRouteToPed(ped, attributes, nodes) {
        if ( nodes.size === 0 ){
            drawNotification(`Нельзя назначить пустой маршрут для патрулирования`);
            return;
        }
        native.deletePatrolRoute(`miss_${attributes.name}`);

            //cоздает маршрут
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

    pedStop(pedID){
        const ped = this.mainPedMap.get(pedID);

        if (ped.asignedRoute !== null ){    
            const data = this.routeManager.getRoute(ped.asignedRoute);
            native.deletePatrolRoute(`miss_${data.attributes.name}`);
            ped.asignedRoute = null;
            alt.log(`Удален маршрут ${data.attributes.name} для ped ${pedID}`);
            if (data.attributes.isdebuged === true){
                data.attributes.isdebuged = false;
            
                alt.log('route.isdebuged = false => будет повторяться в общем debug');
            }
        }
        else{
            drawNotification(`Ped ${pedID} не назначен никакой маршрут`);
        }
    }

    pedDebug(arg){
        
        const ped = this.mainPedMap.get(arg);
        if (ped.isdebuged === false){
            this.pedDebugTurnOn(ped);
        }
        else{
            this.pedDebugTurnOff(ped);
        }
        
    }

    pedDebugTurnOn(ped){
        if( ped.asignedRoute !== null ){
            this.routeManager.changeIsdebugedStatus(ped.asignedRoute, true);
            alt.log('route.isdebuged = true, не будет повторяться в общем debug');
        }
        ped.isdebuged = true;
        //            const ped = this.mainPedMap.get(arg);
        //this.singleDebug
        const timerID = alt.everyTick(() => {

            this.debugVisuals.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt.Player.local.pos);

            if(ped.asignedRoute !== null){
                const data = this.routeManager.getRoute(ped.asignedRoute);
                this.debugVisuals.connectNodesLine(data.nodes, data.attributes);
                this.debugVisuals.drawRouteMarkers(data.nodes);
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
                this.routeManager.changeIsdebugedStatus(ped.asignedRoute, false);
                alt.log('route.isdebuged = false, не будет повторяться в общем debug');
            }
            
            alt.log(`pedDebugTurnOff`);
    }

    clearPedAssignment(routeID) {    //pedId
        // обновление asignedRoute в mainPedMap
        this.mainPedMap.forEach((value) => {
            if(value.asignedRoute === routeID){ // && value.entity.id !== pedId
                value.asignedRoute = null;
            }
        });
    }

    //выводит всю информацию о ped
    pedInfoCommand(arg){
        const data = this.mainPedMap.get(arg);
        alt.log(`data ${data.entity}`);
        alt.log('=== ВСЁ О PED ===');
        for (let key in data.entity) {
            try {
                alt.log(`${key} = ${data.entity[key]}`);
            } catch (error) {
                // нужно что бы код продолжил выполняться после ошибки если она будет
            }
        }
        const heading = native.getEntityHeading(data.entity.scriptID);
        alt.log ('heading =', heading);
    }

    //выводит всю информацию о ped из map mainPedMap (asignedRoute, isdebuged)
    pedMapCommand(){
        alt.log('Весь mainPedMap');
        this.mainPedMap.forEach((value, key) => {
            alt.log(`Ключ: ${(key)}`);
            alt.log('value:', (value));
        });
    }

    //доп методы для вызова из других классов

    getPed(pedId) {
        return this.mainPedMap.get(pedId);
    }

    getAllPeds() {
        return this.mainPedMap;
    }

    // перебор всех педов с колбэком
    forEachPed(callback) {
        this.mainPedMap.forEach((pedData, pedId) => {
            // Передаём копию данных, чтобы предотвратить прямое изменение
            callback({
                id: pedId,
                entity: pedData.entity,
                asignedRoute: pedData.asignedRoute,
                isdebuged: pedData.isdebuged
            }, pedId);
        });
    }
}