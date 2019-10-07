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
        "Haven't response from serever: '{0}'.",
        "Serever return errors: '{0}'.",
        "Test request return: '{0}', check your configuration.\nData: '{1}'."
        ]  
    }, {
        type: 'Jira Errors',
        critical: [2],

        messages: 
        [
        "Parameter(s): '{1}' is required.",
        "Auth error, check your username and password.\nServer response: {0}",
        "Bad Response!\nDescription: \n{0}.",
        "Can't find role id by value: '{0}', projectName: '{1}'."
        ] 
    }];

const _Request = require('./core')['_Request'];


class BasicAuth extends _Request
{
    constructor(parameters, authData)
    {
        super(parameters, _InnerErrors);

        this.auth = authData; 
    }

    async create()
    {
        let b64data = "Basic " + btoa(this.auth.username + ":" + this.auth.password);
        
        this.options['headers']['Authorization'] = b64data;
       
        let result = await this.request({'path': '/rest/api/2/user/?username=admin'}, 'get');
        
        if (result.status !== 200) return this.onError(3, 2, JSON.stringify(result));
        
        return b64data;
    }
}


class Session extends _Request
{
    constructor(parameters, authData)
    {
        super(parameters, _InnerErrors);

        this.authData = authData;
    }

    async create()
    {
        let self = this,
            result = await this.request({
                "path": "/rest/auth/1/session",
                "data": this.authData,
            }, "post");

        if (result.status !== 200) 
        {
            return this.onError(3, 2, JSON.stringify(result));
        } else {
            this.name   = result.data.session.name;
            this.value  = result.data.session.value;
            this.cookie = this.name + '=' + this.value;

            return this.cookie;
        }
    }
}


class JiraClient extends _Request 
{
    constructor(parameters, auth) {
        super(parameters, _InnerErrors);

        this.auth                         = auth;
        this.options['headers']['Accept'] = 'application/json';

        switch (this.auth.type)
        {
            case 'session':      
                this.createSession(parameters);
                break;
            case 'basic':        
                this.generateBasicAuth(parameters);
                break;
            default:             
                this.onError(1, 0, this.auth.type);
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
        resp = await this._request(options, "post", connectTest);

        return resp;
    }
    
    async getIsue(isueID)
    {
        let options = 
        {
            path: 'rest/api/2/issue/?id=' + isueID
        },
            resp = await this._request(options, "get", false);

        return resp;
    }

    async createUser(userData)
    {
        let options = {};

        options['path'] = '/rest/api/2/user';
        options['data'] = userData;

        if (!userData['name'] || !userData['emailAddress']) return this.onWarning(3, 0, 'userData, emailAddress');
        
        let resp = await this._request(options, "post", false);

        if (resp) this.onUserCreated(userData.username);

        return resp;
    }

    async deleteUser(userName)
    {
        let options = 
        {
            path: "/rest/api/2/user/?username=" + userName,
        };

        let resp = await this._request(options, "DELETE", false);

        if (resp) this.onUserDeleted(userName);
        
        return resp;
    }

    async getUser(username)
    {
        let options = 
        {
            path: "/rest/api/2/user/?username=" + userName,
        },
            resp = await this._request(options, "get", false);

        return resp;
    }

    async getProjectRoles(projectKey)
    {
        let options = 
            {
                path: `/rest/api/2/project/${projectKey}/role`
            },
        resp = await this._request(options, "GET", false);

        return resp;
    }

    async getRoleId(roleID, projectKey)
    {
        if (typeof roleID === 'number') return roleID;

        let projectRoles = await this.getProjectRoles(projectKey),
            id           = projectRoles.data[roleID].match(/[0-9]+(?!\/)$/g)[0];

        if (1 > id.length) 
        {
            this.onError(3, 3, roleID, projectKey);
            return false;
        } else {
            return id;  
        }
    }

    async addUserInProject(userNameOrArrayWithNames, projectKey, rolename)
    {
        let roleID = await this.getRoleId(rolename, projectKey);
          
        if (!roleID) return this.onError(3, 3, rolename, projectKey);

        let options  = 
            {
                path: `/rest/api/2/project/${projectKey}/role/${roleID}`,
                data: 
                {
                    "user": (typeof userNameOrArrayWithNames === 'string') ? [userNameOrArrayWithNames]:userNameOrArrayWithNames,
                }
            };

        let resp     = await this._request(options, "POST", false);

        if (resp) console.log(resp)//this.onUserAddedInProject(userName);
        
        return resp;
    }

    async addUserInGroup(userName, groupName)
    {
        let options = 
        {
            path: '/rest/api/2/group/user?groupname=' + groupName,
            data: 
            {
                "name": userName
            }
        },
            resp = await this._request(options, "post", false);

        if (resp) this.onUserAddedInGroup(userName, groupName);

        return resp;
    }

    async removeUserFromGroup(userName, groupName)
    {
        let options = 
            {
                "path": `/rest/api/2/group/user?groupname=${groupName}&username=${userName}`
            },  
            resp = await this._request(options, "DELETE", false);

        if (resp) this.onUserRemovedFromGroup(userName, groupName);

        return resp;
    }

    async _request(options, method="get", onCritical=undefined)
    {
        let response  = await this.request(options, method),
            fineState = [200, 201, 204];
        
        if (response)
        {
            let message = `\n{\n\tResponese: ${response.status}\n\tDescription:` + JSON.stringify(response.data);

            if (fineState.indexOf(response.status) === -1)
            {
                if (onCritical)
                { 
                    return onCritical(response);
                } else {
                    this.onWarning(3, 2, message);

                    return false;
                }
            } else if(response.data.errors) {
                this.onError(2, 1, JSON.stringify(response.data.errors));
            }
            
            return new Promise((resolve) => resolve(response));
        } else {
            return this.onError(2, 0, this.options.host || this.options.hostname); 
        }
    } 

    async generateBasicAuth(parameters)
    {
        let basic = new BasicAuth(parameters, this.auth.data);

        this.options['headers']['Authorization'] = await basic.create();

        this.onAuth(this.auth.data.username, 'Basic');
    }

    async createSession(parameters) 
    {
        let session = new Session(parameters, this.auth.data);
        
        this.options['headers']['cookie'] = await session.create();
   
        this.onAuth(this.auth.data.username, 'Session');
    }
}


module.exports = 
{
    'JiraClient': JiraClient
}