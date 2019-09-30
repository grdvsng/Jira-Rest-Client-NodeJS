/*
	[JiraClient]
*/

const btoa = (data) => {return Buffer.from(data).toString('base64')},
      atob = (data) =>{return Buffer.from(data, 'ascii').toString('utf8')};

const _InnerErrors = [{
        type: 'Authorization Errors',
        critical: [0],

        messages: 
        [
        "Application will close, server response {0}.\nResponse: {1}"
        ]
    }, {
        type: 'Core Errors',
        critical: [0],

        messages: 
        [
        "Sory, auth: {0}, not supported now."
        ]    
    }, {
        type: 'Serever Errors',
        critical: [0, 2],

        messages: 
        [
        "Serever: '{0}' not available.",
        "Serever return errors: '{0}'.",
        "Test request return: '{0}', check your configuration.\nData: '{1}'."
        ]  
    }];

const _Request = require('./core')['_Request'];


class JiraClient extends _Request {
    constructor(parameters, auth) {
        super(parameters, _InnerErrors);

        this.auth = auth;

        if (this.auth.type === 'session') 
        {
            this.create_session();
        }
        else if (this.auth.type === 'basic')   
        {
            this.append_basic_auth_header();
        } else {
            return this.onError(1, 0, this.auth.type);
        }
    }

    async search(_jql="", _startAt=0, _maxResults=50, connectTest=false)
    {
        let options = 
        {
            path: "rest/api/2/search",
            data:  
            {
                jql: _jql,
                startAt: _startAt,
                maxResults: _maxResults
            }
        },
        resp = await this._request(options, "post", connectTest || null);

        return resp;
    }
    
    async getIsue(isueID)
    {
        let options = 
        {
            path: 'rest/api/2/issue/' + isueID
        },
            resp    = await this._request(options, "get");

        return resp;
    }

    async _request(options, method="get", onCritical=null)
    {
        let response = await this.request(options, method);

        if (response.code !== 200 && onCritical == null) onCritical(result);

        return response;
    } 

    async append_basic_auth_header()
    {
        this.options['headers']['Authorization'] = "Basic " + btoa(this.auth.data.username) + ":" + btoa(this.auth.data.password);
        
        await this._request(testRequest, "post", (result) => {self.onError(2, 2, result.status, result.data);});
        await this.onAuth(this.auth.data.username, this.auth.type);
    }

    async create_session() {
        let self = this,
            result = await this.request({
                "path": "/rest/auth/1/session",
                "data": this.auth.data,
            }, "post");

        if (!result)
        {
            this.onError(2, 0, this.options['headers'].host || this.options['headers'].hostname);
        }
        else if (result.status !== 200) 
        {
            this.onError(0, 0, result.status, result.data);
        }  
        else if (result.errors) 
        {
            this.onError(2, 1, result.errors);
        } else {
            this.session                      = result.data.session;
            this.options['headers']['cookie'] = this.session.name + '=' +  this.session.value;
        }

        await this.search("not(status=Closed)", 0, 1, (result) => {self.onError(2, 2, result.status, result.data);});
        await this.onAuth(this.auth.data.username, this.auth.type);
    }
}


module.exports = 
{
    'JiraClient': JiraClient
}