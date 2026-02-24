// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

export class PatrolCommands {
    constructor(pedManager, routeStorage, debug) {

        this.routeStorage = routeStorage;
        this.pedManager =  pedManager;
        this.debug = debug;

        this.commands = {   //весь список команд
            path: {
                info: this.routeInfoCommand.bind(this),    //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.routePointsMap + currentRouteAttributes
                switch: this.switchCommand.bind(this),     //меняет текщуий маршрут на клиенте (для коректной работы addnode dellnode т.к добавление и удаление нод происходит с текущим маршрутом)

                debug: this.debugCommand.bind(this),       //отображает общий debug, все переданные на клиент маршруты и все области видимости ped
                addnode: this.addnodeCommand.bind(this),   //добавляет в текущий маршрут точку на которой стоит игрок
                dellnode: this.dellnodeCommand.bind(this), //удаляет из текщуего маршрута точку с указаным в команде номером
                clear: this.clearCommand.bind(this),       //очищает текущий маршрут на клиенте
                save: this.saveCommand.bind(this),         //запрашивает с клиента его текущий маршрут для сохранения в общий список в routePoints.json
                load: this.loadCommand.bind(this),         //передает на клиент маршрут с названием указанным в команде из routePoints.json
                create: this.createCommand.bind(this)      //создает новый маршрут в файле routePoints.json и передает его на клиент
            },
            ped: {
                info: this.pedinfoCommand.bind(this),      //выводит всю информацию о ped на клиенте (scriptID, netOwner, dimension, remoteID ...)
                map: this.pedmapCommand.bind(this),        //выводит всю информацию о ped из клиентской map mainPedMap (asignedRoute, isdebuged)

                asign: this.asignCommand.bind(this),       //начзначет ped маршрут
                debug: this.peddebugCommand.bind(this),    //отображает debug для конкретного ped, его облапсть видимости и маршрут который ему назначен если такой есть
                stop: this.stopCommand.bind(this)          //отменяет ped маршрут для патруля у ped
            }
        }

    }

    registerCommands(){
        chat.registerCmd('path', (player, args) => {
            this.executeCommand('path', player, args);
        });
        
        chat.registerCmd('ped', (player, args) => {
            this.executeCommand('ped', player, args);
        });
    }

    executeCommand(category, player, args) {
        if (args.length === 0) {
            alt.log('Вывод информации из help');
            this.showHelp(player, category);
            return;
        }
        
        const subCommand = args[0];
        const commandHandler = this.commands[category][subCommand];
        
        if (commandHandler) {
            commandHandler(player, args.slice(1));
        } else {
            chat.send(player, `Неизвестная команда: /${category} ${subCommand}`);
            alt.log('Вывод информации из help (else)');
            this.showHelp(player);
        }
    }

    showHelp(player, ){
        chat.send(player, 'Доступные команды:');
        
    }

    //создает новый маршрут в файле routePoints.json и передает его на клиент
    createCommand(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const name = String(arg); 
        this.routeStorage.create(player, name);
    }
    //очищает текущий маршрут на клиенте
    clearCommand(player){
        alt.emitClient(player, 'patrol:clearCurrentRoute');
        chat.send(player, `Текущий маршрут удален на клиенте`);
    }
    //запрашивает с клиента его текущий маршрут для сохранения в общий список в routePoints.json
    saveCommand(player){
        alt.emitClient(player, 'patrol:askForRouteMap');
        alt.log('save');
    }
    //передает на клиент маршрут с названием указанным в команде из routePoints.json
    loadCommand(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const name = String(arg);
        alt.log('name в loadcomande', name);
        this.routeStorage.load(player, name);
    }
    //удаляет из текщуего маршрута точку с указаным в команде номером
    dellnodeCommand(player, arg){
        const result = (this.checkNode(player, arg));   //result = node_id или false если введены некоректные данные для node_id
        //проверка !result не рабоатет, так как аргуменом может быть 0
        if (result === false){
            chat.send(player, `Использование dellnode /dellnode node_id`);
            return;
        }
        alt.emitClient(player, 'patrol:dellNode', (result));
        chat.send(player, `/dellNode ${result}`);
    }
    //добавляет в текущий маршрут точку на которой стоит игрок
    addnodeCommand(player, node_id){
        const result = (this.checkNode(player, node_id));   //result = node_id или false если введены некоректные данные для node_id
        //проверка !result не рабоатет, так как аргуменом может быть 0
        if (result === false){
            chat.send(player, `Использование addnode /addnode node_id`);
            return
        }
        //координаты ноды
        const roundedPos = {
            x: parseFloat(player.pos.x.toFixed(2)),
            y: parseFloat(player.pos.y.toFixed(2)),
            z: parseFloat(player.pos.z.toFixed(2))
        };
        //точка в 5 метрах по взгляду игрока (координаты на которые будет смотреть ped)
        const lookingPoint = {
            x: parseFloat((roundedPos.x - Math.sin(player.rot.z) * 5).toFixed(2)),
            y: parseFloat((roundedPos.y + Math.cos(player.rot.z) * 5).toFixed(2)),
            z: roundedPos.z
        }
        
        alt.emitClient(player, 'patrol:addNode', roundedPos, lookingPoint, result);
        chat.send(player, `/addnode ${result}`);
    }
    //отображает debug для конкретного ped, его облапсть видимости и маршрут который ему назначен если такой есть
    debugCommand(player){
        this.debug.toggle(player);
    }

    //отменяет ped маршрут для патруля у ped
    stopCommand(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
            alt.log('Некорректное значение pedId:', pedId);
            return;
        }
        alt.emitClient(player, 'patrol:pedStop', pedId);
        chat.send(player, `/ped stop ${pedId}`);

    }
    //начзначет ped маршрут
    asignCommand(player, arg){
        if (!this.checkArgumentsLength(player, arg, 2)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
            alt.log('Некорректное значение pedId:', pedId);
            return;
        }
        
        const name = String(arg[1]);
        const route = this.routeStorage.getRouteByName(name);
        if(!route){
            chat.send(player, `Не удалось найти route с параметром name = ${name}`);
            this.routeStorage.printRoutesToPlayer(player);
            return; 
        }
        alt.emitClient(player, 'patrol:asignCurrentRouteToPed', pedId, route.id);
        chat.send(player, `/ped asign ${pedId} ${name}`);
    }
    //меняет текщуий маршрут на клиенте (для коректной работы addnode dellnode т.к добавление и удаление нод происходит с текущим маршрутом)
    switchCommand(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const name = String(arg[0]);
        const route = this.routeStorage.getRouteByName(name);
        if(!route){
            chat.send(player, `Не удалось найти route с параметром name = ${name}`);
            this.routeStorage.printRoutesToPlayer(player);
            return; 
        }
        alt.emitClient(player, 'patrol:switchCurrentRoute', route.id);
        chat.send(player, `Switched current route to ${name}`);
    }
    //отображает debug для конкретного ped, его облапсть видимости и маршрут который ему назначен если такой есть
    peddebugCommand(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
            alt.log('Некорректное значение pedId:', pedId);
            return;
        }
        alt.emitClient(player, 'patrol:pedDebug', pedId);
    }
    //выводит всю информацию о ped на клиенте (scriptID, netOwner, dimension, remoteID ...)
    pedinfoCommand(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
            alt.log('Некорректное значение pedId:', pedId);
            return;
        }

        alt.log('pedId = ', pedId);
        alt.emitClient(player, 'patrol:pedinfo', pedId);
        chat.send(player, `/ped info ${pedId}`);
    }
    //выводит всю информацию о ped из клиентской map mainPedMap (asignedRoute, isdebuged)
    pedmapCommand(player){
        alt.emitClient(player, 'patrol:pedMap');
    }
    //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.routePointsMap + currentRouteAttributes
    routeInfoCommand(player){
     //   alt.log('arg = ', arg);
        alt.emitClient(player, 'patrol:route');
    }

    //универсальная проверка аргумента в командах, аругмент может быть только целым числом от 0 до 9
    //при провале возвращает false, при успехе значение корректного аргумента(parseInt(arg[0]))
    checkNode(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return false;

        const parsedArg = parseInt(arg[0]);
        if (isNaN(parsedArg) || arg[0].length !== 1 || parsedArg < 0 || parsedArg > 9){
            chat.send(player, 'Неправильный аругмент, аргументом может быть только целое число от 0 до 9');
            return false;
        }
        alt.log('parsedArg =', parsedArg)
        return parsedArg;
    }
    
    checkArgumentsLength(player, arg, expectedLength){
        if(arg.length !== expectedLength){
            chat.send(player, `Некорректное количество аргументов, требуется аргументов: ${expectedLength}`);
            return false;
        }
        return true;
    }
}