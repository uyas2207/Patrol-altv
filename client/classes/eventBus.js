import * as alt from 'alt-client';

class EventBus {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        alt.log('EventBus.on started', event, callback);
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);
        alt.log('EventBus.on completed', event, callback);
    }

    emit(event, ...args) {
        alt.log('EventBus.emit started', event, ...args);
        const callbacks = this.listeners[event];
        if (!callbacks){
            alt.log('Ошибка попытка сделать emit несуществующего ивента:', event);
            return;
        }
        callbacks.forEach(callback => callback(...args));
        alt.log('EventBus.emit completed', event, ...args);
    }

    off(event, callback) {
        alt.log('EventBus.off started', event, callback);
        if (!this.listeners[event]){
            alt.log('Ошибка, поптыка отписаться от несуществующего ивента');
            return;
        }
        //заново фильтрует весь массив таким образом что бы массив состоял только из тех callback которые не такие же как переданный (удаляет ненужный callback из this.listeners[event])
        this.listeners[event] = this.listeners[event].filter(listener => listener !== callback);
        alt.log('EventBus.off completed', event, callback);
    }

    printAll(){
        alt.log('this.listeners: ', this.listeners);
    }
}

export const eventBus = new EventBus();