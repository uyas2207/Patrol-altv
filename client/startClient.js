import * as alt from 'alt-client';

import { defaultClientConfig } from './config/clientConfig.js';

import { RouteManager } from './classes/routeManager.js';
import { PedManager } from './classes/pedManager.js';
import { DebugManager } from './classes/debugManager.js';
import { DebugVisuals } from './classes/debugVisuals.js';

class PatrolClient {
    constructor() {
        
        this.debugVisuals = new DebugVisuals(defaultClientConfig); //класс для визуального отображения debug

        this.routeManager = new RouteManager(defaultClientConfig);
        this.pedManager = new PedManager(this.routeManager, this.debugVisuals, defaultClientConfig);
        this.debugManager = new DebugManager(this.pedManager, this.routeManager, this.debugVisuals);
    
        this.routeManager.setPedManager(this.pedManager);

        this.init();
    }

    init(){

        //выводит всю информацию о ped
        alt.onServer('patrol:pedInfo', (arg) => {
            this.pedManager.pedInfoCommand(arg);
        });
        //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.currentRouteMap + currentRouteAttributes
        alt.onServer('patrol:route', () => {
            this.routeManager.printAllRoutesInfo();
        });
        //выводит всю информацию о ped из map mainPedMap (asignedRoute, isdebuged)
        alt.onServer('patrol:pedMap', () => {
            this.pedManager.pedMapCommand();
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
        });
        //отсанавливает ped (deletePatrolRoute) если ему назначен маршрут + отключает ped debug у маршрута и изменяет данные в pedmap (asignedRoute, isdebuged)
        alt.onServer('patrol:pedStop', (arg) => {
            alt.log(`ped ${arg} Stop`);
            this.pedManager.pedStop(arg);
        });
        //включает debug для конкретного ped (его область видимости и его маршрут если у него есть asignedRoute)
        alt.onServer('patrol:pedDebug', (arg) => {
            alt.log(`ped ${arg} Debug`);
            this.pedManager.pedDebug(arg);
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
            alt.log('routeID:', routeID);
            this.routeManager.switchCurrentRoute(routeID);
        });
        //назначить ped текущий маршрут 
        alt.onServer('patrol:asignCurrentRouteToPed', (arg, routeID) => {
            alt.log('arg', arg);
            this.pedManager.asignRouteToPed(arg, routeID);
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
        });
    }
}

new PatrolClient();