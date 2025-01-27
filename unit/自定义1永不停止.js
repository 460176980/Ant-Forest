/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-10 19:41:12
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2019-12-10 23:07:44
 * @Description: 
 */
var {default_config, storage_name} = require('../config.js')
var configStorage = storages.create(storage_name)
var FileUtils = require("../lib/FileUtils.js")
var commonFunctions = require("../lib/CommonFunction.js")
Object.keys(default_config).forEach((key)=>{
  log(key + ":" + configStorage.get(key))
})

configStorage.put("never_stop", true)
configStorage.put("is_cycle", false)
configStorage.put("reactive_time", 30)
configStorage.put("collect_self_only", false)
toastLog("配置完毕done")
commonFunctions.killRunningScript()
commonFunctions.setUpAutoStart(0.1)