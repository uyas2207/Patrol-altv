// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

import { defaultParameters } from '../config/serverconfig.js';
import { npcs } from '../config/serverconfig.js';

export class PedManager {
    constructor(){
        alt.log('defaultParameters:',defaultParameters);
        alt.log('npcs', npcs.length);
    }
    
    spawnDefaultNpcs = () =>{
        npcs.forEach(npc => {
            const ped = new alt.Ped( npc.model, new alt.Vector3(npc.position.x, npc.position.y, npc.position.z), new alt.Vector3(npc.rotation.x, npc.rotation.y, npc.rotation.z));
            ped.dimension = defaultParameters.dimension;
            ped.invincible = defaultParameters.invincible;
            //ped.collision = defaultParameters.collision;  //что бы ped не сталкивались друг с другом (и не сбивали друг другу маршруты) если у них маршруты пересекаются 
        });
        
    }
    //проверка что PedID из команды входит в npcs.length
    checkNpcs(player, arg){
        const pedId = parseInt(arg[0]);
        if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
            chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
            return false;
        }
        else{
            return pedId;
        }
    }
}