import * as alt from 'alt-client';

import * as native from 'natives';

class PatrolClient {
    constructor() {
        this.currentPed = null;

        this.viewDistance = 3;     // длина конуса
        this.viewAngle = 40;         // угол обзора (градусы)
        this.viewSectors = 2;
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

    drawPedVisionCone(ped){
    const pos = ped.pos;
    const heading = native.getEntityHeading(ped.scriptID); // градусы
    
    // Конвертируем в радианы
    const headingRad = heading * (Math.PI / 180);
    const halfAngleRad = (this.viewAngle / 2) * (Math.PI / 180);
    const stepAngleRad = (this.viewAngle * (Math.PI / 180)) / this.viewSectors;

    let lastPoint = null;

    for (let i = -halfAngleRad; i <= halfAngleRad; i += stepAngleRad) {
        // Текущий угол луча конуса
        const currentAngle = headingRad + i;
        
        // Правильные формулы для GTA координат
        const forwardX = Math.sin(-currentAngle);
        const forwardY = Math.cos(-currentAngle);
        
        const x = pos.x + forwardX * this.viewDistance;
        const y = pos.y + forwardY * this.viewDistance;
        const z = pos.z;

        // линия от ped
        native.drawLine(
            pos.x, pos.y, pos.z + 0.1,
            x, y, z + 0.1,
            255, 255, 0, 180
        );
        
        // соединяем крайние точки
        if (lastPoint) {
            native.drawLine(
                lastPoint.x, lastPoint.y, lastPoint.z + 0.1,
                x, y, z + 0.1,
                255, 255, 0, 100
            );
        }

        lastPoint = { x, y, z };
        }

        native.drawLine(
        pos.x, pos.y, pos.z + 0.2,
        pos.x + Math.sin(-headingRad) * 3,
        pos.y + Math.cos(-headingRad) * 3,
        pos.z + 0.2,
        255, 0, 0, 255 // красная линия направления
        );
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
