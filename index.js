const _ = require ('lodash')
const fs = require ('fs')
const path = require ('path')

// use long variable name to avoid be used
global.__$AppRequireStartSymbol = '@'
global.__$AppRequireMap = {}

//* $require exist in global,us $$require instead *
if (global.$require) {
    global.$$require = $require
} else {
    global.$require = $require
}

// set start symbol,default '@'
function setAppRequireModuleStartSymbol (start_symbol) {
    global.__$AppRequireStartSymbol = start_symbol || '@'
}

// register path for short require
function registerRequireShortPath (register_path) {
    global.__$AppRequireMap = global.__$AppRequireMap || {}

    if (_.isString (register_path)) {
        register_path = [ register_path ]
    } else if (!_.isArray (register_path)) {
        return
    }

    _.forEach (register_path, function (module_path) {
        if (!fs.existsSync (module_path)) {
            return true
        }

        let module_stats = fs.lstatSync (module_path)
        if (module_stats.isDirectory ()) {
            let moduleMap = __traversalDir (module_path, global.__$AppRequireStartSymbol)

            _.assign (global.__$AppRequireMap, moduleMap)
        } else if (module_stats.isFile ()) {
            global.__$AppRequireMap[ global.__$AppRequireStartSymbol + path.basename (module_path, '.js') ] = module_path
        }
    })
}

registerRequireShortPath.startSymbol = setAppRequireModuleStartSymbol

// require short function
function $require (app_inner_module) {
    if (!_.isString (app_inner_module)) {
        return
    }

    if (app_inner_module.charAt (0) !== global.__$AppRequireStartSymbol) {
        try {
            return require (app_inner_module)
        } catch (ex) {
            return require (path.resolve (app_inner_module))
        }
    }

    var app_inner_module_path = __getAppRequireModulePath (app_inner_module)

    return require (app_inner_module_path)
}

function __getAppRequireModulePath (module_key) {
    var appRequireMap = global.__$AppRequireMap || {}

    return appRequireMap[ module_key ] || ''
}

function __traversalDir (dir_path, mod_prefix) {
    if (!fs.existsSync (dir_path)) {
        return
    }

    var ret = {},
        dir_name = path.basename (dir_path),
        files = fs.readdirSync (dir_path)

    _.forEach (files, function (file) {

        var
            file_path = path.resolve (dir_path, file),
            stats = fs.lstatSync (file_path)

        if (stats.isDirectory ()) {
            var sub_ret = __traversalDir (file_path, mod_prefix + dir_name + '/')

            if (sub_ret) {

                _.assign (ret, sub_ret)
            }
        } else {
            ret[ mod_prefix + dir_name + '/' + path.basename (file, '.js') ] = file_path
        }
    })

    return ret
}

module.exports = registerRequireShortPath