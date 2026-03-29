import * as alt from 'alt-client';

import * as native from 'natives';

import {drawNotification} from '@utilities';

export class PedManager {
    constructor(pedStorage, routeStorage, patrolExecutor, defaultClientConfig) {
        this.pedStorage = pedStorage;

        this.routeStorage = routeStorage;
        this.patrolExecutor = patrolExecutor;
        this.defaultConfig = defaultClientConfig;
    }

    assignRoute(pedId, routeID) {
        // проверка существования маршрута
        if (this.routeStorage.hasRoute(routeID) === false) {
            drawNotification(`Route не загружен на клиент`);
            drawNotification(`Что бы загрузить Route используйте команду /path load`);
            return;
        }

        const route = this.routeStorage.getRoute(routeID);
        const ped = this.pedStorage.getPed(pedId);

        if (!ped) {
            drawNotification(`Ped ${pedId} не найден`);
            return;
        }
        // назначение маршртуа ped
        this.patrolExecutor.assignCurrentRouteToPed(ped.entity, route.attributes, route.nodes);
        
        //так как assignCurrentRouteToPed не позволяет делать один и тот же маршрут разным ped (делает в начале deletePatrolRoute) 
        //нужно после выполнения assignCurrentRouteToPed очищать в map значения assignedRoute такие же как routeID, так как этим ped больше не назначен этот маршрут
        
        //проверяет всю pedDataMap, существовал ли какой то ped которому уже был назначен такой маршрут ранее, если был сделать assignedRoute = null + сделать isdebuged = false в классе routeStorage;
        this.clearAllPedDependencies(routeID);

        //запоминает какой маршрту был назначен для этого ped
        this.pedStorage.setPedRoute(pedId, routeID);
        //изменяет в классе routeStorage значение assigned для необходимого маршрута
        this.routeStorage.setRouteAssignment(routeID, pedId);

        //в случае когда ped был со включенным debug и ему назначили маршрут нужно сделать значение маршртуа isdebuged в routeStorage
        if (ped.isdebuged === true) {
            this.routeStorage.setRouteDebugStatus(ped.assignedRoute, true);
        }
    }

    pedStop(pedID){
        const ped = this.pedStorage.getPed(pedID);

        if (ped.assignedRoute !== null ){
            const route = this.routeStorage.getRoute(ped.assignedRoute);
            native.deletePatrolRoute(`miss_${route.attributes.name}`);
            this.clearPedDependencies(ped.assignedRoute, pedID);
        }
        else{
            drawNotification(`Ped ${pedID} не назначен никакой маршрут`);
        }
    }

    async reassignRouteAfterStreaming(entity){
        const ped = this.pedStorage.getPed(entity.id);
        if (!ped) {
            alt.logError(`PedManager.reassignRouteAfterStreaming: пед с id ${entity.id} не найден в pedDataMap при попытки переприсвоить маршрут после стриминга`);
            return;
        }
        this.pedStorage.updatePedEntity(entity);

        if(ped.assignedRoute){
            const route = this.routeStorage.getRoute(ped.assignedRoute);
            await new Promise(resolve => alt.setTimeout(resolve, 1000));    //setTimeout что бы ped успел инициализироваться полностью, получить netOwner и мог выполнять маршрут
            this.patrolExecutor.assignCurrentRouteToPed(ped.entity, route.attributes, route.nodes);
        }
    }

    //проверяет всю pedDataMap, существовал ли какой то ped которому уже был назначен такой маршрут ранее, если был сделать assignedRoute = null;
    clearAllPedDependencies(routeID) {
        this.pedStorage.forEachPed((ped) => {
            if (ped.assignedRoute === routeID) {
                //если был такой ped которому был назначен такой же маршрут выставляет значение assignedRoute = null в клсаае routeStorage и в pedDataMap + делает isdebuged = false если вдруг этот маршрут был debug у ped которому сделан assignedRoute = null
                this.clearPedDependencies(routeID, ped.entity.id);
            }
        });
    }

    clearPedDependencies(routeID, pedId) {
        this.routeStorage.clearRouteAssignment(routeID, pedId);
        this.routeStorage.setRouteDebugStatus(routeID, false);
        this.pedStorage.unassignPedRoute(pedId);
    }

}