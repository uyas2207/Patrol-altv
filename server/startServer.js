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
        alt.log('npcs',npcs.length);
        this.currentPed = null;
        this.routePointsMap = new Map();
        
        this.currentPatrolIndex = 0;
        this.isPatrolling = false;

        this.debug = false;

        this.configData = fs.readFileSync('./resources/patrol/shared/routePoints.json', 'utf8');
        this.routeData = JSON.parse(this.configData);

        this.init();
    }

    init(){
        alt.on('playerConnect', async (player) => {
            player.spawn(-1269.91, -1438.64, 4.46);
            player.rot = new alt.Vector3(0, 0, -2.5);
            await new Promise(resolve => alt.setTimeout(resolve, 500));
            //Проверка на случай если игрок заходит на сервер когда на сервере включен debug
            if (this.debug) alt.emitClient(player, 'patrol:debugTurnOn');
           // alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[1]);


            //chat.send(player, `Игрок ${player} зашел на сервер (PatrolServer)`);
            //alt.emitAllClients("npc:setup", this.currentPed.id);
            //alt.log(`npc:setup: ${JSON.stringify(this.currentPed, null, '\t')}`);
            //alt.log(`this.currentPed ${this.currentPed}`);
            //this.currentPed.setStreamSyncedMeta("giveWanderTask", true);


            await new Promise(resolve => alt.setTimeout(resolve, 500));
            //alt.emitClient(player, 'patrol:startPedPatrol');
        });

        alt.on('resourceStart', () => {
            this.spawnDefaultNpcs();
            
            alt.setTimeout(() => {
                //alt.log(this.routeData.routes[1]);
                
                //this.routeData.routes.forEach(route => {
                   // route.nodes.forEach(node => {
                  //      alt.log(route);
                    //});
                //});

            }, 1000);
        });

        chat.registerCmd('pedinfo', (player, arg) => { //выводит всю информацию о ped с id = arg
            const number = parseInt(arg);
            alt.emitClient(player, 'patrol:pedinfo', number);
            alt.log('pedinfo');
            //chat.send(player, `Asigned route to ped`);
        });

        chat.registerCmd('route', (player) => {     //выводит все значения mainmap
            alt.emitClient(player, 'patrol:route');
        });

        chat.registerCmd('pedmap', (player) => {    //выводит все значения pedmap
            alt.emitClient(player, 'patrol:pedMap');
        });
        
        chat.registerCmd('peddebug', (player, arg) => {    
            if(arg.length !== 1){
                chat.send(player, `Некорректное количество аргументов`);
                return;
            }
            const pedId = parseInt(arg[0]);
            if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
                chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
            }
            alt.emitClient(player, 'patrol:pedDebug', pedId);
        });

        chat.registerCmd('stop', (player, arg) => { // /ped stop <pedId>
            if(arg.length !== 1){
                chat.send(player, `Некорректное количество аргументов`);
                return;
            }
            const pedId = parseInt(arg[0]);
            if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > npcs.length){
                chat.send(player, `Аругментом может быть только целое число от 1 до ${npcs.length}`);
            }
            alt.emitClient(player, 'patrol:pedStop', pedId);
        });
        
        chat.registerCmd('debug', (player) => {
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
        });

        chat.registerCmd('asign', (player, arg) => { //ped assign <pedId> <pathName>
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
        });


        chat.registerCmd('addnode', (player, arg) => {   //path addnode
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
        });
        

        chat.registerCmd('dellnode', (player, arg) => { // /path removenode <index>
            const result = (this.checkArgument(player, arg));
            if (result === false){
                chat.send(player, `Испрользование dellnode /dellnode node_id`);
                return;
            }
            alt.emitClient(player, 'patrol:dellNode', (result));
            chat.send(player, `/dellNode ${result}`);
        });

        chat.registerCmd('load', (player, arg) => { // /path load <name>
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
        });

        chat.registerCmd('save', (player) => { /// path save — сохранить маршрут
            alt.emitClient(player, 'patrol:askForRouteMap');
            alt.log('save');
            //chat.send(player, `Asigned route to ped`);
        });

        alt.onClient('patrol:sendRouteMap', (player, clientRoute) => {
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
        });
    
        chat.registerCmd('clear', (player, arg) => { // /path clear — сохранить маршрут
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
            chat.send(player, `Маршрут ${name} удален на клиенте`);
            alt.emitClient(player, 'patrol:clearCurrentRoute');
            chat.send(player, '/clear');
        });

        chat.registerCmd('create', (player, arg) => { // /create <name>
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
        });
    
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
        
        //const rotZ = 0.69 * (180 / Math.PI); // преобразование в градусы
 /*
        const npc = new alt.Ped(
            "s_m_m_chemsec_01", // Модель
            new alt.Vector3(-1266.87, -1443.204, 4.460),   // Позиция (alt.Vector3)
            new alt.Vector3(0, 0, 0.69) // Поворот
        );
*/
        // Устанавливаем измерение
       // npc.dimension = 0;
        
        // Делаем NPC инвульнеральным (неуязвимым)
        //npc.invincible = true;
        //npc.collision = false;      
        //native.setBlockingOfNonTemporaryEvents(npc.scriptID, true);
        // Заморозваем NPC на месте, чтобы он не двигался
        //npc.frozen = true;
        //this.currentPed = npc;
        /*
        alt.log(`npc:setup: {
            id: ${this.currentPed.id},
            model: ${this.currentPed.model},
            dimension: ${this.currentPed.dimension},
            scriptID: ${this.currentPed.scriptID},
            invincible: ${this.currentPed.invincible},
            frozen: ${this.currentPed.frozen},
            collision: ${this.currentPed.collision},
            pos: ${JSON.stringify(this.currentPed.pos)}
        }`);
        */
        //alt.log(Object.getOwnPropertyNames(this.currentPed));

    }

    
}

new PatrolServer();

