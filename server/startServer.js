import * as alt from 'alt-server';

import { defaultParameters } from './config/serverconfig.js';
import { npcs } from './config/serverconfig.js';

import { RouteStorage } from './classes/RouteStorage.js';
import { PedManager } from './classes/PedManager.js';
import { Debug } from './classes/Debug.js';

import { PathCommands } from './commands/PathCommands.js';
import { PedCommands } from './commands/PedCommands.js';
import { CommandRegistry } from './commands/CommandRegistry.js';
import { CommandsUtilities } from './commands/CommandsUtilities.js'; 

class PatrolServer {
    constructor() {

        this.routeStorage = new RouteStorage('./resources/patrol/data/routePoints.json');
        this.pedManager = new PedManager(defaultParameters, npcs);
        this.debug = new Debug;

        this.commandRegistry = new CommandRegistry();
        this.commandsUtilities = new CommandsUtilities();

        this.pathCommands = new PathCommands(this.routeStorage, this.debug, this.commandsUtilities);
        this.pedCommands = new PedCommands(this.pedManager, this.routeStorage, this.commandsUtilities);
        this.#init();
    }

    #init(){
        alt.on('playerConnect', async (player) => {
            player.spawn(-1269.91, -1438.64, 4.46);
            player.rot = new alt.Vector3(0, 0, -2.5);
            await new Promise(resolve => alt.setTimeout(resolve, 500));
            
            //Проверка на случай если игрок заходит на сервер когда на сервере включен debug
            if (this.debug.isEnabled()) alt.emitClient(player, 'patrol:debugTurnOn');
        });

        alt.on('resourceStart', () => {
            this.commandRegistry.buildCommands(this.pathCommands);
            this.commandRegistry.buildCommands(this.pedCommands);

            this.commandRegistry.registerChatCommands();
            this.pedManager.spawnDefaultNpcs();
        });

        alt.onClient('patrol:sendRouteMap', (player, clientRoute) => {
            this.routeStorage.save(player, clientRoute);
        });
    }

}

new PatrolServer();