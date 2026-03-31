import * as native from 'natives';

export class PatrolExecutor {
    constructor(defaultConfig, notificationManager){
        this.defaultConfig = defaultConfig;
        this.notificationManager = notificationManager;
    }

    //назначение маршрута ped
    assignCurrentRouteToPed(ped, attributes, nodes) {
        if ( nodes.size === 0 ){
            this.notificationManager.drawNotification(`Нельзя назначить пустой маршрут для патрулирования`);
            return;
        }
        native.deletePatrolRoute(`miss_${attributes.name}`);

            //cоздает маршрут
        native.openPatrolRoute(`miss_${attributes.name}`);

            nodes.forEach((current) => {
                native.addPatrolRouteNode(
                    current.index,
                    this.defaultConfig.animation,
                    current.position.x,
                    current.position.y,
                    current.position.z,
                    current.rotation.x,
                    current.rotation.y,
                    current.rotation.z,
                    current.waitTime
                );
            });


        const first = nodes.values().next().value;
        let prev = null;

        nodes.forEach((current) => {
            if (current !== first) {
                native.addPatrolRouteLink(prev.index, current.index);
            }
            prev = current;
        });

        if (attributes.looped) {
            native.addPatrolRouteLink(prev.index, first.index);
        }

        native.closePatrolRoute();
        native.createPatrolRoute();

        native.taskPatrol(ped, `miss_${attributes.name}`, 0, false, true);
    }

}