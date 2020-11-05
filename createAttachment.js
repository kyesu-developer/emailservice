const axios = require('axios');
async function execute(Basic, urlString, formData, formHeaders) {
	let res = await axios.post(urlString, formData, {
		headers: {
			Accept: 'application/json',
			Authorization: Basic,
			'X-Atlassian-Token': 'nocheck',
			...formHeaders
		}
	});

	return res;
}
module.exports.createAttachment = execute;
