export default {
  "presets": [  // пресеты определяют какие преобразования JavaScript кода будут применены
    [ //массив пресетов
      //@babel/preset-env пресет который автоматически определяет какие преобразования нужны для поддержки указанных версий браузеров/Node.js (используется почтьи везде всегда)
      "@babel/preset-env",
      { //настройки для @babel/preset-env
        //targets определяет целевые среды выполнения кода (будет преобразовывать только тот синтаксис, который не поддерживается в указанных версиях)
        "targets": {
          "chrome": "90", //нужен для es2020 ( и JavaScript ?)
          "node": "16"  // так как 'node16' target в webpack.config.js
        },
        "shippedProposals": true,
        // "modules" - определяет как преобразовывать модули (import/export)
        "modules": "auto",  // Webpack настроен на ES модули, поэтому import/export сохранятся
        // "useBuiltIns" - настройка полифиллов для встроенных объектов JavaScript
        //false что бы не было конфликов с нативками altv
        "useBuiltIns": false,  // нужен для того что бы babel не добавлял полифиллы для Promise, Map, Set и т.д
      }
    ]
 ]
}