import * as alt from 'alt-client';

import {drawNotification} from '@utilities';

export class DebugManager {
    constructor(pedManager, routeManager, debugVisuals) {
        this.pedManager = pedManager;
        this.routeManager = routeManager;
        this.debugVisuals = debugVisuals;
        this.debug = null;  // хранит everytick для глобального debug
        this.singleDebug = new Map(); // хранит everytick для визуального отображения у конкретных ped
    }
    
    pedDebug(PedID){
        const ped = this.pedManager.getPed(PedID);

        if (!ped) {
            drawNotification(`Ped=${PedID} не найден`);
            return;
        }

        if (ped.isdebuged === false){
            this.#pedDebugTurnOn(PedID);
        }
        else{
            this.#pedDebugTurnOff(PedID);
        }
    }
    
    #pedDebugTurnOn(PedID){
        const ped = this.pedManager.getPed(PedID);

        if( ped.asignedRoute !== null ){
            this.routeManager.changeRouteIsdebugedStatus(ped.asignedRoute, true);
        }

        this.pedManager.changePedIsdebugedStatus(ped.entity.id, true);

        const timerID = alt.everyTick(() => {
            this.debugVisuals.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt.Player.local.pos);

            if(ped.asignedRoute !== null){
                const data = this.routeManager.getRoute(ped.asignedRoute);
                this.debugVisuals.connectNodesLine(data.nodes, data.attributes);
                this.debugVisuals.drawRouteMarkers(data.nodes);
            }
        });
        this.singleDebug.set(ped.entity.id, timerID);
    }

    #pedDebugTurnOff(PedID){
        const ped = this.pedManager.getPed(PedID);

        const timerId = this.singleDebug.get(ped.entity.id);
        alt.clearEveryTick(timerId);
        this.singleDebug.delete(ped.entity.id);

        this.pedManager.changePedIsdebugedStatus(ped.entity.id, false);

        if( ped.asignedRoute !== null ){
            this.routeManager.changeRouteIsdebugedStatus(ped.asignedRoute, false);
        }
    }
    
    turnOnGlobalDebug() {
        this.debug = alt.everyTick(() => {
            this.#drawAllPedVisionCones();
            this.#drawAllMarkers();
            this.#connectAllRoutesLine();
        });
    }

    turnOffGlobalDebug() {
        alt.clearEveryTick(this.debug);
        this.debug = null;
    }

    #drawAllMarkers() {
        this.routeManager.forEachRoute((attributes, nodes) => {
            if (attributes.isdebuged === false) {
                this.debugVisuals.drawRouteMarkers(nodes);
            }
        });
    }

    #drawAllPedVisionCones() {
        this.pedManager.forEachPed((ped) => {
            if (ped.isdebuged === false) {
                this.debugVisuals.drawPedVisionCone(
                    ped.entity.pos,
                    ped.entity.scriptID,
                    alt.Player.local.pos
                );
            }
        });
    }

    #connectAllRoutesLine() {
        this.routeManager.forEachRoute((attributes, nodes) => {
            if (attributes.isdebuged === false) {
                this.debugVisuals.connectNodesLine(nodes, attributes);
            }
        });
    }
}