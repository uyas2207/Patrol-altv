import * as alt from 'alt-client';

import * as native from 'natives';

import {drawNotification} from '@utilities';

export class PedManager {
    constructor(routeManager, patrolExecutor, defaultClientConfig) {
        this.mainPedMap = new Map();    // хранит данные о ped (ped, asignedRoute, isdebuged)
        this.routeManager = routeManager;
        this.patrolExecutor = patrolExecutor;
        this.defaultConfig = defaultClientConfig;

        alt.on('route:cleared', (routeID) => {
            alt.log('PedManageron route:cleared');
            this.clearPedAssignment(routeID);
        });
        
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
                this.patrolExecutor.asignCurrentRouteToPed(data.entity, route.attributes, route.nodes);
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

    //проверяет всю mainPedMap, существовал ли какой то ped которому уже был назначен такой маршрут ранее, если был сделать asignedRoute = null;
    clearPedAssignment(routeID) {
        // обновление asignedRoute в mainPedMap
        this.mainPedMap.forEach((value) => {
            if(value.asignedRoute === routeID){ // && value.entity.id !== pedId
                value.asignedRoute = null;
            }
        });
    }

    asignRouteToPed(pedId, routeID) {
        // проверка существования маршрута
        if (this.routeManager.hasRoute(routeID) === false) {
            drawNotification(`Route не загружен на клиент`);
            drawNotification(`Что бы загрузить Route используйте команду /path load`);
            return;
        }

        const route = this.routeManager.getRoute(routeID);
        const ped = this.mainPedMap.get(pedId);
    
        if (!ped) {
            drawNotification(`Ped ${pedId} не найден`);
            return;
        }

        alt.log('route:', JSON.stringify(route));
        alt.log('ped:', JSON.stringify(ped));

        // назначение маршртуа ped
        this.patrolExecutor.asignCurrentRouteToPed(ped.entity, route.attributes, route.nodes);

        //так как asignCurrentRouteToPed не позволяет делать один и тот же маршрут разным ped (делает в начале deletePatrolRoute) 
        //нужно после выполнения asignCurrentRouteToPed очищать в map значения asignedRoute такие же как routeID, так как этим ped больше не назначен этот маршрут
        
        //проверяет всю mainPedMap, существовал ли какой то ped которому уже был назначен такой маршрут ранее, если был сделать asignedRoute = null;
        this.clearPedAssignment(routeID);

        //запоминает какой маршрту был назначен для этого ped
        ped.asignedRoute = routeID;
        //изменяет в классе routeManager значение asigned для необходимого маршрута
        alt.emit('ped:routeAssigned', { routeID, pedId });
        //this.routeManager.asignRouteToPed(routeID, pedId);

        //в случае когда ped был со включенным debug и ему назначили маршрут нужно сделать значение маршртуа isdebuged в routeManager
        if (ped.isdebuged === true) {
            this.routeManager.changeRouteIsdebugedStatus(ped.asignedRoute, true);
        }
    }

    pedStop(pedID){
        const ped = this.mainPedMap.get(pedID);

        if (ped.asignedRoute !== null ){    
            const data = this.routeManager.getRoute(ped.asignedRoute);
            native.deletePatrolRoute(`miss_${data.attributes.name}`);
            const routeID = ped.asignedRoute;
            alt.emit('ped:routeUnassigned', { routeID, pedID });
            //this.routeManager.unAsignRouteFromPed(ped.asignedRoute, pedID);
            
            if (data.attributes.isdebuged === true){
                this.routeManager.changeRouteIsdebugedStatus(ped.asignedRoute, false);
                //data.attributes.isdebuged = false;
            
                alt.log('route.isdebuged = false => будет повторяться в общем debug');
            }
            
            ped.asignedRoute = null;
            alt.log(`Удален маршрут ${data.attributes.name} для ped ${pedID}`);
        }
        else{
            drawNotification(`Ped ${pedID} не назначен никакой маршрут`);
        }
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

    changePedIsdebugedStatus(pedId, status){
        if (status === true || status === false){
            this.mainPedMap.get(pedId).isdebuged = status;
        }
        else {
            alt.log('Некорректное использование changePedIsdebugedStatus');
            alt.log('status может быть только true или false');
            return;
        }
    }

    // перебор всех педов с колбэком
    forEachPed(callback) {
        this.mainPedMap.forEach((value, key) => {
            callback(value);
        });
    }
}