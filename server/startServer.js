// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';

import { RouteStorage } from './classes/routeStorage.js';
import { PedManager } from './classes/pedManager.js';
import { Debug } from './classes/debug.js';
import { PatrolCommands } from './commands/patrolCommands.js';

class PatrolServer {
    constructor() {

        this.routeStorage = new RouteStorage('./resources/patrol/data/routePoints.json');
        this.pedManager = new PedManager;
        this.debug = new Debug;
        this.patrolCommands = new PatrolCommands(this.pedManager, this.routeStorage, this.debug);

        this.init();
    }

    init(){
        alt.on('playerConnect', async (player) => {
            player.spawn(-1269.91, -1438.64, 4.46);
            player.rot = new alt.Vector3(0, 0, -2.5);
            await new Promise(resolve => alt.setTimeout(resolve, 500));
            
            //Проверка на случай если игрок заходит на сервер когда на сервере включен debug
            if (this.debug.isEnabled()) alt.emitClient(player, 'patrol:debugTurnOn');
        });

        alt.on('resourceStart', () => {
            this.pedManager.spawnDefaultNpcs();
            this.patrolCommands.registerCommands();
        });

        alt.onClient('patrol:sendRouteMap', (player, clientRoute) => {
            this.routeStorage.save(player, clientRoute);
        });
    }

}

new PatrolServer();