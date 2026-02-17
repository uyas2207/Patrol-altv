// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

//для работы с файлами
import * as fs from 'fs';

import { defaultParameters } from './config/serverconfig.js';
import { npcs } from './config/serverconfig.js';

class PatrolServer {
    constructor() {
        alt.log('defaultParameters:',defaultParameters);
        alt.log('npcs', npcs.length);

        this.debug = false; //изначальное состояния debug при включении сервера

        //this.configData = fs.readFileSync('./resources/patrol/shared/routePoints.json', 'utf8');    //существующие маршруты патруля
        this.routeData = JSON.parse(fs.readFileSync('./resources/patrol/shared/routePoints.json', 'utf8')); //существующие маршруты патруля

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

        this.init();
    }

    init(){
        alt.on('playerConnect', async (player) => {
            player.spawn(-1269.91, -1438.64, 4.46);
            player.rot = new alt.Vector3(0, 0, -2.5);
            await new Promise(resolve => alt.setTimeout(resolve, 500));
            
            //Проверка на случай если игрок заходит на сервер когда на сервере включен debug
            if (this.debug) alt.emitClient(player, 'patrol:debugTurnOn');

            //await new Promise(resolve => alt.setTimeout(resolve, 500));
        });

        alt.on('resourceStart', () => {
            this.spawnDefaultNpcs();
        });

        chat.registerCmd('path', (player, args) => {
            this.executeCommand('path', player, args);
        });
        
        chat.registerCmd('ped', (player, args) => {
            this.executeCommand('ped', player, args);
        });

        alt.onClient('patrol:sendRouteMap', (player, clientRoute) => {
            this.sendRouteMap(player, clientRoute);
        });
    }

    executeCommand(category, player, args) {
        if (args.length === 0) {
          alt.log('Вывод информации из help');
            //  this.showHelp(player, category);
            return;
        }
        
        const subCommand = args[0];
        const commandHandler = this.commands[category][subCommand];
        
        if (commandHandler) {
            commandHandler(player, args.slice(1));
        } else {
            chat.send(player, `Неизвестная команда: /${category} ${subCommand}`);
            alt.log('Вывод информации из help (else)');
            //this.showHelp(player, category);
        }
    }

    sendRouteMap(player, clientRoute){
        
        //alt.log(clientRoute);
        //alt.log(JSON.stringify(clientRoute));
        
        //const doesRouteExist = this.routeData.routes.find(route => route.name === clientRoute.name);
        
        const routeIndex = this.routeData.routes.findIndex(route => route.name === clientRoute.name);
        //alt.log('doesRouteExist:', doesRouteExist);
        this.routeData.routes[routeIndex] = clientRoute;

        fs.writeFileSync( './resources/patrol/shared/routePoints.json',  JSON.stringify(this.routeData, null, 1), 'utf-8' );
        chat.send(player, 'Маршрут успешно сохранён');
    }

    createCommand(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }

        const name = String(arg);
        const routeName = this.routeData.routes.findIndex(route => route.name === name);
        
        if( routeName !== -1 ){
            chat.send(player, `Route с названием ${name} уже существует`);
            return;
        }
        else {
            
            //   alt.log('this.routeData.routes.length =', this.routeData.routes.length);
            const lastIndex = this.routeData.routes.length-1;
            //  alt.log('lastIndex=',lastIndex);
            const lastId = this.routeData.routes[lastIndex].id;
            // alt.log('lastId=',lastId);
                
            const newRoute = {
                    id: lastId+1,
                    name: name,
                    looped: false,
                    nodes: []
            };
            //alt.log('newRoute=',newRoute);
            this.routeData.routes.push(newRoute); 

            fs.writeFileSync( './resources/patrol/shared/routePoints.json',  JSON.stringify(this.routeData, null, 1), 'utf-8' );
            alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[lastIndex+1]);
            chat.send(player, `Создан и передан новый route ${name}`);
        }
    }

    clearCommand(player){
    //            alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[routeName]);
        alt.emitClient(player, 'patrol:clearCurrentRoute');
    //    chat.send(player, '/clear');
        chat.send(player, `Текущий маршрут удален на клиенте`);
    }

    saveCommand(player){
        alt.emitClient(player, 'patrol:askForRouteMap');
        alt.log('save');
        //chat.send(player, `Asigned route to ped`);
    }

    loadCommand(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }
        const name = String(arg);
        const routeName = this.routeData.routes.findIndex(route => route.name === name);
        if( routeName === -1 ){
            chat.send(player, `Не удалось найти route с параметром name = ${name}`);
            chat.send(player, 'Существующие name:');
            this.routeData.routes.forEach(routes => {
                chat.send(player, routes.name);
            });
            return;
        }
        alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[routeName]);
        //alt.log('route:', JSON.stringify(this.routeData.routes[routeName].id));
        chat.send(player, `/load ${name}`);
        //chat.send(player, `Испрользование load /load name`);
        //    ///path load <name>
    }

    dellnodeCommand(player, arg){
        const result = (this.checkArgument(player, arg));
        if (result === false){
            chat.send(player, `Испрользование dellnode /dellnode node_id`);
            return;
        }
        alt.emitClient(player, 'patrol:dellNode', (result));
        chat.send(player, `/dellNode ${result}`);
    }

    addnodeCommand(player, node_id){
        const result = (this.checkArgument(player, node_id));
        if (result === false){ 
            chat.send(player, `Испрользование addnode /addnode node_id`);
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
    //начзначет ped маршрут
    asignCommand(player, arg){
        if(arg.length !== 2){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }
        const pedId = parseInt(arg[0]);
        if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
            chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
            return;
        }
        const name = String(arg[1]);
        const routeName = this.routeData.routes.findIndex(route => route.name === name);
        if( routeName === -1 ){
            chat.send(player, `Не удалось найти route с параметром name = ${name}`);
            chat.send(player, 'Существующие name:');
            this.routeData.routes.forEach(routes => {
                chat.send(player, routes.name);
            });
            return;
        }
        alt.emitClient(player, 'patrol:asignCurrentRouteToPed', pedId, this.routeData.routes[routeName].id);
        chat.send(player, `Asigned route to ped`);
    }

    debugCommand(player){
        if(!this.debug){
            alt.emitClient(player, 'patrol:debugTurnOn');
            this.debug = true;
            chat.send(player, `Debug on`);
        }
        else{
            alt.emitClient(player, 'patrol:debugTurnOff');
            this.debug = false;
            chat.send(player, `Debug off`);
        }
    }
    //отменяет ped маршрут для патруля у ped
    stopCommand(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }
        const pedId = parseInt(arg[0]);
        if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
            chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
        }
        alt.emitClient(player, 'patrol:pedStop', pedId);
    }

    switchCommand(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }
        const name = String(arg[0]);
        const routeName = this.routeData.routes.findIndex(route => route.name === name);
        if( routeName === -1 ){
            chat.send(player, `Не удалось найти route с параметром name = ${name}`);
            chat.send(player, 'Существующие name:');
            this.routeData.routes.forEach(routes => {
                chat.send(player, routes.name);
            });
            return;
        }
        alt.emitClient(player, 'patrol:switchCurrentRoute', this.routeData.routes[routeName].id);
        chat.send(player, `Switched current route to ${name}`);
    }
    //отображает debug для конкретного ped, его облапсть видимости и маршрут который ему назначен если такой есть
    peddebugCommand(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }
        const pedId = parseInt(arg[0]);
        if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
            chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
            return;
        }
        alt.emitClient(player, 'patrol:pedDebug', pedId);
    }
    //выводит всю информацию о ped на клиенте (scriptID, netOwner, dimension, remoteID ...)
    pedinfoCommand(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }
        const pedId = parseInt(arg[0]);
        if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
            chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
            return;
        }
        alt.log('arg = ', arg);
        const number = parseInt(arg);
        alt.emitClient(player, 'patrol:pedinfo', number);
        alt.log('pedinfo');
        alt.log('number=', number);
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
    checkArgument(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return false;
        }
        const parsedArg = parseInt(arg[0]);
        if (isNaN(parsedArg) || arg[0].length !== 1 || parsedArg < 0 || parsedArg > 9){
            chat.send(player, 'Неправильный аругмент, аргументом может быть только целое число от 0 до 9');
            return false;
        }
        alt.log('parsedArg =', parsedArg)
        return parsedArg;
    }
    
    spawnDefaultNpcs = () =>{
        npcs.forEach(npc => {
            const ped = new alt.Ped( npc.model, new alt.Vector3(npc.position.x, npc.position.y, npc.position.z), new alt.Vector3(npc.rotation.x, npc.rotation.y, npc.rotation.z));
            ped.dimension = defaultParameters.dimension;
            ped.invincible = defaultParameters.invincible;
            //ped.collision = defaultParameters.collision;  //что бы ped не сталкивались друг с другом (и не сбивали друг другу маршруты) если у них маршруты пересекаются 
        });
        
    }

    
}

new PatrolServer();