import * as alt from 'alt-client';

import { defaultClientConfig } from './config/clientConfig.js';


import { DebugManager } from './classes/debugManager.js';
import { DebugVisuals } from './classes/debugVisuals.js';

import { PatrolExecutor } from './classes/patrolExecutor.js';

import { RouteManager } from './classes/Routes/routeManager.js';
import { RouteStorage } from './classes/Routes/routeStorage.js';

import { PedStorage } from './classes/Peds/pedStorage.js';
import { PedManager } from './classes/Peds/pedManager.js';

class PatrolClient {
    constructor() {
        this.routeStorage = new RouteStorage();
        
        this.pedStorage = new PedStorage();

        
        this.patrolExecutor = new PatrolExecutor(defaultClientConfig);

        this.debugVisuals = new DebugVisuals(defaultClientConfig); //класс для визуального отображения debug

        //this.routeManager = new RouteManager(defaultClientConfig);
        
        this.pedManager = new PedManager(this.pedStorage, this.routeStorage, this.patrolExecutor, defaultClientConfig);
        

        this.routeManager = new RouteManager(this.routeStorage, this.pedStorage, defaultClientConfig);
        

        this.debugManager = new DebugManager(this.pedStorage, this.routeStorage, this.debugVisuals);
    
        //this.routeManager.setPedManager(this.pedManager);
        this.#init();
    }

    #init(){
        //выводит всю информацию о ped
        alt.onServer('patrol:pedInfo', (arg) => {
            this.pedManager.pedInfoCommand(arg);
        });
        //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.currentRouteMap + currentRouteAttributes
        alt.onServer('patrol:route', () => {
            this.routeManager.printAllRoutesInfo();
        });
        //выводит всю информацию о ped из map pedDataMap (assignedRoute, isdebuged)
        alt.onServer('patrol:pedMap', () => {
            this.pedManager.pedMapCommand();
        });
        //при появлении ped в стрим зоне игрока (если не ped return)
        alt.on('gameEntityCreate', (entity) => {
            if(!(entity instanceof alt.Ped)) return;

            if(this.pedStorage.hasPed(entity.id)){
                //изменяет данные о ped, так как при вылете из стрим зоны и повторном влете у ped меняется большая часть данных и нужно перезаписать старые неактуальные данные о ped
                this.pedManager.reassignRouteAfterStreaming(entity);
            }
            else{
                //при первом появлении ped на клиенте
                this.pedStorage.addPed(entity);
            }
        });

        //получает route с сервера и добавляет его в mainMap, если такой route еще не добавлен
        alt.onServer('patrol:initRoutes', (route) => {
            this.routeStorage.addRoute(route);

            this.routeManager.switchCurrentRoute(route.id);
        });
        //отсанавливает ped (deletePatrolRoute) если ему назначен маршрут + отключает ped debug у маршрута и изменяет данные в pedmap (assignedRoute, isdebuged)
        alt.onServer('patrol:pedStop', (arg) => {
            this.pedManager.pedStop(arg);
        });
        //включает debug для конкретного ped (его область видимости и его маршрут если у него есть assignedRoute)
        alt.onServer('patrol:pedDebug', (arg) => {
            
            this.debugManager.pedDebug(arg);
        });

        //отображать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOn', () => {
            this.debugManager.turnOnGlobalDebug();
        });
        
        //выключать debug, после команды с сервера
        alt.onServer('patrol:debugTurnOff', () => {
            this.debugManager.turnOffGlobalDebug();
        });
        //сменить текущий route (route к которому добавляются и удаляются nodes)
        alt.onServer('patrol:switchCurrentRoute', (routeID) => {
            this.routeManager.switchCurrentRoute(routeID);
        });
        //назначить ped текущий маршрут 
        alt.onServer('patrol:assignCurrentRouteToPed', (pedId, routeID) => {
            this.pedManager.assignRoute(pedId, routeID);
        });
        //добавить ноду к текущему маршруту
        alt.onServer('patrol:addNode', (coords, lookingCoords, node) => {
            this.routeManager.addNode(coords, lookingCoords, node);
        });
        //удалить ноду из текущего маршрута
        alt.onServer('patrol:dellNode', (arg) => {
            this.routeManager.deleteNode(arg);
        });
        //отправляет на сервер текущий маршрут для сохранения его в общий список маршрутов в routePoints.json
        alt.onServer('patrol:askForRouteMap', () => {
            this.routeManager.sendRouteMap();
        });
        //очищает текущий маршрут и удаляет его из mainMap
        alt.onServer('patrol:clearCurrentRoute', () => {
            this.routeManager.clearCurrentRoute();
        });
    }
}

new PatrolClient();