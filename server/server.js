// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';



class PatrolServer {
    constructor() {
        this.currentPed = null;
        this.init();
    }

    init(){
        alt.on('playerConnect', (player) => {
            player.spawn(-1269.91, -1438.64, 4.46);
            player.rot = new alt.Vector3(0, 0, -2.5);
            //chat.send(player, `Игрок ${player} зашел на сервер (PatrolServer)`);
            //alt.emitAllClients("npc:setup", this.currentPed.id);
            //alt.log(`npc:setup: ${JSON.stringify(this.currentPed, null, '\t')}`);
            //alt.log(`this.currentPed ${this.currentPed}`);
        });

        alt.on('resourceStart', this.spawnDefaultNpcs);

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
        npc.collision = false;      
        //native.setBlockingOfNonTemporaryEvents(npc.scriptID, true);
        // Заморозваем NPC на месте, чтобы он не двигался
        npc.frozen = true;
        this.currentPed = npc;
        alt.log(`npc:setup: {
    id: ${this.currentPed.id},
    model: ${this.currentPed.model},
    dimension: ${this.currentPed.dimension},
    invincible: ${this.currentPed.invincible},
    frozen: ${this.currentPed.frozen},
    collision: ${this.currentPed.collision},
    pos: ${JSON.stringify(this.currentPed.pos)}
}`);
        //alt.log(Object.getOwnPropertyNames(this.currentPed));
    }
    
    
}

new PatrolServer();

