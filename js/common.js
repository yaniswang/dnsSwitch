String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, '');
}

var applicationDirectory = air.File.applicationDirectory;
var applicationStorageDirectory = air.File.applicationStorageDirectory;
var NativeApplication = air.NativeApplication;

var osname = air.Capabilities.os.toLowerCase();
var isWin = osname.indexOf("win") > -1,
	isLinux = osname.indexOf("linux") > -1,
	isMac = osname.indexOf("mac") > -1;
var ctrlKey = isMac? 'Cmd' : 'Ctrl';

//加载资源
function loadResource(path, callback) {
	var iconLoad = new air.Loader();
	iconLoad.contentLoaderInfo.addEventListener(air.Event.COMPLETE, callback);
	iconLoad.load(new air.URLRequest(path));
}

//读文件
function readFile(path, bText, charset) {
	var file = typeof path === 'string' ? applicationStorageDirectory.resolvePath(path) : path;
	if (file.exists === true) {
		var fileStream = new air.FileStream();
		fileStream.open(file, air.FileMode.READ);
		var fileData;
		if (bText === true) {
			fileData = fileStream.readMultiByte(fileStream.bytesAvailable, charset ? charset : 'utf-8');
		} else {
			fileData = new air.ByteArray();
			fileStream.readBytes(fileData);
		}
		fileStream.close();
		fileStream = null;
		return fileData;
	} else return false;
}

//写文件
function writeFile(path, fileData, charset) {
	var file = typeof path === 'string' ? applicationStorageDirectory.resolvePath(path) : path;
	var fileStream = new air.FileStream();
	fileStream.open(file, air.FileMode.WRITE);
	if (typeof fileData === 'string') fileStream.writeMultiByte(fileData, charset ? charset : 'utf-8');
	else fileStream.writeBytes(fileData);
	fileStream.close();
	fileStream = null;
}

// 获得当前激活网卡名
function getActiveNetname(){
	var arrInterfaces = air.NetworkInfo.networkInfo.findInterfaces(),
		interfaceObj;
	if (arrInterfaces !== null) {
		for (var i = 0, count1 = arrInterfaces.length; i < count1; i++) {
			interfaceObj = arrInterfaces[i];
			if (interfaceObj.active) {
				return interfaceObj.displayName;
			}
		}
	}
}


//访问外部扩展
function callExt(api) {
	if (air.NativeProcess.isSupported) {
		var file = air.File.applicationDirectory,
			filepath;
		if (isWin) filepath = api + '.cmd';
		else if (isLinux) filepath = api + '.sh';
		else if (isMac) filepath = api + '.sh';
		filepath = 'ext/' + filepath;
		if (filepath) {
			file = file.resolvePath(isMac?'/bin/bash':filepath);
			var nativeProcessStartupInfo = new air.NativeProcessStartupInfo();
			nativeProcessStartupInfo.executable = file;
			var args = new air.Vector["<String>"]();
			if(isMac){
				//Mac下无法直接运行sh脚本，必需要通过bash运行
				var runFile = air.File.applicationDirectory;
				args.push(runFile.nativePath + '/' + filepath);
			}
			var callArguments = arguments,
				callback = callArguments[callArguments.length - 1],
				hasCallback = typeof callback === 'function';
			for (var i = 1, c = callArguments.length - (hasCallback ? 1 : 0); i < c; i++){
				if(callArguments[i] !== null && callArguments[i] !== undefined){
					args.push(callArguments[i]);
				}
			}
			nativeProcessStartupInfo.arguments = args;
			var process = new air.NativeProcess();
			if (hasCallback) {
				function progressHandle() {
					process.removeEventListener(air.ProgressEvent.STANDARD_OUTPUT_DATA, progressHandle);
					var stdOut = process.standardOutput;
					var str = stdOut.readMultiByte(stdOut.bytesAvailable, 'ansi');
					process.exit();
					process = null;
					callback(str);
				}
				process.addEventListener(air.ProgressEvent.STANDARD_OUTPUT_DATA, progressHandle);
			}
			process.start(nativeProcessStartupInfo);
		}
	}
}

//设置系统DNS
function setSysDns(dnsip) {
	var netname = getActiveNetname();
	callExt('setsysdns', netname, dnsip ? dnsip : 'clear');
}

//清除系统DNS
function clearSysDns() {
	if(isWin){
		//只有Windows清系统DNS
		callExt('clearsysdns');
	}
}

Object.keys = Object.keys || function(obj){
   var keys = [];
   for(var key in obj){
   		if (obj.hasOwnProperty(key))
   		{
   			keys.push(key);
   		}
   }
   return keys;
}