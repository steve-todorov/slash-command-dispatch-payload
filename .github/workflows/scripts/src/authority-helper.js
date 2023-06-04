/**
 * Returns the collaborator's permissions. For private repositories you need to use a PAT that
 * @param github
 * @param context
 * @param core
 * @param user
 * @returns {Promise<admin|write|read|none>}
 */
exports.getPermission = (github, context, core, user) => {
    return new Promise(async(resolve, error) => {
        const owner = context.repo.owner;
        const repo = context.repo.repo;
        const response = await github.rest.repos.getCollaboratorPermissionLevel({ owner: owner, repo: repo, username: user });
        if(!response || response.status !== 200) {
            error(response);
            return;
        }
        core.debug(`Permission for user ${user} is ${response.data.permission}`);
        resolve(response.data.permission);
    })
}

/**
 * @param allowed string[] - any match
 * @param permission string
 * @returns boolean
 */
exports.isGranted = (allowed, permission) => {
    return allowed.includes(permission);
}

/**
 *
 * @param allowed string[] - any match
 * @param permission string
 * @param issue_or_pr_number issue or pull_request number to comment in.
 *
 * @returns boolean
 */
exports.isGrantedWithComment = (allowed, permission, issue_or_pr_number) => {

}