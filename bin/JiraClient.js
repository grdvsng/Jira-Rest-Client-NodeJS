/**
 * Client for Jira Rest Api
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 0.1.0
 */

const querystring = require('querystring');

/**
 * Encode string to base64 format.
 * @type Function
 * @param {string} data - Value to encode.
 * @returns {string}
 * @constant
 * @example
 * // returns "SGVsbG8gV29ybGQh"
 * btoa('Hello World!');
 */
const btoa = (data) => { return Buffer.from(data).toString('base64') };

/**
 * Decode string from base64 format.
 * @type Function
 * @param {string} data - Value to decode.
 * @returns {string}
 * @constant
 * @example
 * // returns "Hello World!"
 * atob('SGVsbG8gV29ybGQh');
 */
const atob = (data) => { return Buffer.from(data, 'ascii').toString('utf8') };


/**
 * Class for use universaL requests methods.
 * {@link module:core.js}.
 * @class
 * @requires module:core.js
 */
const _Request = require('./core')['_Request'];

const CoreEvent = require('./core')['CoreEvent'];

/** 
 * Parsed response from Jira
 * {@link module:core.js}.
 * @class
 * @requires module:core.js
 */
const _Response = require('./core')['_Response'];

/** 
 * ADGateway to get user data from active directory
 * {@link module:./lib/ad/ad.gateway}.
 * @class
 * @requires module:./lib/ad/ad.gateway
 */
const ADGateway = require("./lib/ad/ad.gateway")["ADGateway"];

/**
 * Parse response from Active Directory and convert to Jira UserData
 * @type Function
 * @param {Object} data - Value to convert.
 * @returns { name: String, displayName: String, emailAddress: String }
*/
function ADProtocol(data)
{
    return {
        'name':         data["sAMAccountName"].trim(),
        'displayName':  data["displayName"].trim(),
        'emailAddress': data["mail"].trim()
    };
}

/** 
 * Class for use BasicAuth in JiraDev Rest Api. 
 * @extends _Request
 */
class BasicAuth extends _Request 
{
    /**
     * Create new BasicAuth.
     * @param {Object} parameters - Connection to server parameters.
     * @param {Object} authData - Username and password.
     * @returns {void}
     */
    constructor(parameters, authData) 
    {
        super(parameters);

        this.auth = authData;
    }

    /**
     * Generate Authorization for Headers and test connection (via request).
     * @returns {String}
     */
    async create() 
    {
        let b64data = "Basic " + btoa(this.auth.username + ":" + this.auth.password);
        
        this.options['headers']['Authorization'] = b64data;
  
        let result = await this.request({ 'path': '/rest/api/2/user/?username=admin' }, 'get');

        if (result.status != 200)
        {
            this.logger.append(new CoreEvent('Error', 'Authorization Error', `Auth response: ${JSON.stringify(result || {})}`));
        }
 
        return b64data;
    }
}


/**
 * Class for use Session auth in JiraDev Rest Api. 
 * @extends _Request
 */
class Session extends _Request
{
    /**
     * Create new Session.
     * @param {object} parameters - Connection to server parameters.
     * @param {object} authData   - Username and password.
     * @returns {void}
     */
    constructor(parameters, authData)
    {
        super(parameters, _InnerErrors);

        this.authData = authData;
    }

    /**
     * Generate Authorization for Headers and test connection (via request).
     * @returns {String}
     */
    async create()
    {
        let result = await this.request({
                "path": "/rest/auth/1/session",
                "data": this.authData,
            }, "post");


        this.name = result.data.session.name;
        this.value = result.data.session.value;
        this.cookie = this.name + '=' + this.value;

        return this.cookie;
    }
}


/**
 * Class for use Jira Rest Api
 * @extends _Request
 */
class JiraClient extends _Request
{

    /**
     * Create new client.
     * @param {object} parameters - Connection to server parameters.
     * @param {object} authData - Username and password.
     * @returns {void}
     */
    constructor(parameters)
    {
        super(parameters);
        
        this.setBasicHeaders(this.options);

        this.auth = parameters.auth;
        this.run  = this.run(parameters);

        this.setBasicHeaders(this.options);
        this.platformLimitations();
    }
    
    run(parameters)
    {
        return async () =>
        {
            let resp = await this.tryConnect(this.setBasicHeaders(parameters));

            this.logger.append(new CoreEvent('Info', 'Authorization', `Successful authorization!`));
            
            return resp;
        }
    } 

    setBasicHeaders(parameters)
    {
        parameters['headers'] = parameters['headers'] || {};

        parameters['headers']['Accept']       = 'application/json';
        parameters['headers']["Content-Type"] = "application/json";

        return parameters;
    }

    platformLimitations()
    {
        if (process.platform !== 'win32' && process.platform !== 'win64')
        {
            this.importUserFromAD = undefined;
        }
    }

    async tryConnect(parameters)
    {

        if (this.auth.type === 'session') return await this.createSession(parameters);
        if (this.auth.type === 'basic')   return await this.generateBasicAuth(parameters);

        this.onError(1, 0, this.auth.type);
    }

    /**
     * Search in jira.
     * @param {String} [_jql = ""]  - JQL querty.
     * @param {Number} [_startAt = 0]    - Result start item.
     * @param {Number} [_maxResults = 50] - Max result items.
     * @param {Boolean} [connectTest = false] - Special attribute should use for test connection.
     * @returns {_Response}
     */
    async search(_jql = "", _startAt = 0, _maxResults = 50, connectTest = false)
    {
        let options =
            {
                path: "rest/api/2/search",
                data: {
                    jql: _jql,
                    startAt: _startAt,
                    maxResults: _maxResults
                }
            },
            resp = await this._request(options, "post", connectTest);

        return resp;
    }

    /**
     * Get Isue by ID.
     * @param {String} isueID - Isue Id in Jira.
     * @returns {_Response}
     */
    async getIssue(issueID)
    {
        let options =
            {
                path: '/rest/api/2/issue/?id=' + issueID
            },
            resp = await this._request(options, "get", false);

        return resp;
    }

    async importUserFromAD(userName)
    {
        let userData = ADGateway.searchUser(userName, ADProtocol);

        if (userData.name) 
        {
            return await this.createUser(userData);
        } else {
            this.logger.append('Info', 'User not imported from AD', `User:'${userName}' not found.`);
        }
    }

    /**
     * Create new User.
     * @param {Object} userData - Object with user attributes(read Jira doc).
     * @returns {_Response}
     */
    async createUser(userData)
    {
        let options = {};

        options['path'] = '/rest/api/2/user';
        options['data'] = userData;

        if (!userData['name'] || !userData['emailAddress'])
        {
            this.logger.append('Waring', 'User not created', `name and emailAddress is require parameters.`);
        } else {
            let resp = await this._request(options, "post", false);

            if (resp)
            {
                this.logger.append('Info', 'User created', `\nUser:\n\t'${userData.name}`);

                return true;
            }
        }
    }

    /**
     * Delete user by userName.
     * @param {String} userName - username in jira.
     * @returns {_Response}
     */
    async deleteUser(userName)
    {
        let options =
        {
            path: "/rest/api/2/user/?" + querystring.stringify({username: userName}),
        };

        let resp = await this._request(options, "DELETE", false);

        if (resp)
        {
            this.logger.append(new CoreEvent('Info', 'User removed', `\nUser:\n\t'${userName}'`));

            return resp;
        }
    }

    /**
     * Get user by userName.
     * @param {String} userName - username in jira.
     * @returns {_Response}
     */
    async getUser(userName)
    {
        let options =
            {
                path: `/rest/api/2/user/?` + querystring.stringify({username: userName}),
            },
            resp = await this._request(options, "get");
            
        return resp;
    }

    /**
     * Get all project roles.
     * @param {(String | Number)} projectKey - project key or id in jira.
     * @returns {_Response}
     */
    async getProjectRoles(projectKey)
    {
        let options =
            {
                path: `/rest/api/2/project/${querystring.escape(projectKey)}/role`
            },
            resp = await this._request(options, "GET");
        
        return resp;
    }

    /**
     * Get system id for project role.
     * @param {(String | Number)} roleKey - role key in jira.
     * @param {(String | Number)} projectKey - project key or id in jira.
     * @returns {Number} id - id of role
     */
    async getRoleId(roleKey, projectKey) 
    {
        let projectRoles = await this.getProjectRoles(projectKey);
        
        if (projectRoles)
        {
            let id = projectRoles.data[roleKey] ? projectRoles.data[roleKey].match(/[0-9]+(?!\/)$/g)[0]:0;

            if (1 > id.length) 
            {
               this.logger.append('Warning', 'Role id not found', new CoreEvent(`Role: '${roleKey}' not found in Project: '${projectKey}'.`));
            } else { return id; }
            
        } else {
            this.logger.append('Warning', 'Project not found', new CoreEvent(`Project: '${projectKey}' not found.`));
        }
    }

    /**
     * Add user or users in Project Role.
     * @param {(Array.<String> | String)} userNameOrArrayWithNames - Array or String with username(or names for Array).
     * @param {String} projectKey - project key or id in jira.
     * @returns {_Response}
     */
    async addUserInProject(userNameOrArrayWithNames, projectKey, rolename) 
    {
        let roleID = await this.getRoleId(rolename, projectKey);

        if (roleID)
        {
            let options = 
                {
                    path: `/rest/api/2/project/${querystring.escape(projectKey)}/role/${querystring.escape(roleID)}`,
                    data: 
                    {
                        "user": (typeof userNameOrArrayWithNames === 'string') ? [userNameOrArrayWithNames] : userNameOrArrayWithNames,
                    }
                },
                resp = await this._request(options, "POST", false);

            if (resp)
            {
                this.logger.append(new CoreEvent('Info', 'User pushed in project', `\nUser:\n\t'${userNameOrArrayWithNames}'\nproject:\n\t'${projectKey}'\nRole:'${rolename}'`));
            
                return resp;
            }
        }
    }

    /**
     * Add user in system group.
     * @param {String} userName - username in jira.
     * @param {(String | Number)} groupName - group name or id in jira.
     * @returns {_Response}
     */
    async addUserInGroup(userName, groupName) 
    {
        let options = 
            {
                path: '/rest/api/2/group/user?' + querystring.stringify({groupname: groupName}),
                data: 
                {
                    "name": userName
                }
            },
            resp = await this._request(options, "post", false);

        if (resp)
        {
            this.logger.append(new CoreEvent('Info', 'User pushed in group', `\nUser:\n\t'${userName}'\nGroup:\n\t'${groupName}'`));
        
            return resp;
        }
    }

    /**
     * Remove user from group.
     * @param {String} userName - username in jira.
     * @param {String} groupName - group name or id in jira.
     * @returns {_Response}
     */
    async removeUserFromGroup(userName, groupName)
    {
        let options = 
            {
                "path": `/rest/api/2/group/user?${querystring.stringify({groupname: groupName, username: userName})}`
            },
            resp = await this._request(options, "DELETE", false);

        if (resp)
        {
            this.logger.append(new CoreEvent('Info', 'User removed from group', `\nUser:\n\t'${userName}'\nGroup:\n\t'${groupName}'`));
        
            return resp;
        }
    }

    handleResponse(response)
    {
        let fineState = [200, 201, 204];

        if (fineState.indexOf(response.status) === -1)
        {
            return this.logger.append(new CoreEvent('Warning', "Bad response", `\nResponse:\n\t'${JSON.stringify(response.errors)}';\nstatus:\n\t'${response.status}'.`));
        } else if (response.errors.errors || response.errors.errorMessages) {
            return this.logger.append(new CoreEvent('Warning',  "Response with errors", `Errors data: ${JSON.stringify(response.errors.errorMessages)}`));     
        }

        return response;
    }

    /**
     * Request universal method for Jira Rest Api.
     * @param {Options} options - request header, data and|or other parameters.
     * @param {String} [method="get"] - request method(POST, GET ...).
     * @param {(Function | Boolean)} [onError=false] - function will calling if server return error.
     * @returns {(_Response | Boolean)}
     */
    async _request(options, method="get")
    {
        let response = await this.request(options, method);

        return this.handleResponse(response);
    }

    /**
     * Create new Basic Auth headers.
     * @param {Object} parameters - request header, data and|or other parameters.
     * @returns {void}
     */
    async generateBasicAuth(parameters)
    {
        let basic = new BasicAuth(parameters, this.auth.data);

        this.options['headers']['Authorization'] = await basic.create();
    }

    /**
     * Create new Session Auth headers.
     * @param {Object} parameters - request header, data and|or other parameters.
     * @returns {void}
     */
    async createSession(parameters)
    {
        let session = new Session(parameters, this.auth.data);

        this.options['headers']['cookie'] = await session.create();
    }
}


module.exports =
{
    'JiraClient': JiraClient
}