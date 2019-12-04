/**
 * Application core (basic universal methods and classes)
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 0.1.0
 */


process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const os_path = require("path");


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


function HTML_LOG()
{
	var self = this;

	this.__init__ = function()
	{
		window.onload = this.onload;
	}

	this.generateTable = function()
	{
		var table = document.createElement('table');

		table.style["border-collapse"] = "separate";
		table.style["border-spacing"]  = "0px";

		return table;
	}

	this.generateCell = function(value, clsName, cellEl)
	{
		var td = document.createElement(cellEl || 'td');
			
		td.innerHTML         = value;
		td.className         = clsName;
		td.style.border      = "1px solid black";
		td.style.padding     = "5px";

		return td;
	}

	this.generateRow = function(data, rowEl, cellEl)
	{

		var row = document.createElement(rowEl || "tr");

		for (var key in data)
		{
			var td = this.generateCell(data[key], key, cellEl);

			row.appendChild(td);
		}

		return row;
	}
	
	this.generateHead = function(data)
	{
		var head = {},
			row;

		for (var key in data) head[key] = key.toUpperCase();
	
		row                  = this.generateRow(head, 'thead', 'th');
		row.style.background = "orange";
		row.className        = "table-head";

		return row;
	}

	this.generateFilter = function()
	{
		return `
		<input 
			style="border: none"
			onkeyup="
			var childs = document.getElementsByClassName(this.parentNode.className);

			for (var n=0; n < childs.length; n++)
			{
				var node = childs[n];
			
				if (!node.innerHTML.match(new RegExp(this.value, 'gi')) && node !== this.parentNode && node.parentNode.className !== 'table-head')
				{
					node.parentNode.style.display = 'none';
				} else {
					node.parentNode.style.display = 'table-row';
				}
			}
			"
		>
		`
	}

	this.generateFilters = function(data)
	{
		var head = {},
			row;

		for (var key in data) head[key] = this.generateFilter();
	
		row = this.generateRow(head);

		return row;
	}

	this.onload = function()
	{
		var tbl = generateTable();

		for (var n=0; n < TABLE.length; n++)
		{
			var row = this.generateRow(TABLE[n]);
			
			if (n === 0) 
			{
				tbl.appendChild(this.generateHead(TABLE[n]));
				tbl.appendChild(this.generateFilters(TABLE[n]));
			}

			tbl.appendChild(row);
		}

		document.body.appendChild(tbl);
	}

	return this.__init__();
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
		this.table = [];
		this.log   = logPath;
		this.fso   = require('fs');
		
		if (this.log)
		{
			this.generateLogFile();
			this.generateHTMLLogFile();
		}
	}

	_generateHTMLLogFile(filePath)
	{
		let content = `
			<html>
				<head>
					<title>${os_path.basename(this.log).replace(os_path.extname(this.log), "")}</title>
					<script src="${"./" + os_path.basename(this.log)}"></script>
					<script> ${HTML_LOG + ""}; HTML_LOG() </script>
		`;

		this.fso.writeFileSync(filePath, content);
	}

	generateHTMLLogFile()
	{
		let _file = os_path.join(os_path.dirname(this.log), os_path.basename(this.log).replace(new RegExp(os_path.extname(this.log), 'gi'), ".html"));
		
		if (!this.fso.existsSync(_file))
		{
			this._generateHTMLLogFile(_file);
		}
	}

	createLogSrc()
	{
		if (!this.fso.existsSync(os_path.dirname(this.log)))
		{
			this.fso.mkdirSync(os_path.dirname(this.log));
		}

		this.fso.open(this.log, 'w', (err, data) => {});
		this.rewright();
	}

	generateLogFile()
	{
		if (!this.fso.existsSync(this.log)) 
		{
			this.createLogSrc();
		}

		this.table = require(os_path.resolve(this.log))["TABLE"];
	}

	rewright()
	{
		let data = `\rvar TABLE = ${JSON.stringify(this.table)}; \n\nmodule.exports ={"TABLE": TABLE}`;

		this.fso.writeFileSync(this.log, data, 'utf8');
	}

	parseEvent(ev)
	{
		if (ev.type === 'Error')
		{
			throw new Error(ev.toLine());
		} else {
			console.log(ev.toLine());
		}
	}

	/**
     * Write log
     * @param {String} msg - data to write.
     * @returns {void}
     */
	append(ev)
	{
		ev = (ev instanceof CoreEvent) ? ev:new CoreEvent(...arguments);

		this.table.push(ev.toNode());

		if (this.log) this.rewright();
		
		this.parseEvent(ev);
	}
}


/**
 * Application events handler.
 */
class CoreEvent
{
	constructor(event_type, event_title, event_description) 
	{
		this.type        = event_type;
		this.title       = event_title;
		this.description = event_description;
		this.userName    = require("os").userInfo().username;
	}

	toNode()
	{
		return {
			type:        this.type,
			title:       this.title,
			description: this.description,
			user:        this.userName,
			time:        new Date().toISOString()
		};
	}

	toLine()
	{
		let line = "-".repeat(this.title.length * 2);

		return `\n${line}\nEvent:\n\t${this.title}\nDescription:\n\t${this.description}\n${line}\n`;
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
 */
class _Request
{

	/**
     * Generate Basic parameters.
     * @param {object} parameters - Connection parameters.
     * @returns {void}
     */
	constructor(parameters)
	{
		this.logger  = new _Logger(parameters.log);
		this.http    = require(parameters.protocol ? parameters.protocol:"https");
		this.baseUrl = this.generateBaseUrl(parameters);
		this.prefix  = (parameters.prefix) ? `/${parameters.prefix}`:"";
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
		let url;

		if (parameters['hostname'])
		{
			url = this.generateBasicUrlByHostname(parameters['protocol'], parameters['hostname']);
		} else if (parameters['host'] && parameters["port"]) {
			url = this.generateBasicUrlByHostAndPort(parameters['protocol'], parameters['host'], parameters['port']);
		} else {
			this.logger(new CoreEvent('Error', 'Critical Error', 'Please, check your host address parameters.')); // throw
		}

		return url;
	}

 	/**
     * Request Get.
     * @param {Options} options - request header, data and|or other parameters.
     * @returns {(_Response | Boolean)}
     */
 	async GET(options)
 	{
		this.connectDefaultAttrsOnRequest(options);
		
		return new Promise(resolve => 
		{
			let req = this.http.request(options, response => 
			{
				
				this.responseParser(response).then(res => 
				{
					resolve(res);
				});
			});
			
			req.end();
		});
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
 		let data = (options.data) ? JSON.stringify(options.data):"";

 		delete options.data;

 		this.connectDefaultAttrsOnRequest(options);

		return new Promise(async resolve => 
		{
			let req = await this.http.request(options, async response => 
			{
				let data = await this.responseParser(response);
				
				resolve(data);
			});
			
			req.write(data);
			req.end();
		});
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
		 
 		options.method = (options.method || method).toUpperCase();
 		options.path   = this.prefix + "/" + options.path.replace(/^[\/\/]|^.\//g, "");
		resp           = await this[options.method](options);

		return new Promise(resolve => 
		{
			if (!resp) 
			{
				this.logger.append(new CoreEvent('Error', 'Critical Error', `Server: '${this.baseUrl}', not available...`));
			} else {
				resolve(resp);
			}
		});
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
			} catch(e) {console.warn(`Can't parse data from Response.\n\tError: \n\t\t${e}`)}
		}

		return parsed;
	}

    /**
     * Parse response from server and convert to _Response(return in self.activeResponse);
     * @returns {void}
     */
 	responseParser(response)
 	{
 		let errors = [],
			data   = [];
		
		response.setEncoding('utf8');

		response.on('error',(er) => errors.push(er));
		response.on('data', (c)  => data.push(c));

		return new Promise(resolve => 
		{
			response.on('end',  ()  => 
			{
				resolve(new _Response(response.statusCode, this.innerProtocol(data), this.innerProtocol(errors)));
			});
		});
    }
}

module.exports =
{
	'_Request': _Request,
	'_Response': _Response,
	'CoreEvent': CoreEvent
}