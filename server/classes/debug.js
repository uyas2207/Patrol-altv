// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

export class Debug {
    #debug;
    
    constructor() {
        this.#debug = false; //изначальное состояния debug при включении сервера
    }

    toggle(player) {
        if (!this.#debug) {
            this.#turnOn(player);
        } else {
            this.#turnOff(player);
        }
    }

    #turnOn(player) {
        alt.emitClient(player, 'patrol:debugTurnOn');
        this.#debug = true;
        chat.send(player, `Debug on`);
    }

    #turnOff(player) {
        alt.emitClient(player, 'patrol:debugTurnOff');
        this.#debug = false;
        chat.send(player, `Debug off`);
    }
    
    isEnabled() {
        return this.#debug;
    }
}