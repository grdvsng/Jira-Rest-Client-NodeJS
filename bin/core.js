/**
 * Application core (basic universal methods and classes)
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 0.1.0
 */


const STDGateway = new (require('std.methods.js')["STDGateway"])();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

String.formatViaArray = (str, args) =>
{
	for (var n=0; n < args.length; n++)
	{
		let re = new RegExp('\\{' + n + '\\}', "g")

		str = str.replace(re, args[n]);
	}

	return str;
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


/**
 * Interface for InnerError.
 * @type Class
 */
class InnerError
{
    /**
     * Create new InnerError.
     * @param {String}         type     - Type of Error.
     * @param {Array.<Number>} critical - Array with index of message from InnerError.messages with criticale system error.
     * @param {Array.<String>} messages - Array with Error description.
     * @returns {void}
     */
    constructor(type, critical, messages)
    {
        this.type     = type;
        this.critical = critical;
        this.messages = messages;
    }
}


/**
 * Log writer.
 */
class _Logger
{
	/**
     * Create _Logger, check logpath.
     * @param {String} logPath - file for write log.
     * @returns {void}
     */
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

			this.logFile = logPath;
		}
	}

	/**
     * FSO error parse.
     * @param {(Error | null)} err - FSO error.
     * @param {file} file - file that FSO using.
     * @returns {void}
     */
	errorHandler(err, file)
	{
		if (err != null)
		{
			console.log(err, file);
			this.isLog = false;
		}
	}

	/**
     * Write log
     * @param {String} msg - data to write.
     * @returns {void}
     */
	logAppend(msg)
	{
		var time = "TimeStamp: " + (new Date()) + "\n",
			data = time + msg + "\n" + '-'.repeat(time.length) + "\n";

		this.fso.appendFile(this.logFile, data, this.errorHandler);
	}
}


/**
 * Application events handler.
 * @exetends _Logger
 */
class EventsHandler extends _Logger
{
	/**
     * Generate EventsHandler parameters.
     * @param {Array.<InnerError>} errorsDiction - Array of client module special errors.
     * @param {String} logPath - file for write log.
     * @returns {void}
     */
	constructor(errorsDiction, logPath)
	{
		super(logPath);

		this.errors =  errorsDiction;
	}

	/**
     * Generate EventsHandler parameters.
     * @param {String} MessageType - Type of message(Error || Info ...).
     * @param {String} Desription - Event basic information.
     * @param {String} [Event = "None"] - Event type(look down).
     * @returns {void}
     */
	_logWrite(MessageType, Desription, Event="None")
	{
		let data = `\nMessageType: ${MessageType}\nEvent: ${Event}\nDesription: \n\t${Desription}`;

		this.logAppend(data);
	}

	/**
     * Generate EventsHandler parameters.
     * @param {String} parameters - connection parameters.
     * @returns {(Object | Error)}
     */
	onServerConnection(parameters)
	{
		if (parameters['hostname'] || (parameters['host'] && parameters['port']))   
		{
			return parameters;
		} else if (!parameters['hostname'] || (!parameters['host'] || !parameters['port'])) {
			this.onCoreError(`Connection parameters are Empty, please check examples of connect parameters`);
		} else {
			this.onCoreError(`For connection by host and port all property are require.`);
		}
	}

	/**
     * Write.log, print information, ...
     * @param {Number} typeID - Index of InnerError in this.errors.
     * @param {Number} msgID - Index of Message(to print) in this.errors['messages'].
     * @returns {void}
     */
	onWarning(typeID, msgID)
	{
		let erType = this.errors[typeID],
			title  = erType.type,
			msg    = String.formatViaArray(erType['messages'][msgID], Array.from(arguments).slice(2,));

		console.warn(msg);

		if (this.isLog) this._logWrite('Warning', msg, title);
	}

	/**
     * First user connection event...
     * @param {String} userName - connected user name.
     * @param {String} authType - type of authorization.
     * @returns {void}
     */
	onAuth(userName, authType)
	{
		let msg = `User: '${userName}'.\n\tAuthType: '${authType}' \n\tAuth checked: 'true'`;

		console.log("\t" + msg);

		if (this.isLog) this._logWrite('Info', msg, 'onSessionCreated');
	}

	/**
     * User Added in group event...
     * @param {String} userName - connected user name.
     * @param {String} groupName - name of group.
     * @returns {void}
     */
	onUserAddedInGroup(userName, groupName)
	{
		let msg = `User: ${userName}, add on: '${groupName}'.`;

		console.log("\t" + msg);

		if (this.isLog) this._logWrite('Info', msg, 'onUserAddedInGroup');
	}

	/**
     * User Remove from group event...
     * @param {String} userName - connected user name.
     * @param {String} groupName - name of group.
     * @returns {void}
     */
	onUserRemovedFromGroup(userName, groupName)
	{
		let msg = `User: ${userName}, remove from '${groupName}'.`;

		console.log("\t" + msg);

		if (this.isLog) this._logWrite('Info', msg, 'onUserRemovedFromGroup');
	}

	/**
     * User Created event...
     * @param {String} userName - user name.
     * @returns {void}
     */
	onUserCreated(userName)
	{
		let msg = `User: ${userName}, was created!`;

		console.log("\t" + msg);

		if (this.isLog) this._logWrite('Info', msg, 'onUserCreated');
	}

	/**
     * User removed event...
     * @param {String} userName - user name.
     * @returns {void}
     */
	onUserDeleted(userName)
	{
		let msg = `User: ${userName}, was deleted!`;

		console.log("\t" + msg);

		if (this.isLog) this._logWrite('Info', msg, 'onUserDeleted');
	}

	/**
     * Write.log, print information, ...
     * @param {Number} typeID - Index of InnerError in this.errors.
     * @param {Number} msgID - Index of Message(to print) in this.errors['messages'].
     * @returns {void}
     */
	onError(typeID, msgID)
	{
		let erType = this.errors[typeID],
			title  = erType.type,
			msg    = String.formatViaArray(erType['messages'][msgID], Array.from(arguments).slice(2,));

		if (this.isLog) this._logWrite('Error', msg, title);
		if (erType.critical.indexOf(msgID) !== -1) throw new Error(msg);
	}


	/**
     * Critical Core error(without exeption).
     * @param {String} msg - Message for print(+log write).
     * @returns {Error}
     */
	onCoreError(msg)
	{
		if (this.isLog) this._logWrite('Error', msg, 'Critical Error.');
		throw new Error(msg);
	}
}


/**
 * Parsed response from Jira
 * @type Class
 */
class _Response
{
    /**
     * Create new client.
     * @param {Number} status - _Response from server code.
     * @param {Array.<String>} errors - Erros in _Response.
     * @param {Array.<String>} data   - Data in _Response.
     * @returns {void}
     */
    constructor(status, errors, data)
    {
        this.status = status;
        this.errors = errors;
        this.data   = data;
    }
}


/**
 * Class for use universaL requests methods.
 * @class
 * @exetends EventsHandler
 */
class _Request extends EventsHandler
{

	/**
     * Generate Basic parameters.
     * @param {object} parameters - Connection parameters.
     * @param {Array.<InnerError>} ClientErrors - Array of client module special errors.
     * @returns {void}
     */
	constructor(parameters, ClientErrors)
	{
		super(ClientErrors, parameters.log);

		this.http    = require(parameters['protocol'] || "http");
		this.baseUrl = this.generateBaseUrl(parameters),
		this.options = Object.filter({
			port:     parameters.port,
			host:     parameters.host,
			hostname: parameters.hostname,
			headers:  parameters.headers
		}, function(a) {return a != undefined});
	}

	/**
	 * Generate server basic url by protocol, host and port addresses
	 * @param {String} protocol - server application protocol.
	 * @param {String} host - server host address.
	 * @param {String} port - server port address.
	 * @returns {String}
	 */
	generateBasicUrlByHostAndPort(protocol, host, port)
	{
		return `${protocol}://${host}:${port}`;
	}

	/**
	 * Generate server basic url by protocol and hostname
	 * @param {String} protocol - server application protocol.
	 * @param {String} hostname - server host name.
	 * @returns {String}
	 */
	generateBasicUrlByHostname(protocol, hostname)
	{
		return `${protocol}://${hostname}`;
	}

	/**
	 * Generate server basic url.
	 * @param {Object} parameters - server configuration parameters.
	 * @returns {string}
	 */
	generateBaseUrl(parameters)
	{
		this.onServerConnection(parameters);

		if (parameters['hostname'])
		{
			return this.generateBasicUrlByHostname(parameters['protocol'], parameters['hostname']);
		}

		if (parameters['host'])
		{
			return this.generateBasicUrlByHostAndPort(parameters['protocol'], parameters['host'], parameters['port']);
		}
	}

 	/**
     * Request Get.
     * @param {Options} options - request header, data and|or other parameters.
     * @returns {(_Response | Boolean)}
     */
 	async GET(options)
 	{
 		let self = this;

 		this.connectDefaultAttrsOnRequest(options);

 		let req = await this.http.request(options, (response) => {self.responseParser.apply(self, [response]);});
    	req.end();

    	let resp = await this.waitingResponse();

    	return new Promise((resolve) => resolve(resp));
 	}

 	/**
     * Connect basic headers to request.
     * @param {Options} options - request headers, data and|or other parameters.
     * @returns {(_Response | Boolean)}
     */
 	connectDefaultAttrsOnRequest(options)
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

	/**
     * Web path generation
     * @param {String} basicPath - auth to append.
     * @param {String} path      - auth to add.
     * @returns {String}
     */
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

 	/**
     * Request DELETE.
     * @param {Options} options - request header, data and|or other parameters.
     * @returns {(_Response | Boolean)}
     */
 	async DELETE(options)
 	{
 		let resp = await this.GET(options);

 		return new Promise((resolve) => resolve(resp));
 	}

 	/**
     * Request POST.
     * @param {Options} options - request header, data and|or other parameters.
     * @returns {(_Response | Boolean)}
     */
 	async POST(options)
 	{
 		let data = (options.data) ? JSON.stringify(options.data):"",
 			self = this,
 			req;

 		delete options.data;

 		await this.connectDefaultAttrsOnRequest(options);

 		req = this.http.request(options, (response) => {self.responseParser.apply(self, [response]);});

    	req.write(data);
    	req.end();

    	let resp = await this.waitingResponse();

    	return new Promise((resolve) => resolve(resp));
 	}

    /**
     * Request universal method.
     * @param {Options} options - request header, data and|or other parameters.
     * @param {String} [method = "get"] - request method(POST, GET ...).
     * @returns {(_Response | Error)}
     */
    async request(options, method="GET")
 	{
 		let resp;

 		this.activeResponse = undefined;

 		options.method = (options.method || method).toUpperCase();
 		options.path   = "/" + options.path.replace(/^[\/\/]|^.\//g, "");
		resp           = await this[options.method](options);

		if (!resp) return this.onCoreError(`Server: '${this.baseUrl}', not available...`);

		return new Promise(resolve => resolve(resp));
 	}

	/**
     * Parse and convert response data.
     * @param {Array.<String>} data - Array with response data.
     * @returns {String}
     */
	innerProtocol(data)
	{
		let parsed = data;

		if (data.length > 0)
		{
			try{
				parsed = JSON.parse(Array._toString(data));
			} catch(e) {console.warn(`Can't parse data from Response.\n\t \
									  Error: \n\t\t${e} \n\t\t \
									  Data:\n\t\t${Array._toString(data)}`)}
		}

		return parsed;
	}

	async getAuth(authData={})
	{
		authData.username = (authData.username) ? authData.username:await STDGateway.input('username');
		authData.password = (authData.password) ? authData.password:await STDGateway.getPassword('password');

		return authData;
	}

    /**
     * Parse response from server and convert to _Response(return in self.activeResponse);
     * @returns {void}
     */
 	async responseParser (response)
 	{
 		let self   = this,
 			errors = [],
			data   = [];

 		response.setEncoding('utf8');
		response.on('error',(er) => {errors.push(er)})
		response.on('data', (c)  => {data.push(c);});
		response.on('end',  ()  => {
			self.activeResponse = new _Response(
				response.statusCode,
				this.innerProtocol(data),
				this.innerProtocol(errors)
		)});
    }

    /**
     * Wait response from Server.
     * @returns {void}
     */
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
	'_Request': _Request,
	'_Response': _Response,
	'InnerError': InnerError
}