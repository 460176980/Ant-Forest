/*
 * @Author: TonyJiangWJ
 * @Date: 2019-11-05 09:12:00
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2019-12-10 22:37:59
 * @Description: 
 */
let _config = typeof config === 'undefined' ? require('../config.js').config : config
let _commonFunctions = typeof commonFunctions === 'undefined' ? require('../lib/CommonFunction.js') : commonFunctions

let _own_text = null

/**
 * 查找没有更多了控件是否存在
 * 
 * @param {number} sleepTime 超时时间
 */
const foundNoMoreWidget = function (sleepTime) {
  let sleep = sleepTime || _config.timeout_findOne
  let noMoreWidgetHeight = 0

  let noMoreWidget = widgetGetOne(_config.no_more_ui_content, sleep, false, true)
  if (noMoreWidget) {
    let bounds = noMoreWidget.bounds()
    debugInfo("找到控件: [" + bounds.left + ", " + bounds.top + ", " + bounds.right + ", " + bounds.bottom + "]")
    noMoreWidgetHeight = bounds.bottom - bounds.top
    debugInfo('"没有更多了" 当前控件高度:' + noMoreWidgetHeight)
    return true
  }
  return false
}

/**
 * 校验控件是否存在，并打印相应日志
 * @param {String} contentVal 控件文本
 * @param {String} position 日志内容 当前所在位置是否成功进入
 * @param {Number} timeoutSetting 超时时间 默认为_config.timeout_existing
 */
const widgetWaiting = function (contentVal, position, timeoutSetting) {
  let waitingSuccess = widgetCheck(contentVal, timeoutSetting)

  if (waitingSuccess) {
    debugInfo('成功进入' + position)
    return true
  } else {
    errorInfo('进入' + position + '失败')
    return false
  }
}

/**
 * 校验控件是否存在
 * @param {String} contentVal 控件文本
 * @param {Number} timeoutSetting 超时时间 不设置则为_config.timeout_existing
 * 超时返回false
 */
const widgetCheck = function (contentVal, timeoutSetting) {
  let timeout = timeoutSetting || _config.timeout_existing
  let timeoutFlag = true
  let countDown = new java.util.concurrent.CountDownLatch(1)
  let matchRegex = new RegExp(contentVal)
  let descThread = threads.start(function () {
    descMatches(matchRegex).waitFor()
    let res = descMatches(matchRegex).findOne().desc()
    debugInfo('find desc ' + contentVal + " " + res)
    timeoutFlag = false
    countDown.countDown()
  })

  let textThread = threads.start(function () {
    textMatches(matchRegex).waitFor()
    let res = textMatches(matchRegex).findOne().text()
    debugInfo('find text ' + contentVal + "  " + res)
    timeoutFlag = false
    countDown.countDown()
  })

  let timeoutThread = threads.start(function () {
    sleep(timeout)
    countDown.countDown()
  })
  countDown.await()
  descThread.interrupt()
  textThread.interrupt()
  timeoutThread.interrupt()
  return !timeoutFlag
}

/**
 * id检测
 * @param {string|RegExp} idRegex 
 * @param {number} timeoutSetting 
 */
const idCheck = function (idRegex, timeoutSetting) {
  let timeout = timeoutSetting || _config.timeout_existing
  let timeoutFlag = true
  let countDown = new java.util.concurrent.CountDownLatch(1)
  let idCheckThread = threads.start(function () {
    idMatches(idRegex).waitFor()
    debugInfo('find id ' + idRegex)
    timeoutFlag = false
    countDown.countDown()
  })

  let timeoutThread = threads.start(function () {
    sleep(timeout)
    countDown.countDown()
  })
  countDown.await()
  idCheckThread.interrupt()
  timeoutThread.interrupt()
  return !timeoutFlag
}

/**
 * 校验控件是否存在，并打印相应日志
 * @param {String} idRegex 控件文本
 * @param {String} position 日志内容 当前所在位置是否成功进入
 * @param {Number} timeoutSetting 超时时间 默认为_config.timeout_existing
 */
const idWaiting = function (idRegex, position, timeoutSetting) {
  let waitingSuccess = idCheck(idRegex, timeoutSetting)

  if (waitingSuccess) {
    debugInfo('成功进入' + position)
    return true
  } else {
    errorInfo('进入' + position + '失败')
    return false
  }
}

/**
 * 校验是否成功进入自己的首页
 */
const homePageWaiting = function () {
  if (widgetCheck(_config.friend_home_ui_content, 500)) {
    errorInfo('错误位置：当前所在位置为好友首页')
    return false;
  }
  if (idCheck(_config.friend_list_id, 500)) {
    errorInfo('错误位置：当前所在位置为好友排行榜')
    return false;
  }
  return widgetWaiting(_config.home_ui_content, '个人首页')
}

/**
 * 校验是否成功进入好友首页
 */
const friendHomeWaiting = function () {
  return widgetWaiting(_config.friend_home_ui_content, '好友首页')
}

/**
 * 校验是否成功进入好友排行榜
 */
const friendListWaiting = function () {
  if (_config.base_on_image) {
    let found = false
    let checkTime = 5
    while (!found && checkTime-- > 0) {
      let img = _commonFunctions.checkCaptureScreenPermission()
      let point = images.findColor(img, '#1d9f4e', {
        region: [170, 230, 810, 100],
        threshold: _config.color_offset
      })
      found = point !== null
      sleep(1000)
    }
    return found
  } else {
    return idWaiting(_config.friend_list_id, '好友排行榜')
  }
}

/**
 * 根据内容获取一个对象
 * 
 * @param {string} contentVal 
 * @param {number} timeout 
 * @param {boolean} containType 是否带回类型
 * @param {boolean} suspendWarning 是否隐藏warning信息
 */
const widgetGetOne = function (contentVal, timeout, containType, suspendWarning) {
  let target = null
  let isDesc = false
  let waitTime = timeout || _config.timeout_findOne
  let timeoutFlag = true
  let matchRegex = new RegExp(contentVal)
  if (textMatches(matchRegex).exists()) {
    debugInfo('text ' + contentVal + ' found')
    target = textMatches(matchRegex).findOne(waitTime)
    timeoutFlag = false
  } else if (descMatches(matchRegex).exists()) {
    isDesc = true
    debugInfo('desc ' + contentVal + ' found')
    target = descMatches(matchRegex).findOne(waitTime)
    timeoutFlag = false
  } else {
    debugInfo('none of text or desc found for ' + contentVal)
  }
  // 当需要带回类型时返回对象 传递target以及是否是desc
  if (target && containType) {
    let result = {
      target: target,
      isDesc: isDesc
    }
    return result
  }
  if (timeoutFlag) {
    if (suspendWarning) {
      debugInfo('timeout for finding ' + contentVal)
    } else {
      warnInfo('timeout for finding ' + contentVal)
    }
  }
  return target
}

/**
 * 根据内容获取所有对象的列表
 * 
 * @param {string} contentVal 
 * @param {number} timeout 
 * @param {boolean} containType 是否传递类型
 */
const widgetGetAll = function (contentVal, timeout, containType) {
  let target = null
  let isDesc = false
  let timeoutFlag = true
  let countDown = new java.util.concurrent.CountDownLatch(1)
  let waitTime = timeout || _config.timeout_findOne
  let matchRegex = new RegExp(contentVal)
  let findThread = threads.start(function () {
    if (textMatches(matchRegex).exists()) {
      debugInfo('text ' + contentVal + ' found')
      target = textMatches(matchRegex).untilFind()
      timeoutFlag = false
    } else if (descMatches(matchRegex).exists()) {
      isDesc = true
      debugInfo('desc ' + contentVal + ' found')
      target = descMatches(matchRegex).untilFind()
      timeoutFlag = false
    } else {
      debugInfo('none of text or desc found for ' + contentVal)
    }
    countDown.countDown()
  })
  let timeoutThread = threads.start(function () {
    sleep(waitTime)
    countDown.countDown()
    warnInfo('timeout for finding ' + contentVal)
  })
  countDown.await()
  findThread.interrupt()
  timeoutThread.interrupt()
  if (timeoutFlag && !target) {
    return null
  } else if (target && containType) {
    let result = {
      target: target,
      isDesc: isDesc
    }
    return result
  }
  return target
}

/**
 * 加载好友排行榜列表
 * @deprecated 新版蚂蚁森林不可用
 */
const loadFriendList = function () {
  logInfo('正在展开好友列表请稍等。。。', true)
  let start = new Date()
  let timeout = true
  let countDown = new java.util.concurrent.CountDownLatch(1)
  let loadThread = threads.start(function () {
    while ((more = idMatches(".*J_rank_list_more.*").findOne(200)) != null) {
      more.click()
    }
  })
  let foundNoMoreThread = threads.start(function () {
    widgetCheck(_config.no_more_ui_content, _config.timeoutLoadFriendList || _config.timeout_existing)
    timeout = false
    countDown.countDown()
  })
  let timeoutThread = threads.start(function () {
    sleep(_config.timeoutLoadFriendList || _config.timeout_existing)
    errorInfo("预加载好友列表超时")
    countDown.countDown()
  })
  countDown.await()
  let end = new Date()
  logInfo('好友列表展开' + (timeout ? '超时' : '完成') + ', cost ' + (end - start) + ' ms', true)
  // 调试模式时获取信息
  if (_config.show_debug_log) {
    let friendList = getFriendListParent()
    if (friendList && friendList.children) {
      debugInfo('好友列表长度：' + friendList.children().length)
    }
  }
  loadThread.interrupt()
  foundNoMoreThread.interrupt()
  timeoutThread.interrupt()
  return timeout
}

/**
 * 获取排行榜好友列表
 * @deprecated 新版蚂蚁森林不可用
 */
const getFriendListOld = function () {
  let friends_list = null
  if (idMatches('J_rank_list_append').exists()) {
    debugInfo('newAppendList')
    friends_list = idMatches('J_rank_list_append').findOne(
      _config.timeout_findOne
    )
  } else if (idMatches('J_rank_list').exists()) {
    debugInfo('oldList')
    friends_list = idMatches('J_rank_list').findOne(
      _config.timeout_findOne
    )
  }
  return friends_list
}

const getFriendListParent = function getFriendRoot () {
  let anyone = null
  let regex = /[.\d]+[kgt]+$/
  let countdown = new Countdown()
  if (textMatches(regex).exists()) {
    anyone = textMatches(regex).findOnce(1)
    debugInfo('当前获取到的能量值内容：' + anyone.text())
  } else if (descMatches(regex).exists()) {
    debugInfo('当前获取到的能量值内容：' + anyone.desc())
    anyone = descMatches(regex).findOnce(1)
  }
  countdown.summary('获取能量值控件')
  if (anyone) {
    try {
      return anyone.parent().parent().parent()
    } catch (e) {
      errorInfo('获取能量值控件失败' + e)
    }
  } else {
    errorInfo('获取能量值控件失败')
  }
}


function Countdown () {
  this.start = new Date().getTime()
  this.getCost = function () {
    return new Date().getTime() - this.start
  }

  this.summary = function (content) {
    debugInfo(content + '耗时' + this.getCost() + 'ms')
  }

}

const getOwntext = function () {
  let anyone = null
  let regex = /[.\d]+[kgt]+$/
  let countdown = new Countdown()
  if (textMatches(regex).exists()) {
    anyone = textMatches(regex).findOne(1000)
    debugInfo('当前获取到的内容：' + anyone.text())
  } else if (descMatches(regex).exists()) {
    debugInfo('当前获取到的内容：' + anyone.desc())
    anyone = descMatches(regex).findOne(1000)
  }
  countdown.summary('获取能量值控件')
  if (anyone) {
    try {
      let ownElement = anyone.parent().parent().children()[2].children()[0].children()[0]
      return ownElement.text() || ownElement.desc()
    } catch (e) {
      errorInfo(e)
      return null
    } finally {
      countdown.summary('分析自身id')
    }
  }

}

/**
   * 获取好友昵称
   * 
   * @param {Object} fri 
   */
const getFriendsName = function (fri) {
  try {
    let nameContainer = fri.child(2).child(0).child(0)
    return nameContainer.text() || nameContainer.desc()
  } catch (e) {
    errorInfo('获取好友名称失败:' + e)
  }
}
/**
 * 快速下滑 
 * 用来统计最短时间
 */
const quickScrollDown = function () {
  do {
    automator.scrollDown(50)
  } while (
    !foundNoMoreWidget(50)
  )
}

/**
 * 等待排行榜稳定
 * 即不在滑动过程
 */
const waitRankListStable = function () {
  let startPoint = new Date()
  debugInfo('等待列表稳定')
  let compareBottomVal = getJRankSelfBottom()
  let size = _config.friendListStableCount || 3
  if (size <= 1) {
    size = 2
  }
  let bottomValQueue = _commonFunctions.createQueue(size)
  while (_commonFunctions.getQueueDistinctSize(bottomValQueue) > 1) {
    compareBottomVal = getJRankSelfBottom()
    if (compareBottomVal === undefined && ++invalidCount > 10) {
      warnInfo('获取坐标失败次数超过十次')
      break
    } else {
      _commonFunctions.pushQueue(bottomValQueue, size, compareBottomVal)
      debugInfo(
        '添加参考值：' + compareBottomVal +
        '队列重复值数量：' + _commonFunctions.getQueueDistinctSize(bottomValQueue)
      )
    }
  }
  debugInfo('列表已经稳定 等待列表稳定耗时[' + (new Date() - startPoint) + ']ms，不可接受可以调小config.js中的friendListStableCount')
}



/**
 * 获取列表中自己的底部高度
 */
const getJRankSelfBottom = function () {
  let maxTry = 50
  // TODO 当前own_text设为了null，如果设为具体值反而更慢 暂时就这样吧
  while (maxTry-- > 0) {
    try {
      try {
        return textMatches(_own_text).findOnce(1).bounds().bottom;
      } catch (e) {
        try {
          return descMatches(_own_text).findOnce(1).bounds().bottom;
        } catch (e2) {
          // nothing to do here
        }
      }
    } catch (e) {
      // nothing to do here
    }
  }
  return null
}

const getYouCollectEnergy = function () {
  let youGet = widgetGetOne('你收取TA')
  if (youGet && youGet.parent) {
    let youGetParent = youGet.parent()
    let childSize = youGetParent.children().length
    debugInfo('你收取TA父级控件拥有子控件数量：' + childSize)
    let energySum = youGetParent.child(childSize - 1)
    if (energySum) {
      if (energySum.desc()) {
        return energySum.desc().match(/\d+/)
      } else if (energySum.text()) {
        return energySum.text().match(/\d+/)
      }
    }
  }
  return undefined
}

const getFriendEnergy = function () {
  let energyWidget = widgetGetOne(/\d+g/)
  if (energyWidget) {
    if (energyWidget.desc()) {
      return energyWidget.desc().match(/\d+/)
    } else {
      return energyWidget.text().match(/\d+/)
    }
  }
  return null
}


/**
 * 给好友浇水
 */
const wateringFriends = function () {
  let wateringWidget = widgetGetOne(_config.watering_widget_content)
  if (wateringWidget) {
    let bounds = wateringWidget.bounds()
    automator.click(bounds.centerX(), bounds.centerY())
    debugInfo('found wateringWidget:' + wateringWidget.bounds())
  } else {
    errorInfo('未找到浇水按钮')
  }
}

module.exports = {
  foundNoMoreWidget: foundNoMoreWidget,
  widgetWaiting: widgetWaiting,
  widgetCheck: widgetCheck,
  idWaiting: idWaiting,
  idCheck: idCheck,
  homePageWaiting: homePageWaiting,
  friendHomeWaiting: friendHomeWaiting,
  friendListWaiting: friendListWaiting,
  widgetGetOne: widgetGetOne,
  widgetGetAll: widgetGetAll,
  loadFriendList: loadFriendList,
  getFriendListParent: getFriendListParent,
  getFriendsName: getFriendsName,
  quickScrollDown: quickScrollDown,
  waitRankListStable: waitRankListStable,
  getJRankSelfBottom: getJRankSelfBottom,
  getYouCollectEnergy: getYouCollectEnergy,
  getFriendEnergy: getFriendEnergy,
  wateringFriends: wateringFriends,
  getOwntext: getOwntext
}