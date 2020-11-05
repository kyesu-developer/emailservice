const fetch = require('node-fetch');
const { project_id, issue_id } = require('./constants');

function createIssue(urlString, summary, description) {
	const bodyData = `{
    "update": {},
    "fields": {
      "summary": ${JSON.stringify(summary)},
      "issuetype": {
        "id": ${JSON.stringify(issue_id)}
      },
      "project": {
        "id": ${JSON.stringify(project_id)}
      },
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "text": ${JSON.stringify(description)},
                "type": "text"
              }
            ]
          }
        ]
      },
      "duedate": "2019-05-11",
      "assignee": {}
    }
  }`;

	return fetch(urlString, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${Buffer.from('kyr.tasks@gmail.com:wedlRbYv7Gov48u310c30E1A').toString('base64')}`,
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: bodyData
	}).then((response) => {
		return response.text();
	});
}
module.exports.createIssue = createIssue;
