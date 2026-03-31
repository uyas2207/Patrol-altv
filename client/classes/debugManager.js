import * as alt from 'alt-client';

export class DebugManager {
    constructor(pedStorage, routeStorage, debugVisuals, notificationManager) {
        this.pedStorage = pedStorage;
        this.routeStorage = routeStorage;
        this.debugVisuals = debugVisuals;
        this.debug = null;  // хранит everytick для глобального debug
        this.singleDebug = new Map(); // хранит everytick для визуального отображения у конкретных ped
        this.notificationManager = notificationManager;
    }
    
    pedDebug(PedID){
        const ped = this.pedStorage.getPed(PedID);

        if (!ped) {
            this.notificationManager.drawNotification(`Ped=${PedID} не найден`);
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
        const ped = this.pedStorage.getPed(PedID);

        if( ped.assignedRoute !== null ){
            this.routeStorage.setRouteDebugStatus(ped.assignedRoute, true);
        }

        this.pedStorage.setPedIsdebugedStatus(ped.entity.id, true);

        const timerID = alt.everyTick(() => {
            this.debugVisuals.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt.Player.local.pos);

            if(ped.assignedRoute !== null){
                const data = this.routeStorage.getRoute(ped.assignedRoute);
                this.debugVisuals.connectNodesLine(data.nodes, data.attributes);
                this.debugVisuals.drawRouteMarkers(data.nodes);
            }
        });
        this.singleDebug.set(ped.entity.id, timerID);
    }

    #pedDebugTurnOff(PedID){
        const ped = this.pedStorage.getPed(PedID);

        const timerId = this.singleDebug.get(ped.entity.id);
        alt.clearEveryTick(timerId);
        this.singleDebug.delete(ped.entity.id);

        this.pedStorage.setPedIsdebugedStatus(ped.entity.id, false);

        if( ped.assignedRoute !== null ){
            this.routeStorage.setRouteDebugStatus(ped.assignedRoute, false);
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
        this.routeStorage.forEachRoute((attributes, nodes) => {
            if (attributes.isdebuged === false) {
                this.debugVisuals.drawRouteMarkers(nodes);
            }
        });
    }

    #drawAllPedVisionCones() {
        this.pedStorage.forEachPed((ped) => {
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
        this.routeStorage.forEachRoute((attributes, nodes) => {
            if (attributes.isdebuged === false) {
                this.debugVisuals.connectNodesLine(nodes, attributes);
            }
        });
    }
}