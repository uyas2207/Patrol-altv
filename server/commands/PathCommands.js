import * as alt from 'alt-server';
import * as chat from 'alt:chat';

export class PathCommands {
    constructor(routeStorage, debug, commandsUtilities) {
        this.routeStorage = routeStorage;
        this.debug = debug;
        this.commandsUtilities = commandsUtilities;
    }

    //создает новый маршрут в файле routePoints.json и передает его на клиент
    cmd_path_create_Command(player, arg){
        if (!this.commandsUtilities.checkArgumentsLength(player, arg, 1)) return;

        const name = String(arg); 
        this.routeStorage.create(player, name);
    }

    //очищает текущий маршрут на клиенте
    cmd_path_clear_Command(player){
        alt.emitClient(player, 'patrol:clearCurrentRoute');
        chat.send(player, `Текущий маршрут удален на клиенте`);
    }

    //запрашивает с клиента его текущий маршрут для сохранения в общий список в routePoints.json
    cmd_path_save_Command(player){
        alt.emitClient(player, 'patrol:askForRouteMap');
    }

    //передает на клиент маршрут с названием указанным в команде из routePoints.json
    cmd_path_load_Command(player, arg){
        if (!this.commandsUtilities.checkArgumentsLength(player, arg, 1)) return;

        const name = String(arg);
        this.routeStorage.load(player, name);
    }

    //удаляет из текщуего маршрута точку с указаным в команде номером
    cmd_path_deleteNode_Command(player, node_id){
        const node = (this.commandsUtilities.checkNode(player, node_id));   //node = node_id или false если введены некоректные данные для node_id
        //проверка !node не рабоатет, так как аргуменом может быть 0
        if (node === false){
            chat.send(player, `Использование deleteNode /deleteNode node_id`);
            return;
        }
        alt.emitClient(player, 'patrol:deleteNode', (node));
        chat.send(player, `/deleteNode ${node}`);
    }

    //добавляет в текущий маршрут точку на которой стоит игрок
    cmd_path_addNode_Command(player, node_id){
        const node = (this.commandsUtilities.checkNode(player, node_id));   //node = node_id или false если введены некоректные данные для node_id
        //проверка !node не рабоатет, так как аргуменом может быть 0
        if (node === false){
            chat.send(player, `Использование addnode /addnode node_id`);
            return
        }

        const { roundedPos, lookingPoint } = this.commandsUtilities.calculateNodeCoords(player);
          
        alt.emitClient(player, 'patrol:addNode', roundedPos, lookingPoint, node);
        chat.send(player, `/addnode ${node}`);
    }

    //отображает общий debug, все переданные на клиент маршруты и все области видимости ped
    cmd_path_debug_Command(player){
        this.debug.toggle(player);
    }

    //меняет текщуий маршрут на клиенте (для коректной работы addnode deleteNode т.к добавление и удаление нод происходит с текущим маршрутом)
    cmd_path_switch_Command(player, arg){
        if (!this.commandsUtilities.checkArgumentsLength(player, arg, 1)) return;

        const name = String(arg[0]);
        const routeId = this.routeStorage.checkRouteId(player, name);
        if (!routeId) return;

        alt.emitClient(player, 'patrol:switchCurrentRoute', routeId);
        chat.send(player, `Switched current route to ${name}`);
    }
}