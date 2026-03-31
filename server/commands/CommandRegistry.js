import * as alt from 'alt-server';
import * as chat from 'alt:chat';

export class CommandRegistry {
    constructor() {
        this.commands = {};
    }

    buildCommands(commandProvider) {
        const prefix = 'cmd_';
        //запоминает все названия методов класса (берет их из прототипа класса)
        Object.getOwnPropertyNames(Object.getPrototypeOf(commandProvider))
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
                this.commands[category][subCommand] = commandProvider[name].bind(commandProvider);
            });
    }

    registerChatCommands(){
        Object.keys(this.commands).forEach(category => {
            chat.registerCmd(category, (player, args) => {
                this.#executeCommand(category, player, args);
            });
        });
    }

    #executeCommand(category, player, args) {
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
}