/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-09 20:42:08
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2019-12-11 22:11:30
 * @Description: 
 */
"ui";
let inRunningMode = false
let currentEngine = engines.myEngine().getSource() + ''
if (currentEngine.endsWith('/config.js')) {
  inRunningMode = true
}

importClass(android.text.TextWatcher)
importClass(android.view.View)
importClass(android.view.MotionEvent)

let default_config = {
  password: '',
  color_offset: 40,
  // 是否显示状态栏的悬浮窗，避免遮挡，悬浮窗位置可以通过后两项配置修改 min_floaty_x[y]
  show_small_floaty: true,
  notLingeringFloatWindow: false,
  min_floaty_x: 150,
  min_floaty_y: 20,
  min_floaty_color: '#00ff00',
  help_friend: true,
  is_cycle: false,
  collect_self_only: false,
  base_on_image: false,
  // 基于图像分析时 在好友排行榜下拉的次数，因为无法辨别是否已经达到了最低点
  // friendListScrollTime: 30,
  // 可收取小手指绿色像素点个数，1080P分辨率是这个数值，其他分辨率请自己修改
  finger_img_pixels: 2300,
  cycle_times: 10,
  never_stop: false,
  reactive_time: 60,
  timeout_unlock: 1000,
  timeout_findOne: 1000,
  timeout_existing: 8000,
  max_collect_repeat: 20,
  max_collect_wait_time: 60,
  show_debug_log: true,
  auto_lock: false,
  lock_x: 150,
  lock_y: 970,
  // 是否根据当前锁屏状态来设置屏幕亮度，当锁屏状态下启动时 设置为最低亮度，结束后设置成自动亮度
  autoSetBrightness: false,
  request_capture_permission: true,
  // 是否保存日志文件，如果设置为保存，则日志文件会按时间分片备份在logback/文件夹下
  saveLogFile: true,
  back_size: '100',
  white_list: [],

  // 只在AutoJS中能打开，定时不能打开时 尝试开启这个 设为true
  fuck_miui11: false,
  // 单脚本模式 是否只运行一个脚本 不会同时使用其他的 开启单脚本模式 会取消任务队列的功能。
  // 比如同时使用蚂蚁庄园 则保持默认 false 否则设置为true 无视其他运行中的脚本
  single_script: false,
  // 这个用于控制列表滑动是否稳定 不用去修改它
  friendListStableCount: 3,
  // 底部高度，比如有虚拟按键就需要修改这个值 设置比虚拟按键高度高就可以了
  bottomHeight: 200,
  // 是否使用模拟的滑动，如果滑动有问题开启这个 当前默认关闭 经常有人手机上有虚拟按键 然后又不看文档注释的
  useCustomScrollDown: false,
  // 排行榜列表下滑速度 200毫秒 不要太低否则滑动不生效 仅仅针对useCustomScrollDown=true的情况
  scrollDownSpeed: 200,
  // 配置帮助收取能量球的颜色，用于查找帮助收取的能量球
  can_collect_color: '#1da06a',
  can_help_color: '#f99236',
  helpBallColors: ['#f99236', '#f7af70'],
  // 是否开启自动浇水 每日收集某个好友达到下一个阈值之后会进行浇水
  wateringBack: true,
  // 浇水阈值40克
  wateringThreshold: 40,
  // 配置不浇水的黑名单
  wateringBlackList: [],
  // 延迟启动时延 5秒 悬浮窗中进行的倒计时时间
  delayStartTime: 5,

  home_ui_content: '背包|通知|攻略|种树',
  friend_home_ui_content: '浇水|发消息',
  // 废弃
  friend_list_ui_content: '(周|总)排行榜',
  // 用于判断是否在好友排行榜
  friend_list_id: '.*react-content.*',
  // 查看更多好友的按钮
  enter_friend_list_ui_content: '查看更多好友',
  no_more_ui_content: '没有更多了',
  load_more_ui_content: '查看更多',
  watering_widget_content: '浇水',
  using_protect_content: '使用了保护罩',
  collectable_energy_ball_content: '收集能量\\d+克'
}
const CONFIG_STORAGE_NAME = 'ant_forest_config_fork_version'
let config = {}
let storageConfig = storages.create(CONFIG_STORAGE_NAME)
Object.keys(default_config).forEach(key => {
  let storedVal = storageConfig.get(key)
  if (typeof storedVal !== 'undefined') {
    config[key] = storedVal
  } else {
    config[key] = default_config[key]
  }
})

if (!inRunningMode) {
  module.exports = {
    config: config,
    default_config: default_config,
    storage_name: CONFIG_STORAGE_NAME
  }
} else {

  const hasRootPermission = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
  let loadingDialog = null
  threads.start(function () {
    loadingDialog = dialogs.build({
      title: "加载中...",
      progress: {
        max: -1
      },
      cancelable: false
    }).show()
    setTimeout(function () {
      loadingDialog.dismiss()
    }, 3000)
  })

  const TextWatcherBuilder = function (textCallback) {
    return new TextWatcher({
      onTextChanged: textCallback,
      beforeTextChanged: function (s) { }
      ,
      afterTextChanged: function (s) { }
    })
  }

  setTimeout(function () {
    let start = new Date().getTime()
    ui.layout(

      <drawer>
        <vertical>
          <appbar>
            <tabs id="tabs" />
          </appbar>
          <viewpager id="viewpager">
            <frame>
              <ScrollView>
                <vertical padding="24 0">
                  {/* 锁屏密码 */}
                  <horizontal gravity="center">
                    <text text="锁屏密码：" />
                    <input id="password" inputType="textPassword" layout_weight="80" />
                  </horizontal>
                  {/* 颜色识别 */}
                  <text text="颜色相似度（拖动为百分比，实际使用0-255）" textColor="black" textSize="16sp" />
                  <horizontal gravity="center">
                    <text id="colorThresholdInput" />
                    <seekbar id="colorThresholdSeekbar" progress="20" layout_weight="85" />
                  </horizontal>
                  {/* 悬浮窗配置 不再提供关闭 */}
                  <horizontal margin="10 0" gravity="center">
                    <vertical padding="12" layout_weight="75">
                      <text text="悬浮窗颜色" textColor="black" textSize="16sp" />
                      <input id="floatyColor" inputType="text" />
                      <text text="悬浮窗位置" textColor="black" textSize="16sp" />
                      <horizontal margin="10 0" gravity="center">
                        <text text="x:" />
                        <seekbar id="floatyXSeekBar" progress="20" layout_weight="80" />
                        <text id="floatyX" />
                      </horizontal>
                      <horizontal margin="10 0" gravity="center">
                        <text text="y:" />
                        <seekbar id="floatyYSeekBar" progress="20" layout_weight="80" />
                        <text id="floatyY" />
                      </horizontal>
                    </vertical>
                    <vertical padding="12" layout_weight="25">
                      <button id="testFloatyPosition">测试悬浮窗</button>
                    </vertical>
                  </horizontal>
                  <text text="是否在执行完毕后不驻留前台，关闭悬浮窗" textSize="12sp" />
                  <checkbox id="notLingeringFloatWindowChkBox" text="不驻留前台" />
                  {/* 是否帮助收取 */}
                  <checkbox id="helpFriendChkBox" text="是否帮助收取" />
                  {/* 是否循环 */}
                  <horizontal gravity="center">
                    <checkbox id="isCycleChkBox" text="是否循环" />
                    <horizontal padding="10 0" id="cycleTimeContainer" gravity="center" layout_weight="75">
                      <text margin="40 0" text="循环次数：" layout_weight="40" />
                      <input id="cycleTimeInpt" textSize="14sp" layout_weight="60" />
                    </horizontal>
                  </horizontal>
                  {/* 是否永不停止 */}
                  <horizontal gravity="center" id="neverStopContainer">
                    <checkbox id="isNeverStopChkBox" text="是否永不停止" />
                    <horizontal padding="10 0" id="reactiveTimeContainer" gravity="center" layout_weight="75">
                      <text margin="10 0" text="重新激活时间：" layout_weight="40" />
                      <input id="reactiveTimeInpt" textSize="14sp" layout_weight="60" />
                    </horizontal>
                  </horizontal>
                  <vertical id="countdownContainer">
                    <horizontal gravity="center" >
                      <text text="计时最大等待时间:" />
                      <input id="maxCollectWaitTimeInpt" inputType="number" layout_weight="60" />
                    </horizontal>
                    <horizontal gravity="center">
                      <text text="单次运行最大收集次数:" />
                      <input id="maxCollectRepeatInpt" inputType="number" layout_weight="60" />
                    </horizontal>
                  </vertical>
                  {/* 是否显示debug日志 */}
                  <checkbox id="showDebugLogChkBox" text="是否显示debug日志" />
                  <horizontal gravity="center">
                    <checkbox id="saveLogFileChkBox" text="是否保存日志到文件" />
                    <horizontal padding="10 0" id="fileSizeContainer" gravity="center" layout_weight="75">
                      <text text="文件滚动大小：" layout_weight="20" />
                      <input id="fileSizeInpt" textSize="14sp" layout_weight="80" />
                      <text text="kb" />
                    </horizontal>
                  </horizontal>
                  {/* 是否自动点击授权录屏权限 */}
                  <checkbox id="requestCapturePermissionChkBox" text="是否需要自动授权截图权限" />
                  {/* 收集一轮后自动锁屏 */}
                  <vertical id="lockDescNoRoot">
                    <text text="锁屏功能仅限于下拉状态栏中有锁屏按钮的情况下可用" textSize="12sp" />
                    <text text="实在想用可以自行修改Automator中的lockScreen方法" textSize="12sp" />
                  </vertical>
                  <horizontal gravity="center">
                    <checkbox id="autoLockChkBox" text="是否自动锁屏" />
                    <vertical padding="10 0" id="lockPositionContainer" gravity="center" layout_weight="75">
                      <horizontal margin="10 0" gravity="center">
                        <text text="x:" />
                        <seekbar id="lockXSeekBar" progress="20" layout_weight="80" />
                        <text id="lockX" />
                      </horizontal>
                      <horizontal margin="10 0" gravity="center">
                        <text text="y:" />
                        <seekbar id="lockYSeekBar" progress="20" layout_weight="80" />
                        <text id="lockY" />
                      </horizontal>
                    </vertical>
                  </horizontal>
                  {/* 是否自动设置最低亮度 */}
                  <checkbox id="autoSetBrightnessChkBox" text="锁屏启动设置最低亮度" />
                  {/* 基本不需要修改的 */}
                  <horizontal w="*" h="1sp" bg="#cccccc" margin="10 0"></horizontal>
                  <horizontal gravity="center">
                    <text text="解锁超时（ms）:" />
                    <input id="timeoutUnlockInpt" inputType="number" layout_weight="60" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="查找控件超时（ms）:" />
                    <input id="timeoutFindOneInpt" inputType="number" layout_weight="60" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="校验控件是否存在超时（ms）:" />
                    <input id="timeoutExistingInpt" inputType="number" layout_weight="60" />
                  </horizontal>
                </vertical>
              </ScrollView>
            </frame >
            <frame>
              <ScrollView id="parentScrollView2">
                <vertical padding="24 12">
                  {/* 单脚本使用，无视多任务队列 */}
                  <text text="当需要使用多个脚本时建议开启，避免抢占前台" textSize="12sp" />
                  <checkbox id="singleScriptChkBox" text="是否单脚本运行" />
                  {/* 只收集自己的能量 */}
                  <checkbox id="collectSelfOnlyChkBox" text="只收自己的能量" />
                  {/* 基于图像分析 */}
                  <checkbox id="baseOnImageChkBox" text="基于图像分析" />
                  {/* 排行榜中下拉次数 */}
                  <vertical id="friendListScrollTimeContainer">
                    {/* <text text="排行榜下拉的最大次数，使得所有数据都加载完，当前只能如此" textSize="10sp" />
                    <horizontal gravity="center" >
                      <text text="排行榜下拉次数:" />
                      <input layout_weight="70" inputType="number" id="friendListScrollTimeInpt" layout_weight="70" />
                    </horizontal> */}
                    <text text="可收取小手指的绿色像素点个数，1080P时小于2300判定为可收取，其他分辨率需要自行修改=2300*缩小比例^2" textSize="10sp" />
                    <horizontal gravity="center" >
                      <text text="小手指像素点个数:" />
                      <input layout_weight="70" inputType="number" id="fingerImgPixelsInpt" layout_weight="70" />
                    </horizontal>
                  </vertical>
                  {/* 脚本延迟启动 */}
                  <horizontal gravity="center">
                    <text text="延迟启动时间（秒）:" />
                    <input layout_weight="70" inputType="number" id="delayStartTimeInpt" layout_weight="70" />
                  </horizontal>

                  {/* 使用模拟手势来实现上下滑动 */}
                  <horizontal gravity="center">
                    <checkbox id="useCustomScrollDownChkBox" text="是否启用模拟滑动" layout_weight="40" />
                    <horizontal layout_weight="60" id="scrollDownContainer">
                      <text text="滑动速度（ms）" />
                      <input layout_weight="70" inputType="number" id="scrollDownSpeedInpt" />
                    </horizontal>
                  </horizontal>
                  {/* 虚拟按键高度 */}
                  <horizontal gravity="center" id="bottomHeightContainer">
                    <text text="系统底部虚拟按键高度，全面屏设置为100即可" />
                    <input layout_weight="70" inputType="number" id="bottomHeightInpt" />
                  </horizontal>
                  {/* 收取白名单列表 */}
                  <vertical w="*" gravity="left" layout_gravity="left" margin="10">
                    <text text="收取白名单：" textColor="#666666" textSize="14sp" />
                    <frame>
                      <list id="whiteList" height="150">
                        <horizontal w="*" h="40" gravity="left" bg="#efefef" margin="0 5">
                          <text id="name" layout_weight='1' h="30" gravity="left|center" layout_gravity="left|center" textSize="16sp" text="{{name}}" margin="10 0" />
                          <card id="deleteWhite" w="30" h="30" cardBackgroundColor="#fafafa" cardCornerRadius="15dp" layout_gravity="center" marginRight="10">
                            <text textSize="16dp" textColor="#555555" gravity="center">×</text>
                          </card>
                        </horizontal>
                      </list>
                    </frame>
                    <button w="*" id="addWhite" text="添加" gravity="center" layout_gravity="center" />
                  </vertical>
                  {/* 是否在收取到了一定阈值后自动浇水10克 */}
                  <horizontal gravity="center">
                    <checkbox id="wateringBackChkBox" text="是否浇水回馈" layout_weight="40" />
                    <horizontal layout_weight="60" id="wateringThresholdContainer">
                      <text text="浇水阈值" />
                      <input layout_weight="70" inputType="number" id="wateringThresholdInpt" />
                    </horizontal>
                  </horizontal>
                  {/* 浇水黑名单 */}
                  <vertical w="*" gravity="left" layout_gravity="left" margin="10" id="wateringBlackListContainer">
                    <text text="浇水黑名单：" textColor="#666666" textSize="14sp" />
                    <frame>
                      <list id="blackList" height="150">
                        <horizontal w="*" h="40" gravity="left" bg="#efefef" margin="0 5">
                          <text id="name" layout_weight='1' h="30" gravity="left|center" layout_gravity="left|center" textSize="16sp" text="{{name}}" margin="10 0" />
                          <card id="deleteBlack" w="30" h="30" cardBackgroundColor="#fafafa" cardCornerRadius="15dp" layout_gravity="center" marginRight="10">
                            <text textSize="16dp" textColor="#555555" gravity="center">×</text>
                          </card>
                        </horizontal>
                      </list>
                    </frame>
                    <button w="*" id="addBlack" text="添加" gravity="center" layout_gravity="center" />
                  </vertical>
                </vertical>
              </ScrollView>
            </frame>
            <frame>
              <ScrollView>
                <vertical padding="12 24">
                  <text text="一般情况下不需要修改这一块的配置，除非你的支付宝是英文的" textSize="12sp" />
                  <horizontal gravity="center">
                    <text text="个人首页:" layout_weight="20" />
                    <input inputType="text" id="homeUiContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="好友首页:" layout_weight="20" />
                    <input inputType="text" id="friendHomeUiContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="好友排行榜id:" layout_weight="20" />
                    <input inputType="text" id="friendListIdInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="查看更多好友按钮:" layout_weight="20" />
                    <input inputType="text" id="enterFriendListUiContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="没有更多按钮:" layout_weight="20" />
                    <input inputType="text" id="noMoreUiContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="查看更多按钮:" layout_weight="20" />
                    <input inputType="text" id="loadMoreUiContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="浇水:" layout_weight="20" />
                    <input inputType="text" id="wateringWidgetContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="保护罩:" layout_weight="20" />
                    <input inputType="text" id="usingProtectContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="可收集能量球:" layout_weight="20" />
                    <input inputType="text" id="collectableEnergyBallContentInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="列表中可收取的颜色:" layout_weight="20" />
                    <input inputType="text" id="canCollectColorInpt" layout_weight="80" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="列表中可帮助的颜色:" layout_weight="20" />
                    <input inputType="text" id="canHelpColorInpt" layout_weight="80" />
                  </horizontal>

                  <vertical w="*" gravity="left" layout_gravity="left" margin="10">
                    <text text="帮收取能量球颜色" textColor="#666666" textSize="14sp" />
                    <frame>
                      <ScrollView height="100">
                        <list id="helpBallColorsList">
                          <horizontal w="*" h="40" gravity="left" bg="#efefef" margin="0 5">
                            <text id="name" layout_weight='1' h="30" gravity="left|center" layout_gravity="left|center" textSize="16sp" textColor="{{color}}" text="{{color}}" margin="10 0" />
                            <card id="deleteHelpColor" w="30" h="30" cardBackgroundColor="#fafafa" cardCornerRadius="15dp" layout_gravity="center" marginRight="10">
                              <text textSize="16dp" textColor="#555555" gravity="center">×</text>
                            </card>
                          </horizontal>
                        </list>
                      </ScrollView>
                    </frame>
                    <button w="*" id="addHelpBallColor" text="添加" gravity="center" layout_gravity="center" />
                  </vertical>
                </vertical>
              </ScrollView>
            </frame>
          </viewpager>
        </vertical>
      </drawer>
    )

    // activity.setSupportActionBar(ui.toolbar)
    ui.viewpager.setTitles(['基本配置', '进阶配置', '控件文本配置'])
    ui.tabs.setupWithViewPager(ui.viewpager)

    // 基本配置
    ui.password.text(config.password + '')
    ui.colorThresholdInput.text('' + config.color_offset)
    let precent = parseInt(config.color_offset / 255 * 100)
    ui.colorThresholdSeekbar.setProgress(precent)

    let configColor = config.min_floaty_color
    ui.floatyColor.text(configColor)
    if (/^#[\dabcdef]{6}$/i.test(configColor)) {
      ui.floatyColor.setTextColor(colors.parseColor(configColor))
    }
    ui.floatyX.text(config.min_floaty_x + '')
    ui.floatyXSeekBar.setProgress(parseInt(config.min_floaty_x / device.width * 100))
    ui.floatyY.text(config.min_floaty_y + '')
    ui.floatyYSeekBar.setProgress(parseInt(config.min_floaty_y / device.height * 100))
    ui.notLingeringFloatWindowChkBox.setChecked(config.notLingeringFloatWindow)
    ui.helpFriendChkBox.setChecked(config.help_friend)

    ui.isCycleChkBox.setChecked(config.is_cycle)
    ui.cycleTimeContainer.setVisibility(config.is_cycle ? View.VISIBLE : View.INVISIBLE)
    ui.neverStopContainer.setVisibility(config.is_cycle ? View.GONE : View.VISIBLE)
    ui.countdownContainer.setVisibility(config.is_cycle || config.never_stop ? View.GONE : View.VISIBLE)
    ui.cycleTimeInpt.text(config.cycle_times + '')
    ui.maxCollectWaitTimeInpt.text(config.max_collect_wait_time + '')
    ui.maxCollectRepeatInpt.text(config.max_collect_repeat + '')
    ui.isNeverStopChkBox.setChecked(config.never_stop)
    ui.reactiveTimeContainer.setVisibility(config.never_stop ? View.VISIBLE : View.INVISIBLE)
    ui.reactiveTimeInpt.text(config.reactive_time + '')

    ui.showDebugLogChkBox.setChecked(config.show_debug_log)
    ui.saveLogFileChkBox.setChecked(config.saveLogFile)
    ui.fileSizeInpt.text(config.back_size + '')
    ui.fileSizeContainer.setVisibility(config.saveLogFile ? View.VISIBLE : View.INVISIBLE)

    ui.requestCapturePermissionChkBox.setChecked(config.request_capture_permission)

    ui.lockX.text(config.lock_x + '')
    ui.lockXSeekBar.setProgress(parseInt(config.lock_x / device.width * 100))
    ui.lockY.text(config.lock_y + '')
    ui.lockYSeekBar.setProgress(parseInt(config.lock_y / device.height * 100))
    ui.autoLockChkBox.setChecked(config.auto_lock)
    ui.lockPositionContainer.setVisibility(config.auto_lock && !hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    ui.lockDescNoRoot.setVisibility(!hasRootPermission ? View.VISIBLE : View.INVISIBLE)

    ui.autoSetBrightnessChkBox.setChecked(config.autoSetBrightness)

    ui.timeoutUnlockInpt.text(config.timeout_unlock + '')
    ui.timeoutFindOneInpt.text(config.timeout_findOne + '')
    ui.timeoutExistingInpt.text(config.timeout_existing + '')


    // 进阶配置
    ui.singleScriptChkBox.setChecked(config.single_script)
    ui.collectSelfOnlyChkBox.setChecked(config.collect_self_only)
    ui.baseOnImageChkBox.setChecked(config.base_on_image)
    ui.bottomHeightInpt.text(config.bottomHeight + '')
    ui.useCustomScrollDownChkBox.setChecked(config.useCustomScrollDown)
    ui.scrollDownContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.INVISIBLE)
    ui.bottomHeightContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.GONE)
    ui.scrollDownSpeedInpt.text(config.scrollDownSpeed + '')

    ui.wateringBackChkBox.setChecked(config.wateringBack)
    ui.wateringThresholdInpt.text(config.wateringThreshold + '')
    ui.wateringThresholdContainer.setVisibility(config.wateringBack ? View.VISIBLE : View.INVISIBLE)
    ui.wateringBlackListContainer.setVisibility(config.wateringBack ? View.VISIBLE : View.GONE)


    // ui.friendListScrollTimeInpt.text(config.friendListScrollTime + '')
    ui.fingerImgPixelsInpt.text(config.finger_img_pixels + '')
    ui.friendListScrollTimeContainer.setVisibility(config.base_on_image ? View.VISIBLE : View.GONE)
    ui.delayStartTimeInpt.text(config.delayStartTime + '')

    // 控件文本配置
    ui.homeUiContentInpt.text(config.home_ui_content)
    ui.friendHomeUiContentInpt.text(config.friend_home_ui_content)
    ui.friendListIdInpt.text(config.friend_list_id)
    ui.enterFriendListUiContentInpt.text(config.enter_friend_list_ui_content)
    ui.noMoreUiContentInpt.text(config.no_more_ui_content)
    ui.loadMoreUiContentInpt.text(config.load_more_ui_content)
    ui.wateringWidgetContentInpt.text(config.watering_widget_content)
    ui.usingProtectContentInpt.text(config.using_protect_content)

    let collectColor = config.can_collect_color
    ui.canCollectColorInpt.text(collectColor)
    if (/^#[\dabcdef]{6}$/i.test(collectColor)) {
      ui.canCollectColorInpt.setTextColor(colors.parseColor(collectColor))
    }
    let helpColor = config.can_help_color
    ui.canHelpColorInpt.text(helpColor)
    if (/^#[\dabcdef]{6}$/i.test(helpColor)) {
      ui.canHelpColorInpt.setTextColor(colors.parseColor(helpColor))
    }
    ui.collectableEnergyBallContentInpt.text(config.collectable_energy_ball_content)

    // 列表绑定
    let whiteList = []
    if (config.white_list && config.white_list.length > 0) {
      whiteList = config.white_list.map(r => {
        return { name: r }
      })
    }
    ui.whiteList.setDataSource(whiteList)

    let wateringBlackList = []
    if (config.wateringBlackList && config.wateringBlackList.length > 0) {
      wateringBlackList = config.wateringBlackList.map(r => {
        return { name: r }
      })
    }
    ui.blackList.setDataSource(wateringBlackList)


    let helpBallColorList = []
    if (config.helpBallColors && config.helpBallColors.length > 0) {
      helpBallColorList = config.helpBallColors.map(r => {
        return { color: r }
      })
    }
    ui.helpBallColorsList.setDataSource(helpBallColorList)


    // 列表监听
    ui.whiteList.on('item_bind', function (itemView, itemHolder) {
      // 绑定删除事件
      itemView.deleteWhite.on('click', function () {
        confirm('确定要从白名单移除[' + itemHolder.getItem().name + ']这个好友吗？').then(ok => {
          if (ok) {
            whiteList.splice(itemHolder.getPosition(), 1)
            config.white_list.splice(itemHolder.getPosition(), 1)
          }
        })
      })
    })

    ui.whiteList.setOnTouchListener(new View.OnTouchListener({
      onTouch: function (v, event) {
        if (event.getAction() == MotionEvent.ACTION_UP) {
          ui.parentScrollView2.requestDisallowInterceptTouchEvent(false)
        } else {
          //屏蔽父控件的拦截事件  
          ui.parentScrollView2.requestDisallowInterceptTouchEvent(true)
        }
        return false
      }
    }))

    ui.addWhite.on('click', () => {
      dialogs.rawInput('请输入好友昵称')
        .then(friendName => {
          if (friendName) {
            friendName = friendName.trim()
            whiteList.push({ name: friendName })
            config.white_list.push(friendName)
          }
        })
    })


    ui.blackList.on('item_bind', function (itemView, itemHolder) {
      // 绑定删除事件
      itemView.deleteBlack.on('click', function () {
        confirm('确定要从黑名单移除[' + itemHolder.getItem().name + ']这个好友吗？').then(ok => {
          if (ok) {
            wateringBlackList.splice(itemHolder.getPosition(), 1)
            config.wateringBlackList.splice(itemHolder.getPosition(), 1)
          }
        })
      })
    })

    ui.blackList.setOnTouchListener(new View.OnTouchListener({
      onTouch: function (v, event) {
        if (event.getAction() == MotionEvent.ACTION_UP) {
          ui.parentScrollView2.requestDisallowInterceptTouchEvent(false)
        } else {
          //屏蔽父控件的拦截事件  
          ui.parentScrollView2.requestDisallowInterceptTouchEvent(true)
        }
        return false
      }
    }))

    ui.addBlack.on('click', () => {
      dialogs.rawInput('请输入好友昵称')
        .then(friendName => {
          if (friendName) {
            friendName = friendName.trim()
            wateringBlackList.push({ name: friendName })
            config.wateringBlackList.push(friendName)
          }
        })
    })

    ui.helpBallColorsList.on('item_bind', function (itemView, itemHolder) {
      // 绑定删除事件
      itemView.deleteHelpColor.on('click', function () {
        confirm('确定要删除[' + itemHolder.getItem().color + ']这个颜色吗？').then(ok => {
          if (ok) {
            helpBallColorList.splice(itemHolder.getPosition(), 1)
            config.helpBallColors.splice(itemHolder.getPosition(), 1)
          }
        })
      })
    })

    ui.addHelpBallColor.on('click', () => {
      dialogs.rawInput('请输入颜色')
        .then(color => {
          if (color) {
            color = color.trim()
          }
          if (/^#[\dabcdef]{6}$/i.test(color)) {
            helpBallColorList.push({ color: color })
            config.helpBallColors.push(color)
          } else {
            toastLog('颜色值无效')
          }
        })
    })



    // 添加监听
    ui.colorThresholdSeekbar.on('touch', () => {
      let precent = ui.colorThresholdSeekbar.getProgress()
      let trueVal = parseInt(precent * 255 / 100)
      ui.colorThresholdInput.text('' + trueVal)
      config.color_offset = trueVal
    })

    ui.floatyXSeekBar.on('touch', () => {
      let precent = ui.floatyXSeekBar.getProgress()
      let trueVal = parseInt(precent * device.width / 100)
      ui.floatyX.text('' + trueVal)
      config.min_floaty_x = trueVal
    })

    ui.floatyYSeekBar.on('touch', () => {
      let precent = ui.floatyYSeekBar.getProgress()
      let trueVal = parseInt(precent * device.height / 100)
      ui.floatyY.text('' + trueVal)
      config.min_floaty_y = trueVal
    })

    ui.testFloatyPosition.on('click', () => {
      threads.start(function () {
        sleep(300)
        toastLog('准备初始化悬浮窗')
        let floatyWindow = floaty.rawWindow(
          <frame gravity='left'>
            <text id='content' textSize='8dp' textColor='#00ff00' />
          </frame>
        )
        let count = 5
        floatyWindow.content.text('悬浮窗' + count + '秒后关闭')
        floatyWindow.content.setTextColor(colors.parseColor(config.min_floaty_color))
        floatyWindow.setPosition(config.min_floaty_x, config.min_floaty_y)
        setInterval(function () {
          floatyWindow.content.text('悬浮窗' + --count + '秒后关闭')
        }, 1000)
        setTimeout(function () {
          floatyWindow.close()
        }, 5000)
      })
    })

    ui.helpFriendChkBox.on('click', () => {
      config.help_friend = ui.helpFriendChkBox.isChecked()
    })

    ui.notLingeringFloatWindowChkBox.on('click', () => {
      config.notLingeringFloatWindow = ui.notLingeringFloatWindowChkBox.isChecked()
    })

    ui.isCycleChkBox.on('click', () => {
      config.is_cycle = ui.isCycleChkBox.isChecked()
      ui.cycleTimeContainer.setVisibility(config.is_cycle ? View.VISIBLE : View.INVISIBLE)
      ui.neverStopContainer.setVisibility(config.is_cycle ? View.GONE : View.VISIBLE)
    })

    ui.isNeverStopChkBox.on('click', () => {
      config.never_stop = ui.isNeverStopChkBox.isChecked()
      ui.reactiveTimeContainer.setVisibility(config.never_stop ? View.VISIBLE : View.INVISIBLE)
      ui.countdownContainer.setVisibility(config.never_stop ? View.GONE : View.VISIBLE)
    })

    ui.showDebugLogChkBox.on('click', () => {
      config.show_debug_log = ui.showDebugLogChkBox.isChecked()
    })

    ui.saveLogFileChkBox.on('click', () => {
      config.saveLogFile = ui.saveLogFileChkBox.isChecked()
      ui.fileSizeContainer.setVisibility(config.saveLogFile ? View.VISIBLE : View.INVISIBLE)
    })

    ui.requestCapturePermissionChkBox.on('click', () => {
      config.request_capture_permission = ui.requestCapturePermissionChkBox.isChecked()
    })

    ui.autoSetBrightnessChkBox.on('click', () => {
      config.autoSetBrightness = ui.autoSetBrightnessChkBox.isChecked()
    })

    ui.autoLockChkBox.on('click', () => {
      let checked = ui.autoLockChkBox.isChecked()
      config.auto_lock = checked
      ui.lockPositionContainer.setVisibility(checked && !hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    })

    ui.lockXSeekBar.on('touch', () => {
      let precent = ui.lockXSeekBar.getProgress()
      let trueVal = parseInt(precent * device.width / 100)
      ui.lockX.text('' + trueVal)
      config.lock_x = trueVal
    })

    ui.lockYSeekBar.on('touch', () => {
      let precent = ui.lockYSeekBar.getProgress()
      let trueVal = parseInt(precent * device.height / 100)
      ui.lockY.text('' + trueVal)
      config.lock_y = trueVal
    })

    ui.password.addTextChangedListener(
      TextWatcherBuilder(text => { config.password = text + '' })
    )

    ui.floatyColor.addTextChangedListener(
      TextWatcherBuilder(text => {
        let val = text + ''
        if (val) {
          val = val.trim()
        }
        if (/^#[\dabcdef]{6}$/i.test(val)) {
          ui.floatyColor.setTextColor(colors.parseColor(val))
          config.min_floaty_color = val
        }
      })
    )

    ui.cycleTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.cycle_times = parseInt(text) })
    )
    ui.maxCollectWaitTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.max_collect_wait_time = parseInt(text) })
    )
    ui.maxCollectRepeatInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.max_collect_repeat = parseInt(text) })
    )

    ui.reactiveTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.reactive_time = parseInt(text) })
    )

    ui.timeoutUnlockInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_unlock = parseInt(text) })
    )

    ui.timeoutFindOneInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_findOne = parseInt(text) })
    )

    ui.timeoutExistingInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_existing = parseInt(text) })
    )

    ui.fileSizeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.back_size = parseInt(text) })
    )

    // 进阶配置
    ui.singleScriptChkBox.on('click', () => {
      config.single_script = ui.singleScriptChkBox.isChecked()
    })
    ui.collectSelfOnlyChkBox.on('click', () => {
      config.collect_self_only = ui.collectSelfOnlyChkBox.isChecked()
    })
    ui.baseOnImageChkBox.on('click', () => {
      config.base_on_image = ui.baseOnImageChkBox.isChecked()
      if (config.base_on_image) {
        config.useCustomScrollDown = true
        ui.useCustomScrollDownChkBox.setChecked(true)
        ui.scrollDownContainer.setVisibility(View.VISIBLE)
        ui.bottomHeightContainer.setVisibility(View.VISIBLE)
      }
      ui.friendListScrollTimeContainer.setVisibility(config.base_on_image ? View.VISIBLE : View.GONE)
    })

    ui.useCustomScrollDownChkBox.on('click', () => {
      config.useCustomScrollDown = ui.useCustomScrollDownChkBox.isChecked()
      ui.scrollDownContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.INVISIBLE)
      ui.bottomHeightContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.GONE)
    })

    ui.bottomHeightInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.bottomHeight = parseInt(text) })
    )

    ui.scrollDownSpeedInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.scrollDownSpeed = parseInt(text) })
    )

    ui.wateringBackChkBox.on('click', () => {
      config.wateringBack = ui.wateringBackChkBox.isChecked()
      ui.wateringThresholdContainer.setVisibility(config.wateringBack ? View.VISIBLE : View.INVISIBLE)
      ui.wateringBlackListContainer.setVisibility(config.wateringBack ? View.VISIBLE : View.GONE)
    })

    ui.wateringThresholdInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.wateringThreshold = parseInt(text) })
    )

    // ui.friendListScrollTimeInpt.addTextChangedListener(
    //   TextWatcherBuilder(text => { config.friendListScrollTime = parseInt(text) })
    // )
    ui.fingerImgPixelsInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.finger_img_pixels = parseInt(text) })
    )
    ui.delayStartTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.delayStartTime = parseInt(text) })
    )
    // 控件文本配置
    ui.homeUiContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.home_ui_content = text + '' })
    )
    ui.friendHomeUiContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.friend_home_ui_content = text + '' })
    )
    ui.friendListIdInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.friend_list_id = text + '' })
    )
    ui.enterFriendListUiContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.enter_friend_list_ui_content = text + '' })
    )
    ui.noMoreUiContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.no_more_ui_content = text + '' })
    )
    ui.loadMoreUiContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.load_more_ui_content = text + '' })
    )
    ui.wateringWidgetContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.watering_widget_content = text + '' })
    )
    ui.usingProtectContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.using_protect_content = text + '' })
    )
    ui.canCollectColorInpt.addTextChangedListener(
      TextWatcherBuilder(text => {
        let val = text + ''
        if (val) {
          val = val.trim()
        }
        if (/^#[\dabcdef]{6}$/i.test(val)) {
          ui.canCollectColorInpt.setTextColor(colors.parseColor(val))
          config.can_collect_color = val
        }
      })
    )
    ui.canHelpColorInpt.addTextChangedListener(
      TextWatcherBuilder(text => {
        let val = text + ''
        if (val) {
          val = val.trim()
        }
        if (/^#[\dabcdef]{6}$/i.test(val)) {
          ui.canHelpColorInpt.setTextColor(colors.parseColor(val))
          config.can_help_color = val
        }
      })
    )
    ui.collectableEnergyBallContentInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.collectable_energy_ball_content = text + '' })
    )


    // let runningEngines = engines.all()
    // let currentEngine = engines.myEngine()

    // let runningSize = runningEngines.length
    // if (runningSize >= 1) {
    //   runningEngines.forEach(engine => {
    //     if (engine.id !== currentEngine.id) {
    //       engine.forceStop()
    //     }
    //   })
    // }

    console.verbose('界面初始化耗时' + (new Date().getTime() - start) + 'ms')
    setTimeout(function () {
      if (loadingDialog !== null) {
        loadingDialog.dismiss()
      }
    }, 500)
  }, 500)

  ui.emitter.on('pause', () => {
    ui.finish()
    Object.keys(default_config).forEach(key => {
      let newVal = config[key]
      if (typeof newVal !== 'undefined') {
        storageConfig.put(key, newVal)
      } else {
        storageConfig.put(key, default_config[key])
      }
    })
  })
}