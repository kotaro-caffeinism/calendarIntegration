
require('dotenv').config()

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const sheetName = new Date().getFullYear();

((async () => {
  
  // カレンダー DB シートからデータ取得

  const calendarData = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SS_ID}/values/${sheetName}?key=${process.env.SS_API_KEY}`)
    .then(res => res.json())
    .then(data => data.values)
    .then(data => data.filter((arr, i) => i !== 0 && arr.length !== 1));
        
  // Notion への書き込み

  calendarData.forEach(async data => {
    
    if(data[0] === "TRUE") return;

    const year = data[1].replace(/\//g, '-')

    // GCal への追加 - WIP

    const fs = require('fs').promises;
    const path = require('path');
    const process = require('process');
    const {authenticate} = require('@google-cloud/local-auth');
    const {google} = require('googleapis');

    // const SCOPES = 'https://www.googleapis.com/auth/calendar'
    // const GOOGLE_PRIVATE_KEY = require('./service-account-key.json').private_key
    // const GOOGLE_CLIENT_EMAIL = require('./service-account-key.json').client_email

    // const jwtClient = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, null, GOOGLE_PRIVATE_KEY, SCOPES)

    // If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const TOKEN_PATH = path.join(process.cwd(), 'token.json');
    const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

    // const calendar = google.calendar({
    //   version: 'v3',
    //   project: process.env.GOOGLE_PROJECT_NUMBER,
    //   auth: jwtClient,
    // })

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
// async function listEvents(auth) {
//   const calendar = google.calendar({version: 'v3', auth});
//   const res = await calendar.events.list({
//     calendarId: 'primary',
//     timeMin: new Date().toISOString(),
//     maxResults: 10,
//     singleEvents: true,
//     orderBy: 'startTime',
//   });
//   const events = res.data.items;
//   if (!events || events.length === 0) {
//     console.log('No upcoming events found.');
//     return;
//   }
//   console.log('Upcoming 10 events:');
//   events.map((event, i) => {
//     const start = event.start.dateTime || event.start.date;
//     console.log(`${start} - ${event.summary}`);
//   });
// }

// authorize().then(listEvents).catch(console.error);

  const event = {
    'summary': 'Google I/O 2015',
    'location': '800 Howard St., San Francisco, CA 94103',
    'description': 'A chance to hear more about Google\'s developer products.',
    'start': {
      'dateTime': '2023-01-7T09:00:00-07:00',
      'timeZone': 'Asia/Tokyo',
    },
    'end': {
      'dateTime': '2023-01-7T17:00:00-07:00',
      'timeZone': 'Asia/Tokyo',
    },
    'recurrence': [
      'RRULE:FREQ=DAILY;COUNT=2'
    ],
    // 'attendees': [
    //   {'email': 'lpage@example.com'},
    //   {'email': 'sbrin@example.com'},
    // ],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10},
      ],
    },
  };
  
  
  function insertEvent(auth) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: event,
    }, 
    function(err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        return;
      }
      console.log('Event created: %s', event.htmlLink);
    });
  }

  authorize().then(insertEvent).catch(console.error);

    // Not Started - DB のチェックボックスにチェック

  })
}))();
