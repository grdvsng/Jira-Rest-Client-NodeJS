/*
	Application
*/

const btoa = (data) => {return Buffer.from(data).toString('base64')},
      atob = (data) =>{return Buffer.from(data, 'ascii').toString('utf8')};

const JiraClient = require('./bin/JiraClient')['JiraClient'];