import * as alt from 'alt-server';
import * as chat from 'alt:chat';

export class PedCommands {
    constructor(pedManager, routeStorage, commandsUtilities) {
        this.routeStorage = routeStorage;
        this.pedManager =  pedManager;
        this.commandsUtilities = commandsUtilities;
    }

    //отменяет ped маршрут для патруля у ped
    cmd_ped_stop_Command(player, arg){
        if (!this.commandsUtilities.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.isValidPedId(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId) return;
        
        alt.emitClient(player, 'patrol:pedStop', pedId);
        chat.send(player, `/ped stop ${pedId}`);

    }

    //начзначет ped маршрут
    cmd_ped_assign_Command(player, arg){
        if (!this.commandsUtilities.checkArgumentsLength(player, arg, 2)) return;

        const pedId = this.pedManager.isValidPedId(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId) return;

        const name = String(arg[1]);
        const routeId = this.routeStorage.checkRouteId(player, name);
        if (!routeId) return;

        alt.emitClient(player, 'patrol:assignCurrentRouteToPed', pedId, routeId);
        chat.send(player, `/ped assign ${pedId} ${name}`);
    }

    //отображает debug для конкретного ped, его облапсть видимости и маршрут который ему назначен если такой есть
    cmd_ped_debug_Command(player, arg){
        if (!this.commandsUtilities.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.isValidPedId(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId) return;

        alt.emitClient(player, 'patrol:pedDebug', pedId);
    }

}