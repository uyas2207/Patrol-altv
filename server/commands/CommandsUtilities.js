import * as chat from 'alt:chat';

export class CommandsUtilities {
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

    calculateNodeCoords(player){
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
        return { roundedPos, lookingPoint };
    }

}