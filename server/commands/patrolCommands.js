// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

export class PatrolCommands {
    constructor(pedManager, routeStorage, debug) {

        this.routeStorage = routeStorage;
        this.pedManager =  pedManager;
        this.debug = debug;
        this.commands = {};

        this.buildCommands();
    }

    buildCommands(){
        const prefix = 'cmd_';
        //запоминает все названия методов класса (берет их из прототипа класса)
        Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        //ищет все методы котрые начинаются с нужного префикса
        .filter(name => name.startsWith(prefix))
        .forEach(name => {
            //разделяет все найденные name на category и subCommand (работает только если они разделены _)
            const [category, subCommand] = name.slice(prefix.length).split('_');
            if (!category || !subCommand) return;
            //если это первый раз когда встречается такая категория создает такую категорию
            if (!this.commands[category]) {
                this.commands[category] = {};
            }
            //добавляет необходимую команду
            this.commands[category][subCommand] = this[name].bind(this);
        });
    }

    
    registerCommands(){    
        Object.keys(this.commands).forEach(category => {
            chat.registerCmd(category, (player, args) => {
                this.executeCommand(category, player, args);
            });
        });
    }

    executeCommand(category, player, args) {
        if (args.length === 0) {
            this.showHelp(player, category);
            return;
        }
        
        const subCommand = args[0];
        const commandHandler = this.commands[category][subCommand];
        
        if (commandHandler) {
            commandHandler(player, args.slice(1));
        } else {
            chat.send(player, `Неизвестная команда: /${category} ${subCommand}`);
            this.showHelp(player, category);
        }
    }

    showHelp(player, category){
        chat.send(player, 'Доступные команды:');
        Object.keys(this.commands[category]).forEach(command => {
            chat.send(player, `/${category} ${command}`);
        });
    }

    //создает новый маршрут в файле routePoints.json и передает его на клиент
    cmd_path_create_Command(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

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
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const name = String(arg);
        this.routeStorage.load(player, name);
    }
    //удаляет из текщуего маршрута точку с указаным в команде номером
    cmd_path_deleteNode_Command(player, node_id){
        const result = (this.checkNode(player, node_id));   //result = node_id или false если введены некоректные данные для node_id
        //проверка !result не рабоатет, так как аргуменом может быть 0
        if (result === false){
            chat.send(player, `Использование dellnode /dellnode node_id`);
            return;
        }
        alt.emitClient(player, 'patrol:dellNode', (result));
        chat.send(player, `/dellNode ${result}`);
    }
    //добавляет в текущий маршрут точку на которой стоит игрок
    cmd_path_addNode_Command(player, node_id){
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
    //отображает общий debug, все переданные на клиент маршруты и все области видимости ped
    cmd_path_debug_Command(player){
        this.debug.toggle(player);
    }

    //отменяет ped маршрут для патруля у ped
    cmd_ped_stop_Command(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
            return;
        }
        alt.emitClient(player, 'patrol:pedStop', pedId);
        chat.send(player, `/ped stop ${pedId}`);

    }
    //начзначет ped маршрут
    cmd_ped_asign_Command(player, arg){
        if (!this.checkArgumentsLength(player, arg, 2)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
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
    cmd_path_switch_Command(player, arg){
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
    cmd_ped_debug_Command(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
            return;
        }
        alt.emitClient(player, 'patrol:pedDebug', pedId);
    }
    //выводит всю информацию о ped на клиенте (scriptID, netOwner, dimension, remoteID ...)
    cmd_ped_info_Command(player, arg){
        if (!this.checkArgumentsLength(player, arg, 1)) return;

        const pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
        if (!pedId){
            return;
        }

        alt.emitClient(player, 'patrol:pedInfo', pedId);
        chat.send(player, `/ped info ${pedId}`);
    }
    //выводит всю информацию о ped из клиентской map mainPedMap (asignedRoute, isdebuged)
    cmd_ped_map_Command(player){
        alt.emitClient(player, 'patrol:pedMap');
    }
    //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.routePointsMap + currentRouteAttributes
    cmd_path_info_Command(player){
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