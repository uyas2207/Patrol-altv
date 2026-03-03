// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

export class PedManager {
    constructor(defaultParameters, npcs){
        this.defaultParameters = defaultParameters;
        this.npcs = npcs;

        alt.log('defaultParameters:', this.defaultParameters);
        alt.log('npcs', this.npcs.length);
    }
    
    spawnDefaultNpcs = () =>{
        this.npcs.forEach(npc => {
            const ped = new alt.Ped( npc.model, new alt.Vector3(npc.position.x, npc.position.y, npc.position.z), new alt.Vector3(npc.rotation.x, npc.rotation.y, npc.rotation.z));
            ped.dimension = this.defaultParameters.dimension;
            ped.invincible = this.defaultParameters.invincible;
            //ped.collision = defaultParameters.collision;  //что бы ped не сталкивались друг с другом (и не сбивали друг другу маршруты) если у них маршруты пересекаются 
        });
        
    }
    //проверка что PedID из команды входит в npcs.length
    checkNpcs(player, arg){
        const pedId = parseInt(arg[0]);
        if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > this.npcs.length){
            chat.send(player, `Аругментом может быть только целое число от 1 до ${this.npcs.length}`);
            return false;
        }
        else{
            return pedId;
        }
    }
}