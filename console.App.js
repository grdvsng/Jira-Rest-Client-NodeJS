/**
 * Console client for Jira
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 0.1.0
 */

/*
	new Test('_request',            [{path: "rest/api/2/search", data: {jql: "",startAt: 0, maxResults: 50}}]),
	new Test('search',              ["project = Test And resolution = Unresolved", 0, 50]),
	new Test('getIsue',             ['Test-1']),
	new Test('createUser',          [{"displayName":  "John Travolta", "name": "scientology666", "applicationKeys": []}]),
	new Test('getUser',             ["scientology666"]),
	new Test('getProjectRoles',     ["Test"]),
	new Test('getRoleId',           ["Administrator", "Test"]),
	new Test('addUserInProject',    ["scientology666", "Test", "Administrator"]),
	new Test('addUserInGroup',      ["scientology666", "jira-software-users"]),
	new Test('removeUserFromGroup', ["scientology666", "jira-software-users"]),
	new Test('generateBasicAuth',   ["project = Test And resolution = Unresolved", 0, 50]),
	new Test('createSession',       ["project = Test And resolution = Unresolved", 0, 50]),
	new Test('deleteUser',          ["scientology666"])
*/

