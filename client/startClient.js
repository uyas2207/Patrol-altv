import * as alt from 'alt-client';

import * as native from 'natives';

import { defaultClientConfig } from './config/clientConfig.js';

import { RouteManager } from './classes/routeManager.js';
import { PedManager } from './classes/pedManager.js';
import { DebugManager } from './classes/debugManager.js';
import { DebugVisuals } from './classes/debugVisuals.js';

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
        this.mainPedMap = new Map();    //хранит данные о ped (ped, asignedRoute, isdebuged)
        this.debug = null;  //хранит everytick для общего debug
        this.singleDebug = new Map();   //хранит everytick для визульного отображения у конкретных ped

        this.currentRouteAttributes = null;     //в буддущем массив в котором будут доп знаечния для текщуего массива (looped, asigned, isdebuged)

        this.defaultConfig = defaultClientConfig;

        this.currentRouteMap = new Map();        //текущий маршрут
        this.mainMap = new Map();               //все маршруты на клиенте

        this.debugVisuals = new DebugVisuals(); //класс для визуального отображения debug


        this.routeManager = new RouteManager(this.pedManager);
        this.pedManager = new PedManager(this.routeManager, this.debugVisuals);
        this.debugManager = new DebugManager(this.pedManager, this.routeManager, this.debugVisuals);
    
        this.init();
    }

    init(){
        //выводит всю информацию о ped
        alt.onServer('patrol:pedinfo', (arg) => {
            this.pedManager.pedInfoCommand(arg);
            //this.pedInfoCommand(arg);
        });
        //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.currentRouteMap + currentRouteAttributes
        alt.onServer('patrol:route', () => {
            this.routeManager.printAllRoutesInfo();
            //this.routeCommand();
        });
        //выводит всю информацию о ped из map mainPedMap (asignedRoute, isdebuged)
        alt.onServer('patrol:pedMap', () => {
            this.pedManager.pedMapCommand();
            //this.pedMapCommand();
        });
        //при появлении ped в стрим зоне игрока (если не ped return)
        alt.on('gameEntityCreate', (entity) => {
            alt.log('gameEntityCreate, entity:', entity);
            if(!(entity instanceof alt.Ped)) return;

            this.pedManager.entityInitialize(entity);
        });

        //получает route с сервера и добавляет его в mainMap, если такой route еще не добавлен
        alt.onServer('patrol:initRoutes', (route) => {
            this.routeManager.initRoutes(route);
            //this.initRoutes(route);
        });
        //отсанавливает ped (deletePatrolRoute) если ему назначен маршрут + отключает ped debug у маршрута и изменяет данные в pedmap (asignedRoute, isdebuged)
        alt.onServer('patrol:pedStop', (arg) => {
            alt.log(`ped ${arg} Stop`);
            this.pedManager.pedStop(arg);
            //this.pedStop(arg);
        });
        //включает debug для конкретного ped (его область видимости и его маршрут если у него есть asignedRoute)
        alt.onServer('patrol:pedDebug', (arg) => {
            alt.log(`ped ${arg} Debug`);
            this.pedManager.pedDebug(arg);
        });

        //отображать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOn', () => {
            //if (!this.mainPedMap || !this.mainPedMap.valid) return;
            this.debugManager.turnOnGlobalDebug();
        });
        
        //выключать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOff', () => {
            this.debugManager.turnOffGlobalDebug();
            /*
            alt.clearEveryTick(this.debug);
            this.debug = null;
            alt.log(`debugTurnOff`);
            */
        });
        //сменить текущий route (route к которому добавляются и удаляются nodes)
        alt.onServer('patrol:switchCurrentRoute', (routeID) => {
            alt.log('routeID:', routeID);
            this.routeManager.switchCurrentRoute(routeID);
            //this.switchCurrentRoute(routeID);
        });
        //назначить ped текущий маршрут 
        alt.onServer('patrol:asignCurrentRouteToPed', (arg, routeID) => {
            alt.log('arg', arg);
            this.pedManager.asignRouteToPed(arg, routeID);
            //this.checkBeforeAsign(arg, routeID);
        });
        //добавить ноду к текущему маршруту
        alt.onServer('patrol:addNode', (coords, lookingCoords, arg) => {
            this.routeManager.addNodeTocurrentRouteMap(coords, lookingCoords, arg);
            alt.log(`addnode`);
        });
        //удалить ноду из текущего маршрута
        alt.onServer('patrol:dellNode', (arg) => {
            this.routeManager.dellNodeFromMap(arg);
            alt.log(`dellNode`);
        });
        //отправляет на сервер текущий маршрут для сохранения его в общий список маршрутов в routePoints.json
        alt.onServer('patrol:askForRouteMap', () => {
            this.routeManager.sendRouteMap();
        });
        //очищает текущий маршрут и удаляет его из mainMap
        alt.onServer('patrol:clearCurrentRoute', () => {
            this.routeManager.clearCurrentRoute();
            //this.clearCurrentRoute();
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
        this.mainPedMap.forEach((value) => {
            if(value.asignedRoute === tempID){
                value.asignedRoute = null;
            }
        });
    }

    checkBeforeAsign(arg, routeID){
        if (this.mainMap.has(routeID) === false) {
            drawNotification(`Route не загружен на клиент`);
            drawNotification(`Что бы загрузить Route используйте команду /load`);
            return;
        }
        const route = this.mainMap.get(routeID);
        alt.log('route:', JSON.stringify(route));
        const ped = this.mainPedMap.get(arg);
        alt.log('ped:', JSON.stringify(ped));
        this.asignCurrentRouteToPed(ped.entity, route.attributes, route.nodes);
        //так как asignCurrentRouteToPed не позволяет делать один и тот же маршрут разным ped (делает в начале deletePatrolRoute) 
        //нужно после выполнения asignCurrentRouteToPed очищать в map значения asignedRoute такие же как routeID, так как этим ped больше не назначен этот маршрут
        //проверяет всю mainPedMap, существовал ли какой то ped которому уже был назначен такой маршрут ранее, если был сделать asignedRoute = null;
        this.mainPedMap.forEach((value) => {
            if(value.asignedRoute === routeID){
                value.asignedRoute = null;
            }
        });
        //записывает в PedMap какой маршрут был назначен ped
        ped.asignedRoute = routeID;
        //записывает в mainMap какому ped был назначен маршрут
        route.attributes.asigned = arg;
    }

    //получает route с сервера и добавляет его в mainMap, если такой route еще не добавлен
    initRoutes(route){
        if (this.mainMap.has(route.id)) {
            drawNotification(`route ${route.name} уже существует`);
            return;
        }
        this.initializeMap(route);
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
    routeCommand(){
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

    //выводит всю информацию о ped из map mainPedMap (asignedRoute, isdebuged)
    pedMapCommand(){
        alt.log('Весь mainPedMap');
        this.mainPedMap.forEach((value, key) => {
            alt.log(`Ключ: ${(key)}`);
            alt.log('value:', (value));
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
                const route = this.mainMap.get(data.asignedRoute);
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

    pedDebugTurnOn(ped){
        if( ped.asignedRoute !== null ){
            this.mainMap.get(ped.asignedRoute).attributes.isdebuged = true;
            alt.log('route.isdebuged = true, не будет повторяться в общем debug');
        }
        ped.isdebuged = true;
        //            const ped = this.mainPedMap.get(arg);
        //this.singleDebug
        const timerID = alt.everyTick(() => {

            this.debugVisuals.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt.Player.local.pos);

            if(ped.asignedRoute !== null){
                const data = this.mainMap.get(ped.asignedRoute);
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

        this.currentRouteMap = new Map();
        //this.currentRouteMap.clear();    //делает map пустым (на случай если уже существует актинвый map с которым воыполняется работа до этого initializeMap)

        route.nodes.forEach(node => {
            this.currentRouteMap.set(node.index, node);
        });

//        this.mainMap.set(this.currentRouteAttributes, this.currentRouteMap);
        
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
            waitTime: 1000
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

    pedStop(arg){
        const ped = this.mainPedMap.get(arg);

        if (ped.asignedRoute !== null ){    
            const data = this.mainMap.get(ped.asignedRoute);
            native.deletePatrolRoute(`miss_${data.attributes.name}`);
            ped.asignedRoute = null;
            alt.log(`Удален маршрут ${data.attributes.name} для ped ${arg}`);
            if (data.attributes.isdebuged === true){
                data.attributes.isdebuged = false;
            
                alt.log('route.isdebuged = false => будет повторяться в общем debug');
            }
        }
        else{
            drawNotification(`Ped ${arg} не назначен никакой маршрут`);
        }
    }

    pedDebug(arg){ 
        // this.mainMap.get(this.mainPedMap.get(arg).asignedRoute).attributes.isdebuged = true;
        //this.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt.Player.local.pos);
        const ped = this.mainPedMap.get(arg);
        if (ped.isdebuged === false){
            this.pedDebugTurnOn(ped);
        }
        else{
            this.pedDebugTurnOff(ped);
        }
        
        //   this.mainMap.get(this.mainPedMap.get(arg).asignedRoute).attributes.isdebuged = true;
    }

    debugTurnOn(){
        this.debug = alt.everyTick(() => {
            this.drawAllPedVisionCones();
            this.drawAllMarkers();
            this.connectAllRoutesLine();
        });
        alt.log(`debugTurnOn`);
    }

    drawAllMarkers() {
        this.mainMap.forEach(({ nodes, attributes }) => {
            if( attributes.isdebuged === false ){
            this.debugVisuals.drawRouteMarkers(nodes);
            }
        });
    }

    drawAllPedVisionCones(){
        this.mainPedMap.forEach((value) => {
            if( value.isdebuged === false ){
                this.debugVisuals.drawPedVisionCone(value.entity.pos, value.entity.scriptID, alt.Player.local.pos)
            }
        });

    }

    //отображение линий между маркерами (показывает от какого маркера к какому будет ходить ped)
    connectAllRoutesLine() {
        this.mainMap.forEach(({ nodes, attributes }) => {
            if( attributes.isdebuged === false ){
            this.debugVisuals.connectNodesLine(nodes, attributes);
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

}
/*
class DebugVisuals{
    constructor() {
        this.viewDistance = defaultClientConfig.viewDistance;      // длина конуса
        this.viewAngle = defaultClientConfig.viewAngle;       // угол обзора (градусы)
        this.viewSectors = defaultClientConfig.viewSectors;       //количество секторов видимости у ped

        this.defaultConfig = defaultClientConfig;
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
}
*/
new PatrolClient();