const path = require("path");

/**
 * Fetches all changed paths using pagination (up to the limit of 3000 results).
 * Will intelligently stop looping when pagination returns no records to save api calls.
 *
 * @param github Passed from workflow (github)
 * @param context Passed from workflow (context)
 * @returns {Promise<string[]>} An array containing all changed file paths.
 */
exports.getFiles = (github, context) => {
    return new Promise(async (resolve, error) => {
        try {
            let changedFiles = []

            for (let page = 1; page < 31; page++) {
                // https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests-files
                const response = await github.rest.pulls.listFiles({
                                                                       owner: context.repo.owner,
                                                                       repo: context.repo.repo,
                                                                       pull_number: context.issue.number,
                                                                       per_page: 100,
                                                                       page: page
                                                                   });

                if (response.status !== 200) {
                    console.error(response);
                    error(response);
                    return;
                }

                if (response.data.length <= 0) {
                    break;
                }

                changedFiles = [...changedFiles, ...response.data.map(meta => meta.filename)];
            }

            context.debug(`Changed files: `, changedFiles);

            resolve(changedFiles)
        } catch (e) {
            error(e)
        }
    });
}

/**
 * @param files string[]
 * @param basePath string
 * @param minDepth Between 0 and infinity
 * @param maxDepth Greater or equal to minDepth.
 * @returns {string[]}
 */
exports.changedDirs = (files, basePath, minDepth, maxDepth) => {
    if (minDepth === undefined || minDepth < 0) {
        minDepth = 0;
    }
    if (maxDepth === undefined) {
        maxDepth = 99999;
    } else if (maxDepth < minDepth) {
        maxDepth = minDepth + 1;
    }
    if (basePath === "./") {
        basePath = "";
    }

    let filtered = [...files].filter(f => f.startsWith(basePath))
                             .map(f => f.replace(basePath, ""))
                             .map(f => path.dirname(f))
                             .map(f => f.split("/").filter(s => s !== "").slice(minDepth, maxDepth).join("/"))
                             .filter(f => f.split("/").length > minDepth + 1);

    return [...new Set(filtered)]; // return only unique strings.
}


async function getPRHead(github, owner, repo, pull_number) {
    return new Promise(async (resolve, error) => {
        try {
            const response = await github.rest.pulls.get({owner: owner, repo: repo, pull_number: pull_number});
            if (!response || response.status !== 200) {
                error(response);
            }
            resolve(response.data.head);
        } catch (e) {
            error(e)
        }
    });
}

/**
 * Returns PR head information
 * @param github
 * @param owner
 * @param repo
 * @param pull_number
 * @returns {Promise<{label: string, ref: string, sha: string, user: Object, repo?: Object|null}>}
 */
exports.head = (github, owner, repo, pull_number) => getPRHead(github, owner, repo, pull_number)

/**
 * Fetch the PR's SHA.
 *
 * @param github Passed from workflow (github)
 * @param owner context.repo.owner
 * @param repo context.repo.repo
 * @param pull_number context.issue.number
 * @param length? The SHA length to return (null/undefined/-1 equals full SHA)
 * @returns {Promise<string>}
 */
exports.sha = (github, owner, repo, pull_number, length) => {
    return new Promise(async (resolve, error) => {
        try {
            const response = await getPRHead(github, owner, repo, pull_number);
            if (!response) {
                error(response);
            }
            if (length === undefined || length < 1) {
                length = 9999999;
            }
            resolve(response.sha.substring(0, length));
        } catch (e) {
            error(e)
        }
    });
}

/**
 * Fetches the PR's state and if it's mergable (i.e. no conflicts)
 *
 * @param github
 * @param context
 * @returns {Promise<boolean>}
 */
exports.isMergableState = (github, context) => {
    return new Promise(async (resolve, error) => {
        try {
            const response = await github.rest.pulls.get({
                                                             owner: context.repo.owner,
                                                             repo: context.repo.repo,
                                                             pull_number: context.issue.number,
                                                         });

            if (!response || response.status !== 200) {
                error(response);
                return false;
            }

            resolve(response.data.mergeable_state !== "clean");
        } catch (e) {
            error(e)
        }
    })
}