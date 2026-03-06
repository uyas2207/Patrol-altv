import * as __WEBPACK_EXTERNAL_MODULE_alt_server_bcde031e__ from "alt-server";
import * as __WEBPACK_EXTERNAL_MODULE_alt_chat_aea54472__ from "alt:chat";
import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "node:module";
const __WEBPACK_EXTERNAL_createRequire_require = __WEBPACK_EXTERNAL_createRequire(import.meta.url);
/******/ var __webpack_modules__ = ({

/***/ "./server/classes/debug.js":
/*!*********************************!*\
  !*** ./server/classes/debug.js ***!
  \*********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Debug: () => (/* binding */ Debug)
/* harmony export */ });
/* harmony import */ var alt_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-server */ "alt-server");
/* harmony import */ var alt_chat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! alt:chat */ "alt:chat");
// alt:V built-in module that provides server-side API.

// Your chat resource module.

class Debug {
  constructor() {
    this.debug = false; //изначальное состояния debug при включении сервера
  }
  toggle(player) {
    if (!this.debug) {
      this.turnOn(player);
    } else {
      this.turnOff(player);
    }
  }
  turnOn(player) {
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:debugTurnOn');
    this.debug = true;
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "Debug on");
  }
  turnOff(player) {
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:debugTurnOff');
    this.debug = false;
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "Debug off");
  }
  isEnabled() {
    return this.debug;
  }
}

/***/ }),

/***/ "./server/classes/pedManager.js":
/*!**************************************!*\
  !*** ./server/classes/pedManager.js ***!
  \**************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PedManager: () => (/* binding */ PedManager)
/* harmony export */ });
/* harmony import */ var alt_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-server */ "alt-server");
/* harmony import */ var alt_chat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! alt:chat */ "alt:chat");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// alt:V built-in module that provides server-side API.

// Your chat resource module.

class PedManager {
  constructor(defaultParameters, npcs) {
    _defineProperty(this, "spawnDefaultNpcs", () => {
      this.npcs.forEach(npc => {
        var ped = new alt_server__WEBPACK_IMPORTED_MODULE_0__.Ped(npc.model, new alt_server__WEBPACK_IMPORTED_MODULE_0__.Vector3(npc.position.x, npc.position.y, npc.position.z), new alt_server__WEBPACK_IMPORTED_MODULE_0__.Vector3(npc.rotation.x, npc.rotation.y, npc.rotation.z));
        ped.dimension = this.defaultParameters.dimension;
        ped.invincible = this.defaultParameters.invincible;
        //ped.collision = defaultParameters.collision;  //что бы ped не сталкивались друг с другом (и не сбивали друг другу маршруты) если у них маршруты пересекаются 
      });
    });
    this.defaultParameters = defaultParameters;
    this.npcs = npcs;
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log('defaultParameters:', this.defaultParameters);
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log('npcs', this.npcs.length);
  }
  //проверка что PedID из команды входит в npcs.length
  checkNpcs(player, arg) {
    var pedId = parseInt(arg[0]);
    if (isNaN(pedId) || arg[0].length !== 1 || pedId < 1 || pedId > this.npcs.length) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u0410\u0440\u0443\u0433\u043C\u0435\u043D\u0442\u043E\u043C \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0446\u0435\u043B\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u043E\u0442 1 \u0434\u043E ".concat(this.npcs.length));
      return false;
    } else {
      return pedId;
    }
  }
}

/***/ }),

/***/ "./server/classes/routeStorage.js":
/*!****************************************!*\
  !*** ./server/classes/routeStorage.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RouteStorage: () => (/* binding */ RouteStorage)
/* harmony export */ });
/* harmony import */ var alt_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-server */ "alt-server");
/* harmony import */ var alt_chat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! alt:chat */ "alt:chat");
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! fs */ "fs");
// alt:V built-in module that provides server-side API.

// Your chat resource module.


//для работы с файлами

class RouteStorage {
  constructor(filePath) {
    this.filePath = filePath;
    this.routeData = JSON.parse(fs__WEBPACK_IMPORTED_MODULE_2__.readFileSync(filePath, 'utf8'));
  }
  load(player, name) {
    var routeName = this.routeData.routes.findIndex(route => route.name === name);
    if (routeName === -1) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0439\u0442\u0438 route \u0441 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u043C name = ".concat(name));
      this.printRoutesToPlayer(player);
      return;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:initRoutes', this.routeData.routes[routeName]);
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log('route:', JSON.stringify(this.routeData.routes[routeName].id));
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "/load ".concat(name));
  }
  save(player, clientRoute) {
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log(JSON.stringify(clientRoute));
    var routeIndex = this.routeData.routes.findIndex(route => route.name === clientRoute.name);
    if (routeIndex === -1) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "{eb4034}Ошибка, получен некорректный clientRoute");
      return;
    }
    this.routeData.routes[routeIndex] = clientRoute;
    fs__WEBPACK_IMPORTED_MODULE_2__.writeFileSync(this.filePath, JSON.stringify(this.routeData, null, 1), 'utf-8');
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, 'Маршрут успешно сохранён');
  }
  create(player, name) {
    var routeName = this.routeData.routes.findIndex(route => route.name === name);
    if (routeName !== -1) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "Route \u0441 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435\u043C ".concat(name, " \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"));
      return;
    } else {
      //проверка всех routes и поиск максимального id на случай если в routePoints.json id маршрутов идут не по порядку
      var maxId = 0;
      this.routeData.routes.forEach(route => {
        if (route.id > maxId) {
          maxId = route.id;
        }
      });
      var newRoute = {
        id: maxId + 1,
        name: name,
        looped: false,
        nodes: []
      };
      this.routeData.routes.push(newRoute);
      fs__WEBPACK_IMPORTED_MODULE_2__.writeFileSync(this.filePath, JSON.stringify(this.routeData, null, 1), 'utf-8');
      var lastIndex = this.routeData.routes.length - 1;
      alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:initRoutes', this.routeData.routes[lastIndex]);
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u0421\u043E\u0437\u0434\u0430\u043D \u0438 \u043F\u0435\u0440\u0435\u0434\u0430\u043D \u043D\u043E\u0432\u044B\u0439 route ".concat(name));
    }
  }
  getRouteByName(name) {
    return this.routeData.routes.find(route => route.name === name);
  }
  printRoutesToPlayer(player) {
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, 'Существующие name:');
    this.routeData.routes.forEach(route => {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, route.name);
    });
  }
}

/***/ }),

/***/ "./server/commands/patrolCommands.js":
/*!*******************************************!*\
  !*** ./server/commands/patrolCommands.js ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PatrolCommands: () => (/* binding */ PatrolCommands)
/* harmony export */ });
/* harmony import */ var alt_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-server */ "alt-server");
/* harmony import */ var alt_chat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! alt:chat */ "alt:chat");
// alt:V built-in module that provides server-side API.

// Your chat resource module.

class PatrolCommands {
  constructor(pedManager, routeStorage, debug) {
    this.routeStorage = routeStorage;
    this.pedManager = pedManager;
    this.debug = debug;
    this.commands = {
      //весь список команд
      path: {
        info: this.routeInfoCommand.bind(this),
        //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.routePointsMap + currentRouteAttributes
        switch: this.switchCommand.bind(this),
        //меняет текщуий маршрут на клиенте (для коректной работы addnode dellnode т.к добавление и удаление нод происходит с текущим маршрутом)

        debug: this.debugCommand.bind(this),
        //отображает общий debug, все переданные на клиент маршруты и все области видимости ped
        addnode: this.addnodeCommand.bind(this),
        //добавляет в текущий маршрут точку на которой стоит игрок
        dellnode: this.dellnodeCommand.bind(this),
        //удаляет из текщуего маршрута точку с указаным в команде номером
        clear: this.clearCommand.bind(this),
        //очищает текущий маршрут на клиенте
        save: this.saveCommand.bind(this),
        //запрашивает с клиента его текущий маршрут для сохранения в общий список в routePoints.json
        load: this.loadCommand.bind(this),
        //передает на клиент маршрут с названием указанным в команде из routePoints.json
        create: this.createCommand.bind(this) //создает новый маршрут в файле routePoints.json и передает его на клиент
      },
      ped: {
        info: this.pedinfoCommand.bind(this),
        //выводит всю информацию о ped на клиенте (scriptID, netOwner, dimension, remoteID ...)
        map: this.pedmapCommand.bind(this),
        //выводит всю информацию о ped из клиентской map mainPedMap (asignedRoute, isdebuged)

        asign: this.asignCommand.bind(this),
        //начзначет ped маршрут
        debug: this.peddebugCommand.bind(this),
        //отображает debug для конкретного ped, его облапсть видимости и маршрут который ему назначен если такой есть
        stop: this.stopCommand.bind(this) //отменяет ped маршрут для патруля у ped
      }
    };
  }
  registerCommands() {
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.registerCmd('path', (player, args) => {
      this.executeCommand('path', player, args);
    });
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.registerCmd('ped', (player, args) => {
      this.executeCommand('ped', player, args);
    });
  }
  executeCommand(category, player, args) {
    if (args.length === 0) {
      alt_server__WEBPACK_IMPORTED_MODULE_0__.log('Вывод информации из help');
      this.showHelp(player, category);
      return;
    }
    var subCommand = args[0];
    var commandHandler = this.commands[category][subCommand];
    if (commandHandler) {
      commandHandler(player, args.slice(1));
    } else {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430: /".concat(category, " ").concat(subCommand));
      alt_server__WEBPACK_IMPORTED_MODULE_0__.log('Вывод информации из help (else)');
      this.showHelp(player, category);
    }
  }
  showHelp(player, category) {
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, 'Доступные команды:');
    Object.keys(this.commands[category]).forEach(command => {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "/".concat(category, " ").concat(command));
    });
  }

  //создает новый маршрут в файле routePoints.json и передает его на клиент
  createCommand(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 1)) return;
    var name = String(arg);
    this.routeStorage.create(player, name);
  }
  //очищает текущий маршрут на клиенте
  clearCommand(player) {
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:clearCurrentRoute');
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D \u043D\u0430 \u043A\u043B\u0438\u0435\u043D\u0442\u0435");
  }
  //запрашивает с клиента его текущий маршрут для сохранения в общий список в routePoints.json
  saveCommand(player) {
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:askForRouteMap');
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log('save');
  }
  //передает на клиент маршрут с названием указанным в команде из routePoints.json
  loadCommand(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 1)) return;
    var name = String(arg);
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log('name в loadcomande', name);
    this.routeStorage.load(player, name);
  }
  //удаляет из текщуего маршрута точку с указаным в команде номером
  dellnodeCommand(player, node_id) {
    var result = this.checkNode(player, node_id); //result = node_id или false если введены некоректные данные для node_id
    //проверка !result не рабоатет, так как аргуменом может быть 0
    if (result === false) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 dellnode /dellnode node_id");
      return;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:dellNode', result);
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "/dellNode ".concat(result));
  }
  //добавляет в текущий маршрут точку на которой стоит игрок
  addnodeCommand(player, node_id) {
    var result = this.checkNode(player, node_id); //result = node_id или false если введены некоректные данные для node_id
    //проверка !result не рабоатет, так как аргуменом может быть 0
    if (result === false) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 addnode /addnode node_id");
      return;
    }
    //координаты ноды
    var roundedPos = {
      x: parseFloat(player.pos.x.toFixed(2)),
      y: parseFloat(player.pos.y.toFixed(2)),
      z: parseFloat(player.pos.z.toFixed(2))
    };
    //точка в 5 метрах по взгляду игрока (координаты на которые будет смотреть ped)
    var lookingPoint = {
      x: parseFloat((roundedPos.x - Math.sin(player.rot.z) * 5).toFixed(2)),
      y: parseFloat((roundedPos.y + Math.cos(player.rot.z) * 5).toFixed(2)),
      z: roundedPos.z
    };
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:addNode', roundedPos, lookingPoint, result);
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "/addnode ".concat(result));
  }
  //отображает общий debug, все переданные на клиент маршруты и все области видимости ped
  debugCommand(player) {
    this.debug.toggle(player);
  }

  //отменяет ped маршрут для патруля у ped
  stopCommand(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 1)) return;
    var pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
    if (!pedId) {
      alt_server__WEBPACK_IMPORTED_MODULE_0__.log('Некорректное значение pedId:', pedId);
      return;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:pedStop', pedId);
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "/ped stop ".concat(pedId));
  }
  //начзначет ped маршрут
  asignCommand(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 2)) return;
    var pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
    if (!pedId) {
      alt_server__WEBPACK_IMPORTED_MODULE_0__.log('Некорректное значение pedId:', pedId);
      return;
    }
    var name = String(arg[1]);
    var route = this.routeStorage.getRouteByName(name);
    if (!route) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0439\u0442\u0438 route \u0441 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u043C name = ".concat(name));
      this.routeStorage.printRoutesToPlayer(player);
      return;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:asignCurrentRouteToPed', pedId, route.id);
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "/ped asign ".concat(pedId, " ").concat(name));
  }
  //меняет текщуий маршрут на клиенте (для коректной работы addnode dellnode т.к добавление и удаление нод происходит с текущим маршрутом)
  switchCommand(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 1)) return;
    var name = String(arg[0]);
    var route = this.routeStorage.getRouteByName(name);
    if (!route) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0439\u0442\u0438 route \u0441 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u043C name = ".concat(name));
      this.routeStorage.printRoutesToPlayer(player);
      return;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:switchCurrentRoute', route.id);
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "Switched current route to ".concat(name));
  }
  //отображает debug для конкретного ped, его облапсть видимости и маршрут который ему назначен если такой есть
  peddebugCommand(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 1)) return;
    var pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
    if (!pedId) {
      alt_server__WEBPACK_IMPORTED_MODULE_0__.log('Некорректное значение pedId:', pedId);
      return;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:pedDebug', pedId);
  }
  //выводит всю информацию о ped на клиенте (scriptID, netOwner, dimension, remoteID ...)
  pedinfoCommand(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 1)) return;
    var pedId = this.pedManager.checkNpcs(player, arg); //pedId = pedId или false если введены некоректные данные для pedId
    if (!pedId) {
      alt_server__WEBPACK_IMPORTED_MODULE_0__.log('Некорректное значение pedId:', pedId);
      return;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log('pedId = ', pedId);
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:pedInfo', pedId);
    alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "/ped info ".concat(pedId));
  }
  //выводит всю информацию о ped из клиентской map mainPedMap (asignedRoute, isdebuged)
  pedmapCommand(player) {
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:pedMap');
  }
  //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.routePointsMap + currentRouteAttributes
  routeInfoCommand(player) {
    //   alt.log('arg = ', arg);
    alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:route');
  }

  //универсальная проверка аргумента в командах, аругмент может быть только целым числом от 0 до 9
  //при провале возвращает false, при успехе значение корректного аргумента(parseInt(arg[0]))
  checkNode(player, arg) {
    if (!this.checkArgumentsLength(player, arg, 1)) return false;
    var parsedArg = parseInt(arg[0]);
    if (isNaN(parsedArg) || arg[0].length !== 1 || parsedArg < 0 || parsedArg > 9) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, 'Неправильный аругмент, аргументом может быть только целое число от 0 до 9');
      return false;
    }
    alt_server__WEBPACK_IMPORTED_MODULE_0__.log('parsedArg =', parsedArg);
    return parsedArg;
  }
  checkArgumentsLength(player, arg, expectedLength) {
    if (arg.length !== expectedLength) {
      alt_chat__WEBPACK_IMPORTED_MODULE_1__.send(player, "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u043E\u0432, \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u043E\u0432: ".concat(expectedLength));
      return false;
    }
    return true;
  }
}

/***/ }),

/***/ "./server/config/serverconfig.js":
/*!***************************************!*\
  !*** ./server/config/serverconfig.js ***!
  \***************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultParameters: () => (/* binding */ defaultParameters),
/* harmony export */   npcs: () => (/* binding */ npcs)
/* harmony export */ });
var defaultParameters = {
  dimension: 0,
  invincible: true,
  collision: false
};
var npcs = [{
  model: "cs_casey",
  position: {
    x: -1266.87,
    y: -1443.204,
    z: 4.46
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0.69
  }
}, {
  model: "s_m_m_chemsec_01",
  position: {
    x: -1269.52,
    y: -1444.82,
    z: 4.56
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0.69
  }
}, {
  model: "s_m_y_cop_01",
  position: {
    x: -1271.86,
    y: -1446.30,
    z: 4.62
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0.69
  }
}];

/***/ }),

/***/ "alt-server":
/*!*****************************!*\
  !*** external "alt-server" ***!
  \*****************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_alt_server_bcde031e__;

/***/ }),

/***/ "alt:chat":
/*!***************************!*\
  !*** external "alt:chat" ***!
  \***************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_alt_chat_aea54472__;

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire_require("fs");

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./server/startServer.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var alt_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-server */ "alt-server");
/* harmony import */ var _classes_routeStorage_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./classes/routeStorage.js */ "./server/classes/routeStorage.js");
/* harmony import */ var _classes_pedManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./classes/pedManager.js */ "./server/classes/pedManager.js");
/* harmony import */ var _classes_debug_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./classes/debug.js */ "./server/classes/debug.js");
/* harmony import */ var _commands_patrolCommands_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./commands/patrolCommands.js */ "./server/commands/patrolCommands.js");
/* harmony import */ var _config_serverconfig_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./config/serverconfig.js */ "./server/config/serverconfig.js");
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// alt:V built-in module that provides server-side API.







class PatrolServer {
  constructor() {
    this.routeStorage = new _classes_routeStorage_js__WEBPACK_IMPORTED_MODULE_1__.RouteStorage('./resources/patrol/data/routePoints.json');
    this.pedManager = new _classes_pedManager_js__WEBPACK_IMPORTED_MODULE_2__.PedManager(_config_serverconfig_js__WEBPACK_IMPORTED_MODULE_5__.defaultParameters, _config_serverconfig_js__WEBPACK_IMPORTED_MODULE_5__.npcs);
    this.debug = new _classes_debug_js__WEBPACK_IMPORTED_MODULE_3__.Debug();
    this.patrolCommands = new _commands_patrolCommands_js__WEBPACK_IMPORTED_MODULE_4__.PatrolCommands(this.pedManager, this.routeStorage, this.debug);
    this.init();
  }
  init() {
    var _this = this;
    alt_server__WEBPACK_IMPORTED_MODULE_0__.on('playerConnect', /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(function* (player) {
        player.spawn(-1269.91, -1438.64, 4.46);
        player.rot = new alt_server__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, 0, -2.5);
        yield new Promise(resolve => alt_server__WEBPACK_IMPORTED_MODULE_0__.setTimeout(resolve, 500));

        //Проверка на случай если игрок заходит на сервер когда на сервере включен debug
        if (_this.debug.isEnabled()) alt_server__WEBPACK_IMPORTED_MODULE_0__.emitClient(player, 'patrol:debugTurnOn');
      });
      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
    alt_server__WEBPACK_IMPORTED_MODULE_0__.on('resourceStart', () => {
      this.pedManager.spawnDefaultNpcs();
      this.patrolCommands.registerCommands();
    });
    alt_server__WEBPACK_IMPORTED_MODULE_0__.onClient('patrol:sendRouteMap', (player, clientRoute) => {
      this.routeStorage.save(player, clientRoute);
    });
  }
}
new PatrolServer();
})();

