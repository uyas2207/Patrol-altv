import * as alt from 'alt-client';

export class PedDebugManager {
    constructor(debugVisuals, pedManager, routeManager) {
        this.pedManager = pedManager;
        this.routeManager = routeManager;
        this.debugVisuals = debugVisuals;
        this.singleDebug = new Map(); // хранит everytick для визуального отображения у конкретных ped
    }

    pedDebug(PedID){
        const ped = this.pedManager.getPed(PedID);

        if (!ped) {
            drawNotification(`Ped=${PedID} не найден`);
            return;
        }

        if (ped.isdebuged === false){
            this.pedDebugTurnOn(PedID);
        }
        else{
            this.pedDebugTurnOff(PedID);
        }
    }

    pedDebugTurnOn(PedID){
        const ped = this.pedManager.getPed(PedID);

        if( ped.asignedRoute !== null ){
            this.routeManager.changeRouteIsdebugedStatus(ped.asignedRoute, true);
            alt.log('route.isdebuged = true, не будет повторяться в общем debug');
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
        alt.log('this.singleDebug', this.singleDebug);
    }

    pedDebugTurnOff(PedID){
        const ped = this.pedManager.getPed(PedID);

        const timerId = this.singleDebug.get(ped.entity.id);
        alt.clearEveryTick(timerId);
        this.singleDebug.delete(ped.entity.id);
        alt.log('this.singleDebug', this.singleDebug);

        this.pedManager.changePedIsdebugedStatus(ped.entity.id, false);

        if( ped.asignedRoute !== null ){
            this.routeManager.changeRouteIsdebugedStatus(ped.asignedRoute, false);
            alt.log('route.isdebuged = false => будет повторяться в общем debug');
        }
        
        alt.log(`pedDebugTurnOff`);
    }


}