const axios = require('axios');
async function postSlack(urlString, formData) {
	let res = await axios.post(urlString, formData, {
		headers: {
			Accept: 'application/json',
		}
	});

	return res;
}
module.exports.doPostSlack = postSlack;
