import { AnalysisService } from "./services/analysis.service";
import { GithubService } from "./services/github.service";
import { getBufferFromUrl } from "./utils/buffer";

const username = "select_name"; //enter github user

const main = async () => {
  await (
    await GithubService.getUserRepos(username)
  ).forEach(async (repo) => {
    const assets = await GithubService.getRepoLatestReleaseAttachments(
      username,
      repo.name
    );

    assets
      .filter((asset) => asset.endsWith(".exe"))
      .forEach(async (asset) => {
        const buffer = await getBufferFromUrl(asset);

        const resp = await AnalysisService.checkFile(buffer);

        console.log(resp);
      });
  });
};

main();
