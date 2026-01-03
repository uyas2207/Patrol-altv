// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

//для работы с файлами
import * as fs from 'fs';       
//для работы с путями файлов
import * as path from 'path';

class PatrolServer {
    constructor() {
        this.currentPed = null;
        this.routePointsMap = new Map();
        
        this.currentPatrolIndex = 0;
        this.isPatrolling = false;

        this.debug = true;

        this.configData = fs.readFileSync('./resources/patrol/shared/routePoints.json', 'utf8');
        this.routeData = JSON.parse(this.configData);

        this.init();
    }

    init(){
        alt.on('playerConnect', async (player) => {
            player.spawn(-1269.91, -1438.64, 4.46);
            player.rot = new alt.Vector3(0, 0, -2.5);
            //Проверка на случай если игрок заходит на сервер когда на сервере включен debug
            if (this.debug) alt.emitClient(player, 'patrol:debugTurnOn');
            alt.emitClient(player, 'patrol:initRoutes', this.routeData);


            //chat.send(player, `Игрок ${player} зашел на сервер (PatrolServer)`);
            //alt.emitAllClients("npc:setup", this.currentPed.id);
            //alt.log(`npc:setup: ${JSON.stringify(this.currentPed, null, '\t')}`);
            //alt.log(`this.currentPed ${this.currentPed}`);
            //this.currentPed.setStreamSyncedMeta("giveWanderTask", true);


            await new Promise(resolve => alt.setTimeout(resolve, 500));
            alt.emitClient(player, 'patrol:startPedPatrol');
        });

        alt.on('resourceStart', () => {
            this.spawnDefaultNpcs();
            
            alt.setTimeout(() => {
/*
                this.routeData.routes.forEach(route => {
                    route.nodes.forEach(node => {
                        alt.log(node);
                    });
                });
*/
            }, 1000);
        });

        chat.registerCmd('path', (player) => {
            chat.send(player, `Текущая позиция: ${player.pos}`);
            chat.send(player, `Текущая rotation: ${player.rot}`);
            alt.log(`player.rot: ${player.rot}`);
            // player.rot
        });
        
        chat.registerCmd('debug', (player) => {
            if(!this.debug){
                this.debug = true;
                alt.emitClient(player, 'patrol:debugTurnOn');
                chat.send(player, `Debug on`);
            }
            else{
                this.debug = false;
                alt.emitClient(player, 'patrol:debugTurnOff');
                chat.send(player, `Debug off`);
            }
        });

        chat.registerCmd('asign', (player) => {
            alt.emitClient(player, 'patrol:asignCurrentRouteToPed');
            chat.send(player, `Asigned route to ped`);
        });

        
    }


    
    spawnDefaultNpcs = () =>{
        // Охранник у банка
        
        //const rotZ = 0.69 * (180 / Math.PI); // преобразование в градусы
        const npc = new alt.Ped(
            "s_m_m_chemsec_01", // Модель
            new alt.Vector3(-1266.87, -1443.204, 4.460),   // Позиция (alt.Vector3)
            new alt.Vector3(0, 0, 0.69) // Поворот
        );

        // Устанавливаем измерение
        npc.dimension = 0;
        
        // Делаем NPC инвульнеральным (неуязвимым)
        npc.invincible = true;
        //npc.collision = false;      
        //native.setBlockingOfNonTemporaryEvents(npc.scriptID, true);
        // Заморозваем NPC на месте, чтобы он не двигался
        //npc.frozen = true;
        this.currentPed = npc;
        
        alt.log(`npc:setup: {
            id: ${this.currentPed.id},
            model: ${this.currentPed.model},
            dimension: ${this.currentPed.dimension},
            scriptID: ${this.currentPed.scriptID},
            invincible: ${this.currentPed.invincible},
            frozen: ${this.currentPed.frozen},
            collision: ${this.currentPed.collision},
            pos: ${JSON.stringify(this.currentPed.pos)}
        }`);
        
        //alt.log(Object.getOwnPropertyNames(this.currentPed));

    }

    
}

new PatrolServer();

