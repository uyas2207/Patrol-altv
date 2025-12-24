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
            } catch (e) {
                // нужно что бы код продолжил выполняться после ошибки если она будет
            }
        }
        */
    });
    
        
        alt.everyTick(() => {
            if (!this.currentPed || !this.currentPed.valid) return;
            //this.drawTestLine(this.currentPed);
            this.drawPedVisionCone(this.currentPed);
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

    // Отрисовка конуса видимости (без изменений)
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

    // Проверяем только локального игрока вместо всех игроков
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

    // Центральная линия направления взгляда
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




    drawTestLine(ped){
        const pos = ped.pos;
        const heading = native.getEntityHeading(ped.scriptID);
    
        const headingRad = heading * (Math.PI / 180);
    
        // Рассчитываем конечную точку на основе направления
        const distance = 2; // Длина линии
        const endX = pos.x + Math.sin(-headingRad) * distance;
        const endY = pos.y + Math.cos(-headingRad) * distance;
        const endZ = pos.z;

        native.drawLine(
            pos.x, pos.y, pos.z,
            endX, endY, endZ,
            255, 255, 0, 180 // жёлтый
        );
    }


    // РИСОВАНИЕ КОНУСА ОБЗОРА
    testDrawPedVisionCone(ped) {

        const pos = ped.pos;
        alt.log(`ped.pos: ${ped.pos}`);
        const headingRad= native.getEntityHeading(ped.scriptID); // градусы
        alt.log(`heading: ${heading}`);
        const halfAngle = this.viewAngle / 2;
        alt.log(`halfAngle: ${halfAngle}`);
        const steps = 12; // чем больше — тем плавнее конус

        let lastPoint = null;

        for (let i = -halfAngle; i <= halfAngle; i += this.viewAngle / steps) {
            alt.log(`шаг i =: ${i}`);
            const angle = (headingRad+ i) * (Math.PI / 180);
            alt.log(`angle: ${angle}`);
            let cos = Math.cos(angle);
            alt.log(`cos: ${cos}`);
            let sin = Math.sin(angle);
            alt.log(`sin: ${sin}`);
            alt.log(`x = pos.x + Math.cos(angle) * this.viewDistance =  ${pos.x} + ${cos} * ${this.viewDistance}`);
            const x = pos.x + Math.cos(angle) * this.viewDistance;
            //alt.log(`x: ${x}`);
            alt.log(`y = pos.y + Math.sin(angle) * this.viewDistance = ${pos.y} + ${sin} * ${this.viewDistance}`)
            const y = pos.y + Math.sin(angle) * this.viewDistance;
            //alt.log(`y: ${y}`);
            const z = pos.z;
            //alt.log(`z: ${z}`);
            // линия от ped
            native.drawLine(
                pos.x, pos.y, pos.z + 0.1,
                x, y, z + 0.1,
                255, 255, 0, 180 // жёлтый
            );
            alt.log(`pos.x: ${pos.x}  pos.y: ${pos.y}  pos.z: ${z}  x: ${x}  y: ${y}  z: ${z}`);
            // соединяем крайние точки (заливка)
            if (lastPoint) {
                alt.log(`lastPoint.x: ${lastPoint.x}  lastPoint.y: ${lastPoint.y}  lastPoint.z: ${lastPoint.z}`);
                native.drawLine(
                    lastPoint.x, lastPoint.y, lastPoint.z + 0.1,
                    x, y, z + 0.1,
                    255, 255, 0, 100
                );
            }

            lastPoint = { x, y, z };
            //alt.log(`lastPoint: ${lastPoint}`);
        }
    }

        async setPedClient(ped){
            alt.log(`setPedClient ${ped}`);
            await new Promise(resolve => alt.setTimeout(resolve, 500));
            //const ped = alt.Ped.getByID(npcID);
            //alt.log(`PatrolClient: ${ped}`);
            alt.log(`После таймера ${ped}`);
            native.setEntityInvincible(ped, true);
            native.setBlockingOfNonTemporaryEvents(ped, true);
            //this.testDrawPedVisionCone(this.currentPed);
        }

}
new PatrolClient();