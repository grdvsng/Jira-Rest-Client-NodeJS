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
		this.testClass = new basicClass(...Array.from(arguments).slice(1,));
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

let tests =
[
	new Test('_request',            [{path: "rest/api/2/search", data: {jql: "",startAt: 0, maxResults: 50}}]),
	new Test('search',              ["project = TEST And resolution = Unresolved", 0, 50]),
	new Test('getIssue',            ['TEST-1']),
	new Test('createUser',          [{"displayName":  "John Travolta", "name": "scientology666", "emailAddress": "travolta@gmail.com"}]),
	new Test('getUser',             ["scientology666"]),
	new Test('getProjectRoles',     ["TEST"]),
	new Test('getRoleId',           ["Administrator", "TEST"]),
	new Test('addUserInProject',    ["scientology666", "TEST", "Administrator"]),
	new Test('addUserInGroup',      ["scientology666", "homo_erectus"]),
	new Test('removeUserFromGroup', ["scientology666", "homo_erectus"]),
	new Test('deleteUser',          ["scientology666"])
];


let cfg    = require('../config.json')[0]
cfg.log    = undefined;
let TESTER = new UnitTester(require("../bin/JiraClient")["JiraClient"], require('../config.json')[0]);

TESTER.runTests(tests);