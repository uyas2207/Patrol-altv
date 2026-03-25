// alt:V built-in module that provides server-side API.
import * as alt from 'alt-server';
// Your chat resource module.
import * as chat from 'alt:chat';

//для работы с файлами
import * as fs from 'fs';

export class RouteStorage {
    constructor(filePath) {
        this.filePath = filePath;
        this.routeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    load(player, name) {

        const routeName = this.routeData.routes.findIndex(route => route.name === name);
        if( routeName === -1 ){
            chat.send(player, `Не удалось найти route с параметром name = ${name}`);
            this.#printRoutesToPlayer(player);
            return;
        }

        alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[routeName]);
        alt.log('route:', JSON.stringify(this.routeData.routes[routeName].id));
        chat.send(player, `/load ${name}`);
    }

    save(player, clientRoute) {
        alt.log(JSON.stringify(clientRoute));
        const routeIndex = this.routeData.routes.findIndex(route => route.name === clientRoute.name);
        
        if( routeIndex === -1 ){
            chat.send(player, "{eb4034}Ошибка, получен некорректный clientRoute");
            return;
        }

        this.routeData.routes[routeIndex] = clientRoute;
        fs.writeFileSync( this.filePath, JSON.stringify(this.routeData, null, 1), 'utf-8' );
        chat.send(player, 'Маршрут успешно сохранён');
    }

    create(player, name) {

        const routeName = this.routeData.routes.findIndex(route => route.name === name);
        
        if( routeName !== -1 ){
            chat.send(player, `Route с названием ${name} уже существует`);
            return;
        }
        else {
            
            //проверка всех routes и поиск максимального id на случай если в routePoints.json id маршрутов идут не по порядку
            let maxId = 0;
            this.routeData.routes.forEach(route => {
                if (route.id > maxId){
                    maxId = route.id;
                }
            });

            const newRoute = {
                id: maxId+1,
                name: name,
                looped: false,
                nodes: []
            };

            this.routeData.routes.push(newRoute); 
            fs.writeFileSync( this.filePath,  JSON.stringify(this.routeData, null, 1), 'utf-8' );

            const lastIndex = this.routeData.routes.length-1;
            alt.emitClient(player, 'patrol:initRoutes', this.routeData.routes[lastIndex]);
            chat.send(player, `Создан и передан новый route ${name}`);
        }
    }

    getRouteByName(name) {
        return this.routeData.routes.find(route => route.name === name);
    }

    #printRoutesToPlayer(player){
        chat.send(player, 'Существующие name:');
        this.routeData.routes.forEach(route => {
            chat.send(player, route.name);
        });
    }
}
