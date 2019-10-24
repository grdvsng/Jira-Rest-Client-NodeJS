/**
 * Tests
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 */


/**
 * Test interface.
 */
class Test
{
	/**
     * Create new client.
     * @param {String} method - name of method.
     * @param {Array.<Object>} params - method arguments.
     * @param {String} except - Exception name if test catch Error.
     * @returns {void}
     */
	constructor(method, params, except)
	{
		this.method = method;
		this.params = params;
		this.except = except;
	}
}


/**
 * Class for Testing.
 */
class UnitTester
{
	/**
     * Create new client.
     * @param {Object} basicClass - clas will testing.
     * @returns {void}
     */
	constructor(basicClass)
	{
		try
		{
			this.testClass = new basicClass(...Array.from(arguments).slice(1,));
		} catch (e) {
			console.warn(`Can't create exemplar of ${basicClass.className}.\nError: `);
			throw e;
		}
	}

	/**
     * Check is error in user exception.
     * @param {Error} error - founded error.
	 * @param {String} except - Exception name.
     * @returns {string}
     */
	errorParser(error, except=undefined)
	{
		let msg = '',
			err = (error.__proto__.name) ? error.__proto__.name:error.prototype.name;

		if ((err === except) && err !== undefined)
		{
			return msg + `${except}`;
		} else {
			throw error;
		}
	}

	/**
     * Create new client.
     * @param {Test} test - test to run.
     * @returns {string}
     */
	async runTest(test)
	{
		console.warn(`\nMethod: ${test.method}.`);

		try
		{
			await this.testClass[test.method](...test.params);
			console.warn('\nError: not found.');
		} catch (e) {
			console.warn(`\nError: \n\t${this.errorParser(e, test.except)}.`);
		}

		return new Promise((resolve)=> resolve(true));
	}

	/**
     * Create new client.
     * @param {Array.<Test>} test - tests to run.
     * @returns {void}
     */
	async runTests(tests)
	{
		for (let n=0; n < tests.length; n++)
		{
			let test = await tests[n];

			console.log(`\nTest: ${n+1}.`);
			await this.runTest(test);
		}
	}
}

let params =
{
	"log":      "./test.log",
	"host":     "127.0.0.1",
	"port":     "8080",
	"protocol": "http",

	"headers":
	{
		"Content-Type": "application/json"
	},
};

let auth =
{
	type: 'basic',
	data:
	{
		username: 'admin',
		password: 'c1v2b3n4'
	}
};

let tests =
[
	new Test('_request',            [{path: "rest/api/2/search", data: {jql: "",startAt: 0, maxResults: 50}}]),
	new Test('search',              ["project = Test And resolution = Unresolved", 0, 50]),
	new Test('getIssue',            ['Test-1']),
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
];


let TESTER = new UnitTester(require('../bin/JiraClient')['JiraClient'], params, auth);
TESTER.runTests(tests);