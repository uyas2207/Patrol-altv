import * as alt from 'alt-client';

export class RouteStorage {
    #allRoutesMap;

    constructor(notificationManager) {
        this.#allRoutesMap = new Map();  // все маршруты на клиенте

        this.notificationManager = notificationManager;
    }
    
    //получает route с сервера и добавляет его в #allRoutesMap, если такой route еще не добавлен
    addRoute(route) {
        if (this.#allRoutesMap.has(route.id)) {
            this.notificationManager.drawNotification(`route ${route.name} уже существует`);
            return;
        }

        const attributes = {
            id: route.id,
            name: route.name,
            looped: route.looped,
            assigned: null,
            isdebuged: false
        };

        const nodes = new Map();

        route.nodes.forEach(node => {
            nodes.set(node.index, node);
        });

        this.#allRoutesMap.set(route.id, {
            attributes: attributes,
            nodes: nodes
        });
    }

    getRoute(routeID) {
        return this.#allRoutesMap.get(routeID);
    }

    hasRoute(routeID) {
        return this.#allRoutesMap.has(routeID);
    }

    deleteRoute(routeID) {
        if (!this.#allRoutesMap.has(routeID)) {
            alt.logError('Передан неверный routeID в deleteRoute');
            return;
        }
        this.#allRoutesMap.delete(routeID);
    }

    //смена статуса isdebuged у какого либо route из #allRoutesMap
    setRouteDebugStatus(routeID, status) {
        if (!(status === true || status === false)) {
            alt.logError('Некорректное использование setRouteDebugStatus, status может быть только true или false');
            return;
        }
        if (!this.#allRoutesMap.has(routeID)) {
            alt.logError('Передан неверный routeID в setRouteDebugStatus');
            return;
        }
        this.#allRoutesMap.get(routeID).attributes.isdebuged = status;
    }

    //смена статуса assigned, после смены ped.assignedRoute route в классе PedManager
    setRouteAssignment(routeID, pedId) {
        if (!this.#allRoutesMap.has(routeID)) {
            alt.logError('Передан неверный routeID в setRouteAssignment');
            return;
        }
        this.#allRoutesMap.get(routeID).attributes.assigned = pedId;
    }

    //смена статуса assigned, после смены ped.assignedRoute route в классе PedManager
    clearRouteAssignment(routeID) {
        if (!this.#allRoutesMap.has(routeID)) {
            alt.logError('Передан неверный routeID в clearRouteAssignment');
            return;
        }
        this.#allRoutesMap.get(routeID).attributes.assigned = null;
    }
    
    //для синхронизации данных после изменений в классе routeManager
    updateRoute(routeID, attributes, nodes){
        this.#allRoutesMap.set(routeID, {
            attributes: attributes,
            nodes: nodes
        });
    }

    // перебор всех маршрутов с колбэком
    forEachRoute(callback) {
        this.#allRoutesMap.forEach((value, routeId) => {
            callback(value.attributes, value.nodes);
        });
    }
}