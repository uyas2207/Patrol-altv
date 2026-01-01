import * as alt from 'alt-client';

import * as native from 'natives';

class PatrolClient {
    constructor() {
        this.currentPed = null;

        this.viewDistance = 4;     // длина конуса
        this.viewAngle = 80;         // угол обзора (градусы)
        this.viewSectors = 6;

        this.isPlayerInSight = false;
        

        this.init();
    }

    init(){
        
    alt.on('gameEntityCreate', async (entity) => {
        alt.log('gameEntityCreate');
        if(!(entity instanceof alt.Ped)) return;

        this.currentPed = entity;
        alt.log(`this.currentPed.scriptID: ${this.currentPed.scriptID}`);

        this.setPedClient(this.currentPed.scriptID);
        /*
        alt.log("=== ВСЁ О PED ===");
        for (let key in entity) {
            try {
                alt.log(`${key} = ${entity[key]}`);
            } catch (error) {
                // нужно что бы код продолжил выполняться после ошибки если она будет
            }
        }
        */
    });
    
        
        alt.everyTick(() => {
            if (!this.currentPed || !this.currentPed.valid) return;
            this.drawPedVisionCone(this.currentPed);
        });
        

            alt.onServer('patrol:startPedPatrol', () => {
                //alt.log(`Пришло с сервера patrol:startPedPatrol`);
                //this.createPatrolRouteFixed(this.currentPed);
            });

    }

drawPedVisionCone(ped) {
    const pos = ped.pos;
    const heading = native.getEntityHeading(ped.scriptID);
    const player = alt.Player.local; 
    let currentColor;
    
    if (this.isPlayerInSight) {
        currentColor = [255, 0, 0, 200];
    } 
    else {
        currentColor = [0, 255, 0, 200];
    }

    const headingRad = heading * Math.PI / 180;
    const halfAngleRad = (this.viewAngle / 2) * Math.PI / 180;
    const stepAngleRad = (this.viewAngle * Math.PI / 180) / this.viewSectors;

    let lastPoint = null;

    // Отрисовка конуса видимости
    for (let i = -halfAngleRad; i <= halfAngleRad; i += stepAngleRad) {
        const currentAngle = headingRad + i;

        const forwardX = Math.sin(-currentAngle);
        const forwardY = Math.cos(-currentAngle);

        const x = pos.x + forwardX * this.viewDistance;
        const y = pos.y + forwardY * this.viewDistance;
        const z = pos.z;

        native.drawLine(
            pos.x, pos.y, pos.z + 0.1,
            x, y, z + 0.1,
            currentColor[0], currentColor[1], currentColor[2], currentColor[3]
        );

        if (lastPoint) {
            native.drawLine(
                lastPoint.x, lastPoint.y, lastPoint.z + 0.1,
                x, y, z + 0.1,
                currentColor[0], currentColor[1], currentColor[2], currentColor[3]
            );
        }

        lastPoint = { x, y, z };
    }

    // проверяет только игрока
    if (player && player.valid) {
        if (this.isPlayerInVisionCone(ped, player, headingRad, halfAngleRad)) {
            // Отображаем маркер над игроком
            native.drawMarker(
                0,
                player.pos.x, player.pos.y, player.pos.z + 1.0,
                0, 0, 0,
                0, 0, 0,
                0.15, 0.15, 0.15,
                255, 0, 0, 200,
                false, true, 2, 0, 0, 0, false
            );

            if (!this.isPlayerInSight) {
                this.isPlayerInSight = true;
                alt.log('this.isPlayerInSight = true;');
            }
        }
        else {
            if (this.isPlayerInSight) {
                this.isPlayerInSight = false;
                alt.log('this.isPlayerInSight = false;');
            }
        }
    }

    // центральная линия направления взгляда (точка столкновения)
    if (this.isPlayerInSight) {
    native.drawLine(
        pos.x, pos.y, pos.z + 0.2,
        player.pos.x, player.pos.y, player.pos.z + 0.5,
        //pos.x + Math.sin(-headingRad) * this.viewDistance,
        //pos.y + Math.cos(-headingRad) * this.viewDistance,
        //pos.z + 0.2,
        currentColor[0], currentColor[1], currentColor[2], currentColor[3]
    );
    }
}

isPlayerInVisionCone(ped, player, headingRad, halfAngleRad) {
    const pedPos = ped.pos;
    const playerPos = player.pos;

    // Вектор от ped к игроку
    const toPlayerX = playerPos.x - pedPos.x;
    const toPlayerY = playerPos.y - pedPos.y;

    // Дистанция
    const distance = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    if (distance > this.viewDistance) return false;

    // Нормализованный вектор "вперёд" (ТОЧНО как в drawPedVisionCone)
    const forwardX = Math.sin(-headingRad);
    const forwardY = Math.cos(-headingRad);

    // Нормализованный вектор на игрока
    const len = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    const dirToPlayerX = toPlayerX / len;
    const dirToPlayerY = toPlayerY / len;

    // Скалярное произведение
    const dot = forwardX * dirToPlayerX + forwardY * dirToPlayerY;

    // Угол между forward и игроком
    const angleToPlayer = Math.acos(dot);

    return angleToPlayer <= halfAngleRad;
}


        async setPedClient(ped){
            alt.log(`setPedClient ${ped}`);
            await new Promise(resolve => alt.setTimeout(resolve, 500));
            //const ped = alt.Ped.getByID(npcID);
            //alt.log(`PatrolClient: ${ped}`);
            alt.log(`После таймера ${ped}`);
            //native.setEntityInvincible(ped, true);
            //native.setBlockingOfNonTemporaryEvents(ped, true);
            //this.testDrawPedVisionCone(this.currentPed);
            //this.createAndVerifyPatrol(this.currentPed);
            this.verifyRouteCreation(this.currentPed);
        }

async verifyRouteCreation(ped) {
    try {
        const routeName = "MISS_PATROL_8";
        
        // 1. Создаем маршрут
        native.openPatrolRoute(routeName);
        
        native.addPatrolRouteNode(
            0, 
            "WORLD_HUMAN_GUARD_STAND",
            -1266.87, -1443.204, 4.460, 
            0, 
            0, 
            0, 
            6520
        );

        native.addPatrolRouteNode(
            1, 
            "WORLD_HUMAN_GUARD_STAND",
            -1269.91, -1438.64, 4.46, 
            0, 
            0, 
            0, 
            7520
        );
/*
        native.addPatrolRouteNode(
            2, 
            "WORLD_HUMAN_GUARD_STAND",
            -128.4684, -979.0340, 26.2754, 
            0, 
            0, 
            0, 
            8520
        );
*/
        native.addPatrolRouteLink(0, 1);
        native.addPatrolRouteLink(1, 0);

        native.closePatrolRoute();
        native.createPatrolRoute();

        native.taskPatrol(ped, routeName, 0, false, false);

/*

            native.taskGoToCoordAnyMeans(
                ped.scriptID,
                -1278.54, -1438.66, 4.66,
                1.0,    // Скорость
                0,      // Таймаут
                false,  // Не использовать транспорт
                262144, // Флаги для пешехода
                5.0     // Радиус достижения
            );
*/

//await new Promise(resolve => alt.setTimeout(resolve, 10000));
//alt.log(`Proshlo 10 sec`);
 /*
        native.taskPatrol(
            ped,        //ped
            routeName,  //patrolRouteName
            0,          //alertState
            false,      //canChatToPeds
            false       //useHeadLookAt
        );
        
*/
    } catch (error) {
        alt.log(`Verify error: ${error}`);
    }
}



}
new PatrolClient();