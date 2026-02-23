import * as alt from 'alt-client';

export class DebugManager {
    constructor(pedManager, routeManager, debugVisuals) {
        this.pedManager = pedManager;
        this.routeManager = routeManager;
        this.debugVisuals = debugVisuals;
        this.debug = null;  // хранит everytick для общего debug
    }

    turnOnGlobalDebug() {
        this.debug = alt.everyTick(() => {
            this.drawAllPedVisionCones();
            this.drawAllMarkers();
            this.connectAllRoutesLine();
        });
        alt.log(`debugTurnOn`);
    }

    turnOffGlobalDebug() {
        alt.clearEveryTick(this.debug);
        this.debug = null;
        alt.log(`debugTurnOff`);
    }

    drawAllMarkers() {
        this.routeManager.mainMap.forEach(({ nodes, attributes }) => {
            if(attributes.isdebuged === false){
                this.debugVisuals.drawRouteMarkers(nodes);
            }
        });
    }

    drawAllPedVisionCones() {
        this.pedManager.getAllPeds().forEach((value) => {
            if(value.isdebuged === false){
                this.debugVisuals.drawPedVisionCone(
                    value.entity.pos, 
                    value.entity.scriptID, 
                    alt.Player.local.pos
                );
            }
        });
    }

    connectAllRoutesLine() {
        this.routeManager.mainMap.forEach(({ nodes, attributes }) => {
            if(attributes.isdebuged === false){
                this.debugVisuals.connectNodesLine(nodes, attributes);
            }
        });
    }
}