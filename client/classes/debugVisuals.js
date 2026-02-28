import * as native from 'natives';

export class DebugVisuals{
    constructor(defaultClientConfig) {
        this.viewDistance = defaultClientConfig.viewDistance;      // длина конуса
        this.viewAngle = defaultClientConfig.viewAngle;            // угол обзора (градусы)
        this.viewSectors = defaultClientConfig.viewSectors;        //количество секторов видимости у ped

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
                coneColor.r, coneColor.g, coneColor.b, coneColor.a,
                true, true, 2, 0, 0, 0, false
            );
            native.drawLine(
                pedPos.x, pedPos.y, pedPos.z + 0.1,
                playerpos.x, playerpos.y, playerpos.z + 0.5,
                coneColor.r, coneColor.g, coneColor.b, coneColor.a
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

    //логика для определения находится ли игрок в области видимости ped
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