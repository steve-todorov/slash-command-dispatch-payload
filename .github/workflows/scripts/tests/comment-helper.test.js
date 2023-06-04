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
const helper = require('../src/authority-helper');

if(process.env.GITHUB_TOKEN === undefined || process.env.GITHUB_TOKEN === "") {
    throw Error("Missing process.env.GITHUB_TOKEN!")
}

describe('Comment Helper', () => {

})
