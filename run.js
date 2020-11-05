const fs = require('fs');
const readline = require('readline');
const FormData = require('form-data');
const { google } = require('googleapis');
const { createIssue } = require('./createIssue');
const { createAttachment } = require('./createAttachment');
const { urlString } = require('./constants');
const SCOPES = [ 'https://www.googleapis.com/auth/gmail.readonly' ];
const TOKEN_PATH = 'token.json';
const tok = 'kyr.tasks@gmail.com' + ':' + 'wedlRbYv7Gov48u310c30E1A';
const hash = Buffer.from(tok).toString('base64');
const Basic = 'Basic ' + hash;

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  
  setInterval(() => {
    authorize(JSON.parse(content), getRecentEmail);
  }, 3000)



});

function authorize(credentials, callback) {
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	});
}

function getNewToken(oAuth2Client, callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	console.log('Authorize this app by visiting this url:', authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question('Enter the code from that page here: ', (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error('Error retrieving access token', err);
			oAuth2Client.setCredentials(token);
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log('Token stored to', TOKEN_PATH);
			});
			callback(oAuth2Client);
		});
	});
}

function getRecentEmail(auth) {
	const gmail = google.gmail({
		version: 'v1',
		auth
	});
	gmail.users.messages.list(
		{
			auth: auth,
			userId: 'me',
			q: 'is:unread'
		},
		async function(err, response) {
			if (err) {
				console.log('The API returned an error: ' + err);
				return;
			}
			for (let i = 0; response.data.messages && i < response.data.messages.length; i++) {
				let message_id = response['data']['messages'][i]['id'];

				await gmail.users.messages.get(
					{
						auth: auth,
						userId: 'me',
						id: message_id
					},
					async function(err, response) {
						if (err) {
							console.log('The API returned an error: ' + err);
							return;
						}
						const emailInternalDate = response.data.internalDate;
						const lastFeedDate = fs.readFileSync('temp.txt', 'utf8');
						if (emailInternalDate <= lastFeedDate) {
							return;
						}
						fs.writeFile('temp.txt', emailInternalDate, (err) => {});
						const headers = response['data']['payload']['headers'];
						const subject = headers.filter((item) => {
							if (item.name === 'Subject') {
								return item.value;
							}
						});
						let result = await createIssue(
							urlString,
							subject[0].value,
							response['data'].snippet
						);
						if (JSON.parse(result).key) {
							const jira_issue_id = JSON.parse(result).key;
							console.log('Jira ticket created and the id is ', jira_issue_id);
							let formData = new FormData();
							let stream = fs.createReadStream('sample.txt', 'utf8');
							formData.append('file', stream);
							let formHeaders = formData.getHeaders();
							await createAttachment(
								Basic,
								urlString + jira_issue_id + '/attachments',
								formData,
								formHeaders
							);
							console.log('Sample attachment added');
						}
					}
				);
			}
		}
	);
}
