/*!
 * dnsSwitch
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 *
 */
(function(_win, undefined) {

	var menuIcon;

	var app = {};

	//软件初始化
	app.init = function() {

		app.initSystemIcon();

		app.updateDnsMenu();

		app.hide();

		//定时回收垃圾
		setInterval(function(){
			air.System.gc();
		},10000);

	}

	//显示窗口
	app.show = function() {
		nativeWindow.visible = true;
		nativeWindow.orderToFront();
		nativeWindow.activate();
	}

	//隐藏窗口到系统栏
	app.hide = function() {;
		nativeWindow.visible = false;
	}

	//结束软件
	app.exit = function() {
		NativeApplication.nativeApplication.icon.bitmaps = [];
		NativeApplication.nativeApplication.exit();
	}

	//设置启动时运行
	app.setStartAtLogin = function(bStart) {
		try {
			NativeApplication.nativeApplication.startAtLogin = bStart; //安装后可用
			settings.set('bStartAtLogin', bStart);
		} catch (e) {
			air.trace("Cannot set startAtLogin: " + e.message);
		}
	}

	//初始化系统图标
	app.initSystemIcon = function() {
		menuIcon = new air.NativeMenu();

		var menuItemSep;

		if(!isMac){
			var menuItemExit = menuIcon.addItem(new air.NativeMenuItem('退出'));
			menuItemExit.name = 'exit';
			menuItemExit.addEventListener(air.Event.SELECT, app.menuSelect);

			menuItemSeparate = menuIcon.addItem(new air.NativeMenuItem('----', true));
		}

		var menuItemAbout = menuIcon.addItem(new air.NativeMenuItem('关于'));
		menuItemAbout.name = 'about';
		menuItemAbout.addEventListener(air.Event.SELECT, app.menuSelect);

		var bStartAtLogin = settings.get('bStartAtLogin');
		var menuItemStartAtLogin = menuIcon.addItem(new air.NativeMenuItem('开机启动'));
		menuItemStartAtLogin.name = 'startatloign';
		menuItemStartAtLogin.checked = bStartAtLogin ? true : false;
		menuItemStartAtLogin.addEventListener(air.Event.SELECT, app.menuSelect);

		var menuItemDnsSetup = menuIcon.addItem(new air.NativeMenuItem('设置DNS'));
		menuItemDnsSetup.name = 'dnssetup';
		menuItemDnsSetup.addEventListener(air.Event.SELECT, app.menuSelect);

		menuItemSeparate = menuIcon.addItem(new air.NativeMenuItem('----', true));
		menuItemSeparate.name = 'dnsTop';

		//Windows
		if (NativeApplication.supportsSystemTrayIcon) {
			loadResource('icons/icon16.png', function(event) {
				NativeApplication.nativeApplication.icon.bitmaps = [event.target.content.bitmapData];
			});
			NativeApplication.nativeApplication.icon.tooltip = "dnsSwitch";
			NativeApplication.nativeApplication.icon.menu = menuIcon;
		}
		//Mac
		if (NativeApplication.supportsDockIcon) {
			loadResource('icons/icon128.png', function(event) {
				NativeApplication.nativeApplication.icon.bitmaps = [event.target.content.bitmapData];
			});
			NativeApplication.nativeApplication.icon.menu = menuIcon;
		}
	}

	//菜单选择
	app.menuSelect = function(e) {
		var target = e.currentTarget;
		switch (target.name) {
		case 'dnssetup':
			app.showDnsSetup();
			break;
		case 'setdns':
			settings.set('curDns', target.data);
			app.setSysDns();
			app.updateDnsMenu()
			break;
		case 'startatloign':
			target.checked = !target.checked;
			app.setStartAtLogin(target.checked);
			break;
		case 'about':
			app.showAbout();
			break;
		case 'exit':
			app.exit();
			break;
		}
	}

	//更新DNS菜单
	app.updateDnsMenu = function() {

		if(isLinux)return;

		var arrDnsList = settings.get('dnsList'),
			curDns = settings.get('curDns');

		var arrMenuItem, menuItem, addPos;
		var menuItemLocal, menuItemDns;
		var dns;

		//系统栏菜单
		arrMenuItem = menuIcon.items;
		for (var i = 0, c = arrMenuItem.length; i < c; i++) {
			menuItem = arrMenuItem[i];
			if (menuItem.name === 'dnsTop') addPos = menuIcon.getItemIndex(menuItem) + 1;
			if (menuItem.name === 'setdns') menuIcon.removeItem(menuItem);
		}


		menuItemLocal = menuIcon.addItemAt(new air.NativeMenuItem('本地DNS'), addPos++);
		menuItemLocal.name = 'setdns';
		menuItemLocal.data = -1;
		menuItemLocal.checked = curDns === -1 ? true : false;
		menuItemLocal.addEventListener(air.Event.SELECT, app.menuSelect);

		for (var i = 0, c = arrDnsList.length; i < c; i++) {
			dns = arrDnsList[i];
			menuItemDns = menuIcon.addItemAt(new air.NativeMenuItem(dns.name), addPos++);
			menuItemDns.name = 'setdns';
			menuItemDns.data = i;
			menuItemDns.checked = curDns === i ? true : false;
			menuItemDns.addEventListener(air.Event.SELECT, app.menuSelect);
		}
	}

	//设置系统DNS
	app.setSysDns = function() {
		var arrDnsList = settings.get('dnsList'),
			curDns = settings.get('curDns');
		setSysDns(curDns != -1 ? arrDnsList[curDns].ip : '');
	}

	//显示DNS设置界面
	app.showDnsSetup = function() {
		var arrDnsList = settings.get('dnsList');
		var arrStrDnsList = [];
		var dns;

		for(var i in arrDnsList){
			var dns = arrDnsList[i];
			arrStrDnsList.push(dns.name + ' ' + dns.ip);
		}

		var newDnsList = prompt('请输入DNS，Ctrl+Enter换行：' ,arrStrDnsList.join('\r\n'));
		if(newDnsList !== null){
			arrDnsList = [];
			arrStrDnsList = newDnsList.split(/\r?\n/);
			var line;
			var errMsg;
			for(var i=0,c=arrStrDnsList.length;i<c;i++){
				line = arrStrDnsList[i];
				if (line) {
					var arrLine = line.split(/\s+/);
					if (arrLine.length !== 2 || !/^(\d{1,3}\.){3}\d{1,3}$/.test(arrLine[1])) {
						errMsg = 'DNS列表格式无效，请重新修改。';
						break;
					}
					arrDnsList.push({
						name: arrLine[0],
						ip: arrLine[1]
					});
				}
			}
			if (errMsg === null && arrDnsList.length === 0) {
				errMsg = 'DNS列表不允许为空';
			}
			if (errMsg) {
				alert(errMsg);
			} else {
				settings.set('dnsList', arrDnsList);
				alert('Dns修改成功');
				app.updateDnsMenu();
			}
		}
	}

	//显示关于界面
	app.showAbout = function(){
		var descriptor = '' + NativeApplication.nativeApplication.applicationDescriptor;
		var match = descriptor.match(/<versionLabel>(.+?)<\/versionLabel>/i);
		var ver = '';
		if(match){
			ver = match[1];
		}

		alert('dnsSwitch v'+ver+'\r\n这是一款DNS切换工具，辅助你高效的进行DNS切换。');
	}

	_win.app = app;
})(window);