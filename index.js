const alfy = require('alfy');

const { input } = alfy;
const config = {
  org: process.env.JIRA_ORG,
  baseUrl: `https://${process.env.JIRA_ORG}.atlassian.net/rest/api/3/search`,
  token: process.env.JIRA_ACCESS_TOKEN,
  username: process.env.JIRA_USERNAME,
};

let query;

if (!input || input.length < 3) {
  query = `
		assignee = currentUser()
		AND resolution = Unresolved
		ORDER BY updated DESC
	`;
} else if (input.trim().match(/^[a-zA-Z]+-[0-9]+$/)) {
  const key = input.trim();
  query = `
			issue = '${key}'
			OR issue = '${key}0'
			OR issue = '${key}1'
			OR issue = '${key}2'
			OR issue = '${key}3'
			OR issue = '${key}4'
			OR issue = '${key}5'
			OR issue = '${key}6'
			OR issue = '${key}7'
			OR issue = '${key}8'
			OR issue = '${key}9'
			ORDER BY updated DESC
		`;
} else {
  query = `
			text ~ '${input}' ORDER BY updated DESC
		`;
}

query = query.trim();

alfy
  .fetch(`${config.baseUrl}?jql=${query}&maxResults=10`, {
    auth: `${config.username}:${config.token}`,
    maxAge: process.env.MAX_AGE || 3600,
  })
  .then(response => {
    if (!response.issues || response.issues.length <= 0) {
      return alfy.output([
        {
          title: `Aucun résultat pour "${input}"...`,
          subtitle: '→ Ouvrir la recherche sur JIRA',
          arg: `https://${config.org}.atlassian.net/issues/?jql=${query}`,
        },
      ]);
    }

    const items = response.issues.map(({ id, key, fields }) => ({
      uid: id,
      title: `${key} – ${fields.summary}`,
      subtitle: `→ ${fields.status.name} par ${
        (fields.assignee || { displayName: 'personne' }).displayName
      }`,
      arg: `https://${config.org}.atlassian.net/browse/${key}`,
      quicklookurl: `https://${config.org}.atlassian.net/browse/${key}`,
      icon: { type: 'png', path: `static/${fields.issuetype.avatarId}.png` },
    }));

    return alfy.output(items);
  });

// TODO
// - filter list of actions for a ticket
//   * open ticket
//   * open parent epic
//   * open parent version
//   * change status
//   * log time
// - when activating an epic, display a list of its story
// - allow search by version
// - allow search by project
