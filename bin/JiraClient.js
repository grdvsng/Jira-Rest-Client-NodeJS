/*
	[JiraClient]
*/

const _InnerErrors  = [{
	type: 'Authorization Errors',
	critical: true,

	messages: 
		[
			"Application will close, server response {0}.\nResponse: {1}"
		]
	}];

const _Request = require('./core')['_Request'];


class JiraClient extends _Request
{
	constructor(parameters, auth)
	{
		super(parameters, _InnerErrors);
		
		this.auth = auth;
		
		if (this.auth.type === 'session') this.create_session();
	}

	async create_session()
	{
		let self   = this,
			result = await this.request({
			"path": "/rest/auth/1/session", 
			"data": this.auth.data,
		}, "post");

		if (result.status !== 200)
		{
			return this.onError(0, 0, result.status, result.data);
		} else {
			this.onSessionCreated(this.auth.data.username);
		}
	}
}


module.exports = 
{
	'JiraClient': JiraClient
}

