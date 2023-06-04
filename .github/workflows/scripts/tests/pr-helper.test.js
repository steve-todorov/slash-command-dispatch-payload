const {Octokit} = require("@octokit/core")
const {restEndpointMethods} = require("@octokit/plugin-rest-endpoint-methods");
const {paginateRest} = require("@octokit/plugin-paginate-rest");
const {retry} = require("@octokit/plugin-retry");
const {throttling} = require("@octokit/plugin-throttling");
const {requestLog} = require("@octokit/plugin-request-log");

const OctokitSetup = Octokit.plugin(restEndpointMethods, paginateRest, retry, throttling, requestLog);

const github = new OctokitSetup({
    auth: process.env.GITHUB_TOKEN,
    log: require("console-log-level")({ level: "debug" }),
    throttle: {
        onRateLimit: (retryAfter, options) => {
            github.log.warn(
                `Request quota exhausted for request ${options.method} ${options.url}`
            );

            if (options.request.retryCount === 0) {
                // only retries once
                github.log.info(`Retrying after ${retryAfter} seconds!`);
                return true;
            }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
            // does not retry, only logs a warning
            octokit.log.warn(
                `Secondary quota detected for request ${options.method} ${options.url}`
            );
        },
    },
    retry: {
        doNotRetry: ["429"],
    }
});
const helper = require('../src/pr-helper');

if (process.env.GITHUB_TOKEN === undefined || process.env.GITHUB_TOKEN === "") {
    throw Error("Missing process.env.GITHUB_TOKEN!")
}

describe('PR Helper', () => {
    test('Should return long SHA for PR', async () => {
        const sha = await helper.sha(github, "strongbox", "strongbox", 1567);
        expect(sha).toEqual("fdaf1e31ed964110fe70f59745ac0bd644398acb");
    })
    test('Should return short SHA for PR', async () => {
        const sha = await helper.sha(github, "strongbox", "strongbox", 1567, 7);
        expect(sha).toEqual("fdaf1e3");
    })
    test('Should return PR head information', async () => {
        const head = await helper.head(github, "strongbox", "strongbox", 1567);
        expect(head).toEqual({
                                 "label": "mans4321:issue-1401",
                                 "ref": "issue-1401",
                                 "sha": "fdaf1e31ed964110fe70f59745ac0bd644398acb",
                                 "user": {
                                     "login": "mans4321",
                                     "id": 16712582,
                                     "node_id": "MDQ6VXNlcjE2NzEyNTgy",
                                     "avatar_url": "https://avatars.githubusercontent.com/u/16712582?v=4",
                                     "gravatar_id": "",
                                     "url": "https://api.github.com/users/mans4321",
                                     "html_url": "https://github.com/mans4321",
                                     "followers_url": "https://api.github.com/users/mans4321/followers",
                                     "following_url": "https://api.github.com/users/mans4321/following{/other_user}",
                                     "gists_url": "https://api.github.com/users/mans4321/gists{/gist_id}",
                                     "starred_url": "https://api.github.com/users/mans4321/starred{/owner}{/repo}",
                                     "subscriptions_url": "https://api.github.com/users/mans4321/subscriptions",
                                     "organizations_url": "https://api.github.com/users/mans4321/orgs",
                                     "repos_url": "https://api.github.com/users/mans4321/repos",
                                     "events_url": "https://api.github.com/users/mans4321/events{/privacy}",
                                     "received_events_url": "https://api.github.com/users/mans4321/received_events",
                                     "type": "User",
                                     "site_admin": false
                                 },
                                 "repo": null
                             });
    })
    test('Should get PR files', async () => {
        const files = await helper.getFiles(github, {
            repo: {owner: "strongbox", repo: "strongbox"},
            issue: {number: 1567},
            debug: console.debug
        });
        expect(files).toBeTruthy();
        expect(files.length).toBeGreaterThan(0);
    })
    test('Should convert files into matrix', async () => {
        const tree = helper.changedDirs([
                                            "infra/cs-d/base/main.tf",
                                            "infra/cs-d/ecr/main.tf",
                                            "infra/cs-p/route53/main.tf",
                                            'strongbox-commons/pom.xml',
                                            'strongbox-commons/src/main/java/org/carlspring/strongbox/net/MediaType.java',
                                            'strongbox-commons/src/main/resources/application.yaml',
                                            'strongbox-configuration/pom.xml',
                                            'strongbox-distribution/pom.xml',
                                            'strongbox-resources/strongbox-common-resources/src/main/resources/logback-spring.xml',
                                            'strongbox-security/strongbox-security-api/pom.xml',
                                            'strongbox-security/strongbox-user-management/src/main/java/org/carlspring/strongbox/users/domain/Privileges.java',
                                            'strongbox-security/strongbox-user-management/src/main/resources/etc/conf/strongbox-authorization.yaml',
                                            'strongbox-testing/strongbox-testing-web/src/test/java/org/carlspring/strongbox/rest/common/RestAssuredBaseTest.java',
                                            'strongbox-web-core/pom.xml',
                                            'strongbox-web-core/src/main/java/org/carlspring/strongbox/config/WebConfig.java',
                                            'strongbox-web-core/src/main/java/org/carlspring/strongbox/controllers/LoggingManagementController.java',
                                            'strongbox-web-core/src/main/java/org/carlspring/strongbox/controllers/configuration/StoragesConfigurationController.java',
                                            'strongbox-web-core/src/main/java/org/carlspring/strongbox/controllers/logging/LoggingConfiguration.java',
                                            'strongbox-web-core/src/main/java/org/carlspring/strongbox/controllers/logging/LoggingManagementController.java',
                                            'strongbox-web-core/src/main/java/org/carlspring/strongbox/controllers/logging/SseEmitterAwareTailerListenerAdapter.java',
                                            'strongbox-web-core/src/main/java/org/carlspring/strongbox/forms/PathForm.java',
                                            'strongbox-web-core/src/main/resources/views/directoryListing.twig.html',
                                            'strongbox-web-core/src/test/java/org/carlspring/strongbox/config/IntegrationTest.java',
                                            'strongbox-web-core/src/test/java/org/carlspring/strongbox/controllers/ActuatorEndpointControllerTest.java',
                                            'strongbox-web-core/src/test/java/org/carlspring/strongbox/controllers/JwtAuthenticationTest.java',
                                            'strongbox-web-core/src/test/java/org/carlspring/strongbox/controllers/LoggingManagementControllerTestIT.java',
                                            'strongbox-web-core/src/test/java/org/carlspring/strongbox/controllers/configuration/StoragesConfigurationControllerTestIT.java',
                                            'strongbox-web-core/src/test/java/org/carlspring/strongbox/controllers/logging/LoggingManagementControllerTest.java',
                                            'strongbox-web-core/src/test/java/org/carlspring/strongbox/controllers/users/PasswordEncoderControllerTest.java',
                                            'strongbox-web-core/src/test/resources/application-test.yaml'
                                        ], "infra", 0, 2);
        console.log(tree);
        expect(tree).toBeTruthy();
        expect(tree).toEqual(["cs-d/base", "cs-d/ecr", "cs-p/route53"])
    })
    test('Should return clean mergable state', async () => {
        const isMergable = await helper.isMergableState(github, {
            repo: {owner: "strongbox", repo: "strongbox"},
            issue: {number: 1567}
        });
        expect(isMergable).toEqual(true);
    })
});