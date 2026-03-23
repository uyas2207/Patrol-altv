import * as alt from 'alt-client';

import * as native from 'natives';

import {drawNotification} from '@utilities';

export class RouteManager {
    constructor(defaultClientConfig) {
        this.defaultConfig = defaultClientConfig;
        //this.pedManager = null;

        this.currentRouteMap = new Map();        // текущий маршрут
        this.mainMap = new Map();                // все маршруты на клиенте
        this.currentRouteAttributes = null;      //в буддущем массив в котором будут доп знаечния для текщуего массива (looped, asigned, isdebuged)
        
        //подписывается на ивенты приходящие из других классов
        this.registerEventListeners();
    }

    registerEventListeners(){
        
        alt.on('ped:routeAssigned', ({ routeID, pedId }) => {
            this.asignRouteToPed(routeID, pedId);
        });

        alt.on('ped:routeUnassigned', ({ routeID, pedID }) => {
            this.unAsignRouteFromPed(routeID, pedID);
        });
    }

    //получает route с сервера и добавляет его в mainMap, если такой route еще не добавлен
    initRoutes(route){
        if (this.mainMap.has(route.id)) {
            drawNotification(`route ${route.name} уже существует`);
            return;
        }
        this.initializeMap(route);
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

        this.currentRouteMap = new Map();
        //this.currentRouteMap.clear();    //делает map пустым (на случай если уже существует актинвый map с которым воыполняется работа до этого initializeMap)

        route.nodes.forEach(node => {
            this.currentRouteMap.set(node.index, node);
        });

        this.mainMap.set(route.id, {
            attributes: this.currentRouteAttributes,
            nodes: this.currentRouteMap
        });

        alt.log('mainMap:');
        this.mainMap.forEach(({ attributes, nodes }, id) => {
            alt.log(`Route ID: ${id}, looped: ${attributes.looped}`);
            alt.log(nodes);
        });
    }
    
    //сменить текущий route (route к которому добавляются и удаляются nodes)
    switchCurrentRoute(routeID){
        if (this.mainMap.has(routeID) === false) {
            drawNotification(`Route не загружен на клиент`);
            drawNotification(`Что бы загрузить Route используйте команду /load`);
            return;
        }
        const data = this.mainMap.get(routeID);
        //this.initializeMap(data);
        this.currentRouteAttributes = { //запоминает доп параметры маршрута
            id: data.attributes.id,
            name: data.attributes.name,
            looped: data.attributes.looped,
            asigned: data.attributes.asigned,
            isdebuged: data.attributes.isdebuged
        };

        alt.log('currentRouteAttributes После switch:', JSON.stringify(this.currentRouteAttributes));

        this.currentRouteMap = new Map();

        data.nodes.forEach(node => {
            this.currentRouteMap.set( node.index, node);
        });
        // из за того кто был создан new Map(), нужно заново делать this.mainMap.set что бы все последущие изменения в this.currentRouteMap корректно отображались в this.mainMap
        this.mainMap.set(routeID, {
            attributes: this.currentRouteAttributes,
            nodes: this.currentRouteMap
        });
        alt.log('currentRouteMap После switch:', JSON.stringify(this.currentRouteMap));
        alt.log('Сменилась текщуий route на route =', data.attributes.name);
    }

    //добавить ноду к текущему маршруту
    addNodeTocurrentRouteMap(coords, lookingCoords, arg){
        //если currentRouteAttributes === null значит route был очищенн (/clear), либо route еще не был скачан
        if(!this.currentRouteAttributes) {
            drawNotification(`Нельзя доавлять ноды в несущствующий route`);
            return;
        }

        if ( this.currentRouteMap.has(arg) === true){
            drawNotification(`Нода с номером ${arg} уже существует`);
            drawNotification(`Удалите ноду с номером ${arg} или используйте другой номер`);
            return;
        }

        const newnode = {
            index: arg,
            position: { x:coords.x, y:coords.y, z:coords.z },
            rotation: { x: lookingCoords.x, y: lookingCoords.y, z: lookingCoords.z },   //координаты на которые будет смотреть ped 
            waitTime: this.defaultConfig.waitTime
        }
        //все ноды идут в порядке возрастания что бы при добавлении ноды она не вставала в конец map
        // и не происходили ситуации когда ped следует по маршруту по точками 1-> 9-> 4-> 2-> 5-> 7-> 0

        //создает массив из значений map, так как значения массива проще сортировать чем значения map
        const tempArray = Array.from(this.currentRouteMap.entries());
        //добавляет в новую ноду с ее значениями
        tempArray.push([arg, newnode]);
        //сортирует массив по его key, что бы ноды шли в возрастающем порядке key (в случае с моим map key всегда равны index)
        tempArray.sort((a, b) => a[0] - b[0]);
        //очищает прошлый map что бы его можно было заполнить новыми отсортированными значениями
        this.currentRouteMap.clear();
        this.currentRouteMap = new Map(tempArray);
        // из за того кто был создан new Map(), нужно заново делать this.mainMap.set что бы все последущие изменения в this.currentRouteMap корректно отображались в this.mainMap
        this.mainMap.set(this.currentRouteAttributes.id, {
            attributes: this.currentRouteAttributes,
            nodes: this.currentRouteMap
        });

        alt.log('currentRouteMap после добавления новой ноды');
        this.currentRouteMap.forEach((value, key) => {
            alt.log(`Ключ: ${(key)}`);
            alt.log('value:', (value));
        });
    }

    dellNodeFromMap(arg){
        if ( this.currentRouteMap.has(arg) === false){
            drawNotification(`Нода с номером ${arg} не существует`);
            drawNotification(`Нельзя удалить то чего нет`);
            return;
        }
        this.currentRouteMap.delete(arg); // удалить из map все значения записанные под ключом arg
        alt.log('Весь Map после удаления ноды');
        this.mainMap.forEach(({ attributes, nodes }, id) => {
            alt.log(`Route ID: ${id}, looped: ${attributes.looped}`);
            alt.log(nodes);
        });
    }

    //очищает текущий маршрут и удаляет его из mainMap + останавливает ped которому был назначен этот маршрут
    clearCurrentRoute(){
        if (!this.currentRouteAttributes){ // && this.currentRouteMap.size === 0
            drawNotification(`Текщуий route пустой`);
            drawNotification(`Нельзя очистить ПУСТОЙ route`);
            return;
        }
        const tempID = this.currentRouteAttributes.id;

        if(this.currentRouteAttributes.asigned !== null){
            native.deletePatrolRoute(`miss_${this.currentRouteAttributes.name}`);
        }
        //что бы не пришлось переприсваивать очщенные значения this.currentRouteAttributes и this.currentRouteMap
        this.mainMap.delete(tempID);
        
        this.currentRouteAttributes = null;
        this.currentRouteMap.clear();
        //так как произошел deletePatrolRoute ped больше не назначен маршрут и нужно сделать asignedRoute = null если сущуствовал ped с таким маршрутом
        alt.emit('route:cleared', tempID);
        //this.pedManager.clearPedAssignment(tempID);
    }

    //отправляет на сервер текущий маршрут для сохранения его в общий список маршрутов в routePoints.json
    sendRouteMap(){           
        if ( this.currentRouteMap.size === 0 ) {
            alt.log('Попытка сохранить пустой route');
            drawNotification(`Нельзя сохранять ПУСТОЙ route`);
            return;
        }
        alt.log('askForRouteMap + sendRouteMap');
        //сохраняет в массив все данные о маршруте которые нужно будет отправить на сервер для сохранения в таком же виде
        const savingArray = {
            id: this.currentRouteAttributes.id,
            name: this.currentRouteAttributes.name,
            looped: this.currentRouteAttributes.looped,
            nodes: Array.from(this.currentRouteMap.values())
        }
        alt.log('savingArray:', JSON.stringify(savingArray));
        alt.emitServer('patrol:sendRouteMap', savingArray);
    }
    
    //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.currentRouteMap + currentRouteAttributes
    printAllRoutesInfo(){
        alt.log('Весь mainMap');
        this.mainMap.forEach((value, key) => {
            alt.log(`Ключ: ${(key)}`);
            alt.log('value:', (value));
        });
        alt.log('===========================================================');
        alt.log('this.currentRouteMap:');
        
        this.currentRouteMap.forEach((value, key) => {
            alt.log(`Ключ: ${(key)}`);
            alt.log('value:', (value));
        });

        alt.log('===========================================================');
        alt.log('this.currentRouteAttributes:', JSON.stringify(this.currentRouteAttributes));
    }

    //доп методы для вызова из других классов

    hasRoute(routeID) {
        return this.mainMap.has(routeID);
    }

    getRoute(routeID) {
        return this.mainMap.get(routeID);
    }

    changeRouteIsdebugedStatus(routeID, status){
        if (status === true || status === false){
            this.mainMap.get(routeID).attributes.isdebuged = status;
        } 
        else {
            alt.log('Некорректное использование changeRouteIsdebugedStatus');
            alt.log('status может быть только true или false');
            return;
        }
    }
    //смена статуса asigned, после смены ped.asignedRoute route в классе PedManager
    asignRouteToPed(routeID, pedId){
        if(this.mainMap.has(routeID)){
            const route = this.mainMap.get(routeID);
            route.attributes.asigned = pedId;
        }
        else{
            alt.log('Передан неверный routeID в asignRouteToPed');
        }
    }
    //смена статуса asigned, после смены ped.asignedRoute route в классе PedManager
    unAsignRouteFromPed(routeID, pedId){
        if(!this.mainMap.has(routeID)){
            alt.log('Передан неверный routeID в unAsignRouteFromPed');
            return;
        }
        
        const route = this.mainMap.get(routeID);
        if (route.attributes.asigned === pedId){
            route.attributes.asigned = null;
        }
        else{
            alt.log(`Ped: ${pedID} не был назначен routeID: ${routeID}`);
        }
        
    }

    // перебор всех маршрутов с колбэком
    forEachRoute(callback) {
        this.mainMap.forEach((value, routeId) => {
            callback(value.attributes, value.nodes);
        });
    }

}