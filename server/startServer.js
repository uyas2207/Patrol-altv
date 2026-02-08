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
        this.currentPed = null;
        this.routePointsMap = new Map();
        
        this.currentPatrolIndex = 0;
        this.isPatrolling = false;

        this.debug = false;

        this.configData = fs.readFileSync('./resources/patrol/shared/routePoints.json', 'utf8');
        this.routeData = JSON.parse(this.configData);

        this.commands = {
            path: {
                info: this.routeInfoCommande.bind(this),
                switch: this.switchCommande.bind(this),

                debug: this.debugCommande.bind(this),
                addnode: this.addnodeCommande.bind(this),
                dellnode: this.dellnodeCommande.bind(this),
                clear: this.clearCommande.bind(this),
                save: this.saveCommande.bind(this),
                load: this.loadCommande.bind(this),
                create: this.createCommande.bind(this)
            },
            ped: {
                info: this.pedinfoCommande.bind(this),
                map: this.pedmapCommande.bind(this),

                asign: this.asignCommande.bind(this),
                peddebug: this.peddebugCommande.bind(this),
                stop: this.stopCommande.bind(this)
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

            await new Promise(resolve => alt.setTimeout(resolve, 500));
        });

        alt.on('resourceStart', () => {
            this.spawnDefaultNpcs();
            
            alt.setTimeout(() => {

            }, 1000);
        });

        chat.registerCmd('path', (player, args) => {
            this.executeCommand('path', player, args);
        });
        
        chat.registerCmd('ped', (player, args) => {
            this.executeCommand('ped', player, args);
        });

/*

        chat.registerCmd('switch', (player, arg) => {    //меняет текущий маршрут (тот к которому добавляют и удаляют ноды командами) для взаимодействия на клиенте
            this.switchCommande(player, arg);
        });

        //patrol:switchCurrentRoute
        
        chat.registerCmd('peddebug', (player, arg) => {    
            this.peddebugCommande(player, arg);
        });

        chat.registerCmd('stop', (player, arg) => { // /ped stop <pedId>
            this.stopCommande(player, arg);
        });
        
        chat.registerCmd('debug', (player) => {
            this.debugCommande(player);
        });

        chat.registerCmd('asign', (player, arg) => { //ped assign <pedId> <pathName>
            this.asignCommande(player, arg);
        });

        chat.registerCmd('addnode', (player, arg) => {   //path addnode
            this.addnodeCommande(player, arg);
        });

        chat.registerCmd('dellnode', (player, arg) => { // /path removenode <index>
            this.dellnodeCommande(player, arg);
        });

        chat.registerCmd('load', (player, arg) => { // /path load <name>
            this.loadCommande(player, arg);
        });

        chat.registerCmd('save', (player) => { /// path save — сохранить маршрут
            this.saveCommande(player);
        });
    
        chat.registerCmd('clear', (player) => { // /path clear — сохранить маршрут
            this.clearCommande(player);
        });

        chat.registerCmd('create', (player, arg) => { // /create <name>
            this.createCommande(player, arg);
        });

*/

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

        /*
            this.routeData.routes.forEach(route => {
                route.nodes.forEach(node => {
                    alt.log(node);
                });
            });
        
        */          //name

        fs.writeFileSync( './resources/patrol/shared/routePoints.json',  JSON.stringify(this.routeData, null, 1), 'utf-8' );
        chat.send(player, 'Маршрут успешно сохранён');
        
            //this.checkDistance(player, interactionType);    
    }

    createCommande(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }

        const name = String(arg);
        const routeName = this.routeData.routes.findIndex(route => route.name === name);
        
        if( routeName !== -1 ){
            chat.send(player, `Route с названием ${name} уже существует`);
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
            // this.routeData.routes.forEach(route => {
                // route.nodes.forEach(node => {
            //         alt.log(route);
                // });
        //    });

            fs.writeFileSync( './resources/patrol/shared/routePoints.json',  JSON.stringify(this.routeData, null, 1), 'utf-8' );
            alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[lastIndex+1]);
            chat.send(player, `Создан и передан новый route ${name}`);
        }
    }

    clearCommande(player){
    //            alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[routeName]);
        alt.emitClient(player, 'patrol:clearCurrentRoute');
    //    chat.send(player, '/clear');
        chat.send(player, `Иекущий маршрут удален на клиенте`);
    }

    saveCommande(player){
        alt.emitClient(player, 'patrol:askForRouteMap');
        alt.log('save');
        //chat.send(player, `Asigned route to ped`);
    }

    loadCommande(player, arg){
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

    dellnodeCommande(player, arg){
        const result = (this.checkArgument(player, arg));
        if (result === false){
            chat.send(player, `Испрользование dellnode /dellnode node_id`);
            return;
        }
        alt.emitClient(player, 'patrol:dellNode', (result));
        chat.send(player, `/dellNode ${result}`);
    }

    addnodeCommande(player, arg){
        const result = (this.checkArgument(player, arg));
        if (result === false){ 
            chat.send(player, `Испрользование addnode /addnode node_id`);
            return
        }
        //alt.log('player.pos', player.pos);
        const roundedPos = {
            x: parseFloat(player.pos.x.toFixed(2)),
            y: parseFloat(player.pos.y.toFixed(2)),
            z: parseFloat(player.pos.z.toFixed(2))
        };
        //alt.log('roundedPos', roundedPos);
        alt.emitClient(player, 'patrol:addNode', roundedPos, result);
        chat.send(player, `/addnode ${result}`);
    }

    asignCommande(player, arg){
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

    debugCommande(player){
        if(!this.debug){
            this.debug = true;
            alt.emitClient(player, 'patrol:debugTurnOn');
            chat.send(player, `Debug on`);
        }
        else{
            this.debug = false;
            alt.emitClient(player, 'patrol:debugTurnOff');
            chat.send(player, `Debug off`);
        }
    }

    stopCommande(player, arg){
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

    switchCommande(player, arg){
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

    peddebugCommande(player, arg){
        if(arg.length !== 1){
            chat.send(player, `Некорректное количество аргументов`);
            return;
        }
        const pedId = parseInt(arg[0]);
        if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
            chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
        }
        alt.emitClient(player, 'patrol:pedDebug', pedId);
    }

    pedinfoCommande(player, arg){
        alt.log('arg = ', arg);
        const number = parseInt(arg);
        alt.emitClient(player, 'patrol:pedinfo', number);
        alt.log('pedinfo');
        alt.log('number=', number);
    }

    pedmapCommande(player){
        alt.emitClient(player, 'patrol:pedMap');
    }

    routeInfoCommande(player){//выводит все значения mainmap
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
        // Охранник у банка
        npcs.forEach(npc => {
            const ped = new alt.Ped( npc.model, new alt.Vector3(npc.position.x, npc.position.y, npc.position.z), new alt.Vector3(npc.rotation.x, npc.rotation.y, npc.rotation.z));
            ped.dimension = defaultParameters.dimension;
            ped.invincible = defaultParameters.invincible;
            //ped.collision = defaultParameters.collision;  //что бы ped не сталкивались друг с другом (и не сбивали друг другу маршруты) если у них маршруты пересекаются 
        });
        
    }

    
}

new PatrolServer();

