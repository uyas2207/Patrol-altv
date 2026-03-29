import * as alt from 'alt-client';

import * as native from 'natives';

import {drawNotification} from '@utilities';

export class RouteManager {
    constructor(routeStorage, pedStorage, defaultClientConfig) {
        this.routeStorage = routeStorage;
        this.pedStorage = pedStorage;
        this.defaultConfig = defaultClientConfig;

        this.currentRouteMap = new Map();        // текущий маршрут
        this.currentRouteAttributes = null;      // в буддущем массив в котором будут доп знаечния для текщуего массива (looped, assigned, isdebuged)
    }

    // сменить текущий route (route к которому добавляются и удаляются nodes)
    switchCurrentRoute(routeID) {
        if (!this.routeStorage.hasRoute(routeID)) {
            drawNotification('Route не загружен на клиент');
            drawNotification('Чтобы загрузить Route используйте команду /load');
            return;
        }

        const data = this.routeStorage.getRoute(routeID);

        this.currentRouteAttributes = {
            id: data.attributes.id,
            name: data.attributes.name,
            looped: data.attributes.looped,
            assigned: data.attributes.assigned,
            isdebuged: data.attributes.isdebuged
        };

        // пересоздаём map чтобы currentRouteMap был независимой копией
        this.currentRouteMap = new Map(data.nodes);

        // после пересоздания map обновляем ссылку в routeStorage
        this.#syncWithRouteStorage();
    }

    // добавить ноду к текущему маршруту
    addNode(coords, lookingCoords, nodeId) {
        // если currentRouteAttributes === null значит route был очищенн (/clear), либо route еще не был передан на клиент
        if(!this.currentRouteAttributes) {
            drawNotification(`Нельзя доавлять ноды в несущствующий route`);
            return;
        }

        if ( this.currentRouteMap.has(nodeId) === true){
            drawNotification(`Нода с номером ${nodeId} уже существует`);
            drawNotification(`Удалите ноду с номером ${nodeId} или используйте другой номер`);
            return;
        }

        const newnode = {
            index: nodeId,
            position: { x:coords.x, y:coords.y, z:coords.z },
            rotation: { x: lookingCoords.x, y: lookingCoords.y, z: lookingCoords.z },   // координаты на которые будет смотреть ped 
            waitTime: this.defaultConfig.waitTime
        }
        // все ноды идут в порядке возрастания что бы при добавлении ноды она не вставала в конец map
        // и не происходили ситуации когда ped следует по маршруту по точками 1-> 9-> 4-> 2-> 5-> 7-> 0

        // создает массив из значений map, так как значения массива проще сортировать чем значения map
        const tempArray = Array.from(this.currentRouteMap.entries());
        // добавляет в новую ноду с ее значениями
        tempArray.push([nodeId, newnode]);
        // сортирует массив по его key, что бы ноды шли в возрастающем порядке key (в случае с моим map key всегда равны index)
        tempArray.sort((a, b) => a[0] - b[0]);
        // очищает прошлый map что бы его можно было заполнить новыми отсортированными значениями
        this.currentRouteMap.clear();
        this.currentRouteMap = new Map(tempArray);
        this.#syncWithRouteStorage();
    }

    // удаляет ноду из текущего маршрута
    deleteNode(nodeId) {
        if ( this.currentRouteMap.has(nodeId) === false){
            drawNotification(`Нода с номером ${nodeId} не существует`);
            drawNotification(`Нельзя удалить то чего нет`);
            return;
        }
        this.currentRouteMap.delete(nodeId); // удалить из map все значения записанные под ключом nodeId
    }

    // очищает текущий маршрут и удаляет его из allRoutesMap + останавливает ped которому был назначен этот маршрут
    clearCurrentRoute(){
        if (!this.currentRouteAttributes){ // && this.currentRouteMap.size === 0
            drawNotification(`Текщуий route пустой`);
            drawNotification(`Нельзя очистить ПУСТОЙ route`);
            return;
        }
        const tempID = this.currentRouteAttributes.id;

        if(this.currentRouteAttributes.assigned !== null){
            native.deletePatrolRoute(`miss_${this.currentRouteAttributes.name}`);
        }
        // что бы не пришлось переприсваивать очщенные значения this.currentRouteAttributes и this.currentRouteMap
        this.routeStorage.deleteRoute(tempID);
        
        this.currentRouteAttributes = null;
        this.currentRouteMap.clear();
        // так как произошел deletePatrolRoute ped больше не назначен маршрут и нужно сделать assignedRoute = null если сущуствовал ped с таким маршрутом
        //alt.emit('route:cleared', tempID);
        this.pedStorage.unassignRouteFromAllPeds(tempID);
    }

    // отправляет на сервер текущий маршрут для сохранения его в общий список маршрутов в routePoints.json
    sendRouteMap(){           
        if ( this.currentRouteMap.size === 0 ) {
            drawNotification(`Нельзя сохранять ПУСТОЙ route`);
            return;
        }

        // сохраняет в массив все данные о маршруте которые нужно будет отправить на сервер для сохранения в таком же виде
        const savingArray = {
            id: this.currentRouteAttributes.id,
            name: this.currentRouteAttributes.name,
            looped: this.currentRouteAttributes.looped,
            nodes: Array.from(this.currentRouteMap.values())
        }
        alt.emitServer('patrol:sendRouteMap', savingArray);
    }

    // обновляет ссылку в routeStorage после пересоздания currentRouteMap через new Map()
    // нужен только когда currentRouteMap пересоздаётся
    #syncWithRouteStorage() {
        this.routeStorage.updateRoute(
            this.currentRouteAttributes.id,
            this.currentRouteAttributes,
            this.currentRouteMap
        );
    }
}