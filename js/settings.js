/*!
 * dnsSwitch
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 *
 */
(function(_win,undefined){

	//参数存储文件名
	var sSettingFileName='settings.json';

	//默认设置
	var defaultSettings={
		//DNS列表
		dnsList:[
			{name:'美国DNS',ip:'8.8.8.8'}
		],
		//当前选择的DNS
		curDns:-1,
	};

	var settings={};

	//从存储器恢复参数
	settings.load=function(){
		var _this=this;
		var settingFile = applicationStorageDirectory.resolvePath(sSettingFileName);
		var json={};
		for(var key in defaultSettings)json[key]=defaultSettings[key];
		if(settingFile.exists===true){
			try{
				var savedJson=JSON.parse(readFile(settingFile,true));
				for(var key in savedJson)json[key]=savedJson[key];
			}
			catch(e){}
		}
		_this.json=json;
		return _this;
	}

	//读取参数
	settings.get=function(key,bClone){
		var returnValue=this.json[key];
		if(bClone===true){
			returnValue=JSON.stringify(returnValue);
			returnValue=JSON.parse(returnValue);
		}
		return returnValue;
	}

	//存入参数
	settings.set=function(key,value){
		var _this=this;
		_this.json[key]=value;
		writeFile(sSettingFileName,JSON.stringify(_this.json));
		return _this;
	}

	//加载参数设置
	settings.load();

	_win.settings=settings;

})(window);