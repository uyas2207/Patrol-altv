import * as alt from 'alt-client';

export class PedStorage {
    constructor() {
        this.pedDataMap = new Map();    // хранит данные о ped (ped, assignedRoute, isdebuged)
    }

    addPed(entity){
        if (this.pedDataMap.has(entity.id)) {
            alt.logError(`PedStorage.addPed: пед с id ${entity.id} уже существует`);
            return;
        }
        //при первом появлении ped на клиенте
        this.pedDataMap.set(entity.id, {
            entity,
            assignedRoute: null,
            isdebuged: false
        });
    }

    updatePedEntity(entity){
        if (!this.pedDataMap.has(entity.id)) {
            alt.logError(`PedStorage.updatePedEntity: пед с id ${entity.id} не найден`);
            return;
        }

        const data = this.pedDataMap.get(entity.id);
        data.entity = entity; //изменение значений для ped с id
    }

    setPedRoute(pedId, routeID) {
        if (!this.pedDataMap.has(pedId)) {
            alt.logError(`PedStorage.setPedRoute: пед с id ${pedId} не найден`);
            return;
        }
        this.pedDataMap.get(pedId).assignedRoute = routeID;
    }

    unassignPedRoute(pedId){
        if (!this.pedDataMap.has(pedId)) {
            alt.logError(`PedStorage.unassignPedRoute: пед с id ${pedId} не найден`);
            return;
        }
        this.pedDataMap.get(pedId).assignedRoute = null;
    }

    hasPed(pedId) {
        return this.pedDataMap.has(pedId);
    }

    getPed(pedId) {
        return this.pedDataMap.get(pedId);
    }

    setPedIsdebugedStatus(pedId, status){
        if (!(status === true || status === false)) {
            alt.logError('PedStorage.setPedDebugStatus: status может быть только true или false');
            return;
        }
        if (!this.pedDataMap.has(pedId)) {
            alt.logError(`PedStorage.setPedDebugStatus: пед с id ${pedId} не найден`);
            return;
        }
        this.pedDataMap.get(pedId).isdebuged = status;
    }

    //проверяет всю pedDataMap, существовал ли какой то ped которому уже был назначен такой маршрут ранее, если был сделать assignedRoute = null;
    unassignRouteFromAllPeds(routeID) {
        // обновление assignedRoute в pedDataMap
        this.pedDataMap.forEach((ped) => {
            if(ped.assignedRoute === routeID){
                ped.assignedRoute = null;
            }
        });
    }

    // перебор всех педов с колбэком
    forEachPed(callback) {
        this.pedDataMap.forEach((ped, key) => {
            callback(ped);
        });
    }

}
