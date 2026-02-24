import * as __WEBPACK_EXTERNAL_MODULE_alt_client_680395b4__ from "alt-client";
import * as __WEBPACK_EXTERNAL_MODULE_natives__ from "natives";
/******/ var __webpack_modules__ = ({

/***/ "./client/classes/debugManager.js":
/*!****************************************!*\
  !*** ./client/classes/debugManager.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DebugManager: () => (/* binding */ DebugManager)
/* harmony export */ });
/* harmony import */ var alt_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-client */ "alt-client");

class DebugManager {
  constructor(pedManager, routeManager, debugVisuals) {
    this.pedManager = pedManager;
    this.routeManager = routeManager;
    this.debugVisuals = debugVisuals;
    this.debug = null; // хранит everytick для общего debug
  }
  turnOnGlobalDebug() {
    this.debug = alt_client__WEBPACK_IMPORTED_MODULE_0__.everyTick(() => {
      this.drawAllPedVisionCones();
      this.drawAllMarkers();
      this.connectAllRoutesLine();
    });
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log("debugTurnOn");
  }
  turnOffGlobalDebug() {
    alt_client__WEBPACK_IMPORTED_MODULE_0__.clearEveryTick(this.debug);
    this.debug = null;
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log("debugTurnOff");
  }
  drawAllMarkers() {
    this.routeManager.forEachRoute((attributes, nodes) => {
      if (attributes.isdebuged === false) {
        this.debugVisuals.drawRouteMarkers(nodes);
      }
    });
  }
  drawAllPedVisionCones() {
    this.pedManager.forEachPed(ped => {
      if (ped.isdebuged === false) {
        this.debugVisuals.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt_client__WEBPACK_IMPORTED_MODULE_0__.Player.local.pos);
      }
    });
  }
  connectAllRoutesLine() {
    this.routeManager.forEachRoute((attributes, nodes) => {
      if (attributes.isdebuged === false) {
        this.debugVisuals.connectNodesLine(nodes, attributes);
      }
    });
  }
}

/***/ }),

/***/ "./client/classes/debugVisuals.js":
/*!****************************************!*\
  !*** ./client/classes/debugVisuals.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DebugVisuals: () => (/* binding */ DebugVisuals)
/* harmony export */ });
/* harmony import */ var natives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! natives */ "natives");


//import { defaultClientConfig } from '../config/clientConfig.js';

class DebugVisuals {
  constructor(defaultClientConfig) {
    this.viewDistance = defaultClientConfig.viewDistance; // длина конуса
    this.viewAngle = defaultClientConfig.viewAngle; // угол обзора (градусы)
    this.viewSectors = defaultClientConfig.viewSectors; //количество секторов видимости у ped

    this.defaultConfig = defaultClientConfig;
  }
  drawRouteMarkers(routeMap) {
    routeMap.forEach(point => {
      natives__WEBPACK_IMPORTED_MODULE_0__.drawMarker(this.defaultConfig.markerType + point.index, point.position.x, point.position.y, point.position.z, 0, 0, 0, 0, 0, 0, this.defaultConfig.markerScale.x, this.defaultConfig.markerScale.y, this.defaultConfig.markerScale.z, this.defaultConfig.markerColour.r, this.defaultConfig.markerColour.g, this.defaultConfig.markerColour.b, this.defaultConfig.markerColour.a, false, true, 2, 0, 0, 0, false);
    });
  }
  connectNodesLine(routeMap, attributes) {
    if (routeMap.size < 2) return;
    var first = routeMap.values().next().value;
    var prev = null;
    routeMap.forEach(current => {
      if (current !== first) {
        natives__WEBPACK_IMPORTED_MODULE_0__.drawLine(prev.position.x, prev.position.y, prev.position.z, current.position.x, current.position.y, current.position.z, this.defaultConfig.markerColour.r, this.defaultConfig.markerColour.g, this.defaultConfig.markerColour.b, this.defaultConfig.markerColour.a);
      }
      prev = current;
    });
    if (attributes.looped) {
      natives__WEBPACK_IMPORTED_MODULE_0__.drawLine(prev.position.x, prev.position.y, prev.position.z, first.position.x, first.position.y, first.position.z, this.defaultConfig.markerColour.r, this.defaultConfig.markerColour.g, this.defaultConfig.markerColour.b, this.defaultConfig.markerColour.a);
    }
  }

  //отображение области видимости ped
  drawPedVisionCone(pedPos, pedScriptID, playerpos) {
    var heading = natives__WEBPACK_IMPORTED_MODULE_0__.getEntityHeading(pedScriptID);
    var headingRad = heading * Math.PI / 180;
    var halfAngleRad = this.viewAngle / 2 * Math.PI / 180;
    var stepAngleRad = this.viewAngle * Math.PI / 180 / this.viewSectors;
    var cansee = this.isPlayerInVisionCone(playerpos, headingRad, halfAngleRad, pedPos);
    var prevPoint = null;
    var coneColor = {
      r: 0,
      g: 255,
      b: 0,
      a: 200
    };
    if (cansee) {
      coneColor = {
        r: 255,
        g: 0,
        b: 0,
        a: 200
      };
      natives__WEBPACK_IMPORTED_MODULE_0__.drawMarker(0, playerpos.x, playerpos.y, playerpos.z + 1.0, 0, 0, 0, 0, 0, 0, 0.15, 0.15, 0.15, 255, 0, 0, 200, true, true, 2, 0, 0, 0, false);
      natives__WEBPACK_IMPORTED_MODULE_0__.drawLine(pedPos.x, pedPos.y, pedPos.z + 0.1, playerpos.x, playerpos.y, playerpos.z + 0.5, 255, 0, 0, 200);
    }
    for (var i = -halfAngleRad; i <= halfAngleRad; i += stepAngleRad) {
      var currentAngle = headingRad + i;
      var forwardX = Math.sin(-currentAngle);
      var forwardY = Math.cos(-currentAngle);
      var x = pedPos.x + forwardX * this.viewDistance;
      var y = pedPos.y + forwardY * this.viewDistance;
      var z = pedPos.z;
      natives__WEBPACK_IMPORTED_MODULE_0__.drawLine(pedPos.x, pedPos.y, pedPos.z + 0.1, x, y, z + 0.1, coneColor.r, coneColor.g, coneColor.b, coneColor.a);
      if (prevPoint) {
        natives__WEBPACK_IMPORTED_MODULE_0__.drawLine(prevPoint.x, prevPoint.y, prevPoint.z + 0.1, x, y, z + 0.1, coneColor.r, coneColor.g, coneColor.b, coneColor.a);
      }
      prevPoint = {
        x,
        y,
        z
      };
    }
  }
  isPlayerInVisionCone(playerPos, headingRad, halfAngleRad, pedPos) {
    var toPlayerX = playerPos.x - pedPos.x;
    var toPlayerY = playerPos.y - pedPos.y;
    var distance = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    if (distance > this.viewDistance) return false;
    var forwardX = Math.sin(-headingRad);
    var forwardY = Math.cos(-headingRad);
    var len = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
    var dirToPlayerX = toPlayerX / len;
    var dirToPlayerY = toPlayerY / len;
    var dot = forwardX * dirToPlayerX + forwardY * dirToPlayerY;
    var angleToPlayer = Math.acos(dot);
    return angleToPlayer <= halfAngleRad;
  }
}

/***/ }),

/***/ "./client/classes/pedManager.js":
/*!**************************************!*\
  !*** ./client/classes/pedManager.js ***!
  \**************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PedManager: () => (/* binding */ PedManager)
/* harmony export */ });
/* harmony import */ var alt_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-client */ "alt-client");
/* harmony import */ var natives__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! natives */ "natives");
/* provided dependency */ var drawNotification = __webpack_require__(/*! ./client/utilities/utilities.js */ "./client/utilities/utilities.js")["drawNotification"];
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }



//import { defaultClientConfig } from '../config/clientConfig.js';

class PedManager {
  constructor(routeManager, debugVisuals, defaultClientConfig) {
    this.mainPedMap = new Map(); // хранит данные о ped (ped, asignedRoute, isdebuged)
    this.routeManager = routeManager;
    this.debugVisuals = debugVisuals;
    this.singleDebug = new Map(); // хранит everytick для визульного отображения у конкретных ped
    this.defaultConfig = defaultClientConfig;
  }

  //изменяет данные о ped, так как при вылете из стрим зоны и повторном влете у ped меняется большая часть данных и нужно перезаписать старые неактуальные данные о ped
  entityInitialize(entity) {
    var _this = this;
    return _asyncToGenerator(function* () {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('entity.scriptID', entity.scriptID);

      // при повторном появлении ped на клиенте, меняется scriptID и другие значения, но остается тем же id
      if (_this.mainPedMap.has(entity.id)) {
        var _data = _this.mainPedMap.get(entity.id);
        _data.entity = entity; //изменение значений для ped с id
        //если у ped есть назначенный маршрут назначает его заново что бы ped продолжил его выполнять
        if (_data.asignedRoute) {
          var route = _this.routeManager.getRoute(_data.asignedRoute);
          //const route = this.routeManager.mainMap.get(data.asignedRoute);
          yield new Promise(resolve => alt_client__WEBPACK_IMPORTED_MODULE_0__.setTimeout(resolve, 1000)); //setTimeout что бы ped успел инициализироваться полностью, получить netOwner и мог выполнять маршрут
          _this.asignCurrentRouteToPed(_data.entity, route.attributes, route.nodes);
          alt_client__WEBPACK_IMPORTED_MODULE_0__.log("Ped ".concat(_data.entity.id, ", \u0437\u0430\u043D\u043E\u0432\u043E asigned \u043F\u0440\u043E\u0448\u043B\u044B\u0439 route ").concat(_data.asignedRoute));
        }
        return;
      }
      //при первом появлении ped на клиенте
      _this.mainPedMap.set(entity.id, {
        entity,
        asignedRoute: null,
        isdebuged: false
      });
      var data = _this.mainPedMap.get(entity.id);
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("entity id: ".concat(data.entity.id, ", entity scriptID: ").concat(data.entity.scriptID, ", asignedRoute: ").concat(data.asignedRoute));
    })();
  }
  asignRouteToPed(pedId, routeID) {
    // Проверка наличия маршрута
    if (this.routeManager.hasRoute(routeID) === false) {
      drawNotification("Route \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u043D\u0430 \u043A\u043B\u0438\u0435\u043D\u0442");
      drawNotification("\u0427\u0442\u043E \u0431\u044B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C Route \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 /load");
      return;
    }
    var route = this.routeManager.getRoute(routeID);
    var ped = this.getPed(pedId);
    if (!ped) {
      drawNotification("Ped ".concat(pedId, " \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"));
      return;
    }
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('route:', JSON.stringify(route));
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('ped:', JSON.stringify(ped));

    // Выполнение патрулирования (было в asignCurrentRouteToPed)
    this.asignCurrentRouteToPed(ped.entity, route.attributes, route.nodes);

    // Очистка предыдущих назначений того же маршрута
    this.updatePedAssignment(routeID, pedId);

    // Обновление данных ped
    ped.asignedRoute = routeID;

    // Обновление данных маршрута
    route.attributes.asigned = pedId;
  }
  updatePedAssignment(routeID, currentPedId) {
    this.mainPedMap.forEach(value => {
      if (value.asignedRoute === routeID && value.entity.id !== currentPedId) {
        value.asignedRoute = null;
      }
    });
  }

  //назначение маршрута ped
  asignCurrentRouteToPed(ped, attributes, nodes) {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      if (nodes.size === 0) {
        drawNotification("\u041D\u0435\u043B\u044C\u0437\u044F \u043D\u0430\u0437\u043D\u0430\u0447\u0438\u0442\u044C \u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u0434\u043B\u044F \u043F\u0430\u0442\u0440\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F");
        return;
      }
      natives__WEBPACK_IMPORTED_MODULE_1__.deletePatrolRoute("miss_".concat(attributes.name));

      //cоздает маршрут
      natives__WEBPACK_IMPORTED_MODULE_1__.openPatrolRoute("miss_".concat(attributes.name));
      nodes.forEach(current => {
        natives__WEBPACK_IMPORTED_MODULE_1__.addPatrolRouteNode(current.index, _this2.defaultConfig.animation, current.position.x, current.position.y, current.position.z, current.rotation.x, current.rotation.y, current.rotation.z, current.waitTime);
      });
      var first = nodes.values().next().value;
      var prev = null;
      nodes.forEach(current => {
        if (current !== first) {
          natives__WEBPACK_IMPORTED_MODULE_1__.addPatrolRouteLink(prev.index, current.index);
        }
        prev = current;
      });
      if (attributes.looped) {
        natives__WEBPACK_IMPORTED_MODULE_1__.addPatrolRouteLink(prev.index, first.index);
      }
      natives__WEBPACK_IMPORTED_MODULE_1__.closePatrolRoute();
      natives__WEBPACK_IMPORTED_MODULE_1__.createPatrolRoute();
      natives__WEBPACK_IMPORTED_MODULE_1__.taskPatrol(ped, "miss_".concat(attributes.name), 0, false, true);
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u043F\u0430\u0442\u0440\u0443\u043B\u044C ".concat(attributes.name, " \u0434\u043B\u044F ped.id ").concat(ped.id, ", ped.scriptID ").concat(ped.scriptID));
    })();
  }
  pedStop(pedID) {
    var ped = this.mainPedMap.get(pedID);
    if (ped.asignedRoute !== null) {
      var data = this.routeManager.getRoute(ped.asignedRoute);
      natives__WEBPACK_IMPORTED_MODULE_1__.deletePatrolRoute("miss_".concat(data.attributes.name));
      ped.asignedRoute = null;
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("\u0423\u0434\u0430\u043B\u0435\u043D \u043C\u0430\u0440\u0448\u0440\u0443\u0442 ".concat(data.attributes.name, " \u0434\u043B\u044F ped ").concat(pedID));
      if (data.attributes.isdebuged === true) {
        data.attributes.isdebuged = false;
        alt_client__WEBPACK_IMPORTED_MODULE_0__.log('route.isdebuged = false => будет повторяться в общем debug');
      }
    } else {
      drawNotification("Ped ".concat(pedID, " \u043D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u043D\u0438\u043A\u0430\u043A\u043E\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442"));
    }
  }
  pedDebug(arg) {
    var ped = this.mainPedMap.get(arg);
    if (ped.isdebuged === false) {
      this.pedDebugTurnOn(ped);
    } else {
      this.pedDebugTurnOff(ped);
    }
  }
  pedDebugTurnOn(ped) {
    if (ped.asignedRoute !== null) {
      this.routeManager.changeIsdebugedStatus(ped.asignedRoute, true);
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('route.isdebuged = true, не будет повторяться в общем debug');
    }
    ped.isdebuged = true;
    //            const ped = this.mainPedMap.get(arg);
    //this.singleDebug
    var timerID = alt_client__WEBPACK_IMPORTED_MODULE_0__.everyTick(() => {
      this.debugVisuals.drawPedVisionCone(ped.entity.pos, ped.entity.scriptID, alt_client__WEBPACK_IMPORTED_MODULE_0__.Player.local.pos);
      if (ped.asignedRoute !== null) {
        var data = this.routeManager.getRoute(ped.asignedRoute);
        this.debugVisuals.connectNodesLine(data.nodes, data.attributes);
        this.debugVisuals.drawRouteMarkers(data.nodes);
      }
    });
    this.singleDebug.set(ped.entity.id, timerID);
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('this.singleDebug', this.singleDebug);
  }
  pedDebugTurnOff(ped) {
    var timerId = this.singleDebug.get(ped.entity.id);
    alt_client__WEBPACK_IMPORTED_MODULE_0__.clearEveryTick(timerId);
    this.singleDebug.delete(ped.entity.id);
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('this.singleDebug', this.singleDebug);
    //            this.singleDebug = null;
    ped.isdebuged = false;
    if (ped.asignedRoute !== null) {
      this.routeManager.changeIsdebugedStatus(ped.asignedRoute, false);
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('route.isdebuged = false, не будет повторяться в общем debug');
    }
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log("pedDebugTurnOff");
  }
  clearPedAssignment(routeID) {
    //pedId
    // обновление asignedRoute в mainPedMap
    this.mainPedMap.forEach(value => {
      if (value.asignedRoute === routeID) {
        // && value.entity.id !== pedId
        value.asignedRoute = null;
      }
    });
  }

  //выводит всю информацию о ped
  pedInfoCommand(arg) {
    var data = this.mainPedMap.get(arg);
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log("data ".concat(data.entity));
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('=== ВСЁ О PED ===');
    for (var key in data.entity) {
      try {
        alt_client__WEBPACK_IMPORTED_MODULE_0__.log("".concat(key, " = ").concat(data.entity[key]));
      } catch (error) {
        // нужно что бы код продолжил выполняться после ошибки если она будет
      }
    }
    var heading = natives__WEBPACK_IMPORTED_MODULE_1__.getEntityHeading(data.entity.scriptID);
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('heading =', heading);
  }

  //выводит всю информацию о ped из map mainPedMap (asignedRoute, isdebuged)
  pedMapCommand() {
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('Весь mainPedMap');
    this.mainPedMap.forEach((value, key) => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("\u041A\u043B\u044E\u0447: ".concat(key));
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('value:', value);
    });
  }

  //доп методы для вызова из других классов

  getPed(pedId) {
    return this.mainPedMap.get(pedId);
  }
  getAllPeds() {
    return this.mainPedMap;
  }

  // перебор всех педов с колбэком
  forEachPed(callback) {
    this.mainPedMap.forEach((pedData, pedId) => {
      // Передаём копию данных, чтобы предотвратить прямое изменение
      callback({
        id: pedId,
        entity: pedData.entity,
        asignedRoute: pedData.asignedRoute,
        isdebuged: pedData.isdebuged
      }, pedId);
    });
  }
}

/***/ }),

/***/ "./client/classes/routeManager.js":
/*!****************************************!*\
  !*** ./client/classes/routeManager.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RouteManager: () => (/* binding */ RouteManager)
/* harmony export */ });
/* harmony import */ var alt_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-client */ "alt-client");
/* harmony import */ var natives__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! natives */ "natives");
/* provided dependency */ var drawNotification = __webpack_require__(/*! ./client/utilities/utilities.js */ "./client/utilities/utilities.js")["drawNotification"];


class RouteManager {
  constructor() {
    this.pedManager = null;
    this.currentRouteMap = new Map(); // текущий маршрут
    this.mainMap = new Map(); // все маршруты на клиенте
    this.currentRouteAttributes = null; //в буддущем массив в котором будут доп знаечния для текщуего массива (looped, asigned, isdebuged)
  }
  //получает pedManager после его успешной инициализацити в PatrolClient
  setPedManager(pedManager) {
    this.pedManager = pedManager;
  }

  //получает route с сервера и добавляет его в mainMap, если такой route еще не добавлен
  initRoutes(route) {
    if (this.mainMap.has(route.id)) {
      drawNotification("route ".concat(route.name, " \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"));
      return;
    }
    this.initializeMap(route);
  }
  initializeMap(route) {
    this.currentRouteAttributes = {
      //запоминает доп параметры маршрута
      id: route.id,
      name: route.name,
      looped: route.looped,
      asigned: null,
      isdebuged: false
    };
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('currentRouteAttributes', JSON.stringify(this.currentRouteAttributes));
    this.currentRouteMap = new Map();
    //this.currentRouteMap.clear();    //делает map пустым (на случай если уже существует актинвый map с которым воыполняется работа до этого initializeMap)

    route.nodes.forEach(node => {
      this.currentRouteMap.set(node.index, node);
    });
    this.mainMap.set(route.id, {
      attributes: this.currentRouteAttributes,
      nodes: this.currentRouteMap
    });
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('mainMap:');
    this.mainMap.forEach((_ref, id) => {
      var {
        attributes,
        nodes
      } = _ref;
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("Route ID: ".concat(id, ", looped: ").concat(attributes.looped));
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log(nodes);
    });
  }

  //сменить текущий route (route к которому добавляются и удаляются nodes)
  switchCurrentRoute(routeID) {
    if (this.mainMap.has(routeID) === false) {
      drawNotification("Route \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u043D\u0430 \u043A\u043B\u0438\u0435\u043D\u0442");
      drawNotification("\u0427\u0442\u043E \u0431\u044B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C Route \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 /load");
      return;
    }
    var data = this.mainMap.get(routeID);
    //this.initializeMap(data);
    this.currentRouteAttributes = {
      //запоминает доп параметры маршрута
      id: data.attributes.id,
      name: data.attributes.name,
      looped: data.attributes.looped,
      asigned: data.attributes.asigned,
      isdebuged: data.attributes.isdebuged
    };
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('currentRouteAttributes После switch:', JSON.stringify(this.currentRouteAttributes));
    this.currentRouteMap = new Map();
    data.nodes.forEach(node => {
      this.currentRouteMap.set(node.index, node);
    });
    // из за того кто был создан new Map(), нужно заново делать this.mainMap.set что бы все последущие изменения в this.currentRouteMap корректно отображались в this.mainMap
    this.mainMap.set(routeID, {
      attributes: this.currentRouteAttributes,
      nodes: this.currentRouteMap
    });
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('currentRouteMap После switch:', JSON.stringify(this.currentRouteMap));
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('Сменилась текщуий route на route =', data.attributes.name);
  }

  //добавить ноду к текущему маршруту
  addNodeTocurrentRouteMap(coords, lookingCoords, arg) {
    //если currentRouteAttributes === null значит route был очищенн (/clear), либо route еще не был скачан
    if (!this.currentRouteAttributes) {
      drawNotification("\u041D\u0435\u043B\u044C\u0437\u044F \u0434\u043E\u0430\u0432\u043B\u044F\u0442\u044C \u043D\u043E\u0434\u044B \u0432 \u043D\u0435\u0441\u0443\u0449\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0439 route");
      return;
    }
    if (this.currentRouteMap.has(arg) === true) {
      drawNotification("\u041D\u043E\u0434\u0430 \u0441 \u043D\u043E\u043C\u0435\u0440\u043E\u043C ".concat(arg, " \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"));
      drawNotification("\u0423\u0434\u0430\u043B\u0438\u0442\u0435 \u043D\u043E\u0434\u0443 \u0441 \u043D\u043E\u043C\u0435\u0440\u043E\u043C ".concat(arg, " \u0438\u043B\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u043D\u043E\u043C\u0435\u0440"));
      return;
    }
    var newnode = {
      index: arg,
      position: {
        x: coords.x,
        y: coords.y,
        z: coords.z
      },
      rotation: {
        x: lookingCoords.x,
        y: lookingCoords.y,
        z: lookingCoords.z
      },
      //координаты на которые будет смотреть ped 
      waitTime: 1000
    };
    //все ноды идут в порядке возрастания что бы при добавлении ноды она не вставала в конец map
    // и не происходили ситуации когда ped следует по маршруту по точками 1-> 9-> 4-> 2-> 5-> 7-> 0

    //создает массив из значений map, так как значения массива проще сортировать чем значения map
    var tempArray = Array.from(this.currentRouteMap.entries());
    //добавляет в новую ноду с ее значениями
    tempArray.push([arg, newnode]);
    //сортирует массив по его key, что бы ноды шли в возрастающем порядке key (в случае с моим map key всегда равны index)
    tempArray.sort((a, b) => a[0] - b[0]);
    //очищает прошлый map что бы его можно было заполнить новыми отсортированными значениями
    this.currentRouteMap.clear();
    this.currentRouteMap = new Map(tempArray);
    // из за того кто был создан new Map(), нужно заново делать this.mainMap.set что бы все последущие изменения в this.currentRouteMap корректно отображались в this.mainMap
    this.mainMap.set(this.currentRouteAttributes.id, {
      attributes: this.currentRouteAttributes,
      nodes: this.currentRouteMap
    });
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('currentRouteMap после добавления новой ноды');
    this.currentRouteMap.forEach((value, key) => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("\u041A\u043B\u044E\u0447: ".concat(key));
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('value:', value);
    });
  }
  dellNodeFromMap(arg) {
    if (this.currentRouteMap.has(arg) === false) {
      drawNotification("\u041D\u043E\u0434\u0430 \u0441 \u043D\u043E\u043C\u0435\u0440\u043E\u043C ".concat(arg, " \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"));
      drawNotification("\u041D\u0435\u043B\u044C\u0437\u044F \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0442\u043E \u0447\u0435\u0433\u043E \u043D\u0435\u0442");
      return;
    }
    this.currentRouteMap.delete(arg); // удалить из map все значения записанные под ключом arg
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('Весь Map после удаления ноды');
    this.mainMap.forEach((_ref2, id) => {
      var {
        attributes,
        nodes
      } = _ref2;
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("Route ID: ".concat(id, ", looped: ").concat(attributes.looped));
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log(nodes);
    });
  }

  //очищает текущий маршрут и удаляет его из mainMap + останавливает ped которому был назначен этот маршрут
  clearCurrentRoute() {
    if (!this.currentRouteAttributes) {
      // && this.currentRouteMap.size === 0
      drawNotification("\u0422\u0435\u043A\u0449\u0443\u0438\u0439 route \u043F\u0443\u0441\u0442\u043E\u0439");
      drawNotification("\u041D\u0435\u043B\u044C\u0437\u044F \u043E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u041F\u0423\u0421\u0422\u041E\u0419 route");
      return;
    }
    var tempID = this.currentRouteAttributes.id;
    if (this.currentRouteAttributes.asigned !== null) {
      natives__WEBPACK_IMPORTED_MODULE_1__.deletePatrolRoute("miss_".concat(this.currentRouteAttributes.name));
    }
    //что бы не пришлось переприсваивать очщенные значения this.currentRouteAttributes и this.currentRouteMap
    this.mainMap.delete(tempID);
    this.currentRouteAttributes = null;
    this.currentRouteMap.clear();
    //так как произошел deletePatrolRoute ped больше не назначен маршрут и нужно сделать asignedRoute = null если сущуствовал ped с таким маршрутом
    this.pedManager.clearPedAssignment(tempID);
  }

  //отправляет на сервер текущий маршрут для сохранения его в общий список маршрутов в routePoints.json
  sendRouteMap() {
    if (this.currentRouteMap.size === 0) {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('Попытка сохранить пустой route');
      drawNotification("\u041D\u0435\u043B\u044C\u0437\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C \u041F\u0423\u0421\u0422\u041E\u0419 route");
      return;
    }
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('askForRouteMap + sendRouteMap');
    //сохраняет в массив все данные о маршруте которые нужно будет отправить на сервер для сохранения в таком же виде
    var savingArray = {
      id: this.currentRouteAttributes.id,
      name: this.currentRouteAttributes.name,
      looped: this.currentRouteAttributes.looped,
      nodes: Array.from(this.currentRouteMap.values())
    };
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('savingArray:', JSON.stringify(savingArray));
    alt_client__WEBPACK_IMPORTED_MODULE_0__.emitServer('patrol:sendRouteMap', savingArray);
  }

  //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.currentRouteMap + currentRouteAttributes
  printAllRoutesInfo() {
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('Весь mainMap');
    this.mainMap.forEach((value, key) => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("\u041A\u043B\u044E\u0447: ".concat(key));
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('value:', value);
    });
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('===========================================================');
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('this.currentRouteMap:');
    this.currentRouteMap.forEach((value, key) => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("\u041A\u043B\u044E\u0447: ".concat(key));
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('value:', value);
    });
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('===========================================================');
    alt_client__WEBPACK_IMPORTED_MODULE_0__.log('this.currentRouteAttributes:', JSON.stringify(this.currentRouteAttributes));
  }

  //доп методы для вызова из других классов

  hasRoute(routeID) {
    return this.mainMap.has(routeID);
  }
  getRoute(routeID) {
    return this.mainMap.get(routeID);
  }
  changeIsdebugedStatus(routeID, status) {
    if (status === true || status === false) {
      this.mainMap.get(routeID).attributes.isdebuged = status;
    } else {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('Некорректное использование changeIsdebugedStatus');
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('status может быть только true или false');
      return;
    }
  }

  // перебор всех маршрутов с колбэком
  forEachRoute(callback) {
    this.mainMap.forEach((value, routeId) => {
      callback(value.attributes, value.nodes, routeId);
    });
  }
}

/***/ }),

/***/ "./client/config/clientConfig.js":
/*!***************************************!*\
  !*** ./client/config/clientConfig.js ***!
  \***************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultClientConfig: () => (/* binding */ defaultClientConfig)
/* harmony export */ });
var defaultClientConfig = {
  markerScale: {
    x: 0.5,
    y: 0.5,
    z: 0.5
  },
  animation: "StandGuard",
  markerType: 10,
  markerColour: {
    r: 255,
    g: 255,
    b: 255,
    a: 255
  },
  viewDistance: 4,
  // длина конуса
  viewAngle: 80,
  // угол обзора (градусы)
  viewSectors: 7 //количество секторов видимости у ped
};
//defaultConfig

/***/ }),

/***/ "./client/utilities/utilities.js":
/*!***************************************!*\
  !*** ./client/utilities/utilities.js ***!
  \***************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   drawNotification: () => (/* binding */ drawNotification)
/* harmony export */ });
/* harmony import */ var alt_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-client */ "alt-client");
/* harmony import */ var natives__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! natives */ "natives");



//вызов гташных уведмолени с помощью нативок 
function drawNotification(message) {
  var autoHide = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  natives__WEBPACK_IMPORTED_MODULE_1__.beginTextCommandThefeedPost('STRING');
  natives__WEBPACK_IMPORTED_MODULE_1__.addTextComponentSubstringPlayerName("~r~".concat(message));
  var notificationId = natives__WEBPACK_IMPORTED_MODULE_1__.endTextCommandThefeedPostTicker(false, false);
  // Таймер для скрытия уведомления через 3 секунды если кроме текста сообщения также передали true
  if (autoHide) {
    alt_client__WEBPACK_IMPORTED_MODULE_0__.setTimeout(() => {
      natives__WEBPACK_IMPORTED_MODULE_1__.thefeedRemoveItem(notificationId);
    }, 3000);
  }
}

/***/ }),

/***/ "alt-client":
/*!*****************************!*\
  !*** external "alt-client" ***!
  \*****************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_alt_client_680395b4__;

/***/ }),

/***/ "natives":
/*!**************************!*\
  !*** external "natives" ***!
  \**************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_natives__;

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
  !*** ./client/startClient.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var alt_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! alt-client */ "alt-client");
/* harmony import */ var _config_clientConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config/clientConfig.js */ "./client/config/clientConfig.js");
/* harmony import */ var _classes_routeManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./classes/routeManager.js */ "./client/classes/routeManager.js");
/* harmony import */ var _classes_pedManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./classes/pedManager.js */ "./client/classes/pedManager.js");
/* harmony import */ var _classes_debugManager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./classes/debugManager.js */ "./client/classes/debugManager.js");
/* harmony import */ var _classes_debugVisuals_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./classes/debugVisuals.js */ "./client/classes/debugVisuals.js");






class PatrolClient {
  constructor() {
    this.debugVisuals = new _classes_debugVisuals_js__WEBPACK_IMPORTED_MODULE_5__.DebugVisuals(_config_clientConfig_js__WEBPACK_IMPORTED_MODULE_1__.defaultClientConfig); //класс для визуального отображения debug

    this.routeManager = new _classes_routeManager_js__WEBPACK_IMPORTED_MODULE_2__.RouteManager();
    this.pedManager = new _classes_pedManager_js__WEBPACK_IMPORTED_MODULE_3__.PedManager(this.routeManager, this.debugVisuals, _config_clientConfig_js__WEBPACK_IMPORTED_MODULE_1__.defaultClientConfig);
    this.debugManager = new _classes_debugManager_js__WEBPACK_IMPORTED_MODULE_4__.DebugManager(this.pedManager, this.routeManager, this.debugVisuals);
    this.routeManager.setPedManager(this.pedManager);
    this.init();
  }
  init() {
    //выводит всю информацию о ped
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:pedinfo', arg => {
      this.pedManager.pedInfoCommand(arg);
    });
    //выводит все значения записанные на клиенте в mainmap (какие маршруты загружены на клиенте) + this.currentRouteMap + currentRouteAttributes
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:route', () => {
      this.routeManager.printAllRoutesInfo();
    });
    //выводит всю информацию о ped из map mainPedMap (asignedRoute, isdebuged)
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:pedMap', () => {
      this.pedManager.pedMapCommand();
    });
    //при появлении ped в стрим зоне игрока (если не ped return)
    alt_client__WEBPACK_IMPORTED_MODULE_0__.on('gameEntityCreate', entity => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('gameEntityCreate, entity:', entity);
      if (!(entity instanceof alt_client__WEBPACK_IMPORTED_MODULE_0__.Ped)) return;
      this.pedManager.entityInitialize(entity);
    });

    //получает route с сервера и добавляет его в mainMap, если такой route еще не добавлен
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:initRoutes', route => {
      this.routeManager.initRoutes(route);
    });
    //отсанавливает ped (deletePatrolRoute) если ему назначен маршрут + отключает ped debug у маршрута и изменяет данные в pedmap (asignedRoute, isdebuged)
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:pedStop', arg => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("ped ".concat(arg, " Stop"));
      this.pedManager.pedStop(arg);
    });
    //включает debug для конкретного ped (его область видимости и его маршрут если у него есть asignedRoute)
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:pedDebug', arg => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("ped ".concat(arg, " Debug"));
      this.pedManager.pedDebug(arg);
    });

    //отображать debug, после команды с сервера
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:debugTurnOn', () => {
      this.debugManager.turnOnGlobalDebug();
    });

    //выключать debug, после команды с сервера
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:debugTurnOff', () => {
      this.debugManager.turnOffGlobalDebug();
    });
    //сменить текущий route (route к которому добавляются и удаляются nodes)
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:switchCurrentRoute', routeID => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('routeID:', routeID);
      this.routeManager.switchCurrentRoute(routeID);
    });
    //назначить ped текущий маршрут 
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:asignCurrentRouteToPed', (arg, routeID) => {
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log('arg', arg);
      this.pedManager.asignRouteToPed(arg, routeID);
    });
    //добавить ноду к текущему маршруту
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:addNode', (coords, lookingCoords, arg) => {
      this.routeManager.addNodeTocurrentRouteMap(coords, lookingCoords, arg);
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("addnode");
    });
    //удалить ноду из текущего маршрута
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:dellNode', arg => {
      this.routeManager.dellNodeFromMap(arg);
      alt_client__WEBPACK_IMPORTED_MODULE_0__.log("dellNode");
    });
    //отправляет на сервер текущий маршрут для сохранения его в общий список маршрутов в routePoints.json
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:askForRouteMap', () => {
      this.routeManager.sendRouteMap();
    });
    //очищает текущий маршрут и удаляет его из mainMap
    alt_client__WEBPACK_IMPORTED_MODULE_0__.onServer('patrol:clearCurrentRoute', () => {
      this.routeManager.clearCurrentRoute();
    });
  }
}
new PatrolClient();
})();

