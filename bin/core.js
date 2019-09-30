/* 
	[Core]
*/

String.formatViaArray = (string, args) =>
{
	let cur = string || "";

	for (var n=0; n < args.length; n++)
	{
		let re = new RegExp('\\{' + n + '\\}', "g")
		
		cur = cur.replace(re, args[n]);
	}

	return cur;
}

Array._toString = (arr, term="") => 
{
	let str = "";

	for (let n=0; n < arr.length; n++)
	{
		str += arr[n] + ((n+1 !== arr.length) ? term:"");
	}

	return str;
}

Object.filter = (obj, filter) =>
{
	for (let attName in obj)
	{
		if (!filter(obj[attName])) delete obj[attName];
	}

	return obj;
}


class _Logger
{
	constructor(logPath)
	{
		let self = this;

		this.fso   = require('fs');
		this.isLog = logPath != undefined;
		
		if (this.isLog) 
		{
			if (!this.fso.existsSync(logPath))
			{
				this.fso.open(logPath, 'w', this.errorHandler);
			}

			this.logFiile = logPath;
		}
	}

	errorHandler(err, file)
	{
		if (err != null) 
		{
			console.log(err, file);
			this.isLog = false;
		} else {console.log("Log appended!");}
	}

	logAppend(msg)
	{
		var time = "TimeStamp: " + (new Date()) + "\n",
			data = time + msg + "\n" + '-'.repeat(time.length) + "\n";

		this.fso.appendFile(this.logFiile, data, this.errorHandler); 
	}
}


class EventsHandler extends _Logger
{
	constructor(errorsDiction, logPath)
	{
		super(logPath);

		this.errors =  errorsDiction;
	}

	_logWrite(MessageType, Desription, Event="None")
	{
		let data = `\nMessageType: ${MessageType}\nEvent: ${Event}\nDesription: \n\t${Desription}`;

		this.logAppend(data);
	} 

	onAuth(userName, authType)
	{
		let msg = `User: '${userName}'.\n\tAuthType: '${authType}' \n\tAuth checked: 'true'`;

		console.log("\t" + msg);

		if (this.isLog) this._logWrite('Info', msg, 'onSessionCreated');
	}

	onError(typeID, msgID)
	{
		let erType = this.errors[typeID],
			title  = erType.type,
			msg    = String.formatViaArray(erType['messages'][msgID], Array.from(arguments).slice(2,));

		if (this.isLog) this._logWrite('Error', msg, title);
		if (erType.critical.indexOf(msgID) !== -1) throw new Error(msg);
	}
}


class _Request extends EventsHandler
{	
	constructor(parameters, ClientErrors)
	{
		super(ClientErrors, parameters.log);

		this.http    =  require(parameters['protocol'] || "http");
		this.baseUrl =  parameters['protocol'] + ":" + "//" + parameters.host + ":" + parameters.port,
		this.options = Object.filter({
			port:     parameters.port,
			host:     parameters.host,
			hostname: parameters.hostname,
			headers:  parameters.headers	
		}, function(a) {return a != undefined});
	}
 	
 	async GET(options)
 	{
 		let self = this;

 		this.connectDefaultAttsOnRequest(options);

 		let req = await this.http.request(options, (response) => 
 		{
 			self.responseParser.apply(self, [response]);
 		});

    	req.end();

    	let resp = await this.waitingResponse();
    	
    	return new Promise((resolve) => resolve(resp));
 	}

 	connectDefaultAttsOnRequest(options)
 	{
 		for (var att in this.options)
 		{
 			let val = this.options[att];
 			
 			if ((typeof val) !== 'object' || options[att] === undefined)
 			{
 				options[att] = val;
 			} else {
 				options[att] = Object.assign(options[att], val);
 			}
 		}

 		return options;
 	}
	
	pathGeneratorByBasicUrl(basicPath, path)
 	{
 		let re = new RegExp(basicPath, "g");

 		if (path.match(re)) 
		{
			return path;
		} else {
			return basicPath + "/" + path.replace(/^\.\/|^\//g, "");
		}
 	}

 	async POST(options)
 	{
 		let data = (options.data) ? JSON.stringify(options.data):"",
 			self = this,
 			req;

 		if (data !== "") delete options.data;

 		this.connectDefaultAttsOnRequest(options);

 		req = this.http.request(options, (response) => 
 		{
 			self.responseParser.apply(self, [response]);
 		});

    	req.write(data);
    	req.end();

    	let resp = await this.waitingResponse();
    	
    	return new Promise((resolve) => resolve(resp));
 	}
    
    async request(options, method="GET")
 	{
 		let resp;

 		this.activeResponse = undefined;

 		options.method = (options.method || method).toUpperCase();
 		options.path   = "/" + options.path.replace(/^[\/\/]|^.\//g, "");
		resp           = await this[options.method](options);
		
		return resp;
 	}
	
 	responseParser (response) 
 	{
 		let self = this,
 			res  = 
 			{
 				status: response.statusCode,
 				errors: [],
 				data:   []
 			};

 		response.setEncoding('utf8');
		response.on('error',(er) => {res.errors.push(er)})
		response.on('data', (c)  => {res.data.push(c);});
		response.on('end',  (c)  => {
			res['data']         = JSON.parse(Array._toString(res['data']));
			res['errors']       = (res['errors'].length > 0) ? JSON.parse(Array._toString(res['errors'])):undefined;
			self.activeResponse = res;
		});
    }

    async waitingResponse()
	{
		let self = this;
		
		if (!self.activeResponse) 
		{
			await new Promise(resolve => {setTimeout(resolve, 1000);});

			this.waitingResponse(self);
		}

		return self.activeResponse;
	}
}

module.exports = 
{
	'_Request':      _Request
}